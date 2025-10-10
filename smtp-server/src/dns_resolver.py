import asyncio
import logging
from typing import List, Tuple, Optional, Dict
import dns.asyncresolver
import dns.resolver
import dns.exception
from dataclasses import dataclass
import spf
import re

logger = logging.getLogger(__name__)


@dataclass
class MXRecord:
    priority: int
    hostname: str
    ips: List[str]


@dataclass
class SPFResult:
    result: str  # pass, fail, softfail, neutral, none, permerror, temperror
    explanation: str
    
    
@dataclass
class DMARCPolicy:
    policy: str  # none, quarantine, reject
    subdomain_policy: Optional[str]
    rua: Optional[str]  # Aggregate report URI
    ruf: Optional[str]  # Forensic report URI
    pct: int = 100  # Percentage of messages to apply policy to


class DNSResolver:
    """DNS resolver for email-related lookups"""
    
    def __init__(self):
        self.resolver = dns.asyncresolver.Resolver()
        self.resolver.timeout = 5.0
        self.resolver.lifetime = 10.0
        self._cache = {}
        
    async def get_mx_records(self, domain: str) -> List[MXRecord]:
        """Get MX records for a domain, sorted by priority"""
        cache_key = f"mx:{domain}"
        
        # Check cache
        if cache_key in self._cache:
            return self._cache[cache_key]
            
        try:
            # Query MX records
            mx_records = await self.resolver.resolve(domain, 'MX')
            
            results = []
            for mx in sorted(mx_records, key=lambda x: x.preference):
                # Get A records for each MX host
                mx_hostname = str(mx.exchange).rstrip('.')
                ips = await self._get_a_records(mx_hostname)
                
                if ips:
                    results.append(MXRecord(
                        priority=mx.preference,
                        hostname=mx_hostname,
                        ips=ips
                    ))
                    
            # Cache results
            self._cache[cache_key] = results
            
            return results
            
        except dns.exception.DNSException as e:
            logger.error(f"Failed to resolve MX records for {domain}: {e}")
            
            # Fall back to A record lookup
            ips = await self._get_a_records(domain)
            if ips:
                return [MXRecord(priority=10, hostname=domain, ips=ips)]
                
            return []
            
    async def _get_a_records(self, hostname: str) -> List[str]:
        """Get A records (IP addresses) for a hostname"""
        ips = []
        
        try:
            # Try IPv4
            a_records = await self.resolver.resolve(hostname, 'A')
            ips.extend([str(rr) for rr in a_records])
        except:
            pass
            
        try:
            # Try IPv6
            aaaa_records = await self.resolver.resolve(hostname, 'AAAA')
            ips.extend([str(rr) for rr in aaaa_records])
        except:
            pass
            
        return ips
        
    async def check_spf(self, ip: str, sender: str, helo: str) -> SPFResult:
        """Check SPF record for sender"""
        try:
            # Extract domain from sender
            if '@' in sender:
                domain = sender.split('@')[1]
            else:
                domain = sender
                
            # Get SPF record
            spf_record = await self._get_txt_record(domain, 'v=spf1')
            
            if not spf_record:
                return SPFResult('none', 'No SPF record found')
                
            # Check SPF using pyspf
            result, explanation = spf.check2(
                i=ip,
                s=sender,
                h=helo,
                timeout=10
            )
            
            return SPFResult(result, explanation)
            
        except Exception as e:
            logger.error(f"SPF check failed: {e}")
            return SPFResult('temperror', str(e))
            
    async def _get_txt_record(self, domain: str, prefix: str = None) -> Optional[str]:
        """Get TXT record for domain"""
        try:
            txt_records = await self.resolver.resolve(domain, 'TXT')
            
            for record in txt_records:
                txt_data = ''.join([s.decode('utf-8') for s in record.strings])
                
                if prefix and txt_data.startswith(prefix):
                    return txt_data
                elif not prefix:
                    return txt_data
                    
            return None
            
        except dns.exception.DNSException:
            return None
            
    async def get_dkim_public_key(self, selector: str, domain: str) -> Optional[str]:
        """Get DKIM public key from DNS"""
        dkim_domain = f"{selector}._domainkey.{domain}"
        
        try:
            txt_record = await self._get_txt_record(dkim_domain)
            
            if txt_record:
                # Extract public key from DKIM record
                match = re.search(r'p=([^;]+)', txt_record)
                if match:
                    return match.group(1)
                    
            return None
            
        except Exception as e:
            logger.error(f"Failed to get DKIM key for {dkim_domain}: {e}")
            return None
            
    async def check_dmarc(self, domain: str) -> Optional[DMARCPolicy]:
        """Check DMARC policy for domain"""
        # Try current domain first
        dmarc_record = await self._get_dmarc_record(domain)
        
        # If not found, try organizational domain
        if not dmarc_record and '.' in domain:
            parts = domain.split('.')
            org_domain = '.'.join(parts[-2:])
            dmarc_record = await self._get_dmarc_record(org_domain)
            
        if not dmarc_record:
            return None
            
        # Parse DMARC record
        policy = DMARCPolicy(policy='none')
        
        # Extract policy
        match = re.search(r'p=(\w+)', dmarc_record)
        if match:
            policy.policy = match.group(1)
            
        # Extract subdomain policy
        match = re.search(r'sp=(\w+)', dmarc_record)
        if match:
            policy.subdomain_policy = match.group(1)
            
        # Extract reporting URIs
        match = re.search(r'rua=([^;]+)', dmarc_record)
        if match:
            policy.rua = match.group(1)
            
        match = re.search(r'ruf=([^;]+)', dmarc_record)
        if match:
            policy.ruf = match.group(1)
            
        # Extract percentage
        match = re.search(r'pct=(\d+)', dmarc_record)
        if match:
            policy.pct = int(match.group(1))
            
        return policy
        
    async def _get_dmarc_record(self, domain: str) -> Optional[str]:
        """Get DMARC TXT record for domain"""
        dmarc_domain = f"_dmarc.{domain}"
        return await self._get_txt_record(dmarc_domain, 'v=DMARC1')
        
    async def check_reverse_dns(self, ip: str) -> Optional[str]:
        """Check reverse DNS (PTR record) for IP"""
        try:
            # Convert IP to reverse DNS format
            if ':' in ip:  # IPv6
                # Simplified IPv6 reverse DNS lookup
                return None
            else:  # IPv4
                parts = ip.split('.')
                reverse_ip = '.'.join(reversed(parts)) + '.in-addr.arpa'
                
            ptr_records = await self.resolver.resolve(reverse_ip, 'PTR')
            
            if ptr_records:
                return str(ptr_records[0]).rstrip('.')
                
            return None
            
        except dns.exception.DNSException:
            return None
            
    async def check_blacklists(self, ip: str, blacklist_servers: List[str]) -> Dict[str, bool]:
        """Check if IP is on blacklists"""
        results = {}
        
        # Only check IPv4 addresses
        if ':' in ip:
            return results
            
        parts = ip.split('.')
        reverse_ip = '.'.join(reversed(parts))
        
        for blacklist in blacklist_servers:
            query = f"{reverse_ip}.{blacklist}"
            
            try:
                await self.resolver.resolve(query, 'A')
                # If we get a result, IP is blacklisted
                results[blacklist] = True
                logger.warning(f"IP {ip} is blacklisted on {blacklist}")
                
            except dns.resolver.NXDOMAIN:
                # Not blacklisted
                results[blacklist] = False
                
            except Exception as e:
                logger.error(f"Error checking blacklist {blacklist}: {e}")
                results[blacklist] = None
                
        return results
        
    def clear_cache(self):
        """Clear DNS cache"""
        self._cache.clear()
        
    async def verify_sender_domain(self, sender_email: str) -> bool:
        """Verify that sender domain exists and has MX records"""
        if '@' not in sender_email:
            return False
            
        domain = sender_email.split('@')[1]
        
        # Check if domain has MX or A records
        mx_records = await self.get_mx_records(domain)
        
        return len(mx_records) > 0
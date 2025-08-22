import logging
from typing import Optional, Tuple
import dkim
from email import message_from_string
from email.message import EmailMessage
import os
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

logger = logging.getLogger(__name__)


class DKIMSigner:
    """Handle DKIM signing for outgoing emails"""
    
    def __init__(self):
        self._keys_cache = {}
        
    def generate_key_pair(self, key_size: int = 2048) -> Tuple[str, str]:
        """Generate a new DKIM key pair"""
        # Generate private key
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=key_size,
            backend=default_backend()
        )
        
        # Export private key
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')
        
        # Export public key
        public_key = private_key.public_key()
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')
        
        # Format public key for DNS TXT record
        public_key_dns = self._format_public_key_for_dns(public_pem)
        
        return private_pem, public_key_dns
        
    def _format_public_key_for_dns(self, public_pem: str) -> str:
        """Format public key for DNS TXT record"""
        # Remove PEM headers and newlines
        lines = public_pem.strip().split('\n')
        key_data = ''.join(lines[1:-1])
        
        # Create DNS TXT record format
        dns_record = f"v=DKIM1; k=rsa; p={key_data}"
        
        return dns_record
        
    async def sign_message(self, message_data: str, domain: str, 
                          selector: str, private_key: str) -> Optional[str]:
        """Sign a message with DKIM"""
        try:
            # Convert private key to bytes if needed
            if isinstance(private_key, str):
                private_key_bytes = private_key.encode('utf-8')
            else:
                private_key_bytes = private_key
                
            # Parse message
            msg = message_from_string(message_data)
            
            # Sign the message
            sig = dkim.sign(
                message_data.encode('utf-8'),
                selector.encode('utf-8'),
                domain.encode('utf-8'),
                private_key_bytes,
                include_headers=[
                    b'from', b'to', b'subject', b'date', 
                    b'message-id', b'content-type'
                ]
            )
            
            # Add DKIM signature to message
            dkim_header = sig.decode('utf-8').strip()
            
            # Insert DKIM-Signature at the beginning
            signed_message = dkim_header + '\r\n' + message_data
            
            return signed_message
            
        except Exception as e:
            logger.error(f"DKIM signing failed for {domain}: {e}")
            return None
            
    async def verify_signature(self, message_data: str) -> Tuple[bool, Optional[str]]:
        """Verify DKIM signature of a message"""
        try:
            # Verify DKIM signature
            result = dkim.verify(message_data.encode('utf-8'))
            
            if result:
                return True, "DKIM signature valid"
            else:
                return False, "DKIM signature invalid"
                
        except dkim.DKIMException as e:
            return False, f"DKIM verification failed: {str(e)}"
            
        except Exception as e:
            logger.error(f"DKIM verification error: {e}")
            return False, f"DKIM verification error: {str(e)}"
            
    def get_dkim_record_instructions(self, domain: str, selector: str, 
                                   public_key: str) -> str:
        """Get instructions for setting up DKIM DNS record"""
        instructions = f"""
DKIM Setup Instructions for {domain}:

1. Add the following TXT record to your DNS:
   Host: {selector}._domainkey.{domain}
   Type: TXT
   Value: {public_key}

2. The record may take up to 48 hours to propagate.

3. You can verify the record using:
   dig TXT {selector}._domainkey.{domain}

4. Once the DNS record is active, all outgoing emails will be signed with DKIM.
"""
        return instructions
        
    async def load_private_key(self, domain: str, key_path: Optional[str] = None) -> Optional[str]:
        """Load private key for a domain"""
        # Check cache first
        if domain in self._keys_cache:
            return self._keys_cache[domain]
            
        if not key_path:
            # Default path
            key_path = f"/etc/dkim/keys/{domain}/private.key"
            
        try:
            if os.path.exists(key_path):
                with open(key_path, 'r') as f:
                    private_key = f.read()
                    
                # Cache the key
                self._keys_cache[domain] = private_key
                
                return private_key
            else:
                logger.warning(f"DKIM private key not found for {domain} at {key_path}")
                return None
                
        except Exception as e:
            logger.error(f"Error loading DKIM key for {domain}: {e}")
            return None
            
    def validate_key_pair(self, private_key: str, public_key: str) -> bool:
        """Validate that a private/public key pair matches"""
        try:
            # Test signing and verification
            test_message = b"Test message for DKIM validation"
            
            # Create a minimal email for testing
            test_email = f"""From: test@example.com
To: test@example.com
Subject: Test
Date: Mon, 01 Jan 2024 00:00:00 +0000
Message-ID: <test@example.com>

Test message
"""
            
            # Try to sign
            sig = dkim.sign(
                test_email.encode('utf-8'),
                b'test',
                b'example.com',
                private_key.encode('utf-8')
            )
            
            return sig is not None
            
        except Exception as e:
            logger.error(f"Key pair validation failed: {e}")
            return False
            
    def extract_dkim_domains(self, message_data: str) -> list:
        """Extract domains from DKIM signatures in a message"""
        domains = []
        
        try:
            msg = message_from_string(message_data)
            
            # Look for DKIM-Signature headers
            for header in msg.get_all('DKIM-Signature', []):
                # Extract d= parameter
                if 'd=' in header:
                    parts = header.split('d=')
                    if len(parts) > 1:
                        domain = parts[1].split(';')[0].strip()
                        domains.append(domain)
                        
        except Exception as e:
            logger.error(f"Error extracting DKIM domains: {e}")
            
        return domains
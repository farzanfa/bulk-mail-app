import asyncio
import logging
import smtplib
import ssl
import socket
from typing import Optional, List, Tuple
from datetime import datetime
import aiosmtplib
from email import message_from_string
from sqlalchemy import select

from models import Message, DeliveryAttempt, Domain
from dns_resolver import DNSResolver
from dkim_signer import DKIMSigner
from config import settings

logger = logging.getLogger(__name__)


class DeliveryAgent:
    """Handle email delivery to remote servers"""
    
    def __init__(self):
        self.dns_resolver = DNSResolver()
        self.dkim_signer = DKIMSigner()
        
    async def deliver(self, message: Message, db_session) -> bool:
        """Deliver a message to all recipients"""
        try:
            # Group recipients by domain
            recipients_by_domain = self._group_recipients_by_domain(message.rcpt_to)
            
            # Track overall success
            all_successful = True
            
            # Deliver to each domain
            for domain, recipients in recipients_by_domain.items():
                success = await self._deliver_to_domain(
                    message, domain, recipients, db_session
                )
                
                if not success:
                    all_successful = False
                    
            return all_successful
            
        except Exception as e:
            logger.error(f"Delivery error for message {message.id}: {e}")
            return False
            
    def _group_recipients_by_domain(self, recipients: List[str]) -> dict:
        """Group recipients by domain"""
        grouped = {}
        
        for recipient in recipients:
            if '@' in recipient:
                domain = recipient.split('@')[1].lower()
                if domain not in grouped:
                    grouped[domain] = []
                grouped[domain].append(recipient)
                
        return grouped
        
    async def _deliver_to_domain(self, message: Message, domain: str, 
                               recipients: List[str], db_session) -> bool:
        """Deliver message to all recipients at a domain"""
        
        # Get MX records
        mx_records = await self.dns_resolver.get_mx_records(domain)
        
        if not mx_records:
            logger.error(f"No MX records found for {domain}")
            await self._record_delivery_attempt(
                message, db_session, None, None, False,
                error_message=f"No MX records found for {domain}"
            )
            return False
            
        # Sign message with DKIM if enabled
        signed_message = await self._sign_message(message, db_session)
        if not signed_message:
            signed_message = message.raw_message
            
        # Try each MX server in priority order
        for mx in mx_records:
            for ip in mx.ips:
                success = await self._attempt_delivery(
                    message, mx.hostname, ip, recipients, 
                    signed_message, db_session
                )
                
                if success:
                    return True
                    
        # All attempts failed
        return False
        
    async def _sign_message(self, message: Message, db_session) -> Optional[str]:
        """Sign message with DKIM"""
        if not settings.enable_dkim_signing:
            return None
            
        try:
            # Extract sender domain
            if '@' in message.mail_from:
                sender_domain = message.mail_from.split('@')[1]
            else:
                return None
                
            # Get domain info
            result = await db_session.execute(
                select(Domain).where(Domain.domain == sender_domain)
            )
            domain_info = result.scalar_one_or_none()
            
            if not domain_info or not domain_info.dkim_private_key:
                logger.warning(f"No DKIM key for domain {sender_domain}")
                return None
                
            # Sign the message
            signed = await self.dkim_signer.sign_message(
                message.raw_message,
                sender_domain,
                domain_info.dkim_selector,
                domain_info.dkim_private_key
            )
            
            return signed
            
        except Exception as e:
            logger.error(f"DKIM signing failed: {e}")
            return None
            
    async def _attempt_delivery(self, message: Message, mx_hostname: str,
                              mx_ip: str, recipients: List[str],
                              message_data: str, db_session) -> bool:
        """Attempt delivery to a specific MX server"""
        
        start_time = datetime.utcnow()
        attempt_number = message.attempts + 1
        
        try:
            logger.info(f"Attempting delivery to {mx_hostname} ({mx_ip}) for message {message.id}")
            
            # Create SMTP client
            smtp = aiosmtplib.SMTP(
                hostname=mx_ip,
                port=25,
                timeout=settings.connection_timeout,
                use_tls=False,  # Will use STARTTLS if available
                validate_certs=True
            )
            
            # Connect
            await smtp.connect()
            connection_time = (datetime.utcnow() - start_time).total_seconds()
            
            # Send EHLO
            await smtp.ehlo()
            
            # Try STARTTLS if available
            tls_version = None
            cipher_suite = None
            
            if smtp.supports_extension("STARTTLS"):
                try:
                    await smtp.starttls()
                    # Get TLS info
                    if hasattr(smtp, 'transport'):
                        ssl_object = smtp.transport.get_extra_info('ssl_object')
                        if ssl_object:
                            tls_version = ssl_object.version()
                            cipher_suite = ssl_object.cipher()[0] if ssl_object.cipher() else None
                except Exception as e:
                    logger.warning(f"STARTTLS failed: {e}")
                    
            # Send message
            errors = await smtp.send_message(
                message_from_string(message_data),
                sender=message.mail_from,
                recipients=recipients
            )
            
            # Check for errors
            if errors:
                # Some recipients failed
                logger.warning(f"Partial delivery failure: {errors}")
                
            # Close connection
            await smtp.quit()
            
            delivery_time = (datetime.utcnow() - start_time).total_seconds()
            
            # Record successful attempt
            await self._record_delivery_attempt(
                message, db_session, mx_hostname, mx_ip, True,
                attempt_number=attempt_number,
                mx_priority=None,  # Could extract from MX records
                status_code=250,
                response="Message accepted for delivery",
                connection_time=connection_time,
                delivery_time=delivery_time,
                tls_version=tls_version,
                cipher_suite=cipher_suite
            )
            
            logger.info(f"Successfully delivered message {message.id} to {mx_hostname}")
            return True
            
        except aiosmtplib.SMTPException as e:
            # SMTP error
            error_code = getattr(e, 'code', None)
            error_message = str(e)
            
            logger.error(f"SMTP error delivering to {mx_hostname}: {error_message}")
            
            await self._record_delivery_attempt(
                message, db_session, mx_hostname, mx_ip, False,
                attempt_number=attempt_number,
                status_code=error_code,
                error_message=error_message,
                connection_time=connection_time if 'connection_time' in locals() else None
            )
            
            # Check if it's a permanent error
            if error_code and error_code >= 500:
                # Permanent failure, don't retry this recipient
                return False
                
        except socket.timeout:
            logger.error(f"Timeout connecting to {mx_hostname}")
            
            await self._record_delivery_attempt(
                message, db_session, mx_hostname, mx_ip, False,
                attempt_number=attempt_number,
                error_message="Connection timeout"
            )
            
        except Exception as e:
            logger.error(f"Unexpected error delivering to {mx_hostname}: {e}")
            
            await self._record_delivery_attempt(
                message, db_session, mx_hostname, mx_ip, False,
                attempt_number=attempt_number,
                error_message=str(e)
            )
            
        return False
        
    async def _record_delivery_attempt(self, message: Message, db_session,
                                     mx_hostname: Optional[str], mx_ip: Optional[str],
                                     success: bool, **kwargs):
        """Record a delivery attempt in the database"""
        try:
            attempt = DeliveryAttempt(
                message_id=message.id,
                mx_hostname=mx_hostname,
                remote_ip=mx_ip,
                success=success,
                attempted_at=datetime.utcnow(),
                **kwargs
            )
            
            db_session.add(attempt)
            # Don't commit here - let the caller handle it
            
        except Exception as e:
            logger.error(f"Failed to record delivery attempt: {e}")
            
    async def verify_recipient(self, email: str) -> bool:
        """Verify if a recipient email is valid (VRFY/RCPT check)"""
        if '@' not in email:
            return False
            
        domain = email.split('@')[1]
        
        # Get MX records
        mx_records = await self.dns_resolver.get_mx_records(domain)
        
        if not mx_records:
            return False
            
        # Try to verify with the primary MX
        mx = mx_records[0]
        
        for ip in mx.ips[:1]:  # Only try first IP
            try:
                smtp = aiosmtplib.SMTP(
                    hostname=ip,
                    port=25,
                    timeout=10
                )
                
                await smtp.connect()
                await smtp.ehlo()
                
                # Try VRFY command
                try:
                    code, message = await smtp.vrfy(email)
                    if code == 250:
                        await smtp.quit()
                        return True
                except:
                    pass
                    
                # Try RCPT TO without sending
                try:
                    await smtp.mail(f"test@{settings.server_domain}")
                    code, message = await smtp.rcpt(email)
                    
                    await smtp.quit()
                    
                    return code == 250
                    
                except:
                    pass
                    
                await smtp.quit()
                
            except:
                pass
                
        # Assume valid if we can't verify
        return True
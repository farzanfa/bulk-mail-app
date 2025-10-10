import aiosmtplib
import asyncio
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Dict, Optional, Union
import dkim
from datetime import datetime
import logging
from jinja2 import Template as JinjaTemplate
import re
from email_validator import validate_email, EmailNotValidError
from config import settings
import hashlib
import base64

logger = logging.getLogger(__name__)


class EmailSender:
    def __init__(self):
        self.smtp_config = {
            'hostname': settings.smtp_host,
            'port': settings.smtp_port,
            'username': settings.smtp_username,
            'password': settings.smtp_password,
            'use_tls': settings.smtp_use_tls,
            'start_tls': settings.smtp_use_tls and not settings.smtp_use_ssl,
        }
        self.rate_limiter = RateLimiter(
            max_per_minute=settings.rate_limit_per_minute,
            daily_limit=settings.daily_email_limit
        )
        
    async def send_email(
        self,
        to_email: Union[str, List[str]],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        reply_to: Optional[str] = None,
        attachments: Optional[List[Dict]] = None,
        headers: Optional[Dict[str, str]] = None,
        tracking_id: Optional[str] = None
    ) -> Dict:
        """Send an email with proper authentication and tracking"""
        
        # Validate recipients
        to_emails = [to_email] if isinstance(to_email, str) else to_email
        validated_emails = []
        
        for email in to_emails:
            try:
                validation = validate_email(email)
                validated_emails.append(validation.email)
            except EmailNotValidError as e:
                logger.error(f"Invalid email address {email}: {str(e)}")
                return {'success': False, 'error': f'Invalid email: {email}'}
        
        # Check rate limits
        if not await self.rate_limiter.check_limit():
            return {'success': False, 'error': 'Rate limit exceeded'}
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = self._format_address(from_email or settings.from_email, from_name or settings.from_name)
        msg['To'] = ', '.join(validated_emails)
        
        if reply_to:
            msg['Reply-To'] = reply_to
            
        # Add custom headers
        if headers:
            for key, value in headers.items():
                msg[key] = value
                
        # Add tracking pixel if enabled
        if settings.enable_tracking and tracking_id and html_content:
            tracking_pixel = self._generate_tracking_pixel(tracking_id)
            html_content = self._inject_tracking_pixel(html_content, tracking_pixel)
            
        # Add tracking to links
        if settings.enable_tracking and tracking_id and html_content:
            html_content = self._track_links(html_content, tracking_id)
        
        # Create text part
        if not text_content:
            text_content = self._html_to_text(html_content)
            
        text_part = MIMEText(text_content, 'plain', 'utf-8')
        msg.attach(text_part)
        
        # Create HTML part
        html_part = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(html_part)
        
        # Add attachments
        if attachments:
            for attachment in attachments:
                self._add_attachment(msg, attachment)
                
        # Add List-Unsubscribe header
        if tracking_id:
            unsubscribe_url = f"{settings.tracking_domain}/unsubscribe/{tracking_id}"
            msg['List-Unsubscribe'] = f"<{unsubscribe_url}>"
            msg['List-Unsubscribe-Post'] = "List-Unsubscribe=One-Click"
        
        # Sign with DKIM if configured
        if settings.dkim_private_key_path:
            msg_string = msg.as_string()
            signed_msg = self._sign_with_dkim(msg_string)
            if signed_msg:
                msg = signed_msg
                
        # Send email
        try:
            async with aiosmtplib.SMTP(**self.smtp_config) as smtp:
                response = await smtp.send_message(msg)
                
            await self.rate_limiter.increment()
            
            return {
                'success': True,
                'message_id': msg.get('Message-ID'),
                'recipients': validated_emails,
                'response': response
            }
            
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return {'success': False, 'error': str(e)}
            
    async def send_bulk(
        self,
        recipients: List[Dict],
        subject: str,
        html_template: str,
        text_template: Optional[str] = None,
        **kwargs
    ) -> List[Dict]:
        """Send personalized bulk emails"""
        
        results = []
        
        for recipient in recipients:
            # Personalize content
            personalized_html = self._personalize_content(html_template, recipient)
            personalized_text = self._personalize_content(text_template, recipient) if text_template else None
            personalized_subject = self._personalize_content(subject, recipient)
            
            # Send email
            result = await self.send_email(
                to_email=recipient['email'],
                subject=personalized_subject,
                html_content=personalized_html,
                text_content=personalized_text,
                tracking_id=recipient.get('tracking_id'),
                **kwargs
            )
            
            results.append({
                'email': recipient['email'],
                'result': result
            })
            
            # Small delay between emails to avoid overwhelming the server
            await asyncio.sleep(0.1)
            
        return results
        
    def _format_address(self, email: str, name: Optional[str] = None) -> str:
        """Format email address with optional name"""
        if name:
            return f'"{name}" <{email}>'
        return email
        
    def _personalize_content(self, template: str, data: Dict) -> str:
        """Personalize content using Jinja2 templates"""
        jinja_template = JinjaTemplate(template)
        return jinja_template.render(**data)
        
    def _html_to_text(self, html: str) -> str:
        """Convert HTML to plain text"""
        # Remove HTML tags
        text = re.sub('<[^<]+?>', '', html)
        # Convert HTML entities
        text = text.replace('&nbsp;', ' ')
        text = text.replace('&amp;', '&')
        text = text.replace('&lt;', '<')
        text = text.replace('&gt;', '>')
        text = text.replace('&quot;', '"')
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text
        
    def _generate_tracking_pixel(self, tracking_id: str) -> str:
        """Generate tracking pixel URL"""
        return f'{settings.tracking_domain}/track/open/{tracking_id}'
        
    def _inject_tracking_pixel(self, html: str, pixel_url: str) -> str:
        """Inject tracking pixel into HTML"""
        pixel = f'<img src="{pixel_url}" width="1" height="1" style="display:none;" />'
        
        # Try to inject before closing body tag
        if '</body>' in html:
            return html.replace('</body>', f'{pixel}</body>')
        else:
            # Otherwise append to end
            return html + pixel
            
    def _track_links(self, html: str, tracking_id: str) -> str:
        """Replace links with tracking URLs"""
        def replace_link(match):
            url = match.group(1)
            if url.startswith(('http://', 'https://')):
                # Encode the original URL
                encoded_url = base64.urlsafe_b64encode(url.encode()).decode()
                tracking_url = f'{settings.tracking_domain}/track/click/{tracking_id}/{encoded_url}'
                return f'href="{tracking_url}"'
            return match.group(0)
            
        return re.sub(r'href="([^"]+)"', replace_link, html)
        
    def _add_attachment(self, msg: MIMEMultipart, attachment: Dict):
        """Add attachment to email"""
        part = MIMEBase('application', 'octet-stream')
        part.set_payload(attachment['content'])
        encoders.encode_base64(part)
        part.add_header(
            'Content-Disposition',
            f'attachment; filename="{attachment["filename"]}"'
        )
        msg.attach(part)
        
    def _sign_with_dkim(self, msg_string: str) -> Optional[str]:
        """Sign email with DKIM"""
        try:
            with open(settings.dkim_private_key_path, 'rb') as f:
                private_key = f.read()
                
            sig = dkim.sign(
                msg_string.encode(),
                settings.dkim_selector.encode(),
                settings.dkim_domain.encode(),
                private_key,
                include_headers=[b'from', b'to', b'subject', b'date']
            )
            
            return sig.decode() + msg_string
            
        except Exception as e:
            logger.error(f"DKIM signing failed: {str(e)}")
            return None


class RateLimiter:
    """Simple in-memory rate limiter"""
    
    def __init__(self, max_per_minute: int, daily_limit: int):
        self.max_per_minute = max_per_minute
        self.daily_limit = daily_limit
        self.minute_count = 0
        self.daily_count = 0
        self.last_minute = datetime.now().minute
        self.last_date = datetime.now().date()
        self.lock = asyncio.Lock()
        
    async def check_limit(self) -> bool:
        """Check if sending is allowed"""
        async with self.lock:
            now = datetime.now()
            
            # Reset minute counter
            if now.minute != self.last_minute:
                self.minute_count = 0
                self.last_minute = now.minute
                
            # Reset daily counter
            if now.date() != self.last_date:
                self.daily_count = 0
                self.last_date = now.date()
                
            # Check limits
            if self.minute_count >= self.max_per_minute:
                return False
                
            if self.daily_count >= self.daily_limit:
                return False
                
            return True
            
    async def increment(self):
        """Increment counters"""
        async with self.lock:
            self.minute_count += 1
            self.daily_count += 1


# Create global email sender instance
email_sender = EmailSender()
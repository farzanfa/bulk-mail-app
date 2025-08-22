import logging
import re
from typing import Dict, List, Tuple
from email.message import Message
from datetime import datetime

logger = logging.getLogger(__name__)


class SpamFilter:
    """Basic spam filtering for SMTP server"""
    
    def __init__(self):
        # Define spam rules and scores
        self.rules = {
            # Subject line checks
            'subject_all_caps': (3.0, self._check_all_caps_subject),
            'subject_excessive_punctuation': (2.0, self._check_excessive_punctuation),
            'subject_spam_words': (2.5, self._check_spam_words_subject),
            
            # Body checks
            'body_spam_words': (2.0, self._check_spam_words_body),
            'excessive_links': (1.5, self._check_excessive_links),
            'hidden_text': (3.0, self._check_hidden_text),
            'excessive_images': (1.0, self._check_excessive_images),
            
            # Header checks
            'missing_message_id': (1.0, self._check_missing_message_id),
            'invalid_date': (2.0, self._check_invalid_date),
            'multiple_from': (3.0, self._check_multiple_from),
            'forged_received': (4.0, self._check_forged_received),
            
            # Content checks
            'base64_encoded_text': (1.5, self._check_base64_text),
            'no_text_content': (1.0, self._check_no_text),
            'mostly_html': (0.5, self._check_mostly_html),
            
            # Sender checks
            'no_reverse_dns': (2.0, self._check_no_reverse_dns),
            'dynamic_ip': (1.5, self._check_dynamic_ip),
        }
        
        # Common spam words/phrases
        self.spam_words = [
            'viagra', 'cialis', 'pharmacy', 'pills', 'medication',
            'casino', 'poker', 'slots', 'betting', 'lottery',
            'weight loss', 'lose weight', 'diet pills',
            'make money', 'work from home', 'million dollars',
            'nigerian prince', 'inheritance', 'tax refund',
            'click here', 'act now', 'limited time', 'urgent',
            'winner', 'congratulations', 'you won', 'prize',
            'free', 'guarantee', 'no obligation', 'risk free',
            'increase sales', 'double your', 'cheap', 'bargain',
            'order now', 'call now', 'apply now', 'subscribe',
            'unsubscribe', 'remove', 'opt out',
            'dear friend', 'dear sir/madam'
        ]
        
    async def check_message(self, msg: Message, sender: str, 
                          sender_ip: str) -> float:
        """Check message for spam and return spam score"""
        
        total_score = 0.0
        triggered_rules = []
        
        # Run all checks
        for rule_name, (score, check_func) in self.rules.items():
            try:
                if await check_func(msg, sender, sender_ip):
                    total_score += score
                    triggered_rules.append(rule_name)
                    logger.debug(f"Triggered rule {rule_name}: +{score}")
            except Exception as e:
                logger.error(f"Error in spam check {rule_name}: {e}")
                
        # Log results
        if total_score > 5.0:
            logger.warning(
                f"High spam score {total_score} for message from {sender} ({sender_ip}). "
                f"Rules: {', '.join(triggered_rules)}"
            )
            
        return total_score
        
    async def _check_all_caps_subject(self, msg: Message, sender: str, 
                                    sender_ip: str) -> bool:
        """Check if subject is all caps"""
        subject = msg.get('Subject', '')
        if len(subject) > 10:
            # Check if more than 80% of letters are uppercase
            letters = [c for c in subject if c.isalpha()]
            if letters:
                uppercase_ratio = sum(1 for c in letters if c.isupper()) / len(letters)
                return uppercase_ratio > 0.8
        return False
        
    async def _check_excessive_punctuation(self, msg: Message, sender: str,
                                         sender_ip: str) -> bool:
        """Check for excessive punctuation in subject"""
        subject = msg.get('Subject', '')
        # Count exclamation marks and question marks
        punctuation_count = subject.count('!') + subject.count('?') + subject.count('$')
        return punctuation_count > 3
        
    async def _check_spam_words_subject(self, msg: Message, sender: str,
                                      sender_ip: str) -> bool:
        """Check for spam words in subject"""
        subject = msg.get('Subject', '').lower()
        spam_count = sum(1 for word in self.spam_words if word in subject)
        return spam_count >= 2
        
    async def _check_spam_words_body(self, msg: Message, sender: str,
                                   sender_ip: str) -> bool:
        """Check for spam words in body"""
        body = self._get_body_text(msg).lower()
        if len(body) < 50:
            return False
            
        spam_count = sum(1 for word in self.spam_words if word in body)
        # Calculate spam word density
        word_count = len(body.split())
        if word_count > 0:
            spam_density = spam_count / word_count
            return spam_density > 0.05  # More than 5% spam words
        return False
        
    async def _check_excessive_links(self, msg: Message, sender: str,
                                   sender_ip: str) -> bool:
        """Check for excessive URLs in message"""
        body = self._get_body_text(msg)
        # Simple URL pattern
        url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
        urls = re.findall(url_pattern, body)
        
        # Check URL density
        word_count = len(body.split())
        if word_count > 0:
            url_density = len(urls) / word_count
            return url_density > 0.1  # More than 10% URLs
        return False
        
    async def _check_hidden_text(self, msg: Message, sender: str,
                               sender_ip: str) -> bool:
        """Check for hidden text (same color as background, tiny font)"""
        html_body = self._get_html_body(msg)
        if not html_body:
            return False
            
        # Check for common hiding techniques
        hiding_patterns = [
            r'color:\s*#?ffffff',  # White text
            r'font-size:\s*[01]px',  # Tiny font
            r'display:\s*none',  # Hidden elements
            r'visibility:\s*hidden',
            r'text-indent:\s*-\d+px'  # Negative indent
        ]
        
        for pattern in hiding_patterns:
            if re.search(pattern, html_body, re.IGNORECASE):
                return True
                
        return False
        
    async def _check_excessive_images(self, msg: Message, sender: str,
                                    sender_ip: str) -> bool:
        """Check for excessive images"""
        html_body = self._get_html_body(msg)
        if not html_body:
            return False
            
        # Count image tags
        img_count = len(re.findall(r'<img\s+[^>]*>', html_body, re.IGNORECASE))
        
        # Check text to image ratio
        text_length = len(re.sub(r'<[^>]+>', '', html_body))
        
        if text_length < 100 and img_count > 2:
            return True  # Very little text but multiple images
            
        return img_count > 10
        
    async def _check_missing_message_id(self, msg: Message, sender: str,
                                      sender_ip: str) -> bool:
        """Check if Message-ID header is missing"""
        return msg.get('Message-ID') is None
        
    async def _check_invalid_date(self, msg: Message, sender: str,
                                sender_ip: str) -> bool:
        """Check for invalid or suspicious date"""
        date_str = msg.get('Date')
        if not date_str:
            return True
            
        # Try to parse date
        try:
            # Simple check - would use proper date parsing in production
            if 'GMT' not in date_str and 'UTC' not in date_str and '+' not in date_str:
                return True
        except:
            return True
            
        return False
        
    async def _check_multiple_from(self, msg: Message, sender: str,
                                 sender_ip: str) -> bool:
        """Check for multiple From headers"""
        from_headers = msg.get_all('From', [])
        return len(from_headers) > 1
        
    async def _check_forged_received(self, msg: Message, sender: str,
                                   sender_ip: str) -> bool:
        """Check for potentially forged Received headers"""
        received_headers = msg.get_all('Received', [])
        
        # Check for suspicious patterns
        for header in received_headers:
            # Check for private IPs in received headers from external mail
            if re.search(r'(10\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[01]\.|192\.168\.)', header):
                if not self._is_private_ip(sender_ip):
                    return True
                    
        return False
        
    async def _check_base64_text(self, msg: Message, sender: str,
                               sender_ip: str) -> bool:
        """Check for base64 encoded text content"""
        for part in msg.walk():
            if part.get_content_type() == 'text/plain':
                encoding = part.get('Content-Transfer-Encoding', '').lower()
                if encoding == 'base64':
                    # Base64 for plain text is suspicious
                    return True
                    
        return False
        
    async def _check_no_text(self, msg: Message, sender: str,
                           sender_ip: str) -> bool:
        """Check if message has no text content"""
        text_content = self._get_body_text(msg)
        return len(text_content.strip()) < 10
        
    async def _check_mostly_html(self, msg: Message, sender: str,
                               sender_ip: str) -> bool:
        """Check if message is mostly HTML with little text"""
        text_body = self._get_text_body(msg)
        html_body = self._get_html_body(msg)
        
        if html_body and not text_body:
            return True
            
        return False
        
    async def _check_no_reverse_dns(self, msg: Message, sender: str,
                                  sender_ip: str) -> bool:
        """Check if sender IP has no reverse DNS"""
        # This would be implemented with actual reverse DNS lookup
        # For now, return False
        return False
        
    async def _check_dynamic_ip(self, msg: Message, sender: str,
                              sender_ip: str) -> bool:
        """Check if sender is from dynamic IP range"""
        # Common dynamic IP patterns
        dynamic_patterns = [
            r'dynamic',
            r'dyn\.',
            r'dial',
            r'dsl',
            r'pool',
            r'dhcp',
            r'ppp'
        ]
        
        # Would check reverse DNS here
        # For now, return False
        return False
        
    def _get_body_text(self, msg: Message) -> str:
        """Extract all text from message"""
        text_parts = []
        
        for part in msg.walk():
            content_type = part.get_content_type()
            if content_type == 'text/plain':
                try:
                    text_parts.append(part.get_payload(decode=True).decode('utf-8', errors='ignore'))
                except:
                    pass
            elif content_type == 'text/html':
                try:
                    html = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    # Strip HTML tags
                    text = re.sub(r'<[^>]+>', ' ', html)
                    text_parts.append(text)
                except:
                    pass
                    
        return ' '.join(text_parts)
        
    def _get_text_body(self, msg: Message) -> str:
        """Get plain text body"""
        for part in msg.walk():
            if part.get_content_type() == 'text/plain':
                try:
                    return part.get_payload(decode=True).decode('utf-8', errors='ignore')
                except:
                    pass
        return ''
        
    def _get_html_body(self, msg: Message) -> str:
        """Get HTML body"""
        for part in msg.walk():
            if part.get_content_type() == 'text/html':
                try:
                    return part.get_payload(decode=True).decode('utf-8', errors='ignore')
                except:
                    pass
        return ''
        
    def _is_private_ip(self, ip: str) -> bool:
        """Check if IP is private"""
        private_ranges = [
            (r'^10\.', '10.0.0.0/8'),
            (r'^172\.(1[6-9]|2[0-9]|3[01])\.', '172.16.0.0/12'),
            (r'^192\.168\.', '192.168.0.0/16'),
            (r'^127\.', '127.0.0.0/8')
        ]
        
        for pattern, _ in private_ranges:
            if re.match(pattern, ip):
                return True
                
        return False
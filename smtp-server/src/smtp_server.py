import asyncio
import logging
import ssl
import time
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import base64
import hmac
import hashlib
from email import message_from_string
from email.utils import parseaddr
import os
import uuid

from aiosmtpd.controller import Controller
from aiosmtpd.smtp import SMTP as SMTPProtocol
from aiosmtpd.handlers import AsyncMessage
import aioredis
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from config import settings
from models import Base, User, Message, Connection, AuthenticationLog, RateLimit
from auth_handler import AuthHandler
from dns_resolver import DNSResolver
from spam_filter import SpamFilter
from rate_limiter import RateLimiter
from message_queue import MessageQueue

logger = logging.getLogger(__name__)


class CustomSMTPProtocol(SMTPProtocol):
    """Extended SMTP protocol with authentication and custom features"""
    
    def __init__(self, handler, **kwargs):
        super().__init__(handler, **kwargs)
        self.authenticated_user = None
        self.auth_handler = AuthHandler()
        self.connection_start = time.time()
        self.commands_count = 0
        self.failed_auth_attempts = 0
        
    async def smtp_AUTH(self, arg):
        """Handle AUTH command"""
        if not settings.enable_auth:
            await self.push("502 Authentication not enabled")
            return
            
        if self.authenticated_user:
            await self.push("503 Already authenticated")
            return
            
        parts = arg.split(None, 1)
        if not parts:
            await self.push("501 Syntax error")
            return
            
        mechanism = parts[0].upper()
        initial_response = parts[1] if len(parts) > 1 else None
        
        if mechanism not in settings.auth_methods:
            await self.push(f"504 Unrecognized authentication type {mechanism}")
            return
            
        try:
            if mechanism == "PLAIN":
                result = await self._auth_plain(initial_response)
            elif mechanism == "LOGIN":
                result = await self._auth_login(initial_response)
            elif mechanism == "CRAM-MD5":
                result = await self._auth_cram_md5()
            else:
                await self.push("504 Unrecognized authentication type")
                return
                
            if result:
                self.authenticated_user = result
                await self.push("235 Authentication successful")
                logger.info(f"User {result} authenticated from {self.peer}")
            else:
                self.failed_auth_attempts += 1
                await self.push("535 Authentication failed")
                
                if self.failed_auth_attempts >= settings.max_auth_attempts:
                    await self.push("421 Too many failed authentication attempts")
                    self._handler.connection_lost(self)
                    
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            await self.push("535 Authentication failed")
            
    async def _auth_plain(self, initial_response):
        """Handle PLAIN authentication"""
        if not initial_response:
            await self.push("334 ")
            response = await self._get_response()
            if not response:
                return None
        else:
            response = initial_response
            
        try:
            decoded = base64.b64decode(response).decode('utf-8')
            parts = decoded.split('\0')
            if len(parts) != 3:
                return None
                
            authzid, authcid, password = parts
            username = authcid or authzid
            
            return await self.auth_handler.authenticate(username, password, self.peer[0])
            
        except Exception as e:
            logger.error(f"PLAIN auth error: {e}")
            return None
            
    async def _auth_login(self, initial_response):
        """Handle LOGIN authentication"""
        # Request username
        await self.push("334 VXNlcm5hbWU6")  # Base64 for "Username:"
        username_b64 = await self._get_response()
        if not username_b64:
            return None
            
        try:
            username = base64.b64decode(username_b64).decode('utf-8')
        except:
            return None
            
        # Request password
        await self.push("334 UGFzc3dvcmQ6")  # Base64 for "Password:"
        password_b64 = await self._get_response()
        if not password_b64:
            return None
            
        try:
            password = base64.b64decode(password_b64).decode('utf-8')
        except:
            return None
            
        return await self.auth_handler.authenticate(username, password, self.peer[0])
        
    async def _auth_cram_md5(self):
        """Handle CRAM-MD5 authentication"""
        # Generate challenge
        challenge = f"<{int(time.time())}.{os.urandom(8).hex()}@{settings.server_hostname}>"
        challenge_b64 = base64.b64encode(challenge.encode()).decode()
        
        await self.push(f"334 {challenge_b64}")
        response = await self._get_response()
        if not response:
            return None
            
        try:
            decoded = base64.b64decode(response).decode('utf-8')
            username, client_hash = decoded.split(' ', 1)
            
            # Verify CRAM-MD5 response
            return await self.auth_handler.verify_cram_md5(
                username, challenge, client_hash, self.peer[0]
            )
            
        except Exception as e:
            logger.error(f"CRAM-MD5 auth error: {e}")
            return None
            
    async def _get_response(self):
        """Get response from client"""
        try:
            line = await self._reader.readline()
            return line.decode('utf-8').strip()
        except:
            return None
            
    async def smtp_STARTTLS(self, arg):
        """Handle STARTTLS command"""
        if not settings.enable_starttls:
            await self.push("502 STARTTLS not supported")
            return
            
        if isinstance(self.transport, ssl.SSLTransport):
            await self.push("503 TLS already active")
            return
            
        await self.push("220 Ready to start TLS")
        
        # Upgrade connection to TLS
        try:
            context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
            context.load_cert_chain(
                certfile=settings.tls_cert_path,
                keyfile=settings.tls_key_path
            )
            
            # Wrap the transport
            self.transport = await self.loop.start_tls(
                self.transport,
                self,
                context,
                server_side=True
            )
            
            # Reset SMTP state after STARTTLS
            self.smtp_state = self.COMMAND
            self.seen_greeting = False
            self.extended_smtp = False
            self.authenticated_user = None
            
        except Exception as e:
            logger.error(f"STARTTLS error: {e}")
            await self.push("454 TLS not available")


class CustomSMTPHandler(AsyncMessage):
    """Custom SMTP handler with database integration and spam filtering"""
    
    def __init__(self, message_queue: MessageQueue, spam_filter: SpamFilter, 
                 rate_limiter: RateLimiter, db_session: AsyncSession):
        self.message_queue = message_queue
        self.spam_filter = spam_filter
        self.rate_limiter = rate_limiter
        self.db_session = db_session
        self.dns_resolver = DNSResolver()
        
    async def handle_RCPT(self, server, session, envelope, address, rcpt_options):
        """Handle RCPT TO command with validation"""
        # Check if authentication is required
        if settings.enable_auth and not server.authenticated_user:
            await server.push("530 Authentication required")
            return "530 Authentication required"
            
        # Validate recipient
        if not await self._is_valid_recipient(address):
            await server.push("550 User unknown")
            return "550 User unknown"
            
        # Check rate limits
        identifier = server.authenticated_user or session.peer[0]
        if not await self.rate_limiter.check_recipient_rate(identifier):
            await server.push("452 Too many recipients")
            return "452 Too many recipients"
            
        envelope.rcpt_tos.append(address)
        return "250 OK"
        
    async def handle_DATA(self, server, session, envelope):
        """Handle message data with spam filtering and queueing"""
        try:
            # Parse message
            message_data = envelope.content.decode('utf-8', errors='replace')
            msg = message_from_string(message_data)
            
            # Extract headers
            subject = msg.get('Subject', '')
            from_header = msg.get('From', '')
            to_header = msg.get('To', '')
            message_id = msg.get('Message-ID', f"<{uuid.uuid4()}@{settings.server_hostname}>")
            
            # Check message size
            message_size = len(envelope.content)
            if message_size > settings.max_message_size:
                return "552 Message too large"
                
            # Spam filtering
            spam_score = await self.spam_filter.check_message(
                msg, 
                envelope.mail_from,
                session.peer[0]
            )
            
            if spam_score > 10.0:  # Reject high spam scores
                return "550 Message rejected as spam"
                
            # Create message record
            db_message = Message(
                message_id=message_id,
                mail_from=envelope.mail_from,
                rcpt_to=envelope.rcpt_tos,
                subject=subject,
                from_header=from_header,
                to_header=to_header,
                headers=dict(msg.items()),
                raw_message=message_data,
                size=message_size,
                remote_ip=session.peer[0],
                sender_id=await self._get_user_id(server.authenticated_user) if server.authenticated_user else None
            )
            
            self.db_session.add(db_message)
            await self.db_session.commit()
            
            # Queue for delivery
            await self.message_queue.enqueue(db_message.id)
            
            return "250 Message accepted for delivery"
            
        except Exception as e:
            logger.error(f"Error handling DATA: {e}")
            return "451 Temporary failure"
            
    async def _is_valid_recipient(self, address):
        """Check if recipient is valid"""
        # Extract email from address
        name, email = parseaddr(address)
        
        # Check if it's a local user
        domain = email.split('@')[1] if '@' in email else None
        if domain in await self._get_local_domains():
            # Check user exists
            user = await self.db_session.query(User).filter(
                User.email == email,
                User.is_active == True
            ).first()
            return user is not None
            
        # For external recipients, accept if authenticated
        return True
        
    async def _get_local_domains(self):
        """Get list of local domains"""
        # This would query the domains table
        return [settings.server_domain]
        
    async def _get_user_id(self, username):
        """Get user ID from username"""
        if not username:
            return None
            
        user = await self.db_session.query(User).filter(
            User.username == username
        ).first()
        
        return user.id if user else None


class SMTPServer:
    """Main SMTP server class"""
    
    def __init__(self):
        self.controller = None
        self.message_queue = None
        self.spam_filter = None
        self.rate_limiter = None
        self.db_engine = None
        self.redis = None
        
    async def start(self):
        """Start the SMTP server"""
        logger.info("Starting SMTP server...")
        
        # Initialize database
        self.db_engine = create_async_engine(settings.database_url)
        async with self.db_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
        # Initialize Redis
        self.redis = await aioredis.create_redis_pool(settings.redis_url)
        
        # Initialize components
        self.message_queue = MessageQueue(self.redis, self.db_engine)
        self.spam_filter = SpamFilter()
        self.rate_limiter = RateLimiter(self.redis)
        
        # Create session factory
        async_session = sessionmaker(
            self.db_engine, class_=AsyncSession, expire_on_commit=False
        )
        
        # Create handler factory
        def handler_factory():
            return CustomSMTPHandler(
                self.message_queue,
                self.spam_filter,
                self.rate_limiter,
                async_session()
            )
            
        # Start SMTP server
        self.controller = Controller(
            handler_factory(),
            hostname=settings.server_ip,
            port=settings.smtp_port,
            smtp_class=CustomSMTPProtocol
        )
        
        self.controller.start()
        
        # Start TLS port if enabled
        if settings.enable_starttls:
            await self._start_tls_server()
            
        # Start message queue processor
        asyncio.create_task(self.message_queue.process_queue())
        
        logger.info(f"SMTP server started on {settings.server_ip}:{settings.smtp_port}")
        
    async def _start_tls_server(self):
        """Start TLS-enabled SMTP server on submission port"""
        context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
        context.load_cert_chain(
            certfile=settings.tls_cert_path,
            keyfile=settings.tls_key_path
        )
        
        # Additional TLS server setup would go here
        
    async def stop(self):
        """Stop the SMTP server"""
        logger.info("Stopping SMTP server...")
        
        if self.controller:
            self.controller.stop()
            
        if self.redis:
            self.redis.close()
            await self.redis.wait_closed()
            
        if self.db_engine:
            await self.db_engine.dispose()
            
        logger.info("SMTP server stopped")
        

async def main():
    """Main entry point"""
    logging.basicConfig(
        level=getattr(logging, settings.log_level),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    server = SMTPServer()
    
    try:
        await server.start()
        
        # Keep server running
        while True:
            await asyncio.sleep(3600)
            
    except KeyboardInterrupt:
        logger.info("Received interrupt signal")
    finally:
        await server.stop()


if __name__ == "__main__":
    asyncio.run(main())
import bcrypt
import hashlib
import hmac
import logging
from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from models import User, AuthenticationLog

logger = logging.getLogger(__name__)


class AuthHandler:
    """Handle SMTP authentication"""
    
    def __init__(self, db_session: AsyncSession = None):
        self.db_session = db_session
        
    def set_session(self, session: AsyncSession):
        """Set database session"""
        self.db_session = session
        
    async def authenticate(self, username: str, password: str, remote_ip: str) -> Optional[str]:
        """Authenticate user with username and password"""
        if not self.db_session:
            logger.error("No database session available")
            return None
            
        try:
            # Get user from database
            result = await self.db_session.execute(
                select(User).where(
                    (User.username == username) | (User.email == username),
                    User.is_active == True
                )
            )
            user = result.scalar_one_or_none()
            
            if not user:
                await self._log_auth_attempt(username, False, remote_ip, "User not found")
                return None
                
            # Check if account is locked due to failed attempts
            if user.failed_auth_attempts >= 5:
                if user.last_failed_auth:
                    lockout_until = user.last_failed_auth + timedelta(minutes=30)
                    if datetime.utcnow() < lockout_until:
                        await self._log_auth_attempt(
                            username, False, remote_ip, "Account locked"
                        )
                        return None
                    else:
                        # Reset failed attempts after lockout period
                        user.failed_auth_attempts = 0
                        
            # Verify password
            if self._verify_password(password, user.password_hash):
                # Success - reset failed attempts
                user.failed_auth_attempts = 0
                user.last_login = datetime.utcnow()
                
                await self._log_auth_attempt(username, True, remote_ip, None, user.id)
                await self.db_session.commit()
                
                return user.username
                
            else:
                # Failed - increment failed attempts
                user.failed_auth_attempts += 1
                user.last_failed_auth = datetime.utcnow()
                
                await self._log_auth_attempt(
                    username, False, remote_ip, "Invalid password"
                )
                await self.db_session.commit()
                
                return None
                
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            await self._log_auth_attempt(
                username, False, remote_ip, f"Error: {str(e)}"
            )
            return None
            
    async def verify_cram_md5(self, username: str, challenge: str, 
                            client_response: str, remote_ip: str) -> Optional[str]:
        """Verify CRAM-MD5 authentication"""
        if not self.db_session:
            return None
            
        try:
            # Get user
            result = await self.db_session.execute(
                select(User).where(
                    (User.username == username) | (User.email == username),
                    User.is_active == True
                )
            )
            user = result.scalar_one_or_none()
            
            if not user:
                await self._log_auth_attempt(
                    username, False, remote_ip, "User not found", 
                    auth_method="CRAM-MD5"
                )
                return None
                
            # For CRAM-MD5, we need the plain password or a special hash
            # In production, you'd store a CRAM-MD5 compatible hash
            # For now, we'll skip CRAM-MD5 verification
            logger.warning("CRAM-MD5 authentication not fully implemented")
            
            await self._log_auth_attempt(
                username, False, remote_ip, "CRAM-MD5 not supported",
                auth_method="CRAM-MD5"
            )
            
            return None
            
        except Exception as e:
            logger.error(f"CRAM-MD5 authentication error: {e}")
            return None
            
    def _verify_password(self, password: str, password_hash: str) -> bool:
        """Verify password against hash"""
        try:
            # Handle different hash formats
            if password_hash.startswith('$2b$') or password_hash.startswith('$2a$'):
                # bcrypt hash
                return bcrypt.checkpw(
                    password.encode('utf-8'),
                    password_hash.encode('utf-8')
                )
            else:
                # Assume plain SHA256 for legacy (not recommended)
                return hashlib.sha256(password.encode()).hexdigest() == password_hash
                
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False
            
    def hash_password(self, password: str) -> str:
        """Hash a password for storage"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
    async def _log_auth_attempt(self, username: str, success: bool, 
                              remote_ip: str, failure_reason: Optional[str] = None,
                              user_id: Optional[int] = None,
                              auth_method: str = "PLAIN"):
        """Log authentication attempt"""
        if not self.db_session:
            return
            
        try:
            log_entry = AuthenticationLog(
                username=username,
                auth_method=auth_method,
                success=success,
                failure_reason=failure_reason,
                remote_ip=remote_ip,
                user_id=user_id,
                attempted_at=datetime.utcnow()
            )
            
            self.db_session.add(log_entry)
            # Don't commit here - let the caller commit
            
        except Exception as e:
            logger.error(f"Failed to log auth attempt: {e}")
            
    async def check_auth_required(self, sender: str, authenticated_user: Optional[str]) -> bool:
        """Check if authentication is required for sending"""
        if not authenticated_user:
            # Check if sender is local domain
            if '@' in sender:
                domain = sender.split('@')[1]
                # Would check against local domains table
                # For now, always require auth for local domains
                return True
                
        return False
        
    async def get_user_quota(self, username: str) -> Optional[dict]:
        """Get user quota information"""
        if not self.db_session or not username:
            return None
            
        try:
            result = await self.db_session.execute(
                select(User).where(User.username == username)
            )
            user = result.scalar_one_or_none()
            
            if user:
                return {
                    'message_quota': user.message_quota,
                    'messages_sent_today': user.messages_sent_today,
                    'storage_quota': user.storage_quota,
                    'storage_used': user.storage_used,
                    'remaining_messages': user.message_quota - user.messages_sent_today
                }
                
            return None
            
        except Exception as e:
            logger.error(f"Error getting user quota: {e}")
            return None
            
    async def increment_message_count(self, username: str):
        """Increment user's daily message count"""
        if not self.db_session or not username:
            return
            
        try:
            await self.db_session.execute(
                update(User)
                .where(User.username == username)
                .values(messages_sent_today=User.messages_sent_today + 1)
            )
            # Don't commit here - let the caller commit
            
        except Exception as e:
            logger.error(f"Error incrementing message count: {e}")
            
    async def reset_daily_quotas(self):
        """Reset all users' daily quotas - should be called by a scheduled task"""
        if not self.db_session:
            return
            
        try:
            await self.db_session.execute(
                update(User).values(messages_sent_today=0)
            )
            await self.db_session.commit()
            
            logger.info("Reset daily quotas for all users")
            
        except Exception as e:
            logger.error(f"Error resetting daily quotas: {e}")
            await self.db_session.rollback()
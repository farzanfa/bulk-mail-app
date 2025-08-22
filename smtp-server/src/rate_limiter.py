import asyncio
import logging
from typing import Optional, Dict
from datetime import datetime, timedelta
import aioredis
from config import settings

logger = logging.getLogger(__name__)


class RateLimiter:
    """Handle rate limiting for SMTP connections and messages"""
    
    def __init__(self, redis: aioredis.Redis):
        self.redis = redis
        
    async def check_connection_rate(self, ip: str) -> bool:
        """Check if IP can make a new connection"""
        key = f"smtp:ratelimit:conn:{ip}"
        
        try:
            # Get current count
            count = await self.redis.get(key)
            
            if count is None:
                # First connection
                await self.redis.setex(key, 60, 1)  # 1 minute TTL
                return True
                
            count = int(count)
            
            if count >= settings.max_connection_rate:
                logger.warning(f"Connection rate limit exceeded for {ip}")
                return False
                
            # Increment count
            await self.redis.incr(key)
            return True
            
        except Exception as e:
            logger.error(f"Rate limit check error: {e}")
            return True  # Allow on error
            
    async def check_message_rate(self, identifier: str, is_authenticated: bool = False) -> bool:
        """Check if sender can send a message"""
        # Different limits for authenticated vs unauthenticated
        if is_authenticated:
            hourly_limit = settings.max_messages_per_hour
            daily_limit = settings.max_messages_per_day
        else:
            # Stricter limits for unauthenticated
            hourly_limit = 50
            daily_limit = 200
            
        # Check hourly rate
        hourly_key = f"smtp:ratelimit:hour:{identifier}"
        hourly_count = await self._get_count(hourly_key)
        
        if hourly_count >= hourly_limit:
            logger.warning(f"Hourly message limit exceeded for {identifier}")
            return False
            
        # Check daily rate
        daily_key = f"smtp:ratelimit:day:{identifier}"
        daily_count = await self._get_count(daily_key)
        
        if daily_count >= daily_limit:
            logger.warning(f"Daily message limit exceeded for {identifier}")
            return False
            
        # Increment counters
        await self._increment_with_ttl(hourly_key, 3600)  # 1 hour
        await self._increment_with_ttl(daily_key, 86400)  # 24 hours
        
        return True
        
    async def check_recipient_rate(self, identifier: str) -> bool:
        """Check recipient rate (recipients per message)"""
        # This is checked per message, not over time
        return True  # Implement per-message recipient limiting in the handler
        
    async def check_auth_attempts(self, ip: str) -> bool:
        """Check authentication attempt rate"""
        key = f"smtp:ratelimit:auth:{ip}"
        
        count = await self._get_count(key)
        
        if count >= settings.max_auth_attempts:
            logger.warning(f"Auth attempt limit exceeded for {ip}")
            return False
            
        await self._increment_with_ttl(key, 900)  # 15 minutes
        
        return True
        
    async def record_failure(self, identifier: str, failure_type: str):
        """Record a failure (bounce, spam report, etc.)"""
        key = f"smtp:failures:{failure_type}:{identifier}"
        
        await self._increment_with_ttl(key, 86400)  # Track for 24 hours
        
        # Check if we should temporarily block
        count = await self._get_count(key)
        
        if failure_type == "bounce" and count > 10:
            await self.temporary_block(identifier, 3600)  # 1 hour block
        elif failure_type == "spam" and count > 3:
            await self.temporary_block(identifier, 86400)  # 24 hour block
            
    async def temporary_block(self, identifier: str, duration: int):
        """Temporarily block an identifier"""
        key = f"smtp:blocked:{identifier}"
        await self.redis.setex(key, duration, "1")
        
        logger.warning(f"Temporarily blocked {identifier} for {duration} seconds")
        
    async def is_blocked(self, identifier: str) -> bool:
        """Check if identifier is blocked"""
        key = f"smtp:blocked:{identifier}"
        result = await self.redis.get(key)
        
        return result is not None
        
    async def get_limits_for(self, identifier: str, is_authenticated: bool = False) -> Dict:
        """Get current limits and usage for an identifier"""
        if is_authenticated:
            hourly_limit = settings.max_messages_per_hour
            daily_limit = settings.max_messages_per_day
        else:
            hourly_limit = 50
            daily_limit = 200
            
        hourly_count = await self._get_count(f"smtp:ratelimit:hour:{identifier}")
        daily_count = await self._get_count(f"smtp:ratelimit:day:{identifier}")
        
        return {
            'hourly': {
                'limit': hourly_limit,
                'used': hourly_count,
                'remaining': max(0, hourly_limit - hourly_count)
            },
            'daily': {
                'limit': daily_limit,
                'used': daily_count,
                'remaining': max(0, daily_limit - daily_count)
            },
            'is_blocked': await self.is_blocked(identifier)
        }
        
    async def _get_count(self, key: str) -> int:
        """Get counter value"""
        try:
            value = await self.redis.get(key)
            return int(value) if value else 0
        except:
            return 0
            
    async def _increment_with_ttl(self, key: str, ttl: int):
        """Increment counter with TTL"""
        try:
            # Use pipeline for atomic operation
            pipe = self.redis.pipeline()
            pipe.incr(key)
            pipe.expire(key, ttl)
            await pipe.execute()
        except Exception as e:
            logger.error(f"Failed to increment counter: {e}")
            
    async def cleanup_expired(self):
        """Clean up expired entries (called periodically)"""
        # Redis handles TTL automatically, but we can add custom cleanup here
        pass
        
    async def get_global_stats(self) -> Dict:
        """Get global rate limiting statistics"""
        try:
            # Scan for rate limit keys
            stats = {
                'active_connections': 0,
                'active_senders': 0,
                'blocked_ips': 0,
                'auth_failures': 0
            }
            
            # Count different key types
            cursor = 0
            while True:
                cursor, keys = await self.redis.scan(
                    cursor, 
                    match="smtp:ratelimit:*",
                    count=100
                )
                
                for key in keys:
                    if b':conn:' in key:
                        stats['active_connections'] += 1
                    elif b':hour:' in key:
                        stats['active_senders'] += 1
                    elif b':auth:' in key:
                        stats['auth_failures'] += 1
                        
                if cursor == 0:
                    break
                    
            # Count blocked IPs
            cursor = 0
            while True:
                cursor, keys = await self.redis.scan(
                    cursor,
                    match="smtp:blocked:*",
                    count=100
                )
                
                stats['blocked_ips'] += len(keys)
                
                if cursor == 0:
                    break
                    
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get rate limit stats: {e}")
            return {}
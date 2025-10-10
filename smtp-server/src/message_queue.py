import asyncio
import logging
import json
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import aioredis
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, update

from models import Message, DeliveryAttempt
from delivery import DeliveryAgent
from config import settings

logger = logging.getLogger(__name__)


class MessageQueue:
    """Manage email queue and delivery"""
    
    def __init__(self, redis: aioredis.Redis, db_engine):
        self.redis = redis
        self.db_engine = db_engine
        self.delivery_agent = DeliveryAgent()
        self.processing = False
        self.queue_key = "smtp:queue:messages"
        self.processing_key = "smtp:queue:processing"
        self.retry_key = "smtp:queue:retry"
        
        # Create session factory
        self.async_session = sessionmaker(
            db_engine, class_=AsyncSession, expire_on_commit=False
        )
        
    async def enqueue(self, message_id: int, priority: int = 5):
        """Add message to queue"""
        try:
            # Add to Redis sorted set with priority as score
            # Lower score = higher priority
            await self.redis.zadd(self.queue_key, {str(message_id): priority})
            
            logger.info(f"Message {message_id} enqueued with priority {priority}")
            
        except Exception as e:
            logger.error(f"Failed to enqueue message {message_id}: {e}")
            
    async def dequeue(self, count: int = 1) -> List[int]:
        """Get messages from queue"""
        try:
            # Get messages with lowest score (highest priority)
            messages = await self.redis.zpopmin(self.queue_key, count)
            
            if not messages:
                return []
                
            # Extract message IDs
            message_ids = []
            for msg_data in messages:
                if isinstance(msg_data, tuple):
                    message_id = int(msg_data[0])
                else:
                    message_id = int(msg_data)
                    
                message_ids.append(message_id)
                
                # Add to processing set
                await self.redis.sadd(self.processing_key, str(message_id))
                
            return message_ids
            
        except Exception as e:
            logger.error(f"Failed to dequeue messages: {e}")
            return []
            
    async def requeue_failed(self, message_id: int, retry_after: int = 300):
        """Requeue failed message for retry"""
        try:
            # Remove from processing
            await self.redis.srem(self.processing_key, str(message_id))
            
            # Calculate retry time
            retry_time = datetime.utcnow() + timedelta(seconds=retry_after)
            retry_timestamp = int(retry_time.timestamp())
            
            # Add to retry sorted set
            await self.redis.zadd(self.retry_key, {str(message_id): retry_timestamp})
            
            logger.info(f"Message {message_id} scheduled for retry at {retry_time}")
            
        except Exception as e:
            logger.error(f"Failed to requeue message {message_id}: {e}")
            
    async def mark_completed(self, message_id: int):
        """Mark message as completed"""
        try:
            # Remove from processing
            await self.redis.srem(self.processing_key, str(message_id))
            
            logger.info(f"Message {message_id} marked as completed")
            
        except Exception as e:
            logger.error(f"Failed to mark message {message_id} as completed: {e}")
            
    async def process_queue(self):
        """Main queue processing loop"""
        self.processing = True
        logger.info("Starting queue processor")
        
        while self.processing:
            try:
                # Check for messages ready to retry
                await self._process_retry_queue()
                
                # Get batch of messages
                message_ids = await self.dequeue(count=settings.max_delivery_threads)
                
                if message_ids:
                    # Process messages concurrently
                    tasks = []
                    for message_id in message_ids:
                        task = asyncio.create_task(self._process_message(message_id))
                        tasks.append(task)
                        
                    # Wait for all to complete
                    await asyncio.gather(*tasks, return_exceptions=True)
                    
                else:
                    # No messages, wait a bit
                    await asyncio.sleep(1)
                    
            except Exception as e:
                logger.error(f"Queue processing error: {e}")
                await asyncio.sleep(5)
                
    async def _process_retry_queue(self):
        """Check retry queue and move ready messages back to main queue"""
        try:
            # Get current timestamp
            now = int(datetime.utcnow().timestamp())
            
            # Get messages ready for retry
            ready_messages = await self.redis.zrangebyscore(
                self.retry_key, 0, now
            )
            
            for message_id in ready_messages:
                # Remove from retry queue
                await self.redis.zrem(self.retry_key, message_id)
                
                # Add back to main queue with lower priority
                await self.enqueue(int(message_id), priority=10)
                
        except Exception as e:
            logger.error(f"Error processing retry queue: {e}")
            
    async def _process_message(self, message_id: int):
        """Process a single message"""
        async with self.async_session() as session:
            try:
                # Get message from database
                result = await session.execute(
                    select(Message).where(Message.id == message_id)
                )
                message = result.scalar_one_or_none()
                
                if not message:
                    logger.error(f"Message {message_id} not found")
                    await self.mark_completed(message_id)
                    return
                    
                # Update status
                message.status = 'processing'
                await session.commit()
                
                # Deliver message
                success = await self.delivery_agent.deliver(message, session)
                
                if success:
                    # Mark as sent
                    message.status = 'sent'
                    message.delivered_at = datetime.utcnow()
                    await session.commit()
                    
                    await self.mark_completed(message_id)
                    
                else:
                    # Check retry attempts
                    message.attempts += 1
                    
                    if message.attempts >= settings.retry_attempts:
                        # Max retries reached
                        message.status = 'failed'
                        await session.commit()
                        
                        await self.mark_completed(message_id)
                        
                    else:
                        # Schedule retry
                        retry_delay = self._calculate_retry_delay(message.attempts)
                        message.next_retry = datetime.utcnow() + timedelta(seconds=retry_delay)
                        message.status = 'queued'
                        await session.commit()
                        
                        await self.requeue_failed(message_id, retry_delay)
                        
            except Exception as e:
                logger.error(f"Error processing message {message_id}: {e}")
                await self.requeue_failed(message_id)
                
    def _calculate_retry_delay(self, attempt: int) -> int:
        """Calculate exponential backoff delay"""
        # Exponential backoff: 5min, 15min, 45min, 2h, 6h, 12h, 24h
        delays = [300, 900, 2700, 7200, 21600, 43200, 86400]
        
        if attempt <= len(delays):
            return delays[attempt - 1]
        else:
            return delays[-1]
            
    async def get_queue_stats(self) -> Dict:
        """Get queue statistics"""
        try:
            queued = await self.redis.zcard(self.queue_key)
            processing = await self.redis.scard(self.processing_key)
            retry = await self.redis.zcard(self.retry_key)
            
            return {
                'queued': queued,
                'processing': processing,
                'retry': retry,
                'total': queued + processing + retry
            }
            
        except Exception as e:
            logger.error(f"Error getting queue stats: {e}")
            return {
                'queued': 0,
                'processing': 0,
                'retry': 0,
                'total': 0
            }
            
    async def cleanup_stale_processing(self, timeout: int = 3600):
        """Clean up stale processing entries"""
        try:
            # Get all processing message IDs
            processing = await self.redis.smembers(self.processing_key)
            
            async with self.async_session() as session:
                for message_id in processing:
                    # Check if message is actually still processing
                    result = await session.execute(
                        select(Message).where(
                            Message.id == int(message_id),
                            Message.status == 'processing'
                        )
                    )
                    message = result.scalar_one_or_none()
                    
                    if not message:
                        # Remove from processing
                        await self.redis.srem(self.processing_key, message_id)
                        
                    elif message.updated_at:
                        # Check if it's been processing too long
                        if (datetime.utcnow() - message.updated_at).seconds > timeout:
                            # Requeue for retry
                            await self.requeue_failed(int(message_id))
                            
        except Exception as e:
            logger.error(f"Error cleaning up stale processing: {e}")
            
    async def stop(self):
        """Stop queue processing"""
        self.processing = False
        logger.info("Queue processor stopped")
from celery import Task
from celery_app import celery_app
from email_sender import email_sender
from database import SessionLocal
from models import Campaign, Email, EmailEvent, SMTPProvider, Subscriber
from datetime import datetime, timedelta
from sqlalchemy import and_
import asyncio
import logging
import uuid

logger = logging.getLogger(__name__)


class CallbackTask(Task):
    """Task with callbacks for success/failure"""
    
    def on_success(self, retval, task_id, args, kwargs):
        """Success callback"""
        logger.info(f"Task {task_id} succeeded with result: {retval}")
        
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Failure callback"""
        logger.error(f"Task {task_id} failed with exception: {exc}")


@celery_app.task(base=CallbackTask, bind=True, max_retries=3)
def send_single_email(self, email_id: int):
    """Send a single email"""
    
    db = SessionLocal()
    try:
        # Get email record
        email = db.query(Email).filter(Email.id == email_id).first()
        if not email:
            logger.error(f"Email {email_id} not found")
            return
            
        # Get campaign
        campaign = email.campaign
        
        # Get subscriber data if available
        subscriber_data = {}
        if email.subscriber:
            subscriber_data = {
                'email': email.subscriber.email,
                'first_name': email.subscriber.first_name or '',
                'last_name': email.subscriber.last_name or '',
                'tracking_id': email.uuid,
                **(email.subscriber.custom_fields or {})
            }
        else:
            subscriber_data = {
                'email': email.to_email,
                'tracking_id': email.uuid
            }
            
        # Send email
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        result = loop.run_until_complete(
            email_sender.send_email(
                to_email=email.to_email,
                subject=email.subject,
                html_content=campaign.html_content,
                text_content=campaign.text_content,
                from_email=campaign.from_email,
                from_name=campaign.from_name,
                reply_to=campaign.reply_to,
                tracking_id=email.uuid
            )
        )
        
        # Update email status
        if result['success']:
            email.status = 'sent'
            email.sent_at = datetime.utcnow()
            
            # Create event
            event = EmailEvent(
                email_id=email.id,
                event_type='sent',
                metadata={'message_id': result.get('message_id')}
            )
            db.add(event)
            
            # Update campaign stats
            campaign.sent_count += 1
            
        else:
            email.status = 'failed'
            email.failed_at = datetime.utcnow()
            email.error_message = result.get('error', 'Unknown error')
            
            # Create event
            event = EmailEvent(
                email_id=email.id,
                event_type='failed',
                metadata={'error': result.get('error')}
            )
            db.add(event)
            
            # Update campaign stats
            campaign.failed_count += 1
            
            # Retry if temporary failure
            if self.request.retries < self.max_retries:
                raise self.retry(countdown=60 * (self.request.retries + 1))
                
        db.commit()
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error sending email {email_id}: {str(e)}")
        raise
        
    finally:
        db.close()
        

@celery_app.task
def send_campaign_emails(campaign_id: int):
    """Send all emails for a campaign"""
    
    db = SessionLocal()
    try:
        # Get campaign
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            logger.error(f"Campaign {campaign_id} not found")
            return
            
        # Update campaign status
        campaign.status = 'sending'
        campaign.started_at = datetime.utcnow()
        db.commit()
        
        # Get all pending emails for this campaign
        emails = db.query(Email).filter(
            and_(
                Email.campaign_id == campaign_id,
                Email.status == 'pending'
            )
        ).all()
        
        # Queue each email
        for email in emails:
            send_single_email.delay(email.id)
            
        logger.info(f"Queued {len(emails)} emails for campaign {campaign_id}")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error sending campaign {campaign_id}: {str(e)}")
        
        # Update campaign status
        campaign.status = 'failed'
        db.commit()
        
    finally:
        db.close()
        

@celery_app.task
def process_scheduled_campaigns():
    """Process campaigns scheduled to be sent"""
    
    db = SessionLocal()
    try:
        # Find campaigns that should be sent
        now = datetime.utcnow()
        campaigns = db.query(Campaign).filter(
            and_(
                Campaign.status == 'scheduled',
                Campaign.scheduled_at <= now
            )
        ).all()
        
        for campaign in campaigns:
            logger.info(f"Processing scheduled campaign {campaign.id}")
            send_campaign_emails.delay(campaign.id)
            
    except Exception as e:
        logger.error(f"Error processing scheduled campaigns: {str(e)}")
        
    finally:
        db.close()
        

@celery_app.task
def check_campaign_completion(campaign_id: int):
    """Check if a campaign has completed sending"""
    
    db = SessionLocal()
    try:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            return
            
        # Check if all emails have been processed
        pending_count = db.query(Email).filter(
            and_(
                Email.campaign_id == campaign_id,
                Email.status == 'pending'
            )
        ).count()
        
        if pending_count == 0 and campaign.status == 'sending':
            campaign.status = 'completed'
            campaign.completed_at = datetime.utcnow()
            db.commit()
            
            logger.info(f"Campaign {campaign_id} completed")
            
    except Exception as e:
        logger.error(f"Error checking campaign completion: {str(e)}")
        
    finally:
        db.close()
        

@celery_app.task
def process_email_events(event_data: dict):
    """Process email tracking events"""
    
    db = SessionLocal()
    try:
        # Find email by tracking ID
        email = db.query(Email).filter(Email.uuid == event_data['tracking_id']).first()
        if not email:
            logger.warning(f"Email not found for tracking ID: {event_data['tracking_id']}")
            return
            
        # Create event record
        event = EmailEvent(
            email_id=email.id,
            event_type=event_data['event_type'],
            ip_address=event_data.get('ip_address'),
            user_agent=event_data.get('user_agent'),
            url=event_data.get('url'),
            metadata=event_data.get('metadata', {})
        )
        db.add(event)
        
        # Update email stats
        campaign = email.campaign
        
        if event_data['event_type'] == 'opened':
            if email.open_count == 0:
                email.opened_at = datetime.utcnow()
                campaign.opened_count += 1
            email.open_count += 1
            
        elif event_data['event_type'] == 'clicked':
            if email.click_count == 0:
                email.clicked_at = datetime.utcnow()
                campaign.clicked_count += 1
            email.click_count += 1
            
        elif event_data['event_type'] == 'bounced':
            email.status = 'bounced'
            campaign.bounced_count += 1
            
            # Update subscriber status
            if email.subscriber:
                email.subscriber.status = 'bounced'
                
        elif event_data['event_type'] == 'complained':
            # Update subscriber status
            if email.subscriber:
                email.subscriber.status = 'complained'
                
        elif event_data['event_type'] == 'unsubscribed':
            campaign.unsubscribed_count += 1
            
            # Update subscriber status
            if email.subscriber:
                email.subscriber.status = 'unsubscribed'
                email.subscriber.unsubscribed_at = datetime.utcnow()
                
        db.commit()
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error processing email event: {str(e)}")
        
    finally:
        db.close()
        

@celery_app.task
def reset_smtp_limits():
    """Reset SMTP provider limits"""
    
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        
        # Reset hourly limits
        providers = db.query(SMTPProvider).filter(SMTPProvider.is_active == True).all()
        
        for provider in providers:
            # Reset hourly limit
            if not provider.last_reset_hour or (now - provider.last_reset_hour).seconds >= 3600:
                provider.emails_sent_this_hour = 0
                provider.last_reset_hour = now
                
            # Reset daily limit
            if not provider.last_reset_date or provider.last_reset_date.date() != now.date():
                provider.emails_sent_today = 0
                provider.last_reset_date = now
                
        db.commit()
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error resetting SMTP limits: {str(e)}")
        
    finally:
        db.close()
        

@celery_app.task
def cleanup_old_events(days: int = 90):
    """Clean up old email events"""
    
    db = SessionLocal()
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Delete old events
        deleted = db.query(EmailEvent).filter(
            EmailEvent.timestamp < cutoff_date
        ).delete()
        
        db.commit()
        
        logger.info(f"Deleted {deleted} old email events")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error cleaning up old events: {str(e)}")
        
    finally:
        db.close()
        

@celery_app.task
def import_subscribers_csv(file_path: str, email_list_id: int):
    """Import subscribers from CSV file"""
    
    import pandas as pd
    
    db = SessionLocal()
    try:
        # Read CSV
        df = pd.read_csv(file_path)
        
        # Process each row
        added = 0
        skipped = 0
        
        for _, row in df.iterrows():
            email = row.get('email', '').strip().lower()
            if not email:
                continue
                
            # Check if subscriber already exists
            existing = db.query(Subscriber).filter(
                and_(
                    Subscriber.email == email,
                    Subscriber.email_list_id == email_list_id
                )
            ).first()
            
            if existing:
                skipped += 1
                continue
                
            # Create new subscriber
            subscriber = Subscriber(
                email=email,
                first_name=row.get('first_name', '').strip(),
                last_name=row.get('last_name', '').strip(),
                email_list_id=email_list_id,
                custom_fields={k: v for k, v in row.items() 
                              if k not in ['email', 'first_name', 'last_name']}
            )
            db.add(subscriber)
            added += 1
            
        # Update list count
        email_list = db.query(EmailList).filter(EmailList.id == email_list_id).first()
        if email_list:
            email_list.subscriber_count = db.query(Subscriber).filter(
                Subscriber.email_list_id == email_list_id
            ).count()
            
        db.commit()
        
        logger.info(f"Imported {added} subscribers, skipped {skipped}")
        
        return {'added': added, 'skipped': skipped}
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error importing subscribers: {str(e)}")
        raise
        
    finally:
        db.close()
from celery import Celery
from config import settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Celery instance
celery_app = Celery(
    'bulk_email_sender',
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=['tasks']
)

# Configure Celery
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    
    # Task routing
    task_routes={
        'tasks.send_campaign_emails': {'queue': 'high_priority'},
        'tasks.send_single_email': {'queue': 'default'},
        'tasks.process_email_events': {'queue': 'low_priority'},
    },
    
    # Rate limiting
    task_annotations={
        'tasks.send_single_email': {
            'rate_limit': f'{settings.rate_limit_per_minute}/m'
        }
    },
    
    # Retry configuration
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    
    # Beat schedule for periodic tasks
    beat_schedule={
        'reset-smtp-limits': {
            'task': 'tasks.reset_smtp_limits',
            'schedule': 3600.0,  # Every hour
        },
        'process-scheduled-campaigns': {
            'task': 'tasks.process_scheduled_campaigns',
            'schedule': 60.0,  # Every minute
        },
        'cleanup-old-events': {
            'task': 'tasks.cleanup_old_events',
            'schedule': 86400.0,  # Daily
        },
    }
)

if __name__ == '__main__':
    celery_app.start()
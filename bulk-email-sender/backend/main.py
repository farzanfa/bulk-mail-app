from fastapi import FastAPI, HTTPException, Depends, status, Request, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import logging
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from database import get_db, engine
from models import Base, User, Campaign, Email, EmailList, Subscriber, Template
from config import settings
from auth import get_current_user, create_access_token, verify_password, get_password_hash
from schemas import (
    UserCreate, UserResponse, Token,
    CampaignCreate, CampaignResponse, CampaignUpdate,
    EmailListCreate, EmailListResponse,
    SubscriberCreate, SubscriberResponse,
    TemplateCreate, TemplateResponse,
    BulkEmailRequest, EmailTrackingEvent
)
from tasks import send_campaign_emails, import_subscribers_csv, process_email_events
import base64

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="Bulk Email Sender API",
    description="Professional bulk email sending service with tracking and analytics",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}


# Authentication endpoints
@app.post("/auth/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user exists
    existing_user = db.query(User).filter(
        (User.email == user.email) | (User.username == user.username)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists"
        )
    
    # Create new user
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=get_password_hash(user.password)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


@app.post("/auth/login", response_model=Token)
async def login(username: str, password: str, db: Session = Depends(get_db)):
    """Login and get access token"""
    user = db.query(User).filter(User.username == username).first()
    
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token = create_access_token(data={"sub": user.username})
    
    return {"access_token": access_token, "token_type": "bearer"}


# Campaign endpoints
@app.post("/campaigns", response_model=CampaignResponse)
async def create_campaign(
    campaign: CampaignCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new email campaign"""
    db_campaign = Campaign(
        **campaign.dict(exclude={'send_immediately'}),
        user_id=current_user.id,
        status='draft' if not campaign.send_immediately else 'queued'
    )
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    
    # Create email records for all subscribers in the list
    if campaign.email_list_id:
        subscribers = db.query(Subscriber).filter(
            Subscriber.email_list_id == campaign.email_list_id,
            Subscriber.status == 'active'
        ).all()
        
        for subscriber in subscribers:
            email = Email(
                campaign_id=db_campaign.id,
                subscriber_id=subscriber.id,
                to_email=subscriber.email,
                subject=campaign.subject
            )
            db.add(email)
            
        db_campaign.total_recipients = len(subscribers)
        db.commit()
    
    # Queue for sending if requested
    if campaign.send_immediately:
        background_tasks.add_task(send_campaign_emails, db_campaign.id)
    
    return db_campaign


@app.get("/campaigns", response_model=List[CampaignResponse])
async def list_campaigns(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all campaigns for the current user"""
    campaigns = db.query(Campaign).filter(
        Campaign.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return campaigns


@app.get("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific campaign"""
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.user_id == current_user.id
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    return campaign


@app.patch("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: int,
    campaign_update: CampaignUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a campaign"""
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.user_id == current_user.id
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    if campaign.status not in ['draft', 'scheduled']:
        raise HTTPException(
            status_code=400, 
            detail="Cannot update campaign that is already sending or completed"
        )
    
    for field, value in campaign_update.dict(exclude_unset=True).items():
        setattr(campaign, field, value)
    
    db.commit()
    db.refresh(campaign)
    
    return campaign


@app.post("/campaigns/{campaign_id}/send")
async def send_campaign(
    campaign_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a campaign"""
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.user_id == current_user.id
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    if campaign.status != 'draft':
        raise HTTPException(
            status_code=400,
            detail=f"Campaign is already {campaign.status}"
        )
    
    # Queue campaign for sending
    campaign.status = 'queued'
    db.commit()
    
    background_tasks.add_task(send_campaign_emails, campaign_id)
    
    return {"message": "Campaign queued for sending"}


# Email list endpoints
@app.post("/email-lists", response_model=EmailListResponse)
async def create_email_list(
    email_list: EmailListCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new email list"""
    db_list = EmailList(**email_list.dict())
    db.add(db_list)
    db.commit()
    db.refresh(db_list)
    
    return db_list


@app.get("/email-lists", response_model=List[EmailListResponse])
async def list_email_lists(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all email lists"""
    lists = db.query(EmailList).offset(skip).limit(limit).all()
    return lists


# Subscriber endpoints
@app.post("/email-lists/{list_id}/subscribers", response_model=SubscriberResponse)
async def add_subscriber(
    list_id: int,
    subscriber: SubscriberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a subscriber to an email list"""
    # Check if list exists
    email_list = db.query(EmailList).filter(EmailList.id == list_id).first()
    if not email_list:
        raise HTTPException(status_code=404, detail="Email list not found")
    
    # Check if subscriber already exists
    existing = db.query(Subscriber).filter(
        Subscriber.email == subscriber.email,
        Subscriber.email_list_id == list_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Subscriber already exists in this list"
        )
    
    db_subscriber = Subscriber(
        **subscriber.dict(),
        email_list_id=list_id
    )
    db.add(db_subscriber)
    
    # Update list count
    email_list.subscriber_count += 1
    
    db.commit()
    db.refresh(db_subscriber)
    
    return db_subscriber


@app.post("/email-lists/{list_id}/import-csv")
async def import_subscribers(
    list_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Import subscribers from CSV file"""
    # Check if list exists
    email_list = db.query(EmailList).filter(EmailList.id == list_id).first()
    if not email_list:
        raise HTTPException(status_code=404, detail="Email list not found")
    
    # Save uploaded file
    file_path = f"/tmp/{file.filename}"
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Queue import task
    background_tasks.add_task(import_subscribers_csv, file_path, list_id)
    
    return {"message": "CSV import queued for processing"}


# Template endpoints
@app.post("/templates", response_model=TemplateResponse)
async def create_template(
    template: TemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new email template"""
    db_template = Template(**template.dict())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    
    return db_template


@app.get("/templates", response_model=List[TemplateResponse])
async def list_templates(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all email templates"""
    query = db.query(Template)
    
    if category:
        query = query.filter(Template.category == category)
    
    templates = query.offset(skip).limit(limit).all()
    return templates


# Tracking endpoints
@app.get("/track/open/{tracking_id}")
async def track_email_open(
    tracking_id: str,
    request: Request,
    background_tasks: BackgroundTasks
):
    """Track email open"""
    event_data = {
        'tracking_id': tracking_id,
        'event_type': 'opened',
        'ip_address': request.client.host,
        'user_agent': request.headers.get('user-agent')
    }
    
    background_tasks.add_task(process_email_events, event_data)
    
    # Return 1x1 transparent pixel
    pixel = base64.b64decode(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    )
    return Response(content=pixel, media_type="image/gif")


@app.get("/track/click/{tracking_id}/{encoded_url}")
async def track_email_click(
    tracking_id: str,
    encoded_url: str,
    request: Request,
    background_tasks: BackgroundTasks
):
    """Track email click and redirect"""
    # Decode URL
    try:
        original_url = base64.urlsafe_b64decode(encoded_url).decode()
    except:
        raise HTTPException(status_code=400, detail="Invalid URL")
    
    event_data = {
        'tracking_id': tracking_id,
        'event_type': 'clicked',
        'ip_address': request.client.host,
        'user_agent': request.headers.get('user-agent'),
        'url': original_url
    }
    
    background_tasks.add_task(process_email_events, event_data)
    
    # Redirect to original URL
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=original_url)


@app.post("/unsubscribe/{tracking_id}")
async def unsubscribe(
    tracking_id: str,
    request: Request,
    background_tasks: BackgroundTasks
):
    """Handle unsubscribe request"""
    event_data = {
        'tracking_id': tracking_id,
        'event_type': 'unsubscribed',
        'ip_address': request.client.host,
        'user_agent': request.headers.get('user-agent')
    }
    
    background_tasks.add_task(process_email_events, event_data)
    
    return {"message": "Successfully unsubscribed"}


# Webhook endpoints for email service providers
@app.post("/webhooks/sendgrid")
async def sendgrid_webhook(
    events: List[dict],
    background_tasks: BackgroundTasks
):
    """Process SendGrid webhook events"""
    for event in events:
        if 'tracking_id' in event:
            event_data = {
                'tracking_id': event['tracking_id'],
                'event_type': event.get('event', '').lower(),
                'metadata': event
            }
            background_tasks.add_task(process_email_events, event_data)
    
    return {"message": "Events processed"}


# Analytics endpoints
@app.get("/campaigns/{campaign_id}/analytics")
async def get_campaign_analytics(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed analytics for a campaign"""
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.user_id == current_user.id
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Calculate rates
    total = campaign.total_recipients or 1
    
    analytics = {
        'campaign_id': campaign.id,
        'campaign_name': campaign.name,
        'status': campaign.status,
        'sent_at': campaign.started_at,
        'completed_at': campaign.completed_at,
        'metrics': {
            'total_recipients': campaign.total_recipients,
            'sent': campaign.sent_count,
            'failed': campaign.failed_count,
            'opened': campaign.opened_count,
            'clicked': campaign.clicked_count,
            'bounced': campaign.bounced_count,
            'unsubscribed': campaign.unsubscribed_count
        },
        'rates': {
            'delivery_rate': (campaign.sent_count / total) * 100,
            'open_rate': (campaign.opened_count / campaign.sent_count * 100) if campaign.sent_count > 0 else 0,
            'click_rate': (campaign.clicked_count / campaign.sent_count * 100) if campaign.sent_count > 0 else 0,
            'bounce_rate': (campaign.bounced_count / campaign.sent_count * 100) if campaign.sent_count > 0 else 0,
            'unsubscribe_rate': (campaign.unsubscribed_count / campaign.sent_count * 100) if campaign.sent_count > 0 else 0
        }
    }
    
    return analytics


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
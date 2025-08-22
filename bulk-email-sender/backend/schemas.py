from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime


# User schemas
class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    username: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


# Campaign schemas
class CampaignCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    subject: str = Field(..., min_length=1, max_length=500)
    from_email: EmailStr
    from_name: Optional[str] = None
    reply_to: Optional[EmailStr] = None
    html_content: str
    text_content: Optional[str] = None
    email_list_id: int
    scheduled_at: Optional[datetime] = None
    send_immediately: bool = False
    tags: Optional[List[str]] = []
    settings: Optional[Dict[str, Any]] = {}


class CampaignUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    subject: Optional[str] = Field(None, min_length=1, max_length=500)
    from_email: Optional[EmailStr] = None
    from_name: Optional[str] = None
    reply_to: Optional[EmailStr] = None
    html_content: Optional[str] = None
    text_content: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    tags: Optional[List[str]] = None
    settings: Optional[Dict[str, Any]] = None


class CampaignResponse(BaseModel):
    id: int
    uuid: str
    name: str
    subject: str
    from_email: str
    from_name: Optional[str]
    reply_to: Optional[str]
    status: str
    scheduled_at: Optional[datetime]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    total_recipients: int
    sent_count: int
    failed_count: int
    opened_count: int
    clicked_count: int
    bounced_count: int
    unsubscribed_count: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# Email list schemas
class EmailListCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class EmailListResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    subscriber_count: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# Subscriber schemas
class SubscriberCreate(BaseModel):
    email: EmailStr
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    custom_fields: Optional[Dict[str, Any]] = {}


class SubscriberResponse(BaseModel):
    id: int
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    custom_fields: Optional[Dict[str, Any]]
    status: str
    subscribed_at: datetime
    unsubscribed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# Template schemas
class TemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    subject: Optional[str] = Field(None, max_length=500)
    html_content: str
    text_content: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = []
    thumbnail_url: Optional[str] = None


class TemplateResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    subject: Optional[str]
    html_content: str
    text_content: Optional[str]
    category: Optional[str]
    tags: Optional[List[str]]
    thumbnail_url: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# Email tracking schemas
class EmailTrackingEvent(BaseModel):
    tracking_id: str
    event_type: str
    timestamp: Optional[datetime] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}


# Bulk email request
class BulkEmailRequest(BaseModel):
    recipients: List[Dict[str, Any]]
    subject: str
    html_template: str
    text_template: Optional[str] = None
    from_email: EmailStr
    from_name: Optional[str] = None
    reply_to: Optional[EmailStr] = None
    track_opens: bool = True
    track_clicks: bool = True


# Analytics response
class CampaignAnalytics(BaseModel):
    campaign_id: int
    campaign_name: str
    status: str
    sent_at: Optional[datetime]
    completed_at: Optional[datetime]
    metrics: Dict[str, int]
    rates: Dict[str, float]
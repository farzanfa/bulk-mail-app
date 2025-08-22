from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    campaigns = relationship("Campaign", back_populates="user")


class Campaign(Base):
    __tablename__ = "campaigns"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True)
    name = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    from_email = Column(String(255), nullable=False)
    from_name = Column(String(255))
    reply_to = Column(String(255))
    
    # Content
    html_content = Column(Text)
    text_content = Column(Text)
    
    # Status
    status = Column(String(50), default="draft")  # draft, scheduled, sending, completed, failed
    scheduled_at = Column(DateTime(timezone=True))
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    # Statistics
    total_recipients = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    opened_count = Column(Integer, default=0)
    clicked_count = Column(Integer, default=0)
    bounced_count = Column(Integer, default=0)
    unsubscribed_count = Column(Integer, default=0)
    
    # Metadata
    tags = Column(JSON)
    settings = Column(JSON)  # Additional campaign settings
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="campaigns")
    emails = relationship("Email", back_populates="campaign")
    email_list_id = Column(Integer, ForeignKey("email_lists.id"))
    email_list = relationship("EmailList", back_populates="campaigns")


class EmailList(Base):
    __tablename__ = "email_lists"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    subscriber_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    subscribers = relationship("Subscriber", back_populates="email_list")
    campaigns = relationship("Campaign", back_populates="email_list")


class Subscriber(Base):
    __tablename__ = "subscribers"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    first_name = Column(String(100))
    last_name = Column(String(100))
    custom_fields = Column(JSON)  # Store additional custom fields
    
    # Status
    status = Column(String(50), default="active")  # active, unsubscribed, bounced, complained
    subscribed_at = Column(DateTime(timezone=True), server_default=func.now())
    unsubscribed_at = Column(DateTime(timezone=True))
    
    # List relationship
    email_list_id = Column(Integer, ForeignKey("email_lists.id"), nullable=False)
    email_list = relationship("EmailList", back_populates="subscribers")
    
    # Email relationship
    emails = relationship("Email", back_populates="subscriber")


class Email(Base):
    __tablename__ = "emails"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True)
    
    # Email details
    to_email = Column(String(255), nullable=False, index=True)
    subject = Column(String(500), nullable=False)
    
    # Status
    status = Column(String(50), default="pending")  # pending, sent, failed, bounced
    sent_at = Column(DateTime(timezone=True))
    delivered_at = Column(DateTime(timezone=True))
    failed_at = Column(DateTime(timezone=True))
    error_message = Column(Text)
    
    # Tracking
    opened_at = Column(DateTime(timezone=True))
    open_count = Column(Integer, default=0)
    clicked_at = Column(DateTime(timezone=True))
    click_count = Column(Integer, default=0)
    
    # Relationships
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    campaign = relationship("Campaign", back_populates="emails")
    subscriber_id = Column(Integer, ForeignKey("subscribers.id"))
    subscriber = relationship("Subscriber", back_populates="emails")
    
    # Tracking events
    events = relationship("EmailEvent", back_populates="email")


class EmailEvent(Base):
    __tablename__ = "email_events"
    
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(50), nullable=False)  # sent, delivered, opened, clicked, bounced, complained, unsubscribed
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Additional data
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    url = Column(String(500))  # For click events
    metadata = Column(JSON)
    
    # Relationship
    email_id = Column(Integer, ForeignKey("emails.id"), nullable=False)
    email = relationship("Email", back_populates="events")


class Template(Base):
    __tablename__ = "templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text)
    subject = Column(String(500))
    html_content = Column(Text, nullable=False)
    text_content = Column(Text)
    thumbnail_url = Column(String(500))
    
    # Category
    category = Column(String(100))
    tags = Column(JSON)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class SMTPProvider(Base):
    __tablename__ = "smtp_providers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    host = Column(String(255), nullable=False)
    port = Column(Integer, nullable=False)
    username = Column(String(255), nullable=False)
    password = Column(String(255), nullable=False)
    use_tls = Column(Boolean, default=True)
    use_ssl = Column(Boolean, default=False)
    
    # Limits
    daily_limit = Column(Integer)
    hourly_limit = Column(Integer)
    
    # Statistics
    emails_sent_today = Column(Integer, default=0)
    emails_sent_this_hour = Column(Integer, default=0)
    last_reset_date = Column(DateTime(timezone=True))
    last_reset_hour = Column(DateTime(timezone=True))
    
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=0)  # Higher priority = preferred provider
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
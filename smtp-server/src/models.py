from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON, Float, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import uuid

Base = declarative_base()


class Domain(Base):
    __tablename__ = "domains"
    
    id = Column(Integer, primary_key=True)
    domain = Column(String(255), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    dkim_selector = Column(String(63), default="default")
    dkim_private_key = Column(Text)
    dkim_public_key = Column(Text)
    
    # SPF record
    spf_record = Column(String(255))
    
    # DMARC settings
    dmarc_policy = Column(String(20), default="none")  # none, quarantine, reject
    dmarc_rua = Column(String(255))  # Aggregate reports email
    dmarc_ruf = Column(String(255))  # Forensic reports email
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    users = relationship("User", back_populates="domain")
    messages = relationship("Message", back_populates="domain")


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    username = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    
    # Quotas
    message_quota = Column(Integer, default=1000)  # Messages per day
    storage_quota = Column(Integer, default=1073741824)  # 1GB in bytes
    messages_sent_today = Column(Integer, default=0)
    storage_used = Column(Integer, default=0)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    last_login = Column(DateTime(timezone=True))
    
    # Rate limiting
    failed_auth_attempts = Column(Integer, default=0)
    last_failed_auth = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    domain_id = Column(Integer, ForeignKey("domains.id"))
    domain = relationship("Domain", back_populates="users")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    authentication_logs = relationship("AuthenticationLog", back_populates="user")


class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True)
    message_id = Column(String(255), unique=True, nullable=False, index=True)
    
    # Envelope
    mail_from = Column(String(255), nullable=False, index=True)
    rcpt_to = Column(JSON, nullable=False)  # List of recipients
    
    # Headers
    subject = Column(String(500))
    from_header = Column(String(255))
    to_header = Column(Text)
    cc_header = Column(Text)
    date_header = Column(DateTime(timezone=True))
    
    # Content
    headers = Column(JSON)  # All headers as dict
    body_text = Column(Text)
    body_html = Column(Text)
    raw_message = Column(Text)  # Full raw message
    size = Column(Integer)
    
    # Status
    status = Column(String(20), default="queued")  # queued, processing, sent, failed, bounced
    attempts = Column(Integer, default=0)
    last_attempt = Column(DateTime(timezone=True))
    next_retry = Column(DateTime(timezone=True))
    
    # Authentication results
    spf_result = Column(String(20))  # pass, fail, softfail, neutral, none
    dkim_result = Column(String(20))  # pass, fail, none
    dmarc_result = Column(String(20))  # pass, fail, none
    
    # Delivery info
    delivered_at = Column(DateTime(timezone=True))
    delivery_response = Column(Text)
    remote_ip = Column(String(45))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    sender_id = Column(Integer, ForeignKey("users.id"))
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    domain_id = Column(Integer, ForeignKey("domains.id"))
    domain = relationship("Domain", back_populates="messages")
    delivery_attempts = relationship("DeliveryAttempt", back_populates="message")
    
    # Indexes
    __table_args__ = (
        Index("idx_message_status_next_retry", "status", "next_retry"),
        Index("idx_message_created_at", "created_at"),
    )


class DeliveryAttempt(Base):
    __tablename__ = "delivery_attempts"
    
    id = Column(Integer, primary_key=True)
    message_id = Column(Integer, ForeignKey("messages.id"), nullable=False)
    attempt_number = Column(Integer, nullable=False)
    
    # Target server info
    mx_hostname = Column(String(255))
    mx_priority = Column(Integer)
    remote_ip = Column(String(45))
    remote_port = Column(Integer)
    
    # TLS info
    tls_version = Column(String(10))
    cipher_suite = Column(String(100))
    
    # Result
    status_code = Column(Integer)
    response = Column(Text)
    error_message = Column(Text)
    success = Column(Boolean, default=False)
    
    # Timing
    connection_time = Column(Float)  # seconds
    delivery_time = Column(Float)  # seconds
    
    attempted_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    message = relationship("Message", back_populates="delivery_attempts")


class Connection(Base):
    __tablename__ = "connections"
    
    id = Column(Integer, primary_key=True)
    remote_ip = Column(String(45), nullable=False, index=True)
    remote_port = Column(Integer)
    
    # Connection info
    helo_hostname = Column(String(255))
    protocol = Column(String(10))  # SMTP, ESMTP
    tls_enabled = Column(Boolean, default=False)
    authenticated = Column(Boolean, default=False)
    authenticated_user = Column(String(255))
    
    # Stats
    messages_sent = Column(Integer, default=0)
    bytes_received = Column(Integer, default=0)
    commands_received = Column(Integer, default=0)
    
    # Reputation
    reputation_score = Column(Float, default=0.0)
    is_blocked = Column(Boolean, default=False)
    block_reason = Column(String(255))
    
    # GeoIP info
    country_code = Column(String(2))
    country_name = Column(String(100))
    city = Column(String(100))
    
    connected_at = Column(DateTime(timezone=True), server_default=func.now())
    disconnected_at = Column(DateTime(timezone=True))
    
    # Indexes
    __table_args__ = (
        Index("idx_connection_ip_time", "remote_ip", "connected_at"),
    )


class AuthenticationLog(Base):
    __tablename__ = "authentication_logs"
    
    id = Column(Integer, primary_key=True)
    username = Column(String(255), nullable=False, index=True)
    auth_method = Column(String(20))  # PLAIN, LOGIN, CRAM-MD5
    success = Column(Boolean, nullable=False)
    failure_reason = Column(String(255))
    
    remote_ip = Column(String(45), nullable=False)
    user_agent = Column(String(255))
    
    attempted_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="authentication_logs")
    
    # Index
    __table_args__ = (
        Index("idx_auth_log_ip_time", "remote_ip", "attempted_at"),
    )


class Greylist(Base):
    __tablename__ = "greylist"
    
    id = Column(Integer, primary_key=True)
    sender_ip = Column(String(45), nullable=False)
    sender_email = Column(String(255), nullable=False)
    recipient_email = Column(String(255), nullable=False)
    
    first_seen = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True))
    pass_count = Column(Integer, default=0)
    is_whitelisted = Column(Boolean, default=False)
    
    # Unique constraint
    __table_args__ = (
        Index("idx_greylist_triple", "sender_ip", "sender_email", "recipient_email", unique=True),
    )


class Blacklist(Base):
    __tablename__ = "blacklist"
    
    id = Column(Integer, primary_key=True)
    entry_type = Column(String(20), nullable=False)  # ip, domain, email
    value = Column(String(255), nullable=False, unique=True, index=True)
    reason = Column(String(500))
    
    # Automatic expiry
    expires_at = Column(DateTime(timezone=True))
    
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    added_by = Column(String(255))


class RateLimit(Base):
    __tablename__ = "rate_limits"
    
    id = Column(Integer, primary_key=True)
    identifier = Column(String(255), nullable=False, unique=True)  # IP, user, domain
    identifier_type = Column(String(20), nullable=False)  # ip, user, domain
    
    # Counters
    messages_hour = Column(Integer, default=0)
    messages_day = Column(Integer, default=0)
    connections_minute = Column(Integer, default=0)
    
    # Reset times
    hour_reset = Column(DateTime(timezone=True))
    day_reset = Column(DateTime(timezone=True))
    minute_reset = Column(DateTime(timezone=True))
    
    # Violations
    violations = Column(Integer, default=0)
    last_violation = Column(DateTime(timezone=True))
    is_blocked = Column(Boolean, default=False)
    block_until = Column(DateTime(timezone=True))
    
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class SpamScore(Base):
    __tablename__ = "spam_scores"
    
    id = Column(Integer, primary_key=True)
    message_id = Column(String(255), ForeignKey("messages.message_id"), unique=True)
    
    # Spam checks
    total_score = Column(Float, default=0.0)
    spam_threshold = Column(Float, default=5.0)
    is_spam = Column(Boolean, default=False)
    
    # Individual scores
    scores = Column(JSON)  # Dict of check_name: score
    
    # Rules triggered
    rules_triggered = Column(JSON)  # List of rule names
    
    checked_at = Column(DateTime(timezone=True), server_default=func.now())
from pydantic_settings import BaseSettings
from pydantic import EmailStr, Field
from typing import Optional
import os


class Settings(BaseSettings):
    # Application Settings
    app_name: str = "BulkEmailSender"
    app_env: str = "development"
    secret_key: str
    api_key: str
    
    # Database
    database_url: str
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # SMTP Configuration
    smtp_host: str
    smtp_port: int = 587
    smtp_username: str
    smtp_password: str
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False
    
    # Email Settings
    from_email: EmailStr
    from_name: str
    daily_email_limit: int = 1000
    rate_limit_per_minute: int = 10
    
    # Security
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Tracking
    enable_tracking: bool = True
    tracking_domain: str = "http://localhost:8000"
    
    # DKIM Settings
    dkim_private_key_path: Optional[str] = None
    dkim_selector: Optional[str] = "default"
    dkim_domain: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Create settings instance
settings = Settings()
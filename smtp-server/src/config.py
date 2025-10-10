from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import List, Optional
import os


class Settings(BaseSettings):
    # Server Configuration
    server_hostname: str = "mail.example.com"
    server_domain: str = "example.com"
    server_ip: str = "0.0.0.0"
    smtp_port: int = 25
    smtp_tls_port: int = 587
    smtp_ssl_port: int = 465
    submission_port: int = 587
    
    # Authentication
    enable_auth: bool = True
    auth_methods: List[str] = Field(default_factory=lambda: ["PLAIN", "LOGIN"])
    
    # TLS/SSL
    tls_cert_path: Optional[str] = None
    tls_key_path: Optional[str] = None
    tls_ca_path: Optional[str] = None
    enable_starttls: bool = True
    require_tls: bool = False
    
    # Database
    database_url: str
    redis_url: str = "redis://localhost:6379/0"
    
    # Queue Configuration
    max_queue_size: int = 10000
    retry_attempts: int = 3
    retry_delay_seconds: int = 300
    message_retention_days: int = 7
    
    # Rate Limiting
    max_recipients_per_message: int = 100
    max_messages_per_hour: int = 1000
    max_messages_per_day: int = 10000
    max_connection_rate: int = 10
    max_auth_attempts: int = 3
    
    # DKIM Configuration
    dkim_private_key_path: Optional[str] = None
    dkim_selector: str = "default"
    enable_dkim_signing: bool = True
    
    # SPF Configuration
    spf_checking: bool = True
    spf_failure_policy: str = "softfail"  # none, softfail, fail
    
    # DMARC Configuration
    dmarc_checking: bool = True
    dmarc_failure_policy: str = "quarantine"  # none, quarantine, reject
    
    # Delivery Settings
    max_delivery_threads: int = 10
    connection_timeout: int = 30
    data_timeout: int = 300
    delivery_retry_interval: int = 300
    
    # Logging
    log_level: str = "INFO"
    log_file: str = "/var/log/smtp-server/smtp.log"
    log_max_size: str = "100MB"
    log_backup_count: int = 10
    
    # Web Interface
    web_interface_enabled: bool = True
    web_interface_port: int = 8080
    api_key: str
    
    # Spam Prevention
    enable_greylisting: bool = True
    greylist_delay_minutes: int = 5
    enable_rate_limiting: bool = True
    enable_blacklist_check: bool = True
    blacklist_servers: List[str] = Field(
        default_factory=lambda: ["zen.spamhaus.org", "bl.spamcop.net"]
    )
    
    # Storage
    mail_storage_path: str = "/var/mail/smtp-server"
    max_message_size: int = 26214400  # 25MB
    
    # Monitoring
    enable_metrics: bool = True
    metrics_port: int = 9090
    
    # GeoIP
    geoip_database_path: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    @validator("auth_methods", pre=True)
    def parse_auth_methods(cls, v):
        if isinstance(v, str):
            return [method.strip() for method in v.split(",")]
        return v
    
    @validator("blacklist_servers", pre=True)
    def parse_blacklist_servers(cls, v):
        if isinstance(v, str):
            return [server.strip() for server in v.split(",")]
        return v
    
    @validator("log_max_size")
    def parse_log_max_size(cls, v):
        """Convert human-readable size to bytes"""
        if isinstance(v, str):
            v = v.upper()
            if v.endswith("KB"):
                return int(v[:-2]) * 1024
            elif v.endswith("MB"):
                return int(v[:-2]) * 1024 * 1024
            elif v.endswith("GB"):
                return int(v[:-2]) * 1024 * 1024 * 1024
        return int(v)


# Create settings instance
settings = Settings()
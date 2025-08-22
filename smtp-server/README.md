# Custom SMTP Server - Enterprise Email Infrastructure

A production-ready SMTP server built with Python, featuring authentication, spam filtering, rate limiting, and full email authentication support (SPF, DKIM, DMARC).

## 🚀 Features

### Core SMTP Features
- **Full SMTP Protocol Support**: Implements SMTP, ESMTP with STARTTLS
- **Authentication**: PLAIN, LOGIN, and CRAM-MD5 authentication methods
- **TLS/SSL Encryption**: STARTTLS support for secure connections
- **Multi-domain Support**: Host multiple domains on one server
- **IPv4/IPv6 Support**: Full dual-stack implementation

### Security & Anti-Spam
- **SPF Verification**: Validate sender policy framework
- **DKIM Signing/Verification**: Sign outgoing mail, verify incoming
- **DMARC Policy Enforcement**: Full DMARC support
- **Spam Filtering**: Built-in spam detection with scoring
- **Rate Limiting**: Connection and message rate limiting
- **Blacklist Checking**: RBL/DNSBL support
- **Greylisting**: Optional greylisting for spam prevention

### Reliability & Performance
- **Queue Management**: Redis-based reliable message queue
- **Retry Logic**: Exponential backoff for failed deliveries
- **Connection Pooling**: Efficient connection management
- **Async Architecture**: Built on asyncio for high performance
- **Database Backend**: PostgreSQL for persistent storage

### Monitoring & Management
- **Delivery Tracking**: Full delivery status tracking
- **Metrics**: Prometheus-compatible metrics
- **Logging**: Comprehensive logging system
- **Web Interface**: Management dashboard (optional)

## 📋 Requirements

- Python 3.8+
- PostgreSQL 12+
- Redis 5+
- Valid domain with DNS control
- SSL certificate (for TLS)

## 🛠️ Installation

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/smtp-server.git
cd smtp-server
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
```bash
cp config/.env.example config/.env
# Edit config/.env with your settings
```

### 4. Set Up Database
```bash
# Create PostgreSQL database
createdb smtp_server_db

# Run migrations (if using Alembic)
alembic upgrade head
```

### 5. Generate DKIM Keys
```bash
python scripts/generate_dkim_keys.py yourdomain.com
```

## 🚦 Configuration

### Basic Configuration

Edit `config/.env`:

```env
# Server Settings
SERVER_HOSTNAME=mail.yourdomain.com
SERVER_DOMAIN=yourdomain.com
SMTP_PORT=25
SUBMISSION_PORT=587

# Database
DATABASE_URL=postgresql://user:pass@localhost/smtp_server_db
REDIS_URL=redis://localhost:6379/0

# TLS/SSL
TLS_CERT_PATH=/etc/ssl/certs/mail.crt
TLS_KEY_PATH=/etc/ssl/private/mail.key

# Authentication
ENABLE_AUTH=true
AUTH_METHODS=PLAIN,LOGIN

# Rate Limiting
MAX_MESSAGES_PER_HOUR=1000
MAX_MESSAGES_PER_DAY=10000
```

### DNS Configuration

Add these DNS records to your domain:

#### MX Record
```
yourdomain.com.  IN  MX  10  mail.yourdomain.com.
```

#### A Record
```
mail.yourdomain.com.  IN  A  YOUR_SERVER_IP
```

#### SPF Record
```
yourdomain.com.  IN  TXT  "v=spf1 mx a ip4:YOUR_SERVER_IP -all"
```

#### DKIM Record
```
default._domainkey.yourdomain.com.  IN  TXT  "v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY"
```

#### DMARC Record
```
_dmarc.yourdomain.com.  IN  TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
```

#### Reverse DNS (PTR)
Contact your ISP to set up reverse DNS:
```
YOUR_SERVER_IP -> mail.yourdomain.com
```

## 🏃‍♂️ Running the Server

### Development Mode
```bash
cd src
python smtp_server.py
```

### Production Mode

Using systemd service:

```bash
sudo cp scripts/smtp-server.service /etc/systemd/system/
sudo systemctl enable smtp-server
sudo systemctl start smtp-server
```

### Docker Deployment
```bash
docker build -t smtp-server .
docker run -d \
  -p 25:25 \
  -p 587:587 \
  -v /path/to/config:/app/config \
  -v /path/to/logs:/var/log/smtp-server \
  smtp-server
```

## 📊 Usage

### Creating Users

```python
from src.auth_handler import AuthHandler

auth = AuthHandler()
password_hash = auth.hash_password("secure_password")

# Add user to database
# INSERT INTO users (username, email, password_hash) 
# VALUES ('john', 'john@yourdomain.com', password_hash)
```

### Sending Email

Configure your email client:
- **Server**: mail.yourdomain.com
- **Port**: 587 (submission)
- **Security**: STARTTLS
- **Username**: Your username
- **Password**: Your password

### Monitoring

View server metrics:
```bash
curl http://localhost:9090/metrics
```

Check queue status:
```bash
redis-cli
> ZCARD smtp:queue:messages
> SCARD smtp:queue:processing
```

## 🔒 Security Best Practices

1. **Firewall Rules**
   ```bash
   # Allow SMTP
   sudo ufw allow 25/tcp
   sudo ufw allow 587/tcp
   
   # Block direct database access
   sudo ufw deny 5432/tcp
   ```

2. **Fail2ban Configuration**
   ```ini
   [smtp-auth]
   enabled = true
   port = 25,587
   filter = smtp-auth
   logpath = /var/log/smtp-server/smtp.log
   maxretry = 5
   ```

3. **SSL/TLS Configuration**
   - Use certificates from Let's Encrypt
   - Enable only TLS 1.2+
   - Use strong cipher suites

4. **Regular Updates**
   - Keep Python packages updated
   - Monitor security advisories
   - Regular security audits

## 📈 Performance Tuning

### PostgreSQL Optimization
```sql
-- Increase connection pool
ALTER SYSTEM SET max_connections = 200;

-- Optimize for SSD
ALTER SYSTEM SET random_page_cost = 1.1;

-- Increase shared buffers
ALTER SYSTEM SET shared_buffers = '256MB';
```

### Redis Optimization
```conf
# /etc/redis/redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save ""  # Disable persistence for queue
```

### System Tuning
```bash
# Increase file descriptors
echo "* soft nofile 65535" >> /etc/security/limits.conf
echo "* hard nofile 65535" >> /etc/security/limits.conf

# TCP tuning
echo "net.core.somaxconn = 1024" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 2048" >> /etc/sysctl.conf
```

## 🐛 Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check firewall rules
   - Verify server is running
   - Check bind address

2. **Authentication Failed**
   - Verify credentials
   - Check auth methods enabled
   - Review auth logs

3. **Emails Going to Spam**
   - Verify SPF, DKIM, DMARC records
   - Check server IP reputation
   - Review spam filter scores

4. **High Queue Size**
   - Check delivery logs
   - Verify DNS resolution
   - Monitor retry queue

### Debug Mode
```bash
LOG_LEVEL=DEBUG python smtp_server.py
```

### Log Analysis
```bash
# Authentication failures
grep "AUTH.*failed" /var/log/smtp-server/smtp.log

# Delivery failures
grep "delivery.*failed" /var/log/smtp-server/smtp.log

# Spam blocks
grep "spam.*rejected" /var/log/smtp-server/smtp.log
```

## 📝 API Reference

### SMTP Commands Supported
- HELO/EHLO
- MAIL FROM
- RCPT TO
- DATA
- AUTH (PLAIN, LOGIN, CRAM-MD5)
- STARTTLS
- RSET
- NOOP
- QUIT
- VRFY (optional)

### Extended Features
- SIZE declaration
- 8BITMIME
- PIPELINING
- ENHANCEDSTATUSCODES

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## ⚠️ Disclaimer

Running an email server requires:
- Proper DNS configuration
- IP reputation management
- Compliance with anti-spam laws
- Regular monitoring and maintenance

Ensure you understand the responsibilities before deploying in production.
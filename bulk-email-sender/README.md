# Bulk Email Sender - Professional Email Marketing Platform

A powerful, self-hosted bulk email sending system built with Python, FastAPI, and modern web technologies. This platform provides enterprise-grade features including email tracking, analytics, rate limiting, and spam prevention.

## 🚀 Features

### Core Features
- **Bulk Email Sending**: Send personalized emails to thousands of recipients
- **SMTP Provider Support**: Works with Gmail, SendGrid, Amazon SES, and any SMTP server
- **Rate Limiting**: Intelligent rate limiting to prevent spam detection
- **Queue Management**: Celery-based task queue for reliable email delivery
- **Email Templates**: Beautiful, responsive email templates with Jinja2
- **Personalization**: Dynamic content personalization for each recipient
- **Authentication**: JWT-based secure authentication system

### Advanced Features
- **Email Tracking**: Track opens, clicks, bounces, and unsubscribes
- **Analytics Dashboard**: Real-time campaign performance metrics
- **List Management**: Organize subscribers into lists with import/export
- **DKIM Signing**: Optional DKIM authentication for better deliverability
- **Webhook Support**: Process events from email service providers
- **Multiple SMTP Providers**: Rotate between multiple SMTP providers
- **Scheduled Campaigns**: Schedule campaigns for future delivery

## 📋 Requirements

- Python 3.8+
- PostgreSQL
- Redis
- SMTP credentials (Gmail, SendGrid, etc.)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/bulk-email-sender.git
cd bulk-email-sender
```

### 2. Set Up Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 4. Configure Environment Variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 5. Set Up Database
```bash
# Create PostgreSQL database
createdb bulk_email_db

# Run migrations
alembic upgrade head
```

### 6. Start Redis
```bash
redis-server
```

## 🏃‍♂️ Running the Application

### Start the API Server
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Start Celery Worker
```bash
cd backend
celery -A celery_app worker --loglevel=info
```

### Start Celery Beat (for scheduled tasks)
```bash
cd backend
celery -A celery_app beat --loglevel=info
```

## 📚 API Documentation

Once running, visit:
- API Documentation: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc

## 🔧 Configuration

### Environment Variables

```env
# Application
APP_NAME=BulkEmailSender
SECRET_KEY=your-secret-key
API_KEY=your-api-key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bulk_email_db

# Redis
REDIS_URL=redis://localhost:6379/0

# SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_USE_TLS=true

# Email Settings
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Your Company
DAILY_EMAIL_LIMIT=1000
RATE_LIMIT_PER_MINUTE=10

# Security
JWT_SECRET_KEY=your-jwt-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Tracking
ENABLE_TRACKING=true
TRACKING_DOMAIN=http://localhost:8000
```

### Gmail Setup

1. Enable 2-factor authentication
2. Generate an app-specific password
3. Use the app password in SMTP_PASSWORD

### SendGrid Setup

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### Amazon SES Setup

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=your-ses-username
SMTP_PASSWORD=your-ses-password
```

## 📊 Usage Examples

### 1. Register a User
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "password": "securepassword"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -F "username=testuser" \
  -F "password=securepassword"
```

### 3. Create an Email List
```bash
curl -X POST http://localhost:8000/email-lists \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Newsletter Subscribers",
    "description": "Main newsletter list"
  }'
```

### 4. Import Subscribers (CSV)
```bash
curl -X POST http://localhost:8000/email-lists/1/import-csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@subscribers.csv"
```

CSV Format:
```csv
email,first_name,last_name,custom_field1
john@example.com,John,Doe,Value1
jane@example.com,Jane,Smith,Value2
```

### 5. Create and Send Campaign
```bash
curl -X POST http://localhost:8000/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Welcome Campaign",
    "subject": "Welcome to {{company_name}}!",
    "from_email": "hello@company.com",
    "from_name": "Your Company",
    "html_content": "<h1>Welcome {{first_name}}!</h1>",
    "email_list_id": 1,
    "send_immediately": true
  }'
```

## 🎨 Email Templates

### Using Templates

Templates support Jinja2 syntax with these variables:
- `{{first_name}}` - Subscriber's first name
- `{{last_name}}` - Subscriber's last name
- `{{email}}` - Subscriber's email
- `{{company_name}}` - Your company name
- `{{unsubscribe_url}}` - Automatic unsubscribe link
- Custom fields from subscriber data

### Creating Custom Templates

1. Create HTML file in `/templates`
2. Use Jinja2 syntax for variables
3. Test with preview before sending

## 📈 Analytics

Track campaign performance with:
- **Delivery Rate**: Percentage of successfully delivered emails
- **Open Rate**: Percentage of opened emails
- **Click Rate**: Percentage of clicked links
- **Bounce Rate**: Percentage of bounced emails
- **Unsubscribe Rate**: Percentage of unsubscribes

Access analytics:
```bash
GET /campaigns/{campaign_id}/analytics
```

## 🔒 Security Best Practices

1. **Authentication**: Always use strong passwords and JWT tokens
2. **Rate Limiting**: Configure appropriate rate limits
3. **DKIM/SPF**: Set up email authentication
4. **SSL/TLS**: Use HTTPS in production
5. **Input Validation**: All inputs are validated
6. **SQL Injection**: Protected via SQLAlchemy ORM

## 🚀 Production Deployment

### Using Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Using Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/email_db
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis

  worker:
    build: .
    command: celery -A celery_app worker --loglevel=info
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/email_db
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis

  beat:
    build: .
    command: celery -A celery_app beat --loglevel=info
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/email_db
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=email_db
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

volumes:
  postgres_data:
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Gmail blocking emails**
   - Use app-specific password
   - Enable "Less secure app access"
   - Consider using SendGrid/SES

2. **Emails going to spam**
   - Set up SPF/DKIM records
   - Warm up IP address
   - Avoid spam trigger words
   - Maintain clean email lists

3. **Rate limit errors**
   - Adjust RATE_LIMIT_PER_MINUTE
   - Use multiple SMTP providers
   - Implement exponential backoff

4. **Database connection issues**
   - Check DATABASE_URL
   - Ensure PostgreSQL is running
   - Verify credentials

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📧 Support

For questions or support, please open an issue on GitHub.
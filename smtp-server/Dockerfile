FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd -m -u 1000 smtp-user

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY src/ ./src/
COPY config/ ./config/
COPY scripts/ ./scripts/

# Create necessary directories
RUN mkdir -p /var/log/smtp-server /var/mail/smtp-server /etc/dkim/keys \
    && chown -R smtp-user:smtp-user /var/log/smtp-server /var/mail/smtp-server /app

# Switch to non-root user
USER smtp-user

# Expose SMTP ports
EXPOSE 25 587 465 8080 9090

# Set environment variables
ENV PYTHONPATH=/app
ENV LOG_FILE=/var/log/smtp-server/smtp.log

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import socket; s=socket.socket(); s.connect(('localhost', 25)); s.close()"

# Run the server
CMD ["python", "src/smtp_server.py"]
# DispoSMS Installation and Deployment Guide

**Version:** 1.0.0  
**Author:** Manus AI  
**Last Updated:** August 6, 2025

## Table of Contents

1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Prerequisites](#prerequisites)
4. [Local Development Setup](#local-development-setup)
5. [Production Deployment](#production-deployment)
6. [Configuration](#configuration)
7. [Database Setup](#database-setup)
8. [SMS Provider Configuration](#sms-provider-configuration)
9. [Security Configuration](#security-configuration)
10. [Monitoring and Maintenance](#monitoring-and-maintenance)
11. [Troubleshooting](#troubleshooting)

## Overview

DispoSMS is a full-stack web application built with Flask (Python) backend and React (JavaScript) frontend. This guide covers installation for both development and production environments.

### Architecture Components

- **Backend:** Flask application with SQLAlchemy ORM
- **Frontend:** React application with Tailwind CSS
- **Database:** SQLite (development) / PostgreSQL (production)
- **Real-time:** Socket.IO for WebSocket communication
- **Authentication:** JWT-based authentication system
- **SMS Providers:** Twilio, Nexmo integration

### Deployment Options

1. **Local Development:** For testing and development
2. **Self-hosted:** Deploy on your own servers
3. **Cloud Platforms:** AWS, DigitalOcean, Google Cloud
4. **Container Deployment:** Docker and Kubernetes
5. **Serverless:** AWS Lambda, Vercel functions

## System Requirements

### Minimum Requirements

**Development Environment:**
- **CPU:** 2 cores, 2.0 GHz
- **RAM:** 4 GB
- **Storage:** 10 GB free space
- **OS:** Windows 10, macOS 10.15, Ubuntu 18.04+

**Production Environment:**
- **CPU:** 4 cores, 2.5 GHz
- **RAM:** 8 GB (16 GB recommended)
- **Storage:** 50 GB SSD
- **OS:** Ubuntu 20.04+ LTS (recommended)

### Recommended Specifications

**Production Server:**
- **CPU:** 8 cores, 3.0 GHz
- **RAM:** 16-32 GB
- **Storage:** 100 GB SSD with backup
- **Network:** 1 Gbps connection
- **Load Balancer:** For high availability

### Software Dependencies

**Required Software:**
- Python 3.8+ (3.11 recommended)
- Node.js 16+ (18 recommended)
- npm or pnpm package manager
- Git version control
- SSL certificate (production)

**Optional Software:**
- Docker and Docker Compose
- Nginx (reverse proxy)
- PostgreSQL (production database)
- Redis (caching and sessions)

## Prerequisites

### Development Tools

Install the following tools before proceeding:

#### Python Installation

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install python3.11 python3.11-venv python3.11-dev
sudo apt install python3-pip
```

**macOS:**
```bash
# Using Homebrew
brew install python@3.11
```

**Windows:**
- Download Python 3.11 from python.org
- Run installer with "Add to PATH" option
- Verify installation: `python --version`

#### Node.js Installation

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**macOS:**
```bash
# Using Homebrew
brew install node@18
```

**Windows:**
- Download Node.js 18 from nodejs.org
- Run installer with default options
- Verify installation: `node --version`

#### Git Installation

**Ubuntu/Debian:**
```bash
sudo apt install git
```

**macOS:**
```bash
# Usually pre-installed, or use Homebrew
brew install git
```

**Windows:**
- Download Git from git-scm.com
- Run installer with default options

### SMS Provider Accounts

You'll need accounts with SMS providers:

#### Twilio Setup

1. **Create Account**
   - Go to https://www.twilio.com
   - Sign up for a free account
   - Verify your phone number

2. **Get Credentials**
   - Account SID: Found in console dashboard
   - Auth Token: Found in console dashboard
   - Phone Number: Purchase a phone number

3. **Configure Webhooks**
   - Set webhook URL: `https://yourdomain.com/api/webhooks/twilio`
   - Enable SMS webhooks
   - Set HTTP method to POST

#### Nexmo/Vonage Setup

1. **Create Account**
   - Go to https://www.vonage.com
   - Sign up for developer account
   - Complete verification process

2. **Get Credentials**
   - API Key: Found in dashboard
   - API Secret: Found in dashboard
   - Virtual Numbers: Rent numbers for your country

3. **Configure Webhooks**
   - Set inbound webhook: `https://yourdomain.com/api/webhooks/nexmo`
   - Set delivery receipt webhook (optional)

## Local Development Setup

### Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/disposms.git
cd disposms

# Or if you have the source files
mkdir disposms
cd disposms
# Copy source files here
```

### Backend Setup

1. **Navigate to Backend Directory**
```bash
cd disposable-sms-backend
```

2. **Create Virtual Environment**
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install Dependencies**
```bash
pip install -r requirements.txt
```

4. **Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

5. **Environment Variables**
```bash
# .env file content
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here

# Database
DATABASE_URL=sqlite:///disposms.db

# SMS Providers
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
NEXMO_API_KEY=your-nexmo-key
NEXMO_API_SECRET=your-nexmo-secret

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

6. **Initialize Database**
```bash
python -c "from src.main import app, db; app.app_context().push(); db.create_all()"
```

7. **Run Backend Server**
```bash
python src/main.py
# Server will start on http://localhost:5000
```

### Frontend Setup

1. **Navigate to Frontend Directory**
```bash
cd ../disposable-sms-frontend
```

2. **Install Dependencies**
```bash
# Using npm
npm install

# Or using pnpm (recommended)
pnpm install
```

3. **Environment Configuration**
```bash
# Create environment file
touch .env.local

# Add configuration
echo "VITE_API_URL=http://localhost:5000/api" > .env.local
echo "VITE_SOCKET_URL=http://localhost:5000" >> .env.local
```

4. **Run Development Server**
```bash
# Using npm
npm run dev

# Or using pnpm
pnpm dev

# Server will start on http://localhost:5173
```

### Verify Installation

1. **Check Backend**
   - Open http://localhost:5000/health
   - Should return: `{"status": "healthy"}`

2. **Check Frontend**
   - Open http://localhost:5173
   - Should show DispoSMS login page

3. **Test Registration**
   - Create a test account
   - Verify login works
   - Check database for user record

## Production Deployment

### Server Preparation

#### Ubuntu Server Setup

1. **Update System**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git nginx postgresql postgresql-contrib
```

2. **Create Application User**
```bash
sudo adduser disposms
sudo usermod -aG sudo disposms
su - disposms
```

3. **Install Python and Node.js**
```bash
# Python 3.11
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Database Setup (PostgreSQL)

1. **Create Database and User**
```bash
sudo -u postgres psql

CREATE DATABASE disposms;
CREATE USER disposms_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE disposms TO disposms_user;
\q
```

2. **Configure PostgreSQL**
```bash
sudo nano /etc/postgresql/13/main/postgresql.conf
# Uncomment and modify:
# listen_addresses = 'localhost'

sudo nano /etc/postgresql/13/main/pg_hba.conf
# Add line:
# local   disposms        disposms_user                   md5

sudo systemctl restart postgresql
```

### Application Deployment

1. **Clone and Setup Backend**
```bash
cd /home/disposms
git clone https://github.com/your-org/disposms.git
cd disposms/disposable-sms-backend

python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. **Production Environment**
```bash
# Create production environment file
cat > .env << EOF
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
JWT_SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")

# Database
DATABASE_URL=postgresql://disposms_user:secure_password_here@localhost/disposms

# SMS Providers
TWILIO_ACCOUNT_SID=your-production-twilio-sid
TWILIO_AUTH_TOKEN=your-production-twilio-token
NEXMO_API_KEY=your-production-nexmo-key
NEXMO_API_SECRET=your-production-nexmo-secret

# CORS
CORS_ORIGINS=https://yourdomain.com

# Security
SECURE_COOKIES=True
SESSION_COOKIE_SECURE=True
EOF
```

3. **Initialize Production Database**
```bash
python -c "from src.main import app, db; app.app_context().push(); db.create_all()"
```

4. **Build Frontend**
```bash
cd ../disposable-sms-frontend

# Install dependencies
npm install

# Create production environment
cat > .env.production << EOF
VITE_API_URL=https://yourdomain.com/api
VITE_SOCKET_URL=https://yourdomain.com
EOF

# Build for production
npm run build

# Copy build to backend static directory
cp -r dist/* ../disposable-sms-backend/src/static/
```

### Web Server Configuration

#### Nginx Configuration

1. **Create Nginx Configuration**
```bash
sudo nano /etc/nginx/sites-available/disposms
```

2. **Nginx Configuration File**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static files
    location /static/ {
        alias /home/disposms/disposms/disposable-sms-backend/src/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API and Socket.IO
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
        root /home/disposms/disposms/disposable-sms-backend/src/static;
        index index.html;
    }
}
```

3. **Enable Site**
```bash
sudo ln -s /etc/nginx/sites-available/disposms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### SSL Certificate (Let's Encrypt)

1. **Install Certbot**
```bash
sudo apt install certbot python3-certbot-nginx
```

2. **Obtain Certificate**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

3. **Auto-renewal**
```bash
sudo crontab -e
# Add line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### Process Management

#### Systemd Service

1. **Create Service File**
```bash
sudo nano /etc/systemd/system/disposms.service
```

2. **Service Configuration**
```ini
[Unit]
Description=DispoSMS Application
After=network.target postgresql.service

[Service]
Type=simple
User=disposms
Group=disposms
WorkingDirectory=/home/disposms/disposms/disposable-sms-backend
Environment=PATH=/home/disposms/disposms/disposable-sms-backend/venv/bin
ExecStart=/home/disposms/disposms/disposable-sms-backend/venv/bin/python src/main.py
Restart=always
RestartSec=10

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/home/disposms/disposms

[Install]
WantedBy=multi-user.target
```

3. **Enable and Start Service**
```bash
sudo systemctl daemon-reload
sudo systemctl enable disposms
sudo systemctl start disposms
sudo systemctl status disposms
```

### Monitoring Setup

#### Log Configuration

1. **Application Logs**
```bash
# Create log directory
sudo mkdir -p /var/log/disposms
sudo chown disposms:disposms /var/log/disposms

# Configure log rotation
sudo nano /etc/logrotate.d/disposms
```

2. **Log Rotation Configuration**
```
/var/log/disposms/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 disposms disposms
    postrotate
        systemctl reload disposms
    endscript
}
```

#### Health Monitoring

1. **Health Check Script**
```bash
nano /home/disposms/health_check.sh
```

2. **Health Check Content**
```bash
#!/bin/bash
HEALTH_URL="https://yourdomain.com/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "$(date): Service is healthy"
    exit 0
else
    echo "$(date): Service is unhealthy (HTTP $RESPONSE)"
    # Restart service
    sudo systemctl restart disposms
    exit 1
fi
```

3. **Cron Job for Health Check**
```bash
chmod +x /home/disposms/health_check.sh
crontab -e
# Add line:
*/5 * * * * /home/disposms/health_check.sh >> /var/log/disposms/health.log 2>&1
```

## Configuration

### Environment Variables

#### Development Configuration

```bash
# Development .env
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=dev-secret-key
JWT_SECRET_KEY=dev-jwt-secret

# Database
DATABASE_URL=sqlite:///disposms.db

# SMS Providers (Test credentials)
TWILIO_ACCOUNT_SID=test_sid
TWILIO_AUTH_TOKEN=test_token
NEXMO_API_KEY=test_key
NEXMO_API_SECRET=test_secret

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Logging
LOG_LEVEL=DEBUG
```

#### Production Configuration

```bash
# Production .env
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=secure-random-key-32-chars
JWT_SECRET_KEY=secure-jwt-key-32-chars

# Database
DATABASE_URL=postgresql://user:pass@localhost/disposms

# SMS Providers (Production credentials)
TWILIO_ACCOUNT_SID=production_sid
TWILIO_AUTH_TOKEN=production_token
NEXMO_API_KEY=production_key
NEXMO_API_SECRET=production_secret

# CORS
CORS_ORIGINS=https://yourdomain.com

# Security
SECURE_COOKIES=True
SESSION_COOKIE_SECURE=True
SESSION_COOKIE_HTTPONLY=True

# Logging
LOG_LEVEL=INFO
LOG_FILE=/var/log/disposms/app.log

# Rate Limiting
RATE_LIMIT_ENABLED=True
RATE_LIMIT_STORAGE_URL=redis://localhost:6379/0
```

### Application Configuration

#### Flask Configuration

```python
# src/config.py
import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '').split(',')
    
    # SMS Providers
    TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
    TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
    NEXMO_API_KEY = os.environ.get('NEXMO_API_KEY')
    NEXMO_API_SECRET = os.environ.get('NEXMO_API_SECRET')

class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    
    # Security
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'

class TestingConfig(Config):
    TESTING = True
    SQLALCHEM
(Content truncated due to size limit. Use page ranges or line ranges to read remaining content)
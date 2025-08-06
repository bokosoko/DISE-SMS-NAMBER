#!/bin/bash

# DispoSMS v2.0 - Production Deployment Script
# This script helps deploy DispoSMS to various platforms

set -e

echo "🚀 DispoSMS v2.0 Deployment Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    print_status "Docker and Docker Compose are installed"
}

# Create environment file
create_env_file() {
    if [ ! -f ".env.production" ]; then
        print_info "Creating production environment file..."
        cat > .env.production << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database
MONGODB_URI=mongodb://mongo:27017/disposms
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=change_this_password_123

# JWT Configuration
JWT_SECRET=change_this_super_secret_jwt_key_for_production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=30d

# CORS
CORS_ORIGINS=*

# SMS Providers (Configure with your actual credentials)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

NEXMO_API_KEY=your_nexmo_api_key
NEXMO_API_SECRET=your_nexmo_api_secret

# Application
BASE_URL=https://your-domain.com
WEBHOOK_SECRET=change_this_webhook_secret_for_production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=change_this_session_secret_for_production
EOF
        print_warning "Created .env.production file. Please update it with your actual configuration!"
        print_info "Edit .env.production and update all the 'change_this_*' and 'your_*' values"
    else
        print_status "Production environment file already exists"
    fi
}

# Build and start services
deploy_with_docker() {
    print_info "Building and starting DispoSMS services..."
    
    # Copy production env to .env for docker-compose
    cp .env.production .env
    
    # Build and start services
    docker-compose down --remove-orphans
    docker-compose build --no-cache
    docker-compose up -d
    
    print_status "Services started successfully!"
    
    # Wait for services to be ready
    print_info "Waiting for services to be ready..."
    sleep 10
    
    # Check service health
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        print_status "DispoSMS is running and healthy!"
        print_info "Application is available at: http://localhost:5000"
        print_info "API endpoints at: http://localhost:5000/api"
    else
        print_error "Service health check failed. Check logs with: docker-compose logs"
    fi
}

# Show deployment options
show_deployment_options() {
    echo ""
    echo "🌐 Deployment Options:"
    echo "====================="
    echo ""
    echo "1. 🐳 Docker (Local/VPS)"
    echo "   - Run: ./deploy.sh docker"
    echo "   - Requires: Docker & Docker Compose"
    echo ""
    echo "2. ☁️  Cloud Platforms:"
    echo "   - Heroku: Use Dockerfile"
    echo "   - DigitalOcean App Platform: Use Dockerfile"
    echo "   - AWS ECS/Fargate: Use Dockerfile"
    echo "   - Google Cloud Run: Use Dockerfile"
    echo ""
    echo "3. 🖥️  VPS/Dedicated Server:"
    echo "   - Use Docker Compose (recommended)"
    echo "   - Or manual Node.js setup"
    echo ""
    echo "4. 🔧 Manual Setup:"
    echo "   - Install Node.js 18+"
    echo "   - Install MongoDB"
    echo "   - Run: npm install && node server.js"
    echo ""
}

# Main deployment logic
case "$1" in
    "docker")
        check_docker
        create_env_file
        deploy_with_docker
        ;;
    "build")
        check_docker
        print_info "Building Docker image..."
        docker build -t disposms:latest .
        print_status "Docker image built successfully!"
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "stop")
        docker-compose down
        print_status "Services stopped"
        ;;
    "restart")
        docker-compose restart
        print_status "Services restarted"
        ;;
    "status")
        docker-compose ps
        ;;
    *)
        echo "Usage: $0 {docker|build|logs|stop|restart|status}"
        show_deployment_options
        exit 1
        ;;
esac

echo ""
print_status "Deployment script completed!"
echo ""
print_info "Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop services: docker-compose down"
echo "  - Restart services: docker-compose restart"
echo "  - View status: docker-compose ps"
echo ""
print_info "For production deployment, make sure to:"
echo "  1. Update .env.production with real credentials"
echo "  2. Configure SSL certificates for HTTPS"
echo "  3. Set up proper domain and DNS"
echo "  4. Configure SMS provider webhooks"
echo "  5. Set up monitoring and backups"


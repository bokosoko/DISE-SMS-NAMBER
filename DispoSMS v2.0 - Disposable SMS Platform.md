# DispoSMS v2.0 - Disposable SMS Platform

A modern, professional disposable SMS platform with beautiful Android Compose-inspired UI, real-time messaging, and comprehensive phone number management.

![DispoSMS v2.0](https://img.shields.io/badge/DispoSMS-v2.0-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green?style=for-the-badge&logo=mongodb)
![React](https://img.shields.io/badge/React-18+-blue?style=for-the-badge&logo=react)

## ✨ Features

### 🎨 **Modern UI/UX**
- **Android Compose-inspired** tab navigation
- Beautiful gradient backgrounds and glass-morphism effects
- Smooth animations and micro-interactions
- Responsive design for all devices
- Professional color palette and typography
- Dark mode support

### 📱 **Phone Number Management**
- Support for **all international phone number formats**
- Automatic number formatting based on country codes
- Number assignment and release
- Expiration tracking
- Multiple SMS provider support (Twilio, Nexmo/Vonage)

### 💬 **Advanced Messaging**
- Real-time message reception via webhooks
- **Automatic OTP detection and highlighting**
- Message categorization (SMS, MMS, OTP, Verification)
- Read/unread status tracking
- Message search and filtering
- Copy-to-clipboard functionality

### 🔐 **Security & Authentication**
- JWT-based authentication with refresh tokens
- Secure password hashing with bcrypt
- Rate limiting and CORS protection
- Session management across devices

### ⚡ **Real-time Features**
- Socket.IO integration for live updates
- Real-time message notifications
- Live status updates
- Multi-device synchronization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 6.0+
- Docker & Docker Compose (for containerized deployment)

### Option 1: Docker Deployment (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd disposms-nodejs

# Make deployment script executable
chmod +x deploy.sh

# Deploy with Docker
./deploy.sh docker
```

The application will be available at `http://localhost:5000`

### Option 2: Manual Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit environment variables
nano .env

# Start MongoDB (if not using Docker)
mongod

# Start the application
npm start
# or
node server.js
```

## 📋 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - Logout user

### Phone Number Endpoints
- `GET /api/numbers/available` - Get available numbers
- `POST /api/numbers/assign` - Assign a number
- `GET /api/numbers/my` - Get user's numbers
- `POST /api/numbers/:id/extend` - Extend assignment
- `DELETE /api/numbers/:id` - Release number

### Message Endpoints
- `GET /api/messages` - Get messages with filtering
- `GET /api/messages/:id` - Get specific message
- `PATCH /api/messages/:id/read` - Mark as read
- `PATCH /api/messages/read-all` - Mark all as read
- `GET /api/messages/stats` - Get message statistics

### Webhook Endpoints
- `POST /api/webhooks/twilio/sms` - Twilio SMS webhook
- `POST /api/webhooks/nexmo/sms` - Nexmo SMS webhook
- `POST /api/webhooks/test/message` - Test message (dev only)

## 🔧 Configuration

### Environment Variables

```env
# Server Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database
MONGODB_URI=mongodb://localhost:27017/disposms

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=30d

# SMS Providers
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
NEXMO_API_KEY=your_nexmo_api_key
NEXMO_API_SECRET=your_nexmo_api_secret

# Application
BASE_URL=https://your-domain.com
WEBHOOK_SECRET=your-webhook-secret
CORS_ORIGINS=*

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🏗️ Architecture

```
DispoSMS v2.0
├── 🖥️  Backend (Node.js/Express)
│   ├── Authentication & Authorization
│   ├── Phone Number Management
│   ├── Message Processing
│   ├── Real-time Communication (Socket.IO)
│   └── SMS Provider Integration
├── 🎨 Frontend (React SPA)
│   ├── Android Compose-inspired UI
│   ├── Real-time Updates
│   ├── Responsive Design
│   └── Progressive Web App
├── 🗄️  Database (MongoDB)
│   ├── Users & Authentication
│   ├── Phone Numbers
│   └── Messages
└── 🔧 Infrastructure
    ├── Docker Containerization
    ├── Nginx Reverse Proxy
    └── SSL/TLS Termination
```

## 🌐 Deployment Options

### 1. Docker (Recommended)
```bash
./deploy.sh docker
```

### 2. Cloud Platforms
- **Heroku**: Use the included `Dockerfile`
- **DigitalOcean App Platform**: Use the included `Dockerfile`
- **AWS ECS/Fargate**: Use the included `Dockerfile`
- **Google Cloud Run**: Use the included `Dockerfile`

### 3. VPS/Dedicated Server
```bash
# Using Docker Compose
docker-compose up -d

# Or manual setup
npm install
node server.js
```

## 📱 Mobile Support

DispoSMS v2.0 is designed with mobile-first principles:
- Touch-friendly interface
- Responsive breakpoints
- Optimized for small screens
- Fast loading times
- Progressive Web App capabilities

## 🔒 Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Input validation and sanitization
- Secure session management
- Environment-based configuration

## 🎯 Key Improvements Over v1.0

### Backend
- ✅ Migrated from Python Flask to Node.js/Express
- ✅ MongoDB with Mongoose ODM instead of SQLite
- ✅ Enhanced security with JWT and refresh tokens
- ✅ Real-time updates with Socket.IO
- ✅ Better error handling and logging
- ✅ Production-ready architecture

### Frontend
- ✅ Complete UI redesign with Android Compose inspiration
- ✅ Modern animations and transitions
- ✅ Enhanced OTP detection and management
- ✅ Responsive design for all devices
- ✅ Real-time message updates
- ✅ Professional glass-morphism effects

### Features
- ✅ International phone number support
- ✅ Automatic OTP detection and highlighting
- ✅ Enhanced message categorization
- ✅ Real-time notifications
- ✅ Multi-device synchronization
- ✅ Better performance and scalability

## 🛠️ Development

### Setup Development Environment
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

### Project Structure
```
disposms-nodejs/
├── server.js              # Main application server
├── package.json           # Dependencies and scripts
├── .env                   # Environment configuration
├── config/
│   └── database.js        # Database connection
├── models/
│   ├── User.js            # User model
│   ├── PhoneNumber.js     # Phone number model
│   └── Message.js         # Message model
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── users.js           # User management
│   ├── numbers.js         # Phone number operations
│   ├── messages.js        # Message handling
│   └── webhooks.js        # SMS provider webhooks
├── middleware/
│   ├── auth.js            # JWT authentication
│   └── errorHandler.js    # Error handling
├── socket/
│   └── socketHandler.js   # Socket.IO real-time
└── public/
    └── index.html         # React frontend
```

## 📊 Monitoring & Logging

- Application logs with configurable levels
- Health check endpoints
- Performance monitoring
- Error tracking
- Real-time metrics

## 🔮 Future Enhancements

- [ ] Push notifications
- [ ] Message encryption
- [ ] Multiple language support
- [ ] Advanced analytics dashboard
- [ ] API rate limiting per user
- [ ] Message scheduling
- [ ] Bulk operations
- [ ] Advanced message filtering
- [ ] Mobile app (React Native)
- [ ] Admin panel

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API endpoints
- Check the deployment guides

## 🙏 Acknowledgments

- Android Material Design for UI inspiration
- Socket.IO for real-time communication
- MongoDB for flexible data storage
- Express.js for robust backend framework
- React for modern frontend development

---

**DispoSMS v2.0** - A modern, professional disposable SMS platform built with cutting-edge technologies and beautiful design. 🚀


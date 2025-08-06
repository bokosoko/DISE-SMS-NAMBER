# 🚀 DispoSMS Enhanced - Premium Disposable SMS Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/express-%5E4.18.2-blue.svg)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/socket.io-%5E4.7.2-green.svg)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/mongodb-%5E7.5.0-green.svg)](https://www.mongodb.com/)

A beautiful, modern, and feature-rich disposable SMS platform with real-time messaging, stunning UI, and comprehensive SMS provider integration. Built with Node.js, Express, Socket.IO, and enhanced with a gorgeous Android Compose-inspired interface.

## ✨ Features

### 🎨 **Beautiful User Interface**
- **Android Compose-inspired design** with smooth animations
- **Glass-morphism effects** and gradient backgrounds
- **Responsive design** optimized for all devices
- **Dark/Light theme** support with smooth transitions
- **Advanced animations** and micro-interactions
- **Professional typography** with Inter and JetBrains Mono fonts

### 📱 **Core Functionality**
- **Disposable phone numbers** from multiple providers
- **Real-time SMS reception** with Socket.IO
- **OTP detection and highlighting** with one-click copy
- **Message filtering** by type (OTP, verification, notifications)
- **Multi-provider support** (Twilio, Nexmo, Plivo, MessageBird)
- **International number support** with proper formatting

### 🔐 **Security & Authentication**
- **JWT-based authentication** with refresh tokens
- **Rate limiting** and request throttling
- **CORS protection** with configurable origins
- **Helmet.js security** headers
- **Input validation** and sanitization

### 📊 **Analytics & Monitoring**
- **Comprehensive dashboard** with real-time stats
- **Message analytics** and usage tracking
- **Provider performance** monitoring
- **User activity** insights

### 🚀 **Performance & Scalability**
- **Compression middleware** for faster loading
- **Efficient caching** strategies
- **Database optimization** with proper indexing
- **Horizontal scaling** ready architecture

## 🛠️ Quick Start

### Prerequisites

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **MongoDB** (optional - uses mock data by default)
- **Redis** (optional - for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/disposms-enhanced.git
   cd disposms-enhanced
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the application**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Access the application**
   - Open your browser to `http://localhost:5000`
   - Use demo credentials: `demo@disposms.com` / `demo123`

## 🌐 Deployment Options

### 🔥 **Heroku Deployment**

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

1. **Create a new Heroku app**
   ```bash
   heroku create your-app-name
   ```

2. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secret-key
   # Add other required environment variables
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

### ⚡ **Vercel Deployment**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/disposms-enhanced)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

### 🌊 **Netlify Deployment**

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/disposms-enhanced)

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy the `public` folder** to Netlify

### 🚂 **Railway Deployment**

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/yourusername/disposms-enhanced)

1. **Connect your GitHub repository** to Railway
2. **Set environment variables** in Railway dashboard
3. **Deploy automatically** on push

### 🐳 **Docker Deployment**

1. **Build the Docker image**
   ```bash
   docker build -t disposms-enhanced .
   ```

2. **Run the container**
   ```bash
   docker run -p 5000:5000 -e NODE_ENV=production disposms-enhanced
   ```

### 🔧 **Manual Server Deployment**

1. **Clone and setup on your server**
   ```bash
   git clone https://github.com/yourusername/disposms-enhanced.git
   cd disposms-enhanced
   npm install --production
   ```

2. **Use PM2 for process management**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "disposms"
   pm2 startup
   pm2 save
   ```

3. **Setup Nginx reverse proxy**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 📁 Project Structure

```
disposms-enhanced/
├── public/                 # Frontend static files
│   └── index.html         # Main application file
├── config/                # Configuration files
├── models/                # Database models
├── routes/                # API routes
├── middleware/            # Express middleware
├── utils/                 # Utility functions
├── tests/                 # Test files
├── docs/                  # Documentation
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore rules
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose setup
├── package.json          # Node.js dependencies
├── server.js             # Main server file
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Server port | `5000` | No |
| `HOST` | Server host | `0.0.0.0` | No |
| `MONGODB_URI` | MongoDB connection string | - | No* |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | - | No* |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | - | No* |

*Not required for demo mode with mock data

### SMS Providers

The application supports multiple SMS providers:

- **Twilio** - Industry-leading SMS service
- **Nexmo/Vonage** - Global communications platform
- **Plivo** - Cloud communications platform
- **MessageBird** - Omnichannel platform

Configure your preferred providers in the `.env` file.

## 🎯 API Documentation

### Authentication Endpoints

```http
POST /api/auth/login
POST /api/auth/register
GET /api/auth/profile
```

### Phone Numbers Endpoints

```http
GET /api/numbers/available
GET /api/numbers/my
POST /api/numbers/assign
DELETE /api/numbers/:id
```

### Messages Endpoints

```http
GET /api/messages
PATCH /api/messages/:id/read
DELETE /api/messages/:id
```

### Dashboard Endpoints

```http
GET /api/users/dashboard
```

### Webhook Endpoints

```http
POST /api/webhooks/twilio
POST /api/webhooks/nexmo
POST /api/webhooks/plivo
POST /api/webhooks/messagebird
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🚀 Performance Optimization

### Frontend Optimizations
- **Lazy loading** of components
- **Image optimization** with WebP support
- **CSS/JS minification** and compression
- **Service worker** for offline functionality
- **Progressive Web App** features

### Backend Optimizations
- **Database indexing** for faster queries
- **Redis caching** for frequently accessed data
- **Connection pooling** for database connections
- **Compression middleware** for response optimization
- **Rate limiting** to prevent abuse

## 🔒 Security Features

- **HTTPS enforcement** in production
- **CORS protection** with configurable origins
- **Helmet.js** security headers
- **Rate limiting** per IP and user
- **Input validation** and sanitization
- **JWT token** authentication
- **Password hashing** with bcrypt
- **SQL injection** protection
- **XSS protection** with CSP headers

## 📊 Monitoring & Analytics

### Built-in Analytics
- **Real-time dashboard** with key metrics
- **Message analytics** by type and provider
- **User activity** tracking
- **Performance monitoring** with response times

### External Integrations
- **Google Analytics** for web analytics
- **Sentry** for error tracking
- **New Relic** for application monitoring
- **Mixpanel** for user behavior analytics

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Android Compose** for design inspiration
- **Tailwind CSS** for utility-first styling
- **Socket.IO** for real-time communication
- **Express.js** for the robust backend framework
- **MongoDB** for flexible data storage

## 📞 Support

- **Documentation**: [docs.disposms.com](https://docs.disposms.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/disposms-enhanced/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/disposms-enhanced/discussions)
- **Email**: support@disposms.com

## 🗺️ Roadmap

### Version 2.1
- [ ] **Mobile app** (React Native)
- [ ] **Voice call** support
- [ ] **MMS** message support
- [ ] **Advanced filtering** options

### Version 2.2
- [ ] **Team collaboration** features
- [ ] **API rate limiting** per user
- [ ] **Webhook management** UI
- [ ] **Advanced analytics** dashboard

### Version 3.0
- [ ] **AI-powered** message categorization
- [ ] **Multi-language** support
- [ ] **Enterprise** features
- [ ] **White-label** solution

---

<div align="center">

**Made with ❤️ by the DispoSMS Team**

[Website](https://disposms.com) • [Documentation](https://docs.disposms.com) • [Support](mailto:support@disposms.com)

</div>


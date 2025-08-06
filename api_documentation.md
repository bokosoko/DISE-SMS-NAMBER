# DispoSMS API Documentation

**Version:** 1.0.0  
**Base URL:** https://77h9ikcww70j.manus.space  
**Author:** Manus AI  
**Last Updated:** August 6, 2025

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [WebSocket Events](#websocket-events)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Examples](#examples)
8. [SDKs and Libraries](#sdks-and-libraries)

## Overview

DispoSMS is a comprehensive disposable SMS service that provides temporary phone numbers for SMS verification. The API allows developers to integrate SMS reception capabilities into their applications with real-time message delivery and 100% code delivery guarantee.

### Key Features

- **Temporary Phone Numbers**: Get instant access to disposable phone numbers
- **Real-time SMS Reception**: Receive SMS messages in real-time via WebSocket
- **OTP Detection**: Automatic detection and highlighting of OTP codes
- **Multiple Providers**: Support for Twilio, Nexmo, and other SMS providers
- **Failover Mechanism**: Automatic failover between providers for 100% delivery
- **RESTful API**: Clean and intuitive REST API design
- **WebSocket Support**: Real-time updates via Socket.IO
- **JWT Authentication**: Secure token-based authentication

### Base URL

All API requests should be made to:
```
https://77h9ikcww70j.manus.space/api
```

### Content Type

All requests should include the following header:
```
Content-Type: application/json
```

### Response Format

All API responses are returned in JSON format with the following structure:

```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "timestamp": "2025-08-06T12:00:00.000Z"
}
```

For error responses:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  },
  "timestamp": "2025-08-06T12:00:00.000Z"
}
```




## Authentication

DispoSMS uses JWT (JSON Web Token) based authentication. All protected endpoints require a valid JWT token in the Authorization header.

### Authentication Flow

1. **Register** a new user account or **login** with existing credentials
2. Receive an **access token** and **refresh token**
3. Include the access token in the Authorization header for all API requests
4. Use the refresh token to obtain new access tokens when they expire

### Token Types

| Token Type | Purpose | Expiration |
|------------|---------|------------|
| Access Token | API authentication | 1 hour |
| Refresh Token | Token renewal | 30 days |

### Authorization Header

Include the access token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

### Token Refresh

When an access token expires, use the refresh token to obtain a new one:

```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "your_refresh_token_here"
}
```

### Registration

Create a new user account:

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user",
      "created_at": "2025-08-06T12:00:00.000Z"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
  },
  "message": "User registered successfully"
}
```

### Login

Authenticate with existing credentials:

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user",
      "last_login": "2025-08-06T12:00:00.000Z"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
  },
  "message": "Login successful"
}
```


## API Endpoints

### Phone Numbers

#### Get Available Numbers

Retrieve a list of available phone numbers for assignment.

```http
GET /numbers/available
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `country` (optional): Country code (e.g., "US", "UK", "CA")
- `limit` (optional): Number of results to return (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "numbers": [
      {
        "number": "+1234567890",
        "country": "US",
        "provider": "twilio",
        "cost": 0.05,
        "capabilities": ["sms", "voice"]
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10
  }
}
```

#### Assign Phone Number

Assign a phone number to your account.

```http
POST /numbers/assign
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "number": "+1234567890",
  "duration": 3600
}
```

**Parameters:**
- `number` (required): Phone number to assign
- `duration` (optional): Assignment duration in seconds (default: 3600, max: 86400)

**Response:**
```json
{
  "success": true,
  "data": {
    "assignment": {
      "id": "assign_123",
      "number": "+1234567890",
      "user_id": 1,
      "assigned_at": "2025-08-06T12:00:00.000Z",
      "expires_at": "2025-08-06T13:00:00.000Z",
      "status": "active",
      "provider": "twilio"
    }
  },
  "message": "Phone number assigned successfully"
}
```

#### Get My Numbers

Retrieve all phone numbers assigned to your account.

```http
GET /numbers/my
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `status` (optional): Filter by status ("active", "expired", "released")
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "id": "assign_123",
        "number": "+1234567890",
        "assigned_at": "2025-08-06T12:00:00.000Z",
        "expires_at": "2025-08-06T13:00:00.000Z",
        "status": "active",
        "provider": "twilio",
        "message_count": 3,
        "last_message_at": "2025-08-06T12:30:00.000Z"
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 20
  }
}
```

#### Extend Assignment

Extend the assignment duration of a phone number.

```http
POST /numbers/{assignment_id}/extend
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "duration": 3600
}
```

**Parameters:**
- `assignment_id` (required): Assignment ID from the URL path
- `duration` (required): Additional duration in seconds

**Response:**
```json
{
  "success": true,
  "data": {
    "assignment": {
      "id": "assign_123",
      "number": "+1234567890",
      "expires_at": "2025-08-06T14:00:00.000Z",
      "extended_duration": 3600
    }
  },
  "message": "Assignment extended successfully"
}
```

#### Release Phone Number

Release a phone number from your account.

```http
DELETE /numbers/{assignment_id}
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assignment_id": "assign_123",
    "released_at": "2025-08-06T12:45:00.000Z"
  },
  "message": "Phone number released successfully"
}
```

### Messages

#### Get Messages

Retrieve SMS messages for your assigned phone numbers.

```http
GET /messages
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `number` (optional): Filter by phone number
- `assignment_id` (optional): Filter by assignment ID
- `type` (optional): Filter by message type ("otp", "verification", "notification", "other")
- `is_read` (optional): Filter by read status (true/false)
- `from_date` (optional): Start date (ISO 8601 format)
- `to_date` (optional): End date (ISO 8601 format)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50, max: 200)
- `sort` (optional): Sort order ("newest", "oldest", default: "newest")

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_456",
        "assignment_id": "assign_123",
        "to_number": "+1234567890",
        "from_number": "+0987654321",
        "content": "Your verification code is 123456",
        "type": "otp",
        "otp_code": "123456",
        "received_at": "2025-08-06T12:30:00.000Z",
        "is_read": false,
        "provider": "twilio",
        "extra_data": {
          "message_sid": "SM1234567890abcdef",
          "account_sid": "AC1234567890abcdef"
        }
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 50,
    "unread_count": 3
  }
}
```

#### Get Single Message

Retrieve details of a specific message.

```http
GET /messages/{message_id}
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "msg_456",
      "assignment_id": "assign_123",
      "to_number": "+1234567890",
      "from_number": "+0987654321",
      "content": "Your verification code is 123456",
      "type": "otp",
      "otp_code": "123456",
      "received_at": "2025-08-06T12:30:00.000Z",
      "is_read": false,
      "provider": "twilio",
      "extra_data": {
        "message_sid": "SM1234567890abcdef",
        "account_sid": "AC1234567890abcdef"
      }
    }
  }
}
```

#### Mark Message as Read

Mark a message as read.

```http
PATCH /messages/{message_id}/read
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message_id": "msg_456",
    "is_read": true,
    "read_at": "2025-08-06T12:45:00.000Z"
  },
  "message": "Message marked as read"
}
```

#### Mark All Messages as Read

Mark all messages for a specific assignment as read.

```http
PATCH /messages/read-all
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "assignment_id": "assign_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assignment_id": "assign_123",
    "marked_count": 5,
    "marked_at": "2025-08-06T12:45:00.000Z"
  },
  "message": "All messages marked as read"
}
```


### User Profile

#### Get Profile

Retrieve the current user's profile information.

```http
GET /auth/profile
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user",
      "is_active": true,
      "email_verified": true,
      "created_at": "2025-08-06T10:00:00.000Z",
      "last_login": "2025-08-06T12:00:00.000Z",
      "stats": {
        "total_assignments": 10,
        "active_assignments": 2,
        "total_messages": 45,
        "unread_messages": 3
      }
    }
  }
}
```

## WebSocket Events

DispoSMS provides real-time updates via Socket.IO WebSocket connections. Connect to the WebSocket endpoint to receive live notifications.

### Connection

Connect to the WebSocket server:

```javascript
const socket = io('https://77h9ikcww70j.manus.space', {
  auth: {
    token: 'your_jwt_token_here'
  }
});
```

### Authentication

The WebSocket connection requires JWT authentication. Include your access token in the auth object when connecting.

### Events

#### Client to Server Events

##### Join Room

Join a specific room to receive targeted notifications:

```javascript
socket.emit('join_room', {
  room_type: 'user',  // 'user' or 'assignment'
  room_id: 'user_1'   // user ID or assignment ID
});
```

##### Leave Room

Leave a specific room:

```javascript
socket.emit('leave_room', {
  room_type: 'user',
  room_id: 'user_1'
});
```

##### Ping

Send a ping to check connection health:

```javascript
socket.emit('ping');
```

#### Server to Client Events

##### New Message

Receive notification when a new SMS message arrives:

```javascript
socket.on('new_message', (data) => {
  console.log('New message received:', data);
  /*
  {
    "message": {
      "id": "msg_456",
      "assignment_id": "assign_123",
      "to_number": "+1234567890",
      "from_number": "+0987654321",
      "content": "Your verification code is 123456",
      "type": "otp",
      "otp_code": "123456",
      "received_at": "2025-08-06T12:30:00.000Z",
      "is_read": false,
      "provider": "twilio"
    },
    "assignment": {
      "id": "assign_123",
      "number": "+1234567890"
    }
  }
  */
});
```

##### Assignment Status

Receive notification when assignment status changes:

```javascript
socket.on('assignment_status', (data) => {
  console.log('Assignment status changed:', data);
  /*
  {
    "assignment_id": "assign_123",
    "status": "expired",
    "previous_status": "active",
    "changed_at": "2025-08-06T13:00:00.000Z"
  }
  */
});
```

##### System Notification

Receive system-wide notifications:

```javascript
socket.on('system_notification', (data) => {
  console.log('System notification:', data);
  /*
  {
    "type": "maintenance",
    "title": "Scheduled Maintenance",
    "message": "System will be under maintenance from 2:00 AM to 4:00 AM UTC",
    "severity": "info",
    "timestamp": "2025-08-06T12:00:00.000Z"
  }
  */
});
```

##### Pong

Receive pong response to ping:

```javascript
socket.on('pong', (data) => {
  console.log('Pong received:', data);
  /*
  {
    "timestamp": "2025-08-06T12:00:00.000Z",
    "latency": 45
  }
  */
});
```

##### Connection Status

Receive connection status updates:

```javascript
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected from server:', reason);
});

socket.on('connect_error', (error) => {
  console.log('Connection error:', error);
});
```

## Error Handling

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request parameters |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation errors |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - Service temporarily unavailable |

### Error Response Format

All error responses follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid parameters",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "timestamp": "2025-08-06T12:00:00.000Z"
}
```

### Common Error Codes

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `AUTHENTICATION_REQUIRED` | Valid authentication token required | 401 |
| `INVALID_TOKEN` | JWT token is invalid or expired | 401 |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions | 403 |
| `RESOURCE_NOT_FOUND` | Requested resource does not exist | 404 |
| `DUPLICATE_RESOURCE` | Resource already exists | 409 |
| `RATE_LIMIT_EXCEEDED` | Too many requests in time window | 429 |
| `NUMBER_NOT_AVAILABLE` | Phone number is not available | 422 |
| `ASSIGNMENT_EXPIRED` | Phone number assignment has expired | 422 |
| `PROVIDER_ERROR` | SMS provider returned an error | 500 |
| `INTERNAL_ERROR` | Unexpected server error | 500 |

### Validation Errors

Validation errors include detailed information about which fields failed validation:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "errors": [
        {
          "field": "email",
          "message": "Invalid email format",
          "value": "invalid-email"
        },
        {
          "field": "password",
          "message": "Password must be at least 8 characters",
          "value": "short"
        }
      ]
    }
  },
  "timestamp": "2025-08-06T12:00:00.000Z"
}
```


## Rate Limiting

DispoSMS implements rate limiting to ensure fair usage and system stability. Rate limits are applied per user and per endpoint
(Content truncated due to size limit. Use page ranges or line ranges to read remaining content)
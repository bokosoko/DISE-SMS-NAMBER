# Database Schema and API Design for Disposable SMS Platform

## 1. Introduction

This document provides a comprehensive design for the database schema and API endpoints for the disposable SMS receiving platform. The design focuses on scalability, performance, and maintainability while ensuring data integrity and security.



## 2. PostgreSQL Database Schema Design

The database schema is designed to efficiently store and retrieve SMS messages, manage temporary phone numbers, handle user authentication, and track system operations. The schema follows normalization principles while optimizing for read-heavy operations typical in SMS receiving platforms.

### 2.1. Core Tables

#### 2.1.1. Users Table

The `users` table stores user authentication information and profile data.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
```

#### 2.1.2. Phone Numbers Table

The `phone_numbers` table manages temporary phone numbers available for SMS reception.

```sql
CREATE TABLE phone_numbers (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    country_code VARCHAR(5) NOT NULL,
    provider_id INTEGER REFERENCES sms_providers(id),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'expired', 'blocked')),
    assigned_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX idx_phone_numbers_status ON phone_numbers(status);
CREATE INDEX idx_phone_numbers_user_id ON phone_numbers(user_id);
CREATE INDEX idx_phone_numbers_provider_id ON phone_numbers(provider_id);
CREATE INDEX idx_phone_numbers_expires_at ON phone_numbers(expires_at);
CREATE INDEX idx_phone_numbers_phone_number ON phone_numbers(phone_number);
```

#### 2.1.3. Messages Table

The `messages` table stores all incoming SMS messages with optimizations for fast retrieval.

```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    phone_number_id INTEGER NOT NULL REFERENCES phone_numbers(id) ON DELETE CASCADE,
    sender_number VARCHAR(20) NOT NULL,
    message_content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'sms' CHECK (message_type IN ('sms', 'otp', 'verification')),
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    provider_message_id VARCHAR(255),
    provider_id INTEGER REFERENCES sms_providers(id),
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partitioning by date for better performance
CREATE TABLE messages_y2024m01 PARTITION OF messages
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Indexes for performance
CREATE INDEX idx_messages_phone_number_id ON messages(phone_number_id);
CREATE INDEX idx_messages_received_at ON messages(received_at DESC);
CREATE INDEX idx_messages_sender_number ON messages(sender_number);
CREATE INDEX idx_messages_message_type ON messages(message_type);
CREATE INDEX idx_messages_is_read ON messages(is_read);
```

#### 2.1.4. SMS Providers Table

The `sms_providers` table stores configuration for different SMS gateway providers.

```sql
CREATE TABLE sms_providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    api_endpoint VARCHAR(255) NOT NULL,
    webhook_endpoint VARCHAR(255),
    api_key_encrypted TEXT,
    api_secret_encrypted TEXT,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    rate_limit_per_minute INTEGER DEFAULT 100,
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_sms_providers_is_active ON sms_providers(is_active);
CREATE INDEX idx_sms_providers_priority ON sms_providers(priority);
```

#### 2.1.5. Delivery Reports Table

The `delivery_reports` table tracks message delivery status and webhook acknowledgments.

```sql
CREATE TABLE delivery_reports (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
    provider_id INTEGER REFERENCES sms_providers(id),
    status VARCHAR(50) NOT NULL,
    delivery_timestamp TIMESTAMP,
    error_message TEXT,
    webhook_payload JSONB,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_delivery_reports_message_id ON delivery_reports(message_id);
CREATE INDEX idx_delivery_reports_status ON delivery_reports(status);
CREATE INDEX idx_delivery_reports_provider_id ON delivery_reports(provider_id);
```

### 2.2. Additional Tables for Enhanced Functionality

#### 2.2.1. User Sessions Table

For managing user sessions and JWT refresh tokens.

```sql
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
```

#### 2.2.2. API Rate Limits Table

For tracking API usage and implementing rate limiting.

```sql
CREATE TABLE api_rate_limits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ip_address INET,
    endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_api_rate_limits_user_id ON api_rate_limits(user_id);
CREATE INDEX idx_api_rate_limits_ip_address ON api_rate_limits(ip_address);
CREATE INDEX idx_api_rate_limits_endpoint ON api_rate_limits(endpoint);
CREATE INDEX idx_api_rate_limits_window_start ON api_rate_limits(window_start);
```

### 2.3. Database Functions and Triggers

#### 2.3.1. Auto-update Timestamp Function

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phone_numbers_updated_at BEFORE UPDATE ON phone_numbers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_providers_updated_at BEFORE UPDATE ON sms_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 2.3.2. Message Cleanup Function

```sql
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM messages 
    WHERE received_at < CURRENT_TIMESTAMP - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule this function to run periodically
```



## 3. API Design with OpenAPI 3.0 Specification

The API design follows RESTful principles and is documented using OpenAPI 3.0 specification. The API provides endpoints for user authentication, number management, message retrieval, and administrative functions.

### 3.1. OpenAPI 3.0 Specification

```yaml
openapi: 3.0.3
info:
  title: Disposable SMS Platform API
  description: API for managing temporary phone numbers and receiving SMS messages
  version: 1.0.0
  contact:
    name: API Support
    email: support@disposablesms.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.disposablesms.com/v1
    description: Production server
  - url: https://staging-api.disposablesms.com/v1
    description: Staging server

security:
  - BearerAuth: []

paths:
  /auth/register:
    post:
      tags:
        - Authentication
      summary: Register a new user
      description: Create a new user account with email verification
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
                - password
                - first_name
                - last_name
              properties:
                email:
                  type: string
                  format: email
                  example: user@example.com
                password:
                  type: string
                  minLength: 8
                  example: SecurePassword123!
                first_name:
                  type: string
                  example: John
                last_name:
                  type: string
                  example: Doe
      responses:
        '201':
          description: User registered successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: User registered successfully. Please check your email for verification.
                  user_id:
                    type: integer
                    example: 123
        '400':
          description: Bad request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '409':
          description: Email already exists
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /auth/login:
    post:
      tags:
        - Authentication
      summary: User login
      description: Authenticate user and return JWT tokens
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
                - password
              properties:
                email:
                  type: string
                  format: email
                  example: user@example.com
                password:
                  type: string
                  example: SecurePassword123!
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token:
                    type: string
                    example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                  refresh_token:
                    type: string
                    example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                  expires_in:
                    type: integer
                    example: 3600
                  user:
                    $ref: '#/components/schemas/User'
        '401':
          description: Invalid credentials
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /auth/refresh:
    post:
      tags:
        - Authentication
      summary: Refresh access token
      description: Get a new access token using refresh token
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - refresh_token
              properties:
                refresh_token:
                  type: string
                  example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
      responses:
        '200':
          description: Token refreshed successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token:
                    type: string
                    example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                  expires_in:
                    type: integer
                    example: 3600
        '401':
          description: Invalid refresh token
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /numbers:
    get:
      tags:
        - Phone Numbers
      summary: Get available phone numbers
      description: Retrieve list of available temporary phone numbers
      parameters:
        - name: country_code
          in: query
          description: Filter by country code
          schema:
            type: string
            example: US
        - name: status
          in: query
          description: Filter by status
          schema:
            type: string
            enum: [available, assigned, expired, blocked]
            example: available
        - name: limit
          in: query
          description: Number of results to return
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
        - name: offset
          in: query
          description: Number of results to skip
          schema:
            type: integer
            minimum: 0
            default: 0
      responses:
        '200':
          description: List of phone numbers
          content:
            application/json:
              schema:
                type: object
                properties:
                  numbers:
                    type: array
                    items:
                      $ref: '#/components/schemas/PhoneNumber'
                  total:
                    type: integer
                    example: 150
                  limit:
                    type: integer
                    example: 20
                  offset:
                    type: integer
                    example: 0

    post:
      tags:
        - Phone Numbers
      summary: Assign a phone number
      description: Assign an available phone number to the authenticated user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - phone_number_id
              properties:
                phone_number_id:
                  type: integer
                  example: 123
                duration_hours:
                  type: integer
                  minimum: 1
                  maximum: 24
                  default: 1
                  example: 2
      responses:
        '201':
          description: Phone number assigned successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PhoneNumber'
        '400':
          description: Bad request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '409':
          description: Phone number already assigned
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /numbers/{id}:
    get:
      tags:
        - Phone Numbers
      summary: Get phone number details
      description: Retrieve details of a specific phone number
      parameters:
        - name: id
          in: path
          required: true
          description: Phone number ID
          schema:
            type: integer
            example: 123
      responses:
        '200':
          description: Phone number details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PhoneNumber'
        '404':
          description: Phone number not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

    delete:
      tags:
        - Phone Numbers
      summary: Release phone number
      description: Release an assigned phone number back to available pool
      parameters:
        - name: id
          in: path
          required: true
          description: Phone number ID
          schema:
            type: integer
            example: 123
      responses:
        '200':
          description: Phone number released successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Phone number released successfully
        '403':
          description: Not authorized to release this number
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '404':
          description: Phone number not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /messages:
    get:
      tags:
        - Messages
      summary: Get messages
      description: Retrieve SMS messages for user's assigned phone numbers
      parameters:
        - name: phone_number_id
          in: query
          description: Filter by phone number ID
          schema:
            type: integer
            example: 123
        - name: message_type
          in: query
          description: Filter by message type
          schema:
            type: string
            enum: [sms, otp, verification]
            example: otp
        - name: is_read
          in: query
          description: Filter by read status
          schema:
            type: boolean
            example: false
        - name: since
          in: query
          description: Get messages since this timestamp
          schema:
            type: string
            format: date-time
            example: 2024-01-01T00:00:00Z
        - name: limit
          in: query
          description: Number of results to return
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 50
        - name: offset
          in: query
          description: Number of results to skip
          schema:
            type: integer
            minimum: 0
            default: 0
      responses:
        '200':
          description: List of messages
          content:
            application/json:
              schema:
                type: object
                properties:
                  messages:
                    type: array
                    items:
                      $ref: '#/components/schemas/Message'
                  total:
                    type: integer
                    example: 25
                  limit:
                    type: integer
                    example: 50
                  offset:
                    type: integer
                    example: 0

  /messages/{id}/read:
    patch:
      tags:
        - Messages
      summary: Mark message as read
      description: Mark a specific message as read
      parameters:
        - name: id
          in: path
          required: true
          description: Message ID
          schema:
            type: integer
            example: 456
      responses:
        '200':
          description: Message marked as read
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: Message marked as read
        '404':
          description: Message not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /webhooks/sms:
    post:
      tags:
        - Webhooks
      summary: SMS webhook endpoint
      description: Endpoint for receiving SMS webhooks from providers
      security: []
      parameters:
        - name: provider
          in: query
          required: true
          description: SMS provider name
          schema:
            type: string
            example: twilio
      requestBody:
        required: true
        content:
          application/x-www-form-urlencoded:
            schema:
              type: object
              properties:
                From:
                  type: string
                  example: "+1234567890"
                To:
                  type: string
                  example: "+1987654321"
                Body:
                  type: string
                  example: "Your verification code is 123456"
                MessageSid:
                  type: string
                  example: "SM1234567890abcdef"
      responses:
        '200':
          description: Webhook processed successfully
          content:
            text/plain:
              schema:
                type: string
                example: OK
        '400':
          description: Invalid webhook data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
          example: 123
        email:
          type: string
          format: email
          example: user@example.com
        first_name:
          type: string
          example: John
        last_name:
          type: string
          example: Doe
        role:
          type: string
          enum: [user, admin]
          example: user
        is_active:
          type: boolean
          example: true
        email_verified:
          type: boolean
          example: true
        created_at:
          type: string
          format: date-time
          example: 2024-01-01T00:00:00Z
        last_login:
          type: string
          format: date-time
          example: 2024-01-01T12:00:00Z

    PhoneNumber:
      type: object
      properties:
        id:
          type: integer
          example: 123
        phone_number:
          type: string
          example: "+1234567890"
        country_code:
          type: string
          example: "US"
        status:
          type: string
          enum: [available, assigned, expired, blocked]
          example: assigned
        assigned_at:
          type: string
          format: date-time
          example: 2024-01-01T12:00:00Z
        expires_at:
          type: string
          format: date-time
          example: 2024-01-01T13:00:00Z
        created_at:
          type: string
          format: date-time
          example: 2024-01-01T00:00:00Z

    Message:
      type: object
      properties:
        id:
          type: integer
          example: 456
        phone_number_id:
          type: integer
          example: 123
        phone_number:
          type: string
          example: "+1234567890"
        sender_number:
          type: string
          example: "+1987654321"
        message_content:
          type: string
          example: "Your verification code is 123456"
        message_type:
          type: string
          enum: [sms, otp, verification]
          example: otp
        received_at:
          type: string
          format: date-time
          example: 2024-01-01T12:30:00Z
        is_read:
          type: boolean
          example: false

    Error:
      type: object
      properties:
        error:
          type: string
          example: "Invalid request"
        message:
          type: string
          example: "The provided data is invalid"
        code:
          type: string
          example: "INVALID_REQUEST"
        details:
          type: object
          additionalProperties: true
```

### 3.2. API Rate Limiting Strategy

The API implements a comprehensive rate limiting strategy to prevent abuse and ensure fair usage:

#### 3.2.1. Rate Limit Tiers

- **Guest Users**: 10 requests per minute
- **Registered Users**: 100 requests per minute
- **Premium Users**: 500 requests per minute
- **Admin Users**: 1000 requests per minute

#### 3.2.2. Rate Limit Headers

All API responses include rate limiting headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 60
```

#### 3.2.3. Rate Limit Implementation

Rate limiting is implemented using a sliding window algorithm with Redis for distributed rate limiting across multiple server instances.

### 3.3. Error Handling Standards

The API follows consistent error handling patterns:

#### 3.3.1. HTTP Status Codes

- `200 OK`: Successful GET, PATCH requests
- `201 Created`: Successful POST requests
- `204 No Content`: Successful DELETE requests
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `422 Unprocessable Entity`: Validation errors
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server errors

#### 3.3.2. Error Response Format

All error responses follow a consistent format:

```json
{
  "error": "Validation Error",
  "message": "The provided data failed validation",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "email",
    "issue": "Invalid email format"
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "request_id": "req_123456789"
}
```


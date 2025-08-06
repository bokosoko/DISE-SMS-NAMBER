# DispoSMS User Manual

**Version:** 1.0.0  
**Platform:** Web Application  
**Author:** Manus AI  
**Last Updated:** August 6, 2025

## Table of Contents

1. [Getting Started](#getting-started)
2. [Account Management](#account-management)
3. [Phone Number Management](#phone-number-management)
4. [Receiving SMS Messages](#receiving-sms-messages)
5. [Dashboard Overview](#dashboard-overview)
6. [Advanced Features](#advanced-features)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)
9. [Support](#support)

## Getting Started

DispoSMS is a powerful platform that provides temporary phone numbers for SMS verification. Whether you need to verify accounts, receive OTP codes, or test SMS functionality, DispoSMS offers a reliable and secure solution with 100% message delivery guarantee.

### What is DispoSMS?

DispoSMS is a disposable SMS service that allows you to:

- **Receive SMS messages** on temporary phone numbers
- **Get instant OTP codes** for account verification
- **Protect your privacy** by not using your personal phone number
- **Access multiple numbers** simultaneously
- **Receive real-time notifications** when messages arrive
- **Automatically detect** and highlight OTP codes

### Key Benefits

- **100% Message Delivery:** Advanced failover system ensures all messages are received
- **Real-time Updates:** Instant notifications via WebSocket technology
- **Multiple Providers:** Integration with Twilio, Nexmo, and other reliable SMS providers
- **Global Coverage:** Phone numbers available from multiple countries
- **Secure & Private:** All messages are encrypted and automatically deleted after expiration
- **User-friendly Interface:** Clean, intuitive design that works on all devices

### System Requirements

DispoSMS is a web-based application that works on:

- **Desktop Browsers:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Browsers:** iOS Safari 14+, Android Chrome 90+
- **Internet Connection:** Stable internet connection required for real-time updates
- **JavaScript:** Must be enabled for full functionality

### Accessing DispoSMS

1. Open your web browser
2. Navigate to: **https://77h9ikcww70j.manus.space**
3. The application will load automatically

No downloads or installations required!

## Account Management

### Creating an Account

To start using DispoSMS, you need to create a free account:

1. **Visit the Registration Page**
   - Go to https://77h9ikcww70j.manus.space
   - Click the "Register" tab on the welcome screen

2. **Fill in Your Information**
   - **First Name:** Enter your first name
   - **Last Name:** Enter your last name
   - **Email Address:** Use a valid email address (this will be your username)
   - **Password:** Create a strong password (minimum 8 characters)

3. **Complete Registration**
   - Click the "Create Account" button
   - You'll be automatically logged in after successful registration

### Logging In

If you already have an account:

1. **Access the Login Form**
   - Go to https://77h9ikcww70j.manus.space
   - Ensure the "Login" tab is selected (default)

2. **Enter Your Credentials**
   - **Email:** Your registered email address
   - **Password:** Your account password

3. **Sign In**
   - Click the "Sign In" button
   - You'll be redirected to the dashboard upon successful login

### Account Security

DispoSMS takes security seriously:

- **Password Encryption:** All passwords are securely hashed using industry-standard algorithms
- **JWT Authentication:** Secure token-based authentication system
- **Session Management:** Automatic session expiration for security
- **HTTPS Encryption:** All data transmission is encrypted using TLS 1.3

### Password Requirements

For optimal security, your password should:
- Be at least 8 characters long
- Include a mix of uppercase and lowercase letters
- Contain at least one number
- Include special characters when possible
- Avoid common words or personal information

### Logging Out

To securely log out of your account:

1. Click your profile icon in the top-right corner
2. Select "Logout" from the dropdown menu
3. You'll be redirected to the login page

Always log out when using shared or public computers.

## Phone Number Management

### Understanding Phone Numbers

DispoSMS provides temporary phone numbers that you can use to receive SMS messages. These numbers are:

- **Temporary:** Available for a specific duration (1 hour to 24 hours)
- **Dedicated:** Assigned exclusively to your account during the rental period
- **Global:** Available from multiple countries and regions
- **Reliable:** Backed by premium SMS providers for guaranteed delivery

### Getting Available Numbers

To see what phone numbers are available:

1. **Navigate to Phone Numbers**
   - From the dashboard, click "Phone Numbers" in the sidebar
   - Or use the "Get Number" button on the dashboard

2. **Browse Available Numbers**
   - View the list of available phone numbers
   - See country, provider, and pricing information
   - Numbers are updated in real-time

3. **Filter Options**
   - **Country:** Select your preferred country
   - **Provider:** Choose specific SMS providers
   - **Price Range:** Filter by cost per hour

### Assigning a Phone Number

To assign a phone number to your account:

1. **Select a Number**
   - Browse the available numbers list
   - Click on your preferred number

2. **Choose Duration**
   - **1 Hour:** Perfect for quick verifications
   - **6 Hours:** Good for multiple verifications
   - **12 Hours:** Ideal for extended testing
   - **24 Hours:** Maximum duration available

3. **Confirm Assignment**
   - Review the number and duration
   - Click "Assign Number" to confirm
   - The number will be immediately available for receiving SMS

### Managing Your Numbers

Once you have assigned numbers, you can manage them from the "My Numbers" section:

#### Active Numbers

View all your currently active phone numbers:

- **Number:** The assigned phone number
- **Country:** Country of origin
- **Provider:** SMS provider (Twilio, Nexmo, etc.)
- **Assigned:** When the number was assigned
- **Expires:** When the assignment expires
- **Messages:** Number of received messages
- **Status:** Current status (Active, Expiring Soon, Expired)

#### Extending Assignments

If you need a number for longer:

1. **Find the Number**
   - Locate the number in your "My Numbers" list
   - Look for numbers with "Expiring Soon" status

2. **Extend Duration**
   - Click the "Extend" button next to the number
   - Choose additional duration (1-24 hours)
   - Confirm the extension

3. **Payment**
   - Additional charges apply for extensions
   - Payment is processed automatically

#### Releasing Numbers

To release a number before it expires:

1. **Select the Number**
   - Go to your "My Numbers" list
   - Find the number you want to release

2. **Release Early**
   - Click the "Release" button
   - Confirm the action in the popup

3. **Important Notes**
   - Released numbers cannot be recovered
   - No refunds for early releases
   - All messages for that number will be deleted

### Number Status Indicators

Understanding the status indicators:

| Status | Description | Action Required |
|--------|-------------|-----------------|
| **Active** | Number is working normally | None |
| **Expiring Soon** | Less than 30 minutes remaining | Consider extending |
| **Expired** | Assignment has ended | Assign a new number |
| **Released** | Manually released early | Assign a new number |
| **Error** | Technical issue with provider | Contact support |

## Receiving SMS Messages

### How SMS Reception Works

When someone sends an SMS to your assigned phone number:

1. **Message Arrives:** The SMS provider receives the message
2. **Processing:** DispoSMS processes and analyzes the message
3. **OTP Detection:** Automatic detection of verification codes
4. **Real-time Delivery:** Message appears instantly in your dashboard
5. **Notification:** You receive a real-time notification

### Viewing Messages

#### Dashboard View

The main dashboard shows:

- **Recent Messages:** Latest 5 messages across all numbers
- **Unread Count:** Number of unread messages
- **Quick Actions:** Mark as read, copy OTP, etc.

#### Messages Page

For detailed message management:

1. **Access Messages**
   - Click "Messages" in the sidebar
   - View all messages across all your numbers

2. **Message Information**
   - **From:** Sender's phone number
   - **To:** Your assigned number
   - **Content:** Full message text
   - **Time:** When the message was received
   - **Type:** Message category (OTP, Verification, etc.)
   - **Status:** Read/Unread status

#### Filtering Messages

Use filters to find specific messages:

- **By Number:** Show messages for a specific phone number
- **By Type:** Filter by OTP, verification, notification, etc.
- **By Date:** Select date range
- **By Status:** Show only read or unread messages
- **By Sender:** Filter by sender's number

### OTP Code Detection

DispoSMS automatically detects and highlights OTP codes:

#### Automatic Detection

The system recognizes common OTP patterns:
- **Numeric codes:** 4-8 digit numbers
- **Alphanumeric codes:** Mixed letters and numbers
- **Common formats:** "Your code is 123456", "Verification: 123456"
- **Multiple languages:** Support for various languages

#### OTP Highlighting

When an OTP is detected:
- **Visual Highlight:** Code is highlighted in the message
- **Copy Button:** One-click copy to clipboard
- **Notification:** Special notification for OTP messages
- **Quick Access:** OTP codes shown prominently in the interface

#### Manual OTP Extraction

If automatic detection misses a code:
1. **Select the Code:** Highlight the code in the message
2. **Copy Manually:** Use Ctrl+C (Cmd+C on Mac)
3. **Report Issue:** Help improve detection by reporting missed codes

### Real-time Notifications

DispoSMS provides instant notifications when messages arrive:

#### Browser Notifications

- **Permission Required:** Allow notifications when prompted
- **Instant Alerts:** Notifications appear immediately
- **Message Preview:** See sender and partial content
- **Click to View:** Click notification to open the message

#### In-App Notifications

- **Toast Messages:** Popup notifications within the app
- **Sound Alerts:** Optional audio notifications
- **Visual Indicators:** Unread message counters
- **Real-time Updates:** Messages appear without page refresh

#### Notification Settings

Customize your notification preferences:

1. **Access Settings**
   - Click your profile icon
   - Select "Notification Settings"

2. **Configure Options**
   - **Browser Notifications:** Enable/disable
   - **Sound Alerts:** Choose notification sounds
   - **OTP Priority:** Special handling for OTP messages
   - **Quiet Hours:** Disable notifications during specific times

### Message Management

#### Marking as Read

To mark messages as read:

- **Individual Messages:** Click the "Mark as Read" button
- **Bulk Actions:** Select multiple messages and mark all as read
- **Auto-read:** Messages are automatically marked as read when viewed

#### Copying Message Content

To copy message content:

1. **Full Message:** Click the copy icon next to the message
2. **OTP Only:** Click the copy button next to highlighted OTP codes
3. **Partial Text:** Select and copy specific parts of the message

#### Message Retention

Important information about message storage:

- **Active Period:** Messages are stored while the number is assigned
- **Grace Period:** Messages remain for 24 hours after number expiration
- **Automatic Deletion:** Messages are permanently deleted after the grace period
- **No Recovery:** Deleted messages cannot be recovered

### Message Types

DispoSMS categorizes messages automatically:

#### OTP (One-Time Password)
- **Description:** Verification codes for account access
- **Examples:** "Your code is 123456", "Login code: ABC123"
- **Special Handling:** Highlighted and prioritized

#### Verification
- **Description:** Account verification messages
- **Examples:** "Click to verify your email", "Confirm your phone number"
- **Features:** Link detection and safety warnings

#### Notification
- **Description:** Service notifications and alerts
- **Examples:** "Your order has shipped", "Payment received"
- **Handling:** Standard message processing

#### Marketing
- **Description:** Promotional and marketing messages
- **Examples:** "50% off sale", "New product announcement"
- **Options:** Can be filtered or hidden

#### Other
- **Description:** Messages that don't fit other categories
- **Handling:** Standard processing with manual categorization option


## Dashboard Overview

The DispoSMS dashboard is your central hub for managing phone numbers and messages. It provides a comprehensive overview of your account activity and quick access to all features.

### Dashboard Layout

#### Header Section

The top header contains:

- **Logo:** DispoSMS branding and home link
- **Navigation Menu:** Quick access to main sections
- **Connection Status:** Real-time connection indicator
- **User Profile:** Account menu and settings
- **Notifications:** Alert center for important updates

#### Sidebar Navigation

The left sidebar provides access to:

- **Dashboard:** Main overview page
- **Phone Numbers:** Number management
- **Messages:** Message center
- **Settings:** Account preferences
- **Help:** Support and documentation

#### Main Content Area

The central area displays:

- **Statistics Cards:** Key metrics and counts
- **Recent Activity:** Latest messages and actions
- **Quick Actions:** Common tasks and shortcuts
- **Status Indicators:** System health and alerts

### Statistics Overview

#### Account Statistics

The dashboard displays key metrics:

**Active Numbers**
- Count of currently assigned phone numbers
- Visual indicator of usage vs. limits
- Quick link to assign more numbers

**Total Messages**
- Count of all received messages
- Breakdown by message type (OTP, verification, etc.)
- Trend indicator (increase/decrease)

**Unread Messages**
- Count of unread messages
- Priority indicator for OTP messages
- Quick link to message center

**Account Status**
- Current subscription tier
- Usage statistics
- Billing information

#### Real-time Updates

All statistics update in real-time:
- **Live Counters:** Numbers change as events occur
- **Visual Animations:** Smooth transitions for updates
- **Color Coding:** Green for positive, red for alerts
- **Trend Indicators:** Arrows showing increase/decrease

### Recent Activity

#### Message Feed

The recent activity section shows:

- **Latest Messages:** Most recent 5-10 messages
- **Sender Information:** Phone number and carrier
- **Message Preview:** First 50 characters of content
- **OTP Highlighting:** Detected codes are emphasized
- **Timestamp:** Relative time (e.g., "2 minutes ago")

#### Activity Types

Different activities are displayed:

- **New Messages:** SMS received on your numbers
- **Number Assignments:** New phone numbers assigned
- **Number Expirations:** Numbers that have expired
- **System Notifications:** Important system updates

#### Quick Actions

From the activity feed, you can:

- **View Full Message:** Click to see complete content
- **Copy OTP:** One-click copy for verification codes
- **Mark as Read:** Update message status
- **Reply (if supported):** Send response messages

### Connection Status

#### Real-time Indicator

The connection status shows:

**Connected (Green)**
- Real-time updates are working
- Messages will appear instantly
- All features are available

**Connecting (Yellow)**
- Attempting to establish connection
- Some delays may occur
- Automatic retry in progress

**Disconnected (Red)**
- No real-time updates
- Manual refresh required
- Check internet connection

#### Troubleshooting Connection

If you see connection issues:

1. **Check Internet:** Ensure stable internet connection
2. **Refresh Page:** Reload the browser page
3. **Clear Cache:** Clear browser cache and cookies
4. **Try Different Browser:** Test with another browser
5. **Contact Support:** If issues persist

### Quick Actions

#### Number Management

Quick actions for phone numbers:

- **Get New Number:** Assign a fresh phone number
- **Extend Numbers:** Add time to expiring numbers
- **Release Numbers:** Free up unused numbers
- **View All Numbers:** Access complete number list

#### Message Management

Quick actions for messages:

- **View All Messages:** Access message center
- **Mark All Read:** Clear unread indicators
- **Filter Messages:** Find specific messages
- **Export Messages:** Download message history

#### Account Management

Quick actions for your account:

- **Update Profile:** Change personal information
- **Billing Settings:** Manage payment methods
- **Notification Preferences:** Customize alerts
- **Security Settings:** Update password and security

### Responsive Design

The dashboard adapts to different screen sizes:

#### Desktop View (1200px+)
- Full sidebar navigation
- Multi-column layout
- Detailed statistics cards
- Complete activity feed

#### Tablet View (768px - 1199px)
- Collapsible sidebar
- Two-column layout
- Condensed statistics
- Abbreviated activity feed

#### Mobile View (< 768px)
- Hidden sidebar (hamburger menu)
- Single-column layout
- Stacked statistics
- Simplified activity feed

## Advanced Features

### Webhook Integration

For developers and advanced users, DispoSMS supports webhook integration to receive real-time notifications in your own applications.

#### Setting Up Webhooks

1. **Access Webhook Settings**
   - Go to Settings > Developer
   - Click "Webhook Configuration"

2. **Configure Endpoint**
   - **URL:** Your webhook endpoint URL
   - **Secret:** Shared secret for verification
   - **Events:** Select which events to receive

3. **Test Webhook**
   - Use the test button to verify configuration
   - Check your endpoint receives test payload
   - Verify signature validation works

#### Webhook Events

Available webhook events:

**message.received**
- Triggered when a new SMS arrives
- Includes full message content and metadata
- Real-time delivery (< 1 second delay)

**number.assigned**
- Triggered when a number is assigned
- Includes number details and expiration
- Useful for tracking number usage

**number.expired**
- Triggered when a number expires
- Includes final message count
- Helps with cleanup and reporting

**number.released**
- Triggered when a number is manually released
- Includes release reason and timestamp
- Useful for usage analytics

#### Webhook Payload Format

All webhooks use a consistent JSON format:

```json
{
  "event": "message.received",
  "timestamp": "2025-08-06T12:30:00.000Z",
  "data": {
    "message": {
      "id": "msg_456",
      "to_number": "+1234567890",
      "from_number": "+0987654321",
      "content": "Your verification code is 123456",
      "type": "otp",
      "otp_code": "123456",
      "received_at": "2025-08-06T12:30:00.000Z"
    },
    "assignment": {
      "id": "assign_123",
      "user_id": 1
    }
  },
  "signature": "sha256=abc123..."
}
```

#### Signature Verification

Verify webhook authenticity:

```python
import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    expected = hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(f"sha256={expected}", signature)
```

### API Integration

DispoSMS provides a comprehensive REST API for programmatic access.

#### API Authentication

Use JWT tokens for API authentication:

1. **Get Access Token**
   - Login via API to receive JWT token
   - Token expires after 1 hour
   - Use refresh token for renewal

2. **Include in Requests**
   - Add `Authorization: Bearer <token>` header
   - Include in all API requests
   - Handle token expiration gracefully

#### Common API Operations

**Assign a Number**
```bash
curl -X POST https://77h9ikcww70j.manus.space/api/numbers/assign \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"number": "+1234567890", "duration": 3600}'
```

**Get Messages**
```bash
curl -X GET https://77h9ikcww70j.manus.space/api/messages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**WebSocket Connection**
```javascript
const socket = io('https://77h9ikcww70j.manus.space', {
  auth: { token: 'YOUR_TOKEN' }
});
```

### Bulk Operations

For users managing multiple numbers or high message volumes:

#### Bulk Number Assignment

Assign multiple numbers at once:

1. **Access Bulk Tools**
   - Go to Phone Numbers > Bulk Operations
   - Select "Bulk Assign"

2. **Configure Assignment**
   - **Quantity:** Number of numbers to assign
   - **Country:** Preferred country
   - **Duration:** Assignment duration for all
   - **Provider:** Specific provider or auto-select

3. **Execute Assignment**
   - Review configuration
   - Confirm bulk assignment
   - Monitor progress in real-time

#### Bulk Message Export

Export large volumes of messages:

1. **Access Export Tools**
   - Go to Messages > Export
   - Select "Bulk Export"

2. **Configure Export**
   - **Date Range:** Start and end dates
   - **Numbers:** Specific numbers or all
   - **Format:** CSV, JSON, or XML
   - **Filters:** Message type, read status, etc.

3. **Download Export**
   - Process runs in background
   - Email notification when complete
   - Download link valid for 24 hours

### Advanced Filtering

#### Smart Filters

Create complex message filters:

**OTP Filter**
- Automatically detect OTP messages
- Filter by code length (4-8 digits)
- Exclude non-verification messages

**Sender Filter**
- Filter by specific sender numbers
- Block unwanted senders
- Whitelist trusted senders

**Content Filter**
- Keyword-based filtering
- Regular expression support
- Case-sensitive options

**Time Filter**
- Messages within specific hours
- Date range filtering
- Timezone-aware filtering

#### Saved Filters

Save frequently used filters:

1. **Create Filter**
   - Configure filter criteria
   - Test filter results
   - Name and save filter

2. **Apply Saved Filters**
   - Quick access from dropdown
   - One-click application
   - Modify existing filters

### Automation Rules

Set up automated actions based on message content:

#### Auto-forwarding

Forward messages to external systems:

- **Email Forwarding:** Send messages to email
- **Webhook Forwarding:** POST to your endpoint
- **SMS Forwarding:** Forward to another number

#### Auto-categorization

Automatically categorize messages:

- **Rule-based:** Based on sender or content
- **Machine Learning:** AI-powered categorization
- **Manual Override:** Correct categorization

#### Auto-responses

Send automatic responses (where supported):

- **Confirmation Messages:** "Message received"
- **OTP Acknowledgment:** "Code copied"
- **Custom Responses:** User-defined messages

### Integration Examples

#### E-commerce Platform

Integrate with your online store:

```javascript
// Monitor order verification messages
socket.on('new_message', (data) => {
  if (data.message.content.includes('order confirmation')) {
    updateOrderStatus(data.message.otp_code);
  }
});
```

#### Testing Framework

Automate SMS testing:

```python
# Automated testing workflow
def test_sms_verification():
    # Assign number
    number = client.assign_number(duration=3600)
    
    # Trigger SMS in your app
    trigger_verification_sms(number['data']['number'])
    
    # Wait for message
    message = wait_for_message(number['data']['assignment_id'])
    
    # Extract and use OTP
    otp = message['otp_code']
    complete_verification(otp)
```

#### Customer Support

Integrate with support systems:

```javascript
// Forward customer messages to support
webhook.on('message.received', (data) => {
  if (data.message.from_number in customer_numbers) {
    createSupportTicket({
      customer: data.message.from_number,
      message: data.message.content,
      timestamp: data.message.received_at
    });
  }
});
```


## Troubleshooting

### Common Issues and Solutions

#### Messages Not Appearing

**Problem:** SMS messages are not showing up in your dashboard.

**Possible Causes:**
- Number assignment has expired
- Internet connection issues
- Browser cache problems
- SMS provider delays

**Solutions:**

1. **Check Number Status**
   - Go to "My Numbers" section
   - Verify the number is still active
   - Check expiration time

2. **Verify Connection**
   - Look for connection status indicator
   - Refresh the page if disconnected
   - Check your internet connection

3. **Clear Browser Cache**
   - Press Ctrl+Shift+R (Cmd+Shift+R on Mac)
   - Or clear cache manually in browser settings
   - Try incognito/private browsing mode

4. **Wait for Delivery**
   - SMS delivery can take 1-30 seconds
   - Some providers may have delays
   - Check again after a few minutes

#### OTP Codes Not Detected

**Problem:** OTP codes are not being automatically highlighted.

**Possible Causes:**
- Unusual OTP format
- Non-standard message structure
- Language not supported
- Code embedded in complex text

**Solutions:**

1. **Manual Copy**
   - Select the code manually
   - Use Ctrl+C to copy
   - The code should still work

2. **Check Message Type**
   - Verify message is categorized correctly
   - Some messages may not contain OTPs
   - Look for numeric sequences

3. **Report Issue**
   - Use the "Report Detection Issue" button
   - Help improve the detection system
   - Include message content (if comfortable)

#### Connection Problems

**Problem:** Real-time updates are not working.

**Possible Causes:**
- Firewall blocking WebSocket connections
- Corporate network restrictions
- Browser compatibility issues
- Server maintenance

**Solutions:**

1. **Check Firewall**
   - Ensure WebSocket connections are allowed
   - Add DispoSMS to firewall exceptions
   - Contact IT department if on corporate network

2. **Try Different Browser**
   - Test with Chrome, Firefox, or Safari
   - Ensure JavaScript is enabled
   - Update browser to latest version

3. **Disable Extensions**
   - Temporarily disable ad blockers
   - Turn off VPN if using one
   - Test with browser extensions disabled

#### Login Issues

**Problem:** Cannot log into your account.

**Possible Causes:**
- Incorrect email or password
- Account locked due to failed attempts
- Browser cookie issues
- Account suspension

**Solutions:**

1. **Verify Credentials**
   - Double-check email address
   - Ensure correct password
   - Check for caps lock

2. **Reset Password**
   - Click "Forgot Password" link
   - Check email for reset instructions
   - Follow the reset process

3. **Clear Cookies**
   - Clear browser cookies for the site
   - Try logging in again
   - Use incognito mode to test

4. **Contact Support**
   - If account is locked or suspended
   - Provide account email address
   - Explain the issue in detail

#### Number Assignment Failures

**Problem:** Cannot assign a phone number.

**Possible Causes:**
- Number no longer available
- Account limits reached
- Payment issues
- Provider restrictions

**Solutions:**

1. **Try Different Number**
   - Refresh the available numbers list
   - Select a different number
   - Check multiple countries

2. **Check Account Limits**
   - Verify you haven't reached number limits
   - Release unused numbers
   - Upgrade account if needed

3. **Verify Payment**
   - Ensure payment method is valid
   - Check for sufficient funds
   - Update billing information

### Browser Compatibility

#### Supported Browsers

DispoSMS works best with modern browsers:

**Fully Supported:**
- Chrome 90+ (Recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

**Limited Support:**
- Internet Explorer 11 (basic functionality only)
- Older browser versions (may have issues)

#### Browser-Specific Issues

**Chrome:**
- Generally works best
- Full WebSocket support
- All features available

**Firefox:**
- Excellent compatibility
- May need to allow notifications
- WebSocket works well

**Safari:**
- Good compatibility
- Some notification limitations
- WebSocket support varies

**Edge:**
- Modern Edge works well
- Legacy Edge has limitations
- Update to latest version

#### Mobile Browsers

**iOS Safari:**
- Works well on iOS 14+
- Touch-friendly interface
- Some notification limitations

**Android Chrome:**
- Excellent mobile experience
- Full feature support
- Responsive design

### Network Issues

#### Corporate Networks

Many corporate networks have restrictions:

**Common Restrictions:**
- WebSocket connections blocked
- Port 443 restrictions
- Proxy server interference
- Content filtering

**Solutions:**
- Contact IT department
- Request whitelist for DispoSMS
- Use mobile data as alternative
- Try VPN if allowed

#### VPN Issues

VPN usage may cause problems:

**Potential Issues:**
- IP address changes
- Connection instability
- Geographic restrictions
- Speed limitations

**Solutions:**
- Disconnect VPN temporarily
- Choose stable VPN server
- Use VPN with static IP
- Contact VPN provider

### Performance Issues

#### Slow Loading

If the application loads slowly:

1. **Check Internet Speed**
   - Test connection speed
   - Ensure stable connection
   - Close other bandwidth-heavy applications

2. **Clear Browser Data**
   - Clear cache and cookies
   - Remove old stored data
   - Restart browser

3. **Disable Extensions**
   - Turn off unnecessary browser extensions
   - Disable ad blockers temporarily
   - Test with minimal extensions

#### High Memory Usage

If browser uses too much memory:

1. **Close Other Tabs**
   - Limit number of open tabs
   - Close unused applications
   - Restart browser periodically

2. **Update Browser**
   - Use latest browser version
   - Install security updates
   - Consider switching browsers

## FAQ

### General Questions

**Q: What is DispoSMS?**
A: DispoSMS is a service that provides temporary phone numbers for receiving SMS messages. It's perfect for account verification, testing, and protecting your privacy.

**Q: How much does it cost?**
A: Pricing varies by country and duration. Most numbers cost $0.05-$0.50 per hour. Check the pricing page for current rates.

**Q: Is my data secure?**
A: Yes, all data is encrypted in transit and at rest. Messages are automatically deleted after the number expires, and we never share your information.

**Q: Can I use this for illegal activities?**
A: No, DispoSMS is intended for legitimate purposes only. Illegal use is prohibited and will result in account termination.

### Phone Numbers

**Q: How long can I keep a phone number?**
A: Numbers can be assigned for 1-24 hours. You can extend the assignment before it expires.

**Q: Can I get the same number again?**
A: Numbers are recycled after a cooling-off period. You might get the same number again, but it's not guaranteed.

**Q: What countries are available?**
A: We offer numbers from 50+ countries including US, UK, Canada, Germany, France, and many others.

**Q: Can I receive calls on these numbers?**
A: Currently, DispoSMS only supports SMS messages. Voice calls are not supported.

**Q: How many numbers can I have at once?**
A: Free accounts can have up to 3 active numbers. Premium accounts can have up to 50 active numbers.

### Messages

**Q: How quickly do messages arrive?**
A: Most messages arrive within 1-5 seconds. Some providers may take up to 30 seconds.

**Q: Can I reply to messages?**
A: Reply functionality is limited and depends on the SMS provider. Most numbers are receive-only.

**Q: What happens to messages after the number expires?**
A: Messages are kept for 24 hours after expiration, then permanently deleted.

**Q: Can I export my messages?**
A: Yes, you can export messages in CSV, JSON, or XML format from the Messages section.

**Q: Are there message limits?**
A: No, there are no limits on the number of messages you can receive.

### Technical Questions

**Q: Do you have an API?**
A: Yes, we provide a comprehensive REST API and WebSocket support. See the API documentation for details.

**Q: Can I integrate this with my application?**
A: Absolutely! We provide SDKs for popular programming languages and detailed integration guides.

**Q: Do you support webhooks?**
A: Yes, you can configure webhooks to receive real-time notifications in your own applications.

**Q: Is there a mobile app?**
A: Currently, DispoSMS is web-based only. However, the website is fully responsive and works great on mobile devices.

### Billing and Accounts

**Q: Do you offer free trials?**
A: Yes, new accounts receive free credits to test the service.

**Q: What payment methods do you accept?**
A: We accept major credit cards, PayPal, and cryptocurrency payments.

**Q: Can I get a refund?**
A: Refunds are available for unused credits within 30 days of purchase.

**Q: How do I upgrade my account?**
A: Go to Settings > Billing to view and upgrade your account plan.

### Privacy and Security

**Q: Do you log messages?**
A: Messages are temporarily stored for delivery but are automatically deleted after the retention period.

**Q: Can you see my messages?**
A: Our staff cannot access your messages unless required for technical support with your explicit permission.

**Q: Do you share data with third parties?**
A: No, we never share your personal data or messages with third parties.

**Q: How do you protect against spam?**
A: We use advanced filtering and work with SMS providers to minimize spam messages.

## Support

### Getting Help

If you need assistance with DispoSMS, we offer multiple support channels:

#### Documentation

**User Manual:** This comprehensive guide covers all features and common issues.

**API Documentation:** Technical documentation for developers integrating with our API.

**Video Tutorials:** Step-by-step video guides for common tasks.

**Knowledge Base:** Searchable database of articles and solutions.

#### Support Channels

**Email Support**
- **Address:** support@disposms.com
- **Response Time:** 24-48 hours
- **Best For:** Account issues, billing questions, technical problems

**Live Chat**
- **Availability:** Monday-Friday, 9 AM - 6 PM UTC
- **Response Time:** Usually within 5 minutes
- **Best For:** Quick questions, immediate assistance

**Community Forum**
- **URL:** https://forum.disposms.com
- **Response Time:** Community-driven
- **Best For:** General questions, feature requests, discussions

**GitHub Issues**
- **URL:** https://github.com/disposms/issues
- **Response Time:** 1-3 business days
- **Best For:** Bug reports, feature requests, technical issues

#### Support Ticket System

For complex issues, use our ticket system:

1. **Create Ticket**
   - Go to Settings > Support
   - Click "Create New Ticket"
   - Provide detailed description

2. **Include Information**
   - Account email address
   - Browser and version
   - Steps to reproduce issue
   - Screenshots if helpful

3. **Track Progress**
   - Receive email updates
   - Check ticket status online
   - Add additional information as needed

### Emergency Support

For urgent issues affecting service availability:

**Emergency Hotline:** +1-555-DISPOSMS
**Available:** 24/7 for critical issues only
**Response:** Within 1 hour

### Feature Requests

We welcome suggestions for new features:

1. **Community Forum**
   - Post in the "Feature Requests" section
   - Get community feedback
   - Vote on existing requests

2. **Direct Submission**
   - Email: features@disposms.com
   - Include detailed description
   - Explain use case and benefits

3. **Developer Feedback**
   - GitHub issues for technical features
   - API enhancement requests
   - Integration improvements

### Status and Updates

Stay informed about service status:

**Status Page:** https://status.disposms.com
- Real-time service status
- Planned maintenance notifications
- Incident reports and updates

**Social Media:**
- Twitter: @DispoSMS
- LinkedIn: DispoSMS Official
- Regular updates and announcements

**Email Notifications:**
- Service disruption alerts
- Planned maintenance notices
- Feature announcements

### Training and Onboarding

For teams and enterprise users:

**Onboarding Sessions**
- Personalized training sessions
- Best practices guidance
- Integration assistance

**Custom Training**
- Tailored to your use case
- Team training sessions
- Advanced feature workshops

**Dedicated Support**
- Enterprise support plans
- Dedicated account manager
- Priority response times

---

**Need immediate help?** Contact our support team at support@disposms.com or use the live chat feature in the application.

**Last Updated:** August 6, 2025  
**Manual Version:** 1.0.0  
**Application Version:** 1.0.0


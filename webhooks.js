const express = require('express');
const crypto = require('crypto');
const Message = require('../models/Message');
const PhoneNumber = require('../models/PhoneNumber');

const router = express.Router();

// Middleware to verify webhook signatures
const verifyWebhookSignature = (provider) => {
  return (req, res, next) => {
    try {
      const signature = req.headers['x-twilio-signature'] || req.headers['x-nexmo-signature'];
      const webhookSecret = process.env.WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.warn('WEBHOOK_SECRET not configured, skipping signature verification');
        return next();
      }

      if (!signature) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'MISSING_SIGNATURE',
            message: 'Webhook signature is required'
          }
        });
      }

      // Verify signature based on provider
      let isValid = false;

      if (provider === 'twilio') {
        const expectedSignature = crypto
          .createHmac('sha1', webhookSecret)
          .update(JSON.stringify(req.body))
          .digest('base64');
        isValid = signature === expectedSignature;
      } else if (provider === 'nexmo') {
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(JSON.stringify(req.body))
          .digest('hex');
        isValid = signature === expectedSignature;
      }

      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'Invalid webhook signature'
          }
        });
      }

      next();
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SIGNATURE_VERIFICATION_ERROR',
          message: 'Failed to verify webhook signature'
        }
      });
    }
  };
};

// @route   POST /api/webhooks/twilio/sms
// @desc    Handle incoming SMS from Twilio
// @access  Public (with signature verification)
router.post('/twilio/sms', verifyWebhookSignature('twilio'), async (req, res, next) => {
  try {
    const {
      MessageSid,
      From,
      To,
      Body,
      NumMedia,
      MediaUrl0,
      MediaContentType0
    } = req.body;

    console.log('Twilio SMS webhook received:', {
      MessageSid,
      From,
      To,
      Body: Body?.substring(0, 100) + '...'
    });

    // Find the phone number
    const phoneNumber = await PhoneNumber.findOne({
      phoneNumber: To
    }).populate('user');

    if (!phoneNumber) {
      console.warn(`Phone number ${To} not found in database`);
      return res.status(404).json({
        success: false,
        error: {
          code: 'PHONE_NUMBER_NOT_FOUND',
          message: 'Phone number not found'
        }
      });
    }

    if (!phoneNumber.user) {
      console.warn(`Phone number ${To} is not assigned to any user`);
      return res.status(400).json({
        success: false,
        error: {
          code: 'PHONE_NUMBER_NOT_ASSIGNED',
          message: 'Phone number is not assigned to any user'
        }
      });
    }

    // Create message data
    const messageData = {
      fromNumber: From,
      toNumber: To,
      content: Body || '',
      provider: 'twilio',
      providerMessageId: MessageSid,
      metadata: {
        numMedia: NumMedia || 0,
        mediaUrl: MediaUrl0,
        mediaContentType: MediaContentType0
      }
    };

    // Handle MMS attachments
    if (NumMedia && parseInt(NumMedia) > 0) {
      messageData.attachments = [];
      for (let i = 0; i < parseInt(NumMedia); i++) {
        const mediaUrl = req.body[`MediaUrl${i}`];
        const mediaContentType = req.body[`MediaContentType${i}`];
        
        if (mediaUrl) {
          messageData.attachments.push({
            type: mediaContentType?.startsWith('image/') ? 'image' : 
                  mediaContentType?.startsWith('video/') ? 'video' :
                  mediaContentType?.startsWith('audio/') ? 'audio' : 'document',
            url: mediaUrl,
            mimeType: mediaContentType
          });
        }
      }
      messageData.messageType = 'mms';
    }

    // Create message
    const message = await Message.createFromWebhook(messageData);

    // Emit real-time event (if socket.io is available)
    if (req.app.get('io')) {
      req.app.get('io').to(`user_${phoneNumber.user._id}`).emit('new_message', {
        message: {
          ...message.toJSON(),
          formattedContent: message.getFormattedContent()
        }
      });
    }

    console.log(`Message created: ${message._id} for user ${phoneNumber.user._id}`);

    res.json({
      success: true,
      data: {
        messageId: message._id,
        processed: true
      }
    });

  } catch (error) {
    console.error('Twilio webhook error:', error);
    next(error);
  }
});

// @route   POST /api/webhooks/nexmo/sms
// @desc    Handle incoming SMS from Nexmo/Vonage
// @access  Public (with signature verification)
router.post('/nexmo/sms', verifyWebhookSignature('nexmo'), async (req, res, next) => {
  try {
    const {
      messageId,
      from,
      to,
      text,
      type,
      'message-timestamp': timestamp
    } = req.body;

    console.log('Nexmo SMS webhook received:', {
      messageId,
      from,
      to,
      text: text?.substring(0, 100) + '...'
    });

    // Find the phone number
    const phoneNumber = await PhoneNumber.findOne({
      phoneNumber: to
    }).populate('user');

    if (!phoneNumber) {
      console.warn(`Phone number ${to} not found in database`);
      return res.status(404).json({
        success: false,
        error: {
          code: 'PHONE_NUMBER_NOT_FOUND',
          message: 'Phone number not found'
        }
      });
    }

    if (!phoneNumber.user) {
      console.warn(`Phone number ${to} is not assigned to any user`);
      return res.status(400).json({
        success: false,
        error: {
          code: 'PHONE_NUMBER_NOT_ASSIGNED',
          message: 'Phone number is not assigned to any user'
        }
      });
    }

    // Create message data
    const messageData = {
      fromNumber: from,
      toNumber: to,
      content: text || '',
      provider: 'nexmo',
      providerMessageId: messageId,
      metadata: {
        type,
        timestamp
      }
    };

    // Create message
    const message = await Message.createFromWebhook(messageData);

    // Emit real-time event (if socket.io is available)
    if (req.app.get('io')) {
      req.app.get('io').to(`user_${phoneNumber.user._id}`).emit('new_message', {
        message: {
          ...message.toJSON(),
          formattedContent: message.getFormattedContent()
        }
      });
    }

    console.log(`Message created: ${message._id} for user ${phoneNumber.user._id}`);

    res.json({
      success: true,
      data: {
        messageId: message._id,
        processed: true
      }
    });

  } catch (error) {
    console.error('Nexmo webhook error:', error);
    next(error);
  }
});

// @route   POST /api/webhooks/twilio/status
// @desc    Handle delivery status updates from Twilio
// @access  Public (with signature verification)
router.post('/twilio/status', verifyWebhookSignature('twilio'), async (req, res, next) => {
  try {
    const {
      MessageSid,
      MessageStatus,
      ErrorCode,
      ErrorMessage
    } = req.body;

    console.log('Twilio status webhook received:', {
      MessageSid,
      MessageStatus,
      ErrorCode
    });

    // Find message by provider ID
    const message = await Message.findOne({
      providerMessageId: MessageSid,
      provider: 'twilio'
    });

    if (message) {
      // Update message metadata with status
      message.metadata = {
        ...message.metadata,
        deliveryStatus: MessageStatus,
        errorCode: ErrorCode,
        errorMessage: ErrorMessage,
        statusUpdatedAt: new Date()
      };
      
      await message.save();

      // Emit real-time event for status update
      if (req.app.get('io')) {
        req.app.get('io').to(`user_${message.user}`).emit('message_status_update', {
          messageId: message._id,
          status: MessageStatus,
          error: ErrorCode ? { code: ErrorCode, message: ErrorMessage } : null
        });
      }
    }

    res.json({
      success: true,
      data: {
        messageId: message?._id,
        status: MessageStatus,
        processed: true
      }
    });

  } catch (error) {
    console.error('Twilio status webhook error:', error);
    next(error);
  }
});

// @route   GET /api/webhooks/test
// @desc    Test webhook endpoint
// @access  Public
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// @route   POST /api/webhooks/test/message
// @desc    Test message creation (development only)
// @access  Public
router.post('/test/message', async (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint not available in production'
      }
    });
  }

  try {
    const {
      phoneNumber,
      fromNumber,
      content
    } = req.body;

    if (!phoneNumber || !fromNumber || !content) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'phoneNumber, fromNumber, and content are required'
        }
      });
    }

    // Create test message
    const messageData = {
      fromNumber,
      toNumber: phoneNumber,
      content,
      provider: 'test',
      providerMessageId: `test_${Date.now()}`,
      metadata: {
        test: true,
        createdAt: new Date()
      }
    };

    const message = await Message.createFromWebhook(messageData);

    // Emit real-time event
    if (req.app.get('io')) {
      const phoneNumberDoc = await PhoneNumber.findOne({ phoneNumber }).populate('user');
      if (phoneNumberDoc?.user) {
        req.app.get('io').to(`user_${phoneNumberDoc.user._id}`).emit('new_message', {
          message: {
            ...message.toJSON(),
            formattedContent: message.getFormattedContent()
          }
        });
      }
    }

    res.json({
      success: true,
      data: {
        message: {
          ...message.toJSON(),
          formattedContent: message.getFormattedContent()
        }
      },
      message: 'Test message created successfully'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;


const express = require('express');
const Joi = require('joi');
const Message = require('../models/Message');
const PhoneNumber = require('../models/PhoneNumber');

const router = express.Router();

// @route   GET /api/messages
// @desc    Get user's messages
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const {
      phoneNumberId,
      messageType,
      isRead,
      since,
      page = 1,
      limit = 50,
      sort = 'newest'
    } = req.query;

    // Validate query parameters
    const querySchema = Joi.object({
      phoneNumberId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
      messageType: Joi.string().valid('sms', 'mms', 'otp', 'verification', 'notification', 'other').optional(),
      isRead: Joi.boolean().optional(),
      since: Joi.date().iso().optional(),
      page: Joi.number().min(1).default(1),
      limit: Joi.number().min(1).max(100).default(50),
      sort: Joi.string().valid('newest', 'oldest').default('newest')
    });

    const { error, value } = querySchema.validate({
      phoneNumberId,
      messageType,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      since,
      page: parseInt(page),
      limit: parseInt(limit),
      sort
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.details.map(detail => ({
            field: detail.path[0],
            message: detail.message
          }))
        }
      });
    }

    const userId = req.user._id;
    const offset = (value.page - 1) * value.limit;
    const sortOrder = value.sort === 'newest' ? { receivedAt: -1 } : { receivedAt: 1 };

    // If phoneNumberId is provided, verify it belongs to the user
    if (value.phoneNumberId) {
      const phoneNumber = await PhoneNumber.findOne({
        _id: value.phoneNumberId,
        user: userId
      });

      if (!phoneNumber) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PHONE_NUMBER_NOT_FOUND',
            message: 'Phone number not found or not assigned to you'
          }
        });
      }
    }

    // Get messages
    const [messages, total] = await Promise.all([
      Message.findByUser(userId, {
        phoneNumberId: value.phoneNumberId,
        messageType: value.messageType,
        isRead: value.isRead,
        since: value.since,
        limit: value.limit,
        offset,
        sort: sortOrder
      }),
      Message.countDocuments({
        user: userId,
        ...(value.phoneNumberId && { phoneNumber: value.phoneNumberId }),
        ...(value.messageType && { messageType: value.messageType }),
        ...(value.isRead !== undefined && { isRead: value.isRead }),
        ...(value.since && { receivedAt: { $gte: value.since } })
      })
    ]);

    // Format messages with additional info
    const formattedMessages = messages.map(message => ({
      ...message.toJSON(),
      formattedContent: message.getFormattedContent(),
      age: message.age,
      formattedReceivedAt: message.formattedReceivedAt
    }));

    res.json({
      success: true,
      data: {
        messages: formattedMessages,
        pagination: {
          total,
          page: value.page,
          limit: value.limit,
          pages: Math.ceil(total / value.limit)
        },
        filters: {
          phoneNumberId: value.phoneNumberId,
          messageType: value.messageType,
          isRead: value.isRead,
          since: value.since
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/messages/:id
// @desc    Get specific message
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const messageId = req.params.id;
    const userId = req.user._id;

    const message = await Message.findOne({
      _id: messageId,
      user: userId
    }).populate('phoneNumber', 'phoneNumber formattedNumber countryCode');

    if (!message) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MESSAGE_NOT_FOUND',
          message: 'Message not found'
        }
      });
    }

    res.json({
      success: true,
      data: {
        message: {
          ...message.toJSON(),
          formattedContent: message.getFormattedContent(),
          age: message.age,
          formattedReceivedAt: message.formattedReceivedAt
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.patch('/:id/read', async (req, res, next) => {
  try {
    const messageId = req.params.id;
    const userId = req.user._id;

    const message = await Message.findOne({
      _id: messageId,
      user: userId
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MESSAGE_NOT_FOUND',
          message: 'Message not found'
        }
      });
    }

    if (!message.isRead) {
      await message.markAsRead();
    }

    res.json({
      success: true,
      data: {
        message: {
          id: message._id,
          isRead: message.isRead,
          readAt: message.readAt
        }
      },
      message: 'Message marked as read'
    });

  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/messages/read-all
// @desc    Mark all messages as read
// @access  Private
router.patch('/read-all', async (req, res, next) => {
  try {
    const { phoneNumberId } = req.body;
    const userId = req.user._id;

    // Validate phoneNumberId if provided
    if (phoneNumberId) {
      const phoneNumber = await PhoneNumber.findOne({
        _id: phoneNumberId,
        user: userId
      });

      if (!phoneNumber) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PHONE_NUMBER_NOT_FOUND',
            message: 'Phone number not found or not assigned to you'
          }
        });
      }
    }

    const markedCount = await Message.markAllAsReadForUser(userId, phoneNumberId);

    res.json({
      success: true,
      data: {
        markedCount
      },
      message: `${markedCount} messages marked as read`
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/messages/stats
// @desc    Get message statistics
// @access  Private
router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [
      totalMessages,
      unreadMessages,
      otpMessages,
      verificationMessages,
      todayMessages
    ] = await Promise.all([
      Message.countDocuments({ user: userId }),
      Message.countDocuments({ user: userId, isRead: false }),
      Message.countDocuments({ user: userId, messageType: 'otp' }),
      Message.countDocuments({ user: userId, messageType: 'verification' }),
      Message.countDocuments({
        user: userId,
        receivedAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      })
    ]);

    // Get message type distribution
    const messageTypeStats = await Message.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$messageType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivity = await Message.aggregate([
      {
        $match: {
          user: userId,
          receivedAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$receivedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalMessages,
          unreadMessages,
          otpMessages,
          verificationMessages,
          todayMessages,
          messageTypeDistribution: messageTypeStats,
          recentActivity
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete message
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const messageId = req.params.id;
    const userId = req.user._id;

    const message = await Message.findOne({
      _id: messageId,
      user: userId
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MESSAGE_NOT_FOUND',
          message: 'Message not found'
        }
      });
    }

    await Message.findByIdAndDelete(messageId);

    // Remove message from phone number's messages array
    await PhoneNumber.findByIdAndUpdate(
      message.phoneNumber,
      { $pull: { messages: messageId } }
    );

    res.json({
      success: true,
      data: {
        deletedMessageId: messageId
      },
      message: 'Message deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/messages/search
// @desc    Search messages
// @access  Private
router.get('/search', async (req, res, next) => {
  try {
    const { q, phoneNumberId, messageType, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SEARCH_QUERY',
          message: 'Search query must be at least 2 characters long'
        }
      });
    }

    const userId = req.user._id;
    const searchQuery = {
      user: userId,
      $or: [
        { content: { $regex: q.trim(), $options: 'i' } },
        { fromNumber: { $regex: q.trim(), $options: 'i' } },
        { detectedOTP: { $regex: q.trim(), $options: 'i' } }
      ]
    };

    if (phoneNumberId) searchQuery.phoneNumber = phoneNumberId;
    if (messageType) searchQuery.messageType = messageType;

    const messages = await Message.find(searchQuery)
      .populate('phoneNumber', 'phoneNumber formattedNumber')
      .sort({ receivedAt: -1 })
      .limit(parseInt(limit));

    const formattedMessages = messages.map(message => ({
      ...message.toJSON(),
      formattedContent: message.getFormattedContent(),
      age: message.age
    }));

    res.json({
      success: true,
      data: {
        messages: formattedMessages,
        query: q.trim(),
        total: messages.length
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;


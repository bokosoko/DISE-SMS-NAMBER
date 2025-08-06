const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const PhoneNumber = require('../models/PhoneNumber');
const Message = require('../models/Message');
const { requireAdmin, requireModerator } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', async (req, res, next) => {
  try {
    const user = req.user;
    const stats = await user.getStats();

    res.json({
      success: true,
      data: {
        user: {
          ...user.toJSON(),
          stats
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', async (req, res, next) => {
  try {
    const updateSchema = Joi.object({
      firstName: Joi.string().trim().max(50).optional(),
      lastName: Joi.string().trim().max(50).optional(),
      email: Joi.string().email().optional()
    });

    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.details.map(detail => ({
            field: detail.path[0],
            message: detail.message
          }))
        }
      });
    }

    const user = req.user;

    // Check if email is being changed and if it already exists
    if (value.email && value.email !== user.email) {
      const existingUser = await User.findByEmail(value.email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Email already exists'
          }
        });
      }
    }

    // Update user
    Object.assign(user, value);
    await user.save();

    const stats = await user.getStats();

    res.json({
      success: true,
      data: {
        user: {
          ...user.toJSON(),
          stats
        }
      },
      message: 'Profile updated successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get user stats
    const stats = await req.user.getStats();

    // Get recent messages (last 10)
    const recentMessages = await Message.findByUser(userId, {
      limit: 10,
      sort: { receivedAt: -1 }
    });

    // Get active phone numbers
    const activeNumbers = await PhoneNumber.findByUser(userId, 'assigned');

    // Get message activity for the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const messageActivity = await Message.aggregate([
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

    // Get OTP messages from today
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const todayOTPs = await Message.find({
      user: userId,
      messageType: 'otp',
      receivedAt: { $gte: todayStart }
    }).populate('phoneNumber', 'phoneNumber formattedNumber')
      .sort({ receivedAt: -1 })
      .limit(5);

    // Format recent messages
    const formattedRecentMessages = recentMessages.map(message => ({
      ...message.toJSON(),
      formattedContent: message.getFormattedContent(),
      age: message.age
    }));

    // Format active numbers with additional info
    const formattedActiveNumbers = await Promise.all(
      activeNumbers.map(async (number) => {
        const messageCount = await number.getMessageCount();
        return {
          ...number.toJSON(),
          formattedNumber: number.formattedNumber,
          messageCount,
          isExpired: number.isExpired(),
          timeRemaining: number.expiresAt ? Math.max(0, number.expiresAt.getTime() - Date.now()) : null
        };
      })
    );

    // Format today's OTPs
    const formattedTodayOTPs = todayOTPs.map(message => ({
      ...message.toJSON(),
      formattedContent: message.getFormattedContent(),
      age: message.age
    }));

    res.json({
      success: true,
      data: {
        stats,
        recentMessages: formattedRecentMessages,
        activeNumbers: formattedActiveNumbers,
        messageActivity,
        todayOTPs: formattedTodayOTPs,
        summary: {
          hasActiveNumbers: activeNumbers.length > 0,
          hasUnreadMessages: stats.unreadMessages > 0,
          hasRecentActivity: messageActivity.length > 0
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PASSWORD_REQUIRED',
          message: 'Password is required to delete account'
        }
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Invalid password'
        }
      });
    }

    // Release all assigned phone numbers
    await PhoneNumber.updateMany(
      { user: user._id },
      {
        $unset: { user: 1 },
        $set: {
          status: 'available',
          releasedAt: new Date(),
          assignedAt: null,
          expiresAt: null
        }
      }
    );

    // Delete all user's messages
    await Message.deleteMany({ user: user._id });

    // Delete user account
    await User.findByIdAndDelete(user._id);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// Admin routes

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      isActive,
      search
    } = req.query;

    // Build query
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -refreshTokens')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    // Get stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const stats = await user.getStats();
        return {
          ...user.toJSON(),
          stats
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin only)
// @access  Private (Admin)
router.get('/:id', requireAdmin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshTokens');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const stats = await user.getStats();

    // Get user's phone numbers
    const phoneNumbers = await PhoneNumber.findByUser(user._id);

    // Get recent messages
    const recentMessages = await Message.findByUser(user._id, { limit: 10 });

    res.json({
      success: true,
      data: {
        user: {
          ...user.toJSON(),
          stats
        },
        phoneNumbers,
        recentMessages
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (Admin only)
// @access  Private (Admin)
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const updateSchema = Joi.object({
      firstName: Joi.string().trim().max(50).optional(),
      lastName: Joi.string().trim().max(50).optional(),
      email: Joi.string().email().optional(),
      role: Joi.string().valid('user', 'admin', 'moderator').optional(),
      isActive: Joi.boolean().optional(),
      emailVerified: Joi.boolean().optional()
    });

    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.details.map(detail => ({
            field: detail.path[0],
            message: detail.message
          }))
        }
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Check if email is being changed and if it already exists
    if (value.email && value.email !== user.email) {
      const existingUser = await User.findByEmail(value.email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Email already exists'
          }
        });
      }
    }

    // Update user
    Object.assign(user, value);
    await user.save();

    const stats = await user.getStats();

    res.json({
      success: true,
      data: {
        user: {
          ...user.toJSON(),
          stats
        }
      },
      message: 'User updated successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private (Admin)
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_DELETE_SELF',
          message: 'Cannot delete your own account'
        }
      });
    }

    // Release all assigned phone numbers
    await PhoneNumber.updateMany(
      { user: user._id },
      {
        $unset: { user: 1 },
        $set: {
          status: 'available',
          releasedAt: new Date(),
          assignedAt: null,
          expiresAt: null
        }
      }
    );

    // Delete all user's messages
    await Message.deleteMany({ user: user._id });

    // Delete user
    await User.findByIdAndDelete(user._id);

    res.json({
      success: true,
      data: {
        deletedUserId: user._id
      },
      message: 'User deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/stats/overview
// @desc    Get platform statistics (Admin only)
// @access  Private (Admin)
router.get('/stats/overview', requireAdmin, async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalNumbers,
      assignedNumbers,
      totalMessages,
      todayMessages
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      PhoneNumber.countDocuments(),
      PhoneNumber.countDocuments({ status: 'assigned' }),
      Message.countDocuments(),
      Message.countDocuments({
        receivedAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      })
    ]);

    // Get user registration trend (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const registrationTrend = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get message activity trend (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const messageActivity = await Message.aggregate([
      {
        $match: {
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
        overview: {
          totalUsers,
          activeUsers,
          totalNumbers,
          assignedNumbers,
          totalMessages,
          todayMessages
        },
        trends: {
          registrationTrend,
          messageActivity
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;


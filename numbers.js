const express = require('express');
const Joi = require('joi');
const PhoneNumber = require('../models/PhoneNumber');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const assignNumberSchema = Joi.object({
  phoneNumber: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).optional(),
  countryCode: Joi.string().length(2).uppercase().optional(),
  duration: Joi.number().min(1).max(24).default(1) // hours
});

const extendAssignmentSchema = Joi.object({
  duration: Joi.number().min(1).max(24).required() // additional hours
});

// @route   GET /api/numbers/available
// @desc    Get available phone numbers
// @access  Private
router.get('/available', async (req, res, next) => {
  try {
    const { countryCode, limit = 10, provider } = req.query;

    // Validate query parameters
    const querySchema = Joi.object({
      countryCode: Joi.string().length(2).uppercase().optional(),
      limit: Joi.number().min(1).max(50).default(10),
      provider: Joi.string().valid('twilio', 'nexmo', 'vonage', 'other').optional()
    });

    const { error, value } = querySchema.validate({ countryCode, limit: parseInt(limit), provider });
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

    // Build query
    const query = { status: 'available' };
    if (value.countryCode) query.countryCode = value.countryCode;
    if (value.provider) query.provider = value.provider;

    const numbers = await PhoneNumber.find(query)
      .limit(value.limit)
      .select('phoneNumber countryCode provider cost currency capabilities')
      .sort({ createdAt: -1 });

    const total = await PhoneNumber.countDocuments(query);

    res.json({
      success: true,
      data: {
        numbers: numbers.map(number => ({
          ...number.toJSON(),
          formattedNumber: number.formattedNumber
        })),
        total,
        limit: value.limit,
        available: numbers.length
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/numbers/assign
// @desc    Assign a phone number to user
// @access  Private
router.post('/assign', async (req, res, next) => {
  try {
    const { error, value } = assignNumberSchema.validate(req.body);
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

    const { phoneNumber, countryCode, duration } = value;
    const userId = req.user._id;

    // Check if user already has active numbers (limit to prevent abuse)
    const activeNumbers = await PhoneNumber.countDocuments({
      user: userId,
      status: 'assigned'
    });

    const maxActiveNumbers = req.user.role === 'admin' ? 50 : 5;
    if (activeNumbers >= maxActiveNumbers) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'LIMIT_EXCEEDED',
          message: `Maximum ${maxActiveNumbers} active numbers allowed`
        }
      });
    }

    let numberToAssign;

    if (phoneNumber) {
      // Assign specific number
      numberToAssign = await PhoneNumber.findOne({
        phoneNumber,
        status: 'available'
      });

      if (!numberToAssign) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NUMBER_NOT_AVAILABLE',
            message: 'Phone number is not available'
          }
        });
      }
    } else {
      // Find any available number
      const query = { status: 'available' };
      if (countryCode) query.countryCode = countryCode;

      numberToAssign = await PhoneNumber.findOne(query);

      if (!numberToAssign) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NO_NUMBERS_AVAILABLE',
            message: 'No phone numbers available'
          }
        });
      }
    }

    // Assign number to user
    await numberToAssign.assignToUser(userId, duration);

    // Populate user info
    await numberToAssign.populate('user', 'firstName lastName email');

    res.json({
      success: true,
      data: {
        assignment: {
          id: numberToAssign._id,
          phoneNumber: numberToAssign.phoneNumber,
          formattedNumber: numberToAssign.formattedNumber,
          countryCode: numberToAssign.countryCode,
          provider: numberToAssign.provider,
          status: numberToAssign.status,
          assignedAt: numberToAssign.assignedAt,
          expiresAt: numberToAssign.expiresAt,
          user: numberToAssign.user
        }
      },
      message: 'Phone number assigned successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/numbers/my
// @desc    Get user's assigned phone numbers
// @access  Private
router.get('/my', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    // Validate query parameters
    const querySchema = Joi.object({
      status: Joi.string().valid('assigned', 'expired', 'released').optional(),
      page: Joi.number().min(1).default(1),
      limit: Joi.number().min(1).max(100).default(20)
    });

    const { error, value } = querySchema.validate({
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters'
        }
      });
    }

    // Build query
    const query = { user: userId };
    if (value.status) {
      if (value.status === 'expired') {
        query.status = 'assigned';
        query.expiresAt = { $lt: new Date() };
      } else {
        query.status = value.status;
      }
    }

    const skip = (value.page - 1) * value.limit;

    const [numbers, total] = await Promise.all([
      PhoneNumber.find(query)
        .populate('user', 'firstName lastName email')
        .sort({ assignedAt: -1 })
        .skip(skip)
        .limit(value.limit),
      PhoneNumber.countDocuments(query)
    ]);

    // Add message count for each number
    const numbersWithStats = await Promise.all(
      numbers.map(async (number) => {
        const messageCount = await number.getMessageCount();
        return {
          ...number.toJSON(),
          formattedNumber: number.formattedNumber,
          messageCount,
          isExpired: number.isExpired()
        };
      })
    );

    res.json({
      success: true,
      data: {
        assignments: numbersWithStats,
        pagination: {
          total,
          page: value.page,
          limit: value.limit,
          pages: Math.ceil(total / value.limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/numbers/:id/extend
// @desc    Extend phone number assignment
// @access  Private
router.post('/:id/extend', async (req, res, next) => {
  try {
    const { error, value } = extendAssignmentSchema.validate(req.body);
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

    const { duration } = value;
    const numberId = req.params.id;
    const userId = req.user._id;

    // Find number
    const phoneNumber = await PhoneNumber.findOne({
      _id: numberId,
      user: userId,
      status: 'assigned'
    });

    if (!phoneNumber) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NUMBER_NOT_FOUND',
          message: 'Phone number not found or not assigned to you'
        }
      });
    }

    // Extend assignment
    await phoneNumber.extendAssignment(duration);

    res.json({
      success: true,
      data: {
        assignment: {
          id: phoneNumber._id,
          phoneNumber: phoneNumber.phoneNumber,
          expiresAt: phoneNumber.expiresAt,
          extendedDuration: duration
        }
      },
      message: 'Assignment extended successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/numbers/:id
// @desc    Release phone number
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const numberId = req.params.id;
    const userId = req.user._id;

    // Find number
    const phoneNumber = await PhoneNumber.findOne({
      _id: numberId,
      user: userId
    });

    if (!phoneNumber) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NUMBER_NOT_FOUND',
          message: 'Phone number not found or not assigned to you'
        }
      });
    }

    // Release number
    await phoneNumber.release();

    res.json({
      success: true,
      data: {
        assignmentId: numberId,
        releasedAt: phoneNumber.releasedAt
      },
      message: 'Phone number released successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/numbers/stats
// @desc    Get phone number statistics
// @access  Private
router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [
      totalNumbers,
      activeNumbers,
      expiredNumbers,
      availableNumbers
    ] = await Promise.all([
      PhoneNumber.countDocuments({ user: userId }),
      PhoneNumber.countDocuments({ user: userId, status: 'assigned' }),
      PhoneNumber.countDocuments({
        user: userId,
        status: 'assigned',
        expiresAt: { $lt: new Date() }
      }),
      PhoneNumber.countDocuments({ status: 'available' })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalNumbers,
          activeNumbers,
          expiredNumbers,
          availableNumbers
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// Admin routes

// @route   POST /api/numbers
// @desc    Add new phone number (Admin only)
// @access  Private (Admin)
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const createNumberSchema = Joi.object({
      phoneNumber: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
      countryCode: Joi.string().length(2).uppercase().required(),
      provider: Joi.string().valid('twilio', 'nexmo', 'vonage', 'other').required(),
      providerId: Joi.string().optional(),
      cost: Joi.number().min(0).default(0),
      currency: Joi.string().length(3).uppercase().default('USD'),
      capabilities: Joi.array().items(Joi.string().valid('sms', 'voice', 'mms')).default(['sms'])
    });

    const { error, value } = createNumberSchema.validate(req.body);
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

    const phoneNumber = new PhoneNumber(value);
    await phoneNumber.save();

    res.status(201).json({
      success: true,
      data: {
        phoneNumber: {
          ...phoneNumber.toJSON(),
          formattedNumber: phoneNumber.formattedNumber
        }
      },
      message: 'Phone number added successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/numbers/cleanup
// @desc    Cleanup expired numbers (Admin only)
// @access  Private (Admin)
router.post('/cleanup', requireAdmin, async (req, res, next) => {
  try {
    const cleanedCount = await PhoneNumber.cleanupExpired();

    res.json({
      success: true,
      data: {
        cleanedCount
      },
      message: `${cleanedCount} expired numbers cleaned up`
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;


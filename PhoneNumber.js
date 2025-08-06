const mongoose = require('mongoose');

const phoneNumberSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^\+[1-9]\d{1,14}$/, 'Please enter a valid international phone number']
  },
  countryCode: {
    type: String,
    required: [true, 'Country code is required'],
    uppercase: true,
    minlength: 2,
    maxlength: 3
  },
  provider: {
    type: String,
    required: [true, 'Provider is required'],
    enum: ['twilio', 'nexmo', 'vonage', 'other'],
    default: 'twilio'
  },
  providerId: {
    type: String,
    required: false // Some providers might not have specific IDs
  },
  status: {
    type: String,
    enum: ['available', 'assigned', 'expired', 'released', 'suspended'],
    default: 'available'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  releasedAt: {
    type: Date,
    default: null
  },
  capabilities: [{
    type: String,
    enum: ['sms', 'voice', 'mms'],
    default: ['sms']
  }],
  cost: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    minlength: 3,
    maxlength: 3
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better query performance
phoneNumberSchema.index({ phoneNumber: 1 });
phoneNumberSchema.index({ status: 1 });
phoneNumberSchema.index({ user: 1, status: 1 });
phoneNumberSchema.index({ countryCode: 1 });
phoneNumberSchema.index({ provider: 1 });
phoneNumberSchema.index({ expiresAt: 1 });

// Virtual for formatted phone number
phoneNumberSchema.virtual('formattedNumber').get(function() {
  const number = this.phoneNumber;
  
  // Format based on country code
  if (number.startsWith('+1')) {
    // US/Canada format: +1 (XXX) XXX-XXXX
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
  } else if (number.startsWith('+44')) {
    // UK format: +44 XXXX XXX XXX
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      return `+44 ${cleaned.slice(2, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
    }
  }
  
  // Default format
  return number;
});

// Instance method to assign to user
phoneNumberSchema.methods.assignToUser = function(userId, durationHours = 1) {
  this.user = userId;
  this.status = 'assigned';
  this.assignedAt = new Date();
  this.expiresAt = new Date(Date.now() + (durationHours * 60 * 60 * 1000));
  return this.save();
};

// Instance method to extend assignment
phoneNumberSchema.methods.extendAssignment = function(additionalHours) {
  if (this.status !== 'assigned') {
    throw new Error('Cannot extend assignment for non-assigned number');
  }
  
  const currentExpiry = this.expiresAt || new Date();
  this.expiresAt = new Date(currentExpiry.getTime() + (additionalHours * 60 * 60 * 1000));
  return this.save();
};

// Instance method to release number
phoneNumberSchema.methods.release = function() {
  this.user = null;
  this.status = 'available';
  this.releasedAt = new Date();
  this.assignedAt = null;
  this.expiresAt = null;
  return this.save();
};

// Instance method to check if expired
phoneNumberSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Instance method to get message count
phoneNumberSchema.methods.getMessageCount = async function() {
  const Message = mongoose.model('Message');
  return await Message.countDocuments({ phoneNumber: this._id });
};

// Static method to find available numbers
phoneNumberSchema.statics.findAvailable = function(countryCode = null, limit = 10) {
  const query = { status: 'available' };
  if (countryCode) {
    query.countryCode = countryCode.toUpperCase();
  }
  return this.find(query).limit(limit);
};

// Static method to find user's numbers
phoneNumberSchema.statics.findByUser = function(userId, status = null) {
  const query = { user: userId };
  if (status) {
    query.status = status;
  }
  return this.find(query).populate('user', 'firstName lastName email');
};

// Static method to find expired numbers
phoneNumberSchema.statics.findExpired = function() {
  return this.find({
    status: 'assigned',
    expiresAt: { $lt: new Date() }
  });
};

// Static method to cleanup expired numbers
phoneNumberSchema.statics.cleanupExpired = async function() {
  const expiredNumbers = await this.findExpired();
  
  for (const number of expiredNumbers) {
    await number.release();
  }
  
  return expiredNumbers.length;
};

// Pre-save middleware to validate assignment
phoneNumberSchema.pre('save', function(next) {
  // If assigning to user, ensure required fields are set
  if (this.status === 'assigned' && !this.user) {
    return next(new Error('User is required when status is assigned'));
  }
  
  // If releasing, clear user-related fields
  if (this.status === 'available') {
    this.user = null;
    this.assignedAt = null;
    this.expiresAt = null;
  }
  
  next();
});

module.exports = mongoose.model('PhoneNumber', phoneNumberSchema);


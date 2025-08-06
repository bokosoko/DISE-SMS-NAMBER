const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  phoneNumber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PhoneNumber',
    required: [true, 'Phone number is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  fromNumber: {
    type: String,
    required: [true, 'Sender number is required'],
    trim: true
  },
  toNumber: {
    type: String,
    required: [true, 'Recipient number is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [1600, 'Message content cannot exceed 1600 characters']
  },
  messageType: {
    type: String,
    enum: ['sms', 'mms', 'otp', 'verification', 'notification', 'other'],
    default: 'sms'
  },
  detectedOTP: {
    type: String,
    default: null
  },
  provider: {
    type: String,
    required: [true, 'Provider is required'],
    enum: ['twilio', 'nexmo', 'vonage', 'other']
  },
  providerMessageId: {
    type: String,
    required: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  receivedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'document']
    },
    url: String,
    filename: String,
    size: Number,
    mimeType: String
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
messageSchema.index({ phoneNumber: 1, receivedAt: -1 });
messageSchema.index({ user: 1, receivedAt: -1 });
messageSchema.index({ isRead: 1 });
messageSchema.index({ messageType: 1 });
messageSchema.index({ receivedAt: -1 });
messageSchema.index({ fromNumber: 1 });

// Virtual for message age
messageSchema.virtual('age').get(function() {
  return Date.now() - this.receivedAt.getTime();
});

// Virtual for formatted received time
messageSchema.virtual('formattedReceivedAt').get(function() {
  return this.receivedAt.toLocaleString();
});

// Instance method to mark as read
messageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Instance method to detect OTP
messageSchema.methods.detectOTP = function() {
  const content = this.content.toLowerCase();
  
  // Common OTP patterns
  const otpPatterns = [
    /\b(\d{4,8})\b/g,  // 4-8 digit codes
    /code[:\s]*(\d+)/gi,  // "code: 123456"
    /verification[:\s]*(\d+)/gi,  // "verification: 123456"
    /otp[:\s]*(\d+)/gi,  // "otp: 123456"
    /pin[:\s]*(\d+)/gi,  // "pin: 123456"
    /token[:\s]*(\d+)/gi,  // "token: 123456"
  ];
  
  // Keywords that suggest this is a verification message
  const verificationKeywords = [
    'verification', 'verify', 'confirm', 'authenticate', 
    'code', 'otp', 'pin', 'security', 'login', 'signin',
    'access', 'account', 'password', 'reset'
  ];
  
  // Check if content contains verification keywords
  const hasVerificationKeywords = verificationKeywords.some(keyword => 
    content.includes(keyword)
  );
  
  if (hasVerificationKeywords) {
    // Try to extract OTP code
    for (const pattern of otpPatterns) {
      const matches = this.content.match(pattern);
      if (matches) {
        // Get the first numeric match
        const numericMatch = matches.find(match => /^\d+$/.test(match.replace(/\D/g, '')));
        if (numericMatch) {
          const code = numericMatch.replace(/\D/g, '');
          if (code.length >= 4 && code.length <= 8) {
            this.detectedOTP = code;
            this.messageType = 'otp';
            return code;
          }
        }
      }
    }
    
    // If we found verification keywords but no clear OTP, mark as verification
    this.messageType = 'verification';
  }
  
  return null;
};

// Instance method to get formatted content with OTP highlighting
messageSchema.methods.getFormattedContent = function() {
  let content = this.content;
  
  if (this.detectedOTP) {
    // Highlight the OTP code in the content
    const otpRegex = new RegExp(`\\b${this.detectedOTP}\\b`, 'g');
    content = content.replace(otpRegex, `**${this.detectedOTP}**`);
  }
  
  return content;
};

// Static method to create message from webhook
messageSchema.statics.createFromWebhook = async function(data) {
  const PhoneNumber = mongoose.model('PhoneNumber');
  
  // Find the phone number
  const phoneNumber = await PhoneNumber.findOne({ 
    phoneNumber: data.toNumber 
  }).populate('user');
  
  if (!phoneNumber || !phoneNumber.user) {
    throw new Error('Phone number not found or not assigned to user');
  }
  
  // Create message
  const message = new this({
    phoneNumber: phoneNumber._id,
    user: phoneNumber.user._id,
    fromNumber: data.fromNumber,
    toNumber: data.toNumber,
    content: data.content,
    provider: data.provider,
    providerMessageId: data.providerMessageId,
    metadata: data.metadata || {}
  });
  
  // Detect OTP
  message.detectOTP();
  
  await message.save();
  
  // Add message to phone number's messages array
  phoneNumber.messages.push(message._id);
  await phoneNumber.save();
  
  return message.populate(['phoneNumber', 'user']);
};

// Static method to find messages for user
messageSchema.statics.findByUser = function(userId, options = {}) {
  const {
    phoneNumberId,
    messageType,
    isRead,
    since,
    limit = 50,
    offset = 0,
    sort = { receivedAt: -1 }
  } = options;
  
  const query = { user: userId };
  
  if (phoneNumberId) query.phoneNumber = phoneNumberId;
  if (messageType) query.messageType = messageType;
  if (isRead !== undefined) query.isRead = isRead;
  if (since) query.receivedAt = { $gte: since };
  
  return this.find(query)
    .populate('phoneNumber', 'phoneNumber formattedNumber')
    .sort(sort)
    .skip(offset)
    .limit(limit);
};

// Static method to mark all messages as read for a user
messageSchema.statics.markAllAsReadForUser = async function(userId, phoneNumberId = null) {
  const query = { user: userId, isRead: false };
  if (phoneNumberId) query.phoneNumber = phoneNumberId;
  
  const result = await this.updateMany(query, {
    isRead: true,
    readAt: new Date()
  });
  
  return result.modifiedCount;
};

// Static method to cleanup old messages
messageSchema.statics.cleanupOldMessages = async function(daysOld = 30) {
  const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));
  
  const result = await this.deleteMany({
    receivedAt: { $lt: cutoffDate }
  });
  
  return result.deletedCount;
};

// Pre-save middleware to auto-detect message type
messageSchema.pre('save', function(next) {
  if (this.isNew && !this.detectedOTP) {
    this.detectOTP();
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);


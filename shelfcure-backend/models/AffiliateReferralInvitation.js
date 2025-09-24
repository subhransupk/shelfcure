const mongoose = require('mongoose');

const affiliateReferralInvitationSchema = new mongoose.Schema({
  // Referrer Information
  referrer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Affiliate',
    required: true
  },
  
  // Invitation Details
  inviteeEmail: {
    type: String,
    required: [true, 'Invitee email is required'],
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  inviteeName: {
    type: String,
    required: [true, 'Invitee name is required'],
    trim: true
  },
  inviteePhone: {
    type: String,
    match: [/^\+?[\d\s\-\(\)]{10,}$/, 'Please add a valid phone number']
  },
  
  // Invitation Status
  status: {
    type: String,
    enum: ['sent', 'opened', 'registered', 'verified', 'active', 'expired', 'declined'],
    default: 'sent'
  },
  
  // Tracking Information
  invitationToken: {
    type: String,
    unique: true,
    required: true
  },
  invitationLink: {
    type: String,
    required: true
  },
  
  // Dates
  sentDate: {
    type: Date,
    default: Date.now
  },
  openedDate: Date,
  registeredDate: Date,
  verifiedDate: Date,
  activatedDate: Date,
  expiryDate: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    }
  },
  
  // Email Tracking
  emailsSent: {
    type: Number,
    default: 1
  },
  lastEmailSent: {
    type: Date,
    default: Date.now
  },
  remindersSent: {
    type: Number,
    default: 0
  },
  
  // Conversion Tracking
  registeredAffiliate: {
    type: mongoose.Schema.ObjectId,
    ref: 'Affiliate',
    default: null
  },
  conversionValue: {
    type: Number,
    default: 0 // Commission earned from this referral
  },
  
  // Additional Information
  personalMessage: {
    type: String,
    maxlength: [500, 'Personal message cannot exceed 500 characters']
  },
  referralSource: {
    type: String,
    enum: ['email', 'whatsapp', 'sms', 'social_media', 'direct_link', 'qr_code'],
    default: 'email'
  },
  
  // Metadata
  ipAddress: String,
  userAgent: String,
  
  // Tracking
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Affiliate'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
affiliateReferralInvitationSchema.index({ referrer: 1 });
affiliateReferralInvitationSchema.index({ inviteeEmail: 1 });
affiliateReferralInvitationSchema.index({ status: 1 });
affiliateReferralInvitationSchema.index({ invitationToken: 1 });
affiliateReferralInvitationSchema.index({ sentDate: -1 });
affiliateReferralInvitationSchema.index({ expiryDate: 1 });

// Virtual for checking if invitation is expired
affiliateReferralInvitationSchema.virtual('isExpired').get(function() {
  return this.expiryDate < new Date() && this.status === 'sent';
});

// Virtual for conversion rate calculation
affiliateReferralInvitationSchema.virtual('hasConverted').get(function() {
  return ['registered', 'verified', 'active'].includes(this.status);
});

// Static method to generate unique invitation token
affiliateReferralInvitationSchema.statics.generateInvitationToken = function() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

// Method to mark invitation as opened
affiliateReferralInvitationSchema.methods.markAsOpened = function() {
  if (this.status === 'sent') {
    this.status = 'opened';
    this.openedDate = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to mark invitation as registered
affiliateReferralInvitationSchema.methods.markAsRegistered = function(affiliateId) {
  this.status = 'registered';
  this.registeredDate = new Date();
  this.registeredAffiliate = affiliateId;
  return this.save();
};

// Method to mark invitation as verified
affiliateReferralInvitationSchema.methods.markAsVerified = function() {
  if (this.status === 'registered') {
    this.status = 'verified';
    this.verifiedDate = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to mark invitation as active
affiliateReferralInvitationSchema.methods.markAsActive = function() {
  if (['registered', 'verified'].includes(this.status)) {
    this.status = 'active';
    this.activatedDate = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to send reminder
affiliateReferralInvitationSchema.methods.sendReminder = function() {
  this.remindersSent += 1;
  this.emailsSent += 1;
  this.lastEmailSent = new Date();
  return this.save();
};

// Static method to get invitation statistics for an affiliate
affiliateReferralInvitationSchema.statics.getInvitationStats = async function(affiliateId) {
  const stats = await this.aggregate([
    { $match: { referrer: affiliateId } },
    {
      $group: {
        _id: null,
        totalInvitations: { $sum: 1 },
        sentInvitations: {
          $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
        },
        openedInvitations: {
          $sum: { $cond: [{ $eq: ['$status', 'opened'] }, 1, 0] }
        },
        registeredInvitations: {
          $sum: { $cond: [{ $in: ['$status', ['registered', 'verified', 'active']] }, 1, 0] }
        },
        activeInvitations: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        expiredInvitations: {
          $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
        },
        totalConversionValue: { $sum: '$conversionValue' }
      }
    }
  ]);

  const result = stats[0] || {
    totalInvitations: 0,
    sentInvitations: 0,
    openedInvitations: 0,
    registeredInvitations: 0,
    activeInvitations: 0,
    expiredInvitations: 0,
    totalConversionValue: 0
  };

  // Calculate conversion rates
  result.openRate = result.totalInvitations > 0 
    ? Math.round((result.openedInvitations / result.totalInvitations) * 100) 
    : 0;
  
  result.conversionRate = result.totalInvitations > 0 
    ? Math.round((result.registeredInvitations / result.totalInvitations) * 100) 
    : 0;

  return result;
};

// Pre-save middleware to update expired invitations
affiliateReferralInvitationSchema.pre('save', function(next) {
  if (this.expiryDate < new Date() && this.status === 'sent') {
    this.status = 'expired';
  }
  next();
});

module.exports = mongoose.model('AffiliateReferralInvitation', affiliateReferralInvitationSchema);

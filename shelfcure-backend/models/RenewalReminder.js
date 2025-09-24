const mongoose = require('mongoose');

const renewalReminderSchema = new mongoose.Schema({
  // Affiliate who sent the reminder
  affiliate: {
    type: mongoose.Schema.ObjectId,
    ref: 'Affiliate',
    required: true,
    index: true
  },
  
  // Store Owner and Store being reminded
  storeOwner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  store: {
    type: mongoose.Schema.ObjectId,
    ref: 'Store',
    required: true
  },
  subscription: {
    type: mongoose.Schema.ObjectId,
    ref: 'Subscription',
    required: true
  },
  
  // Reminder Details
  reminderType: {
    type: String,
    enum: ['email', 'sms', 'whatsapp', 'call'],
    required: true
  },
  reminderDate: {
    type: Date,
    default: Date.now
  },
  
  // Subscription Information at time of reminder
  subscriptionDetails: {
    plan: String,
    expiryDate: Date,
    daysUntilExpiry: Number,
    renewalValue: Number
  },
  
  // Reminder Content
  subject: String,
  message: String,
  customMessage: String,
  
  // Status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'failed', 'bounced'],
    default: 'sent'
  },
  
  // Response Tracking
  response: {
    opened: {
      type: Boolean,
      default: false
    },
    openedAt: Date,
    clicked: {
      type: Boolean,
      default: false
    },
    clickedAt: Date,
    replied: {
      type: Boolean,
      default: false
    },
    repliedAt: Date
  },
  
  // Delivery Information
  deliveryInfo: {
    provider: String, // email service, SMS provider, etc.
    messageId: String,
    deliveredAt: Date,
    failureReason: String
  },
  
  // Follow-up Information
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  followUpNotes: String,
  
  // Renewal Outcome
  renewalOutcome: {
    renewed: {
      type: Boolean,
      default: false
    },
    renewedAt: Date,
    newSubscriptionId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Subscription'
    },
    renewalValue: Number,
    commissionEarned: Number
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
renewalReminderSchema.index({ affiliate: 1, reminderDate: -1 });
renewalReminderSchema.index({ storeOwner: 1, reminderDate: -1 });
renewalReminderSchema.index({ store: 1, reminderDate: -1 });
renewalReminderSchema.index({ subscription: 1, reminderDate: -1 });
renewalReminderSchema.index({ reminderType: 1, status: 1 });

// Virtual for days since reminder
renewalReminderSchema.virtual('daysSinceReminder').get(function() {
  return Math.floor((Date.now() - this.reminderDate) / (1000 * 60 * 60 * 24));
});

// Static method to get reminder statistics for affiliate
renewalReminderSchema.statics.getReminderStats = async function(affiliateId, dateRange = 30) {
  const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);
  
  const stats = await this.aggregate([
    {
      $match: {
        affiliate: affiliateId,
        reminderDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalReminders: { $sum: 1 },
        emailReminders: {
          $sum: { $cond: [{ $eq: ['$reminderType', 'email'] }, 1, 0] }
        },
        smsReminders: {
          $sum: { $cond: [{ $eq: ['$reminderType', 'sms'] }, 1, 0] }
        },
        whatsappReminders: {
          $sum: { $cond: [{ $eq: ['$reminderType', 'whatsapp'] }, 1, 0] }
        },
        successfulRenewals: {
          $sum: { $cond: ['$renewalOutcome.renewed', 1, 0] }
        },
        totalRenewalValue: { $sum: '$renewalOutcome.renewalValue' },
        totalCommissionEarned: { $sum: '$renewalOutcome.commissionEarned' }
      }
    }
  ]);
  
  const result = stats[0] || {
    totalReminders: 0,
    emailReminders: 0,
    smsReminders: 0,
    whatsappReminders: 0,
    successfulRenewals: 0,
    totalRenewalValue: 0,
    totalCommissionEarned: 0
  };
  
  result.conversionRate = result.totalReminders > 0 ? 
    ((result.successfulRenewals / result.totalReminders) * 100).toFixed(2) : 0;
  
  return result;
};

// Static method to get recent reminders for affiliate
renewalReminderSchema.statics.getRecentReminders = async function(affiliateId, limit = 10) {
  return await this.find({ affiliate: affiliateId })
    .populate('storeOwner', 'name email phone')
    .populate('store', 'name')
    .sort({ reminderDate: -1 })
    .limit(limit)
    .select('reminderType reminderDate subscriptionDetails status renewalOutcome');
};

module.exports = mongoose.model('RenewalReminder', renewalReminderSchema);

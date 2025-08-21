const mongoose = require('mongoose');

const affiliateSettingsSchema = new mongoose.Schema({
  // General Settings
  enableAffiliateProgram: {
    type: Boolean,
    default: true,
    required: true
  },
  autoApproveAffiliates: {
    type: Boolean,
    default: false,
    required: true
  },
  cookieDuration: {
    type: Number,
    default: 30,
    min: 1,
    max: 365,
    required: true
  },

  // Commission Settings
  defaultCommissionType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage',
    required: true
  },
  defaultCommissionRate: {
    type: Number,
    default: 10,
    min: 0,
    max: 100,
    required: true
  },
  minimumPayoutAmount: {
    type: Number,
    default: 1000,
    min: 100,
    required: true
  },

  // Payout Settings
  payoutSchedule: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly'],
    default: 'monthly',
    required: true
  },
  paymentMethods: {
    bankTransfer: {
      type: Boolean,
      default: true
    },
    upi: {
      type: Boolean,
      default: true
    },
    paypal: {
      type: Boolean,
      default: false
    }
  },

  // Email Notifications
  emailNotifications: {
    welcomeEmail: {
      type: Boolean,
      default: true
    },
    approvalEmail: {
      type: Boolean,
      default: true
    },
    commissionEmail: {
      type: Boolean,
      default: true
    },
    payoutEmail: {
      type: Boolean,
      default: true
    }
  },

  // Terms & Conditions
  affiliateTerms: {
    type: String,
    default: `Welcome to the ShelfCure Affiliate Program!

By joining our affiliate program, you agree to the following terms and conditions:

1. AFFILIATE RESPONSIBILITIES
- Promote ShelfCure services ethically and professionally
- Comply with all applicable laws and regulations
- Maintain accurate contact and payment information

2. COMMISSION STRUCTURE
- Commissions are calculated based on successful referrals
- Payments are processed monthly on the 1st of each month
- Minimum payout threshold must be met for payment processing

3. PROHIBITED ACTIVITIES
- Spam marketing or unsolicited communications
- False or misleading advertising claims
- Trademark or copyright infringement

4. PAYMENT TERMS
- Commissions are paid within 30 days of the end of each month
- Affiliates are responsible for any applicable taxes
- ShelfCure reserves the right to withhold payments for policy violations

5. TERMINATION
- Either party may terminate this agreement at any time
- Outstanding commissions will be paid according to normal schedule
- Terminated affiliates lose access to promotional materials

For questions about these terms, please contact our affiliate support team.`,
    required: true
  },

  // Metadata
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
affiliateSettingsSchema.index({}, { unique: true });

// Static method to get or create settings
affiliateSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  
  if (!settings) {
    // Create default settings if none exist
    settings = new this({
      lastUpdatedBy: new mongoose.Types.ObjectId() // Temporary admin ID
    });
    await settings.save();
  }
  
  return settings;
};

// Static method to update settings
affiliateSettingsSchema.statics.updateSettings = async function(updates, adminId) {
  let settings = await this.findOne();
  
  if (!settings) {
    settings = new this({
      ...updates,
      lastUpdatedBy: adminId
    });
  } else {
    Object.assign(settings, updates);
    settings.lastUpdatedBy = adminId;
    settings.version += 1;
  }
  
  await settings.save();
  return settings;
};

// Pre-save middleware to validate settings
affiliateSettingsSchema.pre('save', function(next) {
  // Ensure at least one payment method is enabled
  const paymentMethods = this.paymentMethods;
  const hasEnabledMethod = paymentMethods.bankTransfer || paymentMethods.upi || paymentMethods.paypal;
  
  if (!hasEnabledMethod) {
    const error = new Error('At least one payment method must be enabled');
    return next(error);
  }
  
  // Validate commission rate based on type
  if (this.defaultCommissionType === 'percentage' && this.defaultCommissionRate > 100) {
    const error = new Error('Percentage commission rate cannot exceed 100%');
    return next(error);
  }
  
  next();
});

// Instance method to get formatted settings for frontend
affiliateSettingsSchema.methods.toClientFormat = function() {
  return {
    id: this._id,
    enableAffiliateProgram: this.enableAffiliateProgram,
    autoApproveAffiliates: this.autoApproveAffiliates,
    cookieDuration: this.cookieDuration,
    defaultCommissionType: this.defaultCommissionType,
    defaultCommissionRate: this.defaultCommissionRate,
    minimumPayoutAmount: this.minimumPayoutAmount,
    payoutSchedule: this.payoutSchedule,
    paymentMethods: this.paymentMethods,
    emailNotifications: this.emailNotifications,
    affiliateTerms: this.affiliateTerms,
    version: this.version,
    lastUpdated: this.updatedAt,
    lastUpdatedBy: this.lastUpdatedBy
  };
};

const AffiliateSettings = mongoose.model('AffiliateSettings', affiliateSettingsSchema);

module.exports = AffiliateSettings;

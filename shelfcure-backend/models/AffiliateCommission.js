const mongoose = require('mongoose');

const affiliateCommissionSchema = new mongoose.Schema({
  // Reference Information
  affiliate: {
    type: mongoose.Schema.ObjectId,
    ref: 'Affiliate',
    required: true
  },
  store: {
    type: mongoose.Schema.ObjectId,
    ref: 'Store',
    required: true
  },
  invoice: {
    type: mongoose.Schema.ObjectId,
    ref: 'Invoice'
  },
  
  // Commission Details
  type: {
    type: String,
    enum: ['initial', 'recurring', 'bonus', 'referral_onetime'],
    required: true
  },
  commissionLevel: {
    type: Number,
    default: 0, // 0 = direct sale, 1 = level 1 referral, 2 = level 2 referral
    min: 0,
    max: 2
  },
  // For multi-level commissions - tracks the selling affiliate
  sellingAffiliate: {
    type: mongoose.Schema.ObjectId,
    ref: 'Affiliate',
    default: null // Only set for referral commissions
  },
  period: {
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true
    }
  },
  
  // Financial Information
  baseAmount: {
    type: Number,
    required: true,
    min: [0, 'Base amount cannot be negative']
  },
  commissionRate: {
    type: Number,
    required: true,
    min: [0, 'Commission rate cannot be negative']
  },
  commissionAmount: {
    type: Number,
    required: true,
    min: [0, 'Commission amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Status and Payment
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'cancelled', 'disputed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'processing', 'paid', 'failed'],
    default: 'unpaid'
  },
  
  // Payment Details
  payment: {
    method: {
      type: String,
      enum: ['bank_transfer', 'upi', 'paypal', 'check']
    },
    transactionId: String,
    paidDate: Date,
    paidAmount: Number,
    processingFee: {
      type: Number,
      default: 0
    },
    netAmount: Number,
    notes: String
  },
  
  // Dates
  earnedDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  approvedDate: Date,
  paidDate: Date,
  
  // Subscription Information
  subscription: {
    planName: String,
    planType: String,
    subscriptionStartDate: Date,
    subscriptionEndDate: Date,
    isRenewal: {
      type: Boolean,
      default: false
    }
  },
  
  // Tracking and Metadata
  referralSource: {
    type: String,
    enum: ['direct_link', 'social_media', 'email', 'website', 'other'],
    default: 'direct_link'
  },
  customerAcquisitionDate: Date,
  
  // Approval Information
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  approvalNotes: String,
  rejectionReason: String,
  
  // Dispute Information
  dispute: {
    reason: String,
    raisedDate: Date,
    raisedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    resolvedDate: Date,
    resolution: String
  },
  
  // Additional Information
  notes: String,
  tags: [String],
  
  // Tracking
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
affiliateCommissionSchema.index({ affiliate: 1 });
affiliateCommissionSchema.index({ store: 1 });
affiliateCommissionSchema.index({ sellingAffiliate: 1 });
affiliateCommissionSchema.index({ type: 1 });
affiliateCommissionSchema.index({ commissionLevel: 1 });
affiliateCommissionSchema.index({ status: 1 });
affiliateCommissionSchema.index({ paymentStatus: 1 });
affiliateCommissionSchema.index({ earnedDate: -1 });
affiliateCommissionSchema.index({ dueDate: 1 });
affiliateCommissionSchema.index({ 'period.year': 1, 'period.month': 1 });

// Calculate net amount before saving
affiliateCommissionSchema.pre('save', function(next) {
  if (this.payment.paidAmount && this.payment.processingFee) {
    this.payment.netAmount = this.payment.paidAmount - this.payment.processingFee;
  }
  next();
});

// Virtual for days until due
affiliateCommissionSchema.virtual('daysUntilDue').get(function() {
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  const diffTime = dueDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for commission age (days since earned)
affiliateCommissionSchema.virtual('commissionAge').get(function() {
  const today = new Date();
  const earnedDate = new Date(this.earnedDate);
  const diffTime = today - earnedDate;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for formatted period
affiliateCommissionSchema.virtual('formattedPeriod').get(function() {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[this.period.month - 1]} ${this.period.year}`;
});

// Static method to calculate commission for a given amount and rate
affiliateCommissionSchema.statics.calculateCommission = function(baseAmount, rate, type = 'percentage') {
  if (type === 'percentage') {
    return Math.round((baseAmount * rate / 100) * 100) / 100;
  } else {
    return rate; // Fixed amount
  }
};

// Method to approve commission
affiliateCommissionSchema.methods.approve = function(approvedBy, notes = '') {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedDate = new Date();
  this.approvalNotes = notes;
  return this.save();
};

// Method to mark as paid
affiliateCommissionSchema.methods.markAsPaid = function(paymentDetails) {
  this.paymentStatus = 'paid';
  this.paidDate = new Date();
  this.payment = { ...this.payment, ...paymentDetails };
  return this.save();
};

// Static method to create multi-level commissions for a store sale
affiliateCommissionSchema.statics.createMultiLevelCommissions = async function(saleData) {
  const Affiliate = require('./Affiliate');
  const commissions = [];

  try {
    // Find the selling affiliate
    const sellingAffiliate = await Affiliate.findOne({
      affiliateCode: saleData.affiliateCode,
      status: 'active'
    });

    if (!sellingAffiliate) {
      throw new Error('Selling affiliate not found or inactive');
    }

    // 1. Create recurring commission for the selling affiliate
    const recurringCommission = await this.create({
      affiliate: sellingAffiliate._id,
      store: saleData.storeId,
      invoice: saleData.invoiceId,
      type: 'recurring',
      commissionLevel: 0,
      sellingAffiliate: sellingAffiliate._id,
      period: {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      },
      baseAmount: saleData.amount,
      commissionRate: sellingAffiliate.commission.rate,
      commissionAmount: this.calculateCommission(
        saleData.amount,
        sellingAffiliate.commission.rate,
        sellingAffiliate.commission.type
      ),
      status: 'pending',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subscription: saleData.subscription,
      customerAcquisitionDate: new Date()
    });

    commissions.push(recurringCommission);

    // 2. Create one-time commission for direct referrer (Level 1)
    if (sellingAffiliate.referredBy) {
      const directReferrer = await Affiliate.findById(sellingAffiliate.referredBy);

      if (directReferrer && directReferrer.status === 'active' &&
          directReferrer.commission.referralCommission.enabled) {

        const oneTimeCommission = await this.create({
          affiliate: directReferrer._id,
          store: saleData.storeId,
          invoice: saleData.invoiceId,
          type: 'referral_onetime',
          commissionLevel: 1,
          sellingAffiliate: sellingAffiliate._id,
          period: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
          },
          baseAmount: saleData.amount,
          commissionRate: directReferrer.commission.referralCommission.oneTimeRate,
          commissionAmount: this.calculateCommission(
            saleData.amount,
            directReferrer.commission.referralCommission.oneTimeRate,
            'percentage'
          ),
          status: 'pending',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          subscription: saleData.subscription,
          customerAcquisitionDate: new Date(),
          notes: `One-time referral commission for referring ${sellingAffiliate.name}`
        });

        commissions.push(oneTimeCommission);
      }
    }

    // Note: Level 2 referrers do NOT get commission as per requirements
    // The system is limited to exactly 2 levels (selling affiliate + direct referrer only)

    return commissions;

  } catch (error) {
    console.error('Error creating multi-level commissions:', error);
    throw error;
  }
};

// Static method to create commissions for affiliate referral (when affiliate refers another affiliate)
affiliateCommissionSchema.statics.createAffiliateReferralCommission = async function(referrerAffiliate, newAffiliate, firstSaleData) {
  try {
    // Only create commission when the referred affiliate makes their first sale
    if (!firstSaleData) return null;

    const commission = await this.create({
      affiliate: referrerAffiliate._id,
      store: firstSaleData.storeId,
      invoice: firstSaleData.invoiceId,
      type: 'referral_onetime',
      commissionLevel: 1,
      sellingAffiliate: newAffiliate._id,
      period: {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      },
      baseAmount: firstSaleData.amount,
      commissionRate: referrerAffiliate.commission.referralCommission.oneTimeRate,
      commissionAmount: this.calculateCommission(
        firstSaleData.amount,
        referrerAffiliate.commission.referralCommission.oneTimeRate,
        'percentage'
      ),
      status: 'pending',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subscription: firstSaleData.subscription,
      customerAcquisitionDate: new Date(),
      notes: `Affiliate referral commission for referring ${newAffiliate.name}`
    });

    return commission;

  } catch (error) {
    console.error('Error creating affiliate referral commission:', error);
    throw error;
  }
};

module.exports = mongoose.model('AffiliateCommission', affiliateCommissionSchema);

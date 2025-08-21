const mongoose = require('mongoose');
const crypto = require('crypto');

const affiliateSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Please add affiliate name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
    match: [/^\+?[\d\s\-\(\)]{10,}$/, 'Please add a valid phone number']
  },
  
  // Business Information
  businessName: {
    type: String,
    trim: true,
    maxlength: [100, 'Business name cannot be more than 100 characters']
  },
  businessType: {
    type: String,
    enum: ['individual', 'company', 'partnership', 'other'],
    default: 'individual'
  },
  
  // Address
  address: {
    street: String,
    city: String,
    state: String,
    country: {
      type: String,
      default: 'India'
    },
    pincode: String
  },
  
  // Affiliate Details
  affiliateCode: {
    type: String,
    unique: true,
    required: true,
    uppercase: true
  },
  referralLink: {
    type: String,
    unique: true
  },
  
  // Commission Structure
  commission: {
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    rate: {
      type: Number,
      required: true,
      min: [0, 'Commission rate cannot be negative']
    },
    recurringCommission: {
      enabled: {
        type: Boolean,
        default: true
      },
      months: {
        type: Number,
        default: 12, // 12 months of recurring commission
        min: [1, 'Recurring months must be at least 1']
      }
    }
  },
  
  // Performance Metrics
  stats: {
    totalReferrals: {
      type: Number,
      default: 0
    },
    successfulReferrals: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    pendingEarnings: {
      type: Number,
      default: 0
    },
    paidEarnings: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    },
    lastReferralDate: Date,
    lastPaymentDate: Date
  },
  
  // Payment Information
  paymentDetails: {
    method: {
      type: String,
      enum: ['bank_transfer', 'upi', 'paypal', 'check'],
      default: 'bank_transfer'
    },
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      accountHolderName: String
    },
    upiId: String,
    paypalEmail: String
  },
  
  // Status and Settings
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_approval'],
    default: 'pending_approval'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Approval and Verification
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  
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
affiliateSchema.index({ affiliateCode: 1 });
affiliateSchema.index({ email: 1 });
affiliateSchema.index({ status: 1 });
affiliateSchema.index({ isActive: 1 });

// Generate unique affiliate code before saving
affiliateSchema.pre('save', async function(next) {
  if (!this.affiliateCode) {
    let code;
    let isUnique = false;
    
    while (!isUnique) {
      // Generate a 8-character code
      code = crypto.randomBytes(4).toString('hex').toUpperCase();
      
      // Check if code already exists
      const existingAffiliate = await this.constructor.findOne({ affiliateCode: code });
      if (!existingAffiliate) {
        isUnique = true;
      }
    }
    
    this.affiliateCode = code;
  }
  
  // Generate referral link
  if (!this.referralLink) {
    this.referralLink = `${process.env.FRONTEND_URL}/register?ref=${this.affiliateCode}`;
  }
  
  next();
});

// Virtual for conversion rate calculation
affiliateSchema.virtual('calculatedConversionRate').get(function() {
  if (this.stats.totalReferrals === 0) return 0;
  return Math.round((this.stats.successfulReferrals / this.stats.totalReferrals) * 100);
});

module.exports = mongoose.model('Affiliate', affiliateSchema);

const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const affiliateSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'Please add first name'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Please add last name'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
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

  // Password for affiliate panel login
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },

  // Date of Birth (18+ validation)
  dateOfBirth: {
    type: Date,
    required: [true, 'Please add date of birth'],
    validate: {
      validator: function(dob) {
        const age = Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000));
        return age >= 18;
      },
      message: 'Applicant must be 18 years or older'
    }
  },

  // Gender (Optional)
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    required: false
  },

  // Government ID Upload
  governmentId: {
    type: {
      type: String,
      enum: ['aadhaar', 'passport', 'voter_id', 'pan', 'driving_license'],
      required: [true, 'Please select government ID type']
    },
    number: {
      type: String,
      required: [true, 'Please add government ID number'],
      trim: true
    },
    document: {
      filename: String,
      originalName: String,
      mimetype: String,
      size: Number,
      uploadDate: {
        type: Date,
        default: Date.now
      },
      url: String, // File path or URL
      verified: {
        type: Boolean,
        default: false
      },
      verifiedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      },
      verifiedAt: Date
    }
  },

  // Profile Photo (Optional)
  profilePhoto: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    url: String
  },

  // Verification Status
  verification: {
    email: {
      verified: {
        type: Boolean,
        default: false
      },
      verifiedAt: Date,
      otp: String,
      otpExpires: Date,
      otpAttempts: {
        type: Number,
        default: 0
      }
    },
    phone: {
      verified: {
        type: Boolean,
        default: false
      },
      verifiedAt: Date,
      otp: String,
      otpExpires: Date,
      otpAttempts: {
        type: Number,
        default: 0
      }
    }
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

  // Address (Required for KYC)
  address: {
    street: {
      type: String,
      required: [true, 'Please add street address']
    },
    city: {
      type: String,
      required: [true, 'Please add city']
    },
    state: {
      type: String,
      required: [true, 'Please add state']
    },
    country: {
      type: String,
      default: 'India',
      required: true
    },
    pincode: {
      type: String,
      required: [true, 'Please add pincode'],
      match: [/^\d{6}$/, 'Please add a valid 6-digit pincode']
    }
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
  
  // Referral Relationship (Multi-Level Support)
  referredBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Affiliate',
    default: null
  },
  referralCode: {
    type: String,
    sparse: true, // Allows multiple null values but unique non-null values
    index: true
  },
  referralLevel: {
    type: Number,
    default: 0, // 0 = top level, 1 = level 1, 2 = level 2 (max)
    min: 0,
    max: 2
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
    },
    // Multi-level commission rates
    referralCommission: {
      enabled: {
        type: Boolean,
        default: true
      },
      oneTimeRate: {
        type: Number,
        default: 5, // 5% one-time commission for referring other affiliates
        min: [0, 'One-time commission rate cannot be negative']
      }
    }
  },
  
  // Performance Metrics
  stats: {
    // Store referrals
    totalReferrals: {
      type: Number,
      default: 0
    },
    successfulReferrals: {
      type: Number,
      default: 0
    },
    // Affiliate referrals (multi-level)
    totalAffiliateReferrals: {
      type: Number,
      default: 0
    },
    successfulAffiliateReferrals: {
      type: Number,
      default: 0
    },
    // Earnings breakdown
    totalEarnings: {
      type: Number,
      default: 0
    },
    recurringEarnings: {
      type: Number,
      default: 0
    },
    oneTimeEarnings: {
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
  
  // Payment Information (Enhanced for Indian market)
  paymentDetails: {
    preferredMethod: {
      type: String,
      enum: ['bank_transfer', 'upi', 'paypal'],
      default: 'bank_transfer'
    },
    bankDetails: {
      accountHolderName: {
        type: String,
        required: function() { return this.paymentDetails.preferredMethod === 'bank_transfer'; }
      },
      accountNumber: {
        type: String,
        required: function() { return this.paymentDetails.preferredMethod === 'bank_transfer'; }
      },
      ifscCode: {
        type: String,
        required: function() { return this.paymentDetails.preferredMethod === 'bank_transfer'; },
        match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please add a valid IFSC code']
      },
      bankName: String
    },
    upiId: {
      type: String,
      required: function() { return this.paymentDetails.preferredMethod === 'upi'; },
      match: [/^[\w\.\-_]{2,256}@[a-zA-Z]{2,64}$/, 'Please add a valid UPI ID']
    },
    paypalEmail: {
      type: String,
      required: function() { return this.paymentDetails.preferredMethod === 'paypal'; },
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid PayPal email']
    }
  },

  // Tax Information (Indian compliance)
  taxInfo: {
    panNumber: {
      type: String,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please add a valid PAN number'],
      required: function() {
        return this.stats && this.stats.totalEarnings > 10000; // Required after ₹10,000 earnings
      }
    },
    gstNumber: {
      type: String,
      match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please add a valid GST number']
    },
    tdsApplicable: {
      type: Boolean,
      default: true
    }
  },
  
  // Status and Settings
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_approval', 'rejected', 'under_review'],
    default: 'pending_approval'
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // KYC and Approval Status
  kycStatus: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'incomplete'],
    default: 'pending'
  },
  kycCompletedAt: Date,
  kycReviewedAt: Date,

  // Approval and Verification
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,

  // Notification Preferences
  notificationPreferences: {
    email: {
      newSale: { type: Boolean, default: true },
      commissionCredited: { type: Boolean, default: true },
      payoutReleased: { type: Boolean, default: true },
      promotionalMaterial: { type: Boolean, default: true },
      offerAlerts: { type: Boolean, default: true }
    },
    whatsapp: {
      newSale: { type: Boolean, default: false },
      commissionCredited: { type: Boolean, default: true },
      payoutReleased: { type: Boolean, default: true },
      promotionalMaterial: { type: Boolean, default: false },
      offerAlerts: { type: Boolean, default: true }
    },
    sms: {
      newSale: { type: Boolean, default: false },
      commissionCredited: { type: Boolean, default: false },
      payoutReleased: { type: Boolean, default: true },
      promotionalMaterial: { type: Boolean, default: false },
      offerAlerts: { type: Boolean, default: false }
    },
    digestFrequency: {
      type: String,
      enum: ['immediate', 'daily', 'weekly'],
      default: 'immediate'
    }
  },
  
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
affiliateSchema.index({ referralCode: 1 });
affiliateSchema.index({ referredBy: 1 });
affiliateSchema.index({ referralLevel: 1 });
affiliateSchema.index({ email: 1 });
affiliateSchema.index({ status: 1 });
affiliateSchema.index({ isActive: 1 });

// Hash password before saving
affiliateSchema.pre('save', async function(next) {
  // Hash password if it's modified
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Generate unique affiliate code before saving
affiliateSchema.pre('save', async function(next) {
  // Generate full name from first and last name
  if (this.firstName && this.lastName && !this.name) {
    this.name = `${this.firstName} ${this.lastName}`;
  }

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

// Match password method
affiliateSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
affiliateSchema.methods.getSignedJwtToken = function() {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    {
      id: this._id,
      role: 'affiliate',
      affiliateCode: this.affiliateCode
    },
    process.env.JWT_SECRET || 'fallback-secret-key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Generate OTP for verification
affiliateSchema.methods.generateOTP = function(type = 'email') {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  if (type === 'email') {
    this.verification.email.otp = otp;
    this.verification.email.otpExpires = otpExpires;
    this.verification.email.otpAttempts = 0;
  } else if (type === 'phone') {
    this.verification.phone.otp = otp;
    this.verification.phone.otpExpires = otpExpires;
    this.verification.phone.otpAttempts = 0;
  }

  return otp;
};

// Verify OTP
affiliateSchema.methods.verifyOTP = function(otp, type = 'email') {
  const verification = this.verification[type];

  if (!verification.otp || verification.otpExpires < new Date()) {
    return { success: false, message: 'OTP expired or not found' };
  }

  if (verification.otpAttempts >= 3) {
    return { success: false, message: 'Too many OTP attempts. Please request a new OTP.' };
  }

  if (verification.otp !== otp) {
    verification.otpAttempts += 1;
    return { success: false, message: 'Invalid OTP' };
  }

  // OTP is valid
  verification.verified = true;
  verification.verifiedAt = new Date();
  verification.otp = undefined;
  verification.otpExpires = undefined;
  verification.otpAttempts = 0;

  return { success: true, message: 'OTP verified successfully' };
};

// Virtual for conversion rate calculation
affiliateSchema.virtual('calculatedConversionRate').get(function() {
  if (this.stats.totalReferrals === 0) return 0;
  return Math.round((this.stats.successfulReferrals / this.stats.totalReferrals) * 100);
});

// Method to get referral hierarchy (up to 2 levels)
affiliateSchema.methods.getReferralHierarchy = async function() {
  const hierarchy = [];
  let currentAffiliate = this;

  // Go up the referral chain (max 2 levels)
  while (currentAffiliate.referredBy && hierarchy.length < 2) {
    const referrer = await this.constructor.findById(currentAffiliate.referredBy)
      .select('name email affiliateCode referralLevel');

    if (referrer) {
      hierarchy.push({
        level: hierarchy.length + 1,
        affiliate: referrer,
        relationship: hierarchy.length === 0 ? 'direct_referrer' : 'indirect_referrer'
      });
      currentAffiliate = referrer;
    } else {
      break;
    }
  }

  return hierarchy;
};

// Method to get direct referrals (affiliates referred by this affiliate)
affiliateSchema.methods.getDirectReferrals = async function() {
  return await this.constructor.find({ referredBy: this._id })
    .select('name email affiliateCode referralLevel status createdAt')
    .sort({ createdAt: -1 });
};

// Static method to calculate referral level
affiliateSchema.statics.calculateReferralLevel = async function(referrerCode) {
  if (!referrerCode) return 0;

  const referrer = await this.findOne({ affiliateCode: referrerCode });
  if (!referrer) return 0;

  // Max level is 2, so if referrer is at level 2, new affiliate can't be added
  if (referrer.referralLevel >= 2) {
    throw new Error('Maximum referral depth reached. Cannot add more levels.');
  }

  return referrer.referralLevel + 1;
};

// Static method to validate referral code
affiliateSchema.statics.validateReferralCode = async function(referralCode, excludeId = null) {
  if (!referralCode) return { valid: false, message: 'Referral code is required' };

  const query = { affiliateCode: referralCode, status: 'active' };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const referrer = await this.findOne(query);

  if (!referrer) {
    return { valid: false, message: 'Invalid or inactive referral code' };
  }

  if (referrer.referralLevel >= 2) {
    return { valid: false, message: 'This affiliate has reached maximum referral depth' };
  }

  return { valid: true, referrer, newLevel: referrer.referralLevel + 1 };
};

module.exports = mongoose.model('Affiliate', affiliateSchema);

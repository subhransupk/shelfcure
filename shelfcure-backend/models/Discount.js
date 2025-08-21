const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Please add discount name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  code: {
    type: String,
    required: [true, 'Please add discount code'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [20, 'Code cannot be more than 20 characters']
  },
  
  // Discount Type and Value
  type: {
    type: String,
    enum: ['percentage', 'fixed_amount'],
    required: true
  },
  value: {
    type: Number,
    required: [true, 'Please add discount value'],
    min: [0, 'Discount value cannot be negative']
  },
  
  // Applicability
  applicableTo: {
    type: String,
    enum: ['all_plans', 'specific_plans', 'first_time_only', 'renewals_only'],
    default: 'all_plans'
  },
  applicablePlans: [{
    type: mongoose.Schema.ObjectId,
    ref: 'SubscriptionPlan'
  }],
  
  // Usage Limits
  limits: {
    maxUses: {
      type: Number,
      default: -1 // -1 means unlimited
    },
    maxUsesPerCustomer: {
      type: Number,
      default: 1
    },
    minOrderAmount: {
      type: Number,
      default: 0
    },
    maxDiscountAmount: {
      type: Number,
      default: -1 // -1 means no limit
    }
  },
  
  // Time Validity
  validity: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    }
  },
  
  // Customer Restrictions
  customerRestrictions: {
    newCustomersOnly: {
      type: Boolean,
      default: false
    },
    specificCustomers: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Store'
    }],
    excludedCustomers: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Store'
    }]
  },
  
  // Usage Statistics
  stats: {
    totalUses: {
      type: Number,
      default: 0
    },
    totalDiscountGiven: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    uniqueCustomers: {
      type: Number,
      default: 0
    },
    lastUsedDate: Date
  },
  
  // Status and Settings
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true // If false, only admin can apply
  },
  autoApply: {
    type: Boolean,
    default: false // Automatically apply if conditions are met
  },
  
  // Stacking Rules
  stackable: {
    type: Boolean,
    default: false
  },
  priority: {
    type: Number,
    default: 0 // Higher number = higher priority
  },
  
  // Marketing
  marketing: {
    campaignName: String,
    source: {
      type: String,
      enum: ['email', 'social_media', 'affiliate', 'direct', 'other'],
      default: 'direct'
    },
    tags: [String]
  },
  
  // Tracking
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
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
discountSchema.index({ code: 1 });
discountSchema.index({ isActive: 1 });
discountSchema.index({ 'validity.startDate': 1, 'validity.endDate': 1 });
discountSchema.index({ applicableTo: 1 });

// Virtual for checking if discount is currently valid
discountSchema.virtual('isCurrentlyValid').get(function() {
  const now = new Date();
  return this.isActive && 
         this.validity.startDate <= now && 
         this.validity.endDate >= now &&
         (this.limits.maxUses === -1 || this.stats.totalUses < this.limits.maxUses);
});

// Virtual for usage percentage
discountSchema.virtual('usagePercentage').get(function() {
  if (this.limits.maxUses === -1) return 0; // Unlimited
  return Math.round((this.stats.totalUses / this.limits.maxUses) * 100);
});

// Virtual for days remaining
discountSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const endDate = new Date(this.validity.endDate);
  
  if (endDate < now) return 0;
  
  return Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
});

// Method to check if discount can be used by a customer
discountSchema.methods.canBeUsedBy = function(customerId, orderAmount = 0) {
  // Check if discount is active and valid
  if (!this.isCurrentlyValid) return false;
  
  // Check minimum order amount
  if (orderAmount < this.limits.minOrderAmount) return false;
  
  // Check customer restrictions
  if (this.customerRestrictions.newCustomersOnly) {
    // Would need to check if customer is new (implementation depends on business logic)
  }
  
  // Check if customer is specifically excluded
  if (this.customerRestrictions.excludedCustomers.includes(customerId)) {
    return false;
  }
  
  // Check if discount is restricted to specific customers
  if (this.customerRestrictions.specificCustomers.length > 0) {
    return this.customerRestrictions.specificCustomers.includes(customerId);
  }
  
  return true;
};

// Virtual field for status based on isActive and validity
discountSchema.virtual('status').get(function() {
  if (!this.isActive) return 'inactive';
  if (!this.isCurrentlyValid) return 'expired';
  return 'active';
});

// Virtual fields for frontend compatibility
discountSchema.virtual('totalUsageLimit').get(function() {
  return this.limits?.maxUses === -1 ? null : this.limits?.maxUses;
});

discountSchema.virtual('usageLimitPerUser').get(function() {
  return this.limits?.maxUsesPerCustomer;
});

discountSchema.virtual('minOrderAmount').get(function() {
  return this.limits?.minOrderAmount || 0;
});

discountSchema.virtual('maxDiscountAmount').get(function() {
  return this.limits?.maxDiscountAmount === -1 ? null : this.limits?.maxDiscountAmount;
});

discountSchema.virtual('validFrom').get(function() {
  return this.validity?.startDate;
});

discountSchema.virtual('validUntil').get(function() {
  return this.validity?.endDate;
});

discountSchema.virtual('usedCount').get(function() {
  return this.stats?.totalUses || 0;
});

// Method to calculate discount amount
discountSchema.methods.calculateDiscount = function(orderAmount) {
  let discountAmount = 0;

  if (this.type === 'percentage') {
    discountAmount = (orderAmount * this.value) / 100;
  } else if (this.type === 'fixed_amount') {
    discountAmount = this.value;
  }

  // Apply maximum discount limit if set
  if (this.limits.maxDiscountAmount > 0) {
    discountAmount = Math.min(discountAmount, this.limits.maxDiscountAmount);
  }

  // Ensure discount doesn't exceed order amount
  discountAmount = Math.min(discountAmount, orderAmount);

  return Math.round(discountAmount * 100) / 100; // Round to 2 decimal places
};

module.exports = mongoose.model('Discount', discountSchema);

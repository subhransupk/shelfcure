const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a plan name'],
    trim: true,
    maxlength: [50, 'Plan name cannot be more than 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a plan description'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  planType: {
    type: String,
    enum: ['basic', 'standard', 'premium', 'enterprise', 'custom'],
    required: true
  },
  
  // Pricing
  pricing: {
    monthly: {
      type: Number,
      required: true,
      min: [0, 'Monthly price cannot be negative']
    },
    yearly: {
      type: Number,
      required: true,
      min: [0, 'Yearly price cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%']
    }
  },
  
  // Limits
  limits: {
    maxUsers: {
      type: Number,
      required: true,
      min: [1, 'Must allow at least 1 user']
    },
    maxProducts: {
      type: Number,
      required: true,
      min: [1, 'Must allow at least 1 product']
    },
    maxStores: {
      type: Number,
      default: 1,
      min: [1, 'Must allow at least 1 store']
    },
    maxTransactionsPerMonth: {
      type: Number,
      default: -1 // -1 means unlimited
    },
    storageLimit: {
      type: Number, // in GB
      default: 5
    }
  },
  
  // Features
  features: {
    multiStore: {
      type: Boolean,
      default: false
    },
    analytics: {
      type: Boolean,
      default: true
    },
    advancedAnalytics: {
      type: Boolean,
      default: false
    },
    whatsappIntegration: {
      type: Boolean,
      default: false
    },
    billOCR: {
      type: Boolean,
      default: false
    },
    customReports: {
      type: Boolean,
      default: false
    },
    apiAccess: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    backupRestore: {
      type: Boolean,
      default: false
    },
    customBranding: {
      type: Boolean,
      default: false
    },
    affiliateProgram: {
      type: Boolean,
      default: false
    }
  },
  
  // Trial settings
  trial: {
    enabled: {
      type: Boolean,
      default: true
    },
    durationDays: {
      type: Number,
      default: 14,
      min: [1, 'Trial must be at least 1 day']
    }
  },
  
  // Status and metadata
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
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
subscriptionPlanSchema.index({ planType: 1 });
subscriptionPlanSchema.index({ isActive: 1 });
subscriptionPlanSchema.index({ sortOrder: 1 });

// Virtual for yearly savings
subscriptionPlanSchema.virtual('yearlySavings').get(function() {
  const monthlyTotal = this.pricing.monthly * 12;
  return monthlyTotal - this.pricing.yearly;
});

// Virtual for yearly savings percentage
subscriptionPlanSchema.virtual('yearlySavingsPercentage').get(function() {
  const monthlyTotal = this.pricing.monthly * 12;
  if (monthlyTotal === 0) return 0;
  return Math.round(((monthlyTotal - this.pricing.yearly) / monthlyTotal) * 100);
});

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

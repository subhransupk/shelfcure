const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  // Store Owner who owns this subscription
  storeOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Subscription Plan Details
  plan: {
    type: String,
    enum: ['basic', 'standard', 'premium', 'enterprise'],
    required: true
  },
  
  // Subscription Status
  status: {
    type: String,
    enum: ['active', 'trial', 'expired', 'cancelled', 'suspended'],
    default: 'trial'
  },
  
  // Billing Information
  billingDuration: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  
  // Subscription Dates
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  trialEndDate: {
    type: Date
  },
  
  // Store Management
  storeCountLimit: {
    type: Number,
    required: true,
    default: 1
  },
  currentStoreCount: {
    type: Number,
    default: 0
  },
  
  // Plan Features
  features: {
    multiStore: { type: Boolean, default: false },
    analytics: { type: Boolean, default: true },
    whatsappIntegration: { type: Boolean, default: false },
    billOCR: { type: Boolean, default: false },
    customReports: { type: Boolean, default: false },
    inventoryManagement: { type: Boolean, default: true },
    customerManagement: { type: Boolean, default: true },
    staffManagement: { type: Boolean, default: true }
  },
  
  // Limits based on plan
  limits: {
    maxUsers: { type: Number, default: 5 },
    maxProducts: { type: Number, default: 1000 },
    maxTransactions: { type: Number, default: 1000 },
    maxStorage: { type: Number, default: 1 } // in GB
  },
  
  // Payment Information
  pricing: {
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true }
  },
  
  // Payment Status
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  
  // Auto-renewal
  autoRenewal: {
    type: Boolean,
    default: true
  },
  
  // Cancellation
  cancellationDate: Date,
  cancellationReason: String,
  
  // Admin Notes
  adminNotes: String,
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for remaining days
subscriptionSchema.virtual('remainingDays').get(function() {
  if (!this.endDate) return 0;
  const now = new Date();
  const diffTime = this.endDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for subscription health
subscriptionSchema.virtual('isActive').get(function() {
  return this.status === 'active' || 
         (this.status === 'trial' && this.endDate && this.endDate > new Date());
});

// Virtual for can create more stores
subscriptionSchema.virtual('canCreateMoreStores').get(function() {
  return this.currentStoreCount < this.storeCountLimit;
});

// Virtual for remaining store slots
subscriptionSchema.virtual('remainingStoreSlots').get(function() {
  return Math.max(0, this.storeCountLimit - this.currentStoreCount);
});

// Indexes
subscriptionSchema.index({ storeOwner: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ plan: 1 });

// Static method to get plan features
subscriptionSchema.statics.getPlanFeatures = function(plan) {
  const planFeatures = {
    basic: {
      storeCountLimit: 1,
      features: {
        multiStore: false,
        analytics: true,
        whatsappIntegration: false,
        billOCR: false,
        customReports: false,
        inventoryManagement: true,
        customerManagement: true,
        staffManagement: true
      },
      limits: {
        maxUsers: 5,
        maxProducts: 1000,
        maxTransactions: 1000,
        maxStorage: 1
      },
      pricing: { amount: 999, currency: 'INR' }
    },
    standard: {
      storeCountLimit: 3,
      features: {
        multiStore: true,
        analytics: true,
        whatsappIntegration: true,
        billOCR: false,
        customReports: false,
        inventoryManagement: true,
        customerManagement: true,
        staffManagement: true
      },
      limits: {
        maxUsers: 15,
        maxProducts: 5000,
        maxTransactions: 5000,
        maxStorage: 5
      },
      pricing: { amount: 1999, currency: 'INR' }
    },
    premium: {
      storeCountLimit: 10,
      features: {
        multiStore: true,
        analytics: true,
        whatsappIntegration: true,
        billOCR: true,
        customReports: true,
        inventoryManagement: true,
        customerManagement: true,
        staffManagement: true
      },
      limits: {
        maxUsers: 50,
        maxProducts: 25000,
        maxTransactions: 25000,
        maxStorage: 25
      },
      pricing: { amount: 2999, currency: 'INR' }
    },
    enterprise: {
      storeCountLimit: 999,
      features: {
        multiStore: true,
        analytics: true,
        whatsappIntegration: true,
        billOCR: true,
        customReports: true,
        inventoryManagement: true,
        customerManagement: true,
        staffManagement: true
      },
      limits: {
        maxUsers: 999,
        maxProducts: 999999,
        maxTransactions: 999999,
        maxStorage: 100
      },
      pricing: { amount: 4999, currency: 'INR' }
    }
  };
  
  return planFeatures[plan] || planFeatures.basic;
};

// Instance method to check if can create store
subscriptionSchema.methods.canCreateStore = function() {
  return this.isActive && this.canCreateMoreStores;
};

// Instance method to increment store count
subscriptionSchema.methods.incrementStoreCount = function() {
  if (this.canCreateMoreStores) {
    this.currentStoreCount += 1;
    return this.save();
  }
  throw new Error('Store limit reached for this subscription');
};

// Instance method to decrement store count
subscriptionSchema.methods.decrementStoreCount = function() {
  if (this.currentStoreCount > 0) {
    this.currentStoreCount -= 1;
    return this.save();
  }
};

module.exports = mongoose.model('Subscription', subscriptionSchema);

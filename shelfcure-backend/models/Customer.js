const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  // Store reference
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },

  // Basic information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        // Only validate if email is provided (not empty/null/undefined)
        return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  
  // Demographics
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    lowercase: true
  },
  age: {
    type: Number,
    min: 0,
    max: 150
  },

  // Address information
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: 200
    },
    city: {
      type: String,
      trim: true,
      maxlength: 50
    },
    state: {
      type: String,
      trim: true,
      maxlength: 50
    },
    pincode: {
      type: String,
      trim: true,
      match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit pincode']
    },
    country: {
      type: String,
      trim: true,
      default: 'India'
    }
  },

  // Medical information
  medicalHistory: [{
    condition: String,
    diagnosedDate: Date,
    notes: String
  }],
  allergies: [{
    allergen: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    },
    notes: String
  }],
  currentMedications: [{
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine'
    },
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date,
    prescribedBy: String
  }],

  // Purchase history and analytics
  totalPurchases: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  lastPurchaseDate: Date,
  averageOrderValue: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Loyalty and credit information
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: 0
  },
  creditBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  creditStatus: {
    type: String,
    enum: ['good', 'warning', 'blocked'],
    default: 'good'
  },

  // Customer preferences
  preferredPaymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'credit'],
    default: 'cash'
  },
  communicationPreferences: {
    sms: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    whatsapp: {
      type: Boolean,
      default: false
    }
  },
  
  // Doctor references
  primaryDoctor: {
    name: String,
    phone: String,
    specialization: String,
    hospital: String
  },
  referredBy: {
    type: String,
    trim: true
  },

  // Customer status and notes
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  customerType: {
    type: String,
    enum: [
      'regular', 'vip', 'premium', 'wholesale', 'retail', 'corporate',
      'hospital', 'pharmacy', 'doctor', 'insurance', 'government',
      'ngo', 'senior', 'student', 'employee', 'loyalty', 'credit',
      'cash', 'online', 'walk_in', 'institutional'
    ],
    default: 'regular'
  },
  notes: {
    type: String,
    maxlength: 1000
  },

  // Discount eligibility
  discountEligible: {
    type: Boolean,
    default: false
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Emergency contact
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },

  // Insurance information
  insurance: {
    provider: String,
    policyNumber: String,
    validUntil: Date,
    coverageAmount: Number
  },

  // Metadata
  registrationDate: {
    type: Date,
    default: Date.now
  },
  lastVisit: Date,
  visitCount: {
    type: Number,
    default: 0
  },
  
  // Created by staff member
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
customerSchema.index({ store: 1, phone: 1 }, { unique: true });
customerSchema.index({ store: 1, email: 1 }, { sparse: true });
customerSchema.index({ store: 1, name: 1 });
customerSchema.index({ store: 1, status: 1 });
customerSchema.index({ store: 1, customerType: 1 });
customerSchema.index({ store: 1, lastPurchaseDate: -1 });

// Virtual for full address
customerSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  
  const parts = [
    this.address.street,
    this.address.city,
    this.address.state,
    this.address.pincode
  ].filter(Boolean);
  
  return parts.join(', ');
});

// Virtual for customer age calculation
customerSchema.virtual('calculatedAge').get(function() {
  if (!this.dateOfBirth) return this.age;
  
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Virtual for customer lifetime value
customerSchema.virtual('lifetimeValue').get(function() {
  return this.totalSpent;
});

// Pre-save middleware
customerSchema.pre('save', function(next) {
  // Update age if date of birth is provided
  if (this.dateOfBirth && !this.age) {
    this.age = this.calculatedAge;
  }
  
  // Calculate average order value
  if (this.totalPurchases > 0) {
    this.averageOrderValue = this.totalSpent / this.totalPurchases;
  }
  
  next();
});

// Static method to find customers by store
customerSchema.statics.findByStore = function(storeId, options = {}) {
  const query = { store: storeId, status: 'active' };
  
  if (options.search) {
    query.$or = [
      { name: { $regex: options.search, $options: 'i' } },
      { phone: { $regex: options.search } },
      { email: { $regex: options.search, $options: 'i' } }
    ];
  }
  
  return this.find(query)
    .sort(options.sort || { name: 1 })
    .limit(options.limit || 50);
};

// Static method to get customer analytics
customerSchema.statics.getCustomerAnalytics = function(storeId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        store: new mongoose.Types.ObjectId(storeId),
        registrationDate: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalCustomers: { $sum: 1 },
        averageSpent: { $avg: '$totalSpent' },
        totalRevenue: { $sum: '$totalSpent' },
        activeCustomers: {
          $sum: {
            $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
          }
        }
      }
    }
  ]);
};

// Method to update purchase statistics
customerSchema.methods.updatePurchaseStats = function(saleAmount) {
  this.totalPurchases += 1;
  this.totalSpent += saleAmount;
  this.lastPurchaseDate = new Date();
  this.visitCount += 1;
  this.averageOrderValue = this.totalSpent / this.totalPurchases;
  
  return this.save();
};

// Method to add loyalty points
customerSchema.methods.addLoyaltyPoints = function(points) {
  this.loyaltyPoints += points;
  return this.save();
};

// Method to update credit balance
customerSchema.methods.updateCreditBalance = function(amount) {
  this.creditBalance += amount;
  
  // Update credit status based on balance
  if (this.creditBalance > this.creditLimit * 0.9) {
    this.creditStatus = 'warning';
  } else if (this.creditBalance > this.creditLimit) {
    this.creditStatus = 'blocked';
  } else {
    this.creditStatus = 'good';
  }
  
  return this.save();
};

module.exports = mongoose.model('Customer', customerSchema);

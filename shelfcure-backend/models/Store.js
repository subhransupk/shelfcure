const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add store name'],
    trim: true,
    maxlength: [100, 'Store name cannot be more than 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Please add store code'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [10, 'Store code cannot be more than 10 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  
  // Contact Information
  contact: {
    phone: {
      type: String,
      required: [true, 'Please add phone number'],
      match: [/^\+?[\d\s\-\(\)]{10,}$/, 'Please add a valid phone number']
    },
    email: {
      type: String,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    website: String,
    whatsapp: String
  },
  
  // Address Information
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
      required: [true, 'Please add country'],
      default: 'India'
    },
    pincode: {
      type: String,
      required: [true, 'Please add pincode'],
      match: [/^\d{6}$/, 'Please add a valid 6-digit pincode']
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Business Information
  business: {
    licenseNumber: {
      type: String,
      required: [true, 'Please add license number'],
      unique: true
    },
    gstNumber: {
      type: String,
      match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please add a valid GST number']
    },
    drugLicenseNumber: String,
    establishmentYear: {
      type: Number,
      min: [1900, 'Establishment year must be after 1900'],
      max: [new Date().getFullYear(), 'Establishment year cannot be in the future']
    }
  },
  
  // Store Configuration
  settings: {
    // Dual Unit Preferences
    defaultUnitType: {
      type: String,
      enum: ['strip', 'individual', 'both'],
      default: 'both'
    },
    preferredUnitForSales: {
      type: String,
      enum: ['strip', 'individual', 'auto'],
      default: 'auto'
    },
    
    // Inventory Settings
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, 'Low stock threshold cannot be negative']
    },
    expiryAlertDays: {
      type: Number,
      default: 30,
      min: [1, 'Expiry alert days must be at least 1']
    },
    autoReorderEnabled: {
      type: Boolean,
      default: false
    },
    
    // Sales Settings
    allowNegativeStock: {
      type: Boolean,
      default: false
    },
    requirePrescription: {
      type: Boolean,
      default: true
    },
    printReceiptByDefault: {
      type: Boolean,
      default: true
    },
    
    // Tax Settings
    defaultTaxRate: {
      type: Number,
      default: 18,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%']
    },
    includeTaxInPrice: {
      type: Boolean,
      default: true
    },
    
    // Currency and Formatting
    currency: {
      type: String,
      default: 'INR'
    },
    currencySymbol: {
      type: String,
      default: '₹'
    },
    decimalPlaces: {
      type: Number,
      default: 2,
      min: [0, 'Decimal places cannot be negative'],
      max: [4, 'Decimal places cannot exceed 4']
    },
    
    // Notification Settings
    notifications: {
      lowStock: { type: Boolean, default: true },
      expiry: { type: Boolean, default: true },
      sales: { type: Boolean, default: false },
      purchases: { type: Boolean, default: false }
    },
    
    // WhatsApp Integration
    whatsapp: {
      enabled: { type: Boolean, default: false },
      apiType: {
        type: String,
        enum: ['click-to-chat', 'web-api', 'business-api'],
        default: 'click-to-chat'
      },
      phoneNumber: String,
      apiToken: String,
      welcomeMessage: {
        type: String,
        default: 'Welcome to our pharmacy! How can we help you today?'
      }
    }
  },
  
  // Operating Hours
  operatingHours: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: true } }
  },
  
  // Staff and Management
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  managers: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  staff: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['store_manager', 'staff', 'cashier'],
      default: 'staff'
    },
    joinDate: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Store subscription is now managed at Store Owner level
  // This store inherits subscription from its owner
  
  // Status and Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  logo: String,
  theme: {
    primaryColor: {
      type: String,
      default: '#16a34a' // ShelfCure green
    },
    secondaryColor: String,
    logoUrl: String
  },
  
  // Analytics and Statistics
  stats: {
    totalSales: { type: Number, default: 0 },
    totalCustomers: { type: Number, default: 0 },
    totalProducts: { type: Number, default: 0 },
    lastSaleDate: Date,
    averageSaleValue: { type: Number, default: 0 }
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

// Virtuals
storeSchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} - ${this.address.pincode}`;
});

storeSchema.virtual('totalStaff').get(function() {
  return this.staff ? this.staff.filter(s => s.isActive).length : 0;
});

// Subscription status is now determined by the Store Owner's subscription
// This virtual will be populated when needed

// Indexes
storeSchema.index({ code: 1 });
storeSchema.index({ owner: 1 });
storeSchema.index({ 'business.licenseNumber': 1 });
// Subscription index removed - now managed at Store Owner level
storeSchema.index({ isActive: 1 });

// Pre-save middleware
storeSchema.pre('save', function(next) {
  // Ensure store code is uppercase
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  
  // Set default operating hours if not provided
  if (!this.operatingHours.monday.open) {
    const defaultHours = { open: '09:00', close: '21:00', closed: false };
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    days.forEach(day => {
      if (!this.operatingHours[day].open) {
        this.operatingHours[day] = { ...defaultHours };
      }
    });
    // Sunday closed by default
    if (!this.operatingHours.sunday.open) {
      this.operatingHours.sunday = { open: '', close: '', closed: true };
    }
  }
  
  next();
});

// Static method to find stores by owner
storeSchema.statics.findByOwner = function(ownerId) {
  return this.find({ owner: ownerId, isActive: true });
};

// Static method to find active stores
storeSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

module.exports = mongoose.model('Store', storeSchema);

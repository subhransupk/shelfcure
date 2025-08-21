const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  // General Settings
  general: {
    siteName: {
      type: String,
      default: 'ShelfCure',
      required: true,
      trim: true,
      maxlength: [100, 'Site name cannot be more than 100 characters']
    },
    siteDescription: {
      type: String,
      default: 'Comprehensive Medicine Store Management System',
      trim: true,
      maxlength: [500, 'Site description cannot be more than 500 characters']
    },
    adminEmail: {
      type: String,
      default: 'admin@shelfcure.com',
      required: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid admin email']
    },
    supportEmail: {
      type: String,
      default: 'support@shelfcure.com',
      required: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid support email']
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
      required: true
    },
    dateFormat: {
      type: String,
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
      default: 'DD/MM/YYYY'
    },
    currency: {
      type: String,
      default: 'INR',
      required: true,
      uppercase: true,
      minlength: [3, 'Currency code must be 3 characters'],
      maxlength: [3, 'Currency code must be 3 characters']
    },
    currencySymbol: {
      type: String,
      default: '₹',
      required: true
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'bn', 'te', 'ta', 'mr', 'gu'],
      default: 'en'
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    maintenanceMessage: {
      type: String,
      default: 'System is under maintenance. Please try again later.'
    }
  },

  // Security Settings
  security: {
    enableTwoFactor: {
      type: Boolean,
      default: false
    },
    sessionTimeout: {
      type: Number,
      default: 30,
      min: [5, 'Session timeout must be at least 5 minutes'],
      max: [480, 'Session timeout cannot exceed 8 hours']
    },
    maxLoginAttempts: {
      type: Number,
      default: 5,
      min: [3, 'Max login attempts must be at least 3'],
      max: [10, 'Max login attempts cannot exceed 10']
    },
    passwordMinLength: {
      type: Number,
      default: 8,
      min: [6, 'Password minimum length must be at least 6'],
      max: [50, 'Password minimum length cannot exceed 50']
    },
    requirePasswordChange: {
      type: Boolean,
      default: false
    },
    passwordChangeInterval: {
      type: Number,
      default: 90,
      min: [30, 'Password change interval must be at least 30 days']
    },
    enableAuditLog: {
      type: Boolean,
      default: true
    },
    ipWhitelist: {
      type: [String],
      default: []
    },
    enableCaptcha: {
      type: Boolean,
      default: true
    }
  },

  // Email Settings
  email: {
    smtpHost: {
      type: String,
      default: 'smtp.gmail.com'
    },
    smtpPort: {
      type: Number,
      default: 587,
      min: [1, 'SMTP port must be a positive number'],
      max: [65535, 'SMTP port cannot exceed 65535']
    },
    smtpUsername: {
      type: String,
      default: ''
    },
    smtpPassword: {
      type: String,
      default: ''
    },
    enableSSL: {
      type: Boolean,
      default: true
    },
    fromEmail: {
      type: String,
      default: 'noreply@shelfcure.com',
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid from email']
    },
    fromName: {
      type: String,
      default: 'ShelfCure',
      trim: true
    }
  },

  // Notification Settings
  notifications: {
    enableEmailNotifications: {
      type: Boolean,
      default: true
    },
    enableSMSNotifications: {
      type: Boolean,
      default: false
    },
    enablePushNotifications: {
      type: Boolean,
      default: true
    },
    lowStockAlerts: {
      type: Boolean,
      default: true
    },
    expiryAlerts: {
      type: Boolean,
      default: true
    },
    subscriptionAlerts: {
      type: Boolean,
      default: true
    },
    systemAlerts: {
      type: Boolean,
      default: true
    },
    alertEmails: {
      type: [String],
      default: []
    }
  },

  // Business Settings
  business: {
    maxStoresPerSubscription: {
      type: Number,
      default: 5,
      min: [1, 'Max stores per subscription must be at least 1'],
      max: [100, 'Max stores per subscription cannot exceed 100']
    },
    defaultSubscriptionPlan: {
      type: String,
      enum: ['basic', 'standard', 'premium', 'enterprise'],
      default: 'basic'
    },
    enableTrialPeriod: {
      type: Boolean,
      default: true
    },
    trialDurationDays: {
      type: Number,
      default: 14,
      min: [1, 'Trial duration must be at least 1 day'],
      max: [90, 'Trial duration cannot exceed 90 days']
    },
    enableAffiliateProgram: {
      type: Boolean,
      default: true
    },
    defaultCommissionRate: {
      type: Number,
      default: 10,
      min: [0, 'Commission rate cannot be negative'],
      max: [50, 'Commission rate cannot exceed 50%']
    },
    minimumPayoutAmount: {
      type: Number,
      default: 1000,
      min: [100, 'Minimum payout amount must be at least 100']
    },
    enableMultiStore: {
      type: Boolean,
      default: true
    },
    enableWhatsAppIntegration: {
      type: Boolean,
      default: true
    },
    enableBillOCR: {
      type: Boolean,
      default: true
    }
  },

  // System Settings
  system: {
    enableAnalytics: {
      type: Boolean,
      default: true
    },
    enableBackups: {
      type: Boolean,
      default: true
    },
    backupFrequency: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly'],
      default: 'daily'
    },
    enableCaching: {
      type: Boolean,
      default: true
    },
    cacheTimeout: {
      type: Number,
      default: 3600,
      min: [60, 'Cache timeout must be at least 60 seconds']
    },
    enableRateLimiting: {
      type: Boolean,
      default: true
    },
    rateLimitRequests: {
      type: Number,
      default: 1000,
      min: [100, 'Rate limit requests must be at least 100']
    },
    enableDebugMode: {
      type: Boolean,
      default: false
    },
    logLevel: {
      type: String,
      enum: ['error', 'warn', 'info', 'debug'],
      default: 'info'
    },
    enableHealthChecks: {
      type: Boolean,
      default: true
    }
  },

  // Tracking
  lastUpdatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure only one settings document exists
systemSettingsSchema.index({}, { unique: true });

// Static method to get or create settings
systemSettingsSchema.statics.getSettings = async function() {
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
systemSettingsSchema.statics.updateSettings = async function(updates, updatedBy) {
  const settings = await this.getSettings();
  
  // Update nested objects properly
  Object.keys(updates).forEach(category => {
    if (typeof updates[category] === 'object' && updates[category] !== null) {
      Object.keys(updates[category]).forEach(key => {
        if (settings[category]) {
          settings[category][key] = updates[category][key];
        }
      });
    } else {
      settings[category] = updates[category];
    }
  });
  
  settings.lastUpdatedBy = updatedBy;
  settings.lastUpdatedAt = new Date();
  
  await settings.save();
  return settings;
};

// Method to get client-safe format (without sensitive data)
systemSettingsSchema.methods.toClientFormat = function() {
  const settings = this.toObject();
  
  // Remove sensitive information
  if (settings.email) {
    delete settings.email.smtpPassword;
  }
  
  return settings;
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);

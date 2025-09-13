const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  // Store reference - doctors are connected to individual stores
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },

  // Basic information
  name: {
    type: String,
    required: [true, 'Please add doctor name'],
    trim: true,
    maxlength: [100, 'Doctor name cannot be more than 100 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Please add phone number'],
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  alternatePhone: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },

  // Professional information
  specialization: {
    type: String,
    required: [true, 'Please add specialization'],
    trim: true,
    maxlength: [100, 'Specialization cannot be more than 100 characters']
  },
  qualification: {
    type: String,
    trim: true,
    maxlength: [200, 'Qualification cannot be more than 200 characters']
  },
  experience: {
    type: Number,
    min: [0, 'Experience cannot be negative'],
    max: [70, 'Experience cannot be more than 70 years']
  },
  registrationNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Registration number cannot be more than 50 characters']
  },

  // Address information
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: [200, 'Street address cannot be more than 200 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [50, 'City cannot be more than 50 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [50, 'State cannot be more than 50 characters']
    },
    pincode: {
      type: String,
      trim: true,
      match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit pincode']
    }
  },

  // Hospital/Clinic information
  hospital: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Hospital name cannot be more than 100 characters']
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Hospital address cannot be more than 200 characters']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    }
  },

  // Commission and business information
  commissionRate: {
    type: Number,
    default: 0,
    min: [0, 'Commission rate cannot be negative'],
    max: [100, 'Commission rate cannot be more than 100%']
  },
  commissionType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  fixedCommissionAmount: {
    type: Number,
    default: 0,
    min: [0, 'Fixed commission amount cannot be negative']
  },

  // Statistics
  totalPrescriptions: {
    type: Number,
    default: 0
  },
  totalCommissionEarned: {
    type: Number,
    default: 0
  },
  lastPrescriptionDate: {
    type: Date
  },

  // Status and preferences
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Communication preferences
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

  // Additional information
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
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

// Indexes for better performance
doctorSchema.index({ store: 1, name: 1 });
doctorSchema.index({ store: 1, phone: 1 });
doctorSchema.index({ store: 1, specialization: 1 });
doctorSchema.index({ store: 1, status: 1 });

// Virtual for full name with title
doctorSchema.virtual('fullName').get(function() {
  return `Dr. ${this.name}`;
});

// Virtual for commission display
doctorSchema.virtual('commissionDisplay').get(function() {
  if (this.commissionType === 'percentage') {
    return `${this.commissionRate}%`;
  } else {
    return `₹${this.fixedCommissionAmount}`;
  }
});

// Static method to search doctors
doctorSchema.statics.search = function(storeId, query) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    store: storeId,
    status: 'active',
    $or: [
      { name: searchRegex },
      { specialization: searchRegex },
      { 'hospital.name': searchRegex },
      { phone: searchRegex }
    ]
  });
};

// Static method to find by specialization
doctorSchema.statics.findBySpecialization = function(storeId, specialization) {
  return this.find({
    store: storeId,
    specialization: new RegExp(specialization, 'i'),
    status: 'active'
  });
};

// Pre-save middleware
doctorSchema.pre('save', function(next) {
  // Ensure proper data structure
  if (!this.address) {
    this.address = {};
  }
  
  if (!this.hospital) {
    this.hospital = {};
  }
  
  if (!this.communicationPreferences) {
    this.communicationPreferences = {
      sms: true,
      email: false,
      whatsapp: false
    };
  }
  
  next();
});

module.exports = mongoose.model('Doctor', doctorSchema);

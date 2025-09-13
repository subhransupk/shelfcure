const mongoose = require('mongoose');

const medicineRequestSchema = new mongoose.Schema({
  // Store reference
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },

  // Medicine details
  medicineName: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true,
    maxlength: [100, 'Medicine name cannot be more than 100 characters']
  },
  manufacturer: {
    type: String,
    required: [true, 'Manufacturer/brand is required'],
    trim: true,
    maxlength: [100, 'Manufacturer name cannot be more than 100 characters']
  },
  composition: {
    type: String,
    required: [true, 'Composition/generic name is required'],
    trim: true,
    maxlength: [200, 'Composition cannot be more than 200 characters']
  },
  strength: {
    type: String,
    required: [true, 'Strength/dosage is required'],
    trim: true,
    maxlength: [50, 'Strength cannot be more than 50 characters']
  },
  packSize: {
    type: String,
    required: [true, 'Pack size is required'],
    trim: true,
    maxlength: [50, 'Pack size cannot be more than 50 characters']
  },

  // Supplier information
  supplierInfo: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Supplier name cannot be more than 100 characters']
    },
    contactPerson: {
      type: String,
      trim: true,
      maxlength: [100, 'Contact person name cannot be more than 100 characters']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9+\-\s()]{10,15}$/, 'Please enter a valid phone number']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Please enter a valid email address'
      }
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, 'Address cannot be more than 500 characters']
    }
  },

  // Request details
  requestedQuantity: {
    type: Number,
    required: [true, 'Requested quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unitType: {
    type: String,
    enum: ['strip', 'box', 'bottle', 'piece', 'vial', 'tube', 'packet'],
    default: 'strip'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Additional information
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  category: {
    type: String,
    enum: [
      'Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Cream', 'Ointment',
      'Powder', 'Inhaler', 'Spray', 'Gel', 'Lotion', 'Solution', 'Suspension',
      'Patch', 'Suppository', 'Other'
    ],
    default: 'Other'
  },

  // Request status
  status: {
    type: String,
    enum: ['pending', 'approved', 'ordered', 'received', 'cancelled', 'rejected'],
    default: 'pending'
  },

  // Tracking information
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  
  // Purchase order reference (when converted to purchase)
  purchaseOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase'
  },
  convertedToPurchaseAt: Date,

  // Customer information (if requested by customer)
  customerInfo: {
    name: String,
    phone: String,
    requestDate: Date
  },

  // Source of request
  requestSource: {
    type: String,
    enum: ['store_manager', 'customer_request', 'low_stock', 'manual'],
    default: 'store_manager'
  },

  // Estimated cost (optional)
  estimatedCost: {
    type: Number,
    min: 0
  },

  // Urgency reason
  urgencyReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Urgency reason cannot be more than 200 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
medicineRequestSchema.index({ store: 1, status: 1 });
medicineRequestSchema.index({ store: 1, createdAt: -1 });
medicineRequestSchema.index({ requestedBy: 1 });
medicineRequestSchema.index({ medicineName: 'text', manufacturer: 'text', composition: 'text' });

// Virtual for request age in days
medicineRequestSchema.virtual('requestAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for full medicine description
medicineRequestSchema.virtual('fullDescription').get(function() {
  return `${this.medicineName} (${this.strength}) - ${this.manufacturer}`;
});

// Pre-save middleware to set approval date
medicineRequestSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'approved' && !this.approvedAt) {
    this.approvedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('MedicineRequest', medicineRequestSchema);

const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add medicine name'],
    trim: true,
    maxlength: [100, 'Medicine name cannot be more than 100 characters']
  },
  genericName: {
    type: String,
    trim: true,
    maxlength: [100, 'Generic name cannot be more than 100 characters']
  },
  composition: {
    type: String,
    required: [true, 'Please add medicine composition'],
    trim: true
  },
  manufacturer: {
    type: String,
    required: [true, 'Please add manufacturer name'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please add medicine category'],
    enum: [
      'Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Cream', 'Ointment',
      'Powder', 'Inhaler', 'Spray', 'Gel', 'Lotion', 'Solution', 'Suspension',
      'Patch', 'Suppository', 'Other'
    ]
  },
  type: {
    type: String,
    enum: ['prescription', 'over-the-counter', 'controlled'],
    default: 'over-the-counter'
  },
  
  // Dual Unit System Configuration
  unitTypes: {
    hasStrips: {
      type: Boolean,
      default: true
    },
    hasIndividual: {
      type: Boolean,
      default: true
    },
    unitsPerStrip: {
      type: Number,
      default: 10,
      min: [1, 'Units per strip must be at least 1']
    }
  },
  
  // Strip-based pricing and inventory
  stripInfo: {
    purchasePrice: {
      type: Number,
      default: 0,
      min: [0, 'Purchase price cannot be negative']
    },
    sellingPrice: {
      type: Number,
      default: 0,
      min: [0, 'Selling price cannot be negative']
    },
    mrp: {
      type: Number,
      default: 0,
      min: [0, 'MRP cannot be negative']
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative']
    },
    minStock: {
      type: Number,
      default: 5,
      min: [0, 'Minimum stock cannot be negative']
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: [0, 'Reorder level cannot be negative']
    }
  },
  
  // Individual unit pricing and inventory
  individualInfo: {
    purchasePrice: {
      type: Number,
      default: 0,
      min: [0, 'Purchase price cannot be negative']
    },
    sellingPrice: {
      type: Number,
      default: 0,
      min: [0, 'Selling price cannot be negative']
    },
    mrp: {
      type: Number,
      default: 0,
      min: [0, 'MRP cannot be negative']
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative']
    },
    minStock: {
      type: Number,
      default: 50,
      min: [0, 'Minimum stock cannot be negative']
    },
    reorderLevel: {
      type: Number,
      default: 100,
      min: [0, 'Reorder level cannot be negative']
    }
  },
  
  // Legacy fields for backward compatibility
  purchasePrice: {
    type: Number,
    default: 0
  },
  sellingPrice: {
    type: Number,
    default: 0
  },
  mrp: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    default: 0
  },
  minStock: {
    type: Number,
    default: 5
  },
  
  // Medicine details
  batchNumber: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: Date
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  
  // Storage and location
  storageLocation: {
    rack: String,
    shelf: String,
    position: String
  },
  storageConditions: {
    temperature: {
      min: Number,
      max: Number,
      unit: {
        type: String,
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      }
    },
    humidity: {
      min: Number,
      max: Number
    },
    specialConditions: [String]
  },
  
  // Medicine information
  dosage: {
    strength: String,
    form: String,
    frequency: String
  },
  sideEffects: [String],
  contraindications: [String],
  interactions: [String],
  
  // Business information
  supplier: {
    type: mongoose.Schema.ObjectId,
    ref: 'Supplier'
  },
  store: {
    type: mongoose.Schema.ObjectId,
    ref: 'Store',
    required: true
  },
  
  // Status and flags
  isActive: {
    type: Boolean,
    default: true
  },
  isExpired: {
    type: Boolean,
    default: false
  },
  requiresPrescription: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  tags: [String],
  notes: String,
  
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

// Virtuals for calculated fields
medicineSchema.virtual('totalStock').get(function() {
  let total = 0;
  if (this.unitTypes.hasStrips) {
    total += (this.stripInfo.stock || 0) * (this.unitTypes.unitsPerStrip || 1);
  }
  if (this.unitTypes.hasIndividual) {
    total += this.individualInfo.stock || 0;
  }
  return total;
});

medicineSchema.virtual('totalValue').get(function() {
  let value = 0;
  if (this.unitTypes.hasStrips) {
    value += (this.stripInfo.stock || 0) * (this.stripInfo.purchasePrice || 0);
  }
  if (this.unitTypes.hasIndividual) {
    value += (this.individualInfo.stock || 0) * (this.individualInfo.purchasePrice || 0);
  }
  return value;
});

medicineSchema.virtual('isLowStock').get(function() {
  let lowStock = false;
  if (this.unitTypes.hasStrips) {
    lowStock = lowStock || (this.stripInfo.stock <= this.stripInfo.minStock);
  }
  if (this.unitTypes.hasIndividual) {
    lowStock = lowStock || (this.individualInfo.stock <= this.individualInfo.minStock);
  }
  return lowStock;
});

medicineSchema.virtual('daysToExpiry').get(function() {
  if (!this.expiryDate) return null;
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Indexes for performance
medicineSchema.index({ name: 'text', genericName: 'text', composition: 'text' });
medicineSchema.index({ store: 1, isActive: 1 });
medicineSchema.index({ barcode: 1 });
medicineSchema.index({ category: 1 });
medicineSchema.index({ expiryDate: 1 });
medicineSchema.index({ 'stripInfo.stock': 1 });
medicineSchema.index({ 'individualInfo.stock': 1 });

// Pre-save middleware to sync legacy fields
medicineSchema.pre('save', function(next) {
  // Sync legacy fields with dual unit data
  if (this.unitTypes.hasStrips && this.stripInfo.sellingPrice > 0) {
    this.sellingPrice = this.stripInfo.sellingPrice;
    this.purchasePrice = this.stripInfo.purchasePrice;
    this.mrp = this.stripInfo.mrp;
    this.stock = this.stripInfo.stock;
    this.minStock = this.stripInfo.minStock;
  } else if (this.unitTypes.hasIndividual && this.individualInfo.sellingPrice > 0) {
    this.sellingPrice = this.individualInfo.sellingPrice;
    this.purchasePrice = this.individualInfo.purchasePrice;
    this.mrp = this.individualInfo.mrp;
    this.stock = this.individualInfo.stock;
    this.minStock = this.individualInfo.minStock;
  }
  
  // Check if medicine is expired
  if (this.expiryDate && this.expiryDate < new Date()) {
    this.isExpired = true;
  }
  
  next();
});

// Static method to find medicines with low stock
medicineSchema.statics.findLowStock = function(storeId) {
  return this.find({
    store: storeId,
    isActive: true,
    $or: [
      { 'stripInfo.stock': { $lte: this.stripInfo?.minStock || 0 } },
      { 'individualInfo.stock': { $lte: this.individualInfo?.minStock || 0 } }
    ]
  });
};

// Static method to find expiring medicines
medicineSchema.statics.findExpiring = function(storeId, days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    store: storeId,
    isActive: true,
    expiryDate: {
      $gte: new Date(),
      $lte: futureDate
    }
  });
};

module.exports = mongoose.model('Medicine', medicineSchema);

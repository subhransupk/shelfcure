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
  
  // Storage and location (legacy - kept for backward compatibility)
  storageLocation: {
    rack: String,
    shelf: String,
    position: String
  },

  // New rack locations system - supports multiple locations per medicine
  rackLocations: [{
    rack: {
      type: mongoose.Schema.ObjectId,
      ref: 'Rack',
      required: true
    },
    shelf: {
      type: String,
      required: true
    },
    position: {
      type: String,
      required: true
    },
    // Quantity stored at this specific location
    stripQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Strip quantity cannot be negative']
    },
    individualQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Individual quantity cannot be negative']
    },
    // Location metadata
    assignedDate: {
      type: Date,
      default: Date.now
    },
    assignedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    notes: String,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
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
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId (ref to Supplier) or String (for custom medicines)
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
  addedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  
  // Custom medicine flag
  isCustom: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals for calculated fields
medicineSchema.virtual('totalStock').get(function() {
  // Corrected: Don't convert strips to individual units
  // Individual stock represents only cut medicines, not convertible units
  return {
    strips: this.unitTypes?.hasStrips ? (this.stripInfo.stock || 0) : 0,
    individual: this.unitTypes?.hasIndividual ? (this.individualInfo.stock || 0) : 0
  };
});

// Virtual for total rack locations stock
medicineSchema.virtual('totalRackStock').get(function() {
  if (!this.rackLocations || this.rackLocations.length === 0) return { strips: 0, individual: 0 };

  return this.rackLocations.reduce((total, location) => {
    if (location.isActive) {
      total.strips += location.stripQuantity || 0;
      total.individual += location.individualQuantity || 0;
    }
    return total;
  }, { strips: 0, individual: 0 });
});

// Virtual for primary rack location
medicineSchema.virtual('primaryRackLocation').get(function() {
  if (!this.rackLocations || this.rackLocations.length === 0) return null;
  return this.rackLocations.find(location =>
    location.isActive && location.priority === 'primary'
  ) || this.rackLocations.find(location => location.isActive);
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
  // Use standardized low stock calculation logic
  const LowStockService = require('../services/lowStockService');
  return LowStockService.isLowStock(this);
});

// Virtual to check if medicine supports cutting (strip to individual conversion)
medicineSchema.virtual('supportsCutting').get(function() {
  // Cut Medicine functionality should only be available for medicines that have BOTH strips AND individual units
  // If a medicine only has individual units (hasStrips: false), it's a single-piece medicine (bottles, injections) - no cutting allowed
  return this.unitTypes?.hasStrips === true && this.unitTypes?.hasIndividual === true;
});

medicineSchema.virtual('daysToExpiry').get(function() {
  if (!this.expiryDate) return null;
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual fields for backward compatibility with frontend
medicineSchema.virtual('inventory').get(function() {
  return {
    stripQuantity: this.stripInfo?.stock || 0,
    individualQuantity: this.individualInfo?.stock || 0,
    stripMinimumStock: this.stripInfo?.minStock || 0,
    individualMinimumStock: this.individualInfo?.minStock || 0
  };
});

medicineSchema.virtual('pricing').get(function() {
  return {
    stripSellingPrice: this.stripInfo?.sellingPrice || 0,
    individualSellingPrice: this.individualInfo?.sellingPrice || 0,
    stripPurchasePrice: this.stripInfo?.purchasePrice || 0,
    individualPurchasePrice: this.individualInfo?.purchasePrice || 0,
    stripMrp: this.stripInfo?.mrp || 0,
    individualMrp: this.individualInfo?.mrp || 0
  };
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

// Pre-find middleware to update expired status for medicines being queried
medicineSchema.pre(['find', 'findOne', 'findOneAndUpdate'], async function() {
  // Only run this for queries that might return expired medicines
  if (this.getQuery().isExpired !== false) {
    try {
      // Update expired status for medicines that should be expired but aren't marked as such
      await this.model.updateMany(
        {
          expiryDate: { $lt: new Date() },
          isExpired: false
        },
        {
          $set: { isExpired: true }
        }
      );
    } catch (error) {
      console.error('Error updating expired medicine status in pre-find middleware:', error);
      // Don't fail the query if this update fails
    }
  }
});

// Static method to find medicines with low stock
medicineSchema.statics.findLowStock = function(storeId, options = {}) {
  const LowStockService = require('../services/lowStockService');
  return LowStockService.findLowStockMedicines(storeId, options);
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

// Static method to search medicines by rack location
medicineSchema.statics.findByRackLocation = function(storeId, rackId, shelf, position) {
  return this.find({
    store: storeId,
    isActive: true,
    'rackLocations.rack': rackId,
    'rackLocations.shelf': shelf,
    'rackLocations.position': position,
    'rackLocations.isActive': true
  }).populate('rackLocations.rack', 'rackNumber name');
};

// Static method to find medicines without rack locations
medicineSchema.statics.findWithoutRackLocation = function(storeId) {
  return this.find({
    store: storeId,
    isActive: true,
    $or: [
      { rackLocations: { $size: 0 } },
      { rackLocations: { $exists: false } },
      { 'rackLocations.isActive': { $ne: true } }
    ]
  });
};

// Static method to check if medicine has available non-expired batches
medicineSchema.statics.hasAvailableBatches = async function(medicineId, storeId) {
  const Batch = require('./Batch');

  const availableBatches = await Batch.countDocuments({
    medicine: medicineId,
    store: storeId,
    isActive: true,
    isExpired: false,
    $or: [
      { stripQuantity: { $gt: 0 } },
      { individualQuantity: { $gt: 0 } }
    ]
  });

  return availableBatches > 0;
};

// Static method to get medicines with available stock (batch-aware)
medicineSchema.statics.findAvailableForSale = async function(storeId, searchQuery = {}) {
  const Batch = require('./Batch');

  // First, find medicines that match the search criteria
  const baseQuery = {
    store: storeId,
    isActive: true,
    ...searchQuery
  };

  const medicines = await this.find(baseQuery);

  // Filter medicines that have available non-expired batches OR no batch system (legacy)
  const availableMedicines = [];

  for (const medicine of medicines) {
    // Check if medicine uses batch system
    const batchCount = await Batch.countDocuments({
      medicine: medicine._id,
      store: storeId
    });

    if (batchCount > 0) {
      // Medicine uses batch system - check for available non-expired batches
      const hasAvailableBatches = await this.hasAvailableBatches(medicine._id, storeId);
      if (hasAvailableBatches) {
        availableMedicines.push(medicine);
      }
    } else {
      // Legacy medicine without batch system - use medicine-level expiry check
      const isNotExpired = !medicine.expiryDate || new Date(medicine.expiryDate) >= new Date();
      if (isNotExpired) {
        availableMedicines.push(medicine);
      }
    }
  }

  return availableMedicines;
};

// Static method to search medicines with rack location info (batch-aware)
medicineSchema.statics.searchWithLocations = async function(storeId, query) {
  const searchRegex = new RegExp(query, 'i');
  const searchQuery = {
    $or: [
      { name: searchRegex },
      { genericName: searchRegex },
      { manufacturer: searchRegex },
      { composition: searchRegex },
      { barcode: searchRegex }
    ]
  };

  const availableMedicines = await this.findAvailableForSale(storeId, searchQuery);

  // Populate rack locations for the available medicines
  return await this.populate(availableMedicines, {
    path: 'rackLocations.rack',
    select: 'rackNumber name category'
  });
};

// Static method to check if a medicine category supports strip cutting
medicineSchema.statics.categorySupportsStripCutting = function(category) {
  // Categories that can be cut from strips into individual units
  const stripCuttableCategories = [
    'Tablet',
    'Capsule',
    'Patch'
  ];

  return stripCuttableCategories.includes(category);
};

// Instance method to check if this medicine supports strip cutting
medicineSchema.methods.supportsStripCutting = function() {
  return this.constructor.categorySupportsStripCutting(this.category);
};

// Virtual to determine if individual units should be allowed
medicineSchema.virtual('shouldAllowIndividualUnits').get(function() {
  return this.supportsStripCutting();
});

module.exports = mongoose.model('Medicine', medicineSchema);

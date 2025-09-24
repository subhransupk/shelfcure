const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
  // Medicine reference
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  
  // Store reference
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  
  // Type of inventory change
  changeType: {
    type: String,
    enum: [
      'purchase',
      'sale',
      'purchase_return',
      'sales_return',
      'adjustment',
      'transfer',
      'expiry',
      'damage',
      'theft',
      'manual_correction'
    ],
    required: true
  },
  
  // Unit type affected
  unitType: {
    type: String,
    enum: ['strip', 'individual'],
    required: true
  },
  
  // Quantity change (positive for increase, negative for decrease)
  quantityChanged: {
    type: Number,
    required: true
  },
  
  // Stock levels
  previousStock: {
    type: Number,
    required: true,
    min: 0
  },
  
  newStock: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Reference to the source document
  reference: {
    type: {
      type: String,
      enum: ['Sale', 'Purchase', 'Return', 'PurchaseReturn', 'Adjustment', 'Transfer'],
      required: true
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    // Additional reference data
    saleNumber: String,
    purchaseOrderNumber: String,
    returnNumber: String,
    adjustmentNumber: String,
    transferNumber: String
  },
  
  // Batch information if applicable
  batch: {
    batchNumber: String,
    expiryDate: Date
  },
  
  // User who performed the action
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Additional notes
  notes: {
    type: String,
    maxlength: 500
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  // Metadata
  metadata: {
    // IP address of the user
    ipAddress: String,
    
    // User agent
    userAgent: String,
    
    // System information
    systemInfo: {
      version: String,
      environment: String
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
inventoryLogSchema.index({ medicine: 1, timestamp: -1 });
inventoryLogSchema.index({ store: 1, timestamp: -1 });
inventoryLogSchema.index({ changeType: 1, timestamp: -1 });
inventoryLogSchema.index({ performedBy: 1, timestamp: -1 });
inventoryLogSchema.index({ 'reference.type': 1, 'reference.id': 1 });

// Compound indexes
inventoryLogSchema.index({ medicine: 1, store: 1, timestamp: -1 });
inventoryLogSchema.index({ store: 1, changeType: 1, timestamp: -1 });

// Virtual for formatted change description
inventoryLogSchema.virtual('changeDescription').get(function() {
  const action = this.quantityChanged > 0 ? 'Added' : 'Removed';
  const quantity = Math.abs(this.quantityChanged);
  return `${action} ${quantity} ${this.unitType}${quantity !== 1 ? 's' : ''}`;
});

// Virtual for stock change summary
inventoryLogSchema.virtual('stockChangeSummary').get(function() {
  return `${this.previousStock} → ${this.newStock} ${this.unitType}s`;
});

// Static method to get inventory history for a medicine
inventoryLogSchema.statics.getMedicineHistory = function(medicineId, options = {}) {
  const {
    startDate,
    endDate,
    changeType,
    unitType,
    limit = 50,
    skip = 0
  } = options;

  let query = { medicine: medicineId };

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  if (changeType) query.changeType = changeType;
  if (unitType) query.unitType = unitType;

  return this.find(query)
    .populate('medicine', 'name genericName manufacturer')
    .populate('store', 'name')
    .populate('performedBy', 'name email')
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get store inventory summary
inventoryLogSchema.statics.getStoreSummary = function(storeId, options = {}) {
  const {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    endDate = new Date()
  } = options;

  return this.aggregate([
    {
      $match: {
        store: mongoose.Types.ObjectId(storeId),
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          changeType: '$changeType',
          unitType: '$unitType'
        },
        totalChanges: { $sum: 1 },
        totalQuantityChanged: { $sum: '$quantityChanged' },
        avgQuantityChanged: { $avg: '$quantityChanged' }
      }
    },
    {
      $sort: { '_id.changeType': 1, '_id.unitType': 1 }
    }
  ]);
};

// Pre-save middleware for validation
inventoryLogSchema.pre('save', function(next) {
  // Ensure stock levels are consistent
  if (this.newStock !== this.previousStock + this.quantityChanged) {
    console.warn('⚠️ Stock calculation mismatch detected:', {
      previous: this.previousStock,
      change: this.quantityChanged,
      expected: this.previousStock + this.quantityChanged,
      actual: this.newStock
    });
  }
  
  next();
});

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);

const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
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
  
  // Batch identification
  batchNumber: {
    type: String,
    required: true,
    trim: true
  },
  
  // Dates
  manufacturingDate: {
    type: Date,
    required: true
  },
  
  expiryDate: {
    type: Date,
    required: true
  },
  
  // Inventory quantities
  stripQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  
  individualQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Storage information
  storageLocation: {
    type: String,
    trim: true
  },
  
  // Supplier information
  supplier: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId (ref to Supplier) or String
    ref: 'Supplier'
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isExpired: {
    type: Boolean,
    default: false
  },
  
  // Tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Notes
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
batchSchema.index({ medicine: 1, store: 1 });
batchSchema.index({ store: 1, expiryDate: 1 });
batchSchema.index({ batchNumber: 1, store: 1 });
batchSchema.index({ isExpired: 1, store: 1 });

// Compound unique index to prevent duplicate batch numbers for same medicine in same store
batchSchema.index({ medicine: 1, batchNumber: 1, store: 1 }, { unique: true });

// Pre-save middleware to check if batch is expired
batchSchema.pre('save', function(next) {
  if (this.expiryDate && this.expiryDate < new Date()) {
    this.isExpired = true;
  }
  next();
});

// Virtual for calculating total stock
batchSchema.virtual('totalStock').get(function() {
  return this.stripQuantity + this.individualQuantity;
});

// Virtual for days until expiry
batchSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const today = new Date();
  const diffTime = this.expiryDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Static method to find expiring batches
batchSchema.statics.findExpiringBatches = function(storeId, daysAhead = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return this.find({
    store: storeId,
    expiryDate: { $lte: futureDate },
    isActive: true,
    $or: [
      { stripQuantity: { $gt: 0 } },
      { individualQuantity: { $gt: 0 } }
    ]
  }).populate('medicine', 'name genericName manufacturer');
};

// Static method to find expired batches
batchSchema.statics.findExpiredBatches = function(storeId) {
  return this.find({
    store: storeId,
    expiryDate: { $lt: new Date() },
    isActive: true,
    $or: [
      { stripQuantity: { $gt: 0 } },
      { individualQuantity: { $gt: 0 } }
    ]
  }).populate('medicine', 'name genericName manufacturer');
};

module.exports = mongoose.model('Batch', batchSchema);

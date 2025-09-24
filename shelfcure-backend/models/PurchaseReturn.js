const mongoose = require('mongoose');

const purchaseReturnSchema = new mongoose.Schema({
  // Store reference
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },

  // Original purchase reference
  originalPurchase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase',
    required: true
  },

  // Return identification
  returnNumber: {
    type: String,
    unique: true,
    // Don't require initially - will be set by pre-save middleware
    required: false
  },

  // Supplier reference (from original purchase)
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },

  // Return items - supports both strips and individual units based on original purchase
  items: [{
    // Reference to original purchase item
    originalPurchaseItem: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    
    // Medicine reference (optional for customer requested items)
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: function() {
        // Medicine is required unless this is a customer requested item
        return !this.isCustomerRequested;
      }
    },

    // Medicine details for customer requested items
    medicineName: {
      type: String,
      trim: true
    },
    manufacturer: {
      type: String,
      trim: true
    },
    genericName: {
      type: String,
      trim: true
    },

    // Customer request tracking
    isCustomerRequested: {
      type: Boolean,
      default: false
    },
    
    // Return quantity (always in strips/units)
    returnQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    
    // Unit type (matches original purchase unit type)
    unitType: {
      type: String,
      enum: ['strip', 'individual'],
      required: true
    },
    
    // Original purchase quantity for reference
    originalQuantity: {
      type: Number,
      required: true
    },
    
    // Return amount calculation (using purchase price)
    returnAmount: {
      type: Number,
      required: true,
      min: 0
    },
    
    // Original unit cost from purchase
    originalUnitCost: {
      type: Number,
      required: true,
      min: 0
    },
    
    // Return reason for this specific item
    itemReturnReason: {
      type: String,
      enum: [
        'damaged_goods',
        'wrong_item',
        'expired',
        'quality_issue',
        'overstock',
        'supplier_error',
        'other'
      ],
      default: 'damaged_goods'
    },
    
    // Whether to remove from inventory
    removeFromInventory: {
      type: Boolean,
      default: true
    },
    
    // Batch information if applicable
    batch: {
      batchNumber: String,
      expiryDate: Date
    },

    // Inventory update tracking
    inventoryUpdated: {
      type: Boolean,
      default: false
    },

    inventoryUpdateDetails: {
      updatedAt: Date,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      unitType: String,
      quantityChanged: Number, // Can be positive (added) or negative (reduced)
      quantityReduced: Number, // Legacy field - kept for backward compatibility
      quantityAdded: Number, // New field for when inventory is increased
      previousStock: Number,
      newStock: Number
    }
  }],

  // Return totals
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  
  totalReturnAmount: {
    type: Number,
    required: true,
    min: 0
  },

  // Return reason and details
  returnReason: {
    type: String,
    enum: [
      'damaged_goods',
      'wrong_delivery',
      'quality_issues',
      'expired_products',
      'overstock',
      'supplier_error',
      'other'
    ],
    required: true
  },
  
  returnReasonDetails: {
    type: String,
    maxlength: 500
  },

  // Return status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processed', 'completed'],
    default: 'pending'
  },

  // Approval workflow
  requiresApproval: {
    type: Boolean,
    default: false
  },
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  approvalDate: Date,
  
  approvalNotes: {
    type: String,
    maxlength: 500
  },

  // Processing details
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  processedDate: Date,

  // Refund information
  refundMethod: {
    type: String,
    enum: ['credit_note', 'bank_transfer', 'cash', 'adjustment', 'replacement'],
    default: 'credit_note'
  },
  
  refundStatus: {
    type: String,
    enum: ['pending', 'processed', 'completed', 'failed'],
    default: 'pending'
  },
  
  refundDate: Date,
  
  refundReference: {
    type: String,
    trim: true
  },

  // Inventory restoration status
  inventoryRestorationStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed', 'failed', 'skipped'],
    default: 'pending'
  },

  // Additional notes
  notes: {
    type: String,
    maxlength: 1000
  },

  // Audit trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Metadata
  returnDate: {
    type: Date,
    default: Date.now
  },
  
  fiscalYear: String,
  quarter: String,
  month: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
purchaseReturnSchema.index({ store: 1, returnDate: -1 });
purchaseReturnSchema.index({ originalPurchase: 1 });
purchaseReturnSchema.index({ supplier: 1, returnDate: -1 });
purchaseReturnSchema.index({ returnNumber: 1 });
purchaseReturnSchema.index({ status: 1 });
purchaseReturnSchema.index({ processedBy: 1 });
purchaseReturnSchema.index({ returnDate: 1 });

// Virtual for total items count
purchaseReturnSchema.virtual('totalItems').get(function() {
  return this.items && Array.isArray(this.items) ? this.items.reduce((total, item) => total + item.returnQuantity, 0) : 0;
});

// Virtual for return age in days
purchaseReturnSchema.virtual('returnAge').get(function() {
  return Math.floor((Date.now() - this.returnDate) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to generate return number
purchaseReturnSchema.pre('save', async function(next) {
  if (this.isNew && !this.returnNumber) {
    try {
      const store = this.store;
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');

      // Find the last return number for this store in current month
      const lastReturn = await this.constructor.findOne({
        store: store,
        returnNumber: { $regex: `^PR-${year}${month}-` }
      }).sort({ returnNumber: -1 });

      let sequence = 1;
      if (lastReturn && lastReturn.returnNumber) {
        const lastSequence = parseInt(lastReturn.returnNumber.split('-')[2]);
        sequence = lastSequence + 1;
      }

      this.returnNumber = `PR-${year}${month}-${String(sequence).padStart(4, '0')}`;

      // Set fiscal information
      this.fiscalYear = `${year}-${year + 1}`;
      this.quarter = `Q${Math.ceil((today.getMonth() + 1) / 3)}`;
      this.month = today.toLocaleString('default', { month: 'long' });

    } catch (error) {
      console.error('Error generating return number:', error);
      return next(error);
    }
  }
  next();
});

// Static method to validate purchase return eligibility
purchaseReturnSchema.statics.validatePurchaseReturnEligibility = async function(purchaseId, items) {
  const Purchase = mongoose.model('Purchase');
  const originalPurchase = await Purchase.findById(purchaseId).populate({
    path: 'items.medicine',
    select: 'name genericName manufacturer category'
  });

  if (!originalPurchase) {
    throw new Error('Original purchase not found');
  }

  console.log('🔍 Validating purchase return eligibility:', {
    purchaseId,
    itemsCount: originalPurchase.items.length,
    itemsWithMedicine: originalPurchase.items.filter(item => item.medicine).length,
    itemsWithoutMedicine: originalPurchase.items.filter(item => !item.medicine).length
  });

  if (originalPurchase.status === 'cancelled') {
    throw new Error('Cannot return items from cancelled purchase');
  }

  // Check if purchase is in a returnable status
  const returnableStatuses = ['received', 'completed'];
  if (!returnableStatuses.includes(originalPurchase.status)) {
    throw new Error('Purchase must be received or completed to process returns');
  }

  // Check for existing returns to prevent over-returning
  const existingReturns = await this.find({ originalPurchase: purchaseId });
  const returnedQuantities = {};

  // Calculate already returned quantities per item
  existingReturns.forEach(returnRecord => {
    returnRecord.items.forEach(item => {
      const key = item.originalPurchaseItem.toString();
      if (!returnedQuantities[key]) {
        returnedQuantities[key] = 0;
      }
      returnedQuantities[key] += item.returnQuantity;
    });
  });

  // Validate each return item
  for (const returnItem of items) {
    const originalItem = originalPurchase.items.find(purchaseItem =>
      purchaseItem._id.toString() === returnItem.originalPurchaseItem
    );

    if (!originalItem) {
      throw new Error(`Original purchase item not found: ${returnItem.originalPurchaseItem}`);
    }

    // Check if trying to return more than originally purchased
    const itemKey = returnItem.originalPurchaseItem;
    const alreadyReturned = returnedQuantities[itemKey] || 0;
    const totalReturnQuantity = alreadyReturned + returnItem.returnQuantity;

    if (totalReturnQuantity > originalItem.quantity) {
      throw new Error(`Cannot return ${returnItem.returnQuantity} units. Only ${originalItem.quantity - alreadyReturned} units available for return.`);
    }

    if (returnItem.returnQuantity <= 0) {
      throw new Error('Return quantity must be greater than 0');
    }
  }

  return { originalPurchase, returnedQuantities };
};

// Static method to get available items for return from a purchase
purchaseReturnSchema.statics.getAvailableItemsForReturn = async function(purchaseId) {
  const Purchase = mongoose.model('Purchase');
  const originalPurchase = await Purchase.findById(purchaseId).populate({
    path: 'items.medicine',
    select: 'name genericName manufacturer category'
  });

  if (!originalPurchase) {
    throw new Error('Original purchase not found');
  }

  if (originalPurchase.status === 'cancelled') {
    return { originalPurchase, availableItems: [] };
  }

  // Get all existing returns for this purchase
  const existingReturns = await this.find({ originalPurchase: purchaseId });
  const returnedQuantities = {};

  // Calculate already returned quantities per item
  existingReturns.forEach(returnRecord => {
    returnRecord.items.forEach(item => {
      const key = item.originalPurchaseItem.toString();
      if (!returnedQuantities[key]) {
        returnedQuantities[key] = 0;
      }
      returnedQuantities[key] += item.returnQuantity;
    });
  });

  // Filter items that still have quantity available for return
  const availableItems = originalPurchase.items.filter(purchaseItem => {
    const itemKey = purchaseItem._id.toString();
    const alreadyReturned = returnedQuantities[itemKey] || 0;
    return purchaseItem.quantity > alreadyReturned;
  }).map(purchaseItem => {
    const itemKey = purchaseItem._id.toString();
    const alreadyReturned = returnedQuantities[itemKey] || 0;
    const availableQuantity = purchaseItem.quantity - alreadyReturned;

    return {
      ...purchaseItem.toObject(),
      availableQuantity,
      alreadyReturned
    };
  });

  return { originalPurchase, availableItems };
};

// Instance method to calculate return amounts
purchaseReturnSchema.methods.calculateReturnAmounts = function() {
  let subtotal = 0;

  this.items.forEach(item => {
    subtotal += item.returnAmount;
  });

  this.subtotal = subtotal;
  this.totalReturnAmount = subtotal;

  return {
    subtotal: this.subtotal,
    totalReturnAmount: this.totalReturnAmount
  };
};

module.exports = mongoose.model('PurchaseReturn', purchaseReturnSchema);

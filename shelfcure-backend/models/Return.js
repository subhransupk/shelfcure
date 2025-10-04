const mongoose = require('mongoose');
const returnConfig = require('../config/returnConfig');

const returnSchema = new mongoose.Schema({
  // Store reference
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },

  // Original sale reference
  originalSale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    required: true
  },

  // Return identification
  returnNumber: {
    type: String,
    unique: true,
    // Don't require initially - will be set by pre-save middleware
    required: false
  },

  // Customer reference (from original sale)
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },

  // Return items with dual unit system support
  items: [{
    // Reference to original sale item
    originalSaleItem: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    
    // Medicine reference
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true
    },
    
    // Return quantity details
    returnQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    
    // Unit type for this return (strip or individual)
    unitType: {
      type: String,
      enum: ['strip', 'individual'],
      required: true
    },
    
    // Original sale quantity for reference
    originalQuantity: {
      type: Number,
      required: true
    },
    
    // Original unit type from sale
    originalUnitType: {
      type: String,
      enum: ['strip', 'individual'],
      required: true
    },
    
    // Pricing information (from original sale)
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    
    // Total return amount for this item
    returnAmount: {
      type: Number,
      required: true,
      min: 0
    },
    
    // Batch information for tracking
    batch: {
      batchNumber: String,
      expiryDate: Date,
      manufacturingDate: Date
    },
    
    // Return reason for this specific item
    itemReturnReason: {
      type: String,
      enum: [
        'defective',
        'expired',
        'wrong_medicine',
        'customer_request',
        'doctor_change',
        'side_effects',
        'duplicate_purchase',
        'other'
      ],
      default: 'customer_request'
    },
    
    // Inventory restoration for this item
    restoreToInventory: {
      type: Boolean,
      default: true
    },
    
    // Inventory restoration status
    inventoryRestored: {
      type: Boolean,
      default: false
    },
    
    // Restoration details (for audit trail)
    restorationDetails: {
      restoredAt: Date,
      restoredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      stripQuantityRestored: {
        type: Number,
        default: 0
      },
      individualQuantityRestored: {
        type: Number,
        default: 0
      },
      conversionApplied: {
        type: Boolean,
        default: false
      },
      conversionDetails: {
        originalUnit: String,
        convertedUnit: String,
        conversionRatio: Number,
        unitsPerStrip: Number
      }
    },

    // Inventory reversal tracking (when return is rejected)
    inventoryReversed: {
      type: Boolean,
      default: false
    },

    // Reversal details (for audit trail)
    reversalDetails: {
      reversedAt: Date,
      reversedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      stripQuantityReversed: {
        type: Number,
        default: 0
      },
      individualQuantityReversed: {
        type: Number,
        default: 0
      },
      reason: {
        type: String,
        default: 'Return rejected'
      }
    }
  }],

  // Return financial details
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Tax adjustments (proportional to returned items)
  taxAdjustment: {
    type: Number,
    default: 0
  },
  
  // Discount adjustments (proportional to returned items)
  discountAdjustment: {
    type: Number,
    default: 0
  },
  
  // Total return amount
  totalReturnAmount: {
    type: Number,
    required: true,
    min: 0
  },

  // Return processing details
  returnReason: {
    type: String,
    enum: [
      'defective_product',
      'expired_medicine',
      'wrong_medicine_dispensed',
      'customer_dissatisfaction',
      'doctor_prescription_change',
      'adverse_reaction',
      'duplicate_purchase',
      'billing_error',
      'quality_issue',
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
    enum: ['pending', 'approved', 'processed', 'completed', 'rejected', 'cancelled'],
    default: 'pending'
  },

  // Approval workflow
  approvalRequired: {
    type: Boolean,
    default: false
  },
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  approvedAt: Date,
  
  rejectionReason: {
    type: String,
    maxlength: 500
  },

  // Processing details
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  processedAt: {
    type: Date,
    default: Date.now
  },

  // Completion details
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  completedAt: Date,

  // Refund details
  refundMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'store_credit', 'exchange'],
    default: 'cash'
  },
  
  refundStatus: {
    type: String,
    enum: ['pending', 'processed', 'completed', 'failed'],
    default: 'pending'
  },
  
  refundProcessedAt: Date,
  
  refundReference: String,

  // Global inventory restoration toggle
  restoreInventory: {
    type: Boolean,
    default: true
  },

  // Inventory restoration status
  inventoryRestorationStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed', 'failed', 'skipped', 'reversed'],
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
returnSchema.index({ store: 1, returnDate: -1 });
returnSchema.index({ originalSale: 1 });
returnSchema.index({ customer: 1, returnDate: -1 });
returnSchema.index({ returnNumber: 1 });
returnSchema.index({ status: 1 });
returnSchema.index({ processedBy: 1 });
returnSchema.index({ returnDate: 1 });

// Virtual for total items count
returnSchema.virtual('totalItems').get(function() {
  return this.items && Array.isArray(this.items) ? this.items.reduce((total, item) => total + item.returnQuantity, 0) : 0;
});

// Virtual for return age in days
returnSchema.virtual('returnAge').get(function() {
  return Math.floor((Date.now() - this.returnDate) / (1000 * 60 * 60 * 24));
});

// Virtual for pending inventory restoration count
returnSchema.virtual('pendingRestorationCount').get(function() {
  return this.items.filter(item =>
    item.restoreToInventory && !item.inventoryRestored
  ).length;
});

// Pre-save middleware to generate return number
returnSchema.pre('save', async function(next) {
  console.log('🔄 Pre-save middleware triggered. isNew:', this.isNew, 'returnNumber:', this.returnNumber);

  if (this.isNew && !this.returnNumber) {
    try {
      console.log('🔄 Generating return number for store:', this.store);
      const count = await this.constructor.countDocuments({ store: this.store });
      const store = await mongoose.model('Store').findById(this.store).select('name');
      const year = new Date().getFullYear().toString().slice(-2);
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');

      // Use store name instead of storeCode since storeCode doesn't exist
      const storePrefix = store?.name?.substring(0, 3).toUpperCase() || 'STR';
      this.returnNumber = `RET-${storePrefix}-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;

      console.log('✅ Generated return number:', this.returnNumber);
    } catch (error) {
      console.error('❌ Error generating return number:', error);
      // Fallback return number
      const timestamp = Date.now().toString().slice(-6);
      this.returnNumber = `RET-STR-${timestamp}`;
      console.log('🔄 Using fallback return number:', this.returnNumber);
    }
  }

  // Set fiscal year, quarter, and month
  const returnDate = this.returnDate || new Date();
  this.fiscalYear = returnDate.getFullYear().toString();
  this.quarter = `Q${Math.ceil((returnDate.getMonth() + 1) / 3)}`;
  this.month = returnDate.toLocaleString('default', { month: 'long' });

  next();
});

// Post-save middleware to ensure returnNumber is set
returnSchema.post('save', function(doc) {
  if (!doc.returnNumber) {
    console.error('❌ Return saved without returnNumber:', doc._id);
    throw new Error('Return number was not generated properly');
  }
  console.log('✅ Return saved with returnNumber:', doc.returnNumber);
});

// Static method to validate return eligibility
returnSchema.statics.validateReturnEligibility = async function(saleId, items) {
  const Sale = mongoose.model('Sale');
  const originalSale = await Sale.findById(saleId).populate('items.medicine');

  if (!originalSale) {
    throw new Error('Original sale not found');
  }

  if (originalSale.status === 'returned') {
    throw new Error('Sale has already been fully returned');
  }

  // Check if sale is within return window (configurable)
  const returnWindowDays = returnConfig.returnWindowDays;
  const saleAge = Math.floor((Date.now() - originalSale.saleDate) / (1000 * 60 * 60 * 24));

  if (saleAge > returnWindowDays) {
    throw new Error(`Return window of ${returnWindowDays} days has expired`);
  }

  // Check if manager approval is required for old returns
  if (saleAge > returnConfig.managerApprovalAfterDays) {
    console.warn(`Return requires manager approval: sale is ${saleAge} days old`);
  }

  // Check for existing returns to prevent over-returning
  const existingReturns = await this.find({ originalSale: saleId });
  const returnedQuantities = {};

  // Calculate already returned quantities per item
  existingReturns.forEach(returnRecord => {
    returnRecord.items.forEach(item => {
      const key = item.originalSaleItem.toString();
      if (!returnedQuantities[key]) {
        returnedQuantities[key] = { strip: 0, individual: 0 };
      }
      returnedQuantities[key][item.unitType] += item.returnQuantity;
    });
  });

  // Validate each return item
  for (const returnItem of items) {
    const originalItem = originalSale.items.find(item =>
      item._id.toString() === returnItem.originalSaleItem
    );

    if (!originalItem) {
      throw new Error(`Original sale item not found: ${returnItem.originalSaleItem}`);
    }

    // Check if trying to return more than originally sold
    // Need to consider unit type conversions and already returned quantities
    const unitsPerStrip = originalItem.medicine?.unitTypes?.unitsPerStrip || 10;
    const itemKey = returnItem.originalSaleItem;

    let originalQuantityInRequestedUnit;
    let alreadyReturnedInRequestedUnit = 0;

    // Calculate already returned quantity in the requested unit type
    if (returnedQuantities[itemKey]) {
      if (returnItem.unitType === 'strip') {
        alreadyReturnedInRequestedUnit = returnedQuantities[itemKey].strip +
          Math.floor(returnedQuantities[itemKey].individual / unitsPerStrip);
      } else {
        alreadyReturnedInRequestedUnit = returnedQuantities[itemKey].individual +
          (returnedQuantities[itemKey].strip * unitsPerStrip);
      }
    }

    if (originalItem.unitType === returnItem.unitType) {
      // Same unit type - direct comparison
      originalQuantityInRequestedUnit = originalItem.quantity;
    } else if (originalItem.unitType === 'strip' && returnItem.unitType === 'individual') {
      // Original was strips, returning individual units
      originalQuantityInRequestedUnit = originalItem.quantity * unitsPerStrip;
    } else if (originalItem.unitType === 'individual' && returnItem.unitType === 'strip') {
      // Original was individual, returning strips
      originalQuantityInRequestedUnit = Math.floor(originalItem.quantity / unitsPerStrip);
    }

    const availableForReturn = originalQuantityInRequestedUnit - alreadyReturnedInRequestedUnit;

    if (returnItem.returnQuantity > availableForReturn) {
      throw new Error(`Cannot return ${returnItem.returnQuantity} ${returnItem.unitType}(s) of ${originalItem.medicine.name}. Only ${availableForReturn} ${returnItem.unitType}(s) available for return (${alreadyReturnedInRequestedUnit} already returned)`);
    }

    // Additional business rule: Check if medicine is still valid for return
    if (originalItem.medicine?.expiryDate && new Date(originalItem.medicine.expiryDate) < new Date()) {
      console.warn(`Warning: Returning expired medicine ${originalItem.medicine.name}`);
    }
  }

  return { valid: true, originalSale };
};

// Instance method to calculate return amounts
returnSchema.methods.calculateReturnAmounts = function() {
  let subtotal = 0;
  let taxAdjustment = 0;
  let discountAdjustment = 0;

  this.items.forEach(item => {
    subtotal += item.returnAmount;
  });

  // Calculate proportional tax and discount adjustments
  // This would be based on the original sale's tax and discount structure
  // Implementation depends on specific business rules

  this.subtotal = subtotal;
  this.taxAdjustment = taxAdjustment;
  this.discountAdjustment = discountAdjustment;
  this.totalReturnAmount = subtotal + taxAdjustment - discountAdjustment;

  return {
    subtotal: this.subtotal,
    taxAdjustment: this.taxAdjustment,
    discountAdjustment: this.discountAdjustment,
    totalReturnAmount: this.totalReturnAmount
  };
};

// Static method to get available items for return from a sale
returnSchema.statics.getAvailableItemsForReturn = async function(saleId) {
  const Sale = mongoose.model('Sale');
  const originalSale = await Sale.findById(saleId).populate({
    path: 'items.medicine',
    select: 'name genericName manufacturer category unitTypes stripInfo individualInfo pricing'
  });

  if (!originalSale) {
    throw new Error('Original sale not found');
  }

  if (originalSale.status === 'returned') {
    return { originalSale, availableItems: [] };
  }

  // Get all existing returns for this sale
  const existingReturns = await this.find({ originalSale: saleId });
  const returnedQuantities = {};

  // Calculate already returned quantities per item
  existingReturns.forEach(returnRecord => {
    returnRecord.items.forEach(item => {
      const key = item.originalSaleItem.toString();
      if (!returnedQuantities[key]) {
        returnedQuantities[key] = { strip: 0, individual: 0 };
      }
      returnedQuantities[key][item.unitType] += item.returnQuantity;
    });
  });

  // Filter items that still have quantity available for return
  const availableItems = originalSale.items.filter(saleItem => {
    const itemKey = saleItem._id.toString();
    const unitsPerStrip = saleItem.medicine?.unitTypes?.unitsPerStrip || 10;

    // Calculate available quantity in both unit types
    let availableStrips = saleItem.unitType === 'strip' ? saleItem.quantity : Math.floor(saleItem.quantity / unitsPerStrip);
    let availableIndividual = saleItem.unitType === 'individual' ? saleItem.quantity : saleItem.quantity * unitsPerStrip;

    // Subtract already returned quantities
    if (returnedQuantities[itemKey]) {
      availableStrips -= returnedQuantities[itemKey].strip;
      availableIndividual -= returnedQuantities[itemKey].individual;

      // Handle cross-unit returns
      if (saleItem.unitType === 'strip') {
        availableStrips -= Math.floor(returnedQuantities[itemKey].individual / unitsPerStrip);
      } else {
        availableIndividual -= returnedQuantities[itemKey].strip * unitsPerStrip;
      }
    }

    // Item is available if there's any quantity left to return
    return availableStrips > 0 || availableIndividual > 0;
  }).map(saleItem => {
    const itemKey = saleItem._id.toString();
    const unitsPerStrip = saleItem.medicine?.unitTypes?.unitsPerStrip || 10;

    // Calculate exact available quantities
    let availableInOriginalUnit = saleItem.quantity;
    let availableInAlternateUnit = saleItem.unitType === 'strip' ?
      saleItem.quantity * unitsPerStrip :
      Math.floor(saleItem.quantity / unitsPerStrip);

    if (returnedQuantities[itemKey]) {
      if (saleItem.unitType === 'strip') {
        // Original sale was in strips
        availableInOriginalUnit -= returnedQuantities[itemKey].strip;
        availableInOriginalUnit -= Math.floor(returnedQuantities[itemKey].individual / unitsPerStrip);

        // Calculate available individual units: total individual units minus returned individual units
        const totalIndividualUnits = saleItem.quantity * unitsPerStrip;
        const returnedIndividualUnits = returnedQuantities[itemKey].individual + (returnedQuantities[itemKey].strip * unitsPerStrip);
        availableInAlternateUnit = totalIndividualUnits - returnedIndividualUnits;
      } else {
        // Original sale was in individual units
        availableInOriginalUnit -= returnedQuantities[itemKey].individual;
        availableInOriginalUnit -= returnedQuantities[itemKey].strip * unitsPerStrip;
        availableInAlternateUnit = Math.floor(availableInOriginalUnit / unitsPerStrip) - returnedQuantities[itemKey].strip;
      }
    }

    return {
      ...saleItem.toObject(),
      availableQuantity: {
        [saleItem.unitType]: Math.max(0, availableInOriginalUnit),
        [saleItem.unitType === 'strip' ? 'individual' : 'strip']: Math.max(0, availableInAlternateUnit)
      },
      alreadyReturned: returnedQuantities[itemKey] || { strip: 0, individual: 0 }
    };
  });

  return { originalSale, availableItems };
};

module.exports = mongoose.model('Return', returnSchema);

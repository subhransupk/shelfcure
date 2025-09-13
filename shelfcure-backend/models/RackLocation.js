const mongoose = require('mongoose');

const rackLocationSchema = new mongoose.Schema({
  // Medicine and Store Association
  medicine: {
    type: mongoose.Schema.ObjectId,
    ref: 'Medicine',
    required: [true, 'Medicine is required']
  },
  store: {
    type: mongoose.Schema.ObjectId,
    ref: 'Store',
    required: [true, 'Store is required']
  },
  
  // Rack Location Details
  rack: {
    type: mongoose.Schema.ObjectId,
    ref: 'Rack',
    required: [true, 'Rack is required']
  },
  shelf: {
    type: String,
    required: [true, 'Shelf number is required'],
    trim: true
  },
  position: {
    type: String,
    required: [true, 'Position number is required'],
    trim: true
  },
  
  // Quantity Information
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
  
  // Stock Management
  minStripQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Minimum strip quantity cannot be negative']
  },
  minIndividualQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Minimum individual quantity cannot be negative']
  },
  maxCapacity: {
    strips: {
      type: Number,
      min: [0, 'Max strip capacity cannot be negative']
    },
    individual: {
      type: Number,
      min: [0, 'Max individual capacity cannot be negative']
    }
  },
  
  // Location Priority and Organization
  priority: {
    type: String,
    enum: ['primary', 'secondary', 'overflow'],
    default: 'primary'
  },
  
  // Assignment Information
  assignedDate: {
    type: Date,
    default: Date.now
  },
  assignedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  lastUpdatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  
  // Status and Flags
  isActive: {
    type: Boolean,
    default: true
  },
  isTemporary: {
    type: Boolean,
    default: false
  },
  
  // Additional Information
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  
  // Audit Trail
  movementHistory: [{
    action: {
      type: String,
      enum: ['assigned', 'moved', 'quantity_updated', 'removed'],
      required: true
    },
    previousLocation: {
      rack: {
        type: mongoose.Schema.ObjectId,
        ref: 'Rack'
      },
      shelf: String,
      position: String
    },
    quantity: {
      strips: Number,
      individual: Number
    },
    performedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    reason: String,
    notes: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for performance and uniqueness
rackLocationSchema.index({ medicine: 1, store: 1 });
rackLocationSchema.index({ rack: 1, shelf: 1, position: 1 });
rackLocationSchema.index({ store: 1, isActive: 1 });
rackLocationSchema.index({ medicine: 1, rack: 1, shelf: 1, position: 1 }, { unique: true });

// Virtual for total quantity
rackLocationSchema.virtual('totalQuantity').get(function() {
  return {
    strips: this.stripQuantity || 0,
    individual: this.individualQuantity || 0
  };
});

// Virtual for location string
rackLocationSchema.virtual('locationString').get(function() {
  return `${this.rack?.rackNumber || 'Unknown'}-${this.shelf}-${this.position}`;
});

// Virtual for stock status with corrected dual-unit logic
rackLocationSchema.virtual('stockStatus').get(function() {
  const stripLow = this.stripQuantity <= this.minStripQuantity;
  const individualLow = this.individualQuantity <= this.minIndividualQuantity;
  const stripEmpty = this.stripQuantity === 0;
  const individualEmpty = this.individualQuantity === 0;

  // Note: This assumes rack locations can have both unit types
  // In practice, you might want to add unit type configuration to rack locations
  // For now, using the existing logic but with awareness that individual = cut medicines only

  if (stripEmpty && individualEmpty) {
    return { status: 'empty', label: 'Empty', color: 'red' };
  } else if (stripLow || individualLow) {
    return { status: 'low', label: 'Low Stock', color: 'yellow' };
  } else {
    return { status: 'good', label: 'Good Stock', color: 'green' };
  }
});

// Static method to find locations by medicine
rackLocationSchema.statics.findByMedicine = function(medicineId, storeId) {
  return this.find({ 
    medicine: medicineId, 
    store: storeId, 
    isActive: true 
  }).populate('rack', 'rackNumber name category').sort({ priority: 1, assignedDate: 1 });
};

// Static method to find medicines by rack location
rackLocationSchema.statics.findByRackLocation = function(rackId, shelf, position) {
  return this.find({ 
    rack: rackId, 
    shelf: shelf, 
    position: position, 
    isActive: true 
  }).populate('medicine', 'name genericName manufacturer category');
};

// Static method to get rack occupancy
rackLocationSchema.statics.getRackOccupancy = function(rackId) {
  return this.aggregate([
    { $match: { rack: mongoose.Types.ObjectId(rackId), isActive: true } },
    { 
      $group: {
        _id: { shelf: '$shelf', position: '$position' },
        medicines: { $push: '$medicine' },
        totalStripQuantity: { $sum: '$stripQuantity' },
        totalIndividualQuantity: { $sum: '$individualQuantity' }
      }
    }
  ]);
};

// Instance method to update quantity
rackLocationSchema.methods.updateQuantity = function(stripQty, individualQty, updatedBy, reason) {
  const oldStripQty = this.stripQuantity;
  const oldIndividualQty = this.individualQuantity;
  
  this.stripQuantity = stripQty;
  this.individualQuantity = individualQty;
  this.lastUpdated = new Date();
  this.lastUpdatedBy = updatedBy;
  
  // Add to movement history
  this.movementHistory.push({
    action: 'quantity_updated',
    quantity: {
      strips: stripQty - oldStripQty,
      individual: individualQty - oldIndividualQty
    },
    performedBy: updatedBy,
    reason: reason || 'Quantity updated',
    notes: `Updated from ${oldStripQty}/${oldIndividualQty} to ${stripQty}/${individualQty}`
  });
  
  return this.save();
};

// Instance method to move to new location
rackLocationSchema.methods.moveToLocation = function(newRackId, newShelf, newPosition, movedBy, reason) {
  const oldLocation = {
    rack: this.rack,
    shelf: this.shelf,
    position: this.position
  };
  
  this.rack = newRackId;
  this.shelf = newShelf;
  this.position = newPosition;
  this.lastUpdated = new Date();
  this.lastUpdatedBy = movedBy;
  
  // Add to movement history
  this.movementHistory.push({
    action: 'moved',
    previousLocation: oldLocation,
    quantity: {
      strips: this.stripQuantity,
      individual: this.individualQuantity
    },
    performedBy: movedBy,
    reason: reason || 'Location changed',
    notes: `Moved from ${oldLocation.rack}-${oldLocation.shelf}-${oldLocation.position}`
  });
  
  return this.save();
};

// Pre-save middleware
rackLocationSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('RackLocation', rackLocationSchema);

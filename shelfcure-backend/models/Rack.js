const mongoose = require('mongoose');

const rackSchema = new mongoose.Schema({
  // Basic Rack Information
  rackNumber: {
    type: String,
    required: [true, 'Rack number is required'],
    trim: true,
    maxlength: [20, 'Rack number cannot be more than 20 characters']
  },
  name: {
    type: String,
    required: [true, 'Rack name is required'],
    trim: true,
    maxlength: [100, 'Rack name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  
  // Store Association
  store: {
    type: mongoose.Schema.ObjectId,
    ref: 'Store',
    required: [true, 'Store is required']
  },
  
  // Rack Configuration
  shelves: [{
    shelfNumber: {
      type: String,
      required: true,
      trim: true
    },
    positions: [{
      positionNumber: {
        type: String,
        required: true,
        trim: true
      },
      isOccupied: {
        type: Boolean,
        default: false
      },
      // Optional: Physical dimensions
      width: Number,
      height: Number,
      depth: Number,
      maxWeight: Number
    }]
  }],
  
  // Physical Properties
  location: {
    zone: String, // e.g., "Front", "Back", "Left Wing", "Right Wing"
    floor: {
      type: String,
      default: 'Ground'
    },
    coordinates: {
      x: Number,
      y: Number
    }
  },
  
  // Rack Specifications
  specifications: {
    material: {
      type: String,
      enum: ['steel', 'wood', 'plastic', 'glass', 'other'],
      default: 'steel'
    },
    maxCapacity: {
      type: Number,
      min: [0, 'Max capacity cannot be negative']
    },
    currentCapacity: {
      type: Number,
      default: 0,
      min: [0, 'Current capacity cannot be negative']
    },
    // Environmental conditions
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
    specialConditions: [String] // e.g., "refrigerated", "dry", "dark"
  },
  
  // Category and Usage
  category: {
    type: String,
    enum: [
      'general', 'refrigerated', 'controlled_substances', 'otc', 
      'prescription', 'surgical', 'emergency', 'expired', 'quarantine'
    ],
    default: 'general'
  },
  
  // Access Control
  accessLevel: {
    type: String,
    enum: ['public', 'restricted', 'manager_only'],
    default: 'public'
  },
  
  // Status and Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  installationDate: {
    type: Date,
    default: Date.now
  },
  lastMaintenanceDate: Date,
  nextMaintenanceDate: Date,
  
  // Tracking
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  
  // Notes and Tags
  notes: String,
  tags: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
rackSchema.index({ store: 1 });
rackSchema.index({ rackNumber: 1, store: 1 }, { unique: true });
rackSchema.index({ category: 1 });
rackSchema.index({ isActive: 1 });
rackSchema.index({ store: 1, isActive: 1 });

// Virtual for total positions
rackSchema.virtual('totalPositions').get(function() {
  return this.shelves && Array.isArray(this.shelves) ? this.shelves.reduce((total, shelf) => total + (shelf.positions ? shelf.positions.length : 0), 0) : 0;
});

// Virtual for occupied positions
rackSchema.virtual('occupiedPositions').get(function() {
  return this.shelves && Array.isArray(this.shelves) ? this.shelves.reduce((total, shelf) =>
    total + (shelf.positions ? shelf.positions.filter(pos => pos.isOccupied).length : 0), 0
  ) : 0;
});

// Virtual for available positions
rackSchema.virtual('availablePositions').get(function() {
  return this.totalPositions - this.occupiedPositions;
});

// Virtual for occupancy percentage
rackSchema.virtual('occupancyPercentage').get(function() {
  if (this.totalPositions === 0) return 0;
  return Math.round((this.occupiedPositions / this.totalPositions) * 100);
});

// Static method to find racks by store
rackSchema.statics.findByStore = function(storeId) {
  return this.find({ store: storeId, isActive: true }).sort({ rackNumber: 1 });
};

// Static method to search racks
rackSchema.statics.search = function(storeId, query) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    store: storeId,
    isActive: true,
    $or: [
      { rackNumber: searchRegex },
      { name: searchRegex },
      { description: searchRegex },
      { category: searchRegex }
    ]
  }).sort({ rackNumber: 1 });
};

// Instance method to get specific position
rackSchema.methods.getPosition = function(shelfNumber, positionNumber) {
  const shelf = this.shelves.find(s => s.shelfNumber === shelfNumber);
  if (!shelf) return null;
  return shelf.positions.find(p => p.positionNumber === positionNumber);
};

// Instance method to update position occupancy
rackSchema.methods.updatePositionOccupancy = function(shelfNumber, positionNumber, isOccupied) {
  const shelf = this.shelves.find(s => s.shelfNumber === shelfNumber);
  if (!shelf) return false;
  
  const position = shelf.positions.find(p => p.positionNumber === positionNumber);
  if (!position) return false;
  
  position.isOccupied = isOccupied;
  return true;
};

// Pre-save middleware
rackSchema.pre('save', function(next) {
  // Update current capacity based on occupied positions
  this.specifications.currentCapacity = this.occupiedPositions;
  next();
});

module.exports = mongoose.model('Rack', rackSchema);

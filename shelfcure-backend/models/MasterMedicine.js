const mongoose = require('mongoose');

const masterMedicineSchema = new mongoose.Schema({
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
  
  // Dual Unit System Configuration (template only)
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
  
  // Medicine information
  dosage: {
    strength: String,
    form: String,
    frequency: String
  },
  sideEffects: [String],
  contraindications: [String],
  interactions: [String],
  
  // Storage conditions (template)
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
  
  // Global barcode (if applicable)
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  
  // Status and flags
  isActive: {
    type: Boolean,
    default: true
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

// Indexes for better performance
masterMedicineSchema.index({ name: 1, manufacturer: 1 });
masterMedicineSchema.index({ category: 1 });
masterMedicineSchema.index({ genericName: 1 });
masterMedicineSchema.index({ barcode: 1 });
masterMedicineSchema.index({ isActive: 1 });

// Virtual for full medicine name
masterMedicineSchema.virtual('fullName').get(function() {
  return `${this.name} - ${this.manufacturer}`;
});

// Static method to search master medicines
masterMedicineSchema.statics.search = function(query) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    isActive: true,
    $or: [
      { name: searchRegex },
      { genericName: searchRegex },
      { manufacturer: searchRegex },
      { composition: searchRegex }
    ]
  });
};

// Static method to find by category
masterMedicineSchema.statics.findByCategory = function(category) {
  return this.find({
    category: category,
    isActive: true
  });
};

// Virtual to check if medicine supports cutting (strip to individual conversion)
masterMedicineSchema.virtual('supportsCutting').get(function() {
  // Cut Medicine functionality should only be available for medicines that have BOTH strips AND individual units
  // If a medicine only has individual units (hasStrips: false), it's a single-piece medicine (bottles, injections) - no cutting allowed
  return this.unitTypes?.hasStrips === true && this.unitTypes?.hasIndividual === true;
});

// Pre-save middleware
masterMedicineSchema.pre('save', function(next) {
  // Normalize empty barcode to undefined so unique index on barcode doesn't clash on ""
  if (typeof this.barcode === 'string' && this.barcode.trim() === '') {
    this.barcode = undefined;
  }

  // Ensure proper data structure
  if (!this.unitTypes) {
    this.unitTypes = {
      hasStrips: true,
      hasIndividual: true,
      unitsPerStrip: 10
    };
  }

  if (!this.dosage) {
    this.dosage = {};
  }

  next();
});

module.exports = mongoose.model('MasterMedicine', masterMedicineSchema);

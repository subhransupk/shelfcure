const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  
  // Address Information
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    pincode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'India'
    }
  },

  // Business Information
  gstNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  licenseNumber: {
    type: String,
    trim: true
  },
  
  // Financial Information
  paymentTerms: {
    type: String,
    enum: ['Cash on delivery', '15 days', '30 days', '45 days', '60 days', '90 days'],
    default: '30 days'
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Store Association (Each store has its own suppliers)
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  
  // Added by which store manager
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Status and Activity
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Purchase Statistics (calculated fields)
  totalPurchases: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPurchaseAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastPurchaseDate: {
    type: Date
  },
  
  // Additional Information
  notes: {
    type: String,
    trim: true
  },
  
  // Rating and Performance
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for store-specific supplier names (unique supplier name per store)
SupplierSchema.index({ store: 1, name: 1 }, { unique: true });

// Update the updatedAt field on save
SupplierSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for full address
SupplierSchema.virtual('fullAddress').get(function() {
  const parts = [];
  if (this.address.street) parts.push(this.address.street);
  if (this.address.city) parts.push(this.address.city);
  if (this.address.state) parts.push(this.address.state);
  if (this.address.pincode) parts.push(this.address.pincode);
  if (this.address.country) parts.push(this.address.country);
  return parts.join(', ');
});

// Method to update purchase statistics
SupplierSchema.methods.updatePurchaseStats = async function() {
  const Purchase = mongoose.model('Purchase');
  
  const stats = await Purchase.aggregate([
    { 
      $match: { 
        supplier: this._id,
        status: { $in: ['completed', 'received'] }
      }
    },
    {
      $group: {
        _id: null,
        totalPurchases: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        lastPurchase: { $max: '$purchaseDate' }
      }
    }
  ]);

  if (stats.length > 0) {
    this.totalPurchases = stats[0].totalPurchases || 0;
    this.totalPurchaseAmount = stats[0].totalAmount || 0;
    this.lastPurchaseDate = stats[0].lastPurchase;
  } else {
    this.totalPurchases = 0;
    this.totalPurchaseAmount = 0;
    this.lastPurchaseDate = null;
  }
  
  await this.save();
};

// Static method to get suppliers for a specific store
SupplierSchema.statics.getStoreSuppliers = function(storeId, options = {}) {
  const query = { store: storeId };
  
  if (options.isActive !== undefined) {
    query.isActive = options.isActive;
  }
  
  if (options.search) {
    query.$or = [
      { name: { $regex: options.search, $options: 'i' } },
      { contactPerson: { $regex: options.search, $options: 'i' } },
      { phone: { $regex: options.search, $options: 'i' } },
      { 'address.city': { $regex: options.search, $options: 'i' } }
    ];
  }
  
  return this.find(query)
    .populate('store', 'name')
    .populate('addedBy', 'name email')
    .sort(options.sort || { name: 1 });
};

module.exports = mongoose.model('Supplier', SupplierSchema);

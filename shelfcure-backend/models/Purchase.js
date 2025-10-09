const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  // Store reference
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },

  // Supplier reference - OPTIONAL (can be assigned later)
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: false
  },

  // Purchase identification
  purchaseOrderNumber: {
    type: String,
    required: true,
    trim: true
  },
  invoiceNumber: {
    type: String,
    trim: true
  },
  
  // Purchase items - medicines bought from supplier
  items: [{
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: function() {
        // Medicine is required unless this is a customer requested item
        return !this.isCustomerRequested;
      }
    },
    medicineName: {
      type: String,
      required: true,
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
    category: {
      type: String,
      trim: true
    },

    // Customer request tracking
    isCustomerRequested: {
      type: Boolean,
      default: false
    },
    reorderSource: {
      type: String,
      trim: true
    },
    
    // Quantity and unit information
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitType: {
      type: String,
      enum: ['strip', 'individual', 'box', 'bottle', 'piece'],
      default: 'strip'
    },
    
    // Pricing per unit
    unitCost: {
      type: Number,
      required: true,
      min: 0
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0
    },
    
    // Batch and expiry information
    batch: {
      batchNumber: {
        type: String,
        trim: true
      },
      manufacturingDate: Date,
      expiryDate: Date
    },
    
    // Discount on this item
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // Tax information
    taxRate: {
      type: Number,
      default: 18, // GST percentage
      min: 0
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // Final amounts
    netAmount: {
      type: Number,
      required: true,
      min: 0
    }
  }],

  // Purchase totals
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  totalDiscount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalTax: {
    type: Number,
    default: 0,
    min: 0
  },
  shippingCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  otherCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },

  // Payment information
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank_transfer', 'check', 'credit'],
    default: 'cash'
  },
  paymentTerms: {
    type: String,
    enum: ['Cash on delivery', '15 days', '30 days', '45 days', '60 days', '90 days'],
    default: '30 days'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue'],
    default: 'pending'
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  balanceAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  creditAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentDate: Date,
  dueDate: Date,

  // Payment history tracking
  paymentHistory: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'bank_transfer', 'check'],
      required: true
    },
    transactionId: {
      type: String,
      trim: true
    },
    checkNumber: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    runningBalance: {
      type: Number,
      required: true,
      min: 0
    },
    supplierTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupplierTransaction'
    }
  }],

  // Purchase status and tracking
  status: {
    type: String,
    enum: ['draft', 'ordered', 'confirmed', 'shipped', 'received', 'completed', 'cancelled'],
    default: 'draft'
  },

  // Inventory management tracking
  inventoryUpdated: {
    type: Boolean,
    default: false
  },
  inventoryUpdateDate: Date,
  inventoryUpdateBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Important dates
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  orderDate: Date,
  expectedDeliveryDate: Date,
  deliveryDate: Date,
  receivedDate: Date,
  
  // Created and managed by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Additional information
  notes: {
    type: String,
    trim: true
  },
  internalNotes: {
    type: String,
    trim: true
  },
  
  // Delivery information
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  
  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['invoice', 'receipt', 'delivery_note', 'other']
    },
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Quality check
  qualityCheck: {
    checked: {
      type: Boolean,
      default: false
    },
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    checkedDate: Date,
    issues: [String],
    approved: {
      type: Boolean,
      default: false
    }
  },
  
  // Fiscal information
  fiscalYear: String,
  quarter: String,
  month: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
purchaseSchema.index({ store: 1, purchaseDate: -1 });
purchaseSchema.index({ supplier: 1, purchaseDate: -1 });
purchaseSchema.index({ status: 1, purchaseDate: -1 });
purchaseSchema.index({ createdBy: 1, purchaseDate: -1 });

// Compound index for store and supplier specific queries
purchaseSchema.index({ store: 1, supplier: 1, purchaseDate: -1 });

// Virtual for total items
purchaseSchema.virtual('totalItems').get(function() {
  return this.items && Array.isArray(this.items) ? this.items.reduce((total, item) => total + item.quantity, 0) : 0;
});

// Virtual for days overdue
purchaseSchema.virtual('daysOverdue').get(function() {
  if (this.paymentStatus === 'overdue' && this.dueDate) {
    const today = new Date();
    const diffTime = today - this.dueDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Pre-save middleware to calculate amounts and set fiscal info
purchaseSchema.pre('save', function(next) {
  // Calculate subtotal
  this.subtotal = this.items && Array.isArray(this.items) ? this.items.reduce((sum, item) => sum + item.totalCost, 0) : 0;

  // Calculate total discount
  this.totalDiscount = this.items && Array.isArray(this.items) ? this.items.reduce((sum, item) => sum + (item.discountAmount || 0), 0) : 0;

  // Calculate total tax
  this.totalTax = this.items && Array.isArray(this.items) ? this.items.reduce((sum, item) => sum + (item.taxAmount || 0), 0) : 0;
  
  // Calculate final total
  this.totalAmount = this.subtotal - this.totalDiscount + this.totalTax + 
                     (this.shippingCharges || 0) + (this.otherCharges || 0);
  
  // Calculate balance amount
  this.balanceAmount = this.totalAmount - (this.paidAmount || 0);
  
  // Set fiscal information
  const date = this.purchaseDate || new Date();
  this.fiscalYear = `${date.getFullYear()}-${date.getFullYear() + 1}`;
  this.quarter = `Q${Math.ceil((date.getMonth() + 1) / 3)}`;
  this.month = date.toLocaleString('default', { month: 'long' });
  
  // Set due date if payment terms are specified
  if (this.paymentTerms && !this.dueDate) {
    const days = parseInt(this.paymentTerms.match(/\d+/)?.[0]) || 30;
    this.dueDate = new Date(date.getTime() + (days * 24 * 60 * 60 * 1000));
  }
  
  next();
});

// Post-save middleware to update supplier statistics
purchaseSchema.post('save', async function() {
  if (this.supplier && ['completed', 'received'].includes(this.status)) {
    try {
      const Supplier = mongoose.model('Supplier');
      const supplier = await Supplier.findById(this.supplier);
      if (supplier) {
        await supplier.updatePurchaseStats();
      }
    } catch (error) {
      console.error('Error updating supplier stats:', error);
    }
  }
});

// Static method to get purchases for a specific store
purchaseSchema.statics.getStorePurchases = function(storeId, options = {}) {
  const query = { store: storeId };
  
  if (options.supplier) {
    query.supplier = options.supplier;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.paymentStatus) {
    query.paymentStatus = options.paymentStatus;
  }
  
  if (options.dateFrom || options.dateTo) {
    query.purchaseDate = {};
    if (options.dateFrom) query.purchaseDate.$gte = new Date(options.dateFrom);
    if (options.dateTo) query.purchaseDate.$lte = new Date(options.dateTo);
  }
  
  return this.find(query)
    .populate('supplier', 'name contactPerson phone address')
    .populate('createdBy', 'name email')
    .populate('receivedBy', 'name email')
    .populate('items.medicine', 'name genericName manufacturer')
    .sort(options.sort || { purchaseDate: -1 });
};

// Static method to get supplier-wise purchase summary
purchaseSchema.statics.getSupplierPurchaseSummary = function(storeId, supplierId, options = {}) {
  const matchStage = { store: new mongoose.Types.ObjectId(storeId) };
  
  if (supplierId) {
    matchStage.supplier = new mongoose.Types.ObjectId(supplierId);
  }
  
  if (options.dateFrom || options.dateTo) {
    matchStage.purchaseDate = {};
    if (options.dateFrom) matchStage.purchaseDate.$gte = new Date(options.dateFrom);
    if (options.dateTo) matchStage.purchaseDate.$lte = new Date(options.dateTo);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$supplier',
        totalPurchases: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        totalItems: { $sum: { $sum: '$items.quantity' } },
        lastPurchaseDate: { $max: '$purchaseDate' },
        avgPurchaseAmount: { $avg: '$totalAmount' }
      }
    },
    {
      $lookup: {
        from: 'suppliers',
        localField: '_id',
        foreignField: '_id',
        as: 'supplier'
      }
    },
    { $unwind: '$supplier' },
    { $sort: { totalAmount: -1 } }
  ]);
};

module.exports = mongoose.model('Purchase', purchaseSchema);

const mongoose = require('mongoose');

const salesInvoiceSchema = new mongoose.Schema({
  // Invoice Identification
  invoiceNumber: {
    type: String,
    unique: true
  },
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Reference to the sale
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    required: true
  },
  
  // Store Information
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  
  // Customer Information (can be null for walk-in customers)
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  customerDetails: {
    name: String,
    phone: String,
    email: String,
    address: String
  },
  
  // Invoice Items (copied from sale for invoice integrity)
  items: [{
    medicineName: {
      type: String,
      required: true
    },
    genericName: String,
    quantity: {
      type: Number,
      required: true
    },
    unitType: {
      type: String,
      enum: ['strip', 'individual'],
      required: true
    },
    unitPrice: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    },
    // Batch information for tracking
    batch: {
      batchNumber: String,
      expiryDate: Date
    }
  }],
  
  // Financial Details
  subtotal: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  discountType: {
    name: String,
    type: String,
    value: Number
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  
  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'credit', 'online'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'partial'],
    default: 'paid'
  },
  
  // Invoice Template Data (for consistent reprinting)
  template: {
    storeDetails: {
      name: String,
      address: String,
      phone: String,
      email: String,
      gstNumber: String,
      licenseNumber: String
    },
    footer: {
      terms: String,
      thankYouMessage: String
    }
  },
  
  // Status and Tracking
  status: {
    type: String,
    enum: ['active', 'cancelled', 'refunded'],
    default: 'active'
  },
  
  // Print History
  printHistory: [{
    printedAt: {
      type: Date,
      default: Date.now
    },
    printedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    printType: {
      type: String,
      enum: ['original', 'duplicate', 'reprint'],
      default: 'original'
    }
  }],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
salesInvoiceSchema.index({ invoiceNumber: 1 });
salesInvoiceSchema.index({ store: 1, createdAt: -1 });
salesInvoiceSchema.index({ sale: 1 });
salesInvoiceSchema.index({ customer: 1 });
salesInvoiceSchema.index({ invoiceDate: -1 });
salesInvoiceSchema.index({ status: 1 });

// Auto-generate invoice number
salesInvoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    try {
      // Get store code for invoice numbering
      const Store = mongoose.model('Store');
      const store = await Store.findById(this.store).select('code');
      const storeCode = store?.code || 'ST';
      
      const year = new Date().getFullYear().toString().slice(-2);
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      
      // Find the last invoice for this store and month
      const lastInvoice = await this.constructor
        .findOne({
          store: this.store,
          invoiceNumber: new RegExp(`^${storeCode}-${year}${month}-`)
        })
        .sort({ invoiceNumber: -1 });
      
      let sequence = 1;
      if (lastInvoice) {
        const parts = lastInvoice.invoiceNumber.split('-');
        if (parts.length >= 3) {
          const lastSequence = parseInt(parts[2]);
          if (!isNaN(lastSequence)) {
            sequence = lastSequence + 1;
          }
        }
      }
      
      this.invoiceNumber = `${storeCode}-${year}${month}-${String(sequence).padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      // Fallback to timestamp-based number
      this.invoiceNumber = `INV-${Date.now()}`;
    }
  }
  
  next();
});

// Virtual for total items count
salesInvoiceSchema.virtual('totalItems').get(function() {
  return this.items && Array.isArray(this.items) ? this.items.reduce((total, item) => total + item.quantity, 0) : 0;
});

// Virtual for print count
salesInvoiceSchema.virtual('printCount').get(function() {
  return this.printHistory ? this.printHistory.length : 0;
});

module.exports = mongoose.model('SalesInvoice', salesInvoiceSchema);

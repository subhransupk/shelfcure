const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  // Invoice Identification
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  
  // Customer Information
  customer: {
    store: {
      type: mongoose.Schema.ObjectId,
      ref: 'Store',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      pincode: String
    },
    gstNumber: String
  },
  
  // Invoice Type
  type: {
    type: String,
    enum: ['subscription', 'one_time', 'affiliate_commission', 'custom'],
    required: true
  },
  
  // Subscription Details (if applicable)
  subscription: {
    plan: {
      type: mongoose.Schema.ObjectId,
      ref: 'SubscriptionPlan'
    },
    period: {
      type: String,
      enum: ['monthly', 'yearly']
    },
    startDate: Date,
    endDate: Date
  },
  
  // Line Items
  items: [{
    description: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative']
    },
    totalPrice: {
      type: Number,
      required: true
    },
    taxRate: {
      type: Number,
      default: 18 // GST rate
    },
    taxAmount: {
      type: Number,
      default: 0
    }
  }],
  
  // Amounts
  amounts: {
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative']
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  
  // Discount Information
  discount: {
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'none'],
      default: 'none'
    },
    value: {
      type: Number,
      default: 0
    },
    code: String,
    reason: String
  },
  
  // Payment Information
  payment: {
    status: {
      type: String,
      enum: ['pending', 'paid', 'partially_paid', 'overdue', 'cancelled'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['credit_card', 'debit_card', 'bank_transfer', 'upi', 'cash', 'check', 'other']
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    paidDate: Date,
    transactionId: String,
    paymentGateway: String,
    notes: String
  },
  
  // Status and Metadata
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  
  // Communication
  sentDate: Date,
  viewedDate: Date,
  remindersSent: {
    type: Number,
    default: 0
  },
  lastReminderDate: Date,
  
  // Notes and Terms
  notes: String,
  terms: {
    type: String,
    default: 'Payment is due within 30 days of invoice date.'
  },
  
  // File Attachments
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    mimeType: String
  }],
  
  // Tracking
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
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

// Indexes
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ 'customer.store': 1 });
invoiceSchema.index({ invoiceDate: -1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ 'payment.status': 1 });

// Auto-generate invoice number
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Find the last invoice for this month
    const lastInvoice = await this.constructor
      .findOne({
        invoiceNumber: new RegExp(`^INV-${year}${month}-`)
      })
      .sort({ invoiceNumber: -1 });
    
    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    this.invoiceNumber = `INV-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }
  
  next();
});

// Virtual for days overdue
invoiceSchema.virtual('daysOverdue').get(function() {
  if (this.payment.status === 'paid' || this.status === 'cancelled') return 0;
  
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  
  if (today > dueDate) {
    return Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
  }
  
  return 0;
});

// Virtual for remaining amount
invoiceSchema.virtual('remainingAmount').get(function() {
  return this.amounts.total - this.payment.paidAmount;
});

module.exports = mongoose.model('Invoice', invoiceSchema);

const mongoose = require('mongoose');

const creditTransactionSchema = new mongoose.Schema({
  // Store and Customer references
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },

  // Transaction details
  transactionType: {
    type: String,
    enum: [
      'credit_sale',        // Customer purchased on credit
      'credit_payment',     // Customer paid towards credit balance
      'credit_adjustment',  // Manual credit adjustment (add/deduct)
      'credit_refund',      // Refund added to credit
      'credit_writeoff'     // Credit written off as bad debt
    ],
    required: true
  },
  
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Positive for credit increase (sales, adjustments), negative for credit decrease (payments)
  balanceChange: {
    type: Number,
    required: true
  },
  
  // Balance before and after transaction
  previousBalance: {
    type: Number,
    required: true,
    min: 0
  },
  newBalance: {
    type: Number,
    required: true,
    min: 0
  },

  // Reference to related documents
  reference: {
    type: {
      type: String,
      enum: ['Sale', 'Payment', 'Adjustment', 'Refund', 'Return'],
      required: true
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    number: String // Sale number, payment reference, etc.
  },

  // Payment details (for credit_payment transactions)
  paymentDetails: {
    method: {
      type: String,
      enum: ['cash', 'card', 'upi', 'bank_transfer', 'check', 'other']
    },
    transactionId: String,
    notes: String
  },

  // Adjustment details (for credit_adjustment transactions)
  adjustmentDetails: {
    reason: {
      type: String,
      enum: [
        'manual_adjustment',
        'promotional_credit',
        'compensation',
        'correction',
        'goodwill',
        'other'
      ]
    },
    notes: String
  },

  // Transaction metadata
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  notes: {
    type: String,
    maxlength: 1000
  },

  // Staff who processed the transaction
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Status and approval (for adjustments)
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'completed'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: Date,
  rejectionReason: String,

  // Fiscal information
  fiscalYear: String,
  quarter: String,
  month: String,

  // Timestamps
  transactionDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
creditTransactionSchema.index({ store: 1, customer: 1, transactionDate: -1 });
creditTransactionSchema.index({ store: 1, transactionType: 1, transactionDate: -1 });
creditTransactionSchema.index({ customer: 1, transactionDate: -1 });
creditTransactionSchema.index({ 'reference.type': 1, 'reference.id': 1 });
creditTransactionSchema.index({ status: 1 });

// Virtual for formatted amount
creditTransactionSchema.virtual('formattedAmount').get(function() {
  return `₹${this.amount.toLocaleString()}`;
});

// Virtual for transaction direction
creditTransactionSchema.virtual('direction').get(function() {
  return this.balanceChange >= 0 ? 'credit' : 'debit';
});

// Pre-save middleware to set fiscal information
creditTransactionSchema.pre('save', function(next) {
  const date = this.transactionDate || new Date();
  this.fiscalYear = `${date.getFullYear()}-${date.getFullYear() + 1}`;
  this.quarter = `Q${Math.ceil((date.getMonth() + 1) / 3)}`;
  this.month = date.toLocaleString('default', { month: 'long' });
  next();
});

// Static method to create credit transaction
creditTransactionSchema.statics.createTransaction = async function(transactionData) {
  const Customer = mongoose.model('Customer');

  // Get customer current balance
  const customer = await Customer.findById(transactionData.customer);
  if (!customer) {
    throw new Error('Customer not found');
  }

  const previousBalance = customer.creditBalance || 0;
  const newBalance = previousBalance + transactionData.balanceChange;

  // Validate new balance
  if (newBalance < 0) {
    throw new Error('Credit balance cannot be negative');
  }

  // Create transaction record
  const transaction = await this.create({
    ...transactionData,
    previousBalance,
    newBalance
  });

  // Update customer balance
  await customer.updateCreditBalance(transactionData.balanceChange);

  return transaction;
};

// Static method to get customer credit history
creditTransactionSchema.statics.getCustomerHistory = function(customerId, options = {}) {
  const query = { customer: customerId };

  if (options.startDate || options.endDate) {
    query.transactionDate = {};
    if (options.startDate) query.transactionDate.$gte = options.startDate;
    if (options.endDate) query.transactionDate.$lte = options.endDate;
  }

  if (options.transactionType) {
    query.transactionType = options.transactionType;
  }

  return this.find(query)
    .populate('processedBy', 'name')
    .populate('approvedBy', 'name')
    .sort({ transactionDate: -1 })
    .limit(options.limit || 100);
};

module.exports = mongoose.model('CreditTransaction', creditTransactionSchema);

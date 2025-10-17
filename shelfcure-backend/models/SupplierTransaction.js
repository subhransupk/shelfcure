const mongoose = require('mongoose');

const supplierTransactionSchema = new mongoose.Schema({
  // Store and Supplier references
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },

  // Transaction details
  transactionType: {
    type: String,
    enum: [
      'purchase_credit',      // Store purchased on credit from supplier
      'supplier_payment',     // Store paid supplier
      'credit_adjustment',    // Manual adjustment (add/deduct)
      'purchase_return',      // Return that affects credit
      'discount_received'     // Discount received from supplier
    ],
    required: true
  },
  
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Positive for credit increase (purchases), negative for credit decrease (payments)
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
      enum: ['Purchase', 'Payment', 'Adjustment', 'Return', 'Discount'],
      required: true
    },
    id: {
      type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and other types (like timestamps)
      required: true
    },
    number: String // Purchase number, payment reference, etc.
  },

  // Payment details (for supplier_payment transactions)
  paymentDetails: {
    method: {
      type: String,
      enum: ['cash', 'card', 'upi', 'bank_transfer', 'check', 'other']
    },
    transactionId: String,
    checkNumber: String,
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String
    },
    notes: String
  },

  // Adjustment details (for credit_adjustment transactions)
  adjustmentDetails: {
    reason: {
      type: String,
      enum: [
        'manual_adjustment',
        'discount_applied',
        'penalty_applied',
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

  // Status and approval
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

  // Due date for credit purchases
  dueDate: Date,

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
supplierTransactionSchema.index({ store: 1, supplier: 1, transactionDate: -1 });
supplierTransactionSchema.index({ store: 1, transactionType: 1, transactionDate: -1 });
supplierTransactionSchema.index({ supplier: 1, transactionDate: -1 });
supplierTransactionSchema.index({ 'reference.type': 1, 'reference.id': 1 });
supplierTransactionSchema.index({ status: 1 });
supplierTransactionSchema.index({ dueDate: 1 });

// Virtual for formatted amount
supplierTransactionSchema.virtual('formattedAmount').get(function() {
  return `₹${this.amount.toLocaleString()}`;
});

// Virtual for transaction direction
supplierTransactionSchema.virtual('direction').get(function() {
  return this.balanceChange >= 0 ? 'debit' : 'credit';
});

// Pre-save middleware to set fiscal information
supplierTransactionSchema.pre('save', function(next) {
  const date = this.transactionDate || new Date();
  this.fiscalYear = `${date.getFullYear()}-${date.getFullYear() + 1}`;
  this.quarter = `Q${Math.ceil((date.getMonth() + 1) / 3)}`;
  this.month = date.toLocaleString('default', { month: 'long' });
  next();
});

// Static method to create supplier transaction
supplierTransactionSchema.statics.createTransaction = async function(transactionData) {
  const Supplier = mongoose.model('Supplier');

  console.log(`🔄 SupplierTransaction.createTransaction called for supplier ${transactionData.supplier}, type: ${transactionData.transactionType}, balanceChange: ${transactionData.balanceChange}`);

  // Get supplier current balance
  const supplier = await Supplier.findById(transactionData.supplier);
  if (!supplier) {
    console.error(`❌ Supplier not found: ${transactionData.supplier}`);
    throw new Error('Supplier not found');
  }

  const previousBalance = supplier.outstandingBalance || 0;
  const newBalance = previousBalance + transactionData.balanceChange;

  console.log(`📊 Supplier balance calculation: Previous: ₹${previousBalance}, Change: ₹${transactionData.balanceChange}, New: ₹${newBalance}`);

  // Validate new balance
  if (newBalance < 0) {
    console.error(`❌ Outstanding balance would be negative: ${newBalance}`);
    throw new Error('Outstanding balance cannot be negative');
  }

  // Create transaction record
  const transaction = await this.create({
    ...transactionData,
    previousBalance,
    newBalance
  });

  console.log(`✅ Transaction record created with ID: ${transaction._id}`);

  // Update supplier balance
  await supplier.updateOutstandingBalance(transactionData.balanceChange);

  console.log(`✅ Supplier balance updated successfully. New balance: ₹${supplier.outstandingBalance}`);

  return transaction;
};

// Static method to get supplier transaction history
supplierTransactionSchema.statics.getSupplierHistory = function(supplierId, options = {}) {
  const query = { supplier: supplierId };

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

module.exports = mongoose.model('SupplierTransaction', supplierTransactionSchema);

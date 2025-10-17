const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  // Reference to the store
  store: {
    type: mongoose.Schema.ObjectId,
    ref: 'Store',
    required: [true, 'Commission must belong to a store']
  },

  // Reference to the doctor
  doctor: {
    type: mongoose.Schema.ObjectId,
    ref: 'Doctor',
    required: [true, 'Commission must be associated with a doctor']
  },

  // Reference to the specific sale transaction that generated this commission
  sale: {
    type: mongoose.Schema.ObjectId,
    ref: 'Sale',
    required: [true, 'Commission must be associated with a sale transaction']
  },



  // Commission calculation details (for individual sale transaction)
  prescriptionCount: {
    type: Number,
    required: true,
    default: 1, // Each commission record represents one prescription/sale
    min: 1
  },

  salesValue: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },

  // Sale transaction details for reference
  saleDate: {
    type: Date,
    required: true
  },

  invoiceNumber: {
    type: String,
    required: false // Some sales might not have invoice numbers yet
  },

  receiptNumber: {
    type: String,
    required: false // Some sales might not have receipt numbers yet
  },

  commissionRate: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 100
  },

  commissionAmount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },

  // Payment status
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending'
  },

  // Payment details
  paymentDate: {
    type: Date
  },

  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'cheque', 'upi', 'other']
  },

  paymentReference: {
    type: String,
    trim: true
  },

  paymentNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Payment notes cannot be more than 500 characters']
  },

  // Payment history tracking - for multiple partial payments
  paymentHistory: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'cheque', 'upi', 'other'],
      required: true
    },
    paymentReference: {
      type: String,
      trim: true
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Payment notes cannot be more than 500 characters']
    },
    processedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    runningBalance: {
      type: Number,
      required: true,
      min: 0
    }
  }],

  // Total amount paid (sum of all payments)
  totalPaid: {
    type: Number,
    default: 0,
    min: 0
  },

  // Remaining balance
  remainingBalance: {
    type: Number,
    default: 0,
    min: 0
  },

  // Audit fields
  paidBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },

  // Additional metadata
  calculatedAt: {
    type: Date,
    default: Date.now
  },

  lastUpdated: {
    type: Date,
    default: Date.now
  },

  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
// Each commission is now unique per sale transaction
commissionSchema.index({ store: 1, sale: 1 }, { unique: true });
commissionSchema.index({ store: 1, doctor: 1, saleDate: -1 });
commissionSchema.index({ store: 1, status: 1 });
commissionSchema.index({ store: 1, paymentDate: 1 });
commissionSchema.index({ doctor: 1, status: 1 });
commissionSchema.index({ doctor: 1, paymentDate: -1 });
commissionSchema.index({ store: 1, doctor: 1, status: 1 });
commissionSchema.index({ sale: 1 }); // For quick sale-based lookups

// Virtual for commission ID (for compatibility with existing frontend)
commissionSchema.virtual('commissionId').get(function() {
  return `comm_${this.doctor._id || this.doctor}`;
});

// Virtual for payment status display
commissionSchema.virtual('paymentStatusDisplay').get(function() {
  if (this.status === 'paid' && this.remainingBalance === 0) {
    return 'Fully Paid';
  } else if (this.totalPaid > 0 && this.remainingBalance > 0) {
    return 'Partially Paid';
  } else if (this.status === 'pending') {
    return 'Unpaid';
  } else {
    return 'Unknown';
  }
});

// Instance method to record a payment
commissionSchema.methods.recordPayment = function(paymentData) {
  const { amount, paymentMethod, paymentReference, notes, processedBy } = paymentData;

  // Calculate new running balance
  const newRunningBalance = Math.max(0, this.remainingBalance - amount);

  // Add payment to history
  this.paymentHistory.push({
    amount,
    paymentMethod,
    paymentReference,
    notes,
    processedBy,
    runningBalance: newRunningBalance,
    paymentDate: new Date()
  });

  // Update totals
  this.totalPaid = (this.totalPaid || 0) + amount;
  this.remainingBalance = newRunningBalance;

  // Update status if fully paid
  if (this.remainingBalance === 0) {
    this.status = 'paid';
    this.paymentDate = new Date();
    this.paidBy = processedBy;
  }

  this.lastUpdated = new Date();

  return this.save();
};

// Virtual for sale date display
commissionSchema.virtual('saleDateDisplay').get(function() {
  if (!this.saleDate) return 'N/A';
  return new Date(this.saleDate).toLocaleDateString();
});

// Pre-save middleware to update lastUpdated and set remainingBalance
commissionSchema.pre('save', function(next) {
  this.lastUpdated = new Date();

  // Set remainingBalance to commissionAmount if it's a new document and remainingBalance is not set
  if (this.isNew && (this.remainingBalance === undefined || this.remainingBalance === null)) {
    this.remainingBalance = this.commissionAmount || 0;
  }

  // Set payment date when status changes to paid
  if (this.isModified('status') && this.status === 'paid' && !this.paymentDate) {
    this.paymentDate = new Date();
  }

  next();
});

// Static method to create commission for individual sale transaction
commissionSchema.statics.createForSale = async function(commissionData) {
  const {
    store,
    doctor,
    sale,
    saleDate,
    invoiceNumber,
    receiptNumber,
    prescriptionCount = 1,
    salesValue,
    commissionRate,
    commissionAmount
  } = commissionData;

  // Check if commission already exists for this sale
  const existingCommission = await this.findOne({ store, sale });
  if (existingCommission) {
    console.log(`Commission already exists for sale ${sale}`);
    return existingCommission;
  }

  const commissionRecord = new this({
    store,
    doctor,
    sale,
    saleDate,
    invoiceNumber,
    receiptNumber,
    prescriptionCount,
    salesValue,
    commissionRate,
    commissionAmount,
    calculatedAt: new Date(),
    lastUpdated: new Date()
  });

  return await commissionRecord.save();
};

// Legacy method for backward compatibility - now creates individual records
commissionSchema.statics.createOrUpdate = async function(commissionData) {
  // This method is kept for backward compatibility but now creates individual records
  console.warn('createOrUpdate is deprecated. Use createForSale for new implementations.');
  return await this.createForSale(commissionData);
};

// Static method to mark commission as paid
commissionSchema.statics.markAsPaid = async function(commissionId, paymentDetails = {}) {
  const { paymentMethod, paymentReference, paymentNotes, paidBy } = paymentDetails;

  // First get the commission to calculate the payment amount
  const commission = await this.findById(commissionId);
  if (!commission) {
    throw new Error('Commission not found');
  }

  const paymentAmount = commission.remainingBalance || commission.commissionAmount;

  const update = {
    status: 'paid',
    paymentDate: new Date(),
    lastUpdated: new Date(),
    totalPaid: commission.commissionAmount, // Set total paid to full commission amount
    remainingBalance: 0 // Set remaining balance to 0 for paid commissions
  };

  if (paymentMethod) update.paymentMethod = paymentMethod;
  if (paymentReference) update.paymentReference = paymentReference;
  if (paymentNotes) update.paymentNotes = paymentNotes;
  if (paidBy) update.paidBy = paidBy;

  return await this.findByIdAndUpdate(commissionId, update, { new: true });
};

module.exports = mongoose.model('Commission', commissionSchema);

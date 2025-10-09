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

  // Commission period (month/year)
  period: {
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true,
      min: 2020
    }
  },

  // Commission calculation details
  prescriptionCount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },

  salesValue: {
    type: Number,
    required: true,
    default: 0,
    min: 0
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
    default: function() {
      return this.commissionAmount || 0;
    },
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
commissionSchema.index({ store: 1, doctor: 1, 'period.month': 1, 'period.year': 1 }, { unique: true });
commissionSchema.index({ store: 1, status: 1 });
commissionSchema.index({ store: 1, paymentDate: 1 });
commissionSchema.index({ doctor: 1, status: 1 });
commissionSchema.index({ doctor: 1, paymentDate: -1 });
commissionSchema.index({ store: 1, doctor: 1, status: 1 });

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

// Virtual for period display
commissionSchema.virtual('periodDisplay').get(function() {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return `${months[this.period.month - 1]} ${this.period.year}`;
});

// Pre-save middleware to update lastUpdated
commissionSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  
  // Set payment date when status changes to paid
  if (this.isModified('status') && this.status === 'paid' && !this.paymentDate) {
    this.paymentDate = new Date();
  }
  
  next();
});

// Static method to create or update commission
commissionSchema.statics.createOrUpdate = async function(commissionData) {
  const { store, doctor, period, prescriptionCount, salesValue, commissionRate, commissionAmount } = commissionData;
  
  const filter = {
    store,
    doctor,
    'period.month': period.month,
    'period.year': period.year
  };
  
  const update = {
    prescriptionCount,
    salesValue,
    commissionRate,
    commissionAmount,
    calculatedAt: new Date(),
    lastUpdated: new Date()
  };
  
  const options = {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  };
  
  return await this.findOneAndUpdate(filter, update, options);
};

// Static method to mark commission as paid
commissionSchema.statics.markAsPaid = async function(commissionId, paymentDetails = {}) {
  const { paymentMethod, paymentReference, paymentNotes, paidBy } = paymentDetails;
  
  const update = {
    status: 'paid',
    paymentDate: new Date(),
    lastUpdated: new Date()
  };
  
  if (paymentMethod) update.paymentMethod = paymentMethod;
  if (paymentReference) update.paymentReference = paymentReference;
  if (paymentNotes) update.paymentNotes = paymentNotes;
  if (paidBy) update.paidBy = paidBy;
  
  return await this.findByIdAndUpdate(commissionId, update, { new: true });
};

module.exports = mongoose.model('Commission', commissionSchema);

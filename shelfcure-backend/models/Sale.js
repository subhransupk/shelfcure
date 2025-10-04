const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  // Store reference
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },

  // Customer reference (optional for walk-in customers)
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },

  // Sale items
  items: [{
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitType: {
      type: String,
      enum: ['strip', 'individual'],
      default: 'strip'
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    // Batch information for tracking (can be multiple batches per item)
    batchInfo: [{
      batchNumber: String,
      expiryDate: Date,
      manufacturingDate: Date,
      quantityUsed: Number
    }],

    // Legacy single batch field (kept for backward compatibility)
    batch: {
      batchNumber: String,
      expiryDate: Date,
      manufacturingDate: Date
    }
  }],

  // Pricing details
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100 // Percentage
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountType: {
    id: { type: String, required: false },
    name: { type: String, required: false },
    type: { type: String, required: false },
    value: { type: Number, required: false },
    maxValue: { type: Number, required: false }
  },
  taxRate: {
    type: Number,
    default: 18, // GST rate in percentage
    min: 0
  },
  gstAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalTaxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  taxBreakdown: [{
    name: String,
    rate: Number,
    amount: Number
  }],

  // New fields for tax and discount selection
  applyDiscount: {
    type: Boolean,
    default: false
  },
  selectedDiscount: {
    id: { type: String, required: false },
    name: { type: String, required: false },
    type: { type: String, required: false },
    value: { type: Number, required: false },
    maxValue: { type: Number, required: false }
  },
  applyTax: {
    type: Boolean,
    default: false
  },
  selectedTax: {
    id: { type: String, required: false },
    name: { type: String, required: false },
    type: { type: String, required: false },
    rate: { type: Number, required: false },
    category: { type: String, required: false }
  },

  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },

  // Payment details
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'credit', 'online'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'partial', 'refunded'],
    default: 'paid'
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

  // Transaction details
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },

  // Staff who processed the sale
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Additional information
  notes: {
    type: String,
    maxlength: 500
  },
  
  // Doctor prescription reference (if applicable)
  prescription: {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    prescriptionNumber: String,
    prescriptionDate: Date,
    // Attachment for uploaded prescription (image/PDF)
    attachment: {
      filename: String,
      path: String,
      url: String,
      mimetype: String,
      size: Number,
      uploadedAt: Date
    }
  },

  // Return/refund information
  isReturned: {
    type: Boolean,
    default: false
  },
  returnDate: Date,
  returnReason: String,
  returnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Status
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled', 'returned'],
    default: 'completed'
  },

  // Metadata
  saleDate: {
    type: Date,
    default: Date.now
  },
  fiscalYear: String,
  quarter: String,
  month: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
saleSchema.index({ store: 1, createdAt: -1 });
saleSchema.index({ customer: 1, createdAt: -1 });
saleSchema.index({ receiptNumber: 1 });
saleSchema.index({ invoiceNumber: 1 });
saleSchema.index({ createdBy: 1 });
saleSchema.index({ saleDate: 1 });
saleSchema.index({ status: 1 });

// Virtual for total items count
saleSchema.virtual('totalItems').get(function() {
  return this.items && Array.isArray(this.items) ? this.items.reduce((total, item) => total + item.quantity, 0) : 0;
});

// Virtual for profit calculation (requires cost price from medicine)
saleSchema.virtual('estimatedProfit').get(function() {
  // This would need to be calculated based on medicine cost prices
  return 0; // Placeholder
});

// Pre-save middleware to generate receipt number
saleSchema.pre('save', async function(next) {
  if (this.isNew && !this.receiptNumber) {
    const count = await this.constructor.countDocuments({ store: this.store });
    const storeCode = await mongoose.model('Store').findById(this.store).select('code');
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    this.receiptNumber = `${storeCode?.code || 'ST'}-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
  }

  // Set fiscal year, quarter, and month for reporting
  const saleDate = this.saleDate || new Date();
  const year = saleDate.getFullYear();
  const month = saleDate.getMonth() + 1;
  
  this.fiscalYear = month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  this.quarter = Math.ceil(((month + 8) % 12 + 1) / 3);
  this.month = saleDate.toISOString().slice(0, 7); // YYYY-MM format

  next();
});

// Post-save middleware to update doctor statistics
saleSchema.post('save', async function() {
  // Only update doctor stats for completed sales with prescriptions
  if (this.status === 'completed' && this.prescription && this.prescription.doctor) {
    try {
      const DoctorStatsService = require('../services/doctorStatsService');
      await DoctorStatsService.updateDoctorStats(this.prescription.doctor, this.store);
      console.log(`✅ Doctor stats updated for doctor ${this.prescription.doctor}`);
    } catch (error) {
      console.error('❌ Error updating doctor stats after sale:', error);
      // Don't fail the sale if stats update fails
    }
  }
});

// Post-update middleware to handle status changes
saleSchema.post('findOneAndUpdate', async function(doc) {
  if (doc && doc.status === 'completed' && doc.prescription && doc.prescription.doctor) {
    try {
      const DoctorStatsService = require('../services/doctorStatsService');
      await DoctorStatsService.updateDoctorStats(doc.prescription.doctor, doc.store);
      console.log(`✅ Doctor stats updated for doctor ${doc.prescription.doctor} after status change`);
    } catch (error) {
      console.error('❌ Error updating doctor stats after sale update:', error);
    }
  }
});

// Static method to get sales summary
saleSchema.statics.getSalesSummary = function(storeId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        store: new mongoose.Types.ObjectId(storeId),
        saleDate: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        totalItems: { $sum: { $sum: '$items.quantity' } },
        averageOrderValue: { $avg: '$totalAmount' }
      }
    }
  ]);
};

// Static method to get top selling medicines
saleSchema.statics.getTopSellingMedicines = function(storeId, startDate, endDate, limit = 10) {
  return this.aggregate([
    {
      $match: {
        store: new mongoose.Types.ObjectId(storeId),
        saleDate: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.medicine',
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.totalPrice' },
        salesCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'medicines',
        localField: '_id',
        foreignField: '_id',
        as: 'medicine'
      }
    },
    { $unwind: '$medicine' },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit }
  ]);
};

module.exports = mongoose.model('Sale', saleSchema);

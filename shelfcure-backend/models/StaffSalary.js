const mongoose = require('mongoose');

const staffSalarySchema = new mongoose.Schema({
  // Staff Information
  staff: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Staff member is required'],
    index: true
  },
  store: {
    type: mongoose.Schema.ObjectId,
    ref: 'Store',
    required: [true, 'Store is required'],
    index: true
  },
  storeOwner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Store owner is required'],
    index: true
  },
  
  // Salary Period
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: [true, 'Year is required']
  },
  
  // Salary Structure
  baseSalary: {
    type: Number,
    required: [true, 'Base salary is required'],
    min: [0, 'Base salary cannot be negative']
  },
  
  // Allowances
  allowances: {
    hra: { // House Rent Allowance
      type: Number,
      default: 0
    },
    da: { // Dearness Allowance
      type: Number,
      default: 0
    },
    medical: {
      type: Number,
      default: 0
    },
    transport: {
      type: Number,
      default: 0
    },
    bonus: {
      type: Number,
      default: 0
    },
    incentive: {
      type: Number,
      default: 0
    },
    overtime: {
      hours: {
        type: Number,
        default: 0
      },
      rate: {
        type: Number,
        default: 0
      },
      amount: {
        type: Number,
        default: 0
      }
    },
    other: [{
      name: String,
      amount: Number,
      description: String
    }]
  },
  
  // Deductions
  deductions: {
    pf: { // Provident Fund
      type: Number,
      default: 0
    },
    esi: { // Employee State Insurance
      type: Number,
      default: 0
    },
    tds: { // Tax Deducted at Source
      type: Number,
      default: 0
    },
    advance: {
      type: Number,
      default: 0
    },
    loan: {
      type: Number,
      default: 0
    },
    fine: {
      type: Number,
      default: 0
    },
    absentDeduction: {
      days: {
        type: Number,
        default: 0
      },
      amount: {
        type: Number,
        default: 0
      }
    },
    other: [{
      name: String,
      amount: Number,
      description: String
    }]
  },
  
  // Attendance Data
  attendanceData: {
    totalWorkingDays: {
      type: Number,
      required: true
    },
    daysWorked: {
      type: Number,
      required: true
    },
    daysAbsent: {
      type: Number,
      default: 0
    },
    halfDays: {
      type: Number,
      default: 0
    },
    overtimeHours: {
      type: Number,
      default: 0
    },
    leaveDays: {
      type: Number,
      default: 0
    }
  },
  
  // Calculated Amounts
  grossSalary: {
    type: Number,
    required: true
  },
  totalAllowances: {
    type: Number,
    default: 0
  },
  totalDeductions: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    required: true
  },
  
  // Payment Information
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'cancelled', 'on_hold'],
    default: 'pending'
  },
  paymentDate: Date,
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'cheque', 'upi', 'other'],
    default: 'bank_transfer'
  },
  paymentReference: String,
  
  // Bank Details (if bank transfer)
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountHolderName: String
  },
  
  // Approval Workflow
  approvalStatus: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'rejected'],
    default: 'draft'
  },
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  
  // Additional Information
  notes: String,
  payslipGenerated: {
    type: Boolean,
    default: false
  },
  payslipUrl: String,
  
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

// Compound indexes
staffSalarySchema.index({ staff: 1, month: 1, year: 1 }, { unique: true });
staffSalarySchema.index({ store: 1, month: 1, year: 1 });
staffSalarySchema.index({ storeOwner: 1, month: 1, year: 1 });
staffSalarySchema.index({ paymentStatus: 1 });
staffSalarySchema.index({ approvalStatus: 1 });

// Virtual for salary period
staffSalarySchema.virtual('salaryPeriod').get(function() {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[this.month - 1]} ${this.year}`;
});

// Virtual for attendance percentage
staffSalarySchema.virtual('attendancePercentage').get(function() {
  if (this.attendanceData.totalWorkingDays === 0) return 0;
  return Math.round((this.attendanceData.daysWorked / this.attendanceData.totalWorkingDays) * 100);
});

// Pre-save middleware to calculate totals
staffSalarySchema.pre('save', function(next) {
  // Calculate total allowances
  this.totalAllowances = 
    (this.allowances.hra || 0) +
    (this.allowances.da || 0) +
    (this.allowances.medical || 0) +
    (this.allowances.transport || 0) +
    (this.allowances.bonus || 0) +
    (this.allowances.incentive || 0) +
    (this.allowances.overtime.amount || 0) +
    (this.allowances.other || []).reduce((sum, item) => sum + (item.amount || 0), 0);
  
  // Calculate total deductions
  this.totalDeductions = 
    (this.deductions.pf || 0) +
    (this.deductions.esi || 0) +
    (this.deductions.tds || 0) +
    (this.deductions.advance || 0) +
    (this.deductions.loan || 0) +
    (this.deductions.fine || 0) +
    (this.deductions.absentDeduction.amount || 0) +
    (this.deductions.other || []).reduce((sum, item) => sum + (item.amount || 0), 0);
  
  // Calculate gross salary
  this.grossSalary = this.baseSalary + this.totalAllowances;
  
  // Calculate net salary
  this.netSalary = this.grossSalary - this.totalDeductions;
  
  next();
});

// Static method to get salary summary for store owner
staffSalarySchema.statics.getSalarySummary = async function(storeOwnerId, month, year) {
  const pipeline = [
    {
      $match: {
        storeOwner: mongoose.Types.ObjectId(storeOwnerId),
        month: month,
        year: year
      }
    },
    {
      $group: {
        _id: null,
        totalStaff: { $sum: 1 },
        totalGrossSalary: { $sum: '$grossSalary' },
        totalNetSalary: { $sum: '$netSalary' },
        totalAllowances: { $sum: '$totalAllowances' },
        totalDeductions: { $sum: '$totalDeductions' },
        paidSalaries: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0]
          }
        },
        pendingSalaries: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0]
          }
        },
        totalPaidAmount: {
          $sum: {
            $cond: [
              { $eq: ['$paymentStatus', 'paid'] },
              '$netSalary',
              0
            ]
          }
        },
        totalPendingAmount: {
          $sum: {
            $cond: [
              { $eq: ['$paymentStatus', 'pending'] },
              '$netSalary',
              0
            ]
          }
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalStaff: 0,
    totalGrossSalary: 0,
    totalNetSalary: 0,
    totalAllowances: 0,
    totalDeductions: 0,
    paidSalaries: 0,
    pendingSalaries: 0,
    totalPaidAmount: 0,
    totalPendingAmount: 0
  };
};

// Static method to get store-wise salary breakdown
staffSalarySchema.statics.getStoreWiseSalarySummary = async function(storeOwnerId, month, year) {
  const pipeline = [
    {
      $match: {
        storeOwner: mongoose.Types.ObjectId(storeOwnerId),
        month: month,
        year: year
      }
    },
    {
      $group: {
        _id: '$store',
        totalStaff: { $sum: 1 },
        totalGrossSalary: { $sum: '$grossSalary' },
        totalNetSalary: { $sum: '$netSalary' },
        paidAmount: {
          $sum: {
            $cond: [
              { $eq: ['$paymentStatus', 'paid'] },
              '$netSalary',
              0
            ]
          }
        },
        pendingAmount: {
          $sum: {
            $cond: [
              { $eq: ['$paymentStatus', 'pending'] },
              '$netSalary',
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'stores',
        localField: '_id',
        foreignField: '_id',
        as: 'storeInfo'
      }
    },
    {
      $unwind: '$storeInfo'
    },
    {
      $project: {
        storeId: '$_id',
        storeName: '$storeInfo.name',
        storeCode: '$storeInfo.code',
        totalStaff: 1,
        totalGrossSalary: 1,
        totalNetSalary: 1,
        paidAmount: 1,
        pendingAmount: 1
      }
    }
  ];

  return await this.aggregate(pipeline);
};

module.exports = mongoose.model('StaffSalary', staffSalarySchema);

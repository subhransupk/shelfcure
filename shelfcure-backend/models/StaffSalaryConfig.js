const mongoose = require('mongoose');

const staffSalaryConfigSchema = new mongoose.Schema({
  // Staff Information
  staff: {
    type: mongoose.Schema.ObjectId,
    ref: 'Staff',
    required: [true, 'Staff member is required'],
    unique: true,
    index: true
  },
  store: {
    type: mongoose.Schema.ObjectId,
    ref: 'Store',
    required: [true, 'Store is required'],
    index: true
  },
  
  // Basic Salary Configuration
  baseSalary: {
    type: Number,
    required: [true, 'Base salary is required'],
    min: [0, 'Base salary cannot be negative']
  },
  salaryType: {
    type: String,
    enum: ['monthly', 'daily', 'hourly'],
    default: 'monthly'
  },
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Working Hours Configuration
  standardWorkingHours: {
    daily: {
      type: Number,
      default: 8,
      min: [1, 'Daily working hours must be at least 1']
    },
    weekly: {
      type: Number,
      default: 48,
      min: [1, 'Weekly working hours must be at least 1']
    },
    monthly: {
      type: Number,
      default: 208, // 26 days * 8 hours
      min: [1, 'Monthly working hours must be at least 1']
    }
  },
  
  // Overtime Configuration
  overtimeConfig: {
    enabled: {
      type: Boolean,
      default: true
    },
    rate: {
      type: Number,
      default: 1.5, // 1.5x of hourly rate
      min: [1, 'Overtime rate must be at least 1x']
    },
    maxHoursPerDay: {
      type: Number,
      default: 4,
      min: [0, 'Max overtime hours cannot be negative']
    },
    maxHoursPerMonth: {
      type: Number,
      default: 60,
      min: [0, 'Max overtime hours cannot be negative']
    }
  },
  
  // Standard Allowances
  allowances: {
    hra: { // House Rent Allowance
      enabled: { type: Boolean, default: false },
      amount: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }, // % of basic salary
      type: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' }
    },
    da: { // Dearness Allowance
      enabled: { type: Boolean, default: false },
      amount: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
      type: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' }
    },
    transport: {
      enabled: { type: Boolean, default: false },
      amount: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
      type: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' }
    },
    medical: {
      enabled: { type: Boolean, default: false },
      amount: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
      type: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' }
    },
    performance: {
      enabled: { type: Boolean, default: false },
      amount: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
      type: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' }
    }
  },
  
  // Standard Deductions
  deductions: {
    pf: { // Provident Fund
      enabled: { type: Boolean, default: false },
      employeeContribution: { type: Number, default: 12 }, // % of basic salary
      employerContribution: { type: Number, default: 12 }
    },
    esi: { // Employee State Insurance
      enabled: { type: Boolean, default: false },
      employeeContribution: { type: Number, default: 0.75 }, // % of gross salary
      employerContribution: { type: Number, default: 3.25 }
    },
    tds: { // Tax Deducted at Source
      enabled: { type: Boolean, default: false },
      percentage: { type: Number, default: 0 }
    },
    professionalTax: {
      enabled: { type: Boolean, default: false },
      amount: { type: Number, default: 200 }
    }
  },
  
  // Pay Schedule
  paySchedule: {
    frequency: {
      type: String,
      enum: ['monthly', 'bi-weekly', 'weekly'],
      default: 'monthly'
    },
    payDay: {
      type: Number,
      default: 1, // 1st of every month
      min: [1, 'Pay day must be between 1-31'],
      max: [31, 'Pay day must be between 1-31']
    }
  },
  
  // Bank Details for Salary Transfer
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountHolderName: String,
    branchName: String
  },
  
  // Status and Dates
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  effectiveTo: Date,
  
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

// Indexes
staffSalaryConfigSchema.index({ staff: 1 }, { unique: true });
staffSalaryConfigSchema.index({ store: 1 });
staffSalaryConfigSchema.index({ status: 1 });

// Virtual for hourly rate calculation
staffSalaryConfigSchema.virtual('hourlyRate').get(function() {
  if (this.salaryType === 'hourly') {
    return this.baseSalary;
  } else if (this.salaryType === 'daily') {
    return this.baseSalary / this.standardWorkingHours.daily;
  } else {
    // Monthly salary
    return this.baseSalary / this.standardWorkingHours.monthly;
  }
});

// Virtual for daily rate calculation
staffSalaryConfigSchema.virtual('dailyRate').get(function() {
  if (this.salaryType === 'daily') {
    return this.baseSalary;
  } else if (this.salaryType === 'hourly') {
    return this.baseSalary * this.standardWorkingHours.daily;
  } else {
    // Monthly salary
    return this.baseSalary / 30; // Assuming 30 days in a month
  }
});

// Method to calculate allowances
staffSalaryConfigSchema.methods.calculateAllowances = function() {
  const allowances = {};
  let total = 0;
  
  Object.keys(this.allowances).forEach(key => {
    const allowance = this.allowances[key];
    if (allowance.enabled) {
      if (allowance.type === 'percentage') {
        allowances[key] = (this.baseSalary * allowance.percentage) / 100;
      } else {
        allowances[key] = allowance.amount;
      }
      total += allowances[key];
    } else {
      allowances[key] = 0;
    }
  });
  
  return { breakdown: allowances, total };
};

// Method to calculate deductions
staffSalaryConfigSchema.methods.calculateDeductions = function(grossSalary) {
  const deductions = {};
  let total = 0;
  
  // PF calculation
  if (this.deductions.pf.enabled) {
    deductions.pf = (this.baseSalary * this.deductions.pf.employeeContribution) / 100;
    total += deductions.pf;
  } else {
    deductions.pf = 0;
  }
  
  // ESI calculation
  if (this.deductions.esi.enabled) {
    deductions.esi = (grossSalary * this.deductions.esi.employeeContribution) / 100;
    total += deductions.esi;
  } else {
    deductions.esi = 0;
  }
  
  // TDS calculation
  if (this.deductions.tds.enabled) {
    deductions.tds = (grossSalary * this.deductions.tds.percentage) / 100;
    total += deductions.tds;
  } else {
    deductions.tds = 0;
  }
  
  // Professional Tax
  if (this.deductions.professionalTax.enabled) {
    deductions.professionalTax = this.deductions.professionalTax.amount;
    total += deductions.professionalTax;
  } else {
    deductions.professionalTax = 0;
  }
  
  return { breakdown: deductions, total };
};

// Static method to get default salary config for a role
staffSalaryConfigSchema.statics.getDefaultConfigForRole = function(role) {
  const defaults = {
    'store_manager': {
      baseSalary: 25000,
      allowances: {
        hra: { enabled: true, percentage: 40, type: 'percentage' },
        transport: { enabled: true, amount: 2000, type: 'fixed' }
      }
    },
    'pharmacist': {
      baseSalary: 18000,
      allowances: {
        hra: { enabled: true, percentage: 30, type: 'percentage' },
        transport: { enabled: true, amount: 1500, type: 'fixed' }
      }
    },
    'sales_assistant': {
      baseSalary: 12000,
      allowances: {
        transport: { enabled: true, amount: 1000, type: 'fixed' }
      }
    },
    'cashier': {
      baseSalary: 10000,
      allowances: {
        transport: { enabled: true, amount: 800, type: 'fixed' }
      }
    }
  };
  
  return defaults[role] || defaults['sales_assistant'];
};

module.exports = mongoose.model('StaffSalaryConfig', staffSalaryConfigSchema);

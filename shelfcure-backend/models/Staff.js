const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Staff name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    uppercase: true
  },

  // Role and Department
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['store_manager', 'pharmacist', 'assistant', 'cashier', 'inventory_manager', 'sales_executive', 'supervisor'],
      message: 'Role must be one of: store_manager, pharmacist, assistant, cashier, inventory_manager, sales_executive, supervisor'
    }
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: {
      values: ['pharmacy', 'sales', 'inventory', 'administration', 'customer_service'],
      message: 'Department must be one of: pharmacy, sales, inventory, administration, customer_service'
    }
  },

  // Employment Details
  dateOfJoining: {
    type: Date,
    required: [true, 'Date of joining is required']
  },
  salary: {
    type: Number,
    required: [true, 'Salary is required'],
    min: [0, 'Salary cannot be negative']
  },
  workingHours: {
    type: String,
    required: [true, 'Working hours are required'],
    enum: {
      values: ['full_time', 'part_time', 'contract'],
      message: 'Working hours must be one of: full_time, part_time, contract'
    }
  },

  // Personal Information
  address: {
    street: String,
    city: String,
    state: String,
    pincode: {
      type: String,
      match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit pincode']
    }
  },
  dateOfBirth: {
    type: Date
  },
  emergencyContact: {
    name: String,
    phone: {
      type: String,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    relationship: String
  },

  // Qualifications and Certifications
  qualifications: [{
    degree: String,
    institution: String,
    year: Number
  }],
  certifications: [{
    name: String,
    issuedBy: String,
    validUntil: Date
  }],

  // Store Association
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store is required']
  },

  // Performance and Attendance
  performanceRating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  totalLeaves: {
    type: Number,
    default: 0
  },
  attendancePercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },

  // Status and Access
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave', 'terminated'],
    default: 'active'
  },
  hasSystemAccess: {
    type: Boolean,
    default: false
  },
  permissions: [{
    type: String,
    enum: ['inventory_read', 'inventory_write', 'sales_read', 'sales_write', 'reports_read', 'customer_management']
  }],

  // User Account Reference (for staff with system access)
  userAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Activity Tracking
  lastSeen: {
    type: Date,
    default: null
  },
  lastActivity: {
    type: Date,
    default: null
  },

  // Audit Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better performance
staffSchema.index({ store: 1 });
staffSchema.index({ email: 1 });
staffSchema.index({ role: 1 });
staffSchema.index({ status: 1 });
staffSchema.index({ store: 1, status: 1 });
staffSchema.index({ userAccount: 1 }); // For linking to User accounts

// Compound unique index: employeeId must be unique per store
staffSchema.index({ store: 1, employeeId: 1 }, { unique: true });

// Virtual for full name display
staffSchema.virtual('displayName').get(function() {
  return this.name;
});

// Virtual for experience calculation
staffSchema.virtual('experience').get(function() {
  if (!this.dateOfJoining) return 0;
  const now = new Date();
  const joining = new Date(this.dateOfJoining);
  const diffTime = Math.abs(now - joining);
  const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
  return diffYears;
});

// Note: EmployeeId generation is handled in the controller to ensure
// role-based prefixes and proper uniqueness checking

module.exports = mongoose.model('Staff', staffSchema);

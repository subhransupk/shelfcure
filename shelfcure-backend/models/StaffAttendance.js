const mongoose = require('mongoose');

const staffAttendanceSchema = new mongoose.Schema({
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
  
  // Date Information
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  
  // Attendance Status
  status: {
    type: String,
    enum: ['present', 'absent', 'half_day', 'late', 'sick_leave', 'casual_leave', 'holiday'],
    required: [true, 'Attendance status is required']
  },
  
  // Time Tracking
  checkIn: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    method: {
      type: String,
      enum: ['manual', 'biometric', 'mobile_app', 'web'],
      default: 'manual'
    }
  },
  checkOut: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    method: {
      type: String,
      enum: ['manual', 'biometric', 'mobile_app', 'web'],
      default: 'manual'
    }
  },
  
  // Working Hours
  workingHours: {
    scheduled: {
      type: Number,
      default: 8 // 8 hours default
    },
    actual: {
      type: Number,
      default: 0
    },
    overtime: {
      type: Number,
      default: 0
    },
    break: {
      type: Number,
      default: 0
    }
  },
  
  // Leave Information (if applicable)
  leaveDetails: {
    type: {
      type: String,
      enum: ['sick', 'casual', 'emergency', 'maternity', 'paternity', 'annual', 'other']
    },
    reason: String,
    appliedDate: Date,
    approvedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    approvedDate: Date,
    documents: [{
      filename: String,
      url: String,
      uploadDate: Date
    }]
  },
  
  // Performance and Notes
  performance: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    notes: String,
    tasks_completed: Number,
    customer_interactions: Number
  },
  
  // Administrative
  notes: String,
  isHoliday: {
    type: Boolean,
    default: false
  },
  holidayName: String,
  
  // Approval Status
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  
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

// Compound indexes for efficient queries
staffAttendanceSchema.index({ staff: 1, date: 1 }, { unique: true });
staffAttendanceSchema.index({ store: 1, date: 1 });
staffAttendanceSchema.index({ storeOwner: 1, month: 1, year: 1 });
staffAttendanceSchema.index({ status: 1 });

// Virtual for formatted date
staffAttendanceSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-IN');
});

// Virtual for total hours worked
staffAttendanceSchema.virtual('totalHours').get(function() {
  if (this.checkIn.time && this.checkOut.time) {
    const diffMs = this.checkOut.time - this.checkIn.time;
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
  }
  return this.workingHours.actual || 0;
});

// Virtual for late arrival
staffAttendanceSchema.virtual('isLate').get(function() {
  return this.status === 'late' || this.status === 'half_day';
});

// Pre-save middleware to calculate working hours
staffAttendanceSchema.pre('save', function(next) {
  // Set month and year from date
  if (this.date) {
    this.month = this.date.getMonth() + 1;
    this.year = this.date.getFullYear();
  }
  
  // Calculate actual working hours if check-in and check-out times are available
  if (this.checkIn.time && this.checkOut.time) {
    const diffMs = this.checkOut.time - this.checkIn.time;
    const totalHours = diffMs / (1000 * 60 * 60);
    this.workingHours.actual = Math.round(totalHours * 100) / 100;
    
    // Calculate overtime (if worked more than scheduled hours)
    if (totalHours > this.workingHours.scheduled) {
      this.workingHours.overtime = Math.round((totalHours - this.workingHours.scheduled) * 100) / 100;
    }
  }
  
  next();
});

// Static method to get attendance summary for a staff member
staffAttendanceSchema.statics.getAttendanceSummary = async function(staffId, month, year) {
  const pipeline = [
    {
      $match: {
        staff: mongoose.Types.ObjectId(staffId),
        month: month,
        year: year
      }
    },
    {
      $group: {
        _id: null,
        totalDays: { $sum: 1 },
        presentDays: {
          $sum: {
            $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
          }
        },
        absentDays: {
          $sum: {
            $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
          }
        },
        halfDays: {
          $sum: {
            $cond: [{ $eq: ['$status', 'half_day'] }, 1, 0]
          }
        },
        lateDays: {
          $sum: {
            $cond: [{ $eq: ['$status', 'late'] }, 1, 0]
          }
        },
        leaveDays: {
          $sum: {
            $cond: [
              { $in: ['$status', ['sick_leave', 'casual_leave']] },
              1,
              0
            ]
          }
        },
        totalHours: { $sum: '$workingHours.actual' },
        overtimeHours: { $sum: '$workingHours.overtime' }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    halfDays: 0,
    lateDays: 0,
    leaveDays: 0,
    totalHours: 0,
    overtimeHours: 0
  };
};

// Static method to get store attendance summary
staffAttendanceSchema.statics.getStoreAttendanceSummary = async function(storeId, month, year) {
  const pipeline = [
    {
      $match: {
        store: mongoose.Types.ObjectId(storeId),
        month: month,
        year: year
      }
    },
    {
      $group: {
        _id: '$staff',
        totalDays: { $sum: 1 },
        presentDays: {
          $sum: {
            $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
          }
        },
        absentDays: {
          $sum: {
            $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
          }
        },
        totalHours: { $sum: '$workingHours.actual' },
        overtimeHours: { $sum: '$workingHours.overtime' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'staffInfo'
      }
    },
    {
      $unwind: '$staffInfo'
    },
    {
      $project: {
        staffId: '$_id',
        staffName: '$staffInfo.name',
        staffEmail: '$staffInfo.email',
        totalDays: 1,
        presentDays: 1,
        absentDays: 1,
        totalHours: 1,
        overtimeHours: 1,
        attendancePercentage: {
          $multiply: [
            { $divide: ['$presentDays', '$totalDays'] },
            100
          ]
        }
      }
    }
  ];

  return await this.aggregate(pipeline);
};

module.exports = mongoose.model('StaffAttendance', staffAttendanceSchema);

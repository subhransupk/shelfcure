const StaffAttendance = require('../models/StaffAttendance');
const Staff = require('../models/Staff');
const asyncHandler = require('express-async-handler');

// @desc    Get attendance records for a specific date or date range
// @route   GET /api/store-manager/attendance
// @access  Private (Store Manager only)
const getAttendance = asyncHandler(async (req, res) => {
  const { date, startDate, endDate, status } = req.query;
  const store = req.store;
  const storeId = store._id;

  try {
    console.log(`🔍 Fetching attendance for store: ${store.name} (${storeId})`);
    
    let query = { store: storeId };

    // Handle date filtering
    if (date) {
      // Single date
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.date = {
        $gte: targetDate,
        $lt: nextDay
      };
    } else if (startDate && endDate) {
      // Date range
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      query.date = {
        $gte: today,
        $lt: tomorrow
      };
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    console.log('📋 Attendance query:', JSON.stringify(query));

    // Get attendance records with staff details
    const attendanceRecords = await StaffAttendance.find(query)
      .populate({
        path: 'staff',
        select: 'name email phone employeeId role department'
      })
      .sort({ 'staff.name': 1 })
      .lean();

    console.log(`✅ Found ${attendanceRecords.length} attendance records`);

    res.status(200).json({
      success: true,
      count: attendanceRecords.length,
      data: attendanceRecords
    });

  } catch (error) {
    console.error('❌ Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching attendance records',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Mark attendance for staff members
// @route   POST /api/store-manager/attendance/mark
// @access  Private (Store Manager only)
const markAttendance = asyncHandler(async (req, res) => {
  const { staffId, date, status, checkIn, checkOut, notes } = req.body;
  const store = req.store;
  const storeId = store._id;

  try {
    console.log(`📝 Marking attendance for staff: ${staffId}, status: ${status}`);

    // Validate staff belongs to this store
    const staff = await Staff.findOne({ _id: staffId, store: storeId });
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found in this store'
      });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Validate attendance date is not before staff joining date
    const joiningDate = new Date(staff.dateOfJoining);
    joiningDate.setHours(0, 0, 0, 0);

    if (attendanceDate < joiningDate) {
      return res.status(400).json({
        success: false,
        message: `Cannot mark attendance for ${staff.name} before their joining date (${joiningDate.toLocaleDateString()})`
      });
    }

    // Check if attendance already exists for this date
    let attendance = await StaffAttendance.findOne({
      staff: staffId,
      date: attendanceDate
    });

    const attendanceData = {
      staff: staffId,
      store: storeId,
      date: attendanceDate,
      month: attendanceDate.getMonth() + 1,
      year: attendanceDate.getFullYear(),
      notes: notes || '',
      updatedBy: req.user._id
    };

    // Only set status if provided (for check-out only updates)
    if (status) {
      attendanceData.status = status;
    }

    // Handle check-in/check-out times
    if (checkIn) {
      attendanceData.checkIn = {
        time: new Date(checkIn),
        method: 'manual'
      };
    }

    if (checkOut) {
      attendanceData.checkOut = {
        time: new Date(checkOut),
        method: 'manual'
      };
    }

    if (attendance) {
      // Update existing attendance
      attendance = await StaffAttendance.findByIdAndUpdate(
        attendance._id,
        attendanceData,
        { new: true, runValidators: true }
      ).populate({
        path: 'staff',
        select: 'name email phone employeeId role department'
      });

      console.log(`✅ Updated attendance for ${staff.name}`);
    } else {
      // Create new attendance record
      attendanceData.createdBy = req.user._id;
      attendance = await StaffAttendance.create(attendanceData);
      
      attendance = await StaffAttendance.findById(attendance._id).populate({
        path: 'staff',
        select: 'name email phone employeeId role department'
      });

      console.log(`✅ Created new attendance record for ${staff.name}`);
    }

    const message = status
      ? `Attendance marked as ${status} for ${staff.name}`
      : `Check-out time updated for ${staff.name}`;

    res.status(200).json({
      success: true,
      message: message,
      data: attendance
    });

  } catch (error) {
    console.error('❌ Mark attendance error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this staff member on this date'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while marking attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get attendance statistics for a specific date
// @route   GET /api/store-manager/attendance/stats
// @access  Private (Store Manager only)
const getAttendanceStats = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const store = req.store;
  const storeId = store._id;

  try {
    console.log(`📊 Getting attendance stats for store: ${store.name}`);

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get all staff in the store who were employed on the target date
    const totalStaff = await Staff.countDocuments({
      store: storeId,
      status: 'active',
      dateOfJoining: { $lte: targetDate }
    });

    // Get attendance statistics (only for staff who were employed on the target date)
    const stats = await StaffAttendance.aggregate([
      {
        $match: {
          store: storeId,
          date: {
            $gte: targetDate,
            $lt: nextDay
          }
        }
      },
      {
        $lookup: {
          from: 'staff',
          localField: 'staff',
          foreignField: '_id',
          as: 'staffDetails'
        }
      },
      { $unwind: '$staffDetails' },
      {
        $match: {
          $expr: {
            $gte: ['$date', '$staffDetails.dateOfJoining']
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Process stats into a more usable format
    const attendanceStats = {
      totalStaff,
      present: 0,
      absent: 0,
      late: 0,
      onLeave: 0,
      notMarked: totalStaff
    };

    stats.forEach(stat => {
      switch (stat._id) {
        case 'present':
          attendanceStats.present = stat.count;
          break;
        case 'absent':
          attendanceStats.absent = stat.count;
          break;
        case 'late':
          attendanceStats.late = stat.count;
          break;
        case 'sick_leave':
        case 'casual_leave':
          attendanceStats.onLeave += stat.count;
          break;
      }
    });

    // Calculate not marked (total staff - all marked attendance)
    const totalMarked = stats.reduce((sum, stat) => sum + stat.count, 0);
    attendanceStats.notMarked = Math.max(0, totalStaff - totalMarked);

    console.log('📊 Attendance stats:', attendanceStats);

    res.status(200).json({
      success: true,
      date: targetDate.toISOString().split('T')[0],
      data: attendanceStats
    });

  } catch (error) {
    console.error('❌ Get attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching attendance statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Bulk mark attendance for all staff
// @route   POST /api/store-manager/attendance/bulk
// @access  Private (Store Manager only)
const bulkMarkAttendance = asyncHandler(async (req, res) => {
  const { date, attendanceData } = req.body; // attendanceData: [{ staffId, status, checkIn?, checkOut? }]
  const store = req.store;
  const storeId = store._id;

  try {
    console.log(`📝 Bulk marking attendance for ${attendanceData.length} staff members`);

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const results = [];
    const errors = [];

    for (const data of attendanceData) {
      try {
        // Validate staff belongs to this store
        const staff = await Staff.findOne({ _id: data.staffId, store: storeId });
        if (!staff) {
          errors.push({ staffId: data.staffId, error: 'Staff not found in this store' });
          continue;
        }

        // Validate attendance date is not before staff joining date
        const joiningDate = new Date(staff.dateOfJoining);
        joiningDate.setHours(0, 0, 0, 0);

        if (attendanceDate < joiningDate) {
          errors.push({
            staffId: data.staffId,
            error: `Cannot mark attendance before joining date (${joiningDate.toLocaleDateString()})`
          });
          continue;
        }

        // Check if attendance already exists
        let attendance = await StaffAttendance.findOne({
          staff: data.staffId,
          date: attendanceDate
        });

        const attendanceRecord = {
          staff: data.staffId,
          store: storeId,
          date: attendanceDate,
          month: attendanceDate.getMonth() + 1,
          year: attendanceDate.getFullYear(),
          status: data.status,
          notes: data.notes || '',
          updatedBy: req.user._id
        };

        if (data.checkIn) {
          attendanceRecord.checkIn = {
            time: new Date(data.checkIn),
            method: 'manual'
          };
        }

        if (data.checkOut) {
          attendanceRecord.checkOut = {
            time: new Date(data.checkOut),
            method: 'manual'
          };
        }

        if (attendance) {
          attendance = await StaffAttendance.findByIdAndUpdate(
            attendance._id,
            attendanceRecord,
            { new: true, runValidators: true }
          );
        } else {
          attendanceRecord.createdBy = req.user._id;
          attendance = await StaffAttendance.create(attendanceRecord);
        }

        results.push({ staffId: data.staffId, success: true, attendanceId: attendance._id });

      } catch (error) {
        errors.push({ staffId: data.staffId, error: error.message });
      }
    }

    console.log(`✅ Bulk attendance: ${results.length} successful, ${errors.length} errors`);

    res.status(200).json({
      success: true,
      message: `Bulk attendance processed: ${results.length} successful, ${errors.length} errors`,
      data: {
        successful: results,
        errors: errors
      }
    });

  } catch (error) {
    console.error('❌ Bulk mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while bulk marking attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get staff list with attendance status for a specific date
// @route   GET /api/store-manager/attendance/staff-list
// @access  Private (Store Manager only)
const getStaffWithAttendance = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const store = req.store;
  const storeId = store._id;

  try {
    console.log(`👥 Getting staff list with attendance for store: ${store.name}`);

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get all active staff in the store who were employed on the target date
    const staff = await Staff.find({
      store: storeId,
      status: 'active',
      dateOfJoining: { $lte: targetDate }
    }).select('name email phone employeeId role department dateOfJoining').lean();

    // Get attendance records for the date
    const attendanceRecords = await StaffAttendance.find({
      store: storeId,
      date: {
        $gte: targetDate,
        $lt: nextDay
      }
    }).lean();

    // Create a map of staff attendance
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      attendanceMap[record.staff.toString()] = record;
    });

    // Combine staff with their attendance status
    const staffWithAttendance = staff.map(staffMember => ({
      ...staffMember,
      attendance: attendanceMap[staffMember._id.toString()] || null,
      attendanceStatus: attendanceMap[staffMember._id.toString()]?.status || 'not_marked'
    }));

    console.log(`✅ Found ${staff.length} staff members, ${attendanceRecords.length} with attendance marked`);

    res.status(200).json({
      success: true,
      date: targetDate.toISOString().split('T')[0],
      count: staffWithAttendance.length,
      data: staffWithAttendance
    });

  } catch (error) {
    console.error('❌ Get staff with attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching staff with attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get historical attendance records with filters
// @route   GET /api/store-manager/attendance/history
// @access  Private (Store Manager only)
const getAttendanceHistory = asyncHandler(async (req, res) => {
  const { staffId, startDate, endDate, status, page = 1, limit = 50 } = req.query;
  const store = req.store;
  const storeId = store._id;

  try {
    console.log(`📊 Getting attendance history for store: ${store.name}`);
    console.log('📋 Query parameters:', { staffId, startDate, endDate, status, page, limit });

    let query = { store: storeId };

    // Staff filter
    if (staffId && staffId !== 'all') {
      query.staff = staffId;
    }

    // Date range filter
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    } else {
      // Default to last 90 days if no date range specified (more inclusive)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      query.date = { $gte: ninetyDaysAgo };
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    console.log('📋 Attendance history query:', JSON.stringify(query));

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get attendance records with staff details, filtering by joining date
    const attendanceRecords = await StaffAttendance.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'staff',
          localField: 'staff',
          foreignField: '_id',
          as: 'staffDetails'
        }
      },
      { $unwind: '$staffDetails' },
      {
        $match: {
          $expr: {
            $gte: ['$date', '$staffDetails.dateOfJoining']
          }
        }
      },
      {
        $project: {
          _id: 1,
          date: 1,
          status: 1,
          checkIn: 1,
          checkOut: 1,
          workingHours: 1,
          leaveDetails: 1,
          performance: 1,
          notes: 1,
          staff: {
            _id: '$staffDetails._id',
            name: '$staffDetails.name',
            email: '$staffDetails.email',
            phone: '$staffDetails.phone',
            employeeId: '$staffDetails.employeeId',
            role: '$staffDetails.role',
            department: '$staffDetails.department',
            dateOfJoining: '$staffDetails.dateOfJoining'
          }
        }
      },
      { $sort: { date: -1, 'staff.name': 1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    // Get total count for pagination (respecting joining dates)
    const totalCountResult = await StaffAttendance.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'staff',
          localField: 'staff',
          foreignField: '_id',
          as: 'staffDetails'
        }
      },
      { $unwind: '$staffDetails' },
      {
        $match: {
          $expr: {
            $gte: ['$date', '$staffDetails.dateOfJoining']
          }
        }
      },
      { $count: 'total' }
    ]);
    const totalRecords = totalCountResult.length > 0 ? totalCountResult[0].total : 0;
    const totalPages = Math.ceil(totalRecords / parseInt(limit));

    // Get summary statistics (respecting joining dates)
    const summaryStats = await StaffAttendance.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'staff',
          localField: 'staff',
          foreignField: '_id',
          as: 'staffDetails'
        }
      },
      { $unwind: '$staffDetails' },
      {
        $match: {
          $expr: {
            $gte: ['$date', '$staffDetails.dateOfJoining']
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalHours: { $sum: '$workingHours.actual' }
        }
      }
    ]);

    const summary = {
      totalRecords,
      totalPages,
      currentPage: parseInt(page),
      statusBreakdown: summaryStats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          totalHours: stat.totalHours || 0
        };
        return acc;
      }, {})
    };

    console.log(`✅ Found ${attendanceRecords.length} attendance history records`);

    res.status(200).json({
      success: true,
      count: attendanceRecords.length,
      summary,
      data: attendanceRecords
    });

  } catch (error) {
    console.error('❌ Get attendance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching attendance history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Manual time entry for check-in/check-out
const setManualTime = asyncHandler(async (req, res) => {
  const { staffId, type, time, date } = req.body;
  const store = req.store;
  const storeId = store._id;

  try {
    console.log(`⏰ Setting manual ${type} time for staff: ${staffId}`);

    // Validate input
    if (!staffId || !type || !time || !date) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID, type, time, and date are required'
      });
    }

    if (!['checkIn', 'checkOut'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either checkIn or checkOut'
      });
    }

    // Find or create attendance record
    const attendanceDate = new Date(date);
    let attendance = await StaffAttendance.findOne({
      staff: staffId,
      store: storeId,
      date: {
        $gte: new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate()),
        $lt: new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate() + 1)
      }
    });

    if (!attendance) {
      // Create new attendance record
      attendance = new StaffAttendance({
        staff: staffId,
        store: storeId,
        date: attendanceDate,
        status: 'present'
      });
    }

    // Set the time
    const timeDate = new Date(time);
    if (type === 'checkIn') {
      attendance.checkIn = {
        time: timeDate,
        method: 'manual'
      };
      // Update status if not already set
      if (attendance.status === 'not_marked') {
        attendance.status = 'present';
      }
    } else if (type === 'checkOut') {
      attendance.checkOut = {
        time: timeDate,
        method: 'manual'
      };
    }

    await attendance.save();

    console.log(`✅ Manual ${type} time set successfully`);

    res.json({
      success: true,
      message: `${type === 'checkIn' ? 'Check-in' : 'Check-out'} time set successfully`,
      data: attendance
    });

  } catch (error) {
    console.error(`❌ Error setting manual ${type} time:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to set time',
      error: error.message
    });
  }
});

module.exports = {
  getAttendance,
  markAttendance,
  getAttendanceStats,
  bulkMarkAttendance,
  getStaffWithAttendance,
  getAttendanceHistory,
  setManualTime
};

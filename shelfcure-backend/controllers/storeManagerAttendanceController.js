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
      status: status,
      notes: notes || '',
      updatedBy: req.user._id
    };

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

    res.status(200).json({
      success: true,
      message: `Attendance marked as ${status} for ${staff.name}`,
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

    // Get all staff in the store
    const totalStaff = await Staff.countDocuments({ 
      store: storeId, 
      status: 'active' 
    });

    // Get attendance statistics
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

    // Get all active staff in the store
    const staff = await Staff.find({
      store: storeId,
      status: 'active'
    }).select('name email phone employeeId role department').lean();

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

module.exports = {
  getAttendance,
  markAttendance,
  getAttendanceStats,
  bulkMarkAttendance,
  getStaffWithAttendance
};

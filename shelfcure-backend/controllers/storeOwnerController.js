const mongoose = require('mongoose');

// Import Models
const Store = require('../models/Store');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const StaffAttendance = require('../models/StaffAttendance');
const StaffSalary = require('../models/StaffSalary');
const Invoice = require('../models/Invoice');

// Import utilities
const ErrorResponse = require('../utils/errorResponse');

// ===================
// DASHBOARD CONTROLLERS
// ===================

// @desc    Get store owner dashboard data
// @route   GET /api/store-owner/dashboard
// @access  Private (Store Owner only)
const getDashboardData = async (req, res) => {
  try {
  const storeOwnerId = req.user.id;
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Get store owner's stores
  const stores = await Store.find({ owner: storeOwnerId, isActive: true })
    .select('name code stats')
    .lean();

  // Get subscription details
  const subscription = await Subscription.findOne({ storeOwner: storeOwnerId })
    .populate('plan', 'name features limits')
    .lean();

  // Get total staff count across all stores
  const totalStaff = await User.countDocuments({
    stores: { $in: stores.map(s => s._id) },
    role: { $in: ['store_manager', 'staff', 'cashier'] },
    isActive: true
  });

  // Get current month attendance summary
  const attendanceSummary = await StaffAttendance.aggregate([
    {
      $match: {
        storeOwner: mongoose.Types.ObjectId(storeOwnerId),
        month: currentMonth,
        year: currentYear
      }
    },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        presentDays: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
        },
        absentDays: {
          $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
        },
        totalHours: { $sum: '$workingHours.actual' }
      }
    }
  ]);

  // Get current month salary summary
  const salarySummary = await StaffSalary.getSalarySummary(storeOwnerId, currentMonth, currentYear);

  // Get recent activities (last 10 records)
  const recentActivities = await StaffAttendance.find({
    storeOwner: storeOwnerId
  })
    .populate('staff', 'name email')
    .populate('store', 'name code')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Calculate total sales across all stores
  const totalSales = stores.reduce((sum, store) => sum + (store.stats?.totalSales || 0), 0);
  const totalCustomers = stores.reduce((sum, store) => sum + (store.stats?.totalCustomers || 0), 0);

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalStores: stores.length,
        totalStaff,
        totalSales,
        totalCustomers,
        subscriptionStatus: subscription?.status || 'inactive',
        subscriptionPlan: subscription?.plan || 'none'
      },
      stores: stores.map(store => ({
        id: store._id,
        name: store.name,
        code: store.code,
        stats: store.stats
      })),
      subscription: {
        plan: subscription?.plan,
        status: subscription?.status,
        remainingDays: subscription?.remainingDays,
        storeCountLimit: subscription?.storeCountLimit,
        currentStoreCount: subscription?.currentStoreCount,
        features: subscription?.features
      },
      attendance: {
        summary: attendanceSummary[0] || {
          totalRecords: 0,
          presentDays: 0,
          absentDays: 0,
          totalHours: 0
        },
        attendanceRate: attendanceSummary[0] 
          ? Math.round((attendanceSummary[0].presentDays / attendanceSummary[0].totalRecords) * 100)
          : 0
      },
      salary: salarySummary,
      recentActivities: recentActivities.map(activity => ({
        id: activity._id,
        staff: activity.staff,
        store: activity.store,
        status: activity.status,
        date: activity.date,
        checkIn: activity.checkIn?.time,
        checkOut: activity.checkOut?.time,
        createdAt: activity.createdAt
      }))
    }
  });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
};

// @desc    Get store owner analytics
// @route   GET /api/store-owner/analytics
// @access  Private (Store Owner only)
const getStoreOwnerAnalytics = async (req, res) => {
  try {
  const storeOwnerId = req.user.id;
  const { period = 'month', startDate, endDate } = req.query;

  let dateFilter = {};
  const currentDate = new Date();

  // Set date filter based on period
  switch (period) {
    case 'week':
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - 7);
      dateFilter = { createdAt: { $gte: weekStart } };
      break;
    case 'month':
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      dateFilter = { createdAt: { $gte: monthStart } };
      break;
    case 'year':
      const yearStart = new Date(currentDate.getFullYear(), 0, 1);
      dateFilter = { createdAt: { $gte: yearStart } };
      break;
    case 'custom':
      if (startDate && endDate) {
        dateFilter = {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        };
      }
      break;
  }

  // Get stores
  const stores = await Store.find({ owner: storeOwnerId, isActive: true });
  const storeIds = stores.map(s => s._id);

  // Get attendance analytics
  const attendanceAnalytics = await StaffAttendance.aggregate([
    {
      $match: {
        storeOwner: mongoose.Types.ObjectId(storeOwnerId),
        ...dateFilter
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
        },
        totalStaff: { $addToSet: '$staff' },
        presentCount: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
        },
        absentCount: {
          $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
        },
        totalHours: { $sum: '$workingHours.actual' }
      }
    },
    {
      $project: {
        date: '$_id.date',
        totalStaff: { $size: '$totalStaff' },
        presentCount: 1,
        absentCount: 1,
        totalHours: 1,
        attendanceRate: {
          $multiply: [
            { $divide: ['$presentCount', { $add: ['$presentCount', '$absentCount'] }] },
            100
          ]
        }
      }
    },
    { $sort: { date: 1 } }
  ]);

  // Get salary analytics
  const salaryAnalytics = await StaffSalary.aggregate([
    {
      $match: {
        storeOwner: mongoose.Types.ObjectId(storeOwnerId),
        ...dateFilter
      }
    },
    {
      $group: {
        _id: {
          month: '$month',
          year: '$year'
        },
        totalSalaries: { $sum: '$netSalary' },
        totalStaff: { $sum: 1 },
        paidSalaries: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$netSalary', 0] }
        },
        pendingSalaries: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, '$netSalary', 0] }
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Get store-wise performance
  const storePerformance = await Store.aggregate([
    {
      $match: {
        owner: mongoose.Types.ObjectId(storeOwnerId),
        isActive: true
      }
    },
    {
      $lookup: {
        from: 'staffattendances',
        let: { storeId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$store', '$$storeId'] },
              ...dateFilter
            }
          },
          {
            $group: {
              _id: null,
              totalAttendance: { $sum: 1 },
              presentDays: {
                $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
              }
            }
          }
        ],
        as: 'attendanceData'
      }
    },
    {
      $project: {
        name: 1,
        code: 1,
        stats: 1,
        attendanceRate: {
          $cond: [
            { $gt: [{ $size: '$attendanceData' }, 0] },
            {
              $multiply: [
                {
                  $divide: [
                    { $arrayElemAt: ['$attendanceData.presentDays', 0] },
                    { $arrayElemAt: ['$attendanceData.totalAttendance', 0] }
                  ]
                },
                100
              ]
            },
            0
          ]
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      period,
      dateRange: dateFilter,
      attendanceAnalytics,
      salaryAnalytics,
      storePerformance,
      summary: {
        totalStores: stores.length,
        totalStaff: await User.countDocuments({
          stores: { $in: storeIds },
          role: { $in: ['store_manager', 'staff', 'cashier'] },
          isActive: true
        }),
        averageAttendanceRate: attendanceAnalytics.length > 0
          ? Math.round(attendanceAnalytics.reduce((sum, item) => sum + item.attendanceRate, 0) / attendanceAnalytics.length)
          : 0,
        totalSalaryExpense: salaryAnalytics.reduce((sum, item) => sum + item.totalSalaries, 0)
      }
    }
  });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics data'
    });
  }
};

// @desc    Get financial summary
// @route   GET /api/store-owner/financial-summary
// @access  Private (Store Owner only)
const getFinancialSummary = async (req, res) => {
  try {
  const storeOwnerId = req.user.id;
  const { month, year } = req.query;

  const currentDate = new Date();
  const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
  const targetYear = year ? parseInt(year) : currentDate.getFullYear();

  // Get salary expenses
  const salaryExpenses = await StaffSalary.getSalarySummary(storeOwnerId, targetMonth, targetYear);

  // Get subscription cost
  const subscription = await Subscription.findOne({ storeOwner: storeOwnerId });
  const subscriptionCost = subscription?.pricing?.totalAmount || 0;

  // Get store revenues (from sales)
  const stores = await Store.find({ owner: storeOwnerId, isActive: true });
  const totalRevenue = stores.reduce((sum, store) => sum + (store.stats?.totalSales || 0), 0);

  // Calculate profit/loss
  const totalExpenses = salaryExpenses.totalNetSalary + subscriptionCost;
  const netProfit = totalRevenue - totalExpenses;

  res.status(200).json({
    success: true,
    data: {
      period: `${targetMonth}/${targetYear}`,
      revenue: {
        totalSales: totalRevenue,
        storeCount: stores.length
      },
      expenses: {
        salaries: salaryExpenses.totalNetSalary,
        subscription: subscriptionCost,
        total: totalExpenses
      },
      profit: {
        gross: totalRevenue,
        net: netProfit,
        margin: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0
      },
      salaryBreakdown: salaryExpenses
    }
  });
  } catch (error) {
    console.error('Financial summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching financial summary'
    });
  }
};

// ===================
// STORE MANAGEMENT CONTROLLERS
// ===================

// @desc    Get all stores for store owner
// @route   GET /api/store-owner/stores
// @access  Private (Store Owner only)
const getStores = async (req, res) => {
  try {
    const storeOwnerId = req.user.id;
  const { page = 1, limit = 10, search, status } = req.query;

  // Build query
  let query = { owner: storeOwnerId };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) {
    query.isActive = status === 'active';
  }

  // Execute query with pagination
  const stores = await Store.find(query)
    .populate('managers', 'name email phone')
    .populate('staff.user', 'name email phone role')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await Store.countDocuments(query);

  // Get additional stats for each store
  const storesWithStats = await Promise.all(
    stores.map(async (store) => {
      const staffCount = await User.countDocuments({
        stores: store._id,
        role: { $in: ['store_manager', 'staff', 'cashier'] },
        isActive: true
      });

      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const attendanceStats = await StaffAttendance.aggregate([
        {
          $match: {
            store: store._id,
            month: currentMonth,
            year: currentYear
          }
        },
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            presentDays: {
              $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
            }
          }
        }
      ]);

      const attendanceRate = attendanceStats[0]
        ? Math.round((attendanceStats[0].presentDays / attendanceStats[0].totalRecords) * 100)
        : 0;

      return {
        ...store,
        staffCount,
        attendanceRate,
        activeStaff: store.staff?.filter(s => s.isActive).length || 0
      };
    })
  );

  res.status(200).json({
    success: true,
    count: storesWithStats.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    },
    data: storesWithStats
  });
});

// @desc    Create new store
// @route   POST /api/store-owner/stores
// @access  Private (Store Owner only)
const createStore = asyncHandler(async (req, res) => {
  const storeOwnerId = req.user.id;

  // Check subscription limits
  const subscription = await Subscription.findOne({ storeOwner: storeOwnerId });

  if (!subscription || !subscription.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Active subscription required to create stores'
    });
  }

  if (!subscription.canCreateStore()) {
    return res.status(400).json({
      success: false,
      message: `Store limit reached. Your plan allows ${subscription.storeCountLimit} stores.`
    });
  }

  // Add store owner to the request body
  req.body.owner = storeOwnerId;
  req.body.createdBy = storeOwnerId;

  // Create store
  const store = await Store.create(req.body);

  // Update subscription store count
  subscription.currentStoreCount += 1;
  await subscription.save();

  // Populate the created store
  await store.populate('owner', 'name email phone');

  res.status(201).json({
    success: true,
    data: store
  });
});

// @desc    Get single store
// @route   GET /api/store-owner/stores/:id
// @access  Private (Store Owner only)
const getStore = asyncHandler(async (req, res) => {
  const store = await Store.findOne({
    _id: req.params.id,
    owner: req.user.id
  })
    .populate('owner', 'name email phone')
    .populate('managers', 'name email phone role')
    .populate('staff.user', 'name email phone role avatar')
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name');

  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found'
    });
  }

  // Get additional statistics
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const attendanceStats = await StaffAttendance.getStoreAttendanceSummary(
    store._id,
    currentMonth,
    currentYear
  );

  const salaryStats = await StaffSalary.aggregate([
    {
      $match: {
        store: store._id,
        month: currentMonth,
        year: currentYear
      }
    },
    {
      $group: {
        _id: null,
        totalSalaries: { $sum: '$netSalary' },
        paidSalaries: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$netSalary', 0] }
        },
        pendingSalaries: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, '$netSalary', 0] }
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      ...store.toObject(),
      statistics: {
        attendance: attendanceStats,
        salary: salaryStats[0] || {
          totalSalaries: 0,
          paidSalaries: 0,
          pendingSalaries: 0
        }
      }
    }
  });
});

// @desc    Update store
// @route   PUT /api/store-owner/stores/:id
// @access  Private (Store Owner only)
const updateStore = asyncHandler(async (req, res) => {
  let store = await Store.findOne({
    _id: req.params.id,
    owner: req.user.id
  });

  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found'
    });
  }

  // Add updatedBy field
  req.body.updatedBy = req.user.id;

  store = await Store.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
    .populate('owner', 'name email phone')
    .populate('managers', 'name email phone')
    .populate('updatedBy', 'name');

  res.status(200).json({
    success: true,
    data: store
  });
});

// @desc    Delete store
// @route   DELETE /api/store-owner/stores/:id
// @access  Private (Store Owner only)
const deleteStore = asyncHandler(async (req, res) => {
  const store = await Store.findOne({
    _id: req.params.id,
    owner: req.user.id
  });

  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found'
    });
  }

  // Soft delete - set isActive to false
  store.isActive = false;
  store.updatedBy = req.user.id;
  await store.save();

  // Update subscription store count
  const subscription = await Subscription.findOne({ storeOwner: req.user.id });
  if (subscription && subscription.currentStoreCount > 0) {
    subscription.currentStoreCount -= 1;
    await subscription.save();
  }

  res.status(200).json({
    success: true,
    message: 'Store deleted successfully'
  });
});

// @desc    Get store analytics
// @route   GET /api/store-owner/stores/:id/analytics
// @access  Private (Store Owner only)
const getStoreAnalytics = asyncHandler(async (req, res) => {
  const storeId = req.params.id;
  const { period = 'month' } = req.query;

  // Verify store ownership
  const store = await Store.findOne({
    _id: storeId,
    owner: req.user.id
  });

  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found'
    });
  }

  const currentDate = new Date();
  let startDate, endDate;

  // Set date range based on period
  switch (period) {
    case 'week':
      startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - 7);
      endDate = currentDate;
      break;
    case 'month':
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      break;
    case 'year':
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      endDate = new Date(currentDate.getFullYear(), 11, 31);
      break;
    default:
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  }

  // Get attendance analytics
  const attendanceAnalytics = await StaffAttendance.aggregate([
    {
      $match: {
        store: mongoose.Types.ObjectId(storeId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
        },
        totalStaff: { $addToSet: '$staff' },
        presentCount: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
        },
        absentCount: {
          $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
        },
        totalHours: { $sum: '$workingHours.actual' },
        overtimeHours: { $sum: '$workingHours.overtime' }
      }
    },
    {
      $project: {
        date: '$_id.date',
        totalStaff: { $size: '$totalStaff' },
        presentCount: 1,
        absentCount: 1,
        totalHours: 1,
        overtimeHours: 1,
        attendanceRate: {
          $cond: [
            { $gt: [{ $add: ['$presentCount', '$absentCount'] }, 0] },
            {
              $multiply: [
                { $divide: ['$presentCount', { $add: ['$presentCount', '$absentCount'] }] },
                100
              ]
            },
            0
          ]
        }
      }
    },
    { $sort: { date: 1 } }
  ]);

  // Get staff performance
  const staffPerformance = await StaffAttendance.aggregate([
    {
      $match: {
        store: mongoose.Types.ObjectId(storeId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$staff',
        totalDays: { $sum: 1 },
        presentDays: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
        },
        totalHours: { $sum: '$workingHours.actual' },
        overtimeHours: { $sum: '$workingHours.overtime' },
        avgRating: { $avg: '$performance.rating' }
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
        totalHours: 1,
        overtimeHours: 1,
        avgRating: { $round: ['$avgRating', 2] },
        attendanceRate: {
          $multiply: [
            { $divide: ['$presentDays', '$totalDays'] },
            100
          ]
        }
      }
    },
    { $sort: { attendanceRate: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      store: {
        id: store._id,
        name: store.name,
        code: store.code
      },
      period,
      dateRange: { startDate, endDate },
      attendanceAnalytics,
      staffPerformance,
      summary: {
        totalStaff: store.totalStaff,
        averageAttendanceRate: attendanceAnalytics.length > 0
          ? Math.round(attendanceAnalytics.reduce((sum, item) => sum + item.attendanceRate, 0) / attendanceAnalytics.length)
          : 0,
        totalWorkingHours: attendanceAnalytics.reduce((sum, item) => sum + item.totalHours, 0),
        totalOvertimeHours: attendanceAnalytics.reduce((sum, item) => sum + item.overtimeHours, 0)
      }
    }
  });
});

// ===================
// STAFF MANAGEMENT CONTROLLERS
// ===================

// @desc    Get store staff
// @route   GET /api/store-owner/stores/:storeId/staff
// @access  Private (Store Owner only)
const getStoreStaff = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const { page = 1, limit = 10, search, role, status } = req.query;

  // Verify store ownership
  const store = await Store.findOne({
    _id: storeId,
    owner: req.user.id
  });

  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found'
    });
  }

  // Build query
  let query = { stores: storeId };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  if (role) {
    query.role = role;
  }

  if (status) {
    query.isActive = status === 'active';
  }

  // Get staff members
  const staff = await User.find(query)
    .select('name email phone role avatar isActive createdAt lastLogin')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await User.countDocuments(query);

  // Get additional stats for each staff member
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const staffWithStats = await Promise.all(
    staff.map(async (member) => {
      const attendanceSummary = await StaffAttendance.getAttendanceSummary(
        member._id,
        currentMonth,
        currentYear
      );

      const latestSalary = await StaffSalary.findOne({
        staff: member._id,
        store: storeId
      }).sort({ createdAt: -1 });

      return {
        ...member,
        attendanceSummary,
        currentSalary: latestSalary?.netSalary || 0,
        salaryStatus: latestSalary?.paymentStatus || 'not_set'
      };
    })
  );

  res.status(200).json({
    success: true,
    count: staffWithStats.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    },
    data: staffWithStats
  });
});

module.exports = {
  getDashboardData,
  getStoreOwnerAnalytics,
  getFinancialSummary,
  getStores,
  createStore,
  getStore,
  updateStore,
  deleteStore,
  getStoreAnalytics,
  getStoreStaff
};

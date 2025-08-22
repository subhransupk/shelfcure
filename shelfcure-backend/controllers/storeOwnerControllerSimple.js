const mongoose = require('mongoose');

// Import Models
const Store = require('../models/Store');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const StaffAttendance = require('../models/StaffAttendance');
const StaffSalary = require('../models/StaffSalary');

// @desc    Get store owner dashboard data
// @route   GET /api/store-owner/dashboard
// @access  Private (Store Owner only)
const getDashboardData = async (req, res) => {
  try {
    const storeOwnerId = req.user.id;
    
    // Get store owner's stores
    const stores = await Store.find({ owner: storeOwnerId, isActive: true })
      .select('name code stats')
      .lean();

    // Get subscription details
    const subscription = await Subscription.findOne({ storeOwner: storeOwnerId })
      .lean();

    // Get total staff count across all stores
    const totalStaff = await User.countDocuments({
      stores: { $in: stores.map(s => s._id) },
      role: { $in: ['store_manager', 'staff', 'cashier'] },
      isActive: true
    });

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
        }
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
    
    // Get stores
    const stores = await Store.find({ owner: storeOwnerId, isActive: true });
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalStores: stores.length,
          totalStaff: 0,
          averageAttendanceRate: 0,
          totalSalaryExpense: 0
        },
        message: 'Detailed analytics coming soon'
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
    
    // Get stores
    const stores = await Store.find({ owner: storeOwnerId, isActive: true });
    const totalRevenue = stores.reduce((sum, store) => sum + (store.stats?.totalSales || 0), 0);
    
    res.status(200).json({
      success: true,
      data: {
        revenue: {
          totalSales: totalRevenue,
          storeCount: stores.length
        },
        expenses: {
          salaries: 0,
          subscription: 0,
          total: 0
        },
        profit: {
          gross: totalRevenue,
          net: totalRevenue,
          margin: 100
        }
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

    res.status(200).json({
      success: true,
      count: stores.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: stores
    });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching stores'
    });
  }
};

// @desc    Generate unique store code
// @route   GET /api/store-owner/generate-store-code
// @access  Private (Store Owner only)
const generateStoreCode = async (req, res) => {
  console.log('🔥 generateStoreCode function called!');
  try {
    const code = await Store.generateUniqueCode();
    console.log('✅ Generated code:', code);

    res.status(200).json({
      success: true,
      data: { code }
    });
  } catch (error) {
    console.error('Generate store code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating store code'
    });
  }
};

// @desc    Create new store
// @route   POST /api/store-owner/stores
// @access  Private (Store Owner only)
const createStore = async (req, res) => {
  try {
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

    res.status(201).json({
      success: true,
      data: store
    });
  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating store'
    });
  }
};

// @desc    Get single store
// @route   GET /api/store-owner/stores/:id
// @access  Private (Store Owner only)
const getStore = async (req, res) => {
  console.log('🚨 getStore function called with ID:', req.params.id);
  try {
    const store = await Store.findOne({
      _id: req.params.id,
      owner: req.user.id
    })
      .populate('owner', 'name email phone')
      .populate('managers', 'name email phone role')
      .populate('staff.user', 'name email phone role avatar');

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    res.status(200).json({
      success: true,
      data: store
    });
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching store'
    });
  }
};

// @desc    Get store staff
// @route   GET /api/store-owner/stores/:storeId/staff
// @access  Private (Store Owner only)
const getStoreStaff = async (req, res) => {
  try {
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

    res.status(200).json({
      success: true,
      count: staff.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: staff
    });
  } catch (error) {
    console.error('Get store staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching store staff'
    });
  }
};

module.exports = {
  getDashboardData,
  getStoreOwnerAnalytics,
  getFinancialSummary,
  getStores,
  generateStoreCode,
  createStore,
  getStore,
  getStoreStaff
};

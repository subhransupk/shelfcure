const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import Models
const Store = require('../models/Store');
const User = require('../models/User');

// @desc    Create new staff member
// @route   POST /api/store-owner/stores/:storeId/staff
// @access  Private (Store Owner only)
const createStaff = async (req, res) => {
  try {
    const { storeId } = req.params;
    const storeOwnerId = req.user.id;

    // Verify store ownership
    const store = await Store.findOne({
      _id: storeId,
      owner: storeOwnerId
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Set default password if not provided
    if (!req.body.password) {
      req.body.password = 'ShelfCure@123'; // Default password
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);

    // Set role if not provided
    if (!req.body.role) {
      req.body.role = 'staff';
    }

    // Validate role
    const allowedRoles = ['store_manager', 'staff', 'cashier'];
    if (!allowedRoles.includes(req.body.role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Create user
    const user = await User.create({
      ...req.body,
      stores: [storeId],
      currentStore: storeId
    });

    // Add staff to store
    store.staff.push({
      user: user._id,
      role: req.body.role,
      joinDate: new Date(),
      isActive: true
    });

    // If role is store_manager, also add to managers array
    if (req.body.role === 'store_manager') {
      store.managers.push(user._id);
    }

    await store.save();

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      data: user,
      message: 'Staff member created successfully'
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating staff member'
    });
  }
};

// @desc    Get staff details
// @route   GET /api/store-owner/staff/:id
// @access  Private (Store Owner only)
const getStaffDetails = async (req, res) => {
  try {
    const staffId = req.params.id;
    const storeOwnerId = req.user.id;

    // Find staff member and verify they belong to store owner's stores
    const staff = await User.findById(staffId)
      .populate('stores', 'name code')
      .populate('currentStore', 'name code')
      .select('-password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Verify the staff belongs to one of the store owner's stores
    const ownerStores = await Store.find({ owner: storeOwnerId }).select('_id');
    const ownerStoreIds = ownerStores.map(store => store._id.toString());
    
    const staffStoreIds = staff.stores.map(store => store._id.toString());
    const hasCommonStore = staffStoreIds.some(storeId => ownerStoreIds.includes(storeId));

    if (!hasCommonStore) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        staff,
        attendanceSummary: {
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          attendanceRate: 0
        },
        recentAttendance: [],
        salaryHistory: []
      }
    });
  } catch (error) {
    console.error('Get staff details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching staff details'
    });
  }
};

// @desc    Update staff member
// @route   PUT /api/store-owner/staff/:id
// @access  Private (Store Owner only)
const updateStaff = async (req, res) => {
  try {
    const staffId = req.params.id;
    const storeOwnerId = req.user.id;

    // Find staff member
    let staff = await User.findById(staffId);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Verify the staff belongs to one of the store owner's stores
    const ownerStores = await Store.find({ owner: storeOwnerId }).select('_id');
    const ownerStoreIds = ownerStores.map(store => store._id.toString());
    
    const staffStoreIds = staff.stores.map(store => store.toString());
    const hasCommonStore = staffStoreIds.some(storeId => ownerStoreIds.includes(storeId));

    if (!hasCommonStore) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Handle password update
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }

    // Update user
    staff = await User.findByIdAndUpdate(staffId, req.body, {
      new: true,
      runValidators: true
    }).select('-password');

    res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating staff member'
    });
  }
};

// @desc    Delete staff member
// @route   DELETE /api/store-owner/staff/:id
// @access  Private (Store Owner only)
const deleteStaff = async (req, res) => {
  try {
    const staffId = req.params.id;
    const storeOwnerId = req.user.id;

    // Find staff member
    const staff = await User.findById(staffId);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Verify the staff belongs to one of the store owner's stores
    const ownerStores = await Store.find({ owner: storeOwnerId }).select('_id');
    const ownerStoreIds = ownerStores.map(store => store._id.toString());
    
    const staffStoreIds = staff.stores.map(store => store.toString());
    const hasCommonStore = staffStoreIds.some(storeId => ownerStoreIds.includes(storeId));

    if (!hasCommonStore) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Soft delete - deactivate user
    staff.isActive = false;
    await staff.save();

    // Remove from all stores
    const stores = await Store.find({ 'staff.user': staffId });
    
    for (const store of stores) {
      // Remove from staff array
      store.staff = store.staff.filter(s => s.user.toString() !== staffId);
      
      // Remove from managers array if present
      store.managers = store.managers.filter(managerId => managerId.toString() !== staffId);
      
      await store.save();
    }

    res.status(200).json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting staff member'
    });
  }
};

// @desc    Get all staff across all stores for store owner
// @route   GET /api/store-owner/staff
// @access  Private (Store Owner only)
const getAllStaff = async (req, res) => {
  try {
    const storeOwnerId = req.user.id;
    const { page = 1, limit = 10, search, role, status } = req.query;

    // Get all stores owned by this store owner
    const ownerStores = await Store.find({ owner: storeOwnerId }).select('_id');
    const ownerStoreIds = ownerStores.map(store => store._id);

    if (ownerStoreIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        },
        data: []
      });
    }

    // Build query to find all staff in owner's stores
    let query = { stores: { $in: ownerStoreIds } };

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

    // Get staff members with store information
    const staff = await User.find(query)
      .select('name email phone role avatar isActive createdAt lastLogin stores currentStore address')
      .populate('currentStore', 'name code')
      .populate('stores', 'name code')
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
    console.error('Get all staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching staff'
    });
  }
};

module.exports = {
  createStaff,
  getStaffDetails,
  updateStaff,
  deleteStaff,
  getAllStaff
};

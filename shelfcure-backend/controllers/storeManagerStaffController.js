const Staff = require('../models/Staff');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// Helper function to ensure store manager exists in staff collection
const ensureStoreManagerInStaff = async (storeId, userId) => {
  try {
    // Check if store manager already exists in staff collection for this store
    const existingStaff = await Staff.findOne({
      store: storeId,
      $or: [
        { createdBy: userId },
        { email: { $exists: true } } // We'll match by email below
      ],
      role: 'store_manager'
    });

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found for ID:', userId);
      return;
    }

    // Check if existing staff record matches this user by email
    const staffByEmail = await Staff.findOne({
      store: storeId,
      email: user.email,
      role: 'store_manager'
    });

    if (!existingStaff && !staffByEmail) {
      // Generate unique employee ID for this store
      const existingStaffCount = await Staff.countDocuments({ store: storeId });
      const employeeId = `MGR${String(existingStaffCount + 1).padStart(3, '0')}`;

      // Create staff record for store manager
      const staffData = {
        name: user.name,
        email: user.email,
        phone: user.phone || '0000000000', // Default if not provided
        employeeId: employeeId,
        role: 'store_manager',
        department: 'administration',
        dateOfJoining: user.createdAt || new Date(),
        salary: 0, // Can be updated later
        workingHours: 'full_time',
        status: 'active',
        hasSystemAccess: true,
        permissions: ['inventory_read', 'inventory_write', 'sales_read', 'sales_write', 'reports_read', 'customer_management'],
        store: storeId,
        createdBy: userId
      };

      const newStaff = await Staff.create(staffData);
      console.log('✅ Store manager added to staff collection:', newStaff.name, 'for store:', storeId);
    } else if (staffByEmail && !staffByEmail.store.equals(storeId)) {
      // Update existing staff record to link to correct store
      await Staff.findByIdAndUpdate(staffByEmail._id, {
        store: storeId,
        updatedBy: userId
      });
      console.log('✅ Updated existing staff record to link to correct store');
    } else {
      console.log('✅ Store manager already exists in staff collection');
    }
  } catch (error) {
    console.error('❌ Error ensuring store manager in staff:', error);
  }
};

// @desc    Get all staff for a store
// @route   GET /api/store-manager/staff
// @access  Private (Store Manager only)
const getStaff = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, role, department, status } = req.query;
  const store = req.store; // Store is available from middleware
  const storeId = store._id;

  try {
    console.log(`🔍 Fetching staff for store: ${store.name} (${storeId})`);
    console.log(`👤 Requested by: ${req.user.name} (${req.user.email})`);

    // Ensure store manager is in staff collection
    await ensureStoreManagerInStaff(storeId, req.user._id);

    let query = { store: storeId };

    // Add status filter (show active by default, unless specifically requested)
    if (status && status !== 'all') {
      query.status = status;
    } else if (!status) {
      // Default to showing active staff only
      query.status = 'active';
    }

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { employeeId: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { role: searchRegex }
      ];
    }

    // Add role filter
    if (role && role !== 'all') {
      query.role = role;
    }

    // Add department filter
    if (department && department !== 'all') {
      query.department = department;
    }

    console.log('📋 Query used:', JSON.stringify(query));

    // Get total count for pagination
    const total = await Staff.countDocuments(query);
    console.log(`📊 Total staff found: ${total}`);

    // Get staff with pagination
    const staff = await Staff.find(query)
      .sort({
        role: 1, // Store managers first
        name: 1  // Then alphabetically by name
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .lean(); // Use lean for better performance

    console.log(`✅ Staff returned: ${staff.length}`);
    staff.forEach(s => {
      console.log(`  - ${s.name} (${s.role}) - Status: ${s.status} - ID: ${s.employeeId}`);
    });

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
    console.error('❌ Get staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching staff',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get single staff member
// @route   GET /api/store-manager/staff/:id
// @access  Private (Store Manager only)
const getStaffMember = asyncHandler(async (req, res) => {
  const storeId = req.store._id;

  try {
    const staff = await Staff.findOne({
      _id: req.params.id,
      store: storeId
    })
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.status(200).json({
      success: true,
      data: staff
    });

  } catch (error) {
    console.error('Get staff member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching staff member'
    });
  }
});

// @desc    Create new staff member
// @route   POST /api/store-manager/staff
// @access  Private (Store Manager only)
const createStaff = asyncHandler(async (req, res) => {
  const storeId = req.store._id;

  try {
    // Generate employeeId if not provided
    let employeeId = req.body.employeeId;
    if (!employeeId || employeeId.trim() === '') {
      // Generate a unique employee ID
      const rolePrefix = {
        'pharmacist': 'PH',
        'assistant': 'AS',
        'cashier': 'CA',
        'inventory_manager': 'IM',
        'sales_executive': 'SE',
        'supervisor': 'SU',
        'store_manager': 'MGR'
      };

      const prefix = rolePrefix[req.body.role] || 'ST';

      // Find the highest existing employee ID with this prefix for this store
      const existingStaff = await Staff.find({
        store: storeId,
        employeeId: { $regex: `^${prefix}\\d+$` }
      }).sort({ employeeId: -1 });

      let nextNumber = 1;
      if (existingStaff.length > 0) {
        // Extract numbers from all existing IDs and find the maximum
        const existingNumbers = existingStaff.map(staff => {
          const match = staff.employeeId.match(new RegExp(`^${prefix}(\\d+)$`));
          return match ? parseInt(match[1]) : 0;
        }).filter(num => num > 0);

        if (existingNumbers.length > 0) {
          nextNumber = Math.max(...existingNumbers) + 1;
        }
      }

      // Generate the new employee ID
      employeeId = `${prefix}${nextNumber.toString().padStart(3, '0')}`;

      // Double-check for uniqueness within the store (safety check)
      let attempts = 0;
      while (attempts < 10) {
        const existingWithId = await Staff.findOne({
          store: storeId,
          employeeId: employeeId.toUpperCase()
        });

        if (!existingWithId) {
          break; // ID is unique within this store, we can use it
        }

        // If ID exists in this store, increment and try again
        nextNumber++;
        employeeId = `${prefix}${nextNumber.toString().padStart(3, '0')}`;
        attempts++;
      }

      if (attempts >= 10) {
        return res.status(500).json({
          success: false,
          message: 'Unable to generate unique employee ID after multiple attempts'
        });
      }
    } else {
      // If employeeId is provided, check for uniqueness within the store
      const existingWithId = await Staff.findOne({
        store: storeId,
        employeeId: employeeId.trim().toUpperCase()
      });

      if (existingWithId) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID already exists in this store'
        });
      }
    }

    const staffData = {
      ...req.body,
      employeeId: employeeId.toUpperCase(),
      store: storeId,
      createdBy: req.user._id
    };

    const staff = await Staff.create(staffData);

    // Populate the created staff
    const populatedStaff = await Staff.findById(staff._id)
      .populate('createdBy', 'name')
      .populate('store', 'name code');

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: populatedStaff
    });

  } catch (error) {
    console.error('Create staff error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      let message = `${field} already exists`;

      // Provide more specific error messages
      if (field === 'employeeId') {
        message = 'Employee ID already exists. Please use a different Employee ID or leave it empty for auto-generation.';
      } else if (field === 'email') {
        message = 'A staff member with this email address already exists in the system.';
      } else if (field === 'phone') {
        message = 'A staff member with this phone number already exists in the system.';
      }

      return res.status(400).json({
        success: false,
        message: message,
        field: field,
        value: error.keyValue[field]
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating staff member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Update staff member
// @route   PUT /api/store-manager/staff/:id
// @access  Private (Store Manager only)
const updateStaff = asyncHandler(async (req, res) => {
  const storeId = req.store._id;

  try {
    let staff = await Staff.findOne({
      _id: req.params.id,
      store: storeId
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Update staff data
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };

    staff = await Staff.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    )
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Staff member updated successfully',
      data: staff
    });

  } catch (error) {
    console.error('Update staff error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating staff member'
    });
  }
});

// @desc    Delete staff member (soft delete)
// @route   DELETE /api/store-manager/staff/:id
// @access  Private (Store Manager only)
const deleteStaff = asyncHandler(async (req, res) => {
  const storeId = req.store._id;

  try {
    const staff = await Staff.findOne({
      _id: req.params.id,
      store: storeId
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Soft delete by setting status to inactive
    staff.status = 'inactive';
    staff.updatedBy = req.user._id;
    await staff.save();

    res.status(200).json({
      success: true,
      message: 'Staff member deactivated successfully'
    });

  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting staff member'
    });
  }
});

// @desc    Get staff statistics
// @route   GET /api/store-manager/staff/stats
// @access  Private (Store Manager only)
const getStaffStats = asyncHandler(async (req, res) => {
  const storeId = req.store._id;

  try {
    const stats = await Staff.aggregate([
      { $match: { store: storeId } },
      {
        $group: {
          _id: null,
          totalStaff: { $sum: 1 },
          activeStaff: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          inactiveStaff: {
            $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
          },
          onLeaveStaff: {
            $sum: { $cond: [{ $eq: ['$status', 'on_leave'] }, 1, 0] }
          },
          averageSalary: { $avg: '$salary' },
          totalSalaryExpense: { $sum: '$salary' }
        }
      }
    ]);

    const result = stats[0] || {
      totalStaff: 0,
      activeStaff: 0,
      inactiveStaff: 0,
      onLeaveStaff: 0,
      averageSalary: 0,
      totalSalaryExpense: 0
    };

    // Get role distribution
    const roleStats = await Staff.aggregate([
      { $match: { store: storeId, status: 'active' } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...result,
        roleDistribution: roleStats
      }
    });

  } catch (error) {
    console.error('Get staff stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching staff statistics'
    });
  }
});

module.exports = {
  getStaff,
  getStaffMember,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffStats
};

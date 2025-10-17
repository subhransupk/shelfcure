const Staff = require('../models/Staff');
const User = require('../models/User');
const StaffSalaryConfig = require('../models/StaffSalaryConfig');
const asyncHandler = require('express-async-handler');

// Helper function to ensure store manager exists in staff collection
const ensureStoreManagerInStaff = async (storeId, userId) => {
  try {
    // Get user details first
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found for ID:', userId);
      return;
    }

    console.log(`🔍 Checking if store manager exists: ${user.name} (${user.email}) for store: ${storeId}`);

    // Check if staff record already exists for this user in this store
    // Check by userAccount OR by email
    const existingStaff = await Staff.findOne({
      store: storeId,
      $or: [
        { userAccount: userId },
        { email: user.email }
      ]
    });

    if (existingStaff) {
      console.log(`✅ Store manager already exists in staff collection: ${existingStaff.name} (${existingStaff.employeeId})`);

      // Ensure userAccount is linked if not already
      if (!existingStaff.userAccount) {
        existingStaff.userAccount = userId;
        await existingStaff.save();
        console.log(`✅ Linked userAccount to existing staff record`);
      }

      // Ensure role is store_manager if this user is the manager
      if (existingStaff.role !== 'store_manager' && user.role === 'store_manager') {
        existingStaff.role = 'store_manager';
        await existingStaff.save();
        console.log(`✅ Updated role to store_manager`);
      }

      return;
    }

    // Staff record doesn't exist - create it
    console.log(`📝 Creating new staff record for store manager: ${user.name}`);

    // Generate unique employee ID for this store
    const existingStaffCount = await Staff.countDocuments({ store: storeId });
    const employeeId = `MGR${String(existingStaffCount + 1).padStart(3, '0')}`;

    // Format phone number - extract only digits and ensure 10 digits
    let formattedPhone = '0000000000'; // Default
    if (user.phone) {
      const digitsOnly = user.phone.replace(/\D/g, ''); // Remove non-digits
      if (digitsOnly.length >= 10) {
        formattedPhone = digitsOnly.slice(-10); // Take last 10 digits
      }
    }

    // Create staff record for store manager
    const staffData = {
      name: user.name,
      email: user.email,
      phone: formattedPhone,
      employeeId: employeeId,
      role: 'store_manager',
      department: 'administration',
      dateOfJoining: user.createdAt || new Date(),
      salary: 0, // Can be updated later
      workingHours: 'full_time',
      status: 'active',
      hasSystemAccess: true,
      userAccount: userId, // Link to User account
      lastSeen: user.lastLogin || user.lastActivity, // Sync initial lastSeen
      lastActivity: user.lastActivity,
      permissions: ['inventory_read', 'inventory_write', 'sales_read', 'sales_write', 'reports_read', 'customer_management'],
      store: storeId,
      createdBy: userId
    };

    console.log(`📋 Staff data to create:`, {
      name: staffData.name,
      email: staffData.email,
      phone: staffData.phone,
      employeeId: staffData.employeeId,
      role: staffData.role
    });

    const newStaff = await Staff.create(staffData);
    console.log(`✅ Store manager added to staff collection: ${newStaff.name} (${newStaff.employeeId}) for store: ${storeId}`);
  } catch (error) {
    console.error('❌ Error ensuring store manager in staff:', error);
    console.error('Error details:', error.message);
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
    console.log(`👤 Requested by: ${req.user.name} (${req.user.email}) - Role: ${req.user.role}`);

    // Ensure store manager is in staff collection (CRITICAL - must complete before query)
    try {
      await ensureStoreManagerInStaff(storeId, req.user._id);
      console.log('✅ Store manager check completed');
    } catch (ensureError) {
      console.error('⚠️ Error in ensureStoreManagerInStaff:', ensureError);
      // Continue anyway - don't fail the entire request
    }

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
      .populate('userAccount', 'lastLogin lastActivity')
      .lean(); // Use lean for better performance

    // Sync lastSeen from User's lastLogin for staff with system access
    const staffWithLastSeen = staff.map(member => {
      if (member.hasSystemAccess && member.userAccount) {
        // Use the most recent of lastLogin or lastActivity from User account
        const userLastSeen = member.userAccount.lastLogin || member.userAccount.lastActivity;
        if (userLastSeen && (!member.lastSeen || new Date(userLastSeen) > new Date(member.lastSeen))) {
          member.lastSeen = userLastSeen;
        }
      }
      return member;
    });

    console.log(`✅ Staff returned: ${staffWithLastSeen.length}`);
    staffWithLastSeen.forEach(s => {
      console.log(`  - ${s.name} (${s.role}) - Status: ${s.status} - ID: ${s.employeeId} - Last Seen: ${s.lastSeen || 'Never'}`);
    });

    res.status(200).json({
      success: true,
      count: staffWithLastSeen.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: staffWithLastSeen
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
    let staff = await Staff.findOne({
      _id: req.params.id,
      store: storeId
    })
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name')
    .populate('userAccount', 'lastLogin lastActivity')
    .lean();

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Sync lastSeen from User's lastLogin for staff with system access
    if (staff.hasSystemAccess && staff.userAccount) {
      const userLastSeen = staff.userAccount.lastLogin || staff.userAccount.lastActivity;
      if (userLastSeen && (!staff.lastSeen || new Date(userLastSeen) > new Date(staff.lastSeen))) {
        staff.lastSeen = userLastSeen;
      }
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

    // ✅ Create User account if hasSystemAccess is true
    if (req.body.hasSystemAccess) {
      try {
        const User = require('../models/User');

        // Check if user with this email already exists
        const existingUser = await User.findOne({ email: staff.email });

        if (existingUser) {
          // Link existing user account
          staff.userAccount = existingUser._id;
          await staff.save();
          console.log(`✅ Linked existing User account for ${staff.name}`);
        } else {
          // Create new user account
          const defaultPassword = req.body.password || 'ShelfCure@123';
          const newUser = await User.create({
            name: staff.name,
            email: staff.email,
            phone: staff.phone,
            password: defaultPassword,
            role: staff.role === 'store_manager' ? 'store_manager' : 'staff',
            stores: [storeId],
            currentStore: storeId,
            isActive: true,
            emailVerified: true
          });

          // Link user account to staff
          staff.userAccount = newUser._id;
          await staff.save();
          console.log(`✅ Created User account for ${staff.name} with default password`);
        }
      } catch (userError) {
        console.error(`⚠️ Failed to create/link User account for ${staff.name}:`, userError.message);
        // Don't fail staff creation if user account creation fails
      }
    }

    // ✅ FIX #1: Auto-create salary configuration for new staff
    try {
      const defaultConfig = StaffSalaryConfig.getDefaultConfigForRole(staff.role);

      await StaffSalaryConfig.create({
        staff: staff._id,
        store: storeId,
        ...defaultConfig,
        createdBy: req.user._id
      });

      console.log(`✅ Auto-created salary config for ${staff.name} (${staff.role}): ₹${defaultConfig.baseSalary}`);
    } catch (configError) {
      console.error(`⚠️ Failed to create salary config for ${staff.name}:`, configError.message);
      // Don't fail staff creation if salary config fails - it can be created later
    }

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

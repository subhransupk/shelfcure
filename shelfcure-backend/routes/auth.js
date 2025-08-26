const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Store = require('../models/Store');
const Subscription = require('../models/Subscription');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role = 'staff' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role
    });

    // Generate JWT token
    const token = user.getSignedJwtToken();

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user and include password
    const user = await User.findOne({ email })
      .select('+password')
      .populate('currentStore', 'name')
      .populate('stores', 'name');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      // Increment login attempts
      user.loginAttempts += 1;

      // Lock account after 5 failed attempts for 30 minutes
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
      }

      await user.save();

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = user.getSignedJwtToken();

    // Remove password from response
    user.password = undefined;

    // Set cookie
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    res.cookie('token', token, cookieOptions);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        currentStore: user.currentStore,
        permissions: user.permissions,
        preferences: user.preferences,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
});

// @desc    Admin login with enhanced security
// @route   POST /api/auth/admin-login
// @access  Public
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Mock admin users for development (when database is not available)
    const mockAdminUsers = [
      {
        _id: '507f1f77bcf86cd799439011',
        name: 'System Administrator',
        email: 'admin@shelfcure.com',
        password: 'admin123',
        role: 'superadmin',
        isActive: true,
        currentStore: { _id: '507f1f77bcf86cd799439012', name: 'Main Store' },
        stores: [{ _id: '507f1f77bcf86cd799439012', name: 'Main Store' }],
        permissions: {
          inventory: { view: true, add: true, edit: true, delete: true },
          sales: { view: true, create: true, edit: true, delete: true, refund: true },
          purchases: { view: true, create: true, edit: true, delete: true },
          customers: { view: true, add: true, edit: true, delete: true },
          reports: { view: true, export: true },
          settings: { view: true, edit: true }
        }
      }
    ];

    // Try database first, fallback to mock data
    let user = null;

    try {
      // Check for admin user and include password
      user = await User.findOne({
        email,
        role: { $in: ['superadmin', 'admin'] }
      })
        .select('+password')
        .populate('currentStore', 'name')
        .populate('stores', 'name');
    } catch (dbError) {
      console.log('Database not available, using mock data');
      // Use mock data
      user = mockAdminUsers.find(u => u.email === email && ['superadmin', 'admin'].includes(u.role));
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Admin account is temporarily locked due to too many failed login attempts'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin account is deactivated'
      });
    }

    // Check if password matches
    let isMatch = false;

    if (user.matchPassword) {
      // Database user with hashed password
      isMatch = await user.matchPassword(password);
    } else {
      // Mock user with plain text password (for development only)
      isMatch = user.password === password;
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // For database users, update login info
    if (user.save) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      user.lastLogin = new Date();
      await user.save();
    }

    // Generate JWT token with longer expiry for admin
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '12h' } // 12 hours for admin sessions
    );

    // Remove password from response
    user.password = undefined;

    // Set secure cookie
    const cookieOptions = {
      expires: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    res.cookie('adminToken', token, cookieOptions);

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        currentStore: user.currentStore,
        permissions: user.permissions,
        preferences: user.preferences,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin login',
      error: error.message
    });
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('currentStore', 'name')
      .select('-password');

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user data',
      error: error.message
    });
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.cookie('adminToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, preferences } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile',
      error: error.message
    });
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error changing password',
      error: error.message
    });
  }
});

// @desc    Switch current store
// @route   PUT /api/auth/switch-store
// @access  Private
router.put('/switch-store', protect, async (req, res) => {
  try {
    const { storeId } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide store ID'
      });
    }

    const user = await User.findById(req.user.id);

    // Check if user has access to this store
    if (!user.stores.includes(storeId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this store'
      });
    }

    // Verify store exists
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Update current store
    user.currentStore = storeId;
    await user.save();

    await user.populate('currentStore', 'name');

    res.status(200).json({
      success: true,
      message: 'Store switched successfully',
      currentStore: user.currentStore
    });
  } catch (error) {
    console.error('Switch store error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error switching store',
      error: error.message
    });
  }
});

// @desc    Test route
// @route   GET /api/auth/test
// @access  Public
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes working!',
    timestamp: new Date().toISOString()
  });
});

// @desc    Test admin authentication
// @route   GET /api/auth/admin/test
// @access  Private/Admin
router.get('/admin/test', protect, authorize('superadmin', 'admin'), async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin authentication working',
    user: {
      id: req.user.id,
      role: req.user.role,
      name: req.user.name
    }
  });
});

// @desc    Get all users (Admin only)
// @route   GET /api/auth/admin/users
// @access  Private/Admin
router.get('/admin/users', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    console.log(`Admin users request from user: ${req.user.email} Role: ${req.user.role}`);

    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for admin users, using mock data');

      // Return mock users data
      const mockUsers = [
        {
          _id: '1',
          name: 'John Doe',
          email: 'john@pharmacy.com',
          phone: '+1234567890',
          role: 'store_owner',
          isActive: true,
          emailVerified: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
          lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          currentStore: {
            _id: 'store1',
            name: 'City Pharmacy'
          },
          stores: [
            {
              _id: 'store1',
              name: 'City Pharmacy'
            }
          ]
        },
        {
          _id: '2',
          name: 'Jane Smith',
          email: 'jane@medstore.com',
          phone: '+1234567891',
          role: 'store_owner',
          isActive: true,
          emailVerified: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25), // 25 days ago
          lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          currentStore: {
            _id: 'store2',
            name: 'MedStore Plus'
          },
          stores: [
            {
              _id: 'store2',
              name: 'MedStore Plus'
            }
          ]
        },
        {
          _id: '3',
          name: 'Mike Johnson',
          email: 'mike@healthmart.com',
          phone: '+1234567892',
          role: 'store_manager',
          isActive: true,
          emailVerified: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20), // 20 days ago
          lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
          currentStore: {
            _id: 'store3',
            name: 'HealthMart'
          },
          stores: [
            {
              _id: 'store3',
              name: 'HealthMart'
            }
          ]
        },
        {
          _id: '4',
          name: 'Sarah Wilson',
          email: 'sarah@quickmed.com',
          phone: '+1234567893',
          role: 'store_owner',
          isActive: false,
          emailVerified: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15), // 15 days ago
          lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
          currentStore: {
            _id: 'store4',
            name: 'QuickMed'
          },
          stores: [
            {
              _id: 'store4',
              name: 'QuickMed'
            }
          ]
        },
        {
          _id: '5',
          name: 'Tom Brown',
          email: 'tom@pharmacare.com',
          phone: '+1234567894',
          role: 'store_manager',
          isActive: true,
          emailVerified: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
          lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
          currentStore: {
            _id: 'store5',
            name: 'PharmaCare'
          },
          stores: [
            {
              _id: 'store5',
              name: 'PharmaCare'
            }
          ]
        }
      ];

      // Apply filters to mock data
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const role = req.query.role || '';
      const status = req.query.status || '';

      let filteredUsers = mockUsers;

      // Apply search filter
      if (search) {
        filteredUsers = filteredUsers.filter(user =>
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase()) ||
          user.phone.includes(search)
        );
      }

      // Apply role filter
      if (role) {
        filteredUsers = filteredUsers.filter(user => user.role === role);
      }

      // Apply status filter
      if (status === 'active') {
        filteredUsers = filteredUsers.filter(user => user.isActive === true);
      } else if (status === 'inactive') {
        filteredUsers = filteredUsers.filter(user => user.isActive === false);
      }

      // Apply pagination
      const total = filteredUsers.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

      return res.status(200).json({
        success: true,
        data: paginatedUsers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats: {
          totalUsers: mockUsers.length,
          activeUsers: mockUsers.filter(user => user.isActive).length,
          storeOwners: mockUsers.filter(user => ['superadmin', 'admin', 'store_owner'].includes(user.role)).length,
          storeManagers: mockUsers.filter(user => user.role === 'store_manager').length
        }
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';

    // Build query
    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Role filter
    if (role) {
      query.role = role;
    }

    // Status filter
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Get users with pagination
    const users = await User.find(query)
      .populate('currentStore', 'name')
      .populate('stores', 'name')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Get stats
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const storeOwners = await User.countDocuments({ role: { $in: ['superadmin', 'admin'] } });
    const storeManagers = await User.countDocuments({ role: 'manager' });

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalUsers,
        activeUsers,
        storeOwners,
        storeManagers
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting users',
      error: error.message
    });
  }
});

// @desc    Get single user (Admin only)
// @route   GET /api/auth/admin/users/:id
// @access  Private/Admin
router.get('/admin/users/:id', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    console.log(`Get single user request from user: ${req.user.email} Role: ${req.user.role} for user ID: ${req.params.id}`);

    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for get single user, using mock data');

      // Mock users data (same as in the list endpoint)
      const mockUsers = [
        {
          _id: '1',
          name: 'John Doe',
          email: 'john@pharmacy.com',
          phone: '+1234567890',
          role: 'store_owner',
          isActive: true,
          emailVerified: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
          lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          currentStore: {
            _id: 'store1',
            name: 'City Pharmacy'
          },
          stores: [
            {
              _id: 'store1',
              name: 'City Pharmacy'
            }
          ]
        },
        {
          _id: '2',
          name: 'Jane Smith',
          email: 'jane@medstore.com',
          phone: '+1234567891',
          role: 'store_owner',
          isActive: true,
          emailVerified: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25), // 25 days ago
          lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          currentStore: {
            _id: 'store2',
            name: 'MedStore Plus'
          },
          stores: [
            {
              _id: 'store2',
              name: 'MedStore Plus'
            }
          ]
        },
        {
          _id: '3',
          name: 'Mike Johnson',
          email: 'mike@healthmart.com',
          phone: '+1234567892',
          role: 'store_manager',
          isActive: true,
          emailVerified: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20), // 20 days ago
          lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
          currentStore: {
            _id: 'store3',
            name: 'HealthMart'
          },
          stores: [
            {
              _id: 'store3',
              name: 'HealthMart'
            }
          ]
        },
        {
          _id: '4',
          name: 'Sarah Wilson',
          email: 'sarah@quickmed.com',
          phone: '+1234567893',
          role: 'store_owner',
          isActive: false,
          emailVerified: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15), // 15 days ago
          lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
          currentStore: {
            _id: 'store4',
            name: 'QuickMed'
          },
          stores: [
            {
              _id: 'store4',
              name: 'QuickMed'
            }
          ]
        },
        {
          _id: '5',
          name: 'Tom Brown',
          email: 'tom@pharmacare.com',
          phone: '+1234567894',
          role: 'store_manager',
          isActive: true,
          emailVerified: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
          lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
          currentStore: {
            _id: 'store5',
            name: 'PharmaCare'
          },
          stores: [
            {
              _id: 'store5',
              name: 'PharmaCare'
            }
          ]
        }
      ];

      // Find the user by ID
      const user = mockUsers.find(u => u._id === req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: user
      });
    }

    const user = await User.findById(req.params.id)
      .populate('currentStore', 'name')
      .populate('stores', 'name')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user',
      error: error.message
    });
  }
});

// @desc    Create new user (Admin only)
// @route   POST /api/auth/admin/users
// @access  Private/Admin
router.post('/admin/users', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      stores,
      permissions,
      isActive,
      // Address fields
      address,
      city,
      state,
      pincode,
      // Subscription fields (for store owners)
      subscriptionPlan,
      maxStores,
      billingDuration,
      assignImmediately,
      startWithTrial,
      // Notification preferences
      sendWelcomeEmail,
      includeCredentialsInEmail,
      sendWhatsAppWelcome,
      // Admin notes
      notes
    } = req.body;

    console.log('Creating user with data:', {
      name, email, phone, role,
      subscriptionPlan, maxStores, billingDuration,
      assignImmediately, startWithTrial
    });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Set default password if not provided
    const userPassword = password || 'ShelfCure@123';

    // Prepare user data
    const userData = {
      name,
      email,
      phone,
      password: userPassword,
      role: role || 'staff',
      stores: stores || [],
      currentStore: stores && stores.length > 0 ? stores[0] : null,
      permissions: permissions || {},
      isActive: isActive !== undefined ? isActive : true,
      emailVerified: true // Admin created users are auto-verified
    };

    // Add address fields if provided
    if (address || city || state || pincode) {
      userData.address = {
        street: address || '',
        city: city || '',
        state: state || '',
        pincode: pincode || ''
      };
    }

    // Add admin notes if provided
    if (notes) {
      userData.adminNotes = notes;
    }

    // Create user
    const user = await User.create(userData);

    // Handle subscription creation for store owners
    if (role === 'store_owner' && subscriptionPlan) {
      console.log('Creating subscription for store owner:', {
        userId: user._id,
        subscriptionPlan,
        maxStores,
        billingDuration,
        assignImmediately,
        startWithTrial
      });

      try {
        // Get plan features and limits
        const planConfig = Subscription.getPlanFeatures(subscriptionPlan);

        // Calculate subscription end date based on billing duration
        let endDate = new Date();
        if (billingDuration === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else if (billingDuration === 'quarterly') {
          endDate.setMonth(endDate.getMonth() + 3);
        } else if (billingDuration === 'yearly') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }

        // Determine subscription status
        let subscriptionStatus = 'trial'; // Default
        let trialEndDate = null;

        if (startWithTrial) {
          subscriptionStatus = 'trial';
          trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days trial
          endDate = trialEndDate;
        } else if (assignImmediately) {
          subscriptionStatus = 'active';
        }

        // Calculate pricing
        const baseAmount = planConfig.pricing.amount;
        const taxAmount = Math.round(baseAmount * 0.18); // 18% GST
        const totalAmount = baseAmount + taxAmount;

        // Create the subscription
        const subscription = await Subscription.create({
          storeOwner: user._id,
          plan: subscriptionPlan,
          status: subscriptionStatus,
          billingDuration,
          startDate: new Date(),
          endDate: endDate,
          trialEndDate: trialEndDate,
          storeCountLimit: parseInt(maxStores) || planConfig.storeCountLimit,
          currentStoreCount: 0,
          features: planConfig.features,
          limits: planConfig.limits,
          pricing: {
            amount: baseAmount,
            currency: 'INR',
            taxAmount: taxAmount,
            discountAmount: 0,
            totalAmount: totalAmount
          },
          paymentStatus: startWithTrial ? 'pending' : (assignImmediately ? 'paid' : 'pending'),
          autoRenewal: true,
          createdBy: req.user.id
        });

        console.log('Subscription created successfully:', subscription._id);

        // Update user with subscription reference
        user.subscription = subscription._id;
        await user.save();

        console.log('User updated with subscription reference');

      } catch (subscriptionError) {
        console.error('Error creating subscription for store owner:', subscriptionError);
        // Don't fail the user creation if subscription creation fails
        // But log the error for debugging
      }
    }

    // Handle notification preferences
    if (sendWelcomeEmail) {
      console.log('Sending welcome email to:', email);
      // TODO: Send welcome email
    }

    if (sendWhatsAppWelcome) {
      console.log('Sending WhatsApp welcome to:', phone);
      // TODO: Send WhatsApp welcome message
    }

    // Populate stores for response
    await user.populate('currentStore', 'name');
    await user.populate('stores', 'name');

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
      subscription: role === 'store_owner' && subscriptionPlan ? {
        plan: subscriptionPlan,
        maxStores,
        billingDuration,
        status: startWithTrial ? 'trial' : (assignImmediately ? 'active' : 'pending')
      } : null
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating user',
      error: error.message
    });
  }
});

// @desc    Update user (Admin only)
// @route   PUT /api/auth/admin/users/:id
// @access  Private/Admin
router.put('/admin/users/:id', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { name, email, phone, role, stores, permissions, isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent superadmin from being deactivated by non-superadmin
    if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify superadmin user'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role && req.user.role === 'superadmin') user.role = role; // Only superadmin can change roles
    if (stores) {
      user.stores = stores;
      user.currentStore = stores.length > 0 ? stores[0] : null;
    }
    if (permissions) user.permissions = { ...user.permissions, ...permissions };
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    // Populate stores for response
    await user.populate('currentStore', 'name');
    await user.populate('stores', 'name');

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user',
      error: error.message
    });
  }
});

// @desc    Delete user (Admin only)
// @route   DELETE /api/auth/admin/users/:id
// @access  Private/Admin
router.delete('/admin/users/:id', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deletion of superadmin by non-superadmin
    if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete superadmin user'
      });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Delete associated subscriptions first
    const Subscription = require('../models/Subscription');
    const deletedSubscriptions = await Subscription.deleteMany({ storeOwner: user._id });
    console.log(`Deleted ${deletedSubscriptions.deletedCount} subscriptions for user ${user.email}`);

    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User and associated subscriptions deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user',
      error: error.message
    });
  }
});

module.exports = router;

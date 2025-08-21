const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Store = require('../models/Store');
const User = require('../models/User');

// @desc    Get all stores (Admin only)
// @route   GET /api/stores/admin/all
// @access  Private/Admin
router.get('/admin/all', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    console.log(`Admin stores request from user: ${req.user.email} Role: ${req.user.role}`);

    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for admin stores, using mock data');

      // Return mock stores data
      const mockStores = [
        {
          _id: '1',
          name: 'City Pharmacy',
          code: 'CP001',
          contact: {
            email: 'contact@citypharmacy.com',
            phone: '+91-9876543210',
            address: '123 Main Street, Mumbai, Maharashtra 400001'
          },
          business: {
            licenseNumber: 'LIC001',
            gstNumber: 'GST001',
            panNumber: 'PAN001'
          },
          subscription: {
            plan: 'premium',
            status: 'active',
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 335), // 335 days from now
            features: ['inventory', 'billing', 'analytics', 'whatsapp', 'ocr']
          },
          isActive: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
          owner: {
            _id: 'user1',
            name: 'John Doe',
            email: 'john@pharmacy.com',
            phone: '+91-9876543210'
          },
          createdBy: {
            _id: 'admin1',
            name: 'Admin User'
          }
        },
        {
          _id: '2',
          name: 'MedStore Plus',
          code: 'MSP002',
          contact: {
            email: 'info@medstoreplus.com',
            phone: '+91-9876543211',
            address: '456 Health Avenue, Delhi, Delhi 110001'
          },
          business: {
            licenseNumber: 'LIC002',
            gstNumber: 'GST002',
            panNumber: 'PAN002'
          },
          subscription: {
            plan: 'basic',
            status: 'active',
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25), // 25 days ago
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 340), // 340 days from now
            features: ['inventory', 'billing']
          },
          isActive: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          owner: {
            _id: 'user2',
            name: 'Jane Smith',
            email: 'jane@medstore.com',
            phone: '+91-9876543211'
          },
          createdBy: {
            _id: 'admin1',
            name: 'Admin User'
          }
        },
        {
          _id: '3',
          name: 'HealthMart',
          code: 'HM003',
          contact: {
            email: 'support@healthmart.com',
            phone: '+91-9876543212',
            address: '789 Wellness Road, Bangalore, Karnataka 560001'
          },
          business: {
            licenseNumber: 'LIC003',
            gstNumber: 'GST003',
            panNumber: 'PAN003'
          },
          subscription: {
            plan: 'standard',
            status: 'active',
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20), // 20 days ago
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 345), // 345 days from now
            features: ['inventory', 'billing', 'analytics']
          },
          isActive: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
          owner: {
            _id: 'user3',
            name: 'Mike Johnson',
            email: 'mike@healthmart.com',
            phone: '+91-9876543212'
          },
          createdBy: {
            _id: 'admin1',
            name: 'Admin User'
          }
        },
        {
          _id: '4',
          name: 'QuickMed',
          code: 'QM004',
          contact: {
            email: 'hello@quickmed.com',
            phone: '+91-9876543213',
            address: '321 Fast Lane, Chennai, Tamil Nadu 600001'
          },
          business: {
            licenseNumber: 'LIC004',
            gstNumber: 'GST004',
            panNumber: 'PAN004'
          },
          subscription: {
            plan: 'basic',
            status: 'expired',
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 380), // 380 days ago
            endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15), // 15 days ago
            features: ['inventory', 'billing']
          },
          isActive: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 380),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
          owner: {
            _id: 'user4',
            name: 'Sarah Wilson',
            email: 'sarah@quickmed.com',
            phone: '+91-9876543213'
          },
          createdBy: {
            _id: 'admin1',
            name: 'Admin User'
          }
        },
        {
          _id: '5',
          name: 'PharmaCare',
          code: 'PC005',
          contact: {
            email: 'care@pharmacare.com',
            phone: '+91-9876543214',
            address: '654 Care Street, Pune, Maharashtra 411001'
          },
          business: {
            licenseNumber: 'LIC005',
            gstNumber: 'GST005',
            panNumber: 'PAN005'
          },
          subscription: {
            plan: 'premium',
            status: 'active',
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 355), // 355 days from now
            features: ['inventory', 'billing', 'analytics', 'whatsapp', 'ocr']
          },
          isActive: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
          owner: {
            _id: 'user5',
            name: 'Tom Brown',
            email: 'tom@pharmacare.com',
            phone: '+91-9876543214'
          },
          createdBy: {
            _id: 'admin1',
            name: 'Admin User'
          }
        }
      ];

      // Apply filters to mock data
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';
      const subscriptionStatus = req.query.subscriptionStatus || '';
      const subscriptionPlan = req.query.subscriptionPlan || '';
      const isActive = req.query.isActive;

      let filteredStores = mockStores;

      // Apply search filter
      if (search) {
        filteredStores = filteredStores.filter(store =>
          store.name.toLowerCase().includes(search.toLowerCase()) ||
          store.code.toLowerCase().includes(search.toLowerCase()) ||
          store.contact.email.toLowerCase().includes(search.toLowerCase()) ||
          store.business.licenseNumber.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Apply subscription status filter
      if (subscriptionStatus) {
        filteredStores = filteredStores.filter(store => store.subscription.status === subscriptionStatus);
      }

      // Apply subscription plan filter
      if (subscriptionPlan) {
        filteredStores = filteredStores.filter(store => store.subscription.plan === subscriptionPlan);
      }

      // Apply active status filter
      if (isActive !== undefined) {
        filteredStores = filteredStores.filter(store => store.isActive === (isActive === 'true'));
      }

      // Apply pagination
      const total = filteredStores.length;
      const skip = (page - 1) * limit;
      const paginatedStores = filteredStores.slice(skip, skip + limit);

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return res.status(200).json({
        success: true,
        data: paginatedStores,
        pagination: {
          currentPage: page,
          totalPages,
          totalStores: total,
          limit,
          hasNextPage,
          hasPrevPage
        }
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};

    // Search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { 'contact.email': searchRegex },
        { 'business.licenseNumber': searchRegex }
      ];
    }

    // Filter by subscription status
    if (req.query.subscriptionStatus) {
      query['subscription.status'] = req.query.subscriptionStatus;
    }

    // Filter by subscription plan
    if (req.query.subscriptionPlan) {
      query['subscription.plan'] = req.query.subscriptionPlan;
    }

    // Filter by active status
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    // Get stores with pagination
    const stores = await Store.find(query)
      .populate('owner', 'name email phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Store.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      data: stores,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching stores',
      error: error.message
    });
  }
});

// @desc    Get store by ID (Admin only)
// @route   GET /api/stores/admin/:id
// @access  Private/Admin
router.get('/admin/:id', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    console.log(`Get single store request from user: ${req.user.email} Role: ${req.user.role} for store ID: ${req.params.id}`);

    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for get single store, using mock data');

      // Mock stores data (same as in the list endpoint)
      const mockStores = [
        {
          _id: '1',
          name: 'City Pharmacy',
          code: 'CP001',
          contact: {
            email: 'contact@citypharmacy.com',
            phone: '+91-9876543210',
            address: '123 Main Street, Mumbai, Maharashtra 400001'
          },
          business: {
            licenseNumber: 'LIC001',
            gstNumber: 'GST001',
            panNumber: 'PAN001'
          },
          subscription: {
            plan: 'premium',
            status: 'active',
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 335),
            features: ['inventory', 'billing', 'analytics', 'whatsapp', 'ocr']
          },
          isActive: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
          owner: {
            _id: 'user1',
            name: 'John Doe',
            email: 'john@pharmacy.com',
            phone: '+91-9876543210',
            role: 'store_owner'
          },
          createdBy: {
            _id: 'admin1',
            name: 'Admin User',
            email: 'admin@shelfcure.com'
          },
          updatedBy: {
            _id: 'admin1',
            name: 'Admin User',
            email: 'admin@shelfcure.com'
          }
        },
        {
          _id: '2',
          name: 'MedStore Plus',
          code: 'MSP002',
          contact: {
            email: 'info@medstoreplus.com',
            phone: '+91-9876543211',
            address: '456 Health Avenue, Delhi, Delhi 110001'
          },
          business: {
            licenseNumber: 'LIC002',
            gstNumber: 'GST002',
            panNumber: 'PAN002'
          },
          subscription: {
            plan: 'basic',
            status: 'active',
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 340),
            features: ['inventory', 'billing']
          },
          isActive: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          owner: {
            _id: 'user2',
            name: 'Jane Smith',
            email: 'jane@medstore.com',
            phone: '+91-9876543211',
            role: 'store_owner'
          },
          createdBy: {
            _id: 'admin1',
            name: 'Admin User',
            email: 'admin@shelfcure.com'
          },
          updatedBy: {
            _id: 'admin1',
            name: 'Admin User',
            email: 'admin@shelfcure.com'
          }
        }
      ];

      // Find the store by ID
      const store = mockStores.find(s => s._id === req.params.id);

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      // Mock store users
      const mockStoreUsers = [
        {
          _id: 'user1',
          name: 'John Doe',
          email: 'john@pharmacy.com',
          phone: '+91-9876543210',
          role: 'store_owner',
          isActive: true,
          lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
        },
        {
          _id: 'user3',
          name: 'Mike Johnson',
          email: 'mike@healthmart.com',
          phone: '+91-9876543212',
          role: 'store_manager',
          isActive: true,
          lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 6) // 6 hours ago
        }
      ];

      return res.status(200).json({
        success: true,
        data: {
          store,
          users: mockStoreUsers
        }
      });
    }

    const store = await Store.findById(req.params.id)
      .populate('owner', 'name email phone role')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Get store users
    const storeUsers = await User.find({ stores: store._id })
      .select('name email phone role isActive lastLogin')
      .sort({ role: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: {
        store,
        users: storeUsers
      }
    });
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching store',
      error: error.message
    });
  }
});

// @desc    Update store (Admin only)
// @route   PUT /api/stores/admin/:id
// @access  Private/Admin
router.put('/admin/:id', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Update allowed fields
    const allowedFields = [
      'name', 'description', 'contact', 'address', 'business',
      'settings', 'subscription', 'isActive', 'theme'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] === 'object' && req.body[field] !== null) {
          store[field] = { ...store[field], ...req.body[field] };
        } else {
          store[field] = req.body[field];
        }
      }
    });

    store.updatedBy = req.user.id;
    await store.save();

    // Populate for response
    await store.populate('owner', 'name email phone');
    await store.populate('updatedBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Store updated successfully',
      data: store
    });
  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating store',
      error: error.message
    });
  }
});

module.exports = router;

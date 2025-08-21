const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require authentication
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');

      // Try to get user from database first, fallback to mock data
      let user = null;

      try {
        user = await User.findById(decoded.id)
          .populate('currentStore', 'name')
          .select('-password');
      } catch (dbError) {
        console.log('Database not available, using mock user data');
        // Mock admin users for development (when database is not available)
        const mockAdminUsers = [
          {
            _id: '507f1f77bcf86cd799439011',
            id: '507f1f77bcf86cd799439011',
            name: 'System Administrator',
            email: 'admin@shelfcure.com',
            phone: '+91-9876543210',
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

        user = mockAdminUsers.find(u => u._id === decoded.id || u.id === decoded.id);
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('Authorization check - User:', req.user?.email, 'Role:', req.user?.role, 'Required roles:', roles);

    if (!req.user) {
      console.log('Authorization failed: No user in request');
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      console.log(`Authorization failed: User role ${req.user.role} not in required roles:`, roles);
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    console.log('Authorization successful');
    next();
  };
};

// Store context middleware - ensure user has access to the store
const storeContext = async (req, res, next) => {
  try {
    const storeId = req.headers['x-store-context'] || req.body.storeId || req.query.storeId;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store context is required'
      });
    }

    // Check if user has access to this store
    const user = req.user;
    const userStores = user.stores || [];
    const hasAccess = userStores.some(store => store.toString() === storeId) ||
                     user.role === 'superadmin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this store'
      });
    }

    req.storeId = storeId;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in store context validation'
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id)
          .populate('currentStore', 'name')
          .select('-password');
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token invalid, but continue without user
        req.user = null;
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in optional authentication'
    });
  }
};

module.exports = {
  protect,
  authorize,
  storeContext,
  optionalAuth
};

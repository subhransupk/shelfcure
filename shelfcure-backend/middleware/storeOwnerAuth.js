const User = require('../models/User');
const Subscription = require('../models/Subscription');

// @desc    Ensure user is a store owner with active subscription
const storeOwnerOnly = async (req, res, next) => {
  try {
  // Check if user is authenticated (should be handled by protect middleware)
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication required.'
    });
  }

  // Check if user role is store_owner
  if (req.user.role !== 'store_owner') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Store owner role required.'
    });
  }

  // Check if store owner has an active subscription
  const subscription = await Subscription.findOne({ 
    storeOwner: req.user.id 
  });

  if (!subscription) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. No subscription found. Please contact support.'
    });
  }

  // Check if subscription is active or in trial
  if (!['active', 'trial'].includes(subscription.status)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Subscription is not active. Please renew your subscription.',
      subscriptionStatus: subscription.status,
      subscriptionEndDate: subscription.endDate
    });
  }

  // Check if subscription has expired
  if (subscription.endDate && new Date() > subscription.endDate) {
    // Update subscription status to expired
    subscription.status = 'expired';
    await subscription.save();

    return res.status(403).json({
      success: false,
      message: 'Access denied. Subscription has expired. Please renew your subscription.',
      subscriptionStatus: 'expired',
      subscriptionEndDate: subscription.endDate
    });
  }

  // Add subscription info to request for use in controllers
  req.subscription = subscription;

  next();
  } catch (error) {
    console.error('Store owner auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// @desc    Check if store owner can create more stores
const checkStoreLimit = async (req, res, next) => {
  try {
  const subscription = req.subscription;

  if (!subscription) {
    return res.status(403).json({
      success: false,
      message: 'Subscription information not found.'
    });
  }

  // Check if store owner can create more stores
  if (!subscription.canCreateStore()) {
    return res.status(400).json({
      success: false,
      message: `Store limit reached. Your ${subscription.plan} plan allows ${subscription.storeCountLimit} stores. You currently have ${subscription.currentStoreCount} stores.`,
      currentStoreCount: subscription.currentStoreCount,
      storeCountLimit: subscription.storeCountLimit,
      plan: subscription.plan
    });
  }

  next();
});

// @desc    Check if feature is available in current subscription plan
const checkFeatureAccess = (featureName) => {
  return asyncHandler(async (req, res, next) => {
    const subscription = req.subscription;

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'Subscription information not found.'
      });
    }

    // Check if feature is available in current plan
    if (!subscription.features[featureName]) {
      return res.status(403).json({
        success: false,
        message: `This feature is not available in your ${subscription.plan} plan. Please upgrade your subscription.`,
        feature: featureName,
        currentPlan: subscription.plan,
        availableFeatures: Object.keys(subscription.features).filter(key => subscription.features[key])
      });
    }

    next();
  });
};

// @desc    Check subscription limits (users, products, transactions, etc.)
const checkSubscriptionLimits = (limitType) => {
  return asyncHandler(async (req, res, next) => {
    const subscription = req.subscription;

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'Subscription information not found.'
      });
    }

    const limits = subscription.limits;
    let currentCount = 0;
    let limitValue = limits[limitType];

    // Get current count based on limit type
    switch (limitType) {
      case 'maxUsers':
        const User = require('../models/User');
        currentCount = await User.countDocuments({
          stores: { $in: req.user.stores },
          isActive: true
        });
        break;
      
      case 'maxProducts':
        const Medicine = require('../models/Medicine');
        currentCount = await Medicine.countDocuments({
          store: { $in: req.user.stores },
          isActive: true
        });
        break;
      
      case 'maxTransactions':
        // This would depend on your transaction/sales model
        // For now, we'll skip this check
        return next();
      
      default:
        return next();
    }

    // Check if limit is exceeded
    if (limitValue !== -1 && currentCount >= limitValue) {
      return res.status(400).json({
        success: false,
        message: `${limitType} limit reached. Your ${subscription.plan} plan allows ${limitValue} ${limitType.replace('max', '').toLowerCase()}. You currently have ${currentCount}.`,
        currentCount,
        limit: limitValue,
        plan: subscription.plan
      });
    }

    next();
  });
};

// @desc    Validate store ownership
const validateStoreOwnership = asyncHandler(async (req, res, next) => {
  const storeId = req.params.storeId || req.params.id;
  
  if (!storeId) {
    return res.status(400).json({
      success: false,
      message: 'Store ID is required.'
    });
  }

  const Store = require('../models/Store');
  const store = await Store.findOne({
    _id: storeId,
    owner: req.user.id,
    isActive: true
  });

  if (!store) {
    return res.status(404).json({
      success: false,
      message: 'Store not found or access denied.'
    });
  }

  // Add store to request for use in controllers
  req.store = store;
  
  next();
});

// @desc    Log store owner activities for audit
const logStoreOwnerActivity = (action) => {
  return asyncHandler(async (req, res, next) => {
    // This middleware can be used to log important store owner activities
    // For now, we'll just add the activity info to the request
    req.activityLog = {
      storeOwner: req.user.id,
      action,
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };

    // In a production environment, you might want to save this to a separate audit log collection
    
    next();
  });
};

module.exports = {
  storeOwnerOnly,
  checkStoreLimit,
  checkFeatureAccess,
  checkSubscriptionLimits,
  validateStoreOwnership,
  logStoreOwnerActivity
};

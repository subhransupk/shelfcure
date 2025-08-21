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
  } catch (error) {
    console.error('Store limit check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during store limit check'
    });
  }
};

// @desc    Check if feature is available in current subscription plan
const checkFeatureAccess = (featureName) => {
  return async (req, res, next) => {
    try {
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
    } catch (error) {
      console.error('Feature access check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during feature access check'
      });
    }
  };
};

// @desc    Validate store ownership
const validateStoreOwnership = async (req, res, next) => {
  try {
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
  } catch (error) {
    console.error('Store ownership validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during store ownership validation'
    });
  }
};

// @desc    Log store owner activities for audit
const logStoreOwnerActivity = (action) => {
  return async (req, res, next) => {
    try {
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
    } catch (error) {
      console.error('Activity logging error:', error);
      // Don't fail the request for logging errors
      next();
    }
  };
};

module.exports = {
  storeOwnerOnly,
  checkStoreLimit,
  checkFeatureAccess,
  validateStoreOwnership,
  logStoreOwnerActivity
};

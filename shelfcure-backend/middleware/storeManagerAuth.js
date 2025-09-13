const User = require('../models/User');
const Store = require('../models/Store');

// @desc    Ensure user is a store manager with access to a specific store
const storeManagerOnly = async (req, res, next) => {
  try {
    console.log('=== STORE MANAGER AUTH MIDDLEWARE ===');
    console.log('User:', req.user ? req.user.email : 'None');
    console.log('User Role:', req.user ? req.user.role : 'None');

    // Check if user is authenticated (should be handled by protect middleware)
    if (!req.user) {
      console.log('❌ No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    // Check if user role is store_manager
    if (req.user.role !== 'store_manager') {
      console.log('❌ User role is not store_manager:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Store manager role required.'
      });
    }

    console.log('✅ User role verified as store_manager');

    // Find the store where this user is a manager
    console.log('Looking for store with manager ID:', req.user.id);

    // First try to find store in user's stores array
    let store = null;
    if (req.user.stores && req.user.stores.length > 0) {
      console.log('User has stores array:', req.user.stores);
      store = await Store.findOne({
        _id: { $in: req.user.stores },
        isActive: true
      }).populate('owner', 'name email');
      console.log('Found store via user.stores:', !!store);
    }

    // If not found, try the staff array approach
    if (!store) {
      console.log('Trying staff array approach...');
      store = await Store.findOne({
        'staff.user': req.user.id,
        'staff.role': 'store_manager',
        'staff.isActive': true,
        isActive: true
      }).populate('owner', 'name email');
      console.log('Found store via staff array:', !!store);
    }

    // If still not found, try managers array
    if (!store) {
      console.log('Trying managers array approach...');
      store = await Store.findOne({
        managers: req.user.id,
        isActive: true
      }).populate('owner', 'name email');
      console.log('Found store via managers array:', !!store);
    }

    console.log('Store found:', !!store);
    if (store) {
      console.log('Store details:', {
        name: store.name,
        code: store.code,
        staffCount: store.staff ? store.staff.length : 0
      });
    }

    if (!store) {
      console.log('❌ No active store assignment found for user');
      console.log('User details:', {
        id: req.user.id,
        role: req.user.role,
        stores: req.user.stores,
        currentStore: req.user.currentStore
      });

      // Try to find any store this user might be associated with for debugging
      const anyStore = await Store.findOne({
        $or: [
          { owner: req.user.id },
          { 'staff.user': req.user.id },
          { managers: req.user.id }
        ],
        isActive: true
      });

      console.log('Any store association found:', !!anyStore);
      if (anyStore) {
        console.log('Store found but conditions not met:', {
          storeId: anyStore._id,
          storeName: anyStore.name,
          owner: anyStore.owner,
          hasStaff: !!anyStore.staff,
          staffCount: anyStore.staff ? anyStore.staff.length : 0
        });
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied. No active store assignment found.'
      });
    }

    // Check if the store owner has an active subscription
    console.log('Checking store owner subscription...');
    console.log('Store owner ID:', store.owner._id);

    const storeOwner = await User.findById(store.owner._id).populate('subscription');

    console.log('Store owner found:', !!storeOwner);
    if (storeOwner) {
      console.log('Store owner details:', {
        name: storeOwner.name,
        email: storeOwner.email,
        hasSubscription: !!storeOwner.subscription
      });
    }

    if (!storeOwner || !storeOwner.subscription) {
      console.log('❌ Store owner or subscription not found');
      return res.status(403).json({
        success: false,
        message: 'Store access denied. Store owner subscription not found.'
      });
    }

    console.log('Subscription status:', storeOwner.subscription.status);
    if (!['active', 'trial'].includes(storeOwner.subscription.status)) {
      console.log('❌ Store owner subscription is not active or in trial');
      return res.status(403).json({
        success: false,
        message: 'Store access denied. Store owner subscription is not active or in trial.'
      });
    }

    // Check if subscription has expired
    if (storeOwner.subscription.endDate && new Date() > storeOwner.subscription.endDate) {
      console.log('❌ Store owner subscription has expired');
      return res.status(403).json({
        success: false,
        message: 'Store access denied. Store owner subscription has expired.'
      });
    }

    // Add store and subscription info to request for use in controllers
    console.log('✅ All checks passed! Adding store info to request...');
    req.store = store;
    req.storeOwnerSubscription = storeOwner.subscription;

    console.log('✅ Calling next() - middleware complete');
    next();
  } catch (error) {
    console.error('Store manager authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during store manager authentication'
    });
  }
};

// @desc    Validate store context for store manager
const validateStoreContext = async (req, res, next) => {
  try {
    const storeId = req.params.storeId || req.params.id || req.headers['x-store-context'];
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required.'
      });
    }

    // Ensure the store ID matches the manager's assigned store
    if (req.store && req.store._id.toString() !== storeId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your assigned store.'
      });
    }

    next();
  } catch (error) {
    console.error('Store context validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during store context validation'
    });
  }
};

// @desc    Check feature access based on subscription plan
const checkFeatureAccess = (feature) => {
  return async (req, res, next) => {
    try {
      const subscription = req.storeOwnerSubscription;

      if (!subscription) {
        return res.status(403).json({
          success: false,
          message: 'Subscription information not found.'
        });
      }

      console.log(`🔍 Checking feature access for '${feature}'`);
      console.log('📋 Subscription plan:', subscription.plan);
      console.log('🎯 Subscription features:', subscription.features);

      // Check if subscription has features object (new structure)
      if (subscription.features && typeof subscription.features === 'object') {
        // Map feature names to subscription feature keys
        const featureMapping = {
          'inventory': 'inventoryManagement',
          'sales': 'salesManagement',
          'customers': 'customerManagement',
          'purchases': 'purchaseManagement',
          'doctors': 'doctorManagement',
          'staff': 'staffManagement',
          'analytics': 'analytics',
          'reports': 'customReports',
          'bill_ocr': 'billOCR',
          'whatsapp': 'whatsappIntegration',
          'multi_store': 'multiStore'
        };

        const subscriptionFeatureKey = featureMapping[feature] || feature;
        const hasFeatureAccess = subscription.features[subscriptionFeatureKey];
        console.log(`✅ Feature '${feature}' (${subscriptionFeatureKey}) access:`, hasFeatureAccess);

        if (!hasFeatureAccess) {
          return res.status(403).json({
            success: false,
            message: `Feature '${feature}' is not available in your ${subscription.plan} plan.`,
            plan: subscription.plan,
            availableFeatures: Object.keys(subscription.features).filter(key => subscription.features[key])
          });
        }
      } else {
        // Fallback to plan-based feature access (old structure)
        const featureAccess = {
          basic: ['inventory', 'sales', 'customers', 'purchases', 'doctors', 'staff'],
          standard: ['inventory', 'sales', 'customers', 'purchases', 'doctors', 'staff', 'analytics', 'reports'],
          premium: ['inventory', 'sales', 'customers', 'purchases', 'doctors', 'staff', 'analytics', 'reports', 'advanced_analytics', 'bill_ocr'],
          enterprise: ['inventory', 'sales', 'customers', 'purchases', 'doctors', 'staff', 'analytics', 'reports', 'advanced_analytics', 'bill_ocr', 'api_access']
        };

        const allowedFeatures = featureAccess[subscription.plan] || [];

        if (!allowedFeatures.includes(feature)) {
          return res.status(403).json({
            success: false,
            message: `Feature '${feature}' is not available in your ${subscription.plan} plan.`,
            plan: subscription.plan,
            availableFeatures: allowedFeatures
          });
        }
      }

      console.log(`✅ Feature access granted for '${feature}'`);
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

// @desc    Log store manager activities for audit
const logStoreManagerActivity = (action) => {
  return async (req, res, next) => {
    try {
      // Add activity info to request for logging
      req.activityLog = {
        storeManager: req.user.id,
        store: req.store._id,
        action,
        timestamp: new Date(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };

      // In a production environment, you might want to save this to a separate audit log collection
      
      next();
    } catch (error) {
      console.error('Activity logging error:', error);
      // Don't fail the request if logging fails
      next();
    }
  };
};

module.exports = {
  storeManagerOnly,
  validateStoreContext,
  checkFeatureAccess,
  logStoreManagerActivity
};

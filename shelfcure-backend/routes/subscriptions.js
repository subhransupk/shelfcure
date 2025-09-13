const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Subscription = require('../models/Subscription');
const Store = require('../models/Store');
const Invoice = require('../models/Invoice');

// @desc    Get all subscription plans (Admin only)
// @route   GET /api/subscriptions/plans/admin
// @access  Private/Admin
router.get('/plans/admin', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for subscription plans, using mock data');

      const mockPlans = [
        {
          _id: '1',
          name: 'Basic Plan',
          description: 'Perfect for small pharmacies just getting started',
          planType: 'basic',
          pricing: {
            monthly: 999,
            yearly: 9999,
            currency: 'INR'
          },
          features: {
            maxStores: 1,
            maxUsers: 3,
            inventoryManagement: true,
            billingSystem: true,
            basicReports: true,
            customerSupport: 'email',
            whatsappIntegration: false,
            ocrBillScanning: false,
            advancedAnalytics: false,
            multiStoreManagement: false,
            affiliateProgram: false
          },
          isActive: true,
          sortOrder: 1,
          createdBy: { name: 'System Admin' },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90)
        },
        {
          _id: '2',
          name: 'Premium Plan',
          description: 'Advanced features for growing pharmacy businesses',
          planType: 'premium',
          pricing: {
            monthly: 2999,
            yearly: 29999,
            currency: 'INR'
          },
          features: {
            maxStores: 3,
            maxUsers: 10,
            inventoryManagement: true,
            billingSystem: true,
            basicReports: true,
            customerSupport: 'phone',
            whatsappIntegration: true,
            ocrBillScanning: true,
            advancedAnalytics: true,
            multiStoreManagement: true,
            affiliateProgram: false
          },
          isActive: true,
          sortOrder: 2,
          createdBy: { name: 'System Admin' },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90)
        },
        {
          _id: '3',
          name: 'Enterprise Plan',
          description: 'Complete solution for large pharmacy chains',
          planType: 'enterprise',
          pricing: {
            monthly: 4999,
            yearly: 49999,
            currency: 'INR'
          },
          features: {
            maxStores: 10,
            maxUsers: 50,
            inventoryManagement: true,
            billingSystem: true,
            basicReports: true,
            customerSupport: 'priority',
            whatsappIntegration: true,
            ocrBillScanning: true,
            advancedAnalytics: true,
            multiStoreManagement: true,
            affiliateProgram: true
          },
          isActive: true,
          sortOrder: 3,
          createdBy: { name: 'System Admin' },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90)
        }
      ];

      return res.status(200).json({
        success: true,
        data: mockPlans
      });
    }

    const plans = await SubscriptionPlan.find()
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort({ sortOrder: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching subscription plans',
      error: error.message
    });
  }
});

// @desc    Create subscription plan (Admin only)
// @route   POST /api/subscriptions/plans/admin
// @access  Private/Admin
router.post('/plans/admin', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const planData = {
      ...req.body,
      createdBy: req.user.id
    };

    const plan = await SubscriptionPlan.create(planData);

    await plan.populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully',
      data: plan
    });
  } catch (error) {
    console.error('Create subscription plan error:', error.message);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Handle other errors
    res.status(500).json({
      success: false,
      message: 'Server error creating subscription plan',
      error: error.message
    });
  }
});

// @desc    Update subscription plan (Admin only)
// @route   PUT /api/subscriptions/plans/admin/:id
// @access  Private/Admin
router.put('/plans/admin/:id', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan ID format'
      });
    }

    const plan = await SubscriptionPlan.findById(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        plan[key] = req.body[key];
      }
    });

    plan.updatedBy = req.user.id;
    await plan.save();

    await plan.populate('updatedBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Subscription plan updated successfully',
      data: plan
    });
  } catch (error) {
    console.error('Update subscription plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating subscription plan',
      error: error.message
    });
  }
});

// @desc    Get subscription plan by ID (Admin only)
// @route   GET /api/subscriptions/plans/admin/:id
// @access  Private/Admin
router.get('/plans/admin/:id', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan ID format'
      });
    }

    const plan = await SubscriptionPlan.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Get subscriber count for this plan
    const subscriberCount = await Store.countDocuments({ 'subscription.plan': plan.planType });

    res.status(200).json({
      success: true,
      data: {
        ...plan.toObject(),
        subscriberCount
      }
    });
  } catch (error) {
    console.error('Get subscription plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching subscription plan',
      error: error.message
    });
  }
});

// @desc    Delete subscription plan (Admin only)
// @route   DELETE /api/subscriptions/plans/admin/:id
// @access  Private/Admin
router.delete('/plans/admin/:id', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan ID format'
      });
    }

    const plan = await SubscriptionPlan.findById(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Check if any stores are using this plan
    const storesUsingPlan = await Store.countDocuments({ 'subscription.plan': plan.planType });

    if (storesUsingPlan > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete plan. ${storesUsingPlan} stores are currently using this plan.`
      });
    }

    await SubscriptionPlan.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Subscription plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete subscription plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting subscription plan',
      error: error.message
    });
  }
});

// @desc    Get all store subscriptions (Admin only)
// @route   GET /api/subscriptions/admin
// @access  Private/Admin
router.get('/admin', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    console.log('Subscriptions admin endpoint called');
    console.log('Database connected status:', global.isDatabaseConnected);

    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for subscriptions, using mock data');

      const mockSubscriptions = [
        {
          _id: '1',
          name: 'City Pharmacy',
          code: 'CP001',
          owner: { name: 'Dr. Rajesh Kumar', email: 'rajesh@citypharmacy.com', phone: '+91-9876543210' },
          subscription: {
            plan: 'premium',
            status: 'active',
            startDate: '2024-01-15',
            endDate: '2025-01-15',
            amount: 2999
          },
          createdAt: '2024-01-15'
        },
        {
          _id: '2',
          name: 'HealthMart Plus',
          code: 'HM002',
          owner: { name: 'Mrs. Priya Sharma', email: 'priya@healthmart.com', phone: '+91-9876543211' },
          subscription: {
            plan: 'standard',
            status: 'active',
            startDate: '2024-02-01',
            endDate: '2025-02-01',
            amount: 1999
          },
          createdAt: '2024-02-01'
        },
        {
          _id: '3',
          name: 'MediCare Center',
          code: 'MC003',
          owner: { name: 'Dr. Amit Patel', email: 'amit@medicare.com', phone: '+91-9876543212' },
          subscription: {
            plan: 'basic',
            status: 'expired',
            startDate: '2023-12-01',
            endDate: '2024-12-01',
            amount: 999
          },
          createdAt: '2023-12-01'
        }
      ];

      return res.status(200).json({
        success: true,
        data: mockSubscriptions,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: mockSubscriptions.length,
          itemsPerPage: 10
        }
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};

    if (req.query.status) {
      query['subscription.status'] = req.query.status;
    }

    if (req.query.plan) {
      query['subscription.plan'] = req.query.plan;
    }

    // Get Store Owner subscriptions
    console.log('Querying subscriptions with query:', query);

    // Build subscription query
    let subscriptionQuery = {};
    if (req.query.status) {
      subscriptionQuery.status = req.query.status;
    }
    if (req.query.plan) {
      subscriptionQuery.plan = req.query.plan;
    }

    // Add filter to only get subscriptions with valid store owners
    subscriptionQuery.storeOwner = { $ne: null };

    const subscriptions = await Subscription.find(subscriptionQuery)
      .populate('storeOwner', 'name email phone createdAt')
      .sort({ endDate: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Subscription.countDocuments(subscriptionQuery);

    // Filter out subscriptions where storeOwner population failed
    const validSubscriptions = subscriptions.filter(sub => sub.storeOwner && sub.storeOwner._id);

    // Transform data to match frontend expectations - only include valid subscriptions
    const transformedData = validSubscriptions
      .map(subscription => {
        const storeOwner = subscription.storeOwner;
        return {
          id: subscription._id,
          userId: storeOwner._id,
          userName: storeOwner.name,
          userEmail: storeOwner.email,
          userPhone: storeOwner.phone,
          plan: subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1),
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          amount: subscription.pricing.totalAmount,
          billingCycle: subscription.billingDuration,
          storeCount: subscription.currentStoreCount,
          storeLimit: subscription.storeCountLimit,
          nextBilling: subscription.endDate,
          paymentMethod: 'Online Payment', // Default
          paymentStatus: subscription.paymentStatus,
          remainingDays: subscription.remainingDays,
          isActive: subscription.isActive,
          features: subscription.features,
          createdAt: subscription.createdAt
        };
      });

    // Use the actual count of valid subscriptions for pagination
    const validTotal = validSubscriptions.length;

    res.status(200).json({
      success: true,
      data: transformedData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(validTotal / limit),
        totalItems: validTotal,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching subscriptions',
      error: error.message
    });
  }
});

// @desc    Get individual subscription details (Admin only)
// @route   GET /api/subscriptions/admin/:id
// @access  Private/Admin
router.get('/admin/:id', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID format'
      });
    }

    // Find subscription by ID
    const subscription = await Subscription.findById(id)
      .populate('storeOwner', 'name email phone createdAt');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Transform subscription data to match frontend expectations
    const transformedData = {
      id: subscription._id,
      userId: subscription.storeOwner._id,
      userName: subscription.storeOwner.name,
      userEmail: subscription.storeOwner.email,
      userPhone: subscription.storeOwner.phone,
      plan: subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1),
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      amount: subscription.pricing.totalAmount,
      billingCycle: subscription.billingDuration,
      storeCount: subscription.currentStoreCount,
      storeLimit: subscription.storeCountLimit,
      nextBilling: subscription.endDate,
      paymentMethod: 'Online Payment',
      paymentStatus: subscription.paymentStatus,
      remainingDays: subscription.remainingDays,
      isActive: subscription.isActive,
      features: subscription.features,
      limits: subscription.limits,
      pricing: subscription.pricing,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt
    };

    res.status(200).json({
      success: true,
      data: transformedData
    });
  } catch (error) {
    console.error('Get subscription details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching subscription details',
      error: error.message
    });
  }
});

module.exports = router;

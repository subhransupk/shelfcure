const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Store = require('../models/Store');
const Invoice = require('../models/Invoice');
const Affiliate = require('../models/Affiliate');
const AffiliateCommission = require('../models/AffiliateCommission');

// @desc    Get revenue analytics (Admin only)
// @route   GET /api/analytics/admin/revenue
// @access  Private/Admin
router.get('/admin/revenue', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for revenue analytics, using mock data');

      const { period = 'monthly' } = req.query;

      let mockData;
      if (period === 'daily') {
        mockData = Array.from({ length: 30 }, (_, i) => ({
          _id: i + 1,
          totalRevenue: Math.floor(Math.random() * 50000) + 10000,
          invoiceCount: Math.floor(Math.random() * 20) + 5,
          averageInvoiceValue: Math.floor(Math.random() * 5000) + 1000,
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }));
      } else if (period === 'weekly') {
        mockData = Array.from({ length: 12 }, (_, i) => ({
          _id: i + 1,
          totalRevenue: Math.floor(Math.random() * 200000) + 50000,
          invoiceCount: Math.floor(Math.random() * 100) + 20,
          averageInvoiceValue: Math.floor(Math.random() * 5000) + 1000,
          date: `2024-W${i + 1}`
        }));
      } else {
        mockData = Array.from({ length: 12 }, (_, i) => ({
          _id: i + 1,
          totalRevenue: Math.floor(Math.random() * 500000) + 100000,
          invoiceCount: Math.floor(Math.random() * 200) + 50,
          averageInvoiceValue: Math.floor(Math.random() * 5000) + 1000,
          date: `2024-${String(i + 1).padStart(2, '0')}`
        }));
      }

      return res.status(200).json({
        success: true,
        data: mockData,
        summary: {
          totalRevenue: mockData.reduce((sum, item) => sum + item.totalRevenue, 0),
          totalInvoices: mockData.reduce((sum, item) => sum + item.invoiceCount, 0),
          averageInvoiceValue: mockData.reduce((sum, item) => sum + item.averageInvoiceValue, 0) / mockData.length
        }
      });
    }

    const { period = 'monthly', year = new Date().getFullYear() } = req.query;

    let groupBy, dateFormat;
    if (period === 'daily') {
      groupBy = { $dayOfYear: '$invoiceDate' };
      dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$invoiceDate' } };
    } else if (period === 'weekly') {
      groupBy = { $week: '$invoiceDate' };
      dateFormat = { $dateToString: { format: '%Y-W%U', date: '$invoiceDate' } };
    } else {
      groupBy = { $month: '$invoiceDate' };
      dateFormat = { $dateToString: { format: '%Y-%m', date: '$invoiceDate' } };
    }

    const revenueData = await Invoice.aggregate([
      {
        $match: {
          invoiceDate: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          },
          'payment.status': 'paid'
        }
      },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: '$amounts.total' },
          invoiceCount: { $sum: 1 },
          averageInvoiceValue: { $avg: '$amounts.total' },
          date: { $first: dateFormat }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get comparison data (previous period)
    const previousYear = parseInt(year) - 1;
    const previousYearData = await Invoice.aggregate([
      {
        $match: {
          invoiceDate: {
            $gte: new Date(`${previousYear}-01-01`),
            $lte: new Date(`${previousYear}-12-31`)
          },
          'payment.status': 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amounts.total' },
          invoiceCount: { $sum: 1 }
        }
      }
    ]);

    const currentYearTotal = revenueData.reduce((sum, item) => sum + item.totalRevenue, 0);
    const previousYearTotal = previousYearData[0]?.totalRevenue || 0;
    const growthPercentage = previousYearTotal > 0
      ? Math.round(((currentYearTotal - previousYearTotal) / previousYearTotal) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        revenueData,
        summary: {
          currentYearTotal,
          previousYearTotal,
          growthPercentage,
          totalInvoices: revenueData.reduce((sum, item) => sum + item.invoiceCount, 0)
        }
      }
    });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching revenue analytics',
      error: error.message
    });
  }
});

// @desc    Get user growth analytics (Admin only)
// @route   GET /api/analytics/admin/user-growth
// @access  Private/Admin
router.get('/admin/user-growth', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for user growth analytics, using mock data');

      const mockUserGrowth = Array.from({ length: 12 }, (_, i) => ({
        _id: { period: i + 1, role: 'store_owner' },
        count: Math.floor(Math.random() * 20) + 5,
        date: `2024-${String(i + 1).padStart(2, '0')}`
      }));

      return res.status(200).json({
        success: true,
        data: mockUserGrowth,
        summary: {
          totalUsers: mockUserGrowth.reduce((sum, item) => sum + item.count, 0),
          averageGrowth: mockUserGrowth.reduce((sum, item) => sum + item.count, 0) / mockUserGrowth.length
        }
      });
    }

    const { period = 'monthly', year = new Date().getFullYear() } = req.query;

    let groupBy;
    if (period === 'daily') {
      groupBy = { $dayOfYear: '$createdAt' };
    } else if (period === 'weekly') {
      groupBy = { $week: '$createdAt' };
    } else {
      groupBy = { $month: '$createdAt' };
    }

    const userGrowthData = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          },
          role: { $ne: 'superadmin' }
        }
      },
      {
        $group: {
          _id: {
            period: groupBy,
            role: '$role'
          },
          count: { $sum: 1 },
          date: { $first: { $dateToString: { format: '%Y-%m', date: '$createdAt' } } }
        }
      },
      {
        $group: {
          _id: '$_id.period',
          roles: {
            $push: {
              role: '$_id.role',
              count: '$count'
            }
          },
          totalUsers: { $sum: '$count' },
          date: { $first: '$date' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: userGrowthData
    });
  } catch (error) {
    console.error('User growth analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user growth analytics',
      error: error.message
    });
  }
});

// @desc    Get subscription analytics (Admin only)
// @route   GET /api/analytics/admin/subscriptions
// @access  Private/Admin
router.get('/admin/subscriptions', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for subscription analytics, using mock data');

      const mockSubscriptionAnalytics = {
        planDistribution: [
          { _id: 'basic', count: 15, activeCount: 12 },
          { _id: 'standard', count: 25, activeCount: 22 },
          { _id: 'premium', count: 18, activeCount: 16 },
          { _id: 'enterprise', count: 8, activeCount: 7 }
        ],
        statusDistribution: [
          { _id: 'active', count: 57 },
          { _id: 'expired', count: 6 },
          { _id: 'cancelled', count: 3 }
        ],
        subscriptionTrends: Array.from({ length: 12 }, (_, i) => ({
          _id: { month: i + 1, year: 2024 },
          newSubscriptions: Math.floor(Math.random() * 10) + 2,
          date: `2024-${String(i + 1).padStart(2, '0')}`
        }))
      };

      return res.status(200).json({
        success: true,
        data: mockSubscriptionAnalytics
      });
    }

    // Get subscription distribution by plan
    const planDistribution = await Store.aggregate([
      {
        $group: {
          _id: '$subscription.plan',
          count: { $sum: 1 },
          activeCount: {
            $sum: {
              $cond: [{ $eq: ['$subscription.status', 'active'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get subscription status distribution
    const statusDistribution = await Store.aggregate([
      {
        $group: {
          _id: '$subscription.status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get monthly subscription trends
    const subscriptionTrends = await Store.aggregate([
      {
        $match: {
          'subscription.startDate': {
            $gte: new Date(new Date().getFullYear(), 0, 1)
          }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$subscription.startDate' },
            year: { $year: '$subscription.startDate' }
          },
          newSubscriptions: { $sum: 1 },
          date: { $first: { $dateToString: { format: '%Y-%m', date: '$subscription.startDate' } } }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        planDistribution,
        statusDistribution,
        subscriptionTrends
      }
    });
  } catch (error) {
    console.error('Subscription analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching subscription analytics',
      error: error.message
    });
  }
});

module.exports = router;

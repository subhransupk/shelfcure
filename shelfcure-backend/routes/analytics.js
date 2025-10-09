const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Store = require('../models/Store');
const Invoice = require('../models/Invoice');
const Affiliate = require('../models/Affiliate');
const AffiliateCommission = require('../models/AffiliateCommission');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Medicine = require('../models/Medicine');
const Customer = require('../models/Customer');
const Staff = require('../models/Staff');
const Supplier = require('../models/Supplier');
const LowStockService = require('../services/lowStockService');
const mongoose = require('mongoose');

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

// @desc    Get comprehensive dashboard stats (Admin only)
// @route   GET /api/analytics/admin/dashboard-stats
// @access  Private/Admin
router.get('/admin/dashboard-stats', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for dashboard stats, using mock data');

      return res.status(200).json({
        success: true,
        data: {
          totalStores: 45,
          activeStores: 42,
          totalUsers: 156,
          newUsersThisMonth: 12,
          totalRevenue: 125000,
          monthlyRevenue: 15000,
          totalSales: 1250,
          totalCustomers: 890,
          storeGrowth: 8.5,
          userGrowth: 12.3,
          revenueGrowth: 15.7
        }
      });
    }

    // Get current date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get store statistics
    const [totalStores, activeStores, newStoresThisMonth] = await Promise.all([
      Store.countDocuments(),
      Store.countDocuments({ isActive: true }),
      Store.countDocuments({ createdAt: { $gte: startOfMonth } })
    ]);

    // Get user statistics
    const [totalUsers, newUsersThisMonth, newUsersLastMonth] = await Promise.all([
      User.countDocuments({ role: { $ne: 'superadmin' } }),
      User.countDocuments({
        role: { $ne: 'superadmin' },
        createdAt: { $gte: startOfMonth }
      }),
      User.countDocuments({
        role: { $ne: 'superadmin' },
        createdAt: { $gte: startOfLastMonth, $lt: startOfMonth }
      })
    ]);

    // Get sales statistics
    const [totalSales, monthlySales, lastMonthSales] = await Promise.all([
      Sale.countDocuments(),
      Sale.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Sale.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lt: startOfMonth }
      })
    ]);

    // Get revenue statistics
    const [monthlyRevenue, lastMonthRevenue, totalRevenue] = await Promise.all([
      Sale.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).then(result => result[0]?.total || 0),
      Sale.aggregate([
        { $match: { createdAt: { $gte: startOfLastMonth, $lt: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).then(result => result[0]?.total || 0),
      Sale.aggregate([
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).then(result => result[0]?.total || 0)
    ]);

    // Get customer count
    const totalCustomers = await Customer.countDocuments();

    // Calculate growth percentages
    const storeGrowth = newStoresThisMonth;
    const userGrowth = newUsersLastMonth > 0
      ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
      : newUsersThisMonth > 0 ? 100 : 0;
    const revenueGrowth = lastMonthRevenue > 0
      ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : monthlyRevenue > 0 ? 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        totalStores,
        activeStores,
        totalUsers,
        newUsersThisMonth,
        totalRevenue,
        monthlyRevenue,
        totalSales,
        totalCustomers,
        storeGrowth,
        userGrowth,
        revenueGrowth
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard statistics',
      error: error.message
    });
  }
});

// @desc    Get inventory analytics (Admin only)
// @route   GET /api/analytics/admin/inventory
// @access  Private/Admin
router.get('/admin/inventory', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for inventory analytics, using mock data');

      return res.status(200).json({
        success: true,
        data: {
          totalMedicines: 1250,
          lowStockItems: 45,
          expiredItems: 12,
          nearExpiryItems: 28,
          totalValue: 450000,
          categoryDistribution: [
            { category: 'Tablet', count: 450, value: 180000 },
            { category: 'Syrup', count: 200, value: 120000 },
            { category: 'Capsule', count: 300, value: 90000 },
            { category: 'Injection', count: 150, value: 60000 }
          ],
          topMedicines: [
            { name: 'Paracetamol 500mg', stock: 500, value: 15000 },
            { name: 'Amoxicillin 250mg', stock: 300, value: 12000 },
            { name: 'Crocin Syrup', stock: 200, value: 8000 }
          ]
        }
      });
    }

    // Get inventory statistics
    const [
      totalMedicines,
      lowStockItems,
      expiredItems,
      nearExpiryItems,
      totalValue,
      categoryDistribution
    ] = await Promise.all([
      Medicine.countDocuments({ isActive: true }),
      // Use standardized low stock calculation
      (async () => {
        const pipeline = LowStockService.getLowStockAggregationPipeline();
        pipeline.push({ $count: 'total' });
        const result = await Medicine.aggregate(pipeline);
        return result.length > 0 ? result[0].total : 0;
      })(),
      Medicine.countDocuments({
        isActive: true,
        expiryDate: { $lt: new Date() }
      }),
      Medicine.countDocuments({
        isActive: true,
        expiryDate: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
      }),
      Medicine.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $add: [
                  {
                    $cond: [
                      '$unitTypes.hasStrips',
                      { $multiply: ['$stripInfo.stock', '$stripInfo.sellingPrice'] },
                      0
                    ]
                  },
                  {
                    $cond: [
                      '$unitTypes.hasIndividual',
                      { $multiply: ['$individualInfo.stock', '$individualInfo.sellingPrice'] },
                      0
                    ]
                  },
                  // Fallback to legacy fields
                  {
                    $cond: [
                      { $and: [{ $ne: ['$unitTypes.hasStrips', true] }, { $ne: ['$unitTypes.hasIndividual', true] }] },
                      { $multiply: ['$stock', '$sellingPrice'] },
                      0
                    ]
                  }
                ]
              }
            }
          }
        }
      ]).then(result => result[0]?.total || 0),
      Medicine.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            value: {
              $sum: {
                $add: [
                  {
                    $cond: [
                      '$unitTypes.hasStrips',
                      { $multiply: ['$stripInfo.stock', '$stripInfo.sellingPrice'] },
                      0
                    ]
                  },
                  {
                    $cond: [
                      '$unitTypes.hasIndividual',
                      { $multiply: ['$individualInfo.stock', '$individualInfo.sellingPrice'] },
                      0
                    ]
                  },
                  // Fallback to legacy fields
                  {
                    $cond: [
                      { $and: [{ $ne: ['$unitTypes.hasStrips', true] }, { $ne: ['$unitTypes.hasIndividual', true] }] },
                      { $multiply: ['$stock', '$sellingPrice'] },
                      0
                    ]
                  }
                ]
              }
            }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    // Get top medicines by stock value
    const topMedicines = await Medicine.aggregate([
      { $match: { isActive: true } },
      {
        $project: {
          name: 1,
          stock: 1,
          value: { $multiply: ['$stock', '$sellingPrice'] }
        }
      },
      { $sort: { value: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalMedicines,
        lowStockItems,
        expiredItems,
        nearExpiryItems,
        totalValue,
        categoryDistribution,
        topMedicines
      }
    });
  } catch (error) {
    console.error('Inventory analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching inventory analytics',
      error: error.message
    });
  }
});

// @desc    Get sales analytics (Admin only)
// @route   GET /api/analytics/admin/sales
// @access  Private/Admin
router.get('/admin/sales', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;

    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for sales analytics, using mock data');

      const mockSalesData = Array.from({ length: 12 }, (_, i) => ({
        _id: { period: i + 1 },
        totalSales: Math.floor(Math.random() * 50000) + 10000,
        totalOrders: Math.floor(Math.random() * 200) + 50,
        averageOrderValue: Math.floor(Math.random() * 500) + 200,
        date: `2024-${String(i + 1).padStart(2, '0')}`
      }));

      return res.status(200).json({
        success: true,
        data: {
          salesData: mockSalesData,
          summary: {
            totalSales: mockSalesData.reduce((sum, item) => sum + item.totalSales, 0),
            totalOrders: mockSalesData.reduce((sum, item) => sum + item.totalOrders, 0),
            averageOrderValue: Math.round(mockSalesData.reduce((sum, item) => sum + item.averageOrderValue, 0) / mockSalesData.length)
          }
        }
      });
    }

    let matchStage = {};
    let groupStage = {};

    if (period === 'daily') {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      matchStage = { createdAt: { $gte: startDate, $lte: endDate } };
      groupStage = {
        _id: {
          day: { $dayOfMonth: '$createdAt' },
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        totalSales: { $sum: '$totalAmount' },
        totalOrders: { $sum: 1 },
        date: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } }
      };
    } else {
      matchStage = {
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lte: new Date(year, 11, 31)
        }
      };
      groupStage = {
        _id: {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' }
        },
        totalSales: { $sum: '$totalAmount' },
        totalOrders: { $sum: 1 },
        date: { $first: { $dateToString: { format: '%Y-%m', date: '$createdAt' } } }
      };
    }

    const salesData = await Sale.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      {
        $addFields: {
          averageOrderValue: { $divide: ['$totalSales', '$totalOrders'] }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Get top performing stores
    const topStores = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$store',
          totalSales: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'stores',
          localField: '_id',
          foreignField: '_id',
          as: 'storeInfo'
        }
      },
      { $unwind: '$storeInfo' },
      {
        $project: {
          storeName: '$storeInfo.name',
          totalSales: 1,
          totalOrders: 1,
          averageOrderValue: { $divide: ['$totalSales', '$totalOrders'] }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 10 }
    ]);

    const summary = {
      totalSales: salesData.reduce((sum, item) => sum + item.totalSales, 0),
      totalOrders: salesData.reduce((sum, item) => sum + item.totalOrders, 0),
      averageOrderValue: salesData.length > 0
        ? Math.round(salesData.reduce((sum, item) => sum + item.averageOrderValue, 0) / salesData.length)
        : 0
    };

    res.status(200).json({
      success: true,
      data: {
        salesData,
        topStores,
        summary
      }
    });
  } catch (error) {
    console.error('Sales analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching sales analytics',
      error: error.message
    });
  }
});

// @desc    Get customer analytics (Admin only)
// @route   GET /api/analytics/admin/customers
// @access  Private/Admin
router.get('/admin/customers', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for customer analytics, using mock data');

      return res.status(200).json({
        success: true,
        data: {
          totalCustomers: 1250,
          newCustomersThisMonth: 85,
          activeCustomers: 980,
          customerGrowth: 12.5,
          averageSpending: 450,
          topCustomers: [
            { name: 'John Doe', totalSpent: 15000, visits: 25 },
            { name: 'Jane Smith', totalSpent: 12000, visits: 20 },
            { name: 'Bob Johnson', totalSpent: 10000, visits: 18 }
          ],
          customerSegments: [
            { segment: 'High Value', count: 120, percentage: 9.6 },
            { segment: 'Regular', count: 600, percentage: 48 },
            { segment: 'Occasional', count: 530, percentage: 42.4 }
          ]
        }
      });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get customer statistics (global across all stores for admin)
    const [
      totalCustomers,
      newCustomersThisMonth,
      activeCustomers,
      customerSpending
    ] = await Promise.all([
      Customer.countDocuments(),
      Customer.countDocuments({ registrationDate: { $gte: startOfMonth } }),
      Customer.countDocuments({ status: 'active' }),
      Customer.aggregate([
        { $group: { _id: null, averageSpending: { $avg: '$totalSpent' } } }
      ]).then(result => result[0]?.averageSpending || 0)
    ]);

    // Get previous month's new customers for growth calculation
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const newCustomersLastMonth = await Customer.countDocuments({
      registrationDate: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });

    // Calculate customer growth
    const customerGrowth = newCustomersLastMonth > 0
      ? Math.round(((newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth) * 100)
      : newCustomersThisMonth > 0 ? 100 : 0;

    // Get top customers
    const topCustomers = await Customer.aggregate([
      { $match: { status: 'active' } },
      {
        $project: {
          name: 1,
          totalSpent: 1,
          visitCount: 1
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);

    // Customer segmentation based on spending
    const customerSegments = await Customer.aggregate([
      {
        $bucket: {
          groupBy: '$totalSpent',
          boundaries: [0, 1000, 5000, 15000, Infinity],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            averageSpent: { $avg: '$totalSpent' }
          }
        }
      }
    ]);

    // Map segments to readable names
    const segmentNames = ['Low Value', 'Regular', 'High Value', 'Premium'];
    const formattedSegments = customerSegments.map((segment, index) => ({
      segment: segmentNames[index] || 'Other',
      count: segment.count,
      percentage: Math.round((segment.count / totalCustomers) * 100)
    }));

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        newCustomersThisMonth,
        activeCustomers,
        customerGrowth,
        averageSpending: Math.round(customerSpending),
        topCustomers,
        customerSegments: formattedSegments
      }
    });
  } catch (error) {
    console.error('Customer analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching customer analytics',
      error: error.message
    });
  }
});

// @desc    Get operations analytics (Admin only)
// @route   GET /api/analytics/admin/operations
// @access  Private/Admin
router.get('/admin/operations', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;

    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for operations analytics, using mock data');

      return res.status(200).json({
        success: true,
        data: {
          dailyTransactions: Math.floor(Math.random() * 50) + 20,
          peakHours: '14:00 - 15:00',
          staffEfficiency: Math.floor(Math.random() * 20) + 80,
          systemUptime: 99.5,
          hourlyPattern: Array.from({length: 24}, () => Math.floor(Math.random() * 20)),
          weeklyPerformance: {
            sales: Array.from({length: 7}, () => Math.floor(Math.random() * 50000) + 10000),
            transactions: Array.from({length: 7}, () => Math.floor(Math.random() * 100) + 20)
          },
          averageTransactionTime: Math.floor(Math.random() * 5) + 2,
          totalTransactions: Math.floor(Math.random() * 10000) + 5000
        }
      });
    }

    const now = new Date();
    let startDate, endDate;

    // Set date range based on period
    if (period === 'daily') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      endDate = new Date();
    } else if (period === 'weekly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 84); // 12 weeks
      endDate = new Date();
    } else {
      startDate = new Date(now.getFullYear(), 0, 1); // Start of year
      endDate = new Date();
    }

    // Get all sales for operations analysis
    const sales = await Sale.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: 1 });

    // Calculate operations metrics
    const operationsPeriodDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    const dailyTransactions = Math.round(sales.length / operationsPeriodDays);

    // Calculate hourly pattern
    const hourlyPattern = Array(24).fill(0);
    sales.forEach(sale => {
      const hour = sale.createdAt.getHours();
      hourlyPattern[hour]++;
    });

    // Find peak hours
    let peakHour = 0;
    let maxTransactions = 0;
    hourlyPattern.forEach((count, hour) => {
      if (count > maxTransactions) {
        maxTransactions = count;
        peakHour = hour;
      }
    });
    const peakHours = maxTransactions > 0 ? `${peakHour}:00 - ${peakHour + 1}:00` : 'N/A';

    // Calculate weekly performance
    const weeklyPerformance = {
      sales: Array(7).fill(0),
      transactions: Array(7).fill(0)
    };

    sales.forEach(sale => {
      const dayOfWeek = sale.createdAt.getDay();
      const mondayBasedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weeklyPerformance.sales[mondayBasedDay] += sale.totalAmount;
      weeklyPerformance.transactions[mondayBasedDay] += 1;
    });

    // Calculate staff efficiency (global metric)
    const totalWorkingHours = operationsPeriodDays * 8;
    const salesPerHour = totalWorkingHours > 0 ? sales.length / totalWorkingHours : 0;
    const staffEfficiency = Math.min(100, Math.round(salesPerHour * 5)); // Scale for global view

    // Calculate average transaction time (mock - would need actual timing data)
    const averageTransactionTime = 3.5; // Mock 3.5 minutes average

    // System uptime (mock - would come from monitoring system)
    const systemUptime = 99.8;

    res.status(200).json({
      success: true,
      data: {
        dailyTransactions,
        peakHours,
        staffEfficiency,
        systemUptime,
        hourlyPattern,
        weeklyPerformance,
        averageTransactionTime,
        totalTransactions: sales.length
      }
    });
  } catch (error) {
    console.error('Operations analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching operations analytics',
      error: error.message
    });
  }
});

module.exports = router;

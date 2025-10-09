const mongoose = require('mongoose');
const Store = require('../models/Store');
const User = require('../models/User');
const Medicine = require('../models/Medicine');
const MasterMedicine = require('../models/MasterMedicine');
const Sale = require('../models/Sale');
const Return = require('../models/Return');
const Customer = require('../models/Customer');
const Purchase = require('../models/Purchase');
const CreditTransaction = require('../models/CreditTransaction');
const BatchService = require('../services/batchService');
const { logInventoryChange } = require('../services/inventoryLogService');
const { generateInvoicePDF } = require('../services/invoiceService');
const LowStockService = require('../services/lowStockService');

// ===================
// DASHBOARD CONTROLLERS
// ===================

// @desc    Get store manager dashboard data
// @route   GET /api/store-manager/dashboard
// @access  Private (Store Manager only)
const getDashboardData = async (req, res) => {
  const store = req.store;
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

  try {
    // Get today's sales
    const todaySales = await Sale.find({
      store: store._id,
      createdAt: { $gte: startOfDay }
    });

    // Get this month's sales
    const monthSales = await Sale.find({
      store: store._id,
      createdAt: { $gte: startOfMonth }
    });

    // Get this week's sales
    const weekSales = await Sale.find({
      store: store._id,
      createdAt: { $gte: startOfWeek }
    });

    // Get inventory stats
    const totalMedicines = await Medicine.countDocuments({ store: store._id, isActive: true });

    // Use standardized low stock calculation service
    const lowStockMedicines = await LowStockService.countLowStockMedicines(store._id);

    // Get customer stats
    const totalCustomers = await Customer.countDocuments({ store: store._id });
    const newCustomersThisMonth = await Customer.countDocuments({
      store: store._id,
      createdAt: { $gte: startOfMonth }
    });

    // Calculate totals
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const monthRevenue = monthSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const weekRevenue = weekSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    // Get recent sales (last 10)
    const recentSales = await Sale.find({ store: store._id })
      .populate('customer', 'name phone')
      .populate('items.medicine', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get expiring medicines (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringMedicines = await Medicine.find({
      store: store._id,
      isActive: true,
      expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() }
    }).select('name manufacturer expiryDate category')
    .sort({ expiryDate: 1 })
    .limit(10);

    // Get expiring medicines (next 7 days) - Critical
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const critical7Days = await Medicine.countDocuments({
      store: store._id,
      isActive: true,
      expiryDate: { $lte: sevenDaysFromNow, $gte: new Date() }
    });

    // Get expired medicines
    const expiredMedicines = await Medicine.countDocuments({
      store: store._id,
      isActive: true,
      expiryDate: { $lt: new Date() }
    });

    // Get out of stock medicines
    const outOfStock = await Medicine.countDocuments({
      store: store._id,
      $or: [
        {
          $and: [
            { 'stripInfo.stock': { $lte: 0 } },
            { 'individualInfo.stock': { $lte: 0 } }
          ]
        },
        // Legacy support
        {
          $and: [
            { 'inventory.stripQuantity': { $lte: 0 } },
            { 'inventory.individualQuantity': { $lte: 0 } }
          ]
        }
      ]
    });

    // Calculate stock value
    const stockValueResult = await Medicine.aggregate([
      { $match: { store: store._id } },
      {
        $project: {
          stripValue: {
            $multiply: [
              { $ifNull: ['$stripInfo.stock', '$inventory.stripQuantity'] },
              { $ifNull: ['$stripInfo.mrp', '$pricing.stripMRP'] }
            ]
          },
          individualValue: {
            $multiply: [
              { $ifNull: ['$individualInfo.stock', '$inventory.individualQuantity'] },
              { $ifNull: ['$individualInfo.mrp', '$pricing.individualMRP'] }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalStockValue: { $sum: { $add: ['$stripValue', '$individualValue'] } }
        }
      }
    ]);

    const stockValue = stockValueResult[0]?.totalStockValue || 0;

    // Get today's returns - FIXED: Query Return collection instead of Sale collection
    const todayReturns = await Return.aggregate([
      {
        $match: {
          store: store._id,
          createdAt: { $gte: startOfDay }
        }
      },
      {
        $group: {
          _id: null,
          totalReturns: { $sum: '$totalReturnAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get pending returns count (returns that are not completed/rejected/cancelled)
    const pendingReturnsCount = await Return.countDocuments({
      store: store._id,
      status: { $in: ['pending', 'approved', 'processed'] }
    });

    // Get completed returns today for better tracking
    const completedReturnsToday = await Return.countDocuments({
      store: store._id,
      createdAt: { $gte: startOfDay },
      status: 'completed'
    });

    const todayReturnsAmount = todayReturns[0]?.totalReturns || 0;
    const todayReturnsCount = todayReturns[0]?.count || 0;
    const pendingReturns = pendingReturnsCount;

    // Debug logging for Today's Returns
    console.log('📊 Today\'s Returns Debug:', {
      startOfDay: startOfDay.toISOString(),
      todayReturnsAmount,
      todayReturnsCount,
      completedReturnsToday,
      pendingReturns,
      storeId: store._id
    });

    // Get credit customers and pending credit
    const creditStats = await Sale.aggregate([
      {
        $match: {
          store: store._id,
          paymentMethod: 'credit',
          status: { $ne: 'paid' }
        }
      },
      {
        $group: {
          _id: null,
          totalCredit: { $sum: '$totalAmount' },
          creditCustomers: { $addToSet: '$customer' }
        }
      }
    ]);

    const pendingCredit = creditStats[0]?.totalCredit || 0;
    const creditCustomers = creditStats[0]?.creditCustomers?.length || 0;

    // Calculate today's actual profit based on cost vs selling prices
    const todayProfitData = await Sale.aggregate([
      {
        $match: {
          store: store._id,
          createdAt: { $gte: startOfDay },
          status: 'completed'
        }
      },
      {
        $unwind: '$items'
      },
      {
        $lookup: {
          from: 'medicines',
          localField: 'items.medicine',
          foreignField: '_id',
          as: 'medicineData'
        }
      },
      {
        $unwind: '$medicineData'
      },
      {
        $addFields: {
          // Calculate cost price based on unit type
          costPrice: {
            $cond: [
              { $eq: ['$items.unitType', 'strip'] },
              '$medicineData.stripInfo.purchasePrice',
              '$medicineData.individualInfo.purchasePrice'
            ]
          },
          // Calculate profit per item
          itemProfit: {
            $multiply: [
              '$items.quantity',
              {
                $subtract: [
                  '$items.unitPrice',
                  {
                    $cond: [
                      { $eq: ['$items.unitType', 'strip'] },
                      '$medicineData.stripInfo.purchasePrice',
                      '$medicineData.individualInfo.purchasePrice'
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalProfit: { $sum: '$itemProfit' }
        }
      }
    ]);

    // Calculate today's profit from returns (to subtract)
    const todayReturnProfitLoss = await Return.aggregate([
      {
        $match: {
          store: store._id,
          createdAt: { $gte: startOfDay },
          status: { $in: ['completed', 'processed'] }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $lookup: {
          from: 'medicines',
          localField: 'items.medicine',
          foreignField: '_id',
          as: 'medicineData'
        }
      },
      {
        $unwind: '$medicineData'
      },
      {
        $addFields: {
          // Calculate profit lost due to return
          returnProfitLoss: {
            $multiply: [
              '$items.returnQuantity',
              {
                $subtract: [
                  '$items.unitPrice',
                  {
                    $cond: [
                      { $eq: ['$items.unitType', 'strip'] },
                      '$medicineData.stripInfo.purchasePrice',
                      '$medicineData.individualInfo.purchasePrice'
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalReturnProfitLoss: { $sum: '$returnProfitLoss' }
        }
      }
    ]);

    const todayGrossProfit = todayProfitData[0]?.totalProfit || 0;
    const todayReturnLoss = todayReturnProfitLoss[0]?.totalReturnProfitLoss || 0;
    const todayProfit = Math.max(0, todayGrossProfit - todayReturnLoss);
    const todayLoss = todayReturnsAmount; // Keep this for separate tracking

    // Get today's credit given out
    const todayCreditStats = await Sale.aggregate([
      {
        $match: {
          store: store._id,
          createdAt: { $gte: startOfDay },
          paymentMethod: 'credit'
        }
      },
      {
        $group: {
          _id: null,
          totalTodayCredit: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const todayCredit = todayCreditStats[0]?.totalTodayCredit || 0;

    // Calculate comprehensive monthly profit based on actual cost vs selling prices
    const monthProfitData = await Sale.aggregate([
      {
        $match: {
          store: store._id,
          createdAt: { $gte: startOfMonth },
          status: 'completed'
        }
      },
      {
        $unwind: '$items'
      },
      {
        $lookup: {
          from: 'medicines',
          localField: 'items.medicine',
          foreignField: '_id',
          as: 'medicineData'
        }
      },
      {
        $unwind: '$medicineData'
      },
      {
        $addFields: {
          itemProfit: {
            $multiply: [
              '$items.quantity',
              {
                $subtract: [
                  '$items.unitPrice',
                  {
                    $cond: [
                      { $eq: ['$items.unitType', 'strip'] },
                      '$medicineData.stripInfo.purchasePrice',
                      '$medicineData.individualInfo.purchasePrice'
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalProfit: { $sum: '$itemProfit' }
        }
      }
    ]);

    // Calculate monthly profit loss from returns
    const monthReturnProfitLoss = await Return.aggregate([
      {
        $match: {
          store: store._id,
          createdAt: { $gte: startOfMonth },
          status: { $in: ['completed', 'processed'] }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $lookup: {
          from: 'medicines',
          localField: 'items.medicine',
          foreignField: '_id',
          as: 'medicineData'
        }
      },
      {
        $unwind: '$medicineData'
      },
      {
        $addFields: {
          returnProfitLoss: {
            $multiply: [
              '$items.returnQuantity',
              {
                $subtract: [
                  '$items.unitPrice',
                  {
                    $cond: [
                      { $eq: ['$items.unitType', 'strip'] },
                      '$medicineData.stripInfo.purchasePrice',
                      '$medicineData.individualInfo.purchasePrice'
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalReturnProfitLoss: { $sum: '$returnProfitLoss' }
        }
      }
    ]);

    const monthGrossProfit = monthProfitData[0]?.totalProfit || 0;
    const monthReturnLoss = monthReturnProfitLoss[0]?.totalReturnProfitLoss || 0;
    const totalProfit = Math.max(0, monthGrossProfit - monthReturnLoss);
    const inStockMedicines = totalMedicines - outOfStock;
    const totalItems = await Medicine.aggregate([
      { $match: { store: store._id } },
      {
        $group: {
          _id: null,
          totalStrips: {
            $sum: { $ifNull: ['$stripInfo.stock', '$inventory.stripQuantity'] }
          },
          totalIndividualUnits: {
            $sum: { $ifNull: ['$individualInfo.stock', '$inventory.individualQuantity'] }
          }
        }
      }
    ]);

    // Mock waste data (in real implementation, these would come from actual tracking)
    const wasteImpact = monthRevenue * 0.02; // 2% waste impact
    const preventableWaste = wasteImpact * 0.6; // 60% preventable
    const expiredValue = expiredMedicines * 150; // Average medicine value
    const expiring30DaysValue = expiringMedicines.length * 200;

    // Add cache-busting headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.status(200).json({
      success: true,
      data: {
        store: {
          id: store._id,
          name: store.name,
          code: store.code
        },
        metrics: {
          // Financial Metrics
          todayRevenue,
          weekRevenue,
          monthRevenue,
          totalProfit,
          todayProfit,
          todayLoss,
          todayCredit,
          todaySalesCount: todaySales.length,
          weekSalesCount: weekSales.length,
          monthSalesCount: monthSales.length,

          // Inventory Metrics
          totalMedicines,
          inStockMedicines,
          lowStockMedicines,
          outOfStock,
          stockValue,
          totalStrips: totalItems[0]?.totalStrips || 0,
          totalIndividualUnits: totalItems[0]?.totalIndividualUnits || 0,

          // Customer & Credit Metrics
          totalCustomers,
          newCustomersThisMonth,
          pendingCredit,
          creditCustomers,

          // Returns & Waste Metrics
          todayReturns: todayReturnsAmount,
          todayReturnsCount,
          completedReturnsToday,
          pendingReturns,
          wasteImpact,
          preventableWaste,
          wastePercentage: wasteImpact > 0 ? (preventableWaste / wasteImpact) * 100 : 0,
          wasteIncidents: Math.floor(wasteImpact / 100), // Mock incidents

          // Expiry Tracking
          expiredMedicines,
          expiredValue,
          expiring30Days: expiringMedicines.length,
          expiring30DaysValue,
          critical7Days,
        },
        recentSales,
        expiringMedicines,
        alerts: {
          lowStock: lowStockMedicines > 0,
          expiringSoon: expiringMedicines.length > 0,
          criticalExpiry: critical7Days > 0,
          outOfStock: outOfStock > 0
        }
      }
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
};

// @desc    Get store analytics
// @route   GET /api/store-manager/analytics
// @access  Private (Store Manager only)
const getStoreAnalytics = async (req, res) => {
  const store = req.store;
  const { period = '30d' } = req.query;

  try {
    let startDate;
    const endDate = new Date();

    switch (period) {
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get sales data for the period
    const sales = await Sale.find({
      store: store._id,
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('items.medicine', 'name category');

    // Get previous period for comparison
    const previousPeriodStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
    const previousSales = await Sale.find({
      store: store._id,
      createdAt: { $gte: previousPeriodStart, $lt: startDate }
    });

    // Calculate daily sales
    const dailySales = {};
    sales.forEach(sale => {
      const date = sale.createdAt.toISOString().split('T')[0];
      if (!dailySales[date]) {
        dailySales[date] = { revenue: 0, count: 0, transactions: 0 };
      }
      dailySales[date].revenue += sale.totalAmount;
      dailySales[date].count += 1;
      dailySales[date].transactions += 1;
    });

    // Get top selling medicines
    const medicineStats = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const medicineId = item.medicine._id.toString();
        if (!medicineStats[medicineId]) {
          medicineStats[medicineId] = {
            medicine: item.medicine,
            quantity: 0,
            revenue: 0
          };
        }
        medicineStats[medicineId].quantity += item.quantity;
        medicineStats[medicineId].revenue += item.totalPrice;
      });
    });

    const topMedicines = Object.values(medicineStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(stat => ({
        name: stat.medicine.name,
        revenue: stat.revenue,
        quantity: stat.quantity,
        category: stat.medicine.category,
        growth: 0 // Calculate growth if needed
      }));

    // Convert dailySales object to array format expected by frontend
    const dailySalesArray = Object.entries(dailySales).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      sales: data.count,
      transactions: data.transactions,
      averageOrderValue: data.count > 0 ? Math.round(data.revenue / data.count) : 0
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate growth metrics
    const currentRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const previousRevenue = previousSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const revenueGrowth = previousRevenue > 0 ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100) : 0;

    const currentSalesCount = sales.length;
    const previousSalesCount = previousSales.length;
    const salesGrowth = previousSalesCount > 0 ? Math.round(((currentSalesCount - previousSalesCount) / previousSalesCount) * 100) : 0;

    // Calculate Daily Average Sales
    const periodDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    const dailyAverageSales = periodDays > 0 ? Math.round(currentRevenue / periodDays) : 0;

    // Calculate Peak Sales Day
    let peakSalesDay = { day: 'N/A', amount: 0 };
    if (dailySalesArray.length > 0) {
      const peakDay = dailySalesArray.reduce((max, day) =>
        day.revenue > max.revenue ? day : max
      );
      peakSalesDay = {
        day: new Date(peakDay.date).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric'
        }),
        amount: peakDay.revenue
      };
    }

    // Get inventory analytics with proper dual-unit system support
    const totalMedicines = await Medicine.countDocuments({ store: store._id, isActive: true });

    // Low stock medicines - use standardized calculation
    const lowStockMedicines = await LowStockService.countLowStockMedicines(store._id);

    // Out of stock medicines - consider both strip and individual units
    const outOfStockMedicines = await Medicine.countDocuments({
      store: store._id,
      isActive: true,
      $or: [
        {
          'unitTypes.hasStrips': true,
          'unitTypes.hasIndividual': true,
          'stripInfo.stock': 0,
          'individualInfo.stock': 0
        },
        {
          'unitTypes.hasStrips': true,
          'unitTypes.hasIndividual': { $ne: true },
          'stripInfo.stock': 0
        },
        {
          'unitTypes.hasIndividual': true,
          'unitTypes.hasStrips': { $ne: true },
          'individualInfo.stock': 0
        },
        // Fallback to legacy fields
        {
          'unitTypes.hasStrips': { $ne: true },
          'unitTypes.hasIndividual': { $ne: true },
          stock: 0
        }
      ]
    });

    // Calculate total inventory value
    const inventoryValue = await Medicine.aggregate([
      { $match: { store: store._id, isActive: true } },
      {
        $group: {
          _id: null,
          totalValue: {
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
    ]);

    // Get expiring medicines (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringMedicines = await Medicine.countDocuments({
      store: store._id,
      isActive: true,
      expiryDate: {
        $gte: new Date(),
        $lte: thirtyDaysFromNow
      }
    });

    // Get expired medicines
    const expiredMedicines = await Medicine.countDocuments({
      store: store._id,
      isActive: true,
      expiryDate: { $lt: new Date() }
    });

    // Get category distribution
    const categoryDistribution = await Medicine.aggregate([
      { $match: { store: store._id, isActive: true } },
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
      { $sort: { count: -1 } }
    ]);

    // Get customer analytics with proper date field and comprehensive metrics
    const totalCustomers = await Customer.countDocuments({ store: store._id });

    // Use registrationDate instead of createdAt for new customers
    const newCustomers = await Customer.countDocuments({
      store: store._id,
      registrationDate: { $gte: startDate, $lte: endDate }
    });

    // Get previous period new customers for growth calculation
    const customerPreviousPeriodStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
    const previousNewCustomers = await Customer.countDocuments({
      store: store._id,
      registrationDate: { $gte: customerPreviousPeriodStart, $lt: startDate }
    });

    // Get active customers (customers with purchases in the last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const activeCustomers = await Customer.countDocuments({
      store: store._id,
      status: 'active',
      lastPurchaseDate: { $gte: ninetyDaysAgo }
    });

    // Calculate customer growth percentage
    const customerGrowth = previousNewCustomers > 0
      ? Math.round(((newCustomers - previousNewCustomers) / previousNewCustomers) * 100)
      : newCustomers > 0 ? 100 : 0;

    // Get customer spending analytics
    const customerSpendingStats = await Customer.aggregate([
      { $match: { store: store._id } },
      {
        $group: {
          _id: null,
          averageSpending: { $avg: '$totalSpent' },
          totalRevenue: { $sum: '$totalSpent' },
          averageOrderValue: { $avg: '$averageOrderValue' }
        }
      }
    ]);

    const spendingStats = customerSpendingStats[0] || {
      averageSpending: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    };

    // Get customer acquisition data (daily breakdown for the period)
    const customerAcquisitionData = await Customer.aggregate([
      {
        $match: {
          store: store._id,
          registrationDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$registrationDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Fill in missing dates with 0 counts
    const acquisitionData = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingData = customerAcquisitionData.find(item => item._id === dateStr);
      acquisitionData.push({
        date: dateStr,
        count: existingData ? existingData.count : 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get customer spending segmentation
    const customerSegmentation = await Customer.aggregate([
      { $match: { store: store._id } },
      {
        $bucket: {
          groupBy: '$totalSpent',
          boundaries: [0, 1000, 5000, Infinity],
          default: 'Other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    // Map to frontend expected format
    const segmentNames = ['Low Spenders', 'Medium Spenders', 'High Spenders'];
    let lowSpenders = 0, mediumSpenders = 0, highSpenders = 0;

    customerSegmentation.forEach((segment, index) => {
      if (index === 0) lowSpenders = segment.count;
      else if (index === 1) mediumSpenders = segment.count;
      else if (index === 2) highSpenders = segment.count;
    });

    // Get detailed low stock medicines for DataTable
    const lowStockMedicinesData = await LowStockService.findLowStockMedicines(store._id, {
      select: 'name stock minStock category stripInfo individualInfo unitTypes',
      limit: 20
    });

    // Get top customers for DataTable
    const topCustomersData = await Sale.aggregate([
      { $match: { store: store._id, createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: '$customer',
        totalSpent: { $sum: '$totalAmount' },
        visitCount: { $sum: 1 },
        lastVisit: { $max: '$createdAt' }
      }},
      { $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customerInfo'
      }},
      { $unwind: '$customerInfo' },
      { $project: {
        name: '$customerInfo.name',
        phone: '$customerInfo.phone',
        totalSpent: 1,
        visitCount: 1,
        lastVisit: 1
      }},
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);

    // Calculate comprehensive operations analytics

    // Calculate hourly transaction pattern
    const hourlyPattern = Array(24).fill(0);
    sales.forEach(sale => {
      const hour = sale.createdAt.getHours();
      hourlyPattern[hour]++;
    });

    // Calculate daily transactions average
    const operationsPeriodDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    const dailyTransactions = Math.round(sales.length / operationsPeriodDays);

    // Find peak hours (hour with most transactions)
    let peakHour = 0;
    let maxTransactions = 0;
    hourlyPattern.forEach((count, hour) => {
      if (count > maxTransactions) {
        maxTransactions = count;
        peakHour = hour;
      }
    });
    const peakHours = maxTransactions > 0 ? `${peakHour}:00 - ${peakHour + 1}:00` : 'N/A';

    // Calculate weekly performance (group by day of week)
    const weeklyPerformance = {
      sales: Array(7).fill(0),
      transactions: Array(7).fill(0)
    };

    sales.forEach(sale => {
      const dayOfWeek = sale.createdAt.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const mondayBasedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday = 0
      weeklyPerformance.sales[mondayBasedDay] += sale.totalAmount;
      weeklyPerformance.transactions[mondayBasedDay] += 1;
    });

    // Calculate staff efficiency (simplified metric based on sales per hour)
    const totalWorkingHours = operationsPeriodDays * 8; // Assuming 8 hours per day
    const salesPerHour = totalWorkingHours > 0 ? sales.length / totalWorkingHours : 0;
    const staffEfficiency = Math.min(100, Math.round(salesPerHour * 10)); // Scale to percentage

    // Calculate system uptime (mock calculation - in real scenario would come from monitoring)
    const systemUptime = 99.5; // Mock 99.5% uptime

    // Calculate average transaction time (mock - would need actual timing data in real scenario)
    const averageTransactionTime = 3.2; // Mock 3.2 minutes average

    // Total transactions for the period
    const totalTransactions = sales.length;

    // Calculate category distribution
    const categoryStats = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const category = item.medicine.category || 'Other';
        if (!categoryStats[category]) {
          categoryStats[category] = { revenue: 0, quantity: 0 };
        }
        categoryStats[category].revenue += item.totalPrice;
        categoryStats[category].quantity += item.quantity;
      });
    });

    const salesCategoryDistribution = Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      revenue: stats.revenue,
      quantity: stats.quantity,
      percentage: Math.round((stats.revenue / currentRevenue) * 100) || 0
    })).sort((a, b) => b.revenue - a.revenue);

    res.status(200).json({
      success: true,
      data: {
        period,
        dateRange: { startDate, endDate },
        summary: {
          totalRevenue: currentRevenue,
          totalSales: currentSalesCount,
          averageOrderValue: currentSalesCount > 0 ? Math.round(currentRevenue / currentSalesCount) : 0,
          revenueGrowth,
          salesGrowth,
          dailyAverageSales
        },
        // Add these metrics at root level for frontend compatibility
        salesGrowth,
        peakSalesDay,
        dailySales: dailySalesArray,
        topMedicines,
        inventory: {
          totalMedicines,
          lowStockMedicines,
          outOfStockMedicines,
          expiringMedicines,
          expiredMedicines,
          totalValue: inventoryValue[0]?.totalValue || 0,
          stockHealthPercentage: totalMedicines > 0 ? Math.round(((totalMedicines - lowStockMedicines) / totalMedicines) * 100) : 100,
          lowStockMedicinesData,
          categories: categoryDistribution.map(cat => ({
            name: cat._id || 'Unknown',
            count: cat.count,
            value: cat.value
          }))
        },
        customers: {
          totalCustomers,
          newCustomers,
          activeCustomers,
          customerGrowth,
          averageSpending: Math.round(spendingStats.averageSpending || 0),
          averageOrderValue: Math.round(spendingStats.averageOrderValue || 0),
          totalCustomerRevenue: Math.round(spendingStats.totalRevenue || 0),
          acquisitionData,
          lowSpenders,
          mediumSpenders,
          highSpenders,
          topCustomers: topCustomersData
        },
        operations: {
          dailyTransactions,
          peakHours,
          staffEfficiency,
          systemUptime,
          averageTransactionTime,
          totalTransactions,
          hourlyPattern,
          weeklyPerformance,
          categoryDistribution: salesCategoryDistribution
        }
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics'
    });
  }
};

// ===================
// INVENTORY CONTROLLERS
// ===================

// @desc    Get store inventory
// @route   GET /api/store-manager/inventory
// @access  Private (Store Manager only)
const getInventory = async (req, res) => {
  const store = req.store;
  const { page = 1, limit = 20, search, category, stockStatus } = req.query;

  try {
    // Build base search query
    let searchQuery = {};

    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      searchQuery.category = category;
    }

    // Use batch-aware medicine availability logic for regular inventory
    if (stockStatus === 'low') {
      // Use standardized low stock aggregation with pagination
      const pipeline = LowStockService.getLowStockAggregationPipeline(query);
      pipeline.push(
        { $sort: { name: 1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit * 1 }
      );
      medicines = await Medicine.aggregate(pipeline);

      // Get total count for low stock medicines using standardized service
      const countPipeline = LowStockService.getLowStockAggregationPipeline(query);
      countPipeline.push({ $count: 'total' });
      const totalResult = await Medicine.aggregate(countPipeline);
      total = totalResult.length > 0 ? totalResult[0].total : 0;

    } else if (stockStatus === 'out') {
      // Handle out of stock with regular query since it doesn't need field comparisons
      query.$or = [
        {
          $and: [
            { 'stripInfo.stock': 0 },
            { 'individualInfo.stock': 0 }
          ]
        },
        // Legacy support
        {
          $and: [
            { 'inventory.stripQuantity': 0 },
            { 'inventory.individualQuantity': 0 }
          ]
        }
      ];

      medicines = await Medicine.find(query)
        .sort({ name: 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      total = await Medicine.countDocuments(query);

    } else {
      // Regular query for all other cases - use batch-aware availability
      const allAvailableMedicines = await Medicine.findAvailableForSale(store._id, searchQuery);

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      medicines = allAvailableMedicines.slice(startIndex, endIndex);
      total = allAvailableMedicines.length;
    }

    // Fetch rack locations for all medicines
    const medicineIds = medicines.map(med => med._id);
    console.log('🔍 Fetching rack locations for medicines:', medicineIds.length, 'medicines');
    console.log('🏪 Store ID:', store._id);

    const rackLocations = await require('../models/RackLocation').find({
      medicine: { $in: medicineIds },
      store: store._id,
      isActive: true
    }).populate('rack', 'rackNumber name category location')
      .sort({ priority: 1, assignedDate: 1 });

    console.log('📍 Found rack locations:', rackLocations.length);

    // Group rack locations by medicine ID
    const locationsByMedicine = {};
    rackLocations.forEach(location => {
      const medicineId = location.medicine.toString();
      if (!locationsByMedicine[medicineId]) {
        locationsByMedicine[medicineId] = [];
      }
      locationsByMedicine[medicineId].push({
        rack: location.rack,
        shelf: location.shelf,
        position: location.position,
        stripQuantity: location.stripQuantity,
        individualQuantity: location.individualQuantity,
        priority: location.priority,
        assignedDate: location.assignedDate,
        notes: location.notes
      });
    });

    // Add rack locations to medicines
    const medicinesWithLocations = medicines.map(medicine => {
      const medicineObj = medicine.toObject();
      const medicineLocations = locationsByMedicine[medicine._id.toString()] || [];
      medicineObj.rackLocations = medicineLocations;

      if (medicineLocations.length > 0) {
        console.log(`📦 Medicine "${medicine.name}" has ${medicineLocations.length} locations:`,
          medicineLocations.map(loc => `${loc.rack?.rackNumber}-${loc.shelf}-${loc.position}`));
      }

      return medicineObj;
    });

    console.log('📊 Total medicines with locations:', medicinesWithLocations.filter(m => m.rackLocations.length > 0).length);

    res.status(200).json({
      success: true,
      count: medicines.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: medicinesWithLocations
    });
  } catch (error) {
    console.error('Inventory fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching inventory'
    });
  }
};

// @desc    Export store inventory as CSV
// @route   GET /api/store-manager/inventory/export
// @access  Private (Store Manager only)
const exportInventory = async (req, res) => {
  try {
    const store = req.store;

    // Get all medicines for the store
    const medicines = await Medicine.find({ store: store._id })
      .populate('category', 'name')
      .populate('manufacturer', 'name')
      .sort({ name: 1 });

    // Prepare CSV headers
    const csvHeaders = [
      'Medicine Name',
      'Generic Name',
      'Category',
      'Manufacturer',
      'Strip Stock',
      'Individual Stock',
      'Strip Price',
      'Individual Price',
      'Strip Min Stock',
      'Individual Min Stock',
      'Units Per Strip',
      'Status',
      'Batch Numbers',
      'Expiry Dates'
    ];

    // Prepare CSV rows
    const csvRows = medicines.map(medicine => {
      // Get stock information (support both new and legacy formats)
      const stripStock = medicine.stripInfo?.stock || medicine.inventory?.stripQuantity || 0;
      const individualStock = medicine.individualInfo?.stock || medicine.inventory?.individualQuantity || 0;
      const stripPrice = medicine.stripInfo?.sellingPrice || medicine.pricing?.stripSellingPrice || 0;
      const individualPrice = medicine.individualInfo?.sellingPrice || medicine.pricing?.individualSellingPrice || 0;
      const stripMinStock = medicine.stripInfo?.minimumStock || medicine.inventory?.stripMinimumStock || 0;
      const individualMinStock = medicine.individualInfo?.minimumStock || medicine.inventory?.individualMinimumStock || 0;
      const unitsPerStrip = medicine.unitTypes?.unitsPerStrip || 10;

      // Get batch information
      const batchNumbers = medicine.batches?.map(batch => batch.batchNumber).join('; ') || '';
      const expiryDates = medicine.batches?.map(batch =>
        new Date(batch.expiryDate).toLocaleDateString()
      ).join('; ') || '';

      // Determine status
      let status = 'In Stock';
      if (stripStock === 0 && individualStock === 0) {
        status = 'Out of Stock';
      } else if (stripStock <= stripMinStock || individualStock <= individualMinStock) {
        status = 'Low Stock';
      }

      return [
        medicine.name || '',
        medicine.genericName || '',
        medicine.category?.name || '',
        medicine.manufacturer?.name || '',
        stripStock,
        individualStock,
        stripPrice.toFixed(2),
        individualPrice.toFixed(2),
        stripMinStock,
        individualMinStock,
        unitsPerStrip,
        status,
        batchNumbers,
        expiryDates
      ];
    });

    // Create CSV content with UTF-8 BOM
    let csvContent = '\uFEFF'; // UTF-8 BOM for proper encoding
    csvContent += [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="inventory-${store.name}-${new Date().toISOString().split('T')[0]}.csv"`);

    // Send CSV content
    res.send(csvContent);

  } catch (error) {
    console.error('Export inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting inventory'
    });
  }
};

// ===================
// SALES CONTROLLERS
// ===================

// @desc    Get store sales
// @route   GET /api/store-manager/sales
// @access  Private (Store Manager only)
const getSales = async (req, res) => {
  const store = req.store;
  const {
    page = 1,
    limit = 20,
    startDate,
    endDate,
    customer,
    status,
    search,
    doctorName,
    customerName,
    phoneNumber,
    creditStatus
  } = req.query;

  console.log('🔍 RAW req.query:', req.query);
  console.log('🔍 Extracted parameters:', {
    doctorName: `"${doctorName}"`,
    customerName: `"${customerName}"`,
    phoneNumber: `"${phoneNumber}"`,
    creditStatus: `"${creditStatus}"`
  });

  try {
    let query = { store: store._id };
    console.log('🔍 Fetching sales for store:', store._id);
    console.log('📋 Query parameters:', {
      page, limit, startDate, endDate, customer, status, search,
      doctorName, customerName, phoneNumber, creditStatus
    });
    console.log('🔍 Advanced filter values:', {
      doctorName: doctorName || 'NOT_PROVIDED',
      customerName: customerName || 'NOT_PROVIDED',
      phoneNumber: phoneNumber || 'NOT_PROVIDED',
      creditStatus: creditStatus || 'NOT_PROVIDED'
    });

    // Handle date filtering
    if (startDate || endDate) {
      query.createdAt = {};

      if (startDate) {
        const start = new Date(startDate);
        // Validate date
        if (isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid start date format'
          });
        }
        // Set to beginning of day
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        // Validate date
        if (isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid end date format'
          });
        }
        // Set to end of day
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }

      // Validate date range
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
          return res.status(400).json({
            success: false,
            message: 'Start date cannot be later than end date'
          });
        }
      }
    }

    if (customer) {
      query.customer = customer;
    }

    // Handle status filtering
    if (status) {
      query.status = status;
    }

    // Handle search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { receiptNumber: searchRegex },
        { invoiceNumber: searchRegex },
        { 'customer.name': searchRegex }
      ];
    }

    // Handle new filter parameters
    const additionalFilters = [];

    // Filter by doctor name - need to find doctors first, then filter by their IDs
    if (doctorName) {
      const Doctor = require('../models/Doctor');
      const doctorRegex = new RegExp(doctorName.trim(), 'i');
      const matchingDoctors = await Doctor.find({
        store: store._id,
        name: doctorRegex
      }).select('_id');

      if (matchingDoctors.length > 0) {
        const doctorIds = matchingDoctors.map(doc => doc._id);
        additionalFilters.push({
          'prescription.doctor': { $in: doctorIds }
        });
      } else {
        // No matching doctors found, return empty result
        additionalFilters.push({
          'prescription.doctor': null // This will match no documents
        });
      }
    }

    // Filter by customer name - need to find customers first, then filter by their IDs
    if (customerName) {
      const Customer = require('../models/Customer');
      const customerRegex = new RegExp(customerName.trim(), 'i');
      const matchingCustomers = await Customer.find({
        store: store._id,
        name: customerRegex
      }).select('_id');

      if (matchingCustomers.length > 0) {
        const customerIds = matchingCustomers.map(cust => cust._id);
        additionalFilters.push({
          customer: { $in: customerIds }
        });
      } else {
        // No matching customers found, return empty result
        additionalFilters.push({
          customer: null // This will match no documents
        });
      }
    }

    // Filter by phone number - need to find customers first, then filter by their IDs
    if (phoneNumber) {
      const Customer = require('../models/Customer');
      const phoneRegex = new RegExp(phoneNumber.trim(), 'i');
      const matchingCustomers = await Customer.find({
        store: store._id,
        phone: phoneRegex
      }).select('_id');

      if (matchingCustomers.length > 0) {
        const customerIds = matchingCustomers.map(cust => cust._id);
        additionalFilters.push({
          customer: { $in: customerIds }
        });
      } else {
        // No matching customers found, return empty result
        additionalFilters.push({
          customer: null // This will match no documents
        });
      }
    }

    // Filter by credit status (unpaid/partially paid)
    if (creditStatus === 'credit') {
      additionalFilters.push({
        $or: [
          { paymentStatus: 'pending' },
          { paymentStatus: 'partial' }
        ]
      });
    } else if (creditStatus === 'paid') {
      additionalFilters.push({
        paymentStatus: 'paid'
      });
    }

    // Combine additional filters with existing query
    if (additionalFilters.length > 0) {
      if (query.$and) {
        query.$and.push(...additionalFilters);
      } else {
        query.$and = additionalFilters;
      }
    }

    console.log('🔎 Final query:', query);

    const sales = await Sale.find(query)
      .populate('customer', 'name phone email')
      .populate('items.medicine', 'name genericName')
      .populate('prescription.doctor', 'name specialization')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Sale.countDocuments(query);

    // Also check total sales in database for this store (for debugging)
    const allSalesCount = await Sale.countDocuments({ store: store._id });
    console.log('🔍 All sales count for this store:', allSalesCount);

    console.log('📊 Sales found:', sales.length);
    console.log('📈 Total sales in DB:', total);
    console.log('💰 Sales data preview:', sales.map(sale => ({
      id: sale._id,
      totalAmount: sale.totalAmount,
      createdAt: sale.createdAt,
      customer: sale.customer?.name || 'Walk-in',
      itemCount: sale.items?.length || 0
    })));

    // Add debug information to response
    const response = {
      success: true,
      count: sales.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: sales,
      debug: {
        storeId: store._id,
        query: query,
        totalSalesInStore: allSalesCount,
        timestamp: new Date().toISOString()
      }
    };

    console.log('📤 Sending response:', {
      success: response.success,
      count: response.count,
      total: response.pagination.total,
      debugInfo: response.debug
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('Sales fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sales'
    });
  }
};

// @desc    Create new sale
// @route   POST /api/store-manager/sales
// @access  Private (Store Manager only)
const createSale = async (req, res) => {
  const store = req.store;

  // Handle FormData format - parse JSON data from 'data' field
  let saleData;
  if (req.body.data) {
    try {
      saleData = JSON.parse(req.body.data);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON data format'
      });
    }
  } else {
    saleData = req.body;
  }

  const {
    customer,
    items,
    paymentMethod,
    discount = 0,
    notes,
    doctor,
    prescriptionRequired,
    discountType,
    discountAmount: clientDiscountAmount,
    taxBreakdown,
    totalTaxAmount: clientTotalTaxAmount,
    // New fields for tax and discount selection
    applyDiscount,
    selectedDiscount,
    selectedTax,
    applyTax
  } = saleData;

  try {
    // Validate items and calculate totals
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const medicine = await Medicine.findOne({
        _id: item.medicine,
        store: store._id,
        isActive: true
      });

      if (!medicine) {
        return res.status(400).json({
          success: false,
          message: `Medicine not found: ${item.medicine}`
        });
      }

      // Check if medicine is expired
      if (medicine.expiryDate && new Date(medicine.expiryDate) < new Date()) {
        return res.status(400).json({
          success: false,
          message: `Cannot sell expired medicine "${medicine.name}". This medicine expired on ${new Date(medicine.expiryDate).toLocaleDateString()}.`,
          expiredMedicine: {
            id: medicine._id,
            name: medicine.name,
            expiryDate: medicine.expiryDate
          }
        });
      }

      // Check stock availability with auto-conversion logic
      const unitType = item.unitType || 'strip';
      const stripStock = medicine.stripInfo?.stock || medicine.inventory?.stripQuantity || 0;
      const individualStock = medicine.individualInfo?.stock || medicine.inventory?.individualQuantity || 0;
      const unitsPerStrip = medicine.unitTypes?.unitsPerStrip || 10;

      let availableStock;
      if (unitType === 'strip') {
        availableStock = stripStock;
      } else {
        // For individual units: direct stock + convertible from strips
        availableStock = individualStock + (stripStock * unitsPerStrip);
      }

      if (availableStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${medicine.name}. Available: ${availableStock}, Requested: ${item.quantity}`
        });
      }

      const unitPrice = unitType === 'strip'
        ? (medicine.stripInfo?.sellingPrice || medicine.pricing?.stripSellingPrice || 0)
        : (medicine.individualInfo?.sellingPrice || medicine.pricing?.individualSellingPrice || 0);

      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      processedItems.push({
        medicine: medicine._id,
        quantity: item.quantity,
        unitType,
        unitPrice,
        totalPrice
      });
    }

    // Get store settings for GST and discount calculations
    const Store = require('../models/Store');
    const storeSettings = await Store.findById(store._id).select('settings');

    // Validate discount against store settings
    const settings = storeSettings?.settings || {};
    const maxDiscountPercent = settings.maxDiscountPercent ?? 50;
    const allowDiscounts = settings.allowDiscounts !== false;

    if (!allowDiscounts && (discount > 0 || applyDiscount || selectedDiscount)) {
      return res.status(400).json({
        success: false,
        message: 'Discounts are not allowed for this store'
      });
    }

    // Handle new discount selection system
    let finalDiscountAmount = 0;
    let appliedDiscountType = null;

    if (applyDiscount) {
      if (selectedDiscount) {
        // Use selected discount type
        appliedDiscountType = selectedDiscount;
        if (selectedDiscount.type === 'percentage') {
          finalDiscountAmount = (subtotal * selectedDiscount.value) / 100;
          // Apply discount type's maxValue cap if specified
          if (selectedDiscount.maxValue && selectedDiscount.maxValue > 0) {
            const maxDiscount = (subtotal * selectedDiscount.maxValue) / 100;
            finalDiscountAmount = Math.min(finalDiscountAmount, maxDiscount);
          }
        } else if (selectedDiscount.type === 'amount') {
          finalDiscountAmount = Math.min(selectedDiscount.value, subtotal);
        }
      } else if (discount > 0) {
        // Use manual percentage discount with store-level cap
        const cappedPercent = Math.min(discount, maxDiscountPercent);
        finalDiscountAmount = (subtotal * cappedPercent) / 100;
      }

      // Apply per-bill cap if configured
      const perBillCap = settings.maxDiscountAmountPerBill || 0;
      if (perBillCap > 0) {
        finalDiscountAmount = Math.min(finalDiscountAmount, perBillCap);
      }
    }

    // Override with client-calculated discount if provided (for backward compatibility)
    if (clientDiscountAmount !== undefined && clientDiscountAmount >= 0) {
      const maxAllowedDiscount = subtotal;
      finalDiscountAmount = Math.min(clientDiscountAmount, maxAllowedDiscount);

      // Apply per-bill cap if configured
      const perBillCap = settings.maxDiscountAmountPerBill || 0;
      if (perBillCap > 0) {
        finalDiscountAmount = Math.min(finalDiscountAmount, perBillCap);
      }
    }

    const taxableAmount = Math.max(0, subtotal - finalDiscountAmount);

    // Handle new tax selection system
    let finalTaxAmount = 0;
    let appliedTaxType = null;

    if (applyTax && selectedTax) {
      // Use selected tax type
      appliedTaxType = selectedTax;
      finalTaxAmount = (taxableAmount * selectedTax.rate) / 100;
    } else if (clientTotalTaxAmount !== undefined && clientTotalTaxAmount >= 0) {
      // Use client-calculated tax (for backward compatibility)
      finalTaxAmount = clientTotalTaxAmount;
    } else {
      // Fallback to default GST calculation if no tax selection
      const gstRate = settings.defaultTaxRate ?? 18;
      finalTaxAmount = settings.gstEnabled !== false
        ? (taxableAmount * gstRate) / 100
        : 0;
    }

    const totalAmount = taxableAmount + finalTaxAmount;

    // Handle credit sales validation
    let customerDoc = null;
    if (paymentMethod === 'credit') {
      if (!customer) {
        return res.status(400).json({
          success: false,
          message: 'Customer is required for credit sales'
        });
      }

      // Get customer details
      const Customer = require('../models/Customer');
      customerDoc = await Customer.findOne({
        _id: customer,
        store: store._id
      });

      if (!customerDoc) {
        return res.status(400).json({
          success: false,
          message: 'Customer not found'
        });
      }

      // Check if customer can make credit purchase
      const creditCheck = customerDoc.canMakeCreditPurchase(totalAmount);
      if (!creditCheck.allowed) {
        return res.status(400).json({
          success: false,
          message: creditCheck.reason
        });
      }
    }

    // Build prescription subdocument if provided
    let prescription = undefined;
    if (prescriptionRequired) {
      if (!doctor) {
        return res.status(400).json({ success: false, message: 'Doctor is required for prescription sales' });
      }
      prescription = { doctor };
      if (req.prescriptionFile) {
        const f = req.prescriptionFile;
        prescription.attachment = {
          filename: f.filename,
          path: f.path,
          url: `/uploads/prescriptions/${f.filename}`,
          mimetype: f.mimetype,
          size: f.size,
          uploadedAt: new Date()
        };
      }
    }
    // Debug logging
    console.log('=== SALE CREATION DEBUG ===');
    console.log('applyDiscount:', applyDiscount);
    console.log('selectedDiscount:', selectedDiscount);
    console.log('appliedDiscountType:', appliedDiscountType);
    console.log('applyTax:', applyTax);
    console.log('selectedTax:', selectedTax);
    console.log('appliedTaxType:', appliedTaxType);

    // Create sale
    const sale = await Sale.create({
      store: store._id,
      customer,
      items: processedItems,
      subtotal,
      discount,
      discountAmount: finalDiscountAmount,
      discountType: appliedDiscountType || discountType || null,
      gstAmount: finalTaxAmount, // Keep for backward compatibility
      totalTaxAmount: finalTaxAmount,
      taxBreakdown: taxBreakdown || [],
      totalAmount,
      paymentMethod,
      notes,
      prescription,
      createdBy: req.user.id,
      // New fields for tax and discount selection
      applyDiscount: applyDiscount || false,
      selectedDiscount: appliedDiscountType,
      applyTax: applyTax || false,
      selectedTax: appliedTaxType
    });

    // Update inventory with batch-aware logic
    const batchDeductions = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const medicine = await Medicine.findById(item.medicine);
      const unitsPerStrip = medicine.unitTypes?.unitsPerStrip || 10;

      try {
        // Select batches using FEFO strategy
        const batchSelection = await BatchService.selectBatchesForSale(
          item.medicine,
          item.quantity,
          item.unitType,
          'FEFO', // First Expiry First Out
          store._id
        );

        if (!batchSelection.canFulfill) {
          // Fallback to traditional inventory if batches can't fulfill
          console.warn(`Batch system cannot fulfill ${item.quantity} ${item.unitType} of medicine ${medicine.name}. Using traditional inventory.`);

          if (item.unitType === 'strip') {
            // Simple strip deduction
            medicine.stripInfo.stock -= item.quantity;
            medicine.inventory.stripQuantity -= item.quantity;
          } else {
            // Individual units - handle auto-conversion
            const currentIndividualStock = medicine.individualInfo?.stock || medicine.inventory?.individualQuantity || 0;
            const currentStripStock = medicine.stripInfo?.stock || medicine.inventory?.stripQuantity || 0;

            if (currentIndividualStock >= item.quantity) {
              // Sufficient individual stock - deduct directly
              medicine.individualInfo.stock -= item.quantity;
              medicine.inventory.individualQuantity -= item.quantity;
            } else {
              // Need to convert strips to individual units
              const remainingNeeded = item.quantity - currentIndividualStock;
              const stripsToConvert = Math.ceil(remainingNeeded / unitsPerStrip);
              const individualUnitsFromStrips = stripsToConvert * unitsPerStrip;

              // Deduct all current individual stock
              medicine.individualInfo.stock = 0;
              medicine.inventory.individualQuantity = 0;

              // Convert strips to individual units
              medicine.stripInfo.stock -= stripsToConvert;
              medicine.inventory.stripQuantity -= stripsToConvert;

              // Add converted individual units, then deduct what's needed
              const newIndividualStock = individualUnitsFromStrips - remainingNeeded;
              medicine.individualInfo.stock = newIndividualStock;
              medicine.inventory.individualQuantity = newIndividualStock;
            }
          }

          await medicine.save();
        } else {
          // Deduct from selected batches
          const deductionResult = await BatchService.deductFromBatches(
            batchSelection.selectedBatches,
            item.unitType,
            req.user.id
          );

          // Store batch information for the sale item
          processedItems[i].batchInfo = batchSelection.selectedBatches.map(batch => ({
            batchNumber: batch.batchNumber,
            expiryDate: batch.expiryDate,
            manufacturingDate: batch.manufacturingDate,
            quantityUsed: batch.quantitySelected
          }));

          // Update medicine stock to match batch totals
          await BatchService.synchronizeMedicineStock(item.medicine, store._id);

          batchDeductions.push({
            medicineId: item.medicine,
            medicineName: medicine.name,
            unitType: item.unitType,
            quantity: item.quantity,
            batchesUsed: deductionResult
          });
        }

        // Log inventory change for audit trail
        await logInventoryChange({
          medicine: item.medicine,
          store: store._id,
          changeType: 'sale',
          unitType: item.unitType,
          quantityChanged: -item.quantity, // Negative because it's a deduction
          previousStock: item.unitType === 'strip' ?
            (medicine.stripInfo?.stock || 0) + item.quantity :
            (medicine.individualInfo?.stock || 0) + item.quantity,
          newStock: item.unitType === 'strip' ?
            (medicine.stripInfo?.stock || 0) :
            (medicine.individualInfo?.stock || 0),
          reference: {
            type: 'Sale',
            id: sale._id,
            invoiceNumber: sale.invoiceNumber
          },
          performedBy: req.user.id,
          notes: `Sale completed - ${batchDeductions.length > 0 ? 'batch-aware' : 'traditional'} inventory deduction`,
          batchInfo: processedItems[i].batchInfo || null
        });

      } catch (error) {
        console.error(`Error processing inventory for medicine ${medicine.name}:`, error);
        // Fallback to traditional inventory update
        if (item.unitType === 'strip') {
          medicine.stripInfo.stock -= item.quantity;
          medicine.inventory.stripQuantity -= item.quantity;
        } else {
          medicine.individualInfo.stock -= item.quantity;
          medicine.inventory.individualQuantity -= item.quantity;
        }
        await medicine.save();
      }
    }

    // Handle credit transaction if payment method is credit
    if (paymentMethod === 'credit' && customerDoc) {
      try {

        // Create credit transaction record
        await CreditTransaction.createTransaction({
          store: store._id,
          customer: customerDoc._id,
          transactionType: 'credit_sale',
          amount: totalAmount,
          balanceChange: totalAmount, // Positive because it increases credit balance
          reference: {
            type: 'Sale',
            id: sale._id,
            number: sale.invoiceNumber || sale._id.toString()
          },
          description: `Credit sale - Invoice ${sale.invoiceNumber || sale._id.toString()}`,
          notes: notes || '',
          processedBy: req.user.id,
          transactionDate: new Date() // Explicitly set transaction date
        });

        console.log('✅ Credit transaction created successfully for customer:', customerDoc.name);
      } catch (creditError) {
        console.error('❌ Error creating credit transaction:', creditError);
        // Don't fail the sale if credit transaction creation fails, but log it
      }
    }

    // Update customer purchase statistics if customer is provided
    if (customer && customerDoc) {
      try {
        await customerDoc.updatePurchaseStats(totalAmount);
        console.log('✅ Customer purchase stats updated');
      } catch (statsError) {
        console.error('❌ Error updating customer stats:', statsError);
        // Don't fail the sale if stats update fails
      }
    }

    // Generate invoice automatically
    const { generateInvoiceForSale } = require('../utils/invoiceGenerator');
    let invoice = null;
    try {
      invoice = await generateInvoiceForSale(sale, req.user);
      console.log('✅ Invoice generated successfully:', invoice.invoiceNumber);
    } catch (invoiceError) {
      console.error('❌ Error generating invoice:', invoiceError);
      // Don't fail the sale if invoice generation fails
    }

    const populatedSale = await Sale.findById(sale._id)
      .populate('customer', 'name phone email')
      .populate('items.medicine', 'name genericName');

    res.status(201).json({
      success: true,
      data: populatedSale,
      invoice: invoice ? {
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate
      } : null
    });
  } catch (error) {
    console.error('Sale creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating sale'
    });
  }
};

// ===================
// CUSTOMER CONTROLLERS
// ===================

// @desc    Get store customers
// @route   GET /api/store-manager/customers
// @access  Private (Store Manager only)
const getCustomers = async (req, res) => {
  const store = req.store;
  const { page = 1, limit = 20, search, status } = req.query;

  try {
    let query = { store: store._id };

    // Add status filter (show all by default, but allow filtering by status)
    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query)
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Customer.countDocuments(query);

    res.status(200).json({
      success: true,
      count: customers.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: customers
    });
  } catch (error) {
    console.error('Customers fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching customers'
    });
  }
};

// @desc    Get single customer
// @route   GET /api/store-manager/customers/:id
// @access  Private (Store Manager only)
const getCustomer = async (req, res) => {
  const store = req.store;
  const customerId = req.params.id;

  try {
    const customer = await Customer.findOne({
      _id: customerId,
      store: store._id
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching customer'
    });
  }
};

// @desc    Update customer
// @route   PUT /api/store-manager/customers/:id
// @access  Private (Store Manager only)
const updateCustomer = async (req, res) => {
  const store = req.store;
  const customerId = req.params.id;
  const { name, phone, email, customerType, address, creditLimit } = req.body;

  try {
    // Find customer
    const customer = await Customer.findOne({
      _id: customerId,
      store: store._id
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required'
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Clean and validate phone
    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit phone number'
      });
    }

    // Check if phone number is already taken by another customer
    const existingCustomer = await Customer.findOne({
      store: store._id,
      phone: cleanPhone,
      _id: { $ne: customerId } // Exclude current customer
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already exists for another customer'
      });
    }

    // Validate email if provided
    if (email && email.trim()) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid email address'
        });
      }

      // Check if email is already taken by another customer
      const existingEmailCustomer = await Customer.findOne({
        store: store._id,
        email: email.trim().toLowerCase(),
        _id: { $ne: customerId }
      });

      if (existingEmailCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists for another customer'
        });
      }
    }

    // Update customer data
    customer.name = name.trim();
    customer.phone = cleanPhone;
    customer.customerType = customerType || 'regular';
    customer.creditLimit = creditLimit || 0;
    customer.lastUpdatedBy = req.user._id;

    // Update email if provided
    if (email && email.trim()) {
      customer.email = email.trim().toLowerCase();
    } else {
      customer.email = undefined;
    }

    // Handle address - convert string to address object if needed
    if (address && address.trim()) {
      customer.address = {
        street: address.trim()
      };
    } else {
      customer.address = undefined;
    }

    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });

  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating customer'
    });
  }
};

// @desc    Delete customer
// @route   DELETE /api/store-manager/customers/:id
// @access  Private (Store Manager only)
const deleteCustomer = async (req, res) => {
  const store = req.store;
  const customerId = req.params.id;

  try {
    // Find customer
    const customer = await Customer.findOne({
      _id: customerId,
      store: store._id
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if customer has any sales or transactions
    // You might want to prevent deletion if customer has purchase history
    // For now, we'll allow deletion but you can add checks here

    await Customer.findByIdAndDelete(customerId);

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });

  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting customer'
    });
  }
};

// @desc    Create new customer
// @route   POST /api/store-manager/customers
// @access  Private (Store Manager only)
const createCustomer = async (req, res) => {
  const storeId = req.store._id;

  try {
    console.log('Create customer request body:', req.body);
    const { name, phone, email, address, customerType, creditLimit } = req.body || {};

    // Basic validation
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required'
      });
    }

    // Validate phone number format (10 digits only)
    const cleanPhone = phone.toString().replace(/\D/g, ''); // Remove non-digits
    if (cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be exactly 10 digits'
      });
    }

    // Validate email if provided
    if (email && email.trim()) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid email address'
        });
      }
    }

    // Check if customer with same phone already exists in this store
    const existingCustomer = await Customer.findOne({ store: storeId, phone: cleanPhone });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this phone number already exists in your store'
      });
    }

    // Prepare customer data
    const customerData = {
      store: storeId,
      name: name.trim(),
      phone: cleanPhone,
      customerType: customerType || 'regular',
      creditLimit: creditLimit || 0,
      createdBy: req.user._id
    };

    // Add email if provided
    if (email && email.trim()) {
      customerData.email = email.trim().toLowerCase();
    }

    // Handle address - convert string to address object if needed
    if (address && address.trim()) {
      customerData.address = {
        street: address.trim()
      };
    }

    console.log('Customer data to create:', customerData);
    const customer = await Customer.create(customerData);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors:', errors);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    if (error.code === 11000) {
      console.error('Duplicate key error:', error.keyValue);
      return res.status(400).json({
        success: false,
        message: 'Customer with this phone or email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating customer'
    });
  }
};


// ===================
// MASTER MEDICINE CONTROLLERS
// ===================

// @desc    Search master medicines for store selection
// @route   GET /api/store-manager/master-medicines
// @access  Private (Store Manager only)
const searchMasterMedicines = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category } = req.query;
    const skip = (page - 1) * limit;

    // Build query for active master medicines only
    let query = { isActive: true };

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { genericName: searchRegex },
        { composition: searchRegex },
        { manufacturer: searchRegex }
      ];
    }

    if (category) {
      query.category = category;
    }

    const masterMedicines = await MasterMedicine.find(query)
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip(skip)
      .select('name genericName composition manufacturer category unitTypes dosage barcode requiresPrescription');

    const total = await MasterMedicine.countDocuments(query);

    res.status(200).json({
      success: true,
      count: masterMedicines.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: masterMedicines
    });
  } catch (error) {
    console.error('Master medicines search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching master medicines'
    });
  }
};

// @desc    Add medicine to store inventory (custom or master medicine)
// @route   POST /api/store-manager/medicines
// @access  Private (Store Manager only)
const addCustomMedicine = async (req, res) => {
  try {
    const store = req.store;
    const storeManager = req.user;

    // Check if this is a master medicine being added to inventory
    const isMasterMedicine = req.body._id && !req.body.isCustom;

    if (isMasterMedicine) {
      // Handle master medicine addition to inventory
      return await addMasterMedicineToInventory(req, res, store, storeManager);
    }

    // Extract medicine data from request body for custom medicines
    const {
      name,
      genericName,
      composition,
      manufacturer,
      category,
      categories,
      unitTypes,
      stripInfo,
      individualInfo,
      dosage,
      storageConditions,
      sideEffects,
      contraindications,
      interactions,
      batchNumber,
      barcode,
      expiryDate,
      storageLocation,
      supplier,
      tags,
      requiresPrescription,
      notes,
      isActive
    } = req.body;

    // Validate required fields
    if (!name || !composition || !manufacturer || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, composition, manufacturer, and category'
      });
    }

    // Validate unit configuration
    if (!unitTypes || (!unitTypes.hasStrips && !unitTypes.hasIndividual)) {
      return res.status(400).json({
        success: false,
        message: 'At least one unit type (strips or individual) must be enabled'
      });
    }

    // Validate pricing information
    if (unitTypes.hasStrips && (!stripInfo || !stripInfo.sellingPrice)) {
      return res.status(400).json({
        success: false,
        message: 'Strip selling price is required when strips are enabled'
      });
    }

    if (unitTypes.hasIndividual && (!individualInfo || !individualInfo.sellingPrice)) {
      return res.status(400).json({
        success: false,
        message: 'Individual selling price is required when individual units are enabled'
      });
    }

    // Validate Cut Medicine functionality
    if (unitTypes.hasIndividual && !unitTypes.hasStrips) {
      // This is a single-piece medicine (bottles, injections, etc.) - individual units are allowed
      // No additional validation needed for single-piece medicines
    } else if (unitTypes.hasIndividual && unitTypes.hasStrips) {
      // This is attempting to create a cut medicine (strips that can be cut into individual units)
      // For now, we'll allow this but could add category-based validation here if needed
    }

    // Check if medicine with same name and manufacturer already exists in this store
    const existingMedicine = await Medicine.findOne({
      store: store._id,
      name: name.trim(),
      manufacturer: manufacturer.trim()
    });

    if (existingMedicine) {
      return res.status(400).json({
        success: false,
        message: 'A medicine with the same name and manufacturer already exists in your inventory'
      });
    }

    // Prepare medicine data
    const medicineData = {
      name: name.trim(),
      genericName: genericName?.trim() || '',
      composition: composition.trim(),
      manufacturer: manufacturer.trim(),
      category,

      // Unit configuration
      unitTypes: {
        hasStrips: unitTypes?.hasStrips || false,
        hasIndividual: unitTypes?.hasIndividual || false,
        unitsPerStrip: unitTypes?.unitsPerStrip || 10
      },

      // Pricing and stock info
      stripInfo: unitTypes?.hasStrips ? {
        purchasePrice: stripInfo?.purchasePrice || 0,
        sellingPrice: stripInfo?.sellingPrice || 0,
        mrp: stripInfo?.mrp || stripInfo?.sellingPrice || 0,
        stock: stripInfo?.stock || 0,
        minStock: stripInfo?.minStock || 5,
        reorderLevel: stripInfo?.reorderLevel || 10
      } : undefined,
      individualInfo: unitTypes?.hasIndividual ? {
        purchasePrice: individualInfo?.purchasePrice || 0,
        sellingPrice: individualInfo?.sellingPrice || 0,
        mrp: individualInfo?.mrp || individualInfo?.sellingPrice || 0,
        stock: individualInfo?.stock || 0,
        minStock: individualInfo?.minStock || 50,
        reorderLevel: individualInfo?.reorderLevel || 100
      } : undefined,

      // Dosage information (if provided)
      dosage: dosage ? {
        strength: dosage.strength?.trim() || '',
        form: dosage.form?.trim() || '',
        frequency: dosage.frequency?.trim() || ''
      } : undefined,

      // Storage conditions (if provided)
      storageConditions: storageConditions ? {
        temperature: storageConditions.temperature ? {
          min: storageConditions.temperature.min ? parseFloat(storageConditions.temperature.min) : undefined,
          max: storageConditions.temperature.max ? parseFloat(storageConditions.temperature.max) : undefined,
          unit: storageConditions.temperature.unit || 'celsius'
        } : undefined,
        humidity: storageConditions.humidity ? {
          min: storageConditions.humidity.min ? parseFloat(storageConditions.humidity.min) : undefined,
          max: storageConditions.humidity.max ? parseFloat(storageConditions.humidity.max) : undefined
        } : undefined,
        specialConditions: storageConditions.specialConditions || []
      } : undefined,

      // Medical information (if provided)
      sideEffects: sideEffects ? sideEffects.split(',').map(s => s.trim()).filter(s => s) : [],
      contraindications: contraindications ? contraindications.split(',').map(s => s.trim()).filter(s => s) : [],
      interactions: interactions ? interactions.split(',').map(s => s.trim()).filter(s => s) : [],

      // Basic fields
      batchNumber: batchNumber?.trim() || '',
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      barcode: barcode && barcode.trim() ? barcode.trim() : undefined, // Use undefined for empty barcodes to avoid unique constraint issues
      supplier: supplier?.trim() || '', // Store as string for custom medicines
      tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
      requiresPrescription: requiresPrescription || false,
      notes: notes?.trim() || '',
      isActive: isActive !== undefined ? isActive : true,

      // Store and user references
      store: store._id,
      addedBy: storeManager._id,
      isCustom: true // Flag to indicate this is a custom medicine
    };

    // Create the medicine
    const medicine = await Medicine.create(medicineData);
    await medicine.populate([
      { path: 'store', select: 'name code' },
      { path: 'addedBy', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Custom medicine added to inventory successfully',
      data: medicine
    });

  } catch (error) {
    console.error('Add custom medicine error:', error);

    // Handle specific validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Medicine with this barcode already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while adding custom medicine'
    });
  }
};

// Helper function to add master medicine to store inventory
const addMasterMedicineToInventory = async (req, res, store, storeManager) => {
  try {
    const Medicine = require('../models/Medicine');
    const {
      _id: masterMedicineId,
      name,
      genericName,
      composition,
      manufacturer,
      category,
      unitTypes,
      dosage,
      storageConditions,
      sideEffects,
      contraindications,
      interactions,
      requiresPrescription,
      tags,
      // Inventory-specific data from the form
      stripInfo,
      individualInfo,
      batchNumber,
      barcode,
      expiryDate,
      storageLocation,
      supplier,
      notes
    } = req.body;

    // Handle barcode validation and uniqueness
    let processedBarcode = undefined;
    if (barcode && barcode.trim()) {
      processedBarcode = barcode.trim();

      // Check if medicine with this barcode already exists in this store
      const existingMedicine = await Medicine.findOne({
        barcode: processedBarcode,
        store: store._id
      });

      if (existingMedicine) {
        return res.status(400).json({
          success: false,
          message: 'A medicine with this barcode already exists in your inventory. Please use a different barcode or update the existing medicine.'
        });
      }
    }

    // Create new medicine record for this store based on master medicine
    const medicineData = {
      // Master medicine data
      name,
      genericName,
      composition,
      manufacturer,
      category,
      unitTypes,
      dosage,
      storageConditions,
      sideEffects,
      contraindications,
      interactions,
      requiresPrescription,
      tags,

      // Store-specific inventory data
      stripInfo,
      individualInfo,
      batchNumber,
      barcode: processedBarcode,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      storageLocation,
      supplier,
      notes,

      // Store and user references
      store: store._id,
      addedBy: storeManager._id,
      createdBy: storeManager._id,
      isCustom: false, // This is based on a master medicine
      isActive: true
    };

    // Remove undefined values to avoid validation issues
    Object.keys(medicineData).forEach(key => {
      if (medicineData[key] === undefined) {
        delete medicineData[key];
      }
    });

    const medicine = await Medicine.create(medicineData);
    await medicine.populate('addedBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Master medicine added to inventory successfully',
      data: medicine
    });

  } catch (error) {
    console.error('Add master medicine to inventory error:', error);

    // Handle specific validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A medicine with this barcode already exists in your inventory'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while adding master medicine to inventory'
    });
  }
};

// @desc    Update medicine in store inventory
// @route   PUT /api/store-manager/medicines/:id
// @access  Private (Store Manager only)
const updateMedicine = async (req, res) => {
  try {
    const store = req.store;
    const storeManager = req.user;
    const Medicine = require('../models/Medicine');

    // Find the medicine in this store
    const medicine = await Medicine.findOne({
      _id: req.params.id,
      store: store._id
    });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found in your inventory'
      });
    }

    // Check if barcode is being updated and if it conflicts
    if (req.body.barcode && req.body.barcode.trim()) {
      const processedBarcode = req.body.barcode.trim();

      // Check if another medicine in this store has this barcode
      const existingMedicine = await Medicine.findOne({
        barcode: processedBarcode,
        store: store._id,
        _id: { $ne: req.params.id } // Exclude current medicine
      });

      if (existingMedicine) {
        return res.status(400).json({
          success: false,
          message: 'Another medicine with this barcode already exists in your inventory'
        });
      }

      req.body.barcode = processedBarcode;
    } else if (req.body.barcode === '') {
      // Handle empty barcode
      req.body.barcode = undefined;
    }

    // Validate Cut Medicine functionality
    if (req.body.unitTypes || req.body.individualInfo) {
      const unitTypes = req.body.unitTypes || medicine.unitTypes;

      // If trying to enable individual units without strips, it's not a valid cut medicine scenario
      if (unitTypes.hasIndividual && !unitTypes.hasStrips) {
        // This is a single-piece medicine - individual units are allowed but not as "cut medicine"
        // No additional validation needed for single-piece medicines
      } else if (unitTypes.hasIndividual && unitTypes.hasStrips) {
        // This is attempting to enable cut medicine functionality
        // For now, we'll allow this but could add category-based validation here if needed
      }

      // If trying to set individual stock for a medicine that doesn't support cutting
      if (req.body.individualInfo && req.body.individualInfo.stock) {
        const hasStrips = unitTypes.hasStrips;
        const hasIndividual = unitTypes.hasIndividual;

        // Only allow individual stock updates if:
        // 1. Medicine has both strips and individual (cut medicine) OR
        // 2. Medicine only has individual (single-piece medicine)
        if (!hasIndividual) {
          return res.status(400).json({
            success: false,
            message: 'Cannot set individual stock for a medicine that does not support individual units'
          });
        }
      }
    }

    // Update the medicine
    const updateData = {
      ...req.body,
      updatedBy: storeManager._id
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedMedicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('updatedBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Medicine updated successfully',
      data: updatedMedicine
    });

  } catch (error) {
    console.error('Update medicine error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A medicine with this barcode already exists in your inventory'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating medicine'
    });
  }
};

// @desc    Delete medicine from store inventory
// @route   DELETE /api/store-manager/medicines/:id
// @access  Private (Store Manager only)
const deleteMedicine = async (req, res) => {
  try {
    const store = req.store;
    const Medicine = require('../models/Medicine');

    console.log('🗑️ Delete Medicine Debug:', {
      medicineId: req.params.id,
      storeId: store._id.toString(),
      timestamp: new Date().toISOString()
    });

    // Find the medicine in this store
    const medicine = await Medicine.findOne({
      _id: req.params.id,
      store: store._id
    });

    console.log('🔍 Medicine found:', medicine ? {
      id: medicine._id.toString(),
      name: medicine.name,
      store: medicine.store.toString()
    } : 'Not found');

    if (!medicine) {
      console.log('❌ Medicine not found - returning 404');
      return res.status(404).json({
        success: false,
        message: 'Medicine not found in your inventory'
      });
    }

    // Check if medicine has any sales history or is referenced elsewhere
    // For now, we'll allow deletion but in production you might want to soft delete

    await Medicine.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Medicine deleted successfully'
    });

  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting medicine'
    });
  }
};

// @desc    Get customer analytics
// @route   GET /api/store-manager/customers/analytics
// @access  Private (Store Manager only)
const getCustomerAnalytics = async (req, res) => {
  const store = req.store;

  try {
    console.log('📊 Starting customer analytics data fetch for store:', store.name);
    console.log('🏪 Store ID:', store._id);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    // Get basic customer counts
    const [
      totalCustomers,
      newCustomersThisMonth,
      newCustomersLastMonth,
      activeCustomers
    ] = await Promise.all([
      Customer.countDocuments({ store: store._id }),
      Customer.countDocuments({
        store: store._id,
        registrationDate: { $gte: startOfMonth }
      }),
      Customer.countDocuments({
        store: store._id,
        registrationDate: { $gte: startOfLastMonth, $lte: endOfLastMonth }
      }),
      Customer.countDocuments({
        store: store._id,
        status: 'active',
        lastPurchaseDate: { $gte: sixMonthsAgo }
      })
    ]);

    console.log('📈 Basic customer counts:', {
      totalCustomers,
      newCustomersThisMonth,
      newCustomersLastMonth,
      activeCustomers
    });

    // Calculate monthly growth percentage
    const monthlyGrowth = newCustomersLastMonth > 0
      ? Math.round(((newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth) * 100)
      : newCustomersThisMonth > 0 ? 100 : 0;

    // Get top customer by total spending
    const topCustomer = await Customer.findOne({
      store: store._id,
      totalSpent: { $gt: 0 }
    })
    .sort({ totalSpent: -1 })
    .select('name totalSpent');

    // Calculate retention rate (customers who made purchases in last 6 months)
    const totalCustomersWithPurchases = await Customer.countDocuments({
      store: store._id,
      totalPurchases: { $gt: 0 }
    });

    const retentionRate = totalCustomersWithPurchases > 0
      ? Math.round((activeCustomers / totalCustomersWithPurchases) * 100)
      : 0;

    // Get customer segments based on spending and activity status
    const customerSegments = await Customer.aggregate([
      { $match: { store: new mongoose.Types.ObjectId(store._id) } },
      {
        $addFields: {
          segment: {
            $switch: {
              branches: [
                // Blocked: customers with status 'blocked'
                {
                  case: { $eq: ['$status', 'blocked'] },
                  then: 'Blocked'
                },
                // VIP: high spending active customers
                {
                  case: {
                    $and: [
                      { $gte: ['$totalSpent', 15000] },
                      { $ne: ['$status', 'blocked'] }
                    ]
                  },
                  then: 'VIP'
                },
                // Regular: medium spending active customers
                {
                  case: {
                    $and: [
                      { $gte: ['$totalSpent', 5000] },
                      { $lt: ['$totalSpent', 15000] },
                      { $ne: ['$status', 'blocked'] }
                    ]
                  },
                  then: 'Regular'
                },
                // Occasional: customers with some spending or new active customers
                {
                  case: { $ne: ['$status', 'blocked'] },
                  then: 'Occasional'
                }
              ],
              // Default fallback
              default: 'Occasional'
            }
          }
        }
      },
      {
        $group: {
          _id: '$segment',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format segments for frontend
    const segmentMap = {
      VIP: { count: 0, color: 'green' },
      Regular: { count: 0, color: 'blue' },
      Occasional: { count: 0, color: 'yellow' },
      Blocked: { count: 0, color: 'red' }
    };

    console.log('📊 Customer segments from aggregation:', customerSegments);

    customerSegments.forEach(segment => {
      if (segmentMap[segment._id]) {
        segmentMap[segment._id].count = segment.count;
      }
    });

    console.log('📈 Final segment map:', segmentMap);

    // Get top 5 customers by value
    const topCustomers = await Customer.find({
      store: store._id,
      totalSpent: { $gt: 0 }
    })
    .sort({ totalSpent: -1 })
    .limit(5)
    .select('name totalSpent totalPurchases');

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCustomers,
          newCustomersThisMonth,
          monthlyGrowth,
          retentionRate,
          activeCustomers
        },
        topCustomer: topCustomer ? {
          name: topCustomer.name,
          totalSpent: topCustomer.totalSpent
        } : null,
        segments: segmentMap,
        topCustomers: topCustomers.map(customer => ({
          name: customer.name,
          amount: customer.totalSpent,
          purchases: customer.totalPurchases
        }))
      }
    });

  } catch (error) {
    console.error('Customer analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching customer analytics'
    });
  }
};

// @desc    Get credit management data
// @route   GET /api/store-manager/customers/credit-management
// @access  Private (Store Manager only)
const getCreditManagement = async (req, res) => {
  const store = req.store;

  try {
    console.log('💳 Starting credit management data fetch for store:', store.name);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get credit customers with outstanding balances
    console.log('🔍 Searching for credit customers with store ID:', store._id);
    const creditCustomers = await Customer.find({
      store: store._id,
      creditBalance: { $gt: 0 }
    }).select('name phone creditBalance creditLimit creditStatus lastPurchaseDate');

    console.log('💰 Found credit customers:', creditCustomers.length);
    console.log('📋 Credit customers details:', creditCustomers.map(c => ({
      name: c.name,
      creditBalance: c.creditBalance,
      creditLimit: c.creditLimit
    })));

    // Calculate total outstanding
    const totalOutstanding = creditCustomers.reduce((sum, customer) => sum + (customer.creditBalance || 0), 0);
    console.log('💰 Total outstanding credit:', totalOutstanding);

    // Get overdue customers (assuming 30 days credit period)
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const overdueCustomers = creditCustomers.filter(customer =>
      customer.lastPurchaseDate && customer.lastPurchaseDate < thirtyDaysAgo && customer.creditBalance > 0
    );
    const totalOverdue = overdueCustomers.reduce((sum, customer) => sum + (customer.creditBalance || 0), 0);
    console.log('⚠️ Overdue customers:', overdueCustomers.length, 'Total overdue amount:', totalOverdue);

    // Get current month credit sales using CreditTransaction model for accuracy
    let currentMonthCredit = 0;
    try {
      const currentMonthCreditSales = await CreditTransaction.aggregate([
        {
          $match: {
            store: store._id,
            transactionType: 'credit_sale',
            transactionDate: { $gte: startOfMonth },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      currentMonthCredit = currentMonthCreditSales[0]?.totalAmount || 0;
      console.log('💰 Current month credit sales from CreditTransaction:', currentMonthCredit);
    } catch (error) {
      console.warn('⚠️ Error fetching credit transactions, falling back to Sale model:', error.message);
      // Fallback to Sale model if CreditTransaction fails
      const fallbackCreditSales = await Sale.aggregate([
        {
          $match: {
            store: store._id,
            paymentMethod: 'credit',
            createdAt: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$totalAmount' }
          }
        }
      ]);
      currentMonthCredit = fallbackCreditSales[0]?.totalAmount || 0;
      console.log('💰 Current month credit sales from Sale fallback:', currentMonthCredit);
    }

    // Get today's credit payments/collections using CreditTransaction model
    let todayCollected = 0;
    let todayPaymentCount = 0;
    try {
      const todayPayments = await CreditTransaction.aggregate([
        {
          $match: {
            store: store._id,
            transactionType: 'credit_payment',
            transactionDate: { $gte: startOfDay },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalCollected: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      todayCollected = todayPayments[0]?.totalCollected || 0;
      todayPaymentCount = todayPayments[0]?.count || 0;
      console.log('💳 Today collected from credit payments:', todayCollected, 'Count:', todayPaymentCount);
    } catch (error) {
      console.warn('⚠️ Error fetching today credit payments:', error.message);
      // For now, keep as 0 since we can't reliably determine credit payments from Sale model alone
      console.log('💳 Today collected set to 0 due to CreditTransaction error');
    }

    // Format credit customers for table
    const formattedCreditCustomers = creditCustomers.map(customer => {
      const daysSinceLastPurchase = customer.lastPurchaseDate
        ? Math.floor((now - customer.lastPurchaseDate) / (1000 * 60 * 60 * 24))
        : 0;

      const isOverdue = daysSinceLastPurchase > 30;
      const dueDate = customer.lastPurchaseDate
        ? new Date(customer.lastPurchaseDate.getTime() + (30 * 24 * 60 * 60 * 1000))
        : new Date();

      return {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        outstandingAmount: customer.creditBalance,
        creditLimit: customer.creditLimit,
        dueDate: dueDate,
        daysOverdue: isOverdue ? daysSinceLastPurchase - 30 : 0,
        status: isOverdue ? 'overdue' : 'current',
        creditStatus: customer.creditStatus
      };
    });

    const responseData = {
      summary: {
        totalOutstanding: Math.round(totalOutstanding * 100) / 100, // Ensure 2 decimal places
        totalOverdueAmount: Math.round(totalOverdue * 100) / 100,
        overdueCustomerCount: overdueCustomers.length || 0,
        totalCreditCustomers: creditCustomers.length || 0,
        currentMonthCredit: Math.round(currentMonthCredit * 100) / 100,
        todayCollected: Math.round(todayCollected * 100) / 100,
        todayPaymentCount: todayPaymentCount || 0
      },
      creditCustomers: formattedCreditCustomers || []
    };

    console.log('📊 Credit management response data:', JSON.stringify(responseData, null, 2));

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Credit management error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching credit management data'
    });
  }
};

// @desc    Get medicine details
// @route   GET /api/store-manager/medicines/:id
// @access  Private (Store Manager only)
const getMedicineDetails = async (req, res) => {
  try {
    const store = req.store;
    const { id } = req.params;

    // Find the medicine in this store
    const medicine = await Medicine.findOne({
      _id: id,
      store: store._id
    });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found in your inventory'
      });
    }

    res.status(200).json({
      success: true,
      data: medicine
    });
  } catch (error) {
    console.error('Get medicine details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching medicine details'
    });
  }
};

// @desc    Get medicine sales history
// @route   GET /api/store-manager/medicines/:id/sales-history
// @access  Private (Store Manager only)
const getMedicineSalesHistory = async (req, res) => {
  try {
    const store = req.store;
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify medicine belongs to this store
    const medicine = await Medicine.findOne({ _id: id, store: store._id });
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found in your inventory'
      });
    }

    // Find all sales that include this medicine
    const sales = await Sale.find({
      store: store._id,
      'items.medicine': id
    })
      .populate('customer', 'name phone email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Extract medicine-specific data from each sale
    const salesHistory = [];
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.medicine.toString() === id) {
          salesHistory.push({
            saleId: sale._id,
            saleDate: sale.createdAt,
            customer: sale.customer,
            quantity: item.quantity,
            unitType: item.unitType,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            paymentMethod: sale.paymentMethod,
            createdBy: sale.createdBy
          });
        }
      });
    });

    res.status(200).json({
      success: true,
      data: salesHistory
    });
  } catch (error) {
    console.error('Get medicine sales history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching medicine sales history'
    });
  }
};

// @desc    Get medicine purchase history
// @route   GET /api/store-manager/medicines/:id/purchase-history
// @access  Private (Store Manager only)
const getMedicinePurchaseHistory = async (req, res) => {
  try {
    const store = req.store;
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify medicine belongs to this store
    const medicine = await Medicine.findOne({ _id: id, store: store._id });
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found in your inventory'
      });
    }

    // Find all purchases that include this medicine
    const Purchase = require('../models/Purchase');
    const purchases = await Purchase.find({
      store: store._id,
      'items.medicine': id
    })
      .populate('supplier', 'name phone email contactPerson')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Extract medicine-specific data from each purchase
    const purchaseHistory = [];
    purchases.forEach(purchase => {
      purchase.items.forEach(item => {
        if (item.medicine.toString() === id) {
          purchaseHistory.push({
            purchaseId: purchase._id,
            purchaseDate: purchase.createdAt,
            supplier: purchase.supplier,
            quantity: item.quantity,
            unitType: item.unitType,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            createdBy: purchase.createdBy
          });
        }
      });
    });

    res.status(200).json({
      success: true,
      data: purchaseHistory
    });
  } catch (error) {
    console.error('Get medicine purchase history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching medicine purchase history'
    });
  }
};

// @desc    Recalculate customer metrics from actual sales data
// @route   POST /api/store-manager/customers/:id/recalculate-metrics
// @access  Private (Store Manager only)
const recalculateCustomerMetrics = async (req, res) => {
  const store = req.store;
  const customerId = req.params.id;

  try {
    // Find the customer
    const customer = await Customer.findOne({
      _id: customerId,
      store: store._id
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get all sales for this customer from the Sales collection
    const salesStats = await Sale.aggregate([
      {
        $match: {
          store: store._id,
          customer: new mongoose.Types.ObjectId(customerId),
          status: { $ne: 'cancelled' } // Exclude cancelled sales
        }
      },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          lastPurchaseDate: { $max: '$createdAt' }
        }
      }
    ]);

    // Get credit balance from credit transactions
    const creditStats = await Sale.aggregate([
      {
        $match: {
          store: store._id,
          customer: new mongoose.Types.ObjectId(customerId),
          paymentMethod: 'credit',
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalCreditSales: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get credit payments from credit transactions
    const CreditTransaction = require('../models/CreditTransaction');
    const creditPayments = await CreditTransaction.aggregate([
      {
        $match: {
          store: store._id,
          customer: new mongoose.Types.ObjectId(customerId),
          transactionType: 'credit_payment'
        }
      },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: '$amount' }
        }
      }
    ]);

    // Calculate correct values
    const totalPurchases = salesStats[0]?.totalPurchases || 0;
    const totalSpent = salesStats[0]?.totalSpent || 0;
    const lastPurchaseDate = salesStats[0]?.lastPurchaseDate || null;
    const totalCreditSales = creditStats[0]?.totalCreditSales || 0;
    const totalCreditPayments = creditPayments[0]?.totalPayments || 0;
    const creditBalance = Math.max(0, totalCreditSales - totalCreditPayments);

    // Update customer with correct values
    customer.totalPurchases = totalPurchases;
    customer.totalSpent = totalSpent;
    customer.lastPurchaseDate = lastPurchaseDate;
    customer.creditBalance = creditBalance;

    // Recalculate average order value
    if (totalPurchases > 0) {
      customer.averageOrderValue = totalSpent / totalPurchases;
    } else {
      customer.averageOrderValue = 0;
    }

    // Update credit status based on balance and limit
    if (customer.creditLimit === 0) {
      customer.creditStatus = customer.creditBalance > 0 ? 'warning' : 'good';
    } else {
      const utilization = customer.creditBalance / customer.creditLimit;
      if (customer.creditBalance > customer.creditLimit) {
        customer.creditStatus = 'blocked';
      } else if (utilization >= 0.9) {
        customer.creditStatus = 'warning';
      } else {
        customer.creditStatus = 'good';
      }
    }

    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Customer metrics recalculated successfully',
      data: {
        customerId: customer._id,
        name: customer.name,
        totalPurchases: customer.totalPurchases,
        totalSpent: customer.totalSpent,
        creditBalance: customer.creditBalance,
        averageOrderValue: customer.averageOrderValue,
        creditStatus: customer.creditStatus
      }
    });

  } catch (error) {
    console.error('Recalculate customer metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while recalculating customer metrics'
    });
  }
};

// @desc    Recalculate all customer metrics for the store
// @route   POST /api/store-manager/customers/recalculate-all-metrics
// @access  Private (Store Manager only)
const recalculateAllCustomerMetrics = async (req, res) => {
  const store = req.store;

  try {
    // Get all customers for this store
    const customers = await Customer.find({ store: store._id });

    let updatedCount = 0;
    let errors = [];

    for (const customer of customers) {
      try {
        // Get all sales for this customer
        const salesStats = await Sale.aggregate([
          {
            $match: {
              store: store._id,
              customer: customer._id,
              status: { $ne: 'cancelled' }
            }
          },
          {
            $group: {
              _id: null,
              totalPurchases: { $sum: 1 },
              totalSpent: { $sum: '$totalAmount' },
              lastPurchaseDate: { $max: '$createdAt' }
            }
          }
        ]);

        // Get credit balance from credit transactions
        const creditStats = await Sale.aggregate([
          {
            $match: {
              store: store._id,
              customer: customer._id,
              paymentMethod: 'credit',
              status: { $ne: 'cancelled' }
            }
          },
          {
            $group: {
              _id: null,
              totalCreditSales: { $sum: '$totalAmount' }
            }
          }
        ]);

        // Get credit payments
        const CreditTransaction = require('../models/CreditTransaction');
        const creditPayments = await CreditTransaction.aggregate([
          {
            $match: {
              store: store._id,
              customer: customer._id,
              transactionType: 'credit_payment'
            }
          },
          {
            $group: {
              _id: null,
              totalPayments: { $sum: '$amount' }
            }
          }
        ]);

        // Calculate correct values
        const totalPurchases = salesStats[0]?.totalPurchases || 0;
        const totalSpent = salesStats[0]?.totalSpent || 0;
        const lastPurchaseDate = salesStats[0]?.lastPurchaseDate || null;
        const totalCreditSales = creditStats[0]?.totalCreditSales || 0;
        const totalCreditPayments = creditPayments[0]?.totalPayments || 0;
        const creditBalance = Math.max(0, totalCreditSales - totalCreditPayments);

        // Update customer
        customer.totalPurchases = totalPurchases;
        customer.totalSpent = totalSpent;
        customer.lastPurchaseDate = lastPurchaseDate;
        customer.creditBalance = creditBalance;

        if (totalPurchases > 0) {
          customer.averageOrderValue = totalSpent / totalPurchases;
        } else {
          customer.averageOrderValue = 0;
        }

        // Update credit status
        if (customer.creditLimit === 0) {
          customer.creditStatus = customer.creditBalance > 0 ? 'warning' : 'good';
        } else {
          const utilization = customer.creditBalance / customer.creditLimit;
          if (customer.creditBalance > customer.creditLimit) {
            customer.creditStatus = 'blocked';
          } else if (utilization >= 0.9) {
            customer.creditStatus = 'warning';
          } else {
            customer.creditStatus = 'good';
          }
        }

        await customer.save();
        updatedCount++;

      } catch (customerError) {
        errors.push({
          customerId: customer._id,
          name: customer.name,
          error: customerError.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Customer metrics recalculated for ${updatedCount} customers`,
      data: {
        totalCustomers: customers.length,
        updatedCount,
        errorCount: errors.length,
        errors: errors.slice(0, 10) // Return first 10 errors only
      }
    });

  } catch (error) {
    console.error('Recalculate all customer metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while recalculating customer metrics'
    });
  }
};

module.exports = {
  getDashboardData,
  getStoreAnalytics,
  getInventory,
  exportInventory,
  getSales,
  createSale,
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerAnalytics,
  getCreditManagement,
  searchMasterMedicines,
  addCustomMedicine,
  updateMedicine,
  deleteMedicine,
  getMedicineDetails,
  getMedicineSalesHistory,
  getMedicinePurchaseHistory,
  recalculateCustomerMetrics,
  recalculateAllCustomerMetrics
};

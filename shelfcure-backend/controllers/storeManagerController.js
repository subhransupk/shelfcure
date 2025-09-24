const mongoose = require('mongoose');
const Store = require('../models/Store');
const User = require('../models/User');
const Medicine = require('../models/Medicine');
const MasterMedicine = require('../models/MasterMedicine');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Purchase = require('../models/Purchase');
const CreditTransaction = require('../models/CreditTransaction');

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
    const totalMedicines = await Medicine.countDocuments({ store: store._id });

    // Use aggregation to count low stock medicines with corrected logic
    const lowStockResult = await Medicine.aggregate([
      { $match: { store: store._id } },
      {
        $match: {
          $or: [
            // Both strip and individual enabled: Low stock based on STRIP STOCK ONLY
            {
              $and: [
                { 'unitTypes.hasStrips': true },
                { 'unitTypes.hasIndividual': true },
                { $expr: { $lte: ['$stripInfo.stock', '$stripInfo.minStock'] } }
              ]
            },
            // Only strips enabled
            {
              $and: [
                { 'unitTypes.hasStrips': true },
                { 'unitTypes.hasIndividual': { $ne: true } },
                { $expr: { $lte: ['$stripInfo.stock', '$stripInfo.minStock'] } }
              ]
            },
            // Only individual enabled
            {
              $and: [
                { 'unitTypes.hasIndividual': true },
                { 'unitTypes.hasStrips': { $ne: true } },
                { $expr: { $lte: ['$individualInfo.stock', '$individualInfo.minStock'] } }
              ]
            },
            // Legacy support - assume strips only
            {
              $and: [
                { 'unitTypes': { $exists: false } },
                { $expr: { $lte: ['$inventory.stripQuantity', '$inventory.stripMinimumStock'] } }
              ]
            }
          ]
        }
      },
      { $count: 'lowStockCount' }
    ]);

    const lowStockMedicines = lowStockResult.length > 0 ? lowStockResult[0].lowStockCount : 0;

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
      'batches.expiryDate': { $lte: thirtyDaysFromNow, $gte: new Date() }
    }).limit(10);

    // Get expiring medicines (next 7 days) - Critical
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const critical7Days = await Medicine.countDocuments({
      store: store._id,
      'batches.expiryDate': { $lte: sevenDaysFromNow, $gte: new Date() }
    });

    // Get expired medicines
    const expiredMedicines = await Medicine.countDocuments({
      store: store._id,
      'batches.expiryDate': { $lt: new Date() }
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

    // Get today's returns
    const todayReturns = await Sale.aggregate([
      {
        $match: {
          store: store._id,
          createdAt: { $gte: startOfDay },
          status: 'returned'
        }
      },
      {
        $group: {
          _id: null,
          totalReturns: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const todayReturnsAmount = todayReturns[0]?.totalReturns || 0;
    const pendingReturns = todayReturns[0]?.count || 0;

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

    // Calculate today's specific metrics
    const todayProfit = todayRevenue * 0.25; // Assuming 25% profit margin for today
    const todayLoss = todayReturnsAmount; // Returns are considered losses

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

    // Calculate comprehensive metrics
    const totalProfit = monthRevenue * 0.25; // Assuming 25% profit margin
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

    // Get inventory analytics
    const totalMedicines = await Medicine.countDocuments({ store: store._id, isActive: true });
    const lowStockMedicines = await Medicine.countDocuments({
      store: store._id,
      isActive: true,
      $expr: { $lte: ['$stock', '$minStock'] }
    });
    const outOfStockMedicines = await Medicine.countDocuments({
      store: store._id,
      isActive: true,
      stock: 0
    });

    // Get customer analytics
    const totalCustomers = await Customer.countDocuments({ store: store._id });
    const newCustomers = await Customer.countDocuments({
      store: store._id,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Get detailed low stock medicines for DataTable
    const lowStockMedicinesData = await Medicine.find({
      store: store._id,
      isActive: true,
      $expr: { $lte: ['$stock', '$minStock'] }
    }).select('name stock minStock category').limit(20);

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

    // Calculate hourly transaction pattern
    const hourlyPattern = Array(24).fill(0);
    sales.forEach(sale => {
      const hour = sale.createdAt.getHours();
      hourlyPattern[hour]++;
    });

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

    const categoryDistribution = Object.entries(categoryStats).map(([category, stats]) => ({
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
          salesGrowth
        },
        dailySales: dailySalesArray,
        topMedicines,
        inventory: {
          totalMedicines,
          lowStockMedicines,
          outOfStockMedicines,
          stockHealthPercentage: totalMedicines > 0 ? Math.round(((totalMedicines - lowStockMedicines) / totalMedicines) * 100) : 100,
          lowStockMedicinesData
        },
        customers: {
          totalCustomers,
          newCustomers,
          customerGrowth: totalCustomers > 0 ? Math.round((newCustomers / totalCustomers) * 100) : 0,
          topCustomers: topCustomersData
        },
        operations: {
          hourlyPattern,
          categoryDistribution
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
    let query = { store: store._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    let medicines;
    let total;

    if (stockStatus === 'low') {
      // Use aggregation for low stock filtering with corrected logic
      medicines = await Medicine.aggregate([
        { $match: query },
        {
          $match: {
            $or: [
              // Both strip and individual enabled: Low stock based on STRIP STOCK ONLY
              {
                $and: [
                  { 'unitTypes.hasStrips': true },
                  { 'unitTypes.hasIndividual': true },
                  { $expr: { $lte: ['$stripInfo.stock', '$stripInfo.minStock'] } }
                ]
              },
              // Only strips enabled
              {
                $and: [
                  { 'unitTypes.hasStrips': true },
                  { 'unitTypes.hasIndividual': { $ne: true } },
                  { $expr: { $lte: ['$stripInfo.stock', '$stripInfo.minStock'] } }
                ]
              },
              // Only individual enabled
              {
                $and: [
                  { 'unitTypes.hasIndividual': true },
                  { 'unitTypes.hasStrips': { $ne: true } },
                  { $expr: { $lte: ['$individualInfo.stock', '$individualInfo.minStock'] } }
                ]
              },
              // Legacy support - assume strips only
              {
                $and: [
                  { 'unitTypes': { $exists: false } },
                  { $expr: { $lte: ['$inventory.stripQuantity', '$inventory.stripMinimumStock'] } }
                ]
              }
            ]
          }
        },
        { $sort: { name: 1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit * 1 }
      ]);

      // Get total count for low stock medicines with corrected logic
      const totalResult = await Medicine.aggregate([
        { $match: query },
        {
          $match: {
            $or: [
              // Both strip and individual enabled: Low stock based on STRIP STOCK ONLY
              {
                $and: [
                  { 'unitTypes.hasStrips': true },
                  { 'unitTypes.hasIndividual': true },
                  { $expr: { $lte: ['$stripInfo.stock', '$stripInfo.minStock'] } }
                ]
              },
              // Only strips enabled
              {
                $and: [
                  { 'unitTypes.hasStrips': true },
                  { 'unitTypes.hasIndividual': { $ne: true } },
                  { $expr: { $lte: ['$stripInfo.stock', '$stripInfo.minStock'] } }
                ]
              },
              // Only individual enabled
              {
                $and: [
                  { 'unitTypes.hasIndividual': true },
                  { 'unitTypes.hasStrips': { $ne: true } },
                  { $expr: { $lte: ['$individualInfo.stock', '$individualInfo.minStock'] } }
                ]
              },
              // Legacy support - assume strips only
              {
                $and: [
                  { 'unitTypes': { $exists: false } },
                  { $expr: { $lte: ['$inventory.stripQuantity', '$inventory.stripMinimumStock'] } }
                ]
              }
            ]
          }
        },
        { $count: 'total' }
      ]);
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
      // Regular query for all other cases
      medicines = await Medicine.find(query)
        .sort({ name: 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      total = await Medicine.countDocuments(query);
    }

    res.status(200).json({
      success: true,
      count: medicines.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: medicines
    });
  } catch (error) {
    console.error('Inventory fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching inventory'
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
  const { page = 1, limit = 20, startDate, endDate, customer, status, search } = req.query;

  try {
    let query = { store: store._id };
    console.log('🔍 Fetching sales for store:', store._id);
    console.log('📋 Query parameters:', { page, limit, startDate, endDate, customer, status, search });

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
        store: store._id
      });

      if (!medicine) {
        return res.status(400).json({
          success: false,
          message: `Medicine not found: ${item.medicine}`
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

    // Update inventory with auto-conversion logic
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const medicine = await Medicine.findById(item.medicine);
      const unitsPerStrip = medicine.unitTypes?.unitsPerStrip || 10;

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
          processedBy: req.user.id
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
  const { page = 1, limit = 20, search } = req.query;

  try {
    let query = { store: store._id };

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

module.exports = {
  getDashboardData,
  getStoreAnalytics,
  getInventory,
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
  getMedicinePurchaseHistory
};

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Affiliate = require('../models/Affiliate');
const AffiliateCommission = require('../models/AffiliateCommission');
const AffiliateSettings = require('../models/AffiliateSettings');
const Store = require('../models/Store');
const CommissionService = require('../services/commissionService');

// @desc    Get all affiliates (Admin only)
// @route   GET /api/affiliates/admin
// @access  Private/Admin
router.get('/admin', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for affiliates, using mock data');

      const mockAffiliates = [
        {
          _id: '1',
          name: 'John Doe',
          email: 'john@affiliate.com',
          affiliateCode: 'AFF001',
          businessName: 'John\'s Marketing',
          status: 'active',
          commissionRate: 10,
          totalEarnings: 25000,
          totalReferrals: 15,
          createdBy: { name: 'Admin User' },
          createdAt: '2024-01-15'
        },
        {
          _id: '2',
          name: 'Jane Smith',
          email: 'jane@affiliate.com',
          affiliateCode: 'AFF002',
          businessName: 'Smith Promotions',
          status: 'active',
          commissionRate: 12,
          totalEarnings: 18000,
          totalReferrals: 12,
          createdBy: { name: 'Admin User' },
          createdAt: '2024-01-20'
        }
      ];

      return res.status(200).json({
        success: true,
        data: mockAffiliates,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: mockAffiliates.length,
          itemsPerPage: 10
        }
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { affiliateCode: searchRegex },
        { businessName: searchRegex }
      ];
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const affiliates = await Affiliate.find(query)
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Affiliate.countDocuments(query);

    res.status(200).json({
      success: true,
      data: affiliates,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get affiliates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching affiliates',
      error: error.message
    });
  }
});

// @desc    Export affiliates data (Admin only)
// @route   GET /api/affiliates/admin/export
// @access  Private/Admin
router.get('/admin/export', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { format = 'csv', status, dateFrom, dateTo } = req.query;

    // Build query
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const affiliates = await Affiliate.find(query)
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = [
        'Name', 'Email', 'Phone', 'Affiliate Code', 'Status',
        'Commission Rate', 'Total Earnings', 'Pending Earnings',
        'Total Referrals', 'Successful Referrals', 'Conversion Rate',
        'Created Date', 'Approved Date', 'Created By'
      ];

      const csvRows = affiliates.map(affiliate => [
        affiliate.name || '',
        affiliate.email || '',
        affiliate.phone || '',
        affiliate.affiliateCode || '',
        affiliate.status || '',
        `${affiliate.commission?.rate || 0}%`,
        affiliate.stats?.totalEarnings || 0,
        affiliate.stats?.pendingEarnings || 0,
        affiliate.stats?.totalReferrals || 0,
        affiliate.stats?.successfulReferrals || 0,
        `${affiliate.calculatedConversionRate || 0}%`,
        affiliate.createdAt ? new Date(affiliate.createdAt).toLocaleDateString() : '',
        affiliate.approvedAt ? new Date(affiliate.approvedAt).toLocaleDateString() : '',
        affiliate.createdBy?.name || ''
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="affiliates-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      // Return JSON
      res.status(200).json({
        success: true,
        data: affiliates,
        count: affiliates.length
      });
    }
  } catch (error) {
    console.error('Export affiliates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error exporting affiliates',
      error: error.message
    });
  }
});

// @desc    Get affiliate analytics/dashboard stats (Admin only)
// @route   GET /api/affiliates/admin/analytics
// @access  Private/Admin
router.get('/admin/analytics', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for affiliate analytics, using mock data');

      const mockAnalytics = {
        totalAffiliates: 25,
        activeAffiliates: 21,
        pendingAffiliates: 4,
        totalStores: 42,
        totalCommissions: 45,
        totalCommissionAmount: 125000,
        pendingCommissions: 12,
        pendingCommissionAmount: 35000,
        paidCommissions: 28,
        paidCommissionAmount: 75000,
        averageCommissionRate: 11.5,
        topPerformers: [
          { name: 'John Doe', totalEarnings: 25000, referrals: 15 },
          { name: 'Jane Smith', totalEarnings: 18000, referrals: 12 },
          { name: 'Mike Johnson', totalEarnings: 15000, referrals: 10 }
        ],
        recentActivity: [
          { type: 'new_affiliate', message: 'New affiliate registered: Sarah Wilson', date: new Date() },
          { type: 'commission_earned', message: 'Commission earned: ₹2,500 by John Doe', date: new Date(Date.now() - 3600000) }
        ]
      };

      return res.status(200).json({
        success: true,
        data: mockAnalytics
      });
    }

    const { period = 'thisMonth' } = req.query;

    // Calculate date range based on period
    let startDate, endDate = new Date();
    const now = new Date();

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'thisWeek':
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get affiliate stats
    const [
      totalAffiliates,
      activeAffiliates,
      pendingAffiliates,
      totalStores,
      totalCommissions,
      paidCommissions,
      pendingCommissions,
      topPerformers
    ] = await Promise.all([
      Affiliate.countDocuments(),
      Affiliate.countDocuments({ status: 'active' }),
      Affiliate.countDocuments({ status: 'pending_approval' }),
      Store.countDocuments({ 'affiliate.affiliateId': { $exists: true } }),
      AffiliateCommission.aggregate([
        { $match: { earnedDate: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' }, count: { $sum: 1 } } }
      ]),
      AffiliateCommission.aggregate([
        { $match: { paymentStatus: 'paid', earnedDate: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' }, count: { $sum: 1 } } }
      ]),
      AffiliateCommission.aggregate([
        { $match: { status: 'pending', earnedDate: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$commissionAmount' }, count: { $sum: 1 } } }
      ]),
      Affiliate.find({ status: 'active' })
        .sort({ 'stats.totalEarnings': -1 })
        .limit(5)
        .select('name email affiliateCode stats')
    ]);

    // Get monthly trend data
    const monthlyTrend = await AffiliateCommission.aggregate([
      {
        $match: {
          earnedDate: { $gte: new Date(now.getFullYear(), 0, 1) } // This year
        }
      },
      {
        $group: {
          _id: { month: { $month: '$earnedDate' }, year: { $year: '$earnedDate' } },
          totalCommissions: { $sum: '$commissionAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalAffiliates,
          activeAffiliates,
          pendingAffiliates,
          totalStores,
          totalCommissions: totalCommissions[0]?.total || 0,
          totalCommissionCount: totalCommissions[0]?.count || 0,
          paidCommissions: paidCommissions[0]?.total || 0,
          paidCommissionCount: paidCommissions[0]?.count || 0,
          pendingCommissions: pendingCommissions[0]?.total || 0,
          pendingCommissionCount: pendingCommissions[0]?.count || 0
        },
        topPerformers,
        monthlyTrend,
        period
      }
    });
  } catch (error) {
    console.error('Get affiliate analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching affiliate analytics',
      error: error.message
    });
  }
});

// @desc    Get affiliate commissions (Admin only)
// @route   GET /api/affiliates/admin/commissions
// @access  Private/Admin
router.get('/admin/commissions', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for affiliate commissions, using mock data');

      const mockCommissions = [
        {
          _id: '1',
          affiliate: { name: 'John Doe', email: 'john@affiliate.com', affiliateCode: 'AFF001' },
          store: { name: 'City Pharmacy' },
          amount: 2500,
          status: 'approved',
          paymentStatus: 'pending',
          earnedDate: new Date(),
          description: 'Commission for store subscription'
        },
        {
          _id: '2',
          affiliate: { name: 'Jane Smith', email: 'jane@affiliate.com', affiliateCode: 'AFF002' },
          store: { name: 'HealthMart Plus' },
          amount: 1800,
          status: 'approved',
          paymentStatus: 'paid',
          earnedDate: new Date(Date.now() - 86400000),
          description: 'Commission for store subscription'
        }
      ];

      return res.status(200).json({
        success: true,
        data: mockCommissions,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: mockCommissions.length,
          itemsPerPage: 10
        }
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};

    if (req.query.affiliate) {
      query.affiliate = req.query.affiliate;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.paymentStatus) {
      query.paymentStatus = req.query.paymentStatus;
    }

    const commissions = await AffiliateCommission.find(query)
      .populate('affiliate', 'name email affiliateCode')
      .populate('store', 'name')
      .sort({ earnedDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AffiliateCommission.countDocuments(query);

    res.status(200).json({
      success: true,
      data: commissions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get affiliate commissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching affiliate commissions',
      error: error.message
    });
  }
});

// @desc    Get affiliate settings
// @route   GET /api/affiliates/admin/settings
// @access  Private/Admin
router.get('/admin/settings', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for affiliate settings, using mock data');

      const mockSettings = {
        enableAffiliateProgram: true,
        autoApproveAffiliates: false,
        cookieDuration: 30,
        defaultCommissionType: 'percentage',
        defaultCommissionRate: 10,
        minimumPayoutAmount: 1000,
        payoutSchedule: 'monthly',
        requireTaxInfo: true,
        allowCustomCommissionRates: true,
        maxCommissionRate: 25,
        affiliateTermsUrl: 'https://shelfcure.com/affiliate-terms',
        supportEmail: 'affiliate-support@shelfcure.com'
      };

      return res.status(200).json({
        success: true,
        data: mockSettings
      });
    }

    const settings = await AffiliateSettings.getSettings();

    res.status(200).json({
      success: true,
      data: settings.toClientFormat()
    });
  } catch (error) {
    console.error('Get affiliate settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching affiliate settings',
      error: error.message
    });
  }
});

// @desc    Update affiliate settings
// @route   PUT /api/affiliates/admin/settings
// @access  Private/Admin
router.put('/admin/settings', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const {
      enableAffiliateProgram,
      autoApproveAffiliates,
      cookieDuration,
      defaultCommissionType,
      defaultCommissionRate,
      minimumPayoutAmount,
      payoutSchedule,
      paymentMethods,
      emailNotifications,
      affiliateTerms
    } = req.body;

    // Validate required fields
    if (typeof enableAffiliateProgram !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'enableAffiliateProgram must be a boolean'
      });
    }

    if (typeof autoApproveAffiliates !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'autoApproveAffiliates must be a boolean'
      });
    }

    if (!cookieDuration || cookieDuration < 1 || cookieDuration > 365) {
      return res.status(400).json({
        success: false,
        message: 'cookieDuration must be between 1 and 365 days'
      });
    }

    if (!['percentage', 'fixed'].includes(defaultCommissionType)) {
      return res.status(400).json({
        success: false,
        message: 'defaultCommissionType must be either "percentage" or "fixed"'
      });
    }

    if (!defaultCommissionRate || defaultCommissionRate < 0) {
      return res.status(400).json({
        success: false,
        message: 'defaultCommissionRate must be a positive number'
      });
    }

    if (defaultCommissionType === 'percentage' && defaultCommissionRate > 100) {
      return res.status(400).json({
        success: false,
        message: 'Percentage commission rate cannot exceed 100%'
      });
    }

    if (!minimumPayoutAmount || minimumPayoutAmount < 100) {
      return res.status(400).json({
        success: false,
        message: 'minimumPayoutAmount must be at least 100'
      });
    }

    if (!['weekly', 'monthly', 'quarterly'].includes(payoutSchedule)) {
      return res.status(400).json({
        success: false,
        message: 'payoutSchedule must be "weekly", "monthly", or "quarterly"'
      });
    }

    // Validate payment methods
    if (!paymentMethods || typeof paymentMethods !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'paymentMethods must be an object'
      });
    }

    const hasEnabledPaymentMethod = paymentMethods.bankTransfer || paymentMethods.upi || paymentMethods.paypal;
    if (!hasEnabledPaymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'At least one payment method must be enabled'
      });
    }

    // Validate email notifications
    if (!emailNotifications || typeof emailNotifications !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'emailNotifications must be an object'
      });
    }

    if (!affiliateTerms || affiliateTerms.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'affiliateTerms must be at least 50 characters long'
      });
    }

    // Update settings
    const updatedSettings = await AffiliateSettings.updateSettings({
      enableAffiliateProgram,
      autoApproveAffiliates,
      cookieDuration: parseInt(cookieDuration),
      defaultCommissionType,
      defaultCommissionRate: parseFloat(defaultCommissionRate),
      minimumPayoutAmount: parseInt(minimumPayoutAmount),
      payoutSchedule,
      paymentMethods: {
        bankTransfer: Boolean(paymentMethods.bankTransfer),
        upi: Boolean(paymentMethods.upi),
        paypal: Boolean(paymentMethods.paypal)
      },
      emailNotifications: {
        welcomeEmail: Boolean(emailNotifications.welcomeEmail),
        approvalEmail: Boolean(emailNotifications.approvalEmail),
        commissionEmail: Boolean(emailNotifications.commissionEmail),
        payoutEmail: Boolean(emailNotifications.payoutEmail)
      },
      affiliateTerms: affiliateTerms.trim()
    }, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Affiliate settings updated successfully',
      data: updatedSettings.toClientFormat()
    });
  } catch (error) {
    console.error('Update affiliate settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating affiliate settings',
      error: error.message
    });
  }
});

// @desc    Get affiliate by ID (Admin only)
// @route   GET /api/affiliates/admin/:id
// @access  Private/Admin
router.get('/admin/:id', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate not found'
      });
    }

    res.status(200).json({
      success: true,
      data: affiliate
    });
  } catch (error) {
    console.error('Get affiliate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching affiliate',
      error: error.message
    });
  }
});

// @desc    Create affiliate (Admin only)
// @route   POST /api/affiliates/admin
// @access  Private/Admin
router.post('/admin', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const affiliateData = {
      ...req.body,
      createdBy: req.user.id,
      status: 'active' // Admin created affiliates are auto-approved
    };

    const affiliate = await Affiliate.create(affiliateData);
    await affiliate.populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Affiliate created successfully',
      data: affiliate
    });
  } catch (error) {
    console.error('Create affiliate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating affiliate',
      error: error.message
    });
  }
});

// @desc    Update affiliate (Admin only)
// @route   PUT /api/affiliates/admin/:id
// @access  Private/Admin
router.put('/admin/:id', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.params.id);

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        if (key === 'address' && typeof req.body[key] === 'object') {
          // Handle nested address object
          affiliate.address = {
            ...affiliate.address,
            ...req.body[key]
          };
        } else if (key === 'commission' && typeof req.body[key] === 'object') {
          // Handle nested commission object
          affiliate.commission = {
            ...affiliate.commission,
            ...req.body[key]
          };
        } else {
          affiliate[key] = req.body[key];
        }
      }
    });

    affiliate.updatedBy = req.user.id;
    await affiliate.save();

    await affiliate.populate('updatedBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Affiliate updated successfully',
      data: affiliate
    });
  } catch (error) {
    console.error('Update affiliate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating affiliate',
      error: error.message
    });
  }
});

// @desc    Approve affiliate (Admin only)
// @route   PUT /api/affiliates/admin/:id/approve
// @access  Private/Admin
router.put('/admin/:id/approve', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.params.id);

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate not found'
      });
    }

    affiliate.status = 'active';
    affiliate.approvedBy = req.user.id;
    affiliate.approvedAt = new Date();
    
    await affiliate.save();
    await affiliate.populate('approvedBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Affiliate approved successfully',
      data: affiliate
    });
  } catch (error) {
    console.error('Approve affiliate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error approving affiliate',
      error: error.message
    });
  }
});



// @desc    Get commission summary (Admin only)
// @route   GET /api/affiliates/admin/commissions/summary
// @access  Private/Admin
router.get('/admin/commissions/summary', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for commission summary, using mock data');

      const mockSummary = {
        totalCommissions: 45,
        totalAmount: 125000,
        pendingCommissions: 12,
        pendingAmount: 35000,
        approvedCommissions: 28,
        approvedAmount: 75000,
        paidCommissions: 5,
        paidAmount: 15000,
        averageCommission: 2777.78,
        topAffiliates: [
          { name: 'John Doe', totalEarned: 25000, commissionCount: 8 },
          { name: 'Jane Smith', totalEarned: 18000, commissionCount: 6 },
          { name: 'Mike Johnson', totalEarned: 15000, commissionCount: 5 }
        ]
      };

      return res.status(200).json({
        success: true,
        data: mockSummary
      });
    }

    const filters = {
      affiliateId: req.query.affiliate,
      storeId: req.query.store,
      status: req.query.status,
      paymentStatus: req.query.paymentStatus,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const summary = await CommissionService.getCommissionSummary(filters);

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get commission summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching commission summary',
      error: error.message
    });
  }
});

// @desc    Get commission by ID (Admin only)
// @route   GET /api/affiliates/admin/commissions/:id
// @access  Private/Admin
router.get('/admin/commissions/:id', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const commission = await AffiliateCommission.findById(req.params.id)
      .populate('affiliate', 'name email affiliateCode')
      .populate('store', 'name code')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Commission not found'
      });
    }

    res.status(200).json({
      success: true,
      data: commission
    });
  } catch (error) {
    console.error('Get commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching commission',
      error: error.message
    });
  }
});

// @desc    Approve commission (Admin only)
// @route   PUT /api/affiliates/admin/commissions/:id/approve
// @access  Private/Admin
router.put('/admin/commissions/:id/approve', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const commission = await AffiliateCommission.findById(req.params.id);

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Commission not found'
      });
    }

    if (commission.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Commission is already approved'
      });
    }

    commission.status = 'approved';
    commission.approvedBy = req.user.id;
    commission.approvedAt = new Date();
    if (req.body.notes) {
      commission.notes = req.body.notes;
    }

    await commission.save();

    // Update affiliate stats
    await CommissionService.updateAffiliateStats(commission.affiliate);

    await commission.populate('affiliate', 'name email affiliateCode');
    await commission.populate('store', 'name code');
    await commission.populate('approvedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Commission approved successfully',
      data: commission
    });
  } catch (error) {
    console.error('Approve commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error approving commission',
      error: error.message
    });
  }
});

// @desc    Bulk approve commissions (Admin only)
// @route   POST /api/affiliates/admin/commissions/bulk-approve
// @access  Private/Admin
router.post('/admin/commissions/bulk-approve', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { commissionIds, notes } = req.body;

    if (!commissionIds || !Array.isArray(commissionIds) || commissionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Commission IDs are required'
      });
    }

    const commissions = await AffiliateCommission.find({
      _id: { $in: commissionIds },
      status: 'pending'
    });

    const results = [];
    for (const commission of commissions) {
      commission.status = 'approved';
      commission.approvedBy = req.user.id;
      commission.approvedAt = new Date();
      if (notes) {
        commission.notes = notes;
      }
      await commission.save();

      // Update affiliate stats
      await CommissionService.updateAffiliateStats(commission.affiliate);

      results.push({
        commissionId: commission._id,
        status: 'approved'
      });
    }

    res.status(200).json({
      success: true,
      message: `${results.length} commissions approved successfully`,
      data: results
    });
  } catch (error) {
    console.error('Bulk approve commissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error bulk approving commissions',
      error: error.message
    });
  }
});



// @desc    Bulk actions on affiliates (Admin only)
// @route   POST /api/affiliates/admin/bulk-action
// @access  Private/Admin
router.post('/admin/bulk-action', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { action, affiliateIds, data } = req.body;

    if (!action || !affiliateIds || !Array.isArray(affiliateIds)) {
      return res.status(400).json({
        success: false,
        message: 'Action and affiliate IDs are required'
      });
    }

    let result;
    switch (action) {
      case 'approve':
        result = await Affiliate.updateMany(
          { _id: { $in: affiliateIds } },
          {
            status: 'active',
            approvedBy: req.user.id,
            approvedAt: new Date()
          }
        );
        break;

      case 'suspend':
        result = await Affiliate.updateMany(
          { _id: { $in: affiliateIds } },
          {
            status: 'suspended',
            updatedBy: req.user.id
          }
        );
        break;

      case 'activate':
        result = await Affiliate.updateMany(
          { _id: { $in: affiliateIds } },
          {
            status: 'active',
            updatedBy: req.user.id
          }
        );
        break;

      case 'updateCommission':
        if (!data.commissionRate) {
          return res.status(400).json({
            success: false,
            message: 'Commission rate is required for update commission action'
          });
        }
        result = await Affiliate.updateMany(
          { _id: { $in: affiliateIds } },
          {
            'commission.rate': data.commissionRate,
            updatedBy: req.user.id
          }
        );
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    res.status(200).json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      }
    });
  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error performing bulk action',
      error: error.message
    });
  }
});

// @desc    Process commission payments (Admin only)
// @route   POST /api/affiliates/admin/commissions/pay
// @access  Private/Admin
router.post('/admin/commissions/pay', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { commissionIds, paymentData } = req.body;

    if (!commissionIds || !Array.isArray(commissionIds) || commissionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Commission IDs are required'
      });
    }

    if (!paymentData || !paymentData.method) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    const results = await CommissionService.processCommissionPayments(commissionIds, paymentData);

    res.status(200).json({
      success: true,
      message: 'Commission payments processed successfully',
      data: results
    });
  } catch (error) {
    console.error('Process commission payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing commission payments',
      error: error.message
    });
  }
});

// @desc    Export commissions (Admin only)
// @route   GET /api/affiliates/admin/commissions/export
// @access  Private/Admin
router.get('/admin/commissions/export', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { format = 'csv' } = req.query;

    let query = {};

    if (req.query.affiliate) {
      query.affiliate = req.query.affiliate;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.paymentStatus) {
      query.paymentStatus = req.query.paymentStatus;
    }

    if (req.query.dateFrom || req.query.dateTo) {
      query.earnedDate = {};
      if (req.query.dateFrom) query.earnedDate.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) query.earnedDate.$lte = new Date(req.query.dateTo);
    }

    const commissions = await AffiliateCommission.find(query)
      .populate('affiliate', 'name email affiliateCode')
      .populate('store', 'name code')
      .sort({ earnedDate: -1 });

    if (format === 'csv') {
      const csvData = commissions.map(commission => ({
        'Commission ID': commission._id,
        'Affiliate Name': commission.affiliate?.name || 'N/A',
        'Affiliate Code': commission.affiliate?.affiliateCode || 'N/A',
        'Store Name': commission.store?.name || 'N/A',
        'Store Code': commission.store?.code || 'N/A',
        'Type': commission.type,
        'Period': commission.formattedPeriod,
        'Base Amount': commission.baseAmount,
        'Commission Rate': commission.commissionRate,
        'Commission Amount': commission.commissionAmount,
        'Status': commission.status,
        'Payment Status': commission.paymentStatus,
        'Earned Date': commission.earnedDate?.toISOString().split('T')[0] || 'N/A',
        'Due Date': commission.dueDate?.toISOString().split('T')[0] || 'N/A',
        'Paid Date': commission.paidDate?.toISOString().split('T')[0] || 'N/A',
        'Payment Method': commission.payment?.method || 'N/A',
        'Transaction ID': commission.payment?.transactionId || 'N/A',
        'Notes': commission.notes || 'N/A'
      }));

      const csv = require('csv-stringify/sync');
      const csvString = csv.stringify(csvData, { header: true });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=commissions-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvString);
    } else {
      res.status(200).json({
        success: true,
        data: commissions
      });
    }
  } catch (error) {
    console.error('Export commissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error exporting commissions',
      error: error.message
    });
  }
});

// @desc    Get commission payment history (Admin only)
// @route   GET /api/affiliates/admin/commissions/:id/payments
// @access  Private/Admin
router.get('/admin/commissions/:id/payments', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const commission = await AffiliateCommission.findById(req.params.id)
      .populate('affiliate', 'name email affiliateCode')
      .populate('store', 'name code');

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Commission not found'
      });
    }

    // Get payment history (for now, just return the current payment info)
    const paymentHistory = [];
    if (commission.payment && commission.paymentStatus === 'paid') {
      paymentHistory.push({
        id: commission._id,
        amount: commission.payment.paidAmount || commission.commissionAmount,
        method: commission.payment.method,
        transactionId: commission.payment.transactionId,
        paidDate: commission.payment.paidDate || commission.paidDate,
        processingFee: commission.payment.processingFee || 0,
        netAmount: commission.payment.netAmount || commission.commissionAmount,
        notes: commission.payment.notes,
        status: 'completed'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        commission,
        paymentHistory
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching payment history',
      error: error.message
    });
  }
});

// @desc    Create manual commission (Admin only)
// @route   POST /api/affiliates/admin/commissions/manual
// @access  Private/Admin
router.post('/admin/commissions/manual', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const {
      affiliateId,
      storeId,
      type = 'bonus',
      baseAmount,
      commissionAmount,
      description,
      dueDate
    } = req.body;

    if (!affiliateId || !storeId || !commissionAmount) {
      return res.status(400).json({
        success: false,
        message: 'Affiliate ID, Store ID, and commission amount are required'
      });
    }

    // Verify affiliate and store exist
    const [affiliate, store] = await Promise.all([
      Affiliate.findById(affiliateId),
      Store.findById(storeId)
    ]);

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate not found'
      });
    }

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Create manual commission
    const commission = await AffiliateCommission.create({
      affiliate: affiliateId,
      store: storeId,
      type,
      period: {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      },
      baseAmount: baseAmount || commissionAmount,
      commissionRate: 0, // Manual commission
      commissionAmount,
      status: 'approved', // Manual commissions are auto-approved
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: description || 'Manual commission',
      createdBy: req.user.id
    });

    // Update affiliate stats
    await CommissionService.updateAffiliateStats(affiliateId);

    await commission.populate('affiliate', 'name email affiliateCode');
    await commission.populate('store', 'name code');

    res.status(201).json({
      success: true,
      message: 'Manual commission created successfully',
      data: commission
    });
  } catch (error) {
    console.error('Create manual commission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating manual commission',
      error: error.message
    });
  }
});

module.exports = router;

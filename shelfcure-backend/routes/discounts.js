const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Discount = require('../models/Discount');

// @desc    Get all discounts (Admin only)
// @route   GET /api/discounts/admin
// @access  Private/Admin
router.get('/admin', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for discounts, using mock data');

      const mockDiscounts = [
        {
          _id: '1',
          name: 'New Year Special',
          code: 'NEWYEAR2024',
          description: 'Special discount for new year subscribers',
          type: 'percentage',
          value: 20,
          isActive: true,
          validFrom: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
          validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days from now
          usageLimit: 100,
          usedCount: 25,
          minOrderAmount: 999,
          maxDiscountAmount: 500,
          applicablePlans: ['basic', 'premium'],
          createdBy: { name: 'System Admin' },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
        },
        {
          _id: '2',
          name: 'First Time User',
          code: 'WELCOME10',
          description: 'Welcome discount for first-time users',
          type: 'percentage',
          value: 10,
          isActive: true,
          validFrom: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60), // 60 days ago
          validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60), // 60 days from now
          usageLimit: 500,
          usedCount: 150,
          minOrderAmount: 500,
          maxDiscountAmount: 200,
          applicablePlans: ['basic', 'premium', 'enterprise'],
          createdBy: { name: 'System Admin' },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60)
        }
      ];

      return res.status(200).json({
        success: true,
        data: mockDiscounts,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          total: mockDiscounts.length,
          limit: 10
        },
        stats: {
          totalDiscounts: mockDiscounts.length,
          activeDiscounts: mockDiscounts.filter(d => d.isActive).length,
          inactiveDiscounts: mockDiscounts.filter(d => !d.isActive).length,
          totalUsage: mockDiscounts.reduce((sum, d) => sum + d.usedCount, 0)
        }
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { description: searchRegex }
      ];
    }
    
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }
    
    if (req.query.type) {
      query.type = req.query.type;
    }

    const discounts = await Discount.find(query)
      .populate('createdBy', 'name')
      .populate('applicablePlans', 'name planType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log('Raw discounts from database:', discounts.map(d => ({
      _id: d._id,
      code: d.code,
      name: d.name,
      idType: typeof d._id,
      idLength: d._id?.toString().length
    })));

    // Filter out any discounts with invalid _id fields (safety check)
    const validDiscounts = discounts.filter(discount => {
      const isValidId = discount._id &&
                       discount._id.toString().length === 24 &&
                       /^[0-9a-fA-F]{24}$/.test(discount._id.toString());
      if (!isValidId) {
        console.warn('Invalid discount found in database:', {
          _id: discount._id,
          code: discount.code,
          name: discount.name,
          idType: typeof discount._id,
          idLength: discount._id?.toString().length
        });
      }
      return isValidId;
    });

    console.log('Valid discounts after filtering:', validDiscounts.map(d => ({
      _id: d._id,
      code: d.code,
      name: d.name
    })));

    const total = await Discount.countDocuments(query);

    res.status(200).json({
      success: true,
      data: validDiscounts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get discounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching discounts',
      error: error.message
    });
  }
});

// @desc    Create discount (Admin only)
// @route   POST /api/discounts/admin
// @access  Private/Admin
router.post('/admin', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const discountData = {
      ...req.body,
      createdBy: req.user.id
    };

    const discount = await Discount.create(discountData);
    await discount.populate('createdBy', 'name');
    await discount.populate('applicablePlans', 'name planType');

    res.status(201).json({
      success: true,
      message: 'Discount created successfully',
      data: discount
    });
  } catch (error) {
    console.error('Create discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating discount',
      error: error.message
    });
  }
});

// @desc    Update discount (Admin only)
// @route   PUT /api/discounts/admin/:id
// @access  Private/Admin
router.put('/admin/:id', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Discount not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        discount[key] = req.body[key];
      }
    });

    discount.updatedBy = req.user.id;
    await discount.save();

    await discount.populate('updatedBy', 'name');
    await discount.populate('applicablePlans', 'name planType');

    res.status(200).json({
      success: true,
      message: 'Discount updated successfully',
      data: discount
    });
  } catch (error) {
    console.error('Update discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating discount',
      error: error.message
    });
  }
});

// @desc    Delete discount (Admin only)
// @route   DELETE /api/discounts/admin/:id
// @access  Private/Admin
router.delete('/admin/:id', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Discount not found'
      });
    }

    await Discount.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Discount deleted successfully'
    });
  } catch (error) {
    console.error('Delete discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting discount',
      error: error.message
    });
  }
});

// @desc    Get discount by ID (Admin only)
// @route   GET /api/discounts/admin/:id
// @access  Private/Admin
router.get('/admin/:id', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('applicablePlans', 'name planType pricing');

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Discount not found'
      });
    }

    res.status(200).json({
      success: true,
      data: discount
    });
  } catch (error) {
    console.error('Get discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching discount',
      error: error.message
    });
  }
});

// @desc    Validate discount code
// @route   POST /api/discounts/validate
// @access  Public
router.post('/validate', async (req, res) => {
  try {
    const { code, customerId, orderAmount } = req.body;

    const discount = await Discount.findOne({ 
      code: code.toUpperCase(),
      isActive: true 
    });

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Invalid discount code'
      });
    }

    // Check if discount is currently valid
    if (!discount.isCurrentlyValid) {
      return res.status(400).json({
        success: false,
        message: 'Discount code has expired or is not yet active'
      });
    }

    // Check if customer can use this discount
    if (customerId && !discount.canBeUsedBy(customerId, orderAmount)) {
      return res.status(400).json({
        success: false,
        message: 'You are not eligible to use this discount code'
      });
    }

    // Calculate discount amount
    const discountAmount = discount.calculateDiscount(orderAmount || 0);

    res.status(200).json({
      success: true,
      data: {
        discount,
        discountAmount,
        finalAmount: Math.max(0, (orderAmount || 0) - discountAmount)
      }
    });
  } catch (error) {
    console.error('Validate discount error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error validating discount',
      error: error.message
    });
  }
});

module.exports = router;

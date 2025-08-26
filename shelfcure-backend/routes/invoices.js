const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const Store = require('../models/Store');

// @desc    Get all invoices (Admin only)
// @route   GET /api/invoices/admin
// @access  Private/Admin
router.get('/admin', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for invoices, using mock data');

      const mockInvoices = [
        {
          _id: '1',
          invoiceNumber: 'INV-2024-001',
          customer: {
            name: 'City Pharmacy',
            email: 'contact@citypharmacy.com',
            store: {
              _id: 'store1',
              name: 'City Pharmacy',
              code: 'CP001'
            }
          },
          type: 'subscription',
          status: 'sent',
          invoiceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25), // 25 days from now
          amount: {
            subtotal: 2999,
            tax: 539.82,
            total: 3538.82
          },
          payment: {
            status: 'paid',
            method: 'razorpay',
            paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)
          },
          items: [
            {
              description: 'Premium Plan - Monthly Subscription',
              quantity: 1,
              unitPrice: 2999,
              total: 2999
            }
          ],
          createdBy: { name: 'System Admin' },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5)
        },
        {
          _id: '2',
          invoiceNumber: 'INV-2024-002',
          customer: {
            name: 'Health Plus Pharmacy',
            email: 'admin@healthplus.com',
            store: {
              _id: 'store2',
              name: 'Health Plus Pharmacy',
              code: 'HP001'
            }
          },
          type: 'subscription',
          status: 'pending',
          invoiceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 28), // 28 days from now
          amount: {
            subtotal: 999,
            tax: 179.82,
            total: 1178.82
          },
          payment: {
            status: 'pending',
            method: null,
            paidAt: null
          },
          items: [
            {
              description: 'Basic Plan - Monthly Subscription',
              quantity: 1,
              unitPrice: 999,
              total: 999
            }
          ],
          createdBy: { name: 'System Admin' },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
        }
      ];

      return res.status(200).json({
        success: true,
        data: mockInvoices,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          total: mockInvoices.length,
          limit: 10
        },
        stats: {
          totalInvoices: mockInvoices.length,
          paidInvoices: mockInvoices.filter(inv => inv.payment.status === 'paid').length,
          pendingInvoices: mockInvoices.filter(inv => inv.payment.status === 'pending').length,
          overdueInvoices: 0,
          totalRevenue: mockInvoices.reduce((sum, inv) => sum + (inv.payment.status === 'paid' ? inv.amount.total : 0), 0)
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
        { invoiceNumber: searchRegex },
        { 'customer.name': searchRegex },
        { 'customer.email': searchRegex }
      ];
    }
    
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.paymentStatus) {
      query['payment.status'] = req.query.paymentStatus;
    }
    
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      query.invoiceDate = {};
      if (req.query.startDate) {
        query.invoiceDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.invoiceDate.$lte = new Date(req.query.endDate);
      }
    }

    const invoices = await Invoice.find(query)
      .populate('customer.store', 'name code')
      .populate('createdBy', 'name')
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Invoice.countDocuments(query);

    // Get summary stats
    const stats = await Invoice.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amounts.total' },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ['$payment.status', 'paid'] }, '$amounts.total', 0]
            }
          },
          pendingAmount: {
            $sum: {
              $cond: [{ $ne: ['$payment.status', 'paid'] }, '$amounts.total', 0]
            }
          },
          overdueCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$dueDate', new Date()] },
                    { $ne: ['$payment.status', 'paid'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: invoices,
      stats: stats[0] || { totalAmount: 0, paidAmount: 0, pendingAmount: 0, overdueCount: 0 },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching invoices',
      error: error.message
    });
  }
});

// @desc    Create invoice (Admin only)
// @route   POST /api/invoices/admin
// @access  Private/Admin
router.post('/admin', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const invoiceData = {
      ...req.body,
      createdBy: req.user.id
    };

    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;

    if (invoiceData.items && invoiceData.items.length > 0) {
      invoiceData.items.forEach(item => {
        item.totalPrice = item.quantity * item.unitPrice;
        item.taxAmount = (item.totalPrice * item.taxRate) / 100;
        subtotal += item.totalPrice;
        totalTax += item.taxAmount;
      });
    }

    invoiceData.amounts = {
      subtotal,
      taxAmount: totalTax,
      discountAmount: invoiceData.amounts?.discountAmount || 0,
      total: subtotal + totalTax - (invoiceData.amounts?.discountAmount || 0),
      currency: invoiceData.amounts?.currency || 'INR'
    };

    const invoice = await Invoice.create(invoiceData);
    await invoice.populate('customer.store', 'name code');
    await invoice.populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating invoice',
      error: error.message
    });
  }
});

// @desc    Update invoice (Admin only)
// @route   PUT /api/invoices/admin/:id
// @access  Private/Admin
router.put('/admin/:id', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        invoice[key] = req.body[key];
      }
    });

    invoice.updatedBy = req.user.id;
    await invoice.save();

    await invoice.populate('customer.store', 'name code');
    await invoice.populate('updatedBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating invoice',
      error: error.message
    });
  }
});

// @desc    Mark invoice as paid (Admin only)
// @route   PUT /api/invoices/admin/:id/mark-paid
// @access  Private/Admin
router.put('/admin/:id/mark-paid', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    invoice.payment.status = 'paid';
    invoice.payment.paidAmount = req.body.paidAmount || invoice.amounts.total;
    invoice.payment.paidDate = new Date();
    invoice.payment.method = req.body.paymentMethod;
    invoice.payment.transactionId = req.body.transactionId;
    invoice.payment.notes = req.body.notes;
    invoice.status = 'paid';

    await invoice.save();

    res.status(200).json({
      success: true,
      message: 'Invoice marked as paid successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Mark invoice paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking invoice as paid',
      error: error.message
    });
  }
});

// @desc    Get invoice by ID (Admin only)
// @route   GET /api/invoices/admin/:id
// @access  Private/Admin
router.get('/admin/:id', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer.store', 'name code contact address')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching invoice',
      error: error.message
    });
  }
});

// @desc    Delete invoice (Admin only)
// @route   DELETE /api/invoices/admin/:id
// @access  Private/Admin
router.delete('/admin/:id', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    await Invoice.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting invoice',
      error: error.message
    });
  }
});

module.exports = router;

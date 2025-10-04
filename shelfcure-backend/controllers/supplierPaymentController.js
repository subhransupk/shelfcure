const Supplier = require('../models/Supplier');
const SupplierTransaction = require('../models/SupplierTransaction');
const { validationResult } = require('express-validator');

// @desc    Record a payment to supplier
// @route   POST /api/store-manager/suppliers/:supplierId/payment
// @access  Private (Store Manager only)
const recordSupplierPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const store = req.store;
    const { supplierId } = req.params;
    const { 
      amount, 
      paymentMethod, 
      transactionId, 
      checkNumber,
      bankDetails,
      notes 
    } = req.body;

    // Verify supplier belongs to store
    const supplier = await Supplier.findOne({
      _id: supplierId,
      store: store._id
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Validate payment amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than 0'
      });
    }

    if (amount > supplier.outstandingBalance) {
      return res.status(400).json({
        success: false,
        message: `Payment amount cannot exceed outstanding balance of ₹${supplier.outstandingBalance}`
      });
    }

    // Create supplier payment transaction
    const mongoose = require('mongoose');
    const paymentId = new mongoose.Types.ObjectId();

    const transaction = await SupplierTransaction.createTransaction({
      store: store._id,
      supplier: supplierId,
      transactionType: 'supplier_payment',
      amount: amount,
      balanceChange: -amount, // Negative because it reduces outstanding balance
      reference: {
        type: 'Payment',
        id: paymentId,
        number: transactionId || `PAY-${Date.now()}`
      },
      paymentDetails: {
        method: paymentMethod,
        transactionId: transactionId,
        checkNumber: checkNumber,
        bankDetails: bankDetails,
        notes: notes
      },
      description: `Payment to supplier - ${paymentMethod}`,
      notes: notes || '',
      processedBy: req.user.id
    });

    // Update supplier's last payment date
    supplier.lastPaymentDate = new Date();
    await supplier.save();

    // Get updated supplier data
    const updatedSupplier = await Supplier.findById(supplierId)
      .select('name outstandingBalance creditLimit lastPaymentDate');

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        transaction,
        supplier: updatedSupplier
      }
    });

  } catch (error) {
    console.error('Record supplier payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while recording payment'
    });
  }
};

// @desc    Make a credit adjustment for supplier
// @route   POST /api/store-manager/suppliers/:supplierId/adjustment
// @access  Private (Store Manager only)
const makeSupplierAdjustment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const store = req.store;
    const { supplierId } = req.params;
    const { amount, adjustmentType, reason, notes } = req.body;

    // Verify supplier belongs to store
    const supplier = await Supplier.findOne({
      _id: supplierId,
      store: store._id
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Validate adjustment amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Adjustment amount must be greater than 0'
      });
    }

    // Calculate balance change based on adjustment type
    const balanceChange = adjustmentType === 'increase' ? amount : -amount;

    // Validate that decrease doesn't make balance negative
    if (adjustmentType === 'decrease' && balanceChange + supplier.outstandingBalance < 0) {
      return res.status(400).json({
        success: false,
        message: 'Adjustment would result in negative outstanding balance'
      });
    }

    // Create supplier adjustment transaction
    const mongoose = require('mongoose');
    const adjustmentId = new mongoose.Types.ObjectId();

    const transaction = await SupplierTransaction.createTransaction({
      store: store._id,
      supplier: supplierId,
      transactionType: 'credit_adjustment',
      amount: amount,
      balanceChange: balanceChange,
      reference: {
        type: 'Adjustment',
        id: adjustmentId,
        number: `ADJ-${Date.now()}`
      },
      adjustmentDetails: {
        reason: reason,
        notes: notes
      },
      description: `Outstanding balance ${adjustmentType} - ${reason}`,
      notes: notes || '',
      processedBy: req.user.id
    });

    // Get updated supplier data
    const updatedSupplier = await Supplier.findById(supplierId)
      .select('name outstandingBalance creditLimit');

    res.status(200).json({
      success: true,
      message: 'Adjustment made successfully',
      data: {
        transaction,
        supplier: updatedSupplier
      }
    });

  } catch (error) {
    console.error('Make supplier adjustment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while making adjustment'
    });
  }
};

// @desc    Get supplier transaction history
// @route   GET /api/store-manager/suppliers/:supplierId/transactions
// @access  Private (Store Manager only)
const getSupplierTransactions = async (req, res) => {
  try {
    const store = req.store;
    const { supplierId } = req.params;
    const { startDate, endDate, transactionType, limit = 50 } = req.query;

    // Verify supplier belongs to store
    const supplier = await Supplier.findOne({
      _id: supplierId,
      store: store._id
    }).select('name outstandingBalance creditLimit');

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Build query options
    const options = { limit: parseInt(limit) };
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);
    if (transactionType) options.transactionType = transactionType;

    // Get transaction history
    const transactions = await SupplierTransaction.getSupplierHistory(supplierId, options);

    res.status(200).json({
      success: true,
      data: {
        supplier,
        transactions,
        summary: {
          currentBalance: supplier.outstandingBalance,
          creditLimit: supplier.creditLimit,
          availableCredit: supplier.getAvailableCredit()
        }
      }
    });

  } catch (error) {
    console.error('Get supplier transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions'
    });
  }
};

module.exports = {
  recordSupplierPayment,
  makeSupplierAdjustment,
  getSupplierTransactions
};

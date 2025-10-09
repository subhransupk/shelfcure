const Customer = require('../models/Customer');
const CreditTransaction = require('../models/CreditTransaction');
const { validationResult } = require('express-validator');

// @desc    Get customer credit history
// @route   GET /api/store-manager/customers/:customerId/credit-history
// @access  Private (Store Manager only)
const getCustomerCreditHistory = async (req, res) => {
  try {
    const store = req.store;
    const { customerId } = req.params;
    const { startDate, endDate, transactionType, limit = 50 } = req.query;

    // Verify customer belongs to store
    const customer = await Customer.findOne({
      _id: customerId,
      store: store._id
    }).select('name phone creditBalance creditLimit creditStatus');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Build query options
    const options = { limit: parseInt(limit) };
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);
    if (transactionType) options.transactionType = transactionType;

    // Get credit history
    const transactions = await CreditTransaction.getCustomerHistory(customerId, options);

    res.status(200).json({
      success: true,
      data: {
        customer,
        transactions,
        summary: {
          currentBalance: customer.creditBalance,
          creditLimit: customer.creditLimit,
          availableCredit: customer.getAvailableCredit(),
          creditUtilization: customer.getCreditUtilization(),
          creditStatus: customer.creditStatus
        }
      }
    });
  } catch (error) {
    console.error('Get credit history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching credit history'
    });
  }
};

// @desc    Record credit payment
// @route   POST /api/store-manager/customers/:customerId/credit-payment
// @access  Private (Store Manager only)
const recordCreditPayment = async (req, res) => {
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
    const { customerId } = req.params;
    const { amount, paymentMethod, transactionId, notes } = req.body;

    // Verify customer belongs to store
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

    // Validate payment amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero'
      });
    }

    if (amount > customer.creditBalance) {
      return res.status(400).json({
        success: false,
        message: `Payment amount cannot exceed outstanding balance of ₹${customer.creditBalance}`
      });
    }

    // Create credit payment transaction
    const mongoose = require('mongoose');
    const paymentId = new mongoose.Types.ObjectId();

    const transaction = await CreditTransaction.createTransaction({
      store: store._id,
      customer: customerId,
      transactionType: 'credit_payment',
      amount: amount,
      balanceChange: -amount, // Negative because it reduces credit balance
      reference: {
        type: 'Payment',
        id: paymentId,
        number: transactionId || `PAY-${Date.now()}`
      },
      paymentDetails: {
        method: paymentMethod,
        transactionId: transactionId,
        notes: notes
      },
      description: `Credit payment received - ${paymentMethod}`,
      notes: notes || '',
      processedBy: req.user.id,
      transactionDate: new Date() // Explicitly set transaction date
    });

    // Get updated customer data
    const updatedCustomer = await Customer.findById(customerId)
      .select('name phone creditBalance creditLimit creditStatus');

    res.status(201).json({
      success: true,
      message: 'Credit payment recorded successfully',
      data: {
        transaction,
        customer: updatedCustomer,
        summary: {
          currentBalance: updatedCustomer.creditBalance,
          availableCredit: updatedCustomer.getAvailableCredit(),
          creditUtilization: updatedCustomer.getCreditUtilization()
        }
      }
    });
  } catch (error) {
    console.error('Record credit payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while recording credit payment'
    });
  }
};

// @desc    Make credit adjustment
// @route   POST /api/store-manager/customers/:customerId/credit-adjustment
// @access  Private (Store Manager only)
const makeCreditAdjustment = async (req, res) => {
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
    const { customerId } = req.params;
    const { amount, adjustmentType, reason, notes } = req.body;

    // Verify customer belongs to store
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

    // Validate adjustment amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Adjustment amount must be greater than zero'
      });
    }

    // Calculate balance change based on adjustment type
    const balanceChange = adjustmentType === 'add' ? amount : -amount;

    // For deductions, ensure we don't make balance negative
    if (adjustmentType === 'deduct' && (customer.creditBalance - amount) < 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot deduct ₹${amount}. Current balance is only ₹${customer.creditBalance}`
      });
    }

    // Create credit adjustment transaction
    const mongoose = require('mongoose');
    const adjustmentId = new mongoose.Types.ObjectId();

    const transaction = await CreditTransaction.createTransaction({
      store: store._id,
      customer: customerId,
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
      description: `Credit ${adjustmentType} - ${reason}`,
      notes: notes || '',
      processedBy: req.user.id,
      transactionDate: new Date() // Explicitly set transaction date
    });

    // Get updated customer data
    const updatedCustomer = await Customer.findById(customerId)
      .select('name phone creditBalance creditLimit creditStatus');

    res.status(201).json({
      success: true,
      message: `Credit ${adjustmentType} processed successfully`,
      data: {
        transaction,
        customer: updatedCustomer,
        summary: {
          currentBalance: updatedCustomer.creditBalance,
          availableCredit: updatedCustomer.getAvailableCredit(),
          creditUtilization: updatedCustomer.getCreditUtilization()
        }
      }
    });
  } catch (error) {
    console.error('Credit adjustment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while processing credit adjustment'
    });
  }
};

// @desc    Update customer credit limit
// @route   PUT /api/store-manager/customers/:customerId/credit-limit
// @access  Private (Store Manager only)
const updateCreditLimit = async (req, res) => {
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
    const { customerId } = req.params;
    const { creditLimit, notes } = req.body;

    // Verify customer belongs to store
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

    // Validate credit limit
    if (creditLimit < 0) {
      return res.status(400).json({
        success: false,
        message: 'Credit limit cannot be negative'
      });
    }

    // Check if new limit is less than current balance
    if (creditLimit < customer.creditBalance) {
      return res.status(400).json({
        success: false,
        message: `Credit limit cannot be less than current balance of ₹${customer.creditBalance}`
      });
    }

    const oldLimit = customer.creditLimit;
    customer.creditLimit = creditLimit;

    // Update credit status based on new limit
    customer.updateCreditBalance(0); // This will recalculate status
    await customer.save();

    // Log the credit limit change
    console.log(`Credit limit updated for customer ${customer.name}: ${oldLimit} -> ${creditLimit}`);

    res.status(200).json({
      success: true,
      message: 'Credit limit updated successfully',
      data: {
        customer: {
          id: customer._id,
          name: customer.name,
          phone: customer.phone,
          creditBalance: customer.creditBalance,
          creditLimit: customer.creditLimit,
          creditStatus: customer.creditStatus
        },
        summary: {
          oldLimit,
          newLimit: creditLimit,
          availableCredit: customer.getAvailableCredit(),
          creditUtilization: customer.getCreditUtilization()
        }
      }
    });
  } catch (error) {
    console.error('Update credit limit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating credit limit'
    });
  }
};

// @desc    Get store credit summary
// @route   GET /api/store-manager/credit/summary
// @access  Private (Store Manager only)
const getCreditSummary = async (req, res) => {
  try {
    const store = req.store;
    const { period = '30' } = req.query; // Default to 30 days

    const now = new Date();
    const periodStart = new Date(now.getTime() - (parseInt(period) * 24 * 60 * 60 * 1000));

    // Get credit customers with outstanding balances
    const creditCustomers = await Customer.find({
      store: store._id,
      creditBalance: { $gt: 0 }
    }).select('name phone creditBalance creditLimit creditStatus lastPurchaseDate');

    // Calculate totals
    const totalOutstanding = creditCustomers.reduce((sum, customer) => sum + customer.creditBalance, 0);
    const totalCreditLimit = creditCustomers.reduce((sum, customer) => sum + customer.creditLimit, 0);

    // Get recent credit transactions
    const recentTransactions = await CreditTransaction.find({
      store: store._id,
      transactionDate: { $gte: periodStart }
    })
    .populate('customer', 'name phone')
    .populate('processedBy', 'name')
    .sort({ transactionDate: -1 })
    .limit(20);

    // Calculate period statistics
    const periodStats = await CreditTransaction.aggregate([
      {
        $match: {
          store: store._id,
          transactionDate: { $gte: periodStart }
        }
      },
      {
        $group: {
          _id: '$transactionType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalOutstanding,
          totalCreditLimit,
          availableCredit: Math.max(0, totalCreditLimit - totalOutstanding),
          creditCustomerCount: creditCustomers.length,
          utilizationPercentage: totalCreditLimit > 0 ? Math.round((totalOutstanding / totalCreditLimit) * 100) : 0
        },
        creditCustomers,
        recentTransactions,
        periodStats: periodStats.reduce((acc, stat) => {
          acc[stat._id] = {
            count: stat.count,
            totalAmount: stat.totalAmount
          };
          return acc;
        }, {}),
        period: parseInt(period)
      }
    });
  } catch (error) {
    console.error('Get credit summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching credit summary'
    });
  }
};

module.exports = {
  getCustomerCreditHistory,
  recordCreditPayment,
  makeCreditAdjustment,
  updateCreditLimit,
  getCreditSummary
};

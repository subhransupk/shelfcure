const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  getCustomerCreditHistory,
  recordCreditPayment,
  makeCreditAdjustment,
  updateCreditLimit,
  getCreditSummary
} = require('../controllers/creditController');

const { protect, authorize } = require('../middleware/auth');
const { storeManagerOnly, checkFeatureAccess, logStoreManagerActivity } = require('../middleware/storeManagerAuth');

// Apply authentication and authorization middleware to all routes
router.use(protect);
router.use(authorize('store_manager'));
router.use(storeManagerOnly);

// Validation rules
const creditPaymentValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Payment amount must be greater than zero'),
  body('paymentMethod')
    .isIn(['cash', 'card', 'upi', 'bank_transfer', 'check', 'other'])
    .withMessage('Invalid payment method'),
  body('transactionId')
    .optional({ checkFalsy: true })
    .isLength({ min: 1, max: 100 })
    .withMessage('Transaction ID must be between 1 and 100 characters'),
  body('notes')
    .optional({ checkFalsy: true })
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const creditAdjustmentValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Adjustment amount must be greater than zero'),
  body('adjustmentType')
    .isIn(['add', 'deduct'])
    .withMessage('Adjustment type must be either "add" or "deduct"'),
  body('reason')
    .isIn(['manual_adjustment', 'promotional_credit', 'compensation', 'correction', 'goodwill', 'other'])
    .withMessage('Invalid adjustment reason'),
  body('notes')
    .optional({ checkFalsy: true })
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const creditLimitValidation = [
  body('creditLimit')
    .isFloat({ min: 0 })
    .withMessage('Credit limit must be zero or greater'),
  body('notes')
    .optional({ checkFalsy: true })
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// @route   GET /api/store-manager/credit/summary
// @desc    Get store credit summary and statistics
// @access  Private
router.get('/summary',
  checkFeatureAccess('customers'),
  logStoreManagerActivity('view_credit_summary'),
  getCreditSummary
);

// @route   GET /api/store-manager/customers/:customerId/credit-history
// @desc    Get customer credit transaction history
// @access  Private
router.get('/customers/:customerId/credit-history',
  checkFeatureAccess('customers'),
  logStoreManagerActivity('view_customer_credit_history'),
  getCustomerCreditHistory
);

// @route   POST /api/store-manager/customers/:customerId/credit-payment
// @desc    Record a credit payment from customer
// @access  Private
router.post('/customers/:customerId/credit-payment',
  checkFeatureAccess('customers'),
  creditPaymentValidation,
  logStoreManagerActivity('record_credit_payment'),
  recordCreditPayment
);

// @route   POST /api/store-manager/customers/:customerId/credit-adjustment
// @desc    Make a manual credit adjustment (add or deduct credit)
// @access  Private
router.post('/customers/:customerId/credit-adjustment',
  checkFeatureAccess('customers'),
  creditAdjustmentValidation,
  logStoreManagerActivity('make_credit_adjustment'),
  makeCreditAdjustment
);

// @route   PUT /api/store-manager/customers/:customerId/credit-limit
// @desc    Update customer credit limit
// @access  Private
router.put('/customers/:customerId/credit-limit',
  checkFeatureAccess('customers'),
  creditLimitValidation,
  logStoreManagerActivity('update_credit_limit'),
  updateCreditLimit
);

module.exports = router;

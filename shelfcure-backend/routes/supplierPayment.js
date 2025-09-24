const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { storeManagerOnly, checkFeatureAccess, logStoreManagerActivity } = require('../middleware/storeManagerAuth');
const {
  recordSupplierPayment,
  makeSupplierAdjustment,
  getSupplierTransactions
} = require('../controllers/supplierPaymentController');

// Validation rules
const supplierPaymentValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('paymentMethod')
    .isIn(['cash', 'card', 'upi', 'bank_transfer', 'check', 'other'])
    .withMessage('Invalid payment method'),
  body('transactionId')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Transaction ID must be between 1 and 100 characters'),
  body('checkNumber')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Check number must be between 1 and 50 characters'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const supplierAdjustmentValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('adjustmentType')
    .isIn(['increase', 'decrease'])
    .withMessage('Adjustment type must be increase or decrease'),
  body('reason')
    .isIn(['manual_adjustment', 'discount_applied', 'penalty_applied', 'correction', 'goodwill', 'other'])
    .withMessage('Invalid adjustment reason'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

// Apply middleware to all routes
router.use(protect);
router.use(authorize('store_manager'));
router.use(storeManagerOnly);

// @route   POST /api/store-manager/suppliers/:supplierId/payment
// @desc    Record a payment to supplier
// @access  Private
router.post('/:supplierId/payment',
  checkFeatureAccess('suppliers'),
  supplierPaymentValidation,
  logStoreManagerActivity('record_supplier_payment'),
  recordSupplierPayment
);

// @route   POST /api/store-manager/suppliers/:supplierId/adjustment
// @desc    Make a credit adjustment for supplier
// @access  Private
router.post('/:supplierId/adjustment',
  checkFeatureAccess('suppliers'),
  supplierAdjustmentValidation,
  logStoreManagerActivity('make_supplier_adjustment'),
  makeSupplierAdjustment
);

// @route   GET /api/store-manager/suppliers/:supplierId/transactions
// @desc    Get supplier transaction history
// @access  Private
router.get('/:supplierId/transactions',
  checkFeatureAccess('suppliers'),
  logStoreManagerActivity('view_supplier_transactions'),
  getSupplierTransactions
);

module.exports = router;

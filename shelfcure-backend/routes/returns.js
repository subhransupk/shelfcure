const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  getReturns,
  getReturn,
  getReturnsForSale,
  validateReturnEligibility,
  createReturn,
  updateReturn,
  restoreInventory,
  getReturnAnalytics
} = require('../controllers/returnController');

const { protect, authorize } = require('../middleware/auth');
const { storeManagerOnly, checkFeatureAccess, logStoreManagerActivity } = require('../middleware/storeManagerAuth');

// Apply authentication and authorization middleware to all routes
router.use(protect);
router.use(authorize('store_manager'));
router.use(storeManagerOnly);

// Validation rules for creating returns
const createReturnValidation = [
  body('originalSaleId')
    .notEmpty()
    .withMessage('Original sale ID is required')
    .isMongoId()
    .withMessage('Invalid sale ID format'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required for return'),
  
  body('items.*.originalSaleItem')
    .notEmpty()
    .withMessage('Original sale item ID is required')
    .isMongoId()
    .withMessage('Invalid original sale item ID format'),
  
  body('items.*.returnQuantity')
    .isFloat({ min: 0.01 })
    .withMessage('Return quantity must be greater than 0'),
  
  body('items.*.unitType')
    .isIn(['strip', 'individual'])
    .withMessage('Unit type must be either strip or individual'),
  
  body('items.*.itemReturnReason')
    .optional()
    .isIn(['defective', 'expired', 'wrong_medicine', 'customer_request', 'doctor_change', 'side_effects', 'duplicate_purchase', 'other'])
    .withMessage('Invalid item return reason'),
  
  body('returnReason')
    .notEmpty()
    .withMessage('Return reason is required')
    .isIn([
      'defective_product',
      'expired_medicine', 
      'wrong_medicine_dispensed',
      'customer_dissatisfaction',
      'doctor_prescription_change',
      'adverse_reaction',
      'duplicate_purchase',
      'billing_error',
      'quality_issue',
      'other'
    ])
    .withMessage('Invalid return reason'),
  
  body('returnReasonDetails')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Return reason details cannot exceed 500 characters'),
  
  body('refundMethod')
    .optional()
    .isIn(['cash', 'card', 'upi', 'store_credit', 'exchange'])
    .withMessage('Invalid refund method'),
  
  body('restoreInventory')
    .optional()
    .isBoolean()
    .withMessage('Restore inventory must be a boolean value'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

// Validation rules for updating returns
const updateReturnValidation = [
  body('status')
    .optional()
    .isIn(['pending', 'approved', 'processed', 'completed', 'rejected', 'cancelled'])
    .withMessage('Invalid status'),
  
  body('refundMethod')
    .optional()
    .isIn(['cash', 'card', 'upi', 'store_credit', 'exchange'])
    .withMessage('Invalid refund method'),
  
  body('refundStatus')
    .optional()
    .isIn(['pending', 'processed', 'completed', 'failed'])
    .withMessage('Invalid refund status'),
  
  body('refundReference')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Refund reference cannot exceed 100 characters'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  
  body('rejectionReason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Rejection reason cannot exceed 500 characters')
];

// @route   GET /api/store-manager/returns
// @desc    Get all returns for the store
// @access  Private
router.get('/',
  checkFeatureAccess('sales'),
  logStoreManagerActivity('view_returns'),
  getReturns
);

// @route   GET /api/store-manager/returns/analytics
// @desc    Get return analytics and reporting data
// @access  Private
router.get('/analytics',
  checkFeatureAccess('analytics'),
  logStoreManagerActivity('view_return_analytics'),
  getReturnAnalytics
);

// @route   GET /api/store-manager/returns/:id
// @desc    Get a specific return
// @access  Private
router.get('/:id',
  checkFeatureAccess('sales'),
  logStoreManagerActivity('view_return_details'),
  getReturn
);

// @route   POST /api/store-manager/returns/validate
// @desc    Validate return eligibility
// @access  Private
router.post('/validate',
  checkFeatureAccess('sales'),
  logStoreManagerActivity('validate_return'),
  validateReturnEligibility
);

// @route   POST /api/store-manager/returns
// @desc    Create a new return
// @access  Private
router.post('/',
  checkFeatureAccess('sales'),
  createReturnValidation,
  logStoreManagerActivity('create_return'),
  createReturn
);

// @route   PUT /api/store-manager/returns/:id
// @desc    Update return status and details
// @access  Private
router.put('/:id',
  checkFeatureAccess('sales'),
  updateReturnValidation,
  logStoreManagerActivity('update_return'),
  updateReturn
);



// @route   POST /api/store-manager/returns/:id/restore-inventory
// @desc    Process inventory restoration for a return
// @access  Private
router.post('/:id/restore-inventory',
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('restore_return_inventory'),
  restoreInventory
);

// Note: The route for getting returns for a specific sale should be added to the storeManager.js routes
// as it follows the pattern /api/store-manager/sales/:saleId/returns

module.exports = router;

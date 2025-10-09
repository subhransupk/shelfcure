const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierPurchases,
  getSuppliersAnalytics,
  searchSuppliers,
  refreshSupplierStats
} = require('../controllers/supplierController');

const { protect, authorize } = require('../middleware/auth');
const { storeManagerOnly, checkFeatureAccess, logStoreManagerActivity } = require('../middleware/storeManagerAuth');

// Apply authentication and authorization middleware to all routes
router.use(protect);
router.use(authorize('store_manager'));
router.use(storeManagerOnly);

// Validation rules for supplier creation/update
const supplierValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Supplier name must be between 2 and 100 characters'),
  body('contactPerson')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Contact person name must be between 2 and 100 characters'),
  body('phone')
    .trim()
    .matches(/^[\+]?[0-9\s\-\(\)]{10,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  // GST Number - completely optional, no validation
  // body('gstNumber') - removed validation to make truly optional
  
  // PAN Number - completely optional, no validation  
  // body('panNumber') - removed validation to make truly optional
  body('paymentTerms')
    .optional()
    .isIn(['Cash on delivery', '15 days', '30 days', '45 days', '60 days', '90 days'])
    .withMessage('Invalid payment terms'),
  body('creditLimit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Credit limit must be a positive number'),
  // Address pincode - completely optional, no validation
  // body('address.pincode') - removed validation to make truly optional
  body('rating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5')
];

// @route   GET /api/store-manager/suppliers/search
// @desc    Search suppliers for autocomplete
// @access  Private
router.get('/search', 
  checkFeatureAccess('inventory'),
  searchSuppliers
);

// @route   GET /api/store-manager/suppliers/analytics
// @desc    Get suppliers analytics
// @access  Private
router.get('/analytics',
  checkFeatureAccess('analytics'),
  getSuppliersAnalytics
);

// @route   POST /api/store-manager/suppliers/refresh-stats
// @desc    Refresh supplier statistics
// @access  Private
router.post('/refresh-stats',
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('refresh_supplier_stats'),
  refreshSupplierStats
);

// @route   GET /api/store-manager/suppliers
// @desc    Get all suppliers for store
// @access  Private
router.get('/', 
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('view_suppliers'),
  getSuppliers
);

// @route   POST /api/store-manager/suppliers
// @desc    Create new supplier
// @access  Private
router.post('/', 
  checkFeatureAccess('inventory'),
  supplierValidation,
  logStoreManagerActivity('create_supplier'),
  createSupplier
);

// @route   GET /api/store-manager/suppliers/:id
// @desc    Get single supplier
// @access  Private
router.get('/:id', 
  checkFeatureAccess('inventory'),
  getSupplier
);

// @route   PUT /api/store-manager/suppliers/:id
// @desc    Update supplier
// @access  Private
router.put('/:id', 
  checkFeatureAccess('inventory'),
  supplierValidation,
  logStoreManagerActivity('update_supplier'),
  updateSupplier
);

// @route   DELETE /api/store-manager/suppliers/:id
// @desc    Delete supplier
// @access  Private
router.delete('/:id', 
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('delete_supplier'),
  deleteSupplier
);

// @route   GET /api/store-manager/suppliers/:id/purchases
// @desc    Get supplier purchase history
// @access  Private
router.get('/:id/purchases', 
  checkFeatureAccess('purchases'),
  getSupplierPurchases
);

module.exports = router;

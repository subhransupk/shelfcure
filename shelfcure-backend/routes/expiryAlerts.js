const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { storeManagerOnly, checkFeatureAccess, logStoreManagerActivity } = require('../middleware/storeManagerAuth');

const {
  getExpiryAlerts,
  getExpiryAlertsSummary,
  markMedicinesAsDisposed,
  extendExpiryDate
} = require('../controllers/expiryAlertsController');

// Apply authentication and authorization middleware to all routes
router.use(protect);
router.use(authorize('store_manager'));
router.use(storeManagerOnly);

// Validation rules for expiry date extension
const expiryDateValidation = [
  body('newExpiryDate')
    .notEmpty()
    .withMessage('New expiry date is required')
    .isISO8601()
    .withMessage('Invalid date format. Please use YYYY-MM-DD format')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);

      if (date < today) {
        throw new Error('Expiry date cannot be in the past');
      }

      const maxFutureDate = new Date();
      maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 10);

      if (date > maxFutureDate) {
        throw new Error('Expiry date cannot be more than 10 years in the future');
      }

      return true;
    }),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// @route   GET /api/store-manager/expiry-alerts/summary
// @desc    Get expiry alerts summary/statistics
// @access  Private
router.get('/summary', 
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('view_expiry_summary'),
  getExpiryAlertsSummary
);

// @route   POST /api/store-manager/expiry-alerts/mark-disposed
// @desc    Mark medicines as disposed
// @access  Private
router.post('/mark-disposed',
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('mark_medicines_disposed'),
  markMedicinesAsDisposed
);

// @route   PUT /api/store-manager/expiry-alerts/:id/extend-expiry
// @desc    Update expiry date for a medicine
// @access  Private
router.put('/:id/extend-expiry',
  checkFeatureAccess('inventory'),
  expiryDateValidation,
  logStoreManagerActivity('extend_expiry_date'),
  extendExpiryDate
);

// @route   GET /api/store-manager/expiry-alerts
// @desc    Get comprehensive expiry alerts for store
// @access  Private
router.get('/',
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('view_expiry_alerts'),
  getExpiryAlerts
);

module.exports = router;

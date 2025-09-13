const express = require('express');
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

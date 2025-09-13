const express = require('express');
const router = express.Router();

// Import controllers
const {
  searchMedicineLocations,
  getMedicineLocations
} = require('../controllers/medicineLocationController');

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const { 
  storeManagerOnly, 
  checkFeatureAccess,
  logStoreManagerActivity 
} = require('../middleware/storeManagerAuth');

// Apply authentication and authorization middleware to all routes
router.use(protect);
router.use(authorize('store_manager', 'staff', 'cashier')); // Allow staff access for read-only operations
router.use(storeManagerOnly);

// ===================
// MEDICINE LOCATION SEARCH ROUTES (READ-ONLY FOR STAFF)
// ===================

// Search medicine locations - accessible to all store staff
router.get('/search',
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('search_medicine_locations'),
  searchMedicineLocations
);

// Get specific medicine locations - accessible to all store staff
router.get('/:medicineId',
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('view_medicine_locations'),
  getMedicineLocations
);

module.exports = router;

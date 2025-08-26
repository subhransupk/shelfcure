const express = require('express');
const router = express.Router();

// Import controllers
const {
  // Dashboard & Analytics
  getDashboardData,
  getStoreOwnerAnalytics,
  getFinancialSummary,
  getStores,
  generateStoreCode,
  createStore,
  getStore,
  updateStore,
  deleteStore,
  getStoreStaff,
  syncStoreCount
} = require('../controllers/storeOwnerControllerSimple');

const {
  // Staff Management
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffDetails,
  getAllStaff
} = require('../controllers/storeOwnerStaffControllerSimple');

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const { storeOwnerOnly } = require('../middleware/storeOwnerAuthSimple');

// Placeholder functions for features to be implemented
const getAttendance = (req, res) => res.status(501).json({ success: false, message: 'Feature coming soon' });
const markAttendance = (req, res) => res.status(501).json({ success: false, message: 'Feature coming soon' });
const updateAttendance = (req, res) => res.status(501).json({ success: false, message: 'Feature coming soon' });
const getAttendanceSummary = (req, res) => res.status(501).json({ success: false, message: 'Feature coming soon' });
const getStoreAttendanceSummary = (req, res) => res.status(501).json({ success: false, message: 'Feature coming soon' });
const getSalaries = (req, res) => res.status(501).json({ success: false, message: 'Feature coming soon' });
const createSalary = (req, res) => res.status(501).json({ success: false, message: 'Feature coming soon' });
const updateSalary = (req, res) => res.status(501).json({ success: false, message: 'Feature coming soon' });
const approveSalary = (req, res) => res.status(501).json({ success: false, message: 'Feature coming soon' });
const paySalary = (req, res) => res.status(501).json({ success: false, message: 'Feature coming soon' });
const getSalarySummary = (req, res) => res.status(501).json({ success: false, message: 'Feature coming soon' });
const getStoreWiseSalarySummary = (req, res) => res.status(501).json({ success: false, message: 'Feature coming soon' });
const generatePayslip = (req, res) => res.status(501).json({ success: false, message: 'Feature coming soon' });
const getSubscription = (req, res) => res.status(501).json({ success: false, message: 'Feature coming soon' });
const getSubscriptionPlans = (req, res) => res.status(501).json({ success: false, message: 'Feature coming soon' });
const upgradeSubscription = (req, res) => res.status(501).json({ success: false, message: 'Feature coming soon' });
const paySubscription = (req, res) => res.status(501).json({ success: false, message: 'Feature coming soon' });
const getPaymentHistory = (req, res) => res.status(501).json({ success: false, message: 'Feature coming soon' });

const getStoreAnalytics = (req, res) => res.status(501).json({ success: false, message: 'Feature coming soon' });

// Apply authentication and authorization middleware to all routes
router.use(protect);
router.use(authorize('store_owner'));
router.use(storeOwnerOnly);

// ===================
// DASHBOARD ROUTES
// ===================
router.get('/dashboard', getDashboardData);
router.get('/analytics', getStoreOwnerAnalytics);
router.get('/financial-summary', getFinancialSummary);

// ===================
// STORE MANAGEMENT ROUTES
// ===================
router.route('/stores')
  .get(getStores)
  .post(createStore);

// Generate store code endpoint (separate from stores routes to avoid conflicts)
router.get('/generate-store-code', generateStoreCode);

router.route('/stores/:id')
  .get(getStore)
  .put(updateStore)
  .delete(deleteStore);

router.get('/stores/:id/analytics', getStoreAnalytics);

// ===================
// STAFF MANAGEMENT ROUTES
// ===================
// Get all staff across all stores
router.get('/staff', getAllStaff);

// Store-specific staff routes
router.route('/stores/:storeId/staff')
  .get(getStoreStaff)
  .post(createStaff);

// Individual staff routes
router.route('/staff/:id')
  .get(getStaffDetails)
  .put(updateStaff)
  .delete(deleteStaff);

// ===================
// ATTENDANCE MANAGEMENT ROUTES
// ===================
router.route('/stores/:storeId/attendance')
  .get(getAttendance)
  .post(markAttendance);

router.put('/attendance/:id', updateAttendance);
router.get('/attendance/summary/:staffId', getAttendanceSummary);
router.get('/stores/:storeId/attendance/summary', getStoreAttendanceSummary);

// ===================
// SALARY MANAGEMENT ROUTES
// ===================
router.route('/stores/:storeId/salaries')
  .get(getSalaries)
  .post(createSalary);

router.route('/salaries/:id')
  .put(updateSalary);

router.put('/salaries/:id/approve', approveSalary);
router.put('/salaries/:id/pay', paySalary);
router.get('/salaries/summary', getSalarySummary);
router.get('/salaries/store-wise-summary', getStoreWiseSalarySummary);
router.get('/salaries/:id/payslip', generatePayslip);

// ===================
// SUBSCRIPTION MANAGEMENT ROUTES
// ===================
router.get('/subscription', getSubscription);
router.get('/subscription/plans', getSubscriptionPlans);
router.put('/subscription/upgrade', upgradeSubscription);
router.post('/subscription/pay', paySubscription);
router.get('/subscription/payment-history', getPaymentHistory);

// ===================
// UTILITY ROUTES
// ===================
router.post('/sync-store-count', syncStoreCount);

module.exports = router;

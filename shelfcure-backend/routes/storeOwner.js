const express = require('express');
const router = express.Router();

// Import controllers
const {
  // Store Management
  getStores,
  generateStoreCode,
  createStore,
  getStore,
  updateStore,
  deleteStore,
  getStoreAnalytics,
  getStoreStaff,

  // Dashboard & Analytics
  getDashboardData,
  getStoreOwnerAnalytics,
  getFinancialSummary
} = require('../controllers/storeOwnerControllerSimple');

const {
  // Staff Management
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffDetails
} = require('../controllers/storeOwnerStaffControllerSimple');

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

// Additional placeholder functions
const updateStore = (req, res) => res.status(501).json({ success: false, message: 'Feature coming soon' });
const deleteStore = (req, res) => res.status(501).json({ success: false, message: 'Feature coming soon' });
const getStoreAnalytics = (req, res) => res.status(501).json({ success: false, message: 'Feature coming soon' });

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const { storeOwnerOnly } = require('../middleware/storeOwnerAuthSimple');

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

// Specific routes must come before parameterized routes
router.get('/stores/generate-code', generateStoreCode);

router.route('/stores/:id')
  .get(getStore)
  .put(updateStore)
  .delete(deleteStore);

router.get('/stores/:id/analytics', getStoreAnalytics);

// ===================
// STAFF MANAGEMENT ROUTES
// ===================
router.route('/stores/:storeId/staff')
  .get(getStoreStaff)
  .post(createStaff);

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

module.exports = router;

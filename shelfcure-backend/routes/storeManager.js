const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Import controllers
const {
  getDashboardData,
  getStoreAnalytics,
  getInventory,
  getSales,
  createSale,
  getCustomers,
  getCustomerAnalytics,
  getCreditManagement,
  searchMasterMedicines,
  addCustomMedicine,
  updateMedicine,
  deleteMedicine,
  getMedicineDetails,
  getMedicineSalesHistory,
  getMedicinePurchaseHistory
} = require('../controllers/storeManagerController');

const {
  getBatches,
  getMedicineBatches,
  createBatch,
  updateBatch,
  deleteBatch
} = require('../controllers/batchController');

const {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorStats,
  getCommissions,
  markCommissionPaid
} = require('../controllers/storeManagerDoctorsController');

const {
  getStaff,
  getStaffMember,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffStats
} = require('../controllers/storeManagerStaffController');

// Rack Management Controllers
const {
  getRacks,
  getRack,
  createRack,
  updateRack,
  deleteRack
} = require('../controllers/rackController');

const {
  getRackLayout,
  assignMedicineToLocation,
  updateLocationQuantity,
  moveMedicineLocation,
  removeMedicineFromLocation,
  searchMedicinesByLocation
} = require('../controllers/rackLocationController');

const {
  searchMedicineLocations,
  getMedicineLocations,
  getUnassignedMedicines,
  getRackOccupancySummary
} = require('../controllers/medicineLocationController');

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const {
  storeManagerOnly,
  validateStoreContext,
  checkFeatureAccess,
  logStoreManagerActivity
} = require('../middleware/storeManagerAuth');

// Apply authentication and authorization middleware to all routes
// Configure multer for prescription uploads
const prescriptionStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join('uploads', 'prescriptions');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `presc-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const prescriptionUpload = multer({
  storage: prescriptionStorage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || `${10 * 1024 * 1024}`, 10) },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.includes('image') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image or PDF files are allowed for prescriptions'));
    }
  }
});
router.use(protect);
router.use(authorize('store_manager'));
router.use(storeManagerOnly);

// ===================
// DASHBOARD ROUTES
// ===================
router.get('/dashboard',
  logStoreManagerActivity('view_dashboard'),
  getDashboardData
);

router.get('/analytics',
  checkFeatureAccess('analytics'),
  logStoreManagerActivity('view_analytics'),
  getStoreAnalytics
);

// ===================
// INVENTORY ROUTES
// ===================
router.get('/inventory',
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('view_inventory'),
  getInventory
);

// Route for searching master medicines
router.get('/master-medicines',
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('search_master_medicines'),
  searchMasterMedicines
);

// Route for adding custom medicines
router.post('/medicines',
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('add_custom_medicine'),
  addCustomMedicine
);

// Specific medicine routes must come before parameterized routes
router.get('/medicines/search-by-location',
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('search_medicines_by_location'),
  searchMedicinesByLocation
);

// Medicine transaction history routes (must come before parameterized routes)
router.get('/medicines/:id/sales-history',
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('view_medicine_sales_history'),
  getMedicineSalesHistory
);

router.get('/medicines/:id/purchase-history',
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('view_medicine_purchase_history'),
  getMedicinePurchaseHistory
);

// Routes for updating and deleting medicines (parameterized routes)
router.route('/medicines/:id')
  .get(
    checkFeatureAccess('inventory'),
    logStoreManagerActivity('view_medicine_details'),
    getMedicineDetails
  )
  .put(
    checkFeatureAccess('inventory'),
    logStoreManagerActivity('update_medicine'),
    updateMedicine
  )
  .delete(
    checkFeatureAccess('inventory'),
    logStoreManagerActivity('delete_medicine'),
    deleteMedicine
  );

// ===================
// BATCH MANAGEMENT ROUTES
// ===================

// Get all batches for the store
router.get('/batches',
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('view_batches'),
  getBatches
);

// Get batches for a specific medicine
router.get('/inventory/:medicineId/batches',
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('view_medicine_batches'),
  getMedicineBatches
);

// Create new batch for a medicine
router.post('/inventory/:medicineId/batches',
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('create_batch'),
  createBatch
);

// Update and delete batch routes
router.route('/batches/:id')
  .put(
    checkFeatureAccess('inventory'),
    logStoreManagerActivity('update_batch'),
    updateBatch
  )
  .delete(
    checkFeatureAccess('inventory'),
    logStoreManagerActivity('delete_batch'),
    deleteBatch
  );

// ===================
// SALES ROUTES
// ===================

// Temporary debug endpoint to check sales (must be before /sales route)
router.get('/debug-sales', async (req, res) => {
  try {
    const Sale = require('../models/Sale');
    const store = req.store;

    console.log('🔍 DEBUG: Checking sales for store:', store._id);

    const allSales = await Sale.find({ store: store._id }).sort({ createdAt: -1 });
    console.log('📊 DEBUG: Found sales:', allSales.length);

    if (allSales.length > 0) {
      console.log('💰 DEBUG: Latest sale:', {
        id: allSales[0]._id,
        totalAmount: allSales[0].totalAmount,
        createdAt: allSales[0].createdAt,
        itemCount: allSales[0].items?.length || 0
      });
    }

    res.json({
      success: true,
      count: allSales.length,
      data: allSales.map(sale => ({
        id: sale._id,
        totalAmount: sale.totalAmount,
        createdAt: sale.createdAt,
        customer: sale.customer,
        itemCount: sale.items?.length || 0
      }))
    });
  } catch (error) {
    console.error('DEBUG sales error:', error);
    res.status(500).json({ success: false, message: 'Debug error' });
  }
});

router.route('/sales')
  .get(
    checkFeatureAccess('sales'),
    logStoreManagerActivity('view_sales'),
    getSales
  )
  .post(
    checkFeatureAccess('sales'),
    prescriptionUpload.single('prescription'),
    logStoreManagerActivity('create_sale'),
    (req, res, next) => {
      // If multipart, move JSON from 'data' into req.body
      if (req.is('multipart/form-data') && req.body && req.body.data) {
        try {
          const parsed = JSON.parse(req.body.data);
          req.body = parsed;
        } catch (e) {
          return res.status(400).json({ success: false, message: 'Invalid JSON in form data' });
        }
      }
      // Attach file metadata if present
      if (req.file) {
        req.prescriptionFile = req.file;
      }
      next();
    },
    createSale
  );

// @route   GET /api/store-manager/sales/:saleId/returns
// @desc    Get all returns for a specific sale
// @access  Private
router.get('/sales/:saleId/returns',
  checkFeatureAccess('sales'),
  logStoreManagerActivity('view_sale_returns'),
  require('../controllers/returnController').getReturnsForSale
);

// @route   GET /api/store-manager/sales/:saleId/available-for-return
// @desc    Get available items for return from a specific sale
// @access  Private
router.get('/sales/:saleId/available-for-return',
  checkFeatureAccess('sales'),
  logStoreManagerActivity('view_available_return_items'),
  require('../controllers/returnController').getAvailableItemsForReturn
);

// ===================
// CUSTOMER ROUTES
// ===================
router.route('/customers')
  .get(
    checkFeatureAccess('customers'),
    logStoreManagerActivity('view_customers'),
    getCustomers
  )
  .post(
    checkFeatureAccess('customers'),
    logStoreManagerActivity('create_customer'),
    require('../controllers/storeManagerController').createCustomer
  );

// Customer analytics route
router.get('/customers/analytics',
  checkFeatureAccess('customers'),
  logStoreManagerActivity('view_customer_analytics'),
  getCustomerAnalytics
);

// Credit management route
router.get('/customers/credit-management',
  checkFeatureAccess('customers'),
  logStoreManagerActivity('view_credit_management'),
  getCreditManagement
);

// ===================
// DOCTOR ROUTES
// ===================
router.route('/doctors')
  .get(
    checkFeatureAccess('doctors'),
    logStoreManagerActivity('view_doctors'),
    getDoctors
  )
  .post(
    checkFeatureAccess('doctors'),
    logStoreManagerActivity('create_doctor'),
    createDoctor
  );

// Specific routes must come before parameterized routes
router.get('/doctors/stats',
  checkFeatureAccess('doctors'),
  logStoreManagerActivity('view_doctor_stats'),
  getDoctorStats
);

router.get('/doctors/commissions',
  checkFeatureAccess('doctors'),
  logStoreManagerActivity('view_commissions'),
  getCommissions
);

router.put('/doctors/commissions/:id/pay',
  checkFeatureAccess('doctors'),
  logStoreManagerActivity('mark_commission_paid'),
  markCommissionPaid
);

// Parameterized routes must come after specific routes
router.route('/doctors/:id')
  .get(
    checkFeatureAccess('doctors'),
    logStoreManagerActivity('view_doctor'),
    getDoctor
  )
  .put(
    checkFeatureAccess('doctors'),
    logStoreManagerActivity('update_doctor'),
    updateDoctor
  )
  .delete(
    checkFeatureAccess('doctors'),
    logStoreManagerActivity('delete_doctor'),
    deleteDoctor
  );

// Staff Management Routes
router.route('/staff')
  .get(
    checkFeatureAccess('staff'),
    logStoreManagerActivity('view_staff'),
    getStaff
  )
  .post(
    checkFeatureAccess('staff'),
    logStoreManagerActivity('create_staff'),
    createStaff
  );

router.get('/staff/stats',
  checkFeatureAccess('staff'),
  logStoreManagerActivity('view_staff_stats'),
  getStaffStats
);

router.route('/staff/:id')
  .get(
    checkFeatureAccess('staff'),
    logStoreManagerActivity('view_staff_member'),
    getStaffMember
  )
  .put(
    checkFeatureAccess('staff'),
    logStoreManagerActivity('update_staff'),
    updateStaff
  )
  .delete(
    checkFeatureAccess('staff'),
    logStoreManagerActivity('delete_staff'),
    deleteStaff
  );

// ===================
// ATTENDANCE MANAGEMENT ROUTES
// ===================
const {
  getAttendance: getStoreAttendance,
  markAttendance: markStoreAttendance,
  getAttendanceStats,
  bulkMarkAttendance,
  getStaffWithAttendance
} = require('../controllers/storeManagerAttendanceController');

router.route('/attendance')
  .get(
    checkFeatureAccess('staff'),
    logStoreManagerActivity('view_attendance'),
    getStoreAttendance
  );

router.post('/attendance/mark',
  checkFeatureAccess('staff'),
  logStoreManagerActivity('mark_attendance'),
  markStoreAttendance
);

router.post('/attendance/bulk',
  checkFeatureAccess('staff'),
  logStoreManagerActivity('bulk_mark_attendance'),
  bulkMarkAttendance
);

router.get('/attendance/stats',
  checkFeatureAccess('staff'),
  logStoreManagerActivity('view_attendance_stats'),
  getAttendanceStats
);

router.get('/attendance/staff-list',
  checkFeatureAccess('staff'),
  logStoreManagerActivity('view_staff_attendance_list'),
  getStaffWithAttendance
);

// ===================
// PAYROLL MANAGEMENT ROUTES
// ===================
const {
  getPayroll: getStorePayroll,
  getPayrollStats: getStorePayrollStats,
  processPayroll: processStorePayroll,
  getSalaryConfigs,
  createOrUpdateSalaryConfig,
  updatePayrollStatus,
  generatePayslip,
  initializeSalaryConfigs
} = require('../controllers/storeManagerPayrollController');

router.route('/payroll')
  .get(
    checkFeatureAccess('staff'),
    logStoreManagerActivity('view_payroll'),
    getStorePayroll
  );

router.get('/payroll/stats',
  checkFeatureAccess('staff'),
  logStoreManagerActivity('view_payroll_stats'),
  getStorePayrollStats
);

router.post('/payroll/process',
  checkFeatureAccess('staff'),
  logStoreManagerActivity('process_payroll'),
  processStorePayroll
);

router.get('/payroll/salary-configs',
  checkFeatureAccess('staff'),
  logStoreManagerActivity('view_salary_configs'),
  getSalaryConfigs
);

router.post('/payroll/salary-config',
  checkFeatureAccess('staff'),
  logStoreManagerActivity('manage_salary_config'),
  createOrUpdateSalaryConfig
);

router.post('/payroll/init-salary-configs',
  checkFeatureAccess('staff'),
  logStoreManagerActivity('init_salary_configs'),
  initializeSalaryConfigs
);

router.put('/payroll/:id/status',
  checkFeatureAccess('staff'),
  logStoreManagerActivity('update_payroll_status'),
  updatePayrollStatus
);

router.get('/payroll/:id/payslip',
  checkFeatureAccess('staff'),
  logStoreManagerActivity('generate_payslip'),
  generatePayslip
);

// ===================
// NOTIFICATION ROUTES
// ===================

// Get notifications
router.get('/notifications',
  logStoreManagerActivity('view_notifications'),
  async (req, res) => {
    try {
      const { type, search, page = 1, limit = 20 } = req.query;

      const storeId = req.store ? req.store._id : null; // Get store ID from middleware

      if (!storeId) {
        return res.status(400).json({
          success: false,
          message: 'Store ID is required'
        });
      }

      // Mock notifications data
      const mockNotifications = [
        {
          _id: '1',
          type: 'low_stock',
          priority: 'high',
          title: 'Low Stock Alert',
          message: 'Paracetamol 500mg is running low (5 units remaining)',
          isRead: false,
          actionRequired: true,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          metadata: { medicineId: 'med123', currentStock: 5, threshold: 10 }
        },
        {
          _id: '2',
          type: 'expiry_alert',
          priority: 'medium',
          title: 'Expiry Alert',
          message: 'Amoxicillin 250mg expires in 7 days',
          isRead: false,
          actionRequired: true,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          metadata: { medicineId: 'med456', expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
        },
        {
          _id: '3',
          type: 'system',
          priority: 'low',
          title: 'System Update',
          message: 'ShelfCure system has been updated to version 2.1.0',
          isRead: true,
          actionRequired: false,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          metadata: { version: '2.1.0' }
        },
        {
          _id: '4',
          type: 'customer_message',
          priority: 'medium',
          title: 'Customer Inquiry',
          message: 'Customer John Doe asked about availability of insulin',
          isRead: false,
          actionRequired: true,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          metadata: { customerId: 'cust789', customerName: 'John Doe' }
        },
        {
          _id: '5',
          type: 'payment_reminder',
          priority: 'high',
          title: 'Payment Due',
          message: 'Subscription payment of ₹2,999 is due in 3 days',
          isRead: false,
          actionRequired: true,
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
          metadata: { amount: 2999, dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }
        }
      ];

      // Apply filters
      let filteredNotifications = mockNotifications;

      if (type) {
        filteredNotifications = filteredNotifications.filter(n => n.type === type);
      }

      if (search) {
        const searchLower = search.toLowerCase();
        filteredNotifications = filteredNotifications.filter(n =>
          n.title.toLowerCase().includes(searchLower) ||
          n.message.toLowerCase().includes(searchLower)
        );
      }

      res.json({
        success: true,
        data: filteredNotifications,
        pagination: {
          current: parseInt(page),
          pages: 1,
          total: filteredNotifications.length
        }
      });

    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: error.message
      });
    }
  }
);

// Mark notifications as read
router.post('/notifications/mark-read',
  logStoreManagerActivity('mark_notifications_read'),
  async (req, res) => {
    try {
      const { notificationIds } = req.body;

      if (!notificationIds || !Array.isArray(notificationIds)) {
        return res.status(400).json({
          success: false,
          message: 'Notification IDs array is required'
        });
      }

      // For now, just return success
      res.json({
        success: true,
        message: 'Notifications marked as read'
      });

    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notifications as read',
        error: error.message
      });
    }
  }
);

// Get notification settings
router.get('/notification-settings',
  logStoreManagerActivity('view_notification_settings'),
  async (req, res) => {
    try {
      const storeId = req.store._id;

      // For now, return default settings
      // In a real implementation, you would fetch from database
      const defaultSettings = {
        email: {
          lowStock: true,
          expiryAlerts: true,
          customerMessages: true,
          systemUpdates: false,
          paymentReminders: true
        },
        whatsapp: {
          lowStock: false,
          expiryAlerts: true,
          customerMessages: true,
          systemUpdates: false,
          paymentReminders: false
        },
        sms: {
          lowStock: false,
          expiryAlerts: false,
          customerMessages: false,
          systemUpdates: false,
          paymentReminders: true
        },
        push: {
          lowStock: true,
          expiryAlerts: true,
          customerMessages: true,
          systemUpdates: true,
          paymentReminders: true
        },
        preferences: {
          quietHours: {
            enabled: true,
            startTime: '22:00',
            endTime: '08:00'
          },
          frequency: 'immediate',
          priority: 'medium'
        }
      };

      res.json({
        success: true,
        data: defaultSettings
      });

    } catch (error) {
      console.error('Get notification settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notification settings',
        error: error.message
      });
    }
  }
);

// Save notification settings
router.post('/notification-settings',
  logStoreManagerActivity('update_notification_settings'),
  async (req, res) => {
    try {
      const storeId = req.store._id;
      const settings = req.body;

      console.log('Saving notification settings for store:', storeId);
      console.log('Settings:', JSON.stringify(settings, null, 2));

      // For now, just log the settings
      // In a real implementation, you would save to database

      res.json({
        success: true,
        message: 'Notification settings saved successfully',
        data: settings
      });

    } catch (error) {
      console.error('Save notification settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save notification settings',
        error: error.message
      });
    }
  }
);

// Get business settings
router.get('/business-settings',
  logStoreManagerActivity('view_business_settings'),
  async (req, res) => {
    try {
      const Store = require('../models/Store');
      const storeId = req.store._id;

      const store = await Store.findById(storeId).select('settings');

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found'
        });
      }

      // Extract business settings from store settings
      const businessSettings = {
        // GST Settings
        gstEnabled: store.settings?.gstEnabled ?? true,
        defaultGstRate: store.settings?.defaultTaxRate ?? 18,
        gstNumber: store.settings?.gstNumber ?? '',
        includeTaxInPrice: store.settings?.includeTaxInPrice ?? true,

        // Discount Settings
        allowDiscounts: store.settings?.allowDiscounts ?? true,
        maxDiscountPercent: store.settings?.maxDiscountPercent ?? 50,
        maxDiscountAmountPerBill: store.settings?.maxDiscountAmountPerBill ?? 0,
        requireManagerApproval: store.settings?.requireManagerApproval ?? true,
        discountOnMRP: store.settings?.discountOnMRP ?? true,
        autoApplyDiscounts: store.settings?.autoApplyDiscounts ?? false,
        autoDiscountRules: store.settings?.autoDiscountRules ?? [],

        // Sales Settings
        allowNegativeStock: store.settings?.allowNegativeStock ?? false,
        requirePrescription: store.settings?.requirePrescription ?? true,
        printReceiptByDefault: store.settings?.printReceiptByDefault ?? true,

        // Currency Settings
        currency: store.settings?.currency ?? 'INR',
        currencySymbol: store.settings?.currencySymbol ?? '₹',
        decimalPlaces: store.settings?.decimalPlaces ?? 2,

        // Discount Types - use saved data if exists, otherwise defaults
        discountTypes: (store.settings?.discountTypes && Array.isArray(store.settings.discountTypes))
          ? store.settings.discountTypes
          : [
              { id: 1, name: 'Percentage Discount', type: 'percentage', value: 10, maxValue: 50, isActive: true, description: 'Percentage off on total bill' },
              { id: 2, name: 'Amount Discount', type: 'amount', value: 50, maxValue: 500, isActive: true, description: 'Fixed amount off' },
              { id: 3, name: 'Festival Discount', type: 'festival', value: 15, maxValue: 30, isActive: false, description: 'Special festival offers' },
              { id: 4, name: 'Bulk Discount', type: 'bulk', value: 5, maxValue: 20, isActive: true, description: 'Quantity-based discounts' },
              { id: 5, name: 'Senior Citizen', type: 'customer', value: 10, maxValue: 15, isActive: true, description: 'Senior citizen discount' },
              { id: 6, name: 'Student Discount', type: 'customer', value: 5, maxValue: 10, isActive: false, description: 'Student discount' }
            ],

        // Tax Types - use saved data if exists, otherwise defaults
        taxTypes: (store.settings?.taxTypes && Array.isArray(store.settings.taxTypes))
          ? store.settings.taxTypes
          : [
              { id: 1, name: 'Standard GST', type: 'gst', rate: 18, isActive: true, description: 'Regular GST for medicines', category: 'standard' },
              { id: 2, name: 'Reduced GST', type: 'gst', rate: 5, isActive: true, description: 'Essential medicines GST', category: 'essential' },
              { id: 3, name: 'Zero GST', type: 'gst', rate: 0, isActive: true, description: 'Life-saving drugs', category: 'lifesaving' },
              { id: 4, name: 'CGST', type: 'cgst', rate: 9, isActive: true, description: 'Central GST', category: 'split' },
              { id: 5, name: 'SGST', type: 'sgst', rate: 9, isActive: true, description: 'State GST', category: 'split' },
              { id: 6, name: 'IGST', type: 'igst', rate: 18, isActive: false, description: 'Integrated GST for inter-state', category: 'interstate' }
            ]
      };

      res.json({
        success: true,
        data: businessSettings
      });

    } catch (error) {
      console.error('Get business settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch business settings',
        error: error.message
      });
    }
  }
);

// Save business settings
router.post('/business-settings',
  logStoreManagerActivity('update_business_settings'),
  async (req, res) => {
    try {
      const Store = require('../models/Store');
      const storeId = req.store._id;
      const settings = req.body;

      console.log('Saving business settings for store:', storeId);
      console.log('Settings:', JSON.stringify(settings, null, 2));

      // Validate settings
      if (settings.maxDiscountPercent && (settings.maxDiscountPercent < 0 || settings.maxDiscountPercent > 100)) {
        return res.status(400).json({
          success: false,
          message: 'Maximum discount percentage must be between 0 and 100'
        });
      }

      if (settings.defaultGstRate && (settings.defaultGstRate < 0 || settings.defaultGstRate > 100)) {
        return res.status(400).json({
          success: false,
          message: 'GST rate must be between 0 and 100'
        });
      }

      // Update store settings
      const updateData = {
        'settings.gstEnabled': settings.gstEnabled,
        'settings.defaultTaxRate': settings.defaultGstRate,
        'settings.gstNumber': settings.gstNumber,
        'settings.includeTaxInPrice': settings.includeTaxInPrice,
        'settings.allowDiscounts': settings.allowDiscounts,
        'settings.maxDiscountPercent': settings.maxDiscountPercent,
        'settings.maxDiscountAmountPerBill': settings.maxDiscountAmountPerBill,
        'settings.requireManagerApproval': settings.requireManagerApproval,
        'settings.discountOnMRP': settings.discountOnMRP,
        'settings.autoApplyDiscounts': settings.autoApplyDiscounts,
        'settings.autoDiscountRules': settings.autoDiscountRules,
        'settings.allowNegativeStock': settings.allowNegativeStock,
        'settings.requirePrescription': settings.requirePrescription,
        'settings.printReceiptByDefault': settings.printReceiptByDefault,
        'settings.currency': settings.currency,
        'settings.currencySymbol': settings.currencySymbol,
        'settings.decimalPlaces': settings.decimalPlaces
      };

      // Update discount and tax types if provided
      if (settings.discountTypes) {
        updateData['settings.discountTypes'] = settings.discountTypes;
      }

      if (settings.taxTypes) {
        updateData['settings.taxTypes'] = settings.taxTypes;
      }

      const updatedStore = await Store.findByIdAndUpdate(
        storeId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('settings');

      res.json({
        success: true,
        message: 'Business settings updated successfully',
        data: settings
      });

    } catch (error) {
      console.error('Save business settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save business settings',
        error: error.message
      });
    }
  }
);

// Add new discount type
router.post('/discount-types',
  logStoreManagerActivity('add_discount_type'),
  async (req, res) => {
    try {
      const Store = require('../models/Store');
      const storeId = req.store._id;
      const discountType = req.body;

      // Validate discount type
      if (!discountType.name || !discountType.type || !discountType.value || !discountType.maxValue) {
        return res.status(400).json({
          success: false,
          message: 'Name, type, value, and maxValue are required'
        });
      }

      // Generate unique ID
      discountType.id = Date.now();

      const updatedStore = await Store.findByIdAndUpdate(
        storeId,
        { $push: { 'settings.discountTypes': discountType } },
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: 'Discount type added successfully',
        data: discountType
      });

    } catch (error) {
      console.error('Add discount type error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add discount type',
        error: error.message
      });
    }
  }
);

// Add new tax type
router.post('/tax-types',
  logStoreManagerActivity('add_tax_type'),
  async (req, res) => {
    try {
      const Store = require('../models/Store');
      const storeId = req.store._id;
      const taxType = req.body;

      // Validate tax type
      if (!taxType.name || !taxType.type || taxType.rate === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Name, type, and rate are required'
        });
      }

      // Generate unique ID
      taxType.id = Date.now();

      const updatedStore = await Store.findByIdAndUpdate(
        storeId,
        { $push: { 'settings.taxTypes': taxType } },
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: 'Tax type added successfully',
        data: taxType
      });

    } catch (error) {
      console.error('Add tax type error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add tax type',
        error: error.message
      });
    }
  }
);

// ===================
// WHATSAPP ROUTES
// ===================

// Send WhatsApp message
router.post('/whatsapp/send',
  logStoreManagerActivity('send_whatsapp_message'),
  async (req, res) => {
    try {
      const { method, phoneNumber, message } = req.body;

      if (!phoneNumber || !message) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and message are required'
        });
      }

      // Format phone number (remove any non-digits and ensure it starts with country code)
      let formattedPhone = phoneNumber.replace(/[^0-9]/g, '');

      // Add India country code if it's a 10-digit number
      if (formattedPhone.length === 10) {
        formattedPhone = '91' + formattedPhone;
      }

      // Generate WhatsApp click-to-chat URL
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

      console.log(`Generated WhatsApp click-to-chat URL via ${method}:`, {
        to: formattedPhone,
        originalPhone: phoneNumber,
        messageLength: message.length,
        url: whatsappUrl
      });

      res.json({
        success: true,
        message: 'WhatsApp click-to-chat URL generated successfully',
        data: {
          method,
          phoneNumber: formattedPhone,
          originalPhoneNumber: phoneNumber,
          message,
          whatsappUrl,
          sentAt: new Date()
        }
      });

    } catch (error) {
      console.error('WhatsApp URL generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate WhatsApp URL',
        error: error.message
      });
    }
  }
);

// ===================
// STORE INFO ROUTES
// ===================
router.get('/store-info', (req, res) => {
  const store = req.store;
  res.status(200).json({
    success: true,
    data: {
      id: store._id,
      name: store.name,
      code: store.code,
      address: store.address,
      contact: store.contact,
      business: store.business,
      isActive: store.isActive,
      theme: store.theme
    }
  });
});

// ===================
// RACK MANAGEMENT ROUTES
// ===================

// Rack CRUD routes
router.route('/racks')
  .get(
    checkFeatureAccess('inventory'),
    logStoreManagerActivity('view_racks'),
    getRacks
  )
  .post(
    checkFeatureAccess('inventory'),
    logStoreManagerActivity('create_rack'),
    createRack
  );

router.route('/racks/:id')
  .get(
    checkFeatureAccess('inventory'),
    logStoreManagerActivity('view_rack'),
    getRack
  )
  .put(
    checkFeatureAccess('inventory'),
    logStoreManagerActivity('update_rack'),
    updateRack
  )
  .delete(
    checkFeatureAccess('inventory'),
    logStoreManagerActivity('delete_rack'),
    deleteRack
  );

// Rack layout and occupancy
router.get('/rack-layout/:rackId',
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('view_rack_layout'),
  getRackLayout
);

router.get('/rack-occupancy',
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('view_rack_occupancy'),
  getRackOccupancySummary
);

// Medicine location management routes
router.route('/rack-locations')
  .post(
    checkFeatureAccess('inventory'),
    logStoreManagerActivity('assign_medicine_location'),
    assignMedicineToLocation
  );

router.route('/rack-locations/:id')
  .put(
    checkFeatureAccess('inventory'),
    logStoreManagerActivity('update_location_quantity'),
    updateLocationQuantity
  )
  .delete(
    checkFeatureAccess('inventory'),
    logStoreManagerActivity('remove_medicine_location'),
    removeMedicineFromLocation
  );

router.put('/rack-locations/:id/move',
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('move_medicine_location'),
  moveMedicineLocation
);

// Medicine location search routes (accessible to all staff)
router.get('/medicine-locations/search',
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('search_medicine_locations'),
  searchMedicineLocations
);

// Specific routes must come before parameterized routes
router.get('/medicine-locations/unassigned',
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('view_unassigned_medicines'),
  getUnassignedMedicines
);

router.get('/medicine-locations/:medicineId',
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('view_medicine_locations'),
  getMedicineLocations
);

// ===================
// INVOICE ROUTES
// ===================

// Get invoice for a specific sale
router.get('/sales/:saleId/invoice',
  checkFeatureAccess('sales'),
  async (req, res) => {
    try {
      const SalesInvoice = require('../models/SalesInvoice');
      const Sale = require('../models/Sale');
      const { generateInvoiceHTML, recordInvoicePrint } = require('../utils/invoiceGenerator');

      let invoice = await SalesInvoice.findOne({ sale: req.params.saleId })
        .populate('customer', 'name phone email fullAddress')
        .populate('sale');

      // If no invoice exists, try to generate one for this sale
      if (!invoice) {
        console.log('📋 No invoice found for sale, attempting to generate...');

        const sale = await Sale.findById(req.params.saleId);
        if (!sale) {
          return res.status(404).json({ success: false, message: 'Sale not found' });
        }

        // Check if sale belongs to user's store
        if (sale.store.toString() !== req.store._id.toString()) {
          return res.status(403).json({ success: false, message: 'Access denied' });
        }

        try {
          const { generateInvoiceForSale } = require('../utils/invoiceGenerator');
          invoice = await generateInvoiceForSale(sale, req.user);
          console.log('✅ Invoice generated for existing sale:', invoice.invoiceNumber);

          // Re-fetch with populated fields
          invoice = await SalesInvoice.findById(invoice._id)
            .populate('customer', 'name phone email fullAddress')
            .populate('sale');
        } catch (invoiceError) {
          console.error('❌ Failed to generate invoice for existing sale:', invoiceError);
          return res.status(500).json({ success: false, message: 'Failed to generate invoice for this sale' });
        }
      }

      // Check if invoice belongs to user's store
      if (invoice.store.toString() !== req.store._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      // Check if HTML format is requested
      if (req.query.format === 'html') {
        console.log('🖨️ Generating HTML for invoice:', invoice.invoiceNumber);

        // Record the print/view
        await recordInvoicePrint(invoice._id, req.user, 'reprint');

        const html = generateInvoiceHTML(invoice);
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
      }

      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      console.error('Error fetching invoice:', error);
      res.status(500).json({ success: false, message: 'Error fetching invoice' });
    }
  }
);

// ===================
// CUSTOMER ANALYTICS ROUTES
// ===================

// Get individual customer details
router.get('/customers/:customerId',
  async (req, res) => {
    try {
      const Customer = require('../models/Customer');
      const { customerId } = req.params;

      console.log('👤 Fetching customer details for:', customerId);

      const customer = await Customer.findOne({
        _id: customerId,
        store: req.store._id
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      console.log('✅ Customer found:', customer.name);

      res.status(200).json({
        success: true,
        data: customer
      });

    } catch (error) {
      console.error('❌ Error fetching customer details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer details'
      });
    }
  }
);

// Get customer purchase history
router.get('/customers/:customerId/purchase-history',
  async (req, res) => {
    try {
      const Sale = require('../models/Sale');
      const { customerId } = req.params;

      console.log('📊 Fetching purchase history for customer:', customerId);

      // Get all sales for this customer in this store
      const purchases = await Sale.find({
        customer: customerId,
        store: req.store._id
      })
      .populate('items.medicine', 'name unitTypes stripInfo individualInfo')
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 purchases

      console.log('📋 Found purchases:', purchases.length);

      res.status(200).json({
        success: true,
        data: purchases
      });

    } catch (error) {
      console.error('❌ Error fetching customer purchase history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer purchase history'
      });
    }
  }
);

// Get customer regular medicines (frequently purchased)
router.get('/customers/:customerId/regular-medicines',
  async (req, res) => {
    try {
      const Sale = require('../models/Sale');
      const { customerId } = req.params;

      console.log('💊 Analyzing regular medicines for customer:', customerId);

      // Aggregate pipeline to find frequently purchased medicines
      const regularMedicines = await Sale.aggregate([
        // Match sales for this customer and store
        {
          $match: {
            customer: new (require('mongoose').Types.ObjectId)(customerId),
            store: req.store._id
          }
        },
        // Unwind items array
        { $unwind: '$items' },
        // Group by medicine
        {
          $group: {
            _id: '$items.medicine',
            purchaseCount: { $sum: 1 },
            totalQuantity: { $sum: '$items.quantity' },
            lastPurchased: { $max: '$createdAt' },
            unit: { $first: '$items.unit' }
          }
        },
        // Only include medicines purchased more than once
        { $match: { purchaseCount: { $gte: 2 } } },
        // Sort by purchase count (most frequent first)
        { $sort: { purchaseCount: -1 } },
        // Limit to top 20 regular medicines
        { $limit: 20 },
        // Lookup medicine details
        {
          $lookup: {
            from: 'medicines',
            localField: '_id',
            foreignField: '_id',
            as: 'medicineDetails'
          }
        },
        // Project final structure
        {
          $project: {
            _id: '$_id', // Keep the medicine ObjectId as _id
            name: { $arrayElemAt: ['$medicineDetails.name', 0] },
            purchaseCount: 1,
            totalQuantity: 1,
            lastPurchased: 1,
            unit: 1,
            // Include dual unit configuration
            unitTypes: { $arrayElemAt: ['$medicineDetails.unitTypes', 0] },
            stripInfo: { $arrayElemAt: ['$medicineDetails.stripInfo', 0] },
            individualInfo: { $arrayElemAt: ['$medicineDetails.individualInfo', 0] }
          }
        }
      ]);

      console.log('🔄 Found regular medicines:', regularMedicines.length);

      res.status(200).json({
        success: true,
        data: regularMedicines
      });

    } catch (error) {
      console.error('❌ Error analyzing regular medicines:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze regular medicines'
      });
    }
  }
);

module.exports = router;

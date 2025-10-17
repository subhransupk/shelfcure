const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  getReorderSuggestions,
  generateReorderReport,
  getPurchases,
  getPurchase,
  createPurchase,
  updatePurchase,
  deletePurchase,
  getPurchaseAnalytics,
  getDeliveryTracking,
  recordPurchasePayment,
  getPurchasePaymentHistory,
  validatePONumber
} = require('../controllers/purchaseController');

const {
  getReturnsForPurchase,
  getAvailableItemsForReturn
} = require('../controllers/purchaseReturnController');

const { protect, authorize } = require('../middleware/auth');
const { storeManagerOnly, checkFeatureAccess, logStoreManagerActivity } = require('../middleware/storeManagerAuth');

// Apply authentication and authorization middleware to all routes
router.use(protect);
router.use(authorize('store_manager'));
router.use(storeManagerOnly);

// Validation rules for purchase creation/update
const purchaseValidation = [
  body('supplier')
    .notEmpty()
    .withMessage('Supplier is required')
    .isMongoId()
    .withMessage('Valid supplier ID is required'),
  body('purchaseOrderNumber')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Purchase order number is required and must be less than 50 characters'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.medicineName')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Medicine name is required for each item'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('items.*.unitCost')
    .isFloat({ min: 0 })
    .withMessage('Unit cost must be a positive number'),
  body('items.*.discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),
  body('items.*.taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0 and 100')
];

const purchaseUpdateValidation = [
  body('status')
    .optional()
    .isIn(['draft', 'ordered', 'confirmed', 'shipped', 'received', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  body('paymentStatus')
    .optional()
    .isIn(['pending', 'partial', 'paid', 'overdue'])
    .withMessage('Invalid payment status'),
  body('paidAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Paid amount must be a positive number')
];

const purchasePaymentValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Payment amount must be greater than 0'),
  body('paymentMethod')
    .isIn(['cash', 'card', 'upi', 'bank_transfer', 'check'])
    .withMessage('Invalid payment method'),
  body('transactionId')
    .optional()
    .isString()
    .trim()
    .withMessage('Transaction ID must be a string'),
  body('checkNumber')
    .optional()
    .isString()
    .trim()
    .withMessage('Check number must be a string'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .withMessage('Notes must be a string')
];

// @route   GET /api/store-manager/purchases/reorder-suggestions
// @desc    Get medicines that need reordering
// @access  Private
router.get('/reorder-suggestions',
  checkFeatureAccess('purchases'),
  logStoreManagerActivity('view_reorder_suggestions'),
  getReorderSuggestions
);

// @route   GET /api/store-manager/purchases/reorder-report
// @desc    Generate reorder report for print/export
// @access  Private
router.get('/reorder-report',
  checkFeatureAccess('purchases'),
  logStoreManagerActivity('generate_reorder_report'),
  generateReorderReport
);

// @route   GET /api/store-manager/purchases/deliveries
// @desc    Get delivery tracking information
// @access  Private
router.get('/deliveries',
  checkFeatureAccess('purchases'),
  logStoreManagerActivity('view_delivery_tracking'),
  getDeliveryTracking
);

// @route   POST /api/store-manager/purchases/send-reorder-whatsapp
// @desc    Send reorder list via WhatsApp to supplier
// @access  Private
router.post('/send-reorder-whatsapp',
  checkFeatureAccess('purchases'),
  logStoreManagerActivity('send_reorder_whatsapp'),
  async (req, res) => {
    try {
      const { supplierId, items, phoneNumber, customMessage } = req.body;
      const store = req.store;

      if (!phoneNumber || !items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and items are required'
        });
      }

      // Format the reorder message
      let message = `🏥 *Reorder Request from ${store.name}*\n\n`;
      message += `Dear Supplier,\n\n`;
      message += `We would like to place a reorder for the following medicines:\n\n`;

      items.forEach((item, index) => {
        message += `${index + 1}. *${item.medicineName || item.name}*\n`;
        if (item.stripSuggestion) {
          message += `   • Strips: ${item.stripSuggestion.suggestedQuantity} units\n`;
        }
        if (item.individualSuggestion) {
          message += `   • Individual: ${item.individualSuggestion.suggestedQuantity} units\n`;
        }
        if (item.quantity) {
          message += `   • Quantity: ${item.quantity} ${item.unit || 'units'}\n`;
        }
        if (item.manufacturer) {
          message += `   • Manufacturer: ${item.manufacturer}\n`;
        }
        if (item.lastPurchasePrice) {
          message += `   • Last Price: ₹${item.lastPurchasePrice}\n`;
        }
        message += `\n`;
      });

      if (customMessage) {
        message += `*Additional Notes:*\n${customMessage}\n\n`;
      }

      message += `Please confirm availability and pricing.\n\nThank you! 🙏`;

      // Use existing WhatsApp integration
      const whatsappResponse = await fetch(`${req.protocol}://${req.get('host')}/api/store-manager/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Authorization': req.headers.authorization,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          method: 'click-to-chat', // Default method
          phoneNumber,
          message
        })
      });

      if (whatsappResponse.ok) {
        const whatsappData = await whatsappResponse.json();

        res.json({
          success: true,
          message: 'WhatsApp click-to-chat URL generated successfully',
          data: {
            phoneNumber: whatsappData.data?.phoneNumber || phoneNumber,
            originalPhoneNumber: phoneNumber,
            itemCount: items.length,
            whatsappUrl: whatsappData.data?.whatsappUrl,
            message: whatsappData.data?.message || message,
            sentAt: new Date()
          }
        });
      } else {
        const errorData = await whatsappResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to generate WhatsApp URL');
      }

    } catch (error) {
      console.error('Send reorder WhatsApp error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send reorder list via WhatsApp'
      });
    }
  }
);

// @route   GET /api/store-manager/purchases/validate-po-number
// @desc    Validate purchase order number for duplicates
// @access  Private
router.get('/validate-po-number',
  checkFeatureAccess('purchases'),
  validatePONumber
);

// @route   GET /api/store-manager/purchases/analytics
// @desc    Get purchase analytics
// @access  Private
router.get('/analytics',
  checkFeatureAccess('analytics'),
  getPurchaseAnalytics
);

// @route   GET /api/store-manager/purchases
// @desc    Get all purchases for store
// @access  Private
router.get('/',
  checkFeatureAccess('purchases'),
  logStoreManagerActivity('view_purchases'),
  getPurchases
);

// @route   POST /api/store-manager/purchases
// @desc    Create new purchase
// @access  Private
router.post('/', 
  checkFeatureAccess('purchases'),
  purchaseValidation,
  logStoreManagerActivity('create_purchase'),
  createPurchase
);

// @route   POST /api/store-manager/purchases/:id/payment
// @desc    Record payment for purchase
// @access  Private
router.post('/:id/payment',
  checkFeatureAccess('purchases'),
  purchasePaymentValidation,
  logStoreManagerActivity('record_purchase_payment'),
  recordPurchasePayment
);

// @route   GET /api/store-manager/purchases/:id/payment-history
// @desc    Get payment history for purchase
// @access  Private
router.get('/:id/payment-history',
  checkFeatureAccess('purchases'),
  logStoreManagerActivity('view_purchase_payment_history'),
  getPurchasePaymentHistory
);

// @route   GET /api/store-manager/purchases/:id
// @desc    Get single purchase
// @access  Private
router.get('/:id',
  checkFeatureAccess('purchases'),
  getPurchase
);

// @route   PUT /api/store-manager/purchases/:id
// @desc    Update purchase
// @access  Private
router.put('/:id',
  checkFeatureAccess('purchases'),
  purchaseUpdateValidation,
  logStoreManagerActivity('update_purchase'),
  updatePurchase
);

// @route   DELETE /api/store-manager/purchases/:id
// @desc    Delete purchase
// @access  Private
router.delete('/:id',
  checkFeatureAccess('purchases'),
  logStoreManagerActivity('delete_purchase'),
  deletePurchase
);

// @route   GET /api/store-manager/purchases/:purchaseId/returns
// @desc    Get all returns for a specific purchase
// @access  Private
router.get('/:purchaseId/returns',
  checkFeatureAccess('purchases'),
  logStoreManagerActivity('view_purchase_returns'),
  getReturnsForPurchase
);

// @route   GET /api/store-manager/purchases/:purchaseId/available-for-return
// @desc    Get available items for return from a specific purchase
// @access  Private
router.get('/:purchaseId/available-for-return',
  checkFeatureAccess('purchases'),
  logStoreManagerActivity('view_available_return_items'),
  getAvailableItemsForReturn
);

module.exports = router;

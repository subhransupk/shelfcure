const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  getPurchaseReturns,
  getPurchaseReturn,
  getReturnsForPurchase,
  validatePurchaseReturnEligibility,
  getAvailableItemsForReturn,
  createPurchaseReturn,
  updatePurchaseReturn,
  processInventoryUpdates
} = require('../controllers/purchaseReturnController');

const { protect, authorize } = require('../middleware/auth');
const { storeManagerOnly, checkFeatureAccess, logStoreManagerActivity } = require('../middleware/storeManagerAuth');

// Apply authentication and authorization middleware to all routes
router.use(protect);
router.use(authorize('store_manager'));
router.use(storeManagerOnly);

// Validation middleware for creating purchase returns
const createPurchaseReturnValidation = [
  body('originalPurchaseId')
    .notEmpty()
    .withMessage('Original purchase ID is required')
    .isMongoId()
    .withMessage('Invalid purchase ID format'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  
  body('items.*.originalPurchaseItem')
    .notEmpty()
    .withMessage('Original purchase item ID is required')
    .isMongoId()
    .withMessage('Invalid purchase item ID format'),
  
  body('items.*.returnQuantity')
    .isInt({ min: 1 })
    .withMessage('Return quantity must be a positive integer'),
  
  body('items.*.itemReturnReason')
    .optional()
    .isIn(['damaged_goods', 'wrong_item', 'expired', 'quality_issue', 'overstock', 'supplier_error', 'other'])
    .withMessage('Invalid item return reason'),
  
  body('returnReason')
    .notEmpty()
    .withMessage('Return reason is required')
    .isIn(['damaged_goods', 'wrong_delivery', 'quality_issues', 'expired_products', 'overstock', 'supplier_error', 'other'])
    .withMessage('Invalid return reason'),
  
  body('returnReasonDetails')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Return reason details cannot exceed 500 characters'),
  
  body('refundMethod')
    .optional()
    .isIn(['credit_note', 'bank_transfer', 'cash', 'adjustment', 'replacement'])
    .withMessage('Invalid refund method'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

// Validation middleware for updating purchase returns
const updatePurchaseReturnValidation = [
  body('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'processed', 'completed'])
    .withMessage('Invalid status'),
  
  body('approvalNotes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Approval notes cannot exceed 500 characters'),
  
  body('refundMethod')
    .optional()
    .isIn(['credit_note', 'bank_transfer', 'cash', 'adjustment', 'replacement'])
    .withMessage('Invalid refund method'),
  
  body('refundReference')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Refund reference cannot exceed 100 characters'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

// @route   GET /api/store-manager/purchase-returns
// @desc    Get all purchase returns for store
// @access  Private
router.get('/',
  checkFeatureAccess('purchases'),
  logStoreManagerActivity('view_purchase_returns'),
  getPurchaseReturns
);

// @route   GET /api/store-manager/purchase-returns/:id
// @desc    Get a specific purchase return
// @access  Private
router.get('/:id',
  checkFeatureAccess('purchases'),
  logStoreManagerActivity('view_purchase_return_details'),
  getPurchaseReturn
);

// @route   POST /api/store-manager/purchase-returns/validate
// @desc    Validate purchase return eligibility
// @access  Private
router.post('/validate',
  checkFeatureAccess('purchases'),
  logStoreManagerActivity('validate_purchase_return'),
  validatePurchaseReturnEligibility
);

// @route   POST /api/store-manager/purchase-returns
// @desc    Create a new purchase return
// @access  Private
router.post('/',
  checkFeatureAccess('purchases'),
  createPurchaseReturnValidation,
  logStoreManagerActivity('create_purchase_return'),
  createPurchaseReturn
);

// @route   PUT /api/store-manager/purchase-returns/:id
// @desc    Update purchase return
// @access  Private
router.put('/:id',
  checkFeatureAccess('purchases'),
  updatePurchaseReturnValidation,
  logStoreManagerActivity('update_purchase_return'),
  updatePurchaseReturn
);

// @route   POST /api/store-manager/purchase-returns/:id/process-inventory
// @desc    Manually process inventory restoration for a completed purchase return
// @access  Private
router.post('/:id/process-inventory',
  checkFeatureAccess('inventory'),
  logStoreManagerActivity('process_purchase_return_inventory'),
  async (req, res) => {
    try {
      const store = req.store;
      const user = req.user;
      const returnId = req.params.id;

      const PurchaseReturn = require('../models/PurchaseReturn');
      const purchaseReturn = await PurchaseReturn.findOne({
        _id: returnId,
        store: store._id
      });

      if (!purchaseReturn) {
        return res.status(404).json({
          success: false,
          message: 'Purchase return not found'
        });
      }

      if (purchaseReturn.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Purchase return must be completed to process inventory restoration'
        });
      }

      if (purchaseReturn.inventoryRestorationStatus === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Inventory restoration has already been processed for this return'
        });
      }

      // Process inventory updates
      await processInventoryUpdates(purchaseReturn, user._id);

      res.status(200).json({
        success: true,
        message: 'Inventory restoration processed successfully',
        data: {
          returnNumber: purchaseReturn.returnNumber,
          inventoryRestorationStatus: purchaseReturn.inventoryRestorationStatus
        }
      });

    } catch (error) {
      console.error('Process inventory restoration error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to process inventory restoration'
      });
    }
  }
);

// @route   GET /api/store-manager/purchase-returns/:id/debug
// @desc    Debug purchase return inventory status
// @access  Private
router.get('/:id/debug',
  checkFeatureAccess('purchases'),
  logStoreManagerActivity('debug_purchase_return'),
  async (req, res) => {
    try {
      const store = req.store;
      const returnId = req.params.id;

      const PurchaseReturn = require('../models/PurchaseReturn');
      const Medicine = require('../models/Medicine');

      const purchaseReturn = await PurchaseReturn.findOne({
        _id: returnId,
        store: store._id
      }).populate('items.medicine');

      if (!purchaseReturn) {
        return res.status(404).json({
          success: false,
          message: 'Purchase return not found'
        });
      }

      const debugInfo = {
        returnNumber: purchaseReturn.returnNumber,
        status: purchaseReturn.status,
        inventoryRestorationStatus: purchaseReturn.inventoryRestorationStatus,
        items: []
      };

      for (const item of purchaseReturn.items) {
        if (item.medicine) {
          const medicine = await Medicine.findById(item.medicine);
          debugInfo.items.push({
            medicineName: medicine?.name || item.medicineName,
            returnQuantity: item.returnQuantity,
            unitType: item.unitType,
            removeFromInventory: item.removeFromInventory,
            inventoryUpdated: item.inventoryUpdated,
            currentStripStock: medicine?.stripInfo?.stock,
            currentIndividualStock: medicine?.individualInfo?.stock,
            currentLegacyStock: medicine?.stock,
            unitTypes: medicine?.unitTypes
          });
        }
      }

      res.status(200).json({
        success: true,
        data: debugInfo
      });

    } catch (error) {
      console.error('Debug purchase return error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to debug purchase return'
      });
    }
  }
);

module.exports = router;

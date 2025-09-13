const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const MedicineRequest = require('../models/MedicineRequest');
const { protect, authorize } = require('../middleware/auth');
const { storeManagerOnly, checkFeatureAccess, logStoreManagerActivity } = require('../middleware/storeManagerAuth');

// Apply authentication and authorization middleware to all routes
router.use(protect);
router.use(authorize('store_manager'));
router.use(storeManagerOnly);

// Validation middleware
const medicineRequestValidation = [
  body('medicineName')
    .trim()
    .notEmpty()
    .withMessage('Medicine name is required')
    .isLength({ max: 100 })
    .withMessage('Medicine name cannot be more than 100 characters'),
  body('manufacturer')
    .trim()
    .notEmpty()
    .withMessage('Manufacturer/brand is required')
    .isLength({ max: 100 })
    .withMessage('Manufacturer name cannot be more than 100 characters'),
  body('composition')
    .trim()
    .notEmpty()
    .withMessage('Composition/generic name is required')
    .isLength({ max: 200 })
    .withMessage('Composition cannot be more than 200 characters'),
  body('strength')
    .trim()
    .notEmpty()
    .withMessage('Strength/dosage is required')
    .isLength({ max: 50 })
    .withMessage('Strength cannot be more than 50 characters'),
  body('packSize')
    .trim()
    .notEmpty()
    .withMessage('Pack size is required')
    .isLength({ max: 50 })
    .withMessage('Pack size cannot be more than 50 characters'),
  body('requestedQuantity')
    .isInt({ min: 1 })
    .withMessage('Requested quantity must be at least 1'),
  body('unitType')
    .optional()
    .isIn(['strip', 'box', 'bottle', 'piece', 'vial', 'tube', 'packet'])
    .withMessage('Invalid unit type'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('category')
    .optional()
    .isIn([
      'Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Cream', 'Ointment',
      'Powder', 'Inhaler', 'Spray', 'Gel', 'Lotion', 'Solution', 'Suspension',
      'Patch', 'Suppository', 'Other'
    ])
    .withMessage('Invalid category'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot be more than 1000 characters'),
  body('supplierInfo.name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Supplier name cannot be more than 100 characters'),
  body('supplierInfo.contactPerson')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Contact person name cannot be more than 100 characters'),
  body('supplierInfo.phone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]{10,15}$/)
    .withMessage('Please enter a valid phone number'),
  body('supplierInfo.email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address'),
  body('supplierInfo.address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot be more than 500 characters'),
  body('estimatedCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated cost must be a positive number'),
  body('urgencyReason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Urgency reason cannot be more than 200 characters')
];

// @route   GET /api/store-manager/medicine-requests
// @desc    Get all medicine requests for the store
// @access  Private
router.get('/',
  checkFeatureAccess('purchases'),
  logStoreManagerActivity('view_medicine_requests'),
  async (req, res) => {
    try {
      const store = req.store;
      const { status, priority, page = 1, limit = 20, search } = req.query;

      // Build query
      const query = { store: store._id };
      
      if (status) {
        query.status = status;
      }
      
      if (priority) {
        query.priority = priority;
      }

      if (search) {
        query.$or = [
          { medicineName: { $regex: search, $options: 'i' } },
          { manufacturer: { $regex: search, $options: 'i' } },
          { composition: { $regex: search, $options: 'i' } }
        ];
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get requests with pagination
      const requests = await MedicineRequest.find(query)
        .populate('requestedBy', 'name email')
        .populate('approvedBy', 'name email')
        .populate('purchaseOrder', 'purchaseOrderNumber status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count for pagination
      const total = await MedicineRequest.countDocuments(query);

      res.json({
        success: true,
        data: requests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching medicine requests:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching medicine requests'
      });
    }
  }
);

// @route   POST /api/store-manager/medicine-requests
// @desc    Create a new medicine request
// @access  Private
router.post('/',
  checkFeatureAccess('purchases'),
  medicineRequestValidation,
  logStoreManagerActivity('create_medicine_request'),
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const store = req.store;
      const storeManager = req.user;

      // Create medicine request
      const medicineRequest = await MedicineRequest.create({
        ...req.body,
        store: store._id,
        requestedBy: storeManager._id
      });

      // Populate the created request
      await medicineRequest.populate('requestedBy', 'name email');

      res.status(201).json({
        success: true,
        data: medicineRequest,
        message: 'Medicine request created successfully'
      });
    } catch (error) {
      console.error('Error creating medicine request:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating medicine request'
      });
    }
  }
);

// @route   GET /api/store-manager/medicine-requests/:id
// @desc    Get a single medicine request
// @access  Private
router.get('/:id',
  checkFeatureAccess('purchases'),
  logStoreManagerActivity('view_medicine_request'),
  async (req, res) => {
    try {
      const store = req.store;
      const request = await MedicineRequest.findOne({
        _id: req.params.id,
        store: store._id
      })
        .populate('requestedBy', 'name email')
        .populate('approvedBy', 'name email')
        .populate('purchaseOrder', 'purchaseOrderNumber status');

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Medicine request not found'
        });
      }

      res.json({
        success: true,
        data: request
      });
    } catch (error) {
      console.error('Error fetching medicine request:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching medicine request'
      });
    }
  }
);

// @route   PUT /api/store-manager/medicine-requests/:id
// @desc    Update a medicine request
// @access  Private
router.put('/:id',
  checkFeatureAccess('purchases'),
  medicineRequestValidation,
  logStoreManagerActivity('update_medicine_request'),
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const store = req.store;
      const request = await MedicineRequest.findOne({
        _id: req.params.id,
        store: store._id
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Medicine request not found'
        });
      }

      // Update the request
      Object.assign(request, req.body);
      await request.save();

      // Populate the updated request
      await request.populate('requestedBy', 'name email');
      await request.populate('approvedBy', 'name email');

      res.json({
        success: true,
        data: request,
        message: 'Medicine request updated successfully'
      });
    } catch (error) {
      console.error('Error updating medicine request:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating medicine request'
      });
    }
  }
);

// @route   DELETE /api/store-manager/medicine-requests/:id
// @desc    Delete a medicine request
// @access  Private
router.delete('/:id',
  checkFeatureAccess('purchases'),
  logStoreManagerActivity('delete_medicine_request'),
  async (req, res) => {
    try {
      const store = req.store;
      const request = await MedicineRequest.findOne({
        _id: req.params.id,
        store: store._id
      });

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Medicine request not found'
        });
      }

      // Only allow deletion of pending requests
      if (request.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending requests can be deleted'
        });
      }

      await MedicineRequest.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: 'Medicine request deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting medicine request:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting medicine request'
      });
    }
  }
);

module.exports = router;

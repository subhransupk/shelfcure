const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Import controllers
const {
  processPurchaseBill,
  processPrescription,
  createPurchaseFromOCR,
  addPrescriptionToCart
} = require('../controllers/ocrController');

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const {
  storeManagerOnly,
  logStoreManagerActivity
} = require('../middleware/storeManagerAuth');

// Configure multer for OCR document uploads
const ocrStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join('uploads', 'ocr');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `ocr-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const ocrUpload = multer({
  storage: ocrStorage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || `${10 * 1024 * 1024}`, 10) },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.includes('image') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image (JPG, PNG) or PDF files are allowed for OCR processing'));
    }
  }
});

// Apply authentication and authorization middleware to all routes
router.use(protect);
router.use(storeManagerOnly);

// ===================
// OCR PROCESSING ROUTES
// ===================

/**
 * @route   POST /api/store-manager/ocr/purchase-bill
 * @desc    Process purchase bill using OCR
 * @access  Private (Store Manager only)
 */
router.post('/purchase-bill',
  ocrUpload.single('bill'),
  logStoreManagerActivity('ocr_purchase_bill'),
  processPurchaseBill
);

/**
 * @route   POST /api/store-manager/ocr/prescription
 * @desc    Process prescription using OCR
 * @access  Private (Store Manager only)
 */
router.post('/prescription',
  ocrUpload.single('prescription'),
  logStoreManagerActivity('ocr_prescription'),
  processPrescription
);

/**
 * @route   POST /api/store-manager/ocr/create-purchase
 * @desc    Create purchase order from OCR processed data
 * @access  Private (Store Manager only)
 */
router.post('/create-purchase',
  logStoreManagerActivity('create_purchase_from_ocr'),
  createPurchaseFromOCR
);

/**
 * @route   POST /api/store-manager/ocr/add-to-cart
 * @desc    Add prescription medicines to sales cart
 * @access  Private (Store Manager only)
 */
router.post('/add-to-cart',
  logStoreManagerActivity('add_prescription_to_cart'),
  addPrescriptionToCart
);

// Test route
router.get('/test', (req, res) => {
  res.json({
    message: 'OCR routes working!',
    features: [
      'Purchase Bill OCR Processing',
      'Prescription OCR Processing',
      'Automatic Purchase Order Creation',
      'Sales Cart Population'
    ]
  });
});

module.exports = router;

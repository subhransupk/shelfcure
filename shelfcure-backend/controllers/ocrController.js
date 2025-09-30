const ocrService = require('../services/ocrService');
const Medicine = require('../models/Medicine');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const fs = require('fs').promises;
const path = require('path');

/**
 * @desc    Process purchase bill OCR
 * @route   POST /api/store-manager/ocr/purchase-bill
 * @access  Private (Store Manager only)
 */
const processPurchaseBill = async (req, res) => {
  try {
    console.log('🧾 Processing purchase bill OCR');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a purchase bill file (PDF, JPG, PNG)'
      });
    }

    const { path: filePath, mimetype } = req.file;
    const store = req.store;

    // Process OCR
    const ocrResult = await ocrService.processDocument(filePath, mimetype);
    
    if (!ocrResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to extract text from document'
      });
    }

    // Parse purchase bill data
    console.log('📋 Parsing OCR text of length:', ocrResult.text.length);
    const billData = ocrService.parsePurchaseBill(ocrResult.text);
    console.log('📊 Parsed bill data:', {
      supplier: billData.supplier.name,
      medicines: billData.medicines.length,
      totalAmount: billData.totals.totalAmount
    });

    // Try to match supplier
    let matchedSupplier = null;
    if (billData.supplier.name) {
      matchedSupplier = await Supplier.findOne({
        store: store._id,
        $or: [
          { name: new RegExp(billData.supplier.name, 'i') },
          { phone: billData.supplier.phone }
        ]
      });
      console.log('🏢 Supplier match result:', matchedSupplier ? 'Found' : 'Not found');
    }

    // Try to match medicines with existing inventory
    const matchedMedicines = [];
    console.log('💊 Matching medicines with inventory...');
    for (const medicine of billData.medicines) {
      console.log(`🔍 Searching for medicine: ${medicine.name}`);
      const matches = await Medicine.find({
        store: store._id,
        $or: [
          { name: new RegExp(medicine.name, 'i') },
          { genericName: new RegExp(medicine.name, 'i') }
        ]
      }).limit(5);

      console.log(`📦 Found ${matches.length} matches for ${medicine.name}`);
      matchedMedicines.push({
        extracted: medicine,
        matches: matches.map(m => ({
          _id: m._id,
          name: m.name,
          genericName: m.genericName,
          manufacturer: m.manufacturer,
          category: m.category,
          currentStock: {
            strips: m.stripInfo?.stock || 0,
            individual: m.individualInfo?.stock || 0
          }
        }))
      });
    }

    // Clean up uploaded file
    try {
      await fs.unlink(filePath);
    } catch (cleanupError) {
      console.warn('Warning: Could not clean up uploaded file:', cleanupError.message);
    }

    res.status(200).json({
      success: true,
      data: {
        ocrResult: {
          confidence: ocrResult.confidence,
          processedAt: ocrResult.processedAt
        },
        billData,
        matchedSupplier,
        matchedMedicines,
        suggestions: {
          createNewSupplier: !matchedSupplier && billData.supplier.name,
          reviewMedicineMatches: matchedMedicines.filter(m => m.matches.length === 0).length > 0
        }
      }
    });

  } catch (error) {
    console.error('Purchase bill OCR error:', error);
    
    // Clean up file on error
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('Warning: Could not clean up uploaded file on error:', cleanupError.message);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process purchase bill',
      error: error.message
    });
  }
};

/**
 * @desc    Process prescription OCR
 * @route   POST /api/store-manager/ocr/prescription
 * @access  Private (Store Manager only)
 */
const processPrescription = async (req, res) => {
  try {
    console.log('💊 Processing prescription OCR');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a prescription file (PDF, JPG, PNG)'
      });
    }

    const { path: filePath, mimetype } = req.file;
    const store = req.store;

    // Process OCR
    const ocrResult = await ocrService.processDocument(filePath, mimetype);
    
    if (!ocrResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to extract text from prescription'
      });
    }

    // Parse prescription data
    const prescriptionData = ocrService.parsePrescription(ocrResult.text);

    // Try to match medicines with existing inventory
    const matchedMedicines = [];
    const unavailableMedicines = [];

    for (const medicine of prescriptionData.medicines) {
      const matches = await Medicine.find({
        store: store._id,
        $or: [
          { name: new RegExp(medicine.name, 'i') },
          { genericName: new RegExp(medicine.name, 'i') }
        ]
      }).limit(5);

      if (matches.length > 0) {
        // Find best match (exact name match preferred)
        const exactMatch = matches.find(m => 
          m.name.toLowerCase() === medicine.name.toLowerCase()
        );
        const bestMatch = exactMatch || matches[0];

        // Check stock availability
        const stripStock = bestMatch.stripInfo?.stock || 0;
        const individualStock = bestMatch.individualInfo?.stock || 0;
        const hasStock = stripStock > 0 || individualStock > 0;

        matchedMedicines.push({
          extracted: medicine,
          matched: {
            _id: bestMatch._id,
            name: bestMatch.name,
            genericName: bestMatch.genericName,
            manufacturer: bestMatch.manufacturer,
            category: bestMatch.category,
            pricing: {
              stripPrice: bestMatch.stripInfo?.sellingPrice || 0,
              individualPrice: bestMatch.individualInfo?.sellingPrice || 0
            },
            stock: {
              strips: stripStock,
              individual: individualStock,
              hasStock
            },
            unitTypes: bestMatch.unitTypes
          },
          alternatives: matches.slice(0, 3).map(m => ({
            _id: m._id,
            name: m.name,
            genericName: m.genericName,
            manufacturer: m.manufacturer
          }))
        });
      } else {
        unavailableMedicines.push(medicine);
      }
    }

    // Clean up uploaded file
    try {
      await fs.unlink(filePath);
    } catch (cleanupError) {
      console.warn('Warning: Could not clean up uploaded file:', cleanupError.message);
    }

    res.status(200).json({
      success: true,
      data: {
        ocrResult: {
          confidence: ocrResult.confidence,
          processedAt: ocrResult.processedAt
        },
        prescriptionData,
        matchedMedicines,
        unavailableMedicines,
        summary: {
          totalMedicines: prescriptionData.medicines.length,
          availableMedicines: matchedMedicines.length,
          unavailableMedicines: unavailableMedicines.length,
          lowStockWarnings: matchedMedicines.filter(m => !m.matched.stock.hasStock).length
        }
      }
    });

  } catch (error) {
    console.error('Prescription OCR error:', error);
    
    // Clean up file on error
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('Warning: Could not clean up uploaded file on error:', cleanupError.message);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process prescription',
      error: error.message
    });
  }
};

/**
 * @desc    Create purchase order from OCR data
 * @route   POST /api/store-manager/ocr/create-purchase
 * @access  Private (Store Manager only)
 */
const createPurchaseFromOCR = async (req, res) => {
  try {
    console.log('📦 Creating purchase order from OCR data');
    
    const {
      billData,
      selectedSupplier,
      confirmedMedicines,
      purchaseOrderNumber
    } = req.body;

    const store = req.store;
    const user = req.user;

    // Validate required data
    if (!billData || !confirmedMedicines || !Array.isArray(confirmedMedicines)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase data provided'
      });
    }

    // Process medicines for purchase order
    const purchaseItems = [];
    let subtotal = 0;

    for (const item of confirmedMedicines) {
      const {
        medicineId,
        medicineName,
        quantity,
        unitType,
        unitPrice,
        batchNumber,
        expiryDate
      } = item;

      const totalPrice = quantity * unitPrice;
      subtotal += totalPrice;

      purchaseItems.push({
        medicine: medicineId || null,
        medicineName: medicineName,
        quantity: parseInt(quantity),
        unitType: unitType || 'strip',
        unitPrice: parseFloat(unitPrice),
        totalCost: totalPrice,
        batchNumber: batchNumber || '',
        expiryDate: expiryDate ? new Date(expiryDate) : null
      });
    }

    // Calculate totals
    const gstRate = billData.gst?.rate || 18;
    const gstAmount = (subtotal * gstRate) / 100;
    const totalAmount = subtotal + gstAmount;

    // Create purchase order
    const purchaseData = {
      store: store._id,
      supplier: selectedSupplier || null,
      purchaseOrderNumber: purchaseOrderNumber || `PO-${Date.now()}`,
      invoiceNumber: billData.billNumber || '',
      items: purchaseItems,
      subtotal,
      totalTax: gstAmount,
      totalAmount,
      paymentMethod: 'credit',
      status: 'received', // Mark as received since we have the bill
      notes: `Created from OCR processed bill. Original confidence: ${billData.confidence || 'N/A'}%`,
      createdBy: user._id,
      inventoryUpdated: false // Will be updated separately
    };

    const purchase = await Purchase.create(purchaseData);

    // Update inventory for medicines with IDs
    for (const item of purchaseItems) {
      if (item.medicine) {
        const medicine = await Medicine.findById(item.medicine);
        if (medicine) {
          if (item.unitType === 'strip') {
            medicine.stripInfo.stock += item.quantity;
            medicine.inventory.stripQuantity += item.quantity;
          } else {
            medicine.individualInfo.stock += item.quantity;
            medicine.inventory.individualQuantity += item.quantity;
          }
          
          // Update batch information if provided
          if (item.batchNumber || item.expiryDate) {
            if (!medicine.batches) medicine.batches = [];
            medicine.batches.push({
              batchNumber: item.batchNumber,
              expiryDate: item.expiryDate,
              quantity: item.quantity,
              unitType: item.unitType
            });
          }

          await medicine.save();
        }
      }
    }

    // Mark inventory as updated
    purchase.inventoryUpdated = true;
    purchase.inventoryUpdateDate = new Date();
    purchase.inventoryUpdateBy = user._id;
    await purchase.save();

    const populatedPurchase = await Purchase.findById(purchase._id)
      .populate('supplier', 'name phone email')
      .populate('items.medicine', 'name genericName manufacturer');

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully from OCR data',
      data: populatedPurchase
    });

  } catch (error) {
    console.error('Create purchase from OCR error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create purchase order',
      error: error.message
    });
  }
};

/**
 * @desc    Add prescription medicines to sales cart
 * @route   POST /api/store-manager/ocr/add-to-cart
 * @access  Private (Store Manager only)
 */
const addPrescriptionToCart = async (req, res) => {
  try {
    console.log('🛒 Adding prescription medicines to cart');
    
    const {
      prescriptionData,
      selectedMedicines,
      customerId
    } = req.body;

    const store = req.store;

    // Validate required data
    if (!selectedMedicines || !Array.isArray(selectedMedicines)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid medicine selection provided'
      });
    }

    // Process selected medicines for cart
    const cartItems = [];
    const warnings = [];

    for (const item of selectedMedicines) {
      const {
        medicineId,
        quantity,
        unitType
      } = item;

      // Get medicine details
      const medicine = await Medicine.findById(medicineId);
      if (!medicine) {
        warnings.push(`Medicine with ID ${medicineId} not found`);
        continue;
      }

      // Check stock availability
      const availableStock = unitType === 'strip' 
        ? medicine.stripInfo?.stock || 0
        : medicine.individualInfo?.stock || 0;

      if (availableStock < quantity) {
        warnings.push(`Insufficient stock for ${medicine.name}. Available: ${availableStock}, Requested: ${quantity}`);
      }

      // Get pricing
      const unitPrice = unitType === 'strip'
        ? medicine.stripInfo?.sellingPrice || 0
        : medicine.individualInfo?.sellingPrice || 0;

      cartItems.push({
        medicine: {
          _id: medicine._id,
          name: medicine.name,
          genericName: medicine.genericName,
          manufacturer: medicine.manufacturer,
          category: medicine.category
        },
        quantity: parseInt(quantity),
        unitType,
        unitPrice,
        totalPrice: quantity * unitPrice,
        availableStock,
        hasStock: availableStock >= quantity
      });
    }

    // Get customer details if provided
    let customer = null;
    if (customerId) {
      customer = await Customer.findById(customerId).select('name phone email');
    }

    res.status(200).json({
      success: true,
      message: 'Prescription medicines processed for cart',
      data: {
        cartItems,
        customer,
        prescriptionData: {
          doctor: prescriptionData.doctor,
          patient: prescriptionData.patient,
          date: prescriptionData.date
        },
        summary: {
          totalItems: cartItems.length,
          totalAmount: cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
          itemsWithStock: cartItems.filter(item => item.hasStock).length,
          itemsOutOfStock: cartItems.filter(item => !item.hasStock).length
        },
        warnings
      }
    });

  } catch (error) {
    console.error('Add prescription to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process prescription for cart',
      error: error.message
    });
  }
};

module.exports = {
  processPurchaseBill,
  processPrescription,
  createPurchaseFromOCR,
  addPrescriptionToCart
};

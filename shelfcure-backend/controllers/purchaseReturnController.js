const { validationResult } = require('express-validator');
const PurchaseReturn = require('../models/PurchaseReturn');
const Purchase = require('../models/Purchase');
const Medicine = require('../models/Medicine');

// @desc    Get all purchase returns for a store
// @route   GET /api/store-manager/purchase-returns
// @access  Private (Store Manager only)
const getPurchaseReturns = async (req, res) => {
  try {
    const store = req.store;
    const {
      status,
      returnReason,
      refundStatus,
      supplier,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      sortBy = 'returnDate',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { store: store._id };

    if (status) {
      query.status = status;
    }

    if (returnReason) {
      query.returnReason = returnReason;
    }

    if (refundStatus) {
      query.refundStatus = refundStatus;
    }

    if (supplier) {
      query.supplier = supplier;
    }

    if (startDate || endDate) {
      query.returnDate = {};
      if (startDate) query.returnDate.$gte = new Date(startDate);
      if (endDate) query.returnDate.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { returnNumber: { $regex: search, $options: 'i' } },
        { returnReasonDetails: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [returns, total] = await Promise.all([
      PurchaseReturn.find(query)
        .populate('originalPurchase', 'purchaseOrderNumber invoiceNumber purchaseDate totalAmount')
        .populate('supplier', 'name contactPerson phone email')
        .populate('items.medicine', 'name genericName')
        .populate('processedBy', 'name')
        .populate('approvedBy', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      PurchaseReturn.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: returns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error getting purchase returns:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get purchase returns'
    });
  }
};

// @desc    Get a specific purchase return
// @route   GET /api/store-manager/purchase-returns/:id
// @access  Private (Store Manager only)
const getPurchaseReturn = async (req, res) => {
  try {
    const store = req.store;
    const returnId = req.params.id;

    const purchaseReturn = await PurchaseReturn.findOne({
      _id: returnId,
      store: store._id
    })
      .populate('originalPurchase')
      .populate('supplier', 'name contactPerson phone email address')
      .populate('items.medicine', 'name genericName manufacturer')
      .populate('processedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('createdBy', 'name email');

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,
        message: 'Purchase return not found'
      });
    }

    res.status(200).json({
      success: true,
      data: purchaseReturn
    });

  } catch (error) {
    console.error('Error getting purchase return:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get purchase return'
    });
  }
};

// @desc    Get purchase returns for a specific purchase
// @route   GET /api/store-manager/purchases/:purchaseId/returns
// @access  Private (Store Manager only)
const getReturnsForPurchase = async (req, res) => {
  try {
    const store = req.store;
    const purchaseId = req.params.purchaseId;

    // Verify purchase belongs to store
    const purchase = await Purchase.findOne({ _id: purchaseId, store: store._id });
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    const returns = await PurchaseReturn.find({
      originalPurchase: purchaseId,
      store: store._id
    })
      .populate('items.medicine', 'name genericName')
      .populate('processedBy', 'name')
      .sort({ returnDate: -1 });

    res.status(200).json({
      success: true,
      data: returns
    });

  } catch (error) {
    console.error('Error getting returns for purchase:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get returns for purchase'
    });
  }
};

// @desc    Validate purchase return eligibility
// @route   POST /api/store-manager/purchase-returns/validate
// @access  Private (Store Manager only)
const validatePurchaseReturnEligibility = async (req, res) => {
  try {
    const { originalPurchaseId, items } = req.body;

    if (!originalPurchaseId || !items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Purchase ID and items are required'
      });
    }

    // Validate return eligibility
    const validation = await PurchaseReturn.validatePurchaseReturnEligibility(originalPurchaseId, items);

    res.status(200).json({
      success: true,
      message: 'Purchase return is eligible',
      data: {
        originalPurchase: validation.originalPurchase,
        returnedQuantities: validation.returnedQuantities
      }
    });

  } catch (error) {
    console.error('Validate purchase return eligibility error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Purchase return validation failed'
    });
  }
};

// @desc    Get available items for return from a purchase
// @route   GET /api/store-manager/purchases/:purchaseId/available-for-return
// @access  Private (Store Manager only)
const getAvailableItemsForReturn = async (req, res) => {
  try {
    const store = req.store;
    const purchaseId = req.params.purchaseId;

    // Verify purchase belongs to store
    const purchase = await Purchase.findOne({ _id: purchaseId, store: store._id });
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    // Get available items for return
    const result = await PurchaseReturn.getAvailableItemsForReturn(purchaseId);

    res.status(200).json({
      success: true,
      data: {
        originalPurchase: result.originalPurchase,
        availableItems: result.availableItems,
        totalAvailableItems: result.availableItems.length
      }
    });

  } catch (error) {
    console.error('Error getting available items for return:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get available items for return'
    });
  }
};

// @desc    Create new purchase return
// @route   POST /api/store-manager/purchase-returns
// @access  Private (Store Manager only)
const createPurchaseReturn = async (req, res) => {
  try {
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
    const {
      originalPurchaseId,
      items,
      returnReason,
      returnReasonDetails,
      refundMethod,
      notes
    } = req.body;

    // Validate return eligibility
    const validation = await PurchaseReturn.validatePurchaseReturnEligibility(originalPurchaseId, items);
    const originalPurchase = validation.originalPurchase;

    // Process return items and calculate amounts
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const originalItem = originalPurchase.items.find(purchaseItem =>
        purchaseItem._id.toString() === item.originalPurchaseItem
      );

      if (!originalItem) {
        return res.status(400).json({
          success: false,
          message: `Original purchase item not found: ${item.originalPurchaseItem}`
        });
      }

      // Calculate return amount using original purchase price
      const returnAmount = item.returnQuantity * originalItem.unitCost;

      // Handle cases where medicine reference might be null (customer requested items)
      const medicineId = originalItem.medicine ? originalItem.medicine._id : null;

      console.log('🔍 Processing return item:', {
        originalPurchaseItem: item.originalPurchaseItem,
        medicineId,
        hasMedicine: !!originalItem.medicine,
        medicineName: originalItem.medicineName,
        isCustomerRequested: originalItem.isCustomerRequested,
        originalItemDetails: {
          medicine: originalItem.medicine,
          medicineType: typeof originalItem.medicine,
          medicineString: originalItem.medicine ? originalItem.medicine.toString() : 'null'
        }
      });

      const processedItem = {
        originalPurchaseItem: item.originalPurchaseItem,
        medicine: medicineId,
        returnQuantity: item.returnQuantity,
        unitType: originalItem.unitType, // Use original purchase unit type
        originalQuantity: originalItem.quantity,
        returnAmount,
        originalUnitCost: originalItem.unitCost,
        itemReturnReason: item.itemReturnReason || 'damaged_goods',
        removeFromInventory: item.removeFromInventory !== false, // Default to true
        batch: originalItem.batch || {},

        // Store medicine details for customer requested items
        medicineName: originalItem.medicineName,
        manufacturer: originalItem.manufacturer,
        genericName: originalItem.genericName,
        isCustomerRequested: originalItem.isCustomerRequested || false
      };

      processedItems.push(processedItem);
      subtotal += returnAmount;
    }

    // Create purchase return
    const purchaseReturnData = {
      store: store._id,
      originalPurchase: originalPurchaseId,
      supplier: originalPurchase.supplier,
      items: processedItems,
      subtotal,
      totalReturnAmount: subtotal,
      returnReason,
      returnReasonDetails: returnReasonDetails || '',
      refundMethod: refundMethod || 'credit_note',
      notes: notes || '',
      status: 'pending',
      createdBy: storeManager._id
    };

    const purchaseReturn = new PurchaseReturn(purchaseReturnData);
    await purchaseReturn.save();

    // Populate the created return for response
    await purchaseReturn.populate([
      { path: 'originalPurchase', select: 'purchaseOrderNumber invoiceNumber purchaseDate' },
      { path: 'supplier', select: 'name contactPerson' },
      { path: 'items.medicine', select: 'name genericName' },
      { path: 'createdBy', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Purchase return created successfully',
      data: purchaseReturn
    });

  } catch (error) {
    console.error('Create purchase return error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create purchase return'
    });
  }
};

// @desc    Update purchase return
// @route   PUT /api/store-manager/purchase-returns/:id
// @access  Private (Store Manager only)
const updatePurchaseReturn = async (req, res) => {
  try {
    const store = req.store;
    const storeManager = req.user;
    const returnId = req.params.id;
    const {
      status,
      approvalNotes,
      refundMethod,
      refundReference,
      notes
    } = req.body;

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

    // Update allowed fields
    if (status) {
      const previousStatus = purchaseReturn.status;
      purchaseReturn.status = status;

      if (status === 'approved') {
        purchaseReturn.approvedBy = storeManager._id;
        purchaseReturn.approvalDate = new Date();
        purchaseReturn.approvalNotes = approvalNotes || '';
      } else if (status === 'processed') {
        purchaseReturn.processedBy = storeManager._id;
        purchaseReturn.processedDate = new Date();
      } else if (status === 'completed') {
        // Process inventory updates when status changes to completed
        if (previousStatus !== 'completed') {
          console.log('🔄 Processing inventory restoration for completed purchase return');
          console.log('🔍 Purchase return details:', {
            returnNumber: purchaseReturn.returnNumber,
            itemsCount: purchaseReturn.items.length,
            previousStatus,
            newStatus: status,
            items: purchaseReturn.items.map(item => ({
              medicine: item.medicine,
              medicineName: item.medicineName,
              returnQuantity: item.returnQuantity,
              unitType: item.unitType,
              removeFromInventory: item.removeFromInventory
            }))
          });
          await processInventoryUpdates(purchaseReturn, storeManager._id);
        } else {
          console.log('⏭️ Skipping inventory restoration - return was already completed');
        }
      }
    }

    if (refundMethod) {
      purchaseReturn.refundMethod = refundMethod;
    }

    if (refundReference) {
      purchaseReturn.refundReference = refundReference;
    }

    if (notes) {
      purchaseReturn.notes = notes;
    }

    purchaseReturn.updatedBy = storeManager._id;
    await purchaseReturn.save();

    // Populate for response
    await purchaseReturn.populate([
      { path: 'originalPurchase', select: 'purchaseOrderNumber invoiceNumber' },
      { path: 'supplier', select: 'name contactPerson' },
      { path: 'approvedBy', select: 'name' },
      { path: 'processedBy', select: 'name' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Purchase return updated successfully',
      data: purchaseReturn
    });

  } catch (error) {
    console.error('Update purchase return error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update purchase return'
    });
  }
};

// Helper function to update batch quantities
const updateBatchQuantities = async (medicineId, batchInfo, unitType, returnQuantity) => {
  try {
    const Batch = require('../models/Batch');

    const batch = await Batch.findOne({
      medicine: medicineId,
      batchNumber: batchInfo.batchNumber,
      isActive: true
    });

    if (batch) {
      if (unitType === 'strip') {
        batch.stripQuantity = (batch.stripQuantity || 0) + returnQuantity;
      } else if (unitType === 'individual') {
        batch.individualQuantity = (batch.individualQuantity || 0) + returnQuantity;
      }

      await batch.save();
      console.log(`📦 Batch ${batchInfo.batchNumber} updated: ${unitType} increased by ${returnQuantity}`);
    } else {
      console.warn(`⚠️ Batch not found: ${batchInfo.batchNumber} for medicine ${medicineId}`);
    }
  } catch (error) {
    console.error('❌ Batch update error:', error);
  }
};

// Helper function to log inventory changes for audit trail
const logInventoryChange = async (changeData) => {
  try {
    // Create inventory change log entry
    const InventoryLog = require('../models/InventoryLog');

    const logEntry = {
      medicine: changeData.medicine,
      store: changeData.store,
      changeType: changeData.changeType,
      unitType: changeData.unitType,
      quantityChanged: changeData.quantityChanged,
      previousStock: changeData.previousStock,
      newStock: changeData.newStock,
      reference: changeData.reference,
      performedBy: changeData.performedBy,
      notes: changeData.notes,
      timestamp: new Date()
    };

    // If InventoryLog model exists, save the log
    if (InventoryLog) {
      await InventoryLog.create(logEntry);
    } else {
      // Fallback: log to console for now
      console.log('📋 Inventory Change Log:', JSON.stringify(logEntry, null, 2));
    }
  } catch (error) {
    console.error('❌ Inventory logging error:', error);
    // Don't throw error - logging failure shouldn't break the main process
  }
};

// Helper function to process inventory updates for completed purchase returns
const processInventoryUpdates = async (purchaseReturn, userId) => {
  try {
    console.log('🔄 Starting inventory restoration for purchase return:', purchaseReturn.returnNumber);

    const Medicine = require('../models/Medicine');
    const Batch = require('../models/Batch');

    for (const item of purchaseReturn.items) {
      // Skip items that shouldn't affect inventory
      if (!item.removeFromInventory) {
        console.log(`⏭️ Skipping inventory update for item ${item.medicine} (removeFromInventory: false)`);
        continue;
      }

      // Try to find medicine by name if medicine reference is missing
      let medicineToUpdate = null;
      if (!item.medicine) {
        console.log(`🔍 Medicine reference missing for item: ${item.medicineName}. Attempting to find by name...`);

        // Try to find medicine by name in the current store
        const Medicine = require('../models/Medicine');
        const foundMedicine = await Medicine.findOne({
          store: purchaseReturn.store,
          name: { $regex: new RegExp(item.medicineName, 'i') }, // Case-insensitive search
          isActive: true
        });

        if (foundMedicine) {
          console.log(`✅ Found medicine by name: ${foundMedicine.name} (ID: ${foundMedicine._id})`);
          medicineToUpdate = foundMedicine;
        } else {
          console.log(`❌ Could not find medicine by name: ${item.medicineName}. Skipping inventory update.`);
          console.log(`⏭️ Skipping inventory update for item: ${item.medicineName}`, {
            itemDetails: {
              medicine: item.medicine,
              medicineName: item.medicineName,
              isCustomerRequested: item.isCustomerRequested,
              removeFromInventory: item.removeFromInventory,
              returnQuantity: item.returnQuantity,
              unitType: item.unitType
            }
          });
          continue;
        }
      } else {
        // Medicine reference exists, find it by ID
        const Medicine = require('../models/Medicine');
        medicineToUpdate = await Medicine.findById(item.medicine);
        if (!medicineToUpdate) {
          console.error(`❌ Medicine not found by ID: ${item.medicine}`);
          continue;
        }
      }

      console.log(`🔍 Processing inventory update for medicine: ${medicineToUpdate._id}`);
      console.log(`📋 Item details:`, {
        returnQuantity: item.returnQuantity,
        unitType: item.unitType,
        removeFromInventory: item.removeFromInventory,
        medicineName: item.medicineName
      });

      console.log(`💊 Medicine found:`, {
        name: medicineToUpdate.name,
        currentStripStock: medicineToUpdate.stripInfo?.stock,
        currentIndividualStock: medicineToUpdate.individualInfo?.stock,
        unitTypes: medicineToUpdate.unitTypes
      });

      // Determine unit type based on medicine configuration and original purchase
      const unitType = item.unitType || 'strip';
      const returnQuantity = item.returnQuantity || 0;

      console.log(`📦 Restoring inventory - Medicine: ${medicineToUpdate.name}, Unit: ${unitType}, Quantity: ${returnQuantity}`);

      console.log('🔍 Medicine unit configuration:', {
        hasStrips: medicineToUpdate.unitTypes?.hasStrips,
        hasIndividual: medicineToUpdate.unitTypes?.hasIndividual,
        unitType: unitType,
        currentStripStock: medicineToUpdate.stripInfo?.stock || 0,
        currentIndividualStock: medicineToUpdate.individualInfo?.stock || 0
      });

      // Ensure stripInfo and individualInfo objects exist
      if (!medicineToUpdate.stripInfo) {
        console.log(`⚠️ Creating missing stripInfo for medicine: ${medicineToUpdate.name}`);
        medicineToUpdate.stripInfo = { stock: 0, minStock: 5, purchasePrice: 0, sellingPrice: 0, mrp: 0 };
      }
      if (!medicineToUpdate.individualInfo) {
        console.log(`⚠️ Creating missing individualInfo for medicine: ${medicineToUpdate.name}`);
        medicineToUpdate.individualInfo = { stock: 0, minStock: 5, purchasePrice: 0, sellingPrice: 0, mrp: 0 };
      }

      console.log(`📊 Before inventory update:`, {
        stripStock: medicineToUpdate.stripInfo.stock,
        individualStock: medicineToUpdate.individualInfo.stock,
        legacyStock: medicineToUpdate.stock,
        unitType: unitType,
        returnQuantity: returnQuantity
      });

      // Apply unit logic: individual-only vs strip-present medicines
      if (medicineToUpdate.unitTypes?.hasStrips && unitType === 'strip') {
        // Update strip quantities - ADD back to inventory for purchase returns
        const currentStripStock = medicineToUpdate.stripInfo.stock || 0;
        const newStripStock = currentStripStock + returnQuantity;

        console.log(`🔄 BEFORE UPDATE - Strip stock: ${currentStripStock}`);

        medicineToUpdate.stripInfo.stock = newStripStock;
        medicineToUpdate.stock = newStripStock; // Legacy compatibility

        // Update legacy inventory object if it exists
        if (medicineToUpdate.inventory) {
          medicineToUpdate.inventory.stripQuantity = newStripStock;
        }

        console.log(`📈 AFTER UPDATE - Strip inventory: ${currentStripStock} → ${newStripStock} (increased by ${returnQuantity})`);

      } else if (medicineToUpdate.unitTypes?.hasIndividual && unitType === 'individual') {
        // Update individual quantities - ADD back to inventory for purchase returns
        const currentIndividualStock = medicineToUpdate.individualInfo.stock || 0;
        const newIndividualStock = currentIndividualStock + returnQuantity;

        console.log(`🔄 BEFORE UPDATE - Individual stock: ${currentIndividualStock}`);

        medicineToUpdate.individualInfo.stock = newIndividualStock;

        // Update legacy inventory object if it exists
        if (medicineToUpdate.inventory) {
          medicineToUpdate.inventory.individualQuantity = newIndividualStock;
        }

        console.log(`📈 AFTER UPDATE - Individual inventory: ${currentIndividualStock} → ${newIndividualStock} (increased by ${returnQuantity})`);

      } else {
        console.warn(`⚠️ Unit type mismatch or unsupported: ${unitType} for medicine ${medicineToUpdate.name}`);
        console.warn(`⚠️ Medicine unit config:`, {
          hasStrips: medicineToUpdate.unitTypes?.hasStrips,
          hasIndividual: medicineToUpdate.unitTypes?.hasIndividual,
          requestedUnitType: unitType
        });
      }

      // Update batch quantities if batch information exists
      if (item.batch?.batchNumber) {
        await updateBatchQuantities(medicineToUpdate._id, item.batch, unitType, returnQuantity);
      }

      // Save medicine with updated inventory
      console.log(`💾 Saving medicine ${medicineToUpdate.name} with updated inventory...`);
      console.log(`📊 After inventory update (before save):`, {
        stripStock: medicineToUpdate.stripInfo.stock,
        individualStock: medicineToUpdate.individualInfo.stock,
        legacyStock: medicineToUpdate.stock,
        unitType: unitType,
        returnQuantity: returnQuantity
      });

      const savedMedicine = await medicineToUpdate.save();
      console.log(`✅ Medicine saved successfully. Final stock values:`, {
        stripStock: savedMedicine.stripInfo?.stock,
        individualStock: savedMedicine.individualInfo?.stock,
        legacyStock: savedMedicine.stock
      });

      // Log inventory change for audit trail
      await logInventoryChange({
        medicine: medicineToUpdate._id,
        store: medicineToUpdate.store,
        changeType: 'purchase_return',
        unitType,
        quantityChanged: returnQuantity, // Positive because it's an increase
        previousStock: unitType === 'strip' ?
          (medicineToUpdate.stripInfo?.stock || 0) - returnQuantity :
          (medicineToUpdate.individualInfo?.stock || 0) - returnQuantity,
        newStock: unitType === 'strip' ?
          (medicineToUpdate.stripInfo?.stock || 0) :
          (medicineToUpdate.individualInfo?.stock || 0),
        reference: {
          type: 'PurchaseReturn',
          id: purchaseReturn._id,
          returnNumber: purchaseReturn.returnNumber
        },
        performedBy: userId,
        notes: `Purchase return completed - ${item.itemReturnReason}`
      });

      // Update item processing status
      item.inventoryUpdated = true;
      item.inventoryUpdateDetails = {
        updatedAt: new Date(),
        updatedBy: userId,
        unitType,
        quantityChanged: returnQuantity, // Positive value indicates increase
        quantityAdded: returnQuantity, // New field for inventory increase
        previousStock: unitType === 'strip' ?
          (medicineToUpdate.stripInfo?.stock || 0) - returnQuantity :
          (medicineToUpdate.individualInfo?.stock || 0) - returnQuantity,
        newStock: unitType === 'strip' ?
          (medicineToUpdate.stripInfo?.stock || 0) :
          (medicineToUpdate.individualInfo?.stock || 0)
      };
    }

    // Update overall inventory restoration status
    const allItemsProcessed = purchaseReturn.items.every(item =>
      !item.removeFromInventory || item.inventoryUpdated
    );

    purchaseReturn.inventoryRestorationStatus = allItemsProcessed ? 'completed' : 'partial';
    await purchaseReturn.save();

    console.log('✅ Inventory restoration completed for purchase return:', purchaseReturn.returnNumber);

  } catch (error) {
    console.error('❌ Inventory update error:', error);
    throw error;
  }
};

module.exports = {
  getPurchaseReturns,
  getPurchaseReturn,
  getReturnsForPurchase,
  validatePurchaseReturnEligibility,
  getAvailableItemsForReturn,
  createPurchaseReturn,
  updatePurchaseReturn,
  processInventoryUpdates
};

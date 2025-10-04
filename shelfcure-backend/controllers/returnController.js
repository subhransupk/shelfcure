const Return = require('../models/Return');
const Sale = require('../models/Sale');
const Medicine = require('../models/Medicine');
const { validationResult } = require('express-validator');
const returnConfig = require('../config/returnConfig');

// @desc    Get all returns for a store
// @route   GET /api/store-manager/returns
// @access  Private (Store Manager only)
const getReturns = async (req, res) => {
  try {
    const store = req.store;
    const {
      status,
      returnReason,
      refundStatus,
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
      Return.find(query)
        .populate('originalSale', 'receiptNumber invoiceNumber saleDate totalAmount')
        .populate('customer', 'name phone email')
        .populate('items.medicine', 'name genericName')
        .populate('processedBy', 'name')
        .populate('approvedBy', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Return.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: returns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get returns error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching returns'
    });
  }
};

// @desc    Get a specific return
// @route   GET /api/store-manager/returns/:id
// @access  Private (Store Manager only)
const getReturn = async (req, res) => {
  try {
    const store = req.store;
    const returnId = req.params.id;

    const returnRecord = await Return.findOne({
      _id: returnId,
      store: store._id
    })
      .populate('originalSale')
      .populate('customer', 'name phone email address')
      .populate('items.medicine', 'name genericName unitTypes')
      .populate('processedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!returnRecord) {
      return res.status(404).json({
        success: false,
        message: 'Return not found'
      });
    }

    res.status(200).json({
      success: true,
      data: returnRecord
    });
  } catch (error) {
    console.error('Get return error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching return'
    });
  }
};

// @desc    Get returns for a specific sale
// @route   GET /api/store-manager/sales/:saleId/returns
// @access  Private (Store Manager only)
const getReturnsForSale = async (req, res) => {
  try {
    const store = req.store;
    const saleId = req.params.saleId;

    // Verify sale belongs to store
    const sale = await Sale.findOne({ _id: saleId, store: store._id });
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    const returns = await Return.find({
      originalSale: saleId,
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
    console.error('Get returns for sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching returns for sale'
    });
  }
};

// @desc    Validate return eligibility
// @route   POST /api/store-manager/returns/validate
// @access  Private (Store Manager only)
const validateReturnEligibility = async (req, res) => {
  try {
    const { saleId, items } = req.body;

    // Validate input
    if (!saleId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Sale ID and items are required'
      });
    }

    // Use the static method from Return model
    const validation = await Return.validateReturnEligibility(saleId, items);

    res.status(200).json({
      success: true,
      message: 'Return is eligible',
      data: validation
    });
  } catch (error) {
    console.error('Validate return eligibility error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Return validation failed'
    });
  }
};

// @desc    Get available items for return from a sale
// @route   GET /api/store-manager/sales/:saleId/available-for-return
// @access  Private (Store Manager only)
const getAvailableItemsForReturn = async (req, res) => {
  try {
    const store = req.store;
    const saleId = req.params.saleId;

    // Verify sale belongs to store
    const Sale = require('../models/Sale');
    const sale = await Sale.findOne({ _id: saleId, store: store._id });
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    // Get available items for return
    const result = await Return.getAvailableItemsForReturn(saleId);

    res.status(200).json({
      success: true,
      data: {
        originalSale: result.originalSale,
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

// @desc    Create a new return
// @route   POST /api/store-manager/returns
// @access  Private (Store Manager only)
const createReturn = async (req, res) => {
  try {
    const store = req.store;
    const user = req.user;

    const {
      originalSaleId,
      items,
      returnReason,
      returnReasonDetails,
      refundMethod = 'cash',
      restoreInventory = true,
      notes
    } = req.body;

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Additional business rule: Check if user has permission to create returns
    // Check if user has returns permission (assuming it's under sales permissions)
    const hasReturnPermission = user.permissions?.sales?.refund ||
                               user.permissions?.returns?.create ||
                               user.role === 'store_manager' ||
                               user.role === 'store_owner';

    if (!hasReturnPermission) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to create returns'
      });
    }

    // Business rule: Validate minimum return amount (if applicable)
    const totalReturnValue = items.reduce((total, item) => {
      return total + (item.returnQuantity * (item.unitPrice || 0));
    }, 0);

    // Business rule: Check for suspicious return patterns
    const recentReturns = await Return.find({
      createdBy: user._id,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });

    if (recentReturns.length >= returnConfig.maxReturnsPerUserPerDay) {
      console.warn(`High return frequency detected for user ${user._id}: ${recentReturns.length} returns in 24 hours`);
      return res.status(429).json({
        success: false,
        message: `Maximum ${returnConfig.maxReturnsPerUserPerDay} returns per day exceeded`
      });
    }

    // Business rule: Check if returns are allowed at current time
    if (returnConfig.timeRestrictions.enabled) {
      const now = new Date();
      const currentHour = now.getHours();
      const { start, end } = returnConfig.timeRestrictions.allowedHours;

      if (currentHour < start || currentHour >= end) {
        return res.status(400).json({
          success: false,
          message: `Returns are only allowed between ${start}:00 and ${end}:00`
        });
      }
    }

    // Business rule: Check minimum return amount
    if (totalReturnValue < returnConfig.minimumReturnAmount) {
      return res.status(400).json({
        success: false,
        message: `Return amount must be at least ₹${returnConfig.minimumReturnAmount}`
      });
    }

    // Validate return eligibility
    const validation = await Return.validateReturnEligibility(originalSaleId, items);
    const originalSale = validation.originalSale;

    // Process return items and calculate amounts
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const originalItem = originalSale.items.find(saleItem =>
        saleItem._id.toString() === item.originalSaleItem
      );

      if (!originalItem) {
        return res.status(400).json({
          success: false,
          message: `Original sale item not found: ${item.originalSaleItem}`
        });
      }

      // Calculate return amount based on unit type and quantity
      let returnAmount;
      const unitsPerStrip = originalItem.medicine?.unitTypes?.unitsPerStrip || 10;

      if (originalItem.unitType === item.unitType) {
        // Same unit type - direct calculation
        returnAmount = item.returnQuantity * originalItem.unitPrice;
      } else if (originalItem.unitType === 'strip' && item.unitType === 'individual') {
        // Original was strips, returning individual units
        const pricePerIndividual = originalItem.unitPrice / unitsPerStrip;
        returnAmount = item.returnQuantity * pricePerIndividual;
      } else if (originalItem.unitType === 'individual' && item.unitType === 'strip') {
        // Original was individual, returning strips
        const pricePerStrip = originalItem.unitPrice * unitsPerStrip;
        returnAmount = item.returnQuantity * pricePerStrip;
      }

      const processedItem = {
        originalSaleItem: item.originalSaleItem,
        medicine: originalItem.medicine._id,
        returnQuantity: item.returnQuantity,
        unitType: item.unitType,
        originalQuantity: originalItem.quantity,
        originalUnitType: originalItem.unitType,
        unitPrice: originalItem.unitPrice,
        returnAmount: parseFloat(returnAmount.toFixed(2)),
        batch: originalItem.batch,
        itemReturnReason: item.itemReturnReason || 'customer_request',
        restoreToInventory: item.restoreToInventory !== undefined ? item.restoreToInventory : restoreInventory
      };

      processedItems.push(processedItem);
      subtotal += processedItem.returnAmount;
    }

    // Create return record (returnNumber will be auto-generated by pre-save middleware)
    const returnData = {
      store: store._id,
      originalSale: originalSaleId,
      customer: originalSale.customer,
      items: processedItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      totalReturnAmount: parseFloat(subtotal.toFixed(2)), // Will be adjusted for tax/discount later
      returnReason,
      returnReasonDetails,
      refundMethod,
      restoreInventory,
      notes,
      processedBy: user._id,
      createdBy: user._id,
      status: 'pending'
    };

    console.log('🔄 Creating return with data:', {
      ...returnData,
      items: `${returnData.items.length} items`
    });

    const newReturn = await Return.create(returnData);
    console.log('✅ Return created successfully with returnNumber:', newReturn.returnNumber);

    // Calculate return amounts (including tax/discount adjustments)
    newReturn.calculateReturnAmounts();
    await newReturn.save();
    console.log('✅ Return amounts calculated and saved');

    // If inventory restoration is enabled, process it
    if (restoreInventory) {
      await processInventoryRestoration(newReturn, user._id);
    }

    // Update original sale status if fully returned
    await updateOriginalSaleStatus(originalSaleId);

    // Populate return for response
    const populatedReturn = await Return.findById(newReturn._id)
      .populate('originalSale', 'receiptNumber invoiceNumber')
      .populate('customer', 'name phone')
      .populate('items.medicine', 'name genericName')
      .populate('processedBy', 'name');

    res.status(201).json({
      success: true,
      data: populatedReturn,
      message: 'Return created successfully'
    });
  } catch (error) {
    console.error('Create return error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating return'
    });
  }
};

// Helper function to process inventory restoration
const processInventoryRestoration = async (returnRecord, userId) => {
  try {
    console.log('🔄 Starting inventory restoration for return:', returnRecord.returnNumber);
    console.log('🔍 Items to process:', returnRecord.items.map(item => ({
      medicine: item.medicine,
      restoreToInventory: item.restoreToInventory,
      inventoryRestored: item.inventoryRestored,
      returnQuantity: item.returnQuantity,
      unitType: item.unitType
    })));

    for (const item of returnRecord.items) {
      console.log(`🔍 Processing restoration for item: ${item.medicine}, restoreToInventory: ${item.restoreToInventory}, inventoryRestored: ${item.inventoryRestored}`);

      if (!item.restoreToInventory || item.inventoryRestored) {
        console.log(`⏭️ Skipping item ${item.medicine} - not marked for restoration or already restored`);
        continue;
      }

      const medicine = await Medicine.findById(item.medicine);
      if (!medicine) {
        console.error(`Medicine not found for restoration: ${item.medicine}`);
        continue;
      }

      const unitsPerStrip = medicine.unitTypes?.unitsPerStrip || 10;
      let stripQuantityRestored = 0;
      let individualQuantityRestored = 0;
      let conversionApplied = false;
      let conversionDetails = {};

      if (item.unitType === 'strip') {
        // Restore strips directly
        medicine.stripInfo.stock += item.returnQuantity;
        medicine.inventory.stripQuantity += item.returnQuantity;
        stripQuantityRestored = item.returnQuantity;
      } else if (item.unitType === 'individual') {
        // Restore individual units
        medicine.individualInfo.stock += item.returnQuantity;
        medicine.inventory.individualQuantity += item.returnQuantity;
        individualQuantityRestored = item.returnQuantity;
      }

      await medicine.save();

      // Update return item restoration details
      item.inventoryRestored = true;
      item.restorationDetails = {
        restoredAt: new Date(),
        restoredBy: userId,
        stripQuantityRestored,
        individualQuantityRestored,
        conversionApplied,
        conversionDetails
      };
    }

    // Update overall restoration status
    const allItemsRestored = returnRecord.items.every(item =>
      !item.restoreToInventory || item.inventoryRestored
    );

    returnRecord.inventoryRestorationStatus = allItemsRestored ? 'completed' : 'partial';
    await returnRecord.save();

  } catch (error) {
    console.error('Inventory restoration error:', error);
    throw error;
  }
};

// Helper function to reverse inventory restoration when return is rejected
const reverseInventoryRestoration = async (returnRecord, userId) => {
  try {
    console.log('🔄 Starting inventory restoration reversal for return:', returnRecord.returnNumber);
    console.log('🔍 Return items details:', returnRecord.items.map(item => ({
      medicine: item.medicine,
      restoreToInventory: item.restoreToInventory,
      inventoryRestored: item.inventoryRestored,
      returnQuantity: item.returnQuantity,
      unitType: item.unitType
    })));

    for (const item of returnRecord.items) {
      console.log(`🔍 Processing item: ${item.medicine}, restoreToInventory: ${item.restoreToInventory}, inventoryRestored: ${item.inventoryRestored}`);

      // Only check if item was marked for restoration - don't require inventoryRestored flag
      if (!item.restoreToInventory) {
        console.log(`⏭️ Skipping item ${item.medicine} - not marked for restoration`);
        continue;
      }

      const medicine = await Medicine.findById(item.medicine);
      if (!medicine) {
        console.error(`❌ Medicine not found for reversal: ${item.medicine}`);
        continue;
      }

      console.log(`🔄 Reversing inventory for medicine: ${medicine.name}`);
      console.log(`📊 Current stock - Strips: ${medicine.stripInfo?.stock || 0}, Individual: ${medicine.individualInfo?.stock || 0}`);

      const unitsPerStrip = medicine.unitTypes?.unitsPerStrip || 10;
      let stripQuantityReversed = 0;
      let individualQuantityReversed = 0;

      if (item.unitType === 'strip') {
        // Reverse strip restoration (subtract the quantity that was added)
        const currentStripStock = medicine.stripInfo?.stock || 0;
        const quantityToReverse = Math.min(item.returnQuantity, currentStripStock);

        medicine.stripInfo.stock -= quantityToReverse;
        medicine.inventory.stripQuantity -= quantityToReverse;
        stripQuantityReversed = quantityToReverse;

        console.log(`📦 Reversed ${quantityToReverse} strips from stock`);
      } else if (item.unitType === 'individual') {
        // Reverse individual restoration (subtract the quantity that was added)
        const currentIndividualStock = medicine.individualInfo?.stock || 0;
        const quantityToReverse = Math.min(item.returnQuantity, currentIndividualStock);

        medicine.individualInfo.stock -= quantityToReverse;
        medicine.inventory.individualQuantity -= quantityToReverse;
        individualQuantityReversed = quantityToReverse;

        console.log(`💊 Reversed ${quantityToReverse} individual units from stock`);
      }

      // Ensure stock doesn't go negative
      if (medicine.stripInfo?.stock < 0) medicine.stripInfo.stock = 0;
      if (medicine.individualInfo?.stock < 0) medicine.individualInfo.stock = 0;
      if (medicine.inventory?.stripQuantity < 0) medicine.inventory.stripQuantity = 0;
      if (medicine.inventory?.individualQuantity < 0) medicine.inventory.individualQuantity = 0;

      await medicine.save();

      console.log(`✅ Updated stock - Strips: ${medicine.stripInfo?.stock || 0}, Individual: ${medicine.individualInfo?.stock || 0}`);

      // Update return item reversal details
      item.inventoryRestored = false;
      item.inventoryReversed = true;
      item.reversalDetails = {
        reversedAt: new Date(),
        reversedBy: userId,
        stripQuantityReversed,
        individualQuantityReversed,
        reason: 'Return rejected'
      };
    }

    // Update overall restoration status
    returnRecord.inventoryRestorationStatus = 'reversed';
    await returnRecord.save();

    console.log('✅ Inventory restoration reversal completed for return:', returnRecord.returnNumber);

  } catch (error) {
    console.error('❌ Inventory restoration reversal error:', error);
    throw error;
  }
};

// Helper function to update original sale status
const updateOriginalSaleStatus = async (saleId) => {
  try {
    const sale = await Sale.findById(saleId);
    if (!sale) return;

    // Get all returns for this sale
    const returns = await Return.find({ originalSale: saleId });

    // Check if all items have been returned
    const totalReturned = {};
    returns.forEach(returnRecord => {
      returnRecord.items.forEach(item => {
        const key = `${item.medicine}_${item.originalUnitType}`;
        if (!totalReturned[key]) {
          totalReturned[key] = 0;
        }

        // Convert return quantity to original unit type for comparison
        let returnQuantityInOriginalUnit = item.returnQuantity;
        const medicine = sale.items.find(saleItem =>
          saleItem.medicine.toString() === item.medicine.toString()
        );

        if (medicine) {
          const unitsPerStrip = medicine.medicine?.unitTypes?.unitsPerStrip || 10;

          if (item.unitType !== item.originalUnitType) {
            if (item.originalUnitType === 'strip' && item.unitType === 'individual') {
              returnQuantityInOriginalUnit = Math.ceil(item.returnQuantity / unitsPerStrip);
            } else if (item.originalUnitType === 'individual' && item.unitType === 'strip') {
              returnQuantityInOriginalUnit = item.returnQuantity * unitsPerStrip;
            }
          }
        }

        totalReturned[key] += returnQuantityInOriginalUnit;
      });
    });

    // Check if all sale items have been fully returned
    let fullyReturned = true;
    for (const saleItem of sale.items) {
      const key = `${saleItem.medicine}_${saleItem.unitType}`;
      const returnedQuantity = totalReturned[key] || 0;

      if (returnedQuantity < saleItem.quantity) {
        fullyReturned = false;
        break;
      }
    }

    // Update sale status
    if (fullyReturned) {
      sale.status = 'returned';
      sale.isReturned = true;
    }

    await sale.save();
  } catch (error) {
    console.error('Update sale status error:', error);
  }
};

// @desc    Update return status
// @route   PUT /api/store-manager/returns/:id
// @access  Private (Store Manager only)
const updateReturn = async (req, res) => {
  try {
    const store = req.store;
    const user = req.user;
    const returnId = req.params.id;

    const {
      status,
      refundMethod,
      refundStatus,
      refundReference,
      notes,
      rejectionReason
    } = req.body;

    const returnRecord = await Return.findOne({
      _id: returnId,
      store: store._id
    });

    if (!returnRecord) {
      return res.status(404).json({
        success: false,
        message: 'Return not found'
      });
    }

    // Update fields
    if (status) returnRecord.status = status;
    if (refundMethod) returnRecord.refundMethod = refundMethod;
    if (refundStatus) returnRecord.refundStatus = refundStatus;
    if (refundReference) returnRecord.refundReference = refundReference;
    if (notes) returnRecord.notes = notes;
    if (rejectionReason) returnRecord.rejectionReason = rejectionReason;

    // Handle status-specific updates
    if (status === 'approved') {
      returnRecord.approvedBy = user._id;
      returnRecord.approvedAt = new Date();
    }

    if (status === 'completed') {
      returnRecord.completedBy = user._id;
      returnRecord.completedAt = new Date();
      console.log('✅ Return marked as completed:', {
        returnNumber: returnRecord.returnNumber,
        completedBy: user.name || user.email,
        completedAt: new Date()
      });
    }

    // Handle return rejection - reverse inventory changes if inventory was restored
    if (status === 'rejected') {
      console.log('🔍 Return rejection detected:', {
        returnNumber: returnRecord.returnNumber,
        restoreInventory: returnRecord.restoreInventory,
        inventoryRestorationStatus: returnRecord.inventoryRestorationStatus,
        itemsCount: returnRecord.items.length,
        status: status
      });

      // Always try to reverse if restoreInventory is true, regardless of current status
      if (returnRecord.restoreInventory) {
        console.log('✅ Attempting inventory reversal for return:', returnRecord.returnNumber);
        try {
          await reverseInventoryRestoration(returnRecord, user._id);
          console.log('✅ Inventory reversal completed successfully');
        } catch (error) {
          console.error('❌ Error during inventory reversal:', error);
        }
      } else {
        console.log('❌ Inventory reversal not needed - restoreInventory is false');
      }
    }

    if (refundStatus === 'completed') {
      returnRecord.refundProcessedAt = new Date();
    }

    returnRecord.updatedBy = user._id;
    await returnRecord.save();

    const updatedReturn = await Return.findById(returnId)
      .populate('originalSale', 'receiptNumber invoiceNumber')
      .populate('customer', 'name phone')
      .populate('items.medicine', 'name genericName')
      .populate('processedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('completedBy', 'name');

    res.status(200).json({
      success: true,
      data: updatedReturn,
      message: 'Return updated successfully'
    });
  } catch (error) {
    console.error('Update return error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating return'
    });
  }
};

// @desc    Process inventory restoration for a return
// @route   POST /api/store-manager/returns/:id/restore-inventory
// @access  Private (Store Manager only)
const restoreInventory = async (req, res) => {
  try {
    const store = req.store;
    const user = req.user;
    const returnId = req.params.id;

    const returnRecord = await Return.findOne({
      _id: returnId,
      store: store._id
    });

    if (!returnRecord) {
      return res.status(404).json({
        success: false,
        message: 'Return not found'
      });
    }

    if (!returnRecord.restoreInventory) {
      return res.status(400).json({
        success: false,
        message: 'Inventory restoration is not enabled for this return'
      });
    }

    await processInventoryRestoration(returnRecord, user._id);

    res.status(200).json({
      success: true,
      message: 'Inventory restoration completed successfully'
    });
  } catch (error) {
    console.error('Restore inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while restoring inventory'
    });
  }
};

// @desc    Get return analytics
// @route   GET /api/store-manager/returns/analytics
// @access  Private (Store Manager only)
const getReturnAnalytics = async (req, res) => {
  try {
    const store = req.store;
    const { startDate, endDate, period = '30' } = req.query;

    // Calculate date range
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

    // Basic return statistics
    const totalReturns = await Return.countDocuments({
      store: store._id,
      createdAt: { $gte: start, $lte: end }
    });

    const totalReturnAmount = await Return.aggregate([
      {
        $match: {
          store: store._id,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalReturnAmount' }
        }
      }
    ]);

    // Return rate calculation (returns vs sales)
    const totalSales = await Sale.countDocuments({
      store: store._id,
      createdAt: { $gte: start, $lte: end },
      status: 'completed'
    });

    const returnRate = totalSales > 0 ? ((totalReturns / totalSales) * 100).toFixed(2) : 0;

    // Get status-based return counts
    const pendingReturns = await Return.countDocuments({
      store: store._id,
      status: { $in: ['pending', 'approved', 'processed'] }
    });

    const completedReturns = await Return.countDocuments({
      store: store._id,
      status: 'completed'
    });

    const rejectedReturns = await Return.countDocuments({
      store: store._id,
      status: { $in: ['rejected', 'cancelled'] }
    });

    // Get today's returns for better insights
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayReturns = await Return.countDocuments({
      store: store._id,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const todayReturnAmount = await Return.aggregate([
      {
        $match: {
          store: store._id,
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalReturnAmount' }
        }
      }
    ]);

    // Debug logging for return analytics
    console.log('📊 Return Analytics Debug:', {
      storeId: store._id,
      period: { start, end },
      totalReturns,
      totalReturnAmount: totalReturnAmount[0]?.total || 0,
      pendingReturns,
      completedReturns,
      rejectedReturns,
      todayReturns,
      todayReturnAmount: todayReturnAmount[0]?.total || 0
    });

    // Return reasons analysis
    const returnReasons = await Return.aggregate([
      {
        $match: {
          store: store._id,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$returnReason',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalReturnAmount' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Top returned medicines
    const topReturnedMedicines = await Return.aggregate([
      {
        $match: {
          store: store._id,
          createdAt: { $gte: start, $lte: end }
        }
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'medicines',
          localField: 'items.medicine',
          foreignField: '_id',
          as: 'medicineInfo'
        }
      },
      { $unwind: '$medicineInfo' },
      {
        $group: {
          _id: '$items.medicine',
          medicineName: { $first: '$medicineInfo.name' },
          genericName: { $first: '$medicineInfo.genericName' },
          totalQuantityReturned: { $sum: '$items.returnQuantity' },
          totalReturnAmount: { $sum: '$items.returnAmount' },
          returnCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalReturnAmount: -1 }
      },
      { $limit: 10 }
    ]);

    // Monthly return trends
    const monthlyTrends = await Return.aggregate([
      {
        $match: {
          store: store._id,
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } // Last year
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalReturnAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Inventory impact analysis
    const inventoryImpact = await Return.aggregate([
      {
        $match: {
          store: store._id,
          createdAt: { $gte: start, $lte: end }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.restoreToInventory',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$items.returnQuantity' },
          totalAmount: { $sum: '$items.returnAmount' }
        }
      }
    ]);

    // Refund method analysis
    const refundMethods = await Return.aggregate([
      {
        $match: {
          store: store._id,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$refundMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalReturnAmount' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalReturns,
          totalReturnAmount: totalReturnAmount[0]?.total || 0,
          returnRate: parseFloat(returnRate),
          totalSales,
          pendingReturns,
          completedReturns,
          rejectedReturns,
          todayReturns,
          todayReturnAmount: todayReturnAmount[0]?.total || 0,
          period: {
            start,
            end,
            days: Math.ceil((end - start) / (1000 * 60 * 60 * 24))
          }
        },
        returnReasons,
        topReturnedMedicines,
        monthlyTrends,
        inventoryImpact,
        refundMethods
      }
    });

  } catch (error) {
    console.error('Error fetching return analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch return analytics'
    });
  }
};

module.exports = {
  getReturns,
  getReturn,
  getReturnsForSale,
  validateReturnEligibility,
  getAvailableItemsForReturn,
  createReturn,
  updateReturn,
  restoreInventory,
  getReturnAnalytics,
  processInventoryRestoration,
  reverseInventoryRestoration,
  updateOriginalSaleStatus
};

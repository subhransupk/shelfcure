const Purchase = require('../models/Purchase');
const Supplier = require('../models/Supplier');
const Medicine = require('../models/Medicine');
const SupplierTransaction = require('../models/SupplierTransaction');
const Batch = require('../models/Batch');
const BatchService = require('../services/batchService');
const { validationResult } = require('express-validator');
const { logInventoryChange } = require('../services/inventoryLogService');

// Helper function to update inventory when purchase is received/completed
const updateInventoryForPurchase = async (purchase, userId) => {
  try {
    console.log('🔄 Starting inventory update for purchase:', purchase.purchaseOrderNumber);

    for (const item of purchase.items) {
      if (!item.medicine) {
        console.log(`⏭️ Skipping item ${item.medicineName} - no medicine ID`);
        continue;
      }

      try {
        console.log(`🔍 Processing item: ${item.medicineName}, Medicine ID: ${item.medicine}`);
        const medicine = await Medicine.findById(item.medicine);

        if (!medicine) {
          console.error(`❌ Medicine not found with ID: ${item.medicine}`);
          continue;
        }

        console.log(`📦 Found medicine: ${medicine.name}`);
        console.log(`📊 Current stock - Strip: ${medicine.stripInfo?.stock || 'N/A'}, Individual: ${medicine.individualInfo?.stock || 'N/A'}`);
        console.log(`📥 Adding ${item.quantity} ${item.unitType}(s)`);

        // Create or update batch if batch information is provided
        let batchCreated = false;
        if (item.batchNumber && item.expiryDate) {
          try {
            // Check if batch already exists
            let batch = await Batch.findOne({
              medicine: medicine._id,
              batchNumber: item.batchNumber,
              store: medicine.store,
              isActive: true
            });

            if (batch) {
              // Update existing batch
              if (item.unitType === 'strip') {
                batch.stripQuantity += item.quantity;
              } else {
                batch.individualQuantity += item.quantity;
              }
              batch.updatedBy = userId;
              await batch.save();
              console.log(`✅ Updated existing batch: ${item.batchNumber} for ${medicine.name}`);
            } else {
              // Create new batch
              batch = await Batch.create({
                medicine: medicine._id,
                store: medicine.store,
                batchNumber: item.batchNumber,
                manufacturingDate: item.manufacturingDate || new Date(),
                expiryDate: new Date(item.expiryDate),
                stripQuantity: item.unitType === 'strip' ? item.quantity : 0,
                individualQuantity: item.unitType === 'individual' ? item.quantity : 0,
                storageLocation: item.storageLocation || '',
                supplier: purchase.supplier,
                notes: `Created from purchase ${purchase.purchaseOrderNumber}`,
                createdBy: userId
              });
              console.log(`✅ Created new batch: ${item.batchNumber} for ${medicine.name}`);
            }
            batchCreated = true;

            // Synchronize medicine stock with batch totals
            await BatchService.synchronizeMedicineStock(medicine._id, medicine.store);
            console.log(`✅ Synchronized medicine stock with batches for ${medicine.name}`);

          } catch (batchError) {
            console.error(`❌ Error creating/updating batch for ${medicine.name}:`, batchError);
            // Continue with traditional inventory update as fallback
          }
        }

        // Fallback to traditional inventory update if no batch was created
        if (!batchCreated) {
          if (item.unitType === 'strip' && medicine.stripInfo) {
            const oldQuantity = medicine.stripInfo.stock || 0;
            medicine.stripInfo.stock = oldQuantity + item.quantity;

            // Update legacy stock field for compatibility
            medicine.stock = medicine.stripInfo.stock;

            // Update legacy inventory object if it exists
            if (medicine.inventory) {
              medicine.inventory.stripQuantity = medicine.stripInfo.stock;
            }

            console.log(`✅ Updated strip stock: ${medicine.name} from ${oldQuantity} to ${medicine.stripInfo.stock} strips`);

          } else if (item.unitType === 'individual' && medicine.individualInfo) {
            const oldQuantity = medicine.individualInfo.stock || 0;
            medicine.individualInfo.stock = oldQuantity + item.quantity;

            // Update legacy inventory object if it exists
            if (medicine.inventory) {
              medicine.inventory.individualQuantity = medicine.individualInfo.stock;
            }

            console.log(`✅ Updated individual stock: ${medicine.name} from ${oldQuantity} to ${medicine.individualInfo.stock} units`);

          } else {
            console.log(`⚠️ Unit type ${item.unitType} not supported or medicine structure incomplete for ${medicine.name}`);
            continue;
          }

          // Update last purchase info
          medicine.lastPurchaseDate = new Date();
          medicine.lastPurchasePrice = item.unitCost;

          console.log(`💾 Saving medicine: ${medicine.name}`);
          await medicine.save();
          console.log(`✅ Stock updated successfully for: ${medicine.name}`);
        }

        // Log inventory change for audit trail
        await logInventoryChange({
          medicine: medicine._id,
          store: medicine.store,
          changeType: 'purchase',
          unitType: item.unitType,
          quantityChanged: item.quantity, // Positive because it's an increase
          previousStock: item.unitType === 'strip' ?
            (medicine.stripInfo?.stock || 0) - item.quantity :
            (medicine.individualInfo?.stock || 0) - item.quantity,
          newStock: item.unitType === 'strip' ?
            (medicine.stripInfo?.stock || 0) :
            (medicine.individualInfo?.stock || 0),
          reference: {
            type: 'Purchase',
            id: purchase._id,
            purchaseOrderNumber: purchase.purchaseOrderNumber
          },
          performedBy: userId,
          notes: `Purchase ${purchase.status} - ${batchCreated ? 'batch-aware' : 'traditional'} inventory update`,
          batchInfo: item.batchNumber ? [{
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            manufacturingDate: item.manufacturingDate,
            quantityUsed: item.quantity
          }] : null
        });

      } catch (updateError) {
        console.error(`❌ Error updating stock for medicine ${item.medicineName}:`, updateError);
      }
    }

    console.log('✅ Inventory update completed for purchase:', purchase.purchaseOrderNumber);

  } catch (error) {
    console.error('❌ Error in updateInventoryForPurchase:', error);
    throw error;
  }
};



// @desc    Get medicines that need reordering
// @route   GET /api/store-manager/purchases/reorder-suggestions
// @access  Private (Store Manager only)
const getReorderSuggestions = async (req, res) => {
  try {
    const store = req.store;

    // Get all active medicines for this store
    // Note: We'll handle supplier population manually to avoid casting errors with empty strings
    const allMedicines = await Medicine.find({
      store: store._id,
      isActive: true
    })
    .select('name genericName manufacturer unitTypes stripInfo individualInfo supplier category')
    .sort('name');

    // Filter medicines that need reordering with corrected logic
    const lowStockMedicines = allMedicines.filter(medicine => {
      const hasStrips = medicine.unitTypes?.hasStrips;
      const hasIndividual = medicine.unitTypes?.hasIndividual;

      let needsReorder = false;
      let debugInfo = {
        name: medicine.name,
        hasStrips,
        hasIndividual
      };

      if (hasStrips && hasIndividual) {
        // Both enabled: Reorder based on STRIP STOCK ONLY
        // Individual stock is just cut medicines, not used for reorder calculation
        const stripStock = Number(medicine.stripInfo?.stock || 0);
        const stripReorderLevel = Number(medicine.stripInfo?.reorderLevel || 0);
        needsReorder = stripStock <= stripReorderLevel;
        debugInfo.stripStock = stripStock;
        debugInfo.stripReorderLevel = stripReorderLevel;
        debugInfo.needsReorder = needsReorder;
        debugInfo.stripStockType = typeof medicine.stripInfo?.stock;
        debugInfo.stripReorderType = typeof medicine.stripInfo?.reorderLevel;
      } else if (hasStrips) {
        // Only strips enabled
        const stripStock = Number(medicine.stripInfo?.stock || 0);
        const stripReorderLevel = Number(medicine.stripInfo?.reorderLevel || 0);
        needsReorder = stripStock <= stripReorderLevel;
        debugInfo.stripStock = stripStock;
        debugInfo.stripReorderLevel = stripReorderLevel;
        debugInfo.needsReorder = needsReorder;
        debugInfo.stripStockType = typeof medicine.stripInfo?.stock;
        debugInfo.stripReorderType = typeof medicine.stripInfo?.reorderLevel;
      } else if (hasIndividual) {
        // Only individual enabled: Use individual stock for reorder calculation
        const individualStock = Number(medicine.individualInfo?.stock || 0);
        const individualReorderLevel = Number(medicine.individualInfo?.reorderLevel || 0);
        needsReorder = individualStock <= individualReorderLevel;
        debugInfo.individualStock = individualStock;
        debugInfo.individualReorderLevel = individualReorderLevel;
        debugInfo.needsReorder = needsReorder;
        debugInfo.individualStockType = typeof medicine.individualInfo?.stock;
        debugInfo.individualReorderType = typeof medicine.individualInfo?.reorderLevel;
      }

      // Log medicines that are being included in reorder suggestions
      if (needsReorder) {
        console.log('🔍 Medicine included in reorder:', debugInfo);
      } else if (debugInfo.stripStock > 0 || debugInfo.individualStock > 0) {
        // Log medicines with stock that are NOT being included (for debugging)
        console.log('❌ Medicine with stock NOT included:', debugInfo);
      }

      return needsReorder;
    });

    console.log(`📊 Reorder filtering results:`, {
      totalMedicines: allMedicines.length,
      lowStockMedicines: lowStockMedicines.length,
      medicineNames: lowStockMedicines.map(m => m.name)
    });

    // Manually populate suppliers for medicines that have valid supplier IDs
    const Supplier = require('../models/Supplier');
    const mongoose = require('mongoose');

    // Get unique valid supplier IDs from the low stock medicines
    const validSupplierIds = lowStockMedicines
      .map(medicine => medicine.supplier)
      .filter(supplierId => {
        // Only include valid ObjectIds, exclude empty strings, null, undefined
        return supplierId &&
               typeof supplierId !== 'string' ||
               (typeof supplierId === 'string' && supplierId.trim() !== '' && mongoose.Types.ObjectId.isValid(supplierId));
      })
      .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

    // Fetch suppliers in bulk
    const suppliers = await Supplier.find({
      _id: { $in: validSupplierIds }
    }).select('name contactPerson phone email');

    // Create a supplier lookup map
    const supplierMap = {};
    suppliers.forEach(supplier => {
      supplierMap[supplier._id.toString()] = supplier;
    });

    // Format the suggestions with recommended quantities
    // NEW LOGIC: For dual-unit medicines, show only strip suggestions (suppliers sell strips, not individual units)
    // For individual-only medicines, show individual suggestions
    const suggestions = lowStockMedicines.map(medicine => {
      const hasStrips = medicine.unitTypes?.hasStrips;
      const hasIndividual = medicine.unitTypes?.hasIndividual;

      let stripSuggestion = null;
      let individualSuggestion = null;

      // Determine which suggestion to show based on unit type configuration
      if (hasStrips && hasIndividual) {
        // DUAL UNIT MEDICINE: Show ONLY strip suggestion (suppliers don't sell individual units)
        if (medicine.stripInfo?.stock <= medicine.stripInfo?.reorderLevel) {
          stripSuggestion = {
            unitType: 'strip',
            currentStock: medicine.stripInfo.stock,
            reorderLevel: medicine.stripInfo.reorderLevel,
            minStock: medicine.stripInfo.minStock,
            // Suggest ordering enough to reach 2x reorder level
            suggestedQuantity: Math.max(
              (medicine.stripInfo.reorderLevel * 2) - medicine.stripInfo.stock,
              medicine.stripInfo.minStock
            ),
            unitCost: medicine.stripInfo.purchasePrice || 0
          };
        }
        // Individual suggestion is intentionally null for dual-unit medicines
      } else if (hasStrips) {
        // STRIP-ONLY MEDICINE: Show strip suggestion
        if (medicine.stripInfo?.stock <= medicine.stripInfo?.reorderLevel) {
          stripSuggestion = {
            unitType: 'strip',
            currentStock: medicine.stripInfo.stock,
            reorderLevel: medicine.stripInfo.reorderLevel,
            minStock: medicine.stripInfo.minStock,
            suggestedQuantity: Math.max(
              (medicine.stripInfo.reorderLevel * 2) - medicine.stripInfo.stock,
              medicine.stripInfo.minStock
            ),
            unitCost: medicine.stripInfo.purchasePrice || 0
          };
        }
      } else if (hasIndividual) {
        // INDIVIDUAL-ONLY MEDICINE: Show individual suggestion (genuinely sold as individual units)
        if (medicine.individualInfo?.stock <= medicine.individualInfo?.reorderLevel) {
          individualSuggestion = {
            unitType: 'individual',
            currentStock: medicine.individualInfo.stock,
            reorderLevel: medicine.individualInfo.reorderLevel,
            minStock: medicine.individualInfo.minStock,
            suggestedQuantity: Math.max(
              (medicine.individualInfo.reorderLevel * 2) - medicine.individualInfo.stock,
              medicine.individualInfo.minStock
            ),
            unitCost: medicine.individualInfo.purchasePrice || 0
          };
        }
      }

      // Get supplier info from our lookup map
      let supplierInfo = null;
      if (medicine.supplier && typeof medicine.supplier === 'object' && medicine.supplier._id) {
        supplierInfo = supplierMap[medicine.supplier._id.toString()];
      } else if (medicine.supplier && mongoose.Types.ObjectId.isValid(medicine.supplier)) {
        supplierInfo = supplierMap[medicine.supplier.toString()];
      }

      return {
        medicine: medicine._id,
        medicineName: medicine.name,
        genericName: medicine.genericName,
        manufacturer: medicine.manufacturer,
        category: medicine.category,
        supplier: supplierInfo || null,
        stripSuggestion,
        individualSuggestion,
        // Priority based on how low the stock is
        priority: Math.min(
          stripSuggestion ? (stripSuggestion.currentStock / stripSuggestion.reorderLevel) : 1,
          individualSuggestion ? (individualSuggestion.currentStock / individualSuggestion.reorderLevel) : 1
        )
      };
    }).filter(suggestion => suggestion.stripSuggestion || suggestion.individualSuggestion)
      .sort((a, b) => a.priority - b.priority); // Sort by priority (lowest stock ratio first)

    // Calculate summary statistics for better UX
    const summary = {
      totalItems: suggestions.length,
      itemsWithSuppliers: suggestions.filter(s => s.supplier).length,
      itemsWithoutSuppliers: suggestions.filter(s => !s.supplier).length,
      totalEstimatedCost: suggestions.reduce((sum, suggestion) => {
        let itemCost = 0;
        if (suggestion.stripSuggestion) {
          itemCost += suggestion.stripSuggestion.suggestedQuantity * suggestion.stripSuggestion.unitCost;
        }
        if (suggestion.individualSuggestion) {
          itemCost += suggestion.individualSuggestion.suggestedQuantity * suggestion.individualSuggestion.unitCost;
        }
        return sum + itemCost;
      }, 0),
      supplierGroups: {}
    };

    // Group by suppliers for easier purchase order creation
    suggestions.forEach(suggestion => {
      if (suggestion.supplier) {
        const supplierId = suggestion.supplier._id.toString();
        if (!summary.supplierGroups[supplierId]) {
          summary.supplierGroups[supplierId] = {
            supplier: suggestion.supplier,
            items: [],
            totalCost: 0
          };
        }
        summary.supplierGroups[supplierId].items.push(suggestion);

        // Calculate cost for this supplier group
        let itemCost = 0;
        if (suggestion.stripSuggestion) {
          itemCost += suggestion.stripSuggestion.suggestedQuantity * suggestion.stripSuggestion.unitCost;
        }
        if (suggestion.individualSuggestion) {
          itemCost += suggestion.individualSuggestion.suggestedQuantity * suggestion.individualSuggestion.unitCost;
        }
        summary.supplierGroups[supplierId].totalCost += itemCost;
      }
    });

    res.json({
      success: true,
      data: suggestions,
      count: suggestions.length,
      summary
    });
  } catch (error) {
    console.error('Get reorder suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reorder suggestions'
    });
  }
};

// @desc    Get all purchases for a store
// @route   GET /api/store-manager/purchases
// @access  Private (Store Manager only)
const getPurchases = async (req, res) => {
  try {
    const store = req.store;
    const storeManager = req.user;
    const { 
      search, 
      status, 
      supplier,
      paymentStatus,
      dateFrom,
      dateTo,
      page = 1, 
      limit = 20, 
      sort = '-purchaseDate' 
    } = req.query;

    // Build query object
    let queryObj = { store: store._id };

    if (status) queryObj.status = status;
    if (supplier) queryObj.supplier = supplier;
    if (paymentStatus) queryObj.paymentStatus = paymentStatus;

    if (dateFrom || dateTo) {
      queryObj.purchaseDate = {};
      if (dateFrom) queryObj.purchaseDate.$gte = new Date(dateFrom);
      if (dateTo) queryObj.purchaseDate.$lte = new Date(dateTo);
    }

    // Add search functionality
    if (search) {
      queryObj.$or = [
        { purchaseOrderNumber: { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'items.medicineName': { $regex: search, $options: 'i' } }
      ];
    }

    const purchases = await Purchase.find(queryObj)
      .populate('supplier', 'name contactPerson phone email')
      .populate('createdBy', 'name email')
      .populate('paymentHistory.processedBy', 'name email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Purchase.countDocuments(queryObj);

    res.json({
      success: true,
      data: purchases,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching purchases'
    });
  }
};

// @desc    Get single purchase by ID
// @route   GET /api/store-manager/purchases/:id
// @access  Private (Store Manager only)
const getPurchase = async (req, res) => {
  try {
    const store = req.store;
    const purchase = await Purchase.findOne({
      _id: req.params.id,
      store: store._id
    })
      .populate('supplier', 'name contactPerson phone email address')
      .populate('createdBy', 'name email')
      .populate('receivedBy', 'name email')
      .populate('paymentHistory.processedBy', 'name email')
      .populate('items.medicine', 'name genericName manufacturer');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    res.json({
      success: true,
      data: purchase
    });
  } catch (error) {
    console.error('Get purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching purchase'
    });
  }
};

// @desc    Create new purchase
// @route   POST /api/store-manager/purchases
// @access  Private (Store Manager only)
const createPurchase = async (req, res) => {
  try {
    console.log('🚀 CREATE PURCHASE CALLED');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const store = req.store;
    const storeManager = req.user;
    console.log('🏪 Store:', store.name, 'Manager:', storeManager.name);
    const {
      supplier,
      purchaseOrderNumber,
      invoiceNumber,
      items,
      paymentMethod,
      paymentTerms,
      expectedDeliveryDate,
      notes,
      internalNotes,
      deliveryAddress
    } = req.body;

    // Verify supplier exists and belongs to store (if supplier is provided)
    let supplierDoc = null;
    if (supplier) {
      supplierDoc = await Supplier.findOne({
        _id: supplier,
        store: store._id,
        isActive: true
      });

      if (!supplierDoc) {
        return res.status(400).json({
          success: false,
          message: 'Supplier not found or inactive'
        });
      }
    }

    // Validate items and calculate amounts
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    // Process items and calculate totals
    const processedItems = [];
    const newMedicinesToCreate = [];
    let subtotal = 0;

    for (const item of items) {
      const {
        medicine,
        medicineName,
        manufacturer,
        genericName,
        category,
        quantity,
        unitType,
        unitCost,
        discount = 0,
        taxRate = 18,
        batch,
        isCustomerRequested = false
      } = item;

      if (!medicineName || !quantity || !unitCost) {
        return res.status(400).json({
          success: false,
          message: 'Medicine name, quantity, and unit cost are required for all items'
        });
      }

      const totalCost = quantity * unitCost;
      const discountAmount = (discount * totalCost) / 100;
      const taxAmount = ((totalCost - discountAmount) * taxRate) / 100;
      const netAmount = totalCost - discountAmount + taxAmount;

      // Handle customer requested medicines
      if (isCustomerRequested && (!medicine || medicine === '' || medicine === null)) {
        console.log('🆕 Found customer requested medicine (new):', medicineName);
        // This is a new medicine that needs to be added to inventory
        const newMedicineData = {
          name: medicineName.trim(),
          genericName: genericName?.trim() || '',
          manufacturer: manufacturer?.trim() || '',
          category: category || 'Other',
          composition: `${medicineName.trim()} - Customer Requested`,
          unitType: unitType || 'strip',
          quantity: parseInt(quantity),
          unitCost: parseFloat(unitCost),
          supplier: supplierDoc._id,
          store: store._id,
          addedBy: storeManager._id,
          isCustomerRequested: true
        };
        newMedicinesToCreate.push(newMedicineData);
        console.log('✅ Added to newMedicinesToCreate:', newMedicineData.name);
      } else if (isCustomerRequested && medicine && medicine !== '' && medicine !== null) {
        console.log('🔄 Customer requested item with existing medicine ID:', medicine, '- Will update stock');
      } else {
        console.log('📋 Regular inventory item:', medicineName);
      }

      processedItems.push({
        medicine: medicine || null,
        medicineName: medicineName.trim(),
        manufacturer: manufacturer?.trim() || '',
        genericName: genericName?.trim() || '',
        category: category || 'Other',
        quantity: parseInt(quantity),
        unitType: unitType || 'strip',
        unitCost: parseFloat(unitCost),
        totalCost,
        discount: parseFloat(discount),
        discountAmount,
        taxRate: parseFloat(taxRate),
        taxAmount,
        netAmount,
        batch: batch || {},
        isCustomerRequested: isCustomerRequested || false
      });

      subtotal += totalCost;
    }

    // Calculate purchase totals
    const totalDiscount = processedItems.reduce((sum, item) => sum + item.discountAmount, 0);
    const totalTax = processedItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal - totalDiscount + totalTax;

    const purchaseData = {
      store: store._id,
      ...(supplier && { supplier: supplier }), // Only include supplier if provided
      purchaseOrderNumber: purchaseOrderNumber.trim(),
      invoiceNumber: invoiceNumber?.trim() || '',
      items: processedItems,
      subtotal,
      totalDiscount,
      totalTax,
      totalAmount,
      paymentMethod: paymentMethod || 'cash',
      paymentTerms: paymentTerms || (supplierDoc?.paymentTerms) || '30 days',
      creditAmount: paymentMethod === 'credit' ? totalAmount : 0,
      balanceAmount: paymentMethod === 'credit' ? totalAmount : 0,
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
      notes: notes?.trim() || '',
      internalNotes: internalNotes?.trim() || '',
      deliveryAddress: deliveryAddress || {},
      status: 'draft',
      createdBy: storeManager._id
    };

    const purchase = await Purchase.create(purchaseData);
    if (purchase.supplier) {
      await purchase.populate('supplier', 'name contactPerson phone email address');
    }
    await purchase.populate('createdBy', 'name email');

    // Handle supplier transaction if payment method is credit
    if (paymentMethod === 'credit' && supplierDoc) {
      try {
        // Calculate due date based on payment terms
        let dueDate = new Date();
        if (supplierDoc.paymentTerms) {
          const days = parseInt(supplierDoc.paymentTerms.match(/\d+/)?.[0] || '30');
          dueDate.setDate(dueDate.getDate() + days);
        }

        // Create supplier transaction record
        await SupplierTransaction.createTransaction({
          store: store._id,
          supplier: supplierDoc._id,
          transactionType: 'purchase_credit',
          amount: totalAmount,
          balanceChange: totalAmount, // Positive because it increases outstanding balance
          reference: {
            type: 'Purchase',
            id: purchase._id,
            number: purchase.purchaseOrderNumber
          },
          description: `Credit purchase - PO ${purchase.purchaseOrderNumber}`,
          notes: notes || '',
          processedBy: storeManager._id,
          dueDate: dueDate
        });

        console.log(`💳 Created supplier credit transaction for ₹${totalAmount}`);
      } catch (transactionError) {
        console.error('❌ Error creating supplier transaction:', transactionError);
        // Don't fail the entire purchase creation for transaction error
      }
    }

    // Update stock for existing medicines and create new medicines for customer requested items
    const createdMedicines = [];
    const updatedMedicines = [];

    // First, update stock for existing medicines in the purchase
    console.log(`🔄 Processing stock updates for existing medicines`);
    console.log(`📋 Items to process: ${processedItems.length}`);

    for (const item of processedItems) {
      console.log(`🔍 Processing item: ${item.medicineName}, Medicine ID: ${item.medicine}`);
      if (item.medicine) {
        try {
          console.log(`🔎 Looking up medicine with ID: ${item.medicine}`);
          const existingMedicine = await Medicine.findById(item.medicine);
          if (existingMedicine) {
            console.log(`📦 Found existing medicine: ${existingMedicine.name}`);
            console.log(`📊 Current stock - Strip: ${existingMedicine.stripInfo?.stock || 'N/A'}, Individual: ${existingMedicine.individualInfo?.stock || 'N/A'}`);
            console.log(`📥 Adding ${item.quantity} ${item.unitType}(s)`);

            // Update stock based on unit type
            if (item.unitType === 'strip' && existingMedicine.stripInfo) {
              const oldQuantity = existingMedicine.stripInfo.stock || 0;
              existingMedicine.stripInfo.stock = oldQuantity + item.quantity;
              console.log(`✅ Updated strip stock: ${existingMedicine.name} from ${oldQuantity} to ${existingMedicine.stripInfo.stock} strips`);
            } else if (item.unitType === 'individual' && existingMedicine.individualInfo) {
              const oldQuantity = existingMedicine.individualInfo.stock || 0;
              existingMedicine.individualInfo.stock = oldQuantity + item.quantity;
              console.log(`✅ Updated individual stock: ${existingMedicine.name} from ${oldQuantity} to ${existingMedicine.individualInfo.stock} units`);
            } else {
              // Handle case where medicine exists but doesn't have the required unit type
              console.log(`⚠️ Medicine exists but missing ${item.unitType} info. Adding it...`);
              if (item.unitType === 'strip') {
                if (!existingMedicine.stripInfo) {
                  existingMedicine.stripInfo = {
                    stock: item.quantity,
                    purchasePrice: item.unitCost,
                    sellingPrice: item.unitCost * 1.2, // 20% markup
                    mrp: item.unitCost * 1.3, // 30% markup
                    minStock: 5,
                    reorderLevel: 10
                  };
                  if (!existingMedicine.unitTypes) existingMedicine.unitTypes = {};
                  existingMedicine.unitTypes.hasStrips = true;
                  console.log(`✅ Added strip info to existing medicine: ${existingMedicine.name} with ${item.quantity} strips`);
                }
              } else if (item.unitType === 'individual') {
                if (!existingMedicine.individualInfo) {
                  existingMedicine.individualInfo = {
                    stock: item.quantity,
                    purchasePrice: item.unitCost,
                    sellingPrice: item.unitCost * 1.2, // 20% markup
                    mrp: item.unitCost * 1.3, // 30% markup
                    minStock: 50,
                    reorderLevel: 100
                  };
                  if (!existingMedicine.unitTypes) existingMedicine.unitTypes = {};
                  existingMedicine.unitTypes.hasIndividual = true;
                  console.log(`✅ Added individual info to existing medicine: ${existingMedicine.name} with ${item.quantity} units`);
                }
              }
            }

            // Update last purchase info
            existingMedicine.lastPurchaseDate = new Date();
            existingMedicine.lastPurchasePrice = item.unitCost;

            console.log(`💾 Saving medicine: ${existingMedicine.name}`);
            await existingMedicine.save();
            updatedMedicines.push(existingMedicine);
            console.log(`✅ Stock updated successfully for: ${existingMedicine.name}`);
          } else {
            console.log(`❌ Medicine not found with ID: ${item.medicine}`);
          }
        } catch (updateError) {
          console.error(`❌ Error updating stock for medicine ${item.medicineName}:`, updateError);
        }
      } else {
        console.log(`⏭️ Skipping item ${item.medicineName} - no medicine ID`);
      }
    }

    // Then, create new medicines for customer requested items that don't exist
    console.log(`🔄 Processing ${newMedicinesToCreate.length} new medicines to create`);
    if (newMedicinesToCreate.length > 0) {
      console.log(`Creating ${newMedicinesToCreate.length} new medicines from customer requests`);

      for (const medicineData of newMedicinesToCreate) {
        try {
          // Set up proper medicine structure for inventory
          const medicineInventoryData = {
            // Basic medicine information
            name: medicineData.name,
            genericName: medicineData.genericName,
            composition: medicineData.composition,
            manufacturer: medicineData.manufacturer,
            category: medicineData.category,

            // Unit types - set up based on purchase unit type
            unitTypes: {
              hasStrips: medicineData.unitType === 'strip',
              hasIndividual: medicineData.unitType === 'individual',
              unitsPerStrip: medicineData.unitType === 'strip' ? 10 : 1
            },

            // Inventory information based on purchase
            stripInfo: medicineData.unitType === 'strip' ? {
              stock: medicineData.quantity,
              purchasePrice: medicineData.unitCost,
              sellingPrice: medicineData.unitCost * 1.2, // 20% markup
              mrp: medicineData.unitCost * 1.3, // 30% markup
              minStock: 5,
              reorderLevel: 10
            } : undefined,

            individualInfo: medicineData.unitType === 'individual' ? {
              stock: medicineData.quantity,
              purchasePrice: medicineData.unitCost,
              sellingPrice: medicineData.unitCost * 1.2, // 20% markup
              mrp: medicineData.unitCost * 1.3, // 30% markup
              minStock: 50,
              reorderLevel: 100
            } : undefined,

            // Store and supplier information
            store: medicineData.store,
            supplier: medicineData.supplier,
            addedBy: medicineData.addedBy,
            createdBy: medicineData.addedBy,

            // Flags
            isActive: true,
            isCustom: true, // Customer requested medicines are custom
            requiresPrescription: false,

            // Notes
            notes: `Added from customer request via purchase order ${purchaseOrderNumber}`
          };

          // Remove undefined values
          Object.keys(medicineInventoryData).forEach(key => {
            if (medicineInventoryData[key] === undefined) {
              delete medicineInventoryData[key];
            }
          });

          const newMedicine = await Medicine.create(medicineInventoryData);
          createdMedicines.push(newMedicine);
          console.log(`✅ Created medicine: ${newMedicine.name} (ID: ${newMedicine._id})`);
        } catch (medicineError) {
          console.error(`❌ Error creating medicine ${medicineData.name}:`, medicineError);
          // Continue with other medicines even if one fails
        }
      }
    }

    // Create comprehensive response message
    let message = 'Purchase created successfully';
    const updates = [];
    if (updatedMedicines.length > 0) {
      updates.push(`${updatedMedicines.length} medicine(s) stock updated`);
    }
    if (createdMedicines.length > 0) {
      updates.push(`${createdMedicines.length} new medicine(s) added to inventory`);
    }
    if (updates.length > 0) {
      message += ` and ${updates.join(' and ')}`;
    }

    res.status(201).json({
      success: true,
      message,
      data: purchase,
      newMedicinesCreated: createdMedicines.length,
      medicinesStockUpdated: updatedMedicines.length
    });
  } catch (error) {
    console.error('Create purchase error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Purchase order number already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while creating purchase'
    });
  }
};

// @desc    Update purchase
// @route   PUT /api/store-manager/purchases/:id
// @access  Private (Store Manager only)
const updatePurchase = async (req, res) => {
  try {
    console.log('Update purchase request:', {
      purchaseId: req.params.id,
      body: req.body,
      storeId: req.store?._id
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const store = req.store;
    const {
      status,
      paymentStatus,
      paidAmount,
      paymentDate,
      deliveryDate,
      receivedBy,
      qualityCheck,
      notes,
      internalNotes
    } = req.body;

    const purchase = await Purchase.findOne({
      _id: req.params.id,
      store: store._id
    });

    if (!purchase) {
      console.log('Purchase not found:', req.params.id, 'for store:', store._id);
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    console.log('Current purchase status:', purchase.status, '-> New status:', status);

    // Store previous status for inventory logic
    const previousStatus = purchase.status;

    // Update allowed fields
    if (status) purchase.status = status;
    if (paymentStatus) purchase.paymentStatus = paymentStatus;
    if (paidAmount !== undefined) purchase.paidAmount = paidAmount;
    if (paymentDate) purchase.paymentDate = new Date(paymentDate);
    if (deliveryDate) purchase.deliveryDate = new Date(deliveryDate);
    if (receivedBy) purchase.receivedBy = receivedBy;
    if (qualityCheck) purchase.qualityCheck = qualityCheck;
    if (notes !== undefined) purchase.notes = notes.trim();
    if (internalNotes !== undefined) purchase.internalNotes = internalNotes.trim();

    // Set order date when status changes to 'ordered'
    if (status === 'ordered' && !purchase.orderDate) {
      purchase.orderDate = new Date();
    }

    // Set received date when status changes to 'received'
    if (status === 'received' && previousStatus !== 'received') {
      purchase.receivedDate = new Date();
    }

    // Process inventory updates when status changes to 'received' or 'completed'
    if (status && ['received', 'completed'].includes(status) && !['received', 'completed'].includes(previousStatus) && !purchase.inventoryUpdated) {
      console.log('🔄 Processing inventory updates for purchase status change to:', status);
      await updateInventoryForPurchase(purchase, req.user._id);

      // Mark inventory as updated
      purchase.inventoryUpdated = true;
      purchase.inventoryUpdateDate = new Date();
      purchase.inventoryUpdateBy = req.user._id;
    }

    await purchase.save();
    console.log('Purchase saved with new status:', purchase.status);

    await purchase.populate('supplier', 'name contactPerson phone email address');
    await purchase.populate('createdBy', 'name email');
    await purchase.populate('receivedBy', 'name email');

    res.json({
      success: true,
      message: 'Purchase updated successfully',
      data: purchase
    });
  } catch (error) {
    console.error('Update purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating purchase',
      error: error.message
    });
  }
};

// @desc    Delete purchase
// @route   DELETE /api/store-manager/purchases/:id
// @access  Private (Store Manager only)
const deletePurchase = async (req, res) => {
  try {
    const store = req.store;
    
    const purchase = await Purchase.findOne({
      _id: req.params.id,
      store: store._id
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    // Only allow deletion of draft purchases
    if (purchase.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft purchases can be deleted'
      });
    }

    await Purchase.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Purchase deleted successfully'
    });
  } catch (error) {
    console.error('Delete purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting purchase'
    });
  }
};

// @desc    Get purchase analytics
// @route   GET /api/store-manager/purchases/analytics
// @access  Private (Store Manager only)
const getPurchaseAnalytics = async (req, res) => {
  try {
    const store = req.store;
    const { dateFrom, dateTo } = req.query;

    const matchStage = {
      store: store._id,
      ...(dateFrom || dateTo) && {
        purchaseDate: {
          ...(dateFrom && { $gte: new Date(dateFrom) }),
          ...(dateTo && { $lte: new Date(dateTo) })
        }
      }
    };

    // Get overall purchase statistics
    const purchaseStats = await Purchase.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalItems: { $sum: { $sum: '$items.quantity' } },
          avgPurchaseAmount: { $avg: '$totalAmount' }
        }
      }
    ]);

    // Get supplier-wise analytics
    const supplierAnalytics = await Purchase.getSupplierPurchaseSummary(
      store._id, 
      null, 
      { dateFrom, dateTo }
    );

    // Get status-wise distribution
    const statusDistribution = await Purchase.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get monthly trend (last 12 months)
    const monthlyTrend = await Purchase.aggregate([
      { 
        $match: {
          store: store._id,
          purchaseDate: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$purchaseDate' },
            month: { $month: '$purchaseDate' }
          },
          totalPurchases: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: purchaseStats[0] || {
          totalPurchases: 0,
          totalAmount: 0,
          totalItems: 0,
          avgPurchaseAmount: 0
        },
        supplierAnalytics,
        statusDistribution,
        monthlyTrend
      }
    });
  } catch (error) {
    console.error('Get purchase analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching purchase analytics'
    });
  }
};

// @desc    Generate reorder report for print/export
// @route   GET /api/store-manager/purchases/reorder-report
// @access  Private (Store Manager only)
const generateReorderReport = async (req, res) => {
  try {
    const store = req.store;
    const { format = 'json' } = req.query; // json, csv, pdf

    // Get reorder suggestions (reuse existing logic)
    const allMedicines = await Medicine.find({
      store: store._id,
      isActive: true
    })
    .select('name genericName manufacturer unitTypes stripInfo individualInfo supplier category')
    .sort('name');

    // Filter medicines that need reordering
    const lowStockMedicines = allMedicines.filter(medicine => {
      const hasStrips = medicine.unitTypes?.hasStrips;
      const hasIndividual = medicine.unitTypes?.hasIndividual;

      if (hasStrips && hasIndividual) {
        const stripStock = medicine.stripInfo.stock || 0;
        const stripReorderLevel = medicine.stripInfo.reorderLevel || 0;
        return stripStock <= stripReorderLevel;
      } else if (hasStrips) {
        const stripStock = medicine.stripInfo.stock || 0;
        const stripReorderLevel = medicine.stripInfo.reorderLevel || 0;
        return stripStock <= stripReorderLevel;
      } else if (hasIndividual) {
        const individualStock = medicine.individualInfo.stock || 0;
        const individualReorderLevel = medicine.individualInfo.reorderLevel || 0;
        return individualStock <= individualReorderLevel;
      }

      return false;
    });

    // Get suppliers for the medicines
    const Supplier = require('../models/Supplier');
    const mongoose = require('mongoose');

    const validSupplierIds = lowStockMedicines
      .map(medicine => medicine.supplier)
      .filter(supplierId => {
        return supplierId &&
               typeof supplierId !== 'string' ||
               (typeof supplierId === 'string' && supplierId.trim() !== '' && mongoose.Types.ObjectId.isValid(supplierId));
      })
      .filter((id, index, arr) => arr.indexOf(id) === index);

    const suppliers = await Supplier.find({
      _id: { $in: validSupplierIds }
    }).select('name contactPerson phone email');

    const supplierMap = {};
    suppliers.forEach(supplier => {
      supplierMap[supplier._id.toString()] = supplier;
    });

    // Format report data
    const reportData = {
      store: {
        name: store.name,
        code: store.code,
        address: store.address
      },
      generatedAt: new Date(),
      generatedBy: req.user.name,
      items: lowStockMedicines.map(medicine => {
        let supplierInfo = null;
        if (medicine.supplier && typeof medicine.supplier === 'object' && medicine.supplier._id) {
          supplierInfo = supplierMap[medicine.supplier._id.toString()];
        } else if (medicine.supplier && mongoose.Types.ObjectId.isValid(medicine.supplier)) {
          supplierInfo = supplierMap[medicine.supplier.toString()];
        }

        const stripSuggestion = medicine.unitTypes?.hasStrips &&
          medicine.stripInfo?.stock <= medicine.stripInfo?.reorderLevel ? {
          unitType: 'strip',
          currentStock: medicine.stripInfo.stock,
          reorderLevel: medicine.stripInfo.reorderLevel,
          suggestedQuantity: Math.max(
            (medicine.stripInfo.reorderLevel * 2) - medicine.stripInfo.stock,
            medicine.stripInfo.minStock
          ),
          unitCost: medicine.stripInfo.purchasePrice || 0
        } : null;

        const individualSuggestion = medicine.unitTypes?.hasIndividual &&
          medicine.individualInfo?.stock <= medicine.individualInfo?.reorderLevel ? {
          unitType: 'individual',
          currentStock: medicine.individualInfo.stock,
          reorderLevel: medicine.individualInfo.reorderLevel,
          suggestedQuantity: Math.max(
            (medicine.individualInfo.reorderLevel * 2) - medicine.individualInfo.stock,
            medicine.individualInfo.minStock
          ),
          unitCost: medicine.individualInfo.purchasePrice || 0
        } : null;

        return {
          medicineName: medicine.name,
          genericName: medicine.genericName,
          manufacturer: medicine.manufacturer,
          category: medicine.category,
          supplier: supplierInfo,
          stripSuggestion,
          individualSuggestion
        };
      })
    };

    // Handle different formats
    if (format === 'csv') {
      // Generate CSV format with UTF-8 BOM for proper encoding
      let csvContent = '\uFEFF'; // UTF-8 BOM
      csvContent += 'Medicine Name,Generic Name,Manufacturer,Category,Supplier,Unit Type,Current Stock,Reorder Level,Suggested Quantity,Unit Cost,Total Cost\n';

      reportData.items.forEach(item => {
        const supplierName = item.supplier?.name || 'No Supplier';

        if (item.stripSuggestion) {
          const totalCost = item.stripSuggestion.suggestedQuantity * item.stripSuggestion.unitCost;
          csvContent += `"${item.medicineName}","${item.genericName}","${item.manufacturer}","${item.category}","${supplierName}","Strip",${item.stripSuggestion.currentStock},${item.stripSuggestion.reorderLevel},${item.stripSuggestion.suggestedQuantity},"₹${item.stripSuggestion.unitCost}","₹${totalCost.toFixed(2)}"\n`;
        }

        if (item.individualSuggestion) {
          const totalCost = item.individualSuggestion.suggestedQuantity * item.individualSuggestion.unitCost;
          csvContent += `"${item.medicineName}","${item.genericName}","${item.manufacturer}","${item.category}","${supplierName}","Individual",${item.individualSuggestion.currentStock},${item.individualSuggestion.reorderLevel},${item.individualSuggestion.suggestedQuantity},"₹${item.individualSuggestion.unitCost}","₹${totalCost.toFixed(2)}"\n`;
        }
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="reorder-report-${Date.now()}.csv"`);
      return res.send(csvContent);
    }

    // Default JSON format
    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Generate reorder report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating reorder report'
    });
  }
};

// @desc    Get delivery tracking information
// @route   GET /api/store-manager/purchases/deliveries
// @access  Private (Store Manager only)
const getDeliveryTracking = async (req, res) => {
  try {
    const store = req.store;
    const { status, dateFrom, dateTo, supplier } = req.query;

    // Build query for purchases with delivery information
    const query = {
      store: store._id,
      status: { $in: ['ordered', 'confirmed', 'shipped', 'received'] } // Only purchases that can have delivery status
    };

    // Add filters
    if (status && status !== 'all') {
      query.status = status;
    }

    if (dateFrom || dateTo) {
      query.expectedDeliveryDate = {};
      if (dateFrom) query.expectedDeliveryDate.$gte = new Date(dateFrom);
      if (dateTo) query.expectedDeliveryDate.$lte = new Date(dateTo);
    }

    if (supplier) {
      query.supplier = supplier;
    }

    // Get purchases with delivery information
    const deliveries = await Purchase.find(query)
      .populate('supplier', 'name contactPerson phone email')
      .populate('createdBy', 'name')
      .populate('receivedBy', 'name')
      .select('purchaseOrderNumber invoiceNumber status expectedDeliveryDate deliveryDate orderDate totalAmount supplier createdBy receivedBy deliveryAddress notes')
      .sort({ expectedDeliveryDate: 1, createdAt: -1 })
      .limit(100);

    // Calculate delivery statistics
    const stats = {
      total: deliveries.length,
      pending: deliveries.filter(d => ['ordered', 'confirmed'].includes(d.status)).length,
      shipped: deliveries.filter(d => d.status === 'shipped').length,
      delivered: deliveries.filter(d => d.status === 'received').length,
      overdue: deliveries.filter(d =>
        d.expectedDeliveryDate &&
        new Date(d.expectedDeliveryDate) < new Date() &&
        !['received'].includes(d.status)
      ).length
    };

    // Group deliveries by status for better organization
    const groupedDeliveries = {
      pending: deliveries.filter(d => ['ordered', 'confirmed'].includes(d.status)),
      shipped: deliveries.filter(d => d.status === 'shipped'),
      delivered: deliveries.filter(d => d.status === 'received'),
      overdue: deliveries.filter(d =>
        d.expectedDeliveryDate &&
        new Date(d.expectedDeliveryDate) < new Date() &&
        !['received'].includes(d.status)
      )
    };

    res.status(200).json({
      success: true,
      data: deliveries,
      grouped: groupedDeliveries,
      stats
    });

  } catch (error) {
    console.error('Get delivery tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching delivery information'
    });
  }
};

// @desc    Record payment for purchase
// @route   POST /api/store-manager/purchases/:id/payment
// @access  Private (Store Manager only)
const recordPurchasePayment = async (req, res) => {
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
    const { id: purchaseId } = req.params;
    const {
      amount,
      paymentMethod,
      transactionId,
      checkNumber,
      notes
    } = req.body;

    // Find the purchase
    const purchase = await Purchase.findOne({
      _id: purchaseId,
      store: store._id
    }).populate('supplier', 'name');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    // Validate payment amount
    const currentBalance = purchase.balanceAmount || 0;
    if (amount > currentBalance) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${amount}) cannot exceed outstanding balance (₹${currentBalance})`
      });
    }

    // Update purchase payment information
    const previousPaidAmount = purchase.paidAmount || 0;
    purchase.paidAmount = previousPaidAmount + amount;
    purchase.balanceAmount = purchase.totalAmount - purchase.paidAmount;

    // Update payment status based on balance
    if (purchase.balanceAmount <= 0) {
      purchase.paymentStatus = 'paid';
    } else if (purchase.paidAmount > 0) {
      purchase.paymentStatus = 'partial';
    }

    // Set payment date if this is the first payment or full payment
    if (previousPaidAmount === 0 || purchase.paymentStatus === 'paid') {
      purchase.paymentDate = new Date();
    }

    // Add payment to payment history
    const paymentHistoryEntry = {
      amount: amount,
      paymentMethod: paymentMethod,
      transactionId: transactionId || '',
      checkNumber: checkNumber || '',
      notes: notes || '',
      paymentDate: new Date(),
      processedBy: req.user._id,
      runningBalance: purchase.balanceAmount
    };

    // Initialize payment history if it doesn't exist
    if (!purchase.paymentHistory) {
      purchase.paymentHistory = [];
    }

    purchase.paymentHistory.push(paymentHistoryEntry);

    // Add payment record to purchase notes (for backward compatibility)
    const paymentNote = `Payment recorded: ₹${amount} via ${paymentMethod}${transactionId ? ` (${transactionId})` : ''}${checkNumber ? ` (Check: ${checkNumber})` : ''} on ${new Date().toLocaleDateString()}`;
    purchase.notes = purchase.notes ? `${purchase.notes}\n${paymentNote}` : paymentNote;

    if (notes) {
      purchase.notes += `\nPayment Notes: ${notes}`;
    }

    await purchase.save();

    // If supplier exists, create supplier transaction record
    if (purchase.supplier) {
      const SupplierTransaction = require('../models/SupplierTransaction');
      const mongoose = require('mongoose');
      const paymentId = new mongoose.Types.ObjectId();

      try {
        await SupplierTransaction.createTransaction({
          store: store._id,
          supplier: purchase.supplier._id,
          transactionType: 'supplier_payment',
          amount: amount,
          balanceChange: -amount,
          reference: {
            type: 'Purchase Payment',
            id: purchase._id,
            number: purchase.purchaseOrderNumber
          },
          paymentDetails: {
            method: paymentMethod,
            transactionId: transactionId,
            checkNumber: checkNumber,
            notes: notes
          },
          description: `Payment for purchase ${purchase.purchaseOrderNumber}`,
          notes: notes || '',
          processedBy: req.user._id
        });

        // Update supplier's last payment date
        const Supplier = require('../models/Supplier');
        await Supplier.findByIdAndUpdate(purchase.supplier._id, {
          lastPaymentDate: new Date()
        });
      } catch (supplierError) {
        console.error('Error creating supplier transaction:', supplierError);
        // Don't fail the payment if supplier transaction fails
      }
    }

    // Fetch updated purchase with supplier info and payment history
    const updatedPurchase = await Purchase.findById(purchaseId)
      .populate('supplier', 'name contactPerson phone')
      .populate('createdBy', 'name')
      .populate('paymentHistory.processedBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        purchase: updatedPurchase,
        paymentAmount: amount,
        newBalance: updatedPurchase.balanceAmount,
        paymentStatus: updatedPurchase.paymentStatus,
        paymentHistory: updatedPurchase.paymentHistory,
        totalPaid: updatedPurchase.paidAmount,
        totalAmount: updatedPurchase.totalAmount
      }
    });

  } catch (error) {
    console.error('Record purchase payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while recording payment'
    });
  }
};

// @desc    Get payment history for purchase
// @route   GET /api/store-manager/purchases/:id/payment-history
// @access  Private (Store Manager only)
const getPurchasePaymentHistory = async (req, res) => {
  try {
    const store = req.store;
    const { id: purchaseId } = req.params;

    // Find the purchase
    const purchase = await Purchase.findOne({
      _id: purchaseId,
      store: store._id
    })
      .populate('supplier', 'name contactPerson phone')
      .populate('paymentHistory.processedBy', 'name email')
      .select('purchaseOrderNumber totalAmount paidAmount balanceAmount paymentStatus paymentHistory paymentDate dueDate supplier');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    // Calculate payment summary
    const paymentSummary = {
      totalAmount: purchase.totalAmount,
      paidAmount: purchase.paidAmount || 0,
      balanceAmount: purchase.balanceAmount || 0,
      paymentStatus: purchase.paymentStatus,
      paymentDate: purchase.paymentDate,
      dueDate: purchase.dueDate,
      totalPayments: purchase.paymentHistory ? purchase.paymentHistory.length : 0,
      isFullyPaid: purchase.paymentStatus === 'paid',
      isOverdue: purchase.dueDate && new Date() > purchase.dueDate && purchase.balanceAmount > 0
    };

    res.status(200).json({
      success: true,
      data: {
        purchase: {
          _id: purchase._id,
          purchaseOrderNumber: purchase.purchaseOrderNumber,
          supplier: purchase.supplier
        },
        paymentSummary,
        paymentHistory: purchase.paymentHistory || []
      }
    });

  } catch (error) {
    console.error('Get purchase payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment history'
    });
  }
};

module.exports = {
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
  getPurchasePaymentHistory
};

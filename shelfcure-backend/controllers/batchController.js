const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');
const User = require('../models/User');
const Supplier = require('../models/Supplier');
const BatchService = require('../services/batchService');

// @desc    Get all batches for a store
// @route   GET /api/store-manager/batches
// @access  Private (Store Manager only)
const getBatches = async (req, res) => {
  try {
    const store = req.store;
    const { 
      page = 1, 
      limit = 20, 
      search, 
      medicineId, 
      expiryStatus,
      sortBy = 'expiryDate',
      sortOrder = 'asc'
    } = req.query;

    let query = { store: store._id, isActive: true };

    // Filter by medicine if specified
    if (medicineId) {
      query.medicine = medicineId;
    }

    // Filter by expiry status
    if (expiryStatus === 'expired') {
      query.expiryDate = { $lt: new Date() };
    } else if (expiryStatus === 'expiring') {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // Next 30 days
      query.expiryDate = { $lte: futureDate, $gte: new Date() };
    } else if (expiryStatus === 'fresh') {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      query.expiryDate = { $gt: futureDate };
    }

    // Note: We'll handle invalid supplier references in the populate step

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination - get raw data first
    const rawBatches = await Batch.find(query)
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean(); // Use lean() to get plain objects

    // Manually populate medicine and createdBy for all batches
    const medicineIds = [...new Set(rawBatches.map(b => b.medicine).filter(Boolean))];
    const userIds = [...new Set(rawBatches.map(b => b.createdBy).filter(Boolean))];
    const validSupplierIds = [...new Set(rawBatches
      .map(b => b.supplier)
      .filter(s => s && typeof s === 'string' && s.length === 24 && /^[0-9a-fA-F]{24}$/.test(s))
    )];

    // Fetch related data
    const [medicines, users, suppliers] = await Promise.all([
      medicineIds.length > 0 ? Medicine.find({ _id: { $in: medicineIds } }).select('name genericName manufacturer category').lean() : [],
      userIds.length > 0 ? User.find({ _id: { $in: userIds } }).select('name').lean() : [],
      validSupplierIds.length > 0 ? Supplier.find({ _id: { $in: validSupplierIds } }).select('name contactPerson').lean() : []
    ]);

    // Create lookup maps
    const medicineMap = new Map(medicines.map(m => [m._id.toString(), m]));
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    const supplierMap = new Map(suppliers.map(s => [s._id.toString(), s]));

    // Populate the batches manually
    const batches = rawBatches.map(batch => ({
      ...batch,
      medicine: medicineMap.get(batch.medicine?.toString()) || null,
      createdBy: userMap.get(batch.createdBy?.toString()) || null,
      supplier: (batch.supplier && supplierMap.get(batch.supplier.toString())) || null
    }));

    const total = await Batch.countDocuments(query);

    // If search is provided, filter results
    let filteredBatches = batches;
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filteredBatches = batches.filter(batch => 
        searchRegex.test(batch.medicine.name) ||
        searchRegex.test(batch.medicine.genericName) ||
        searchRegex.test(batch.medicine.manufacturer) ||
        searchRegex.test(batch.batchNumber) ||
        (batch.supplier && typeof batch.supplier === 'object' && searchRegex.test(batch.supplier.name))
      );
    }

    res.status(200).json({
      success: true,
      data: filteredBatches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching batches',
      error: error.message
    });
  }
};

// @desc    Get batches for a specific medicine
// @route   GET /api/store-manager/inventory/:medicineId/batches
// @access  Private (Store Manager only)
const getMedicineBatches = async (req, res) => {
  try {
    const store = req.store;
    const { medicineId } = req.params;

    // Verify medicine belongs to this store
    const medicine = await Medicine.findOne({ _id: medicineId, store: store._id });
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    const batches = await Batch.find({ 
      medicine: medicineId, 
      store: store._id, 
      isActive: true 
    })
      .populate('supplier', 'name contactPerson')
      .populate('createdBy', 'name')
      .sort({ expiryDate: 1 });

    res.status(200).json({
      success: true,
      data: batches
    });
  } catch (error) {
    console.error('Get medicine batches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching medicine batches',
      error: error.message
    });
  }
};

// @desc    Create new batch
// @route   POST /api/store-manager/inventory/:medicineId/batches
// @access  Private (Store Manager only)
const createBatch = async (req, res) => {
  try {
    const store = req.store;
    const { medicineId } = req.params;
    const {
      batchNumber,
      manufacturingDate,
      expiryDate,
      stripQuantity = 0,
      individualQuantity = 0,
      storageLocation,
      supplier,
      notes
    } = req.body;

    // Verify medicine belongs to this store
    const medicine = await Medicine.findOne({ _id: medicineId, store: store._id });
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    // Validate required fields
    if (!batchNumber || !manufacturingDate || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Batch number, manufacturing date, and expiry date are required'
      });
    }

    // Check if batch already exists for this medicine
    const existingBatch = await Batch.findOne({
      medicine: medicineId,
      batchNumber,
      store: store._id
    });

    if (existingBatch) {
      return res.status(400).json({
        success: false,
        message: 'Batch with this number already exists for this medicine'
      });
    }

    // Validate dates
    const mfgDate = new Date(manufacturingDate);
    const expDate = new Date(expiryDate);
    
    if (mfgDate >= expDate) {
      return res.status(400).json({
        success: false,
        message: 'Manufacturing date must be before expiry date'
      });
    }

    // Create batch
    const batch = await Batch.create({
      medicine: medicineId,
      store: store._id,
      batchNumber,
      manufacturingDate: mfgDate,
      expiryDate: expDate,
      stripQuantity: parseInt(stripQuantity) || 0,
      individualQuantity: parseInt(individualQuantity) || 0,
      storageLocation,
      supplier,
      notes,
      createdBy: req.user.id
    });

    // Populate the created batch
    await batch.populate('medicine', 'name genericName manufacturer');
    await batch.populate('supplier', 'name contactPerson');
    await batch.populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      data: batch
    });
  } catch (error) {
    console.error('Create batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating batch',
      error: error.message
    });
  }
};

// @desc    Update batch
// @route   PUT /api/store-manager/batches/:id
// @access  Private (Store Manager only)
const updateBatch = async (req, res) => {
  try {
    const store = req.store;
    const { id } = req.params;

    // Find batch
    const batch = await Batch.findOne({ _id: id, store: store._id });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Update fields
    const updateFields = { ...req.body, updatedBy: req.user.id };
    
    // Validate dates if provided
    if (updateFields.manufacturingDate && updateFields.expiryDate) {
      const mfgDate = new Date(updateFields.manufacturingDate);
      const expDate = new Date(updateFields.expiryDate);
      
      if (mfgDate >= expDate) {
        return res.status(400).json({
          success: false,
          message: 'Manufacturing date must be before expiry date'
        });
      }
    }

    const updatedBatch = await Batch.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('medicine', 'name genericName manufacturer')
      .populate('supplier', 'name contactPerson')
      .populate('updatedBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Batch updated successfully',
      data: updatedBatch
    });
  } catch (error) {
    console.error('Update batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating batch',
      error: error.message
    });
  }
};

// @desc    Delete batch
// @route   DELETE /api/store-manager/batches/:id
// @access  Private (Store Manager only)
const deleteBatch = async (req, res) => {
  try {
    const store = req.store;
    const { id } = req.params;

    // Find batch
    const batch = await Batch.findOne({ _id: id, store: store._id });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Soft delete by setting isActive to false
    await Batch.findByIdAndUpdate(id, { 
      isActive: false, 
      updatedBy: req.user.id 
    });

    res.status(200).json({
      success: true,
      message: 'Batch deleted successfully'
    });
  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting batch',
      error: error.message
    });
  }
};

// @desc    Get available batches for a medicine with FIFO/FEFO sorting
// @route   GET /api/store-manager/inventory/:medicineId/available-batches
// @access  Private (Store Manager only)
const getAvailableBatches = async (req, res) => {
  try {
    const store = req.store;
    const { medicineId } = req.params;
    const { unitType = 'strip', strategy = 'FEFO' } = req.query;

    // Verify medicine belongs to this store
    const medicine = await Medicine.findOne({ _id: medicineId, store: store._id });
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    // Build query for available batches
    const query = {
      medicine: medicineId,
      store: store._id,
      isActive: true,
      isExpired: false
    };

    // Add stock filter based on unit type
    if (unitType === 'strip') {
      query.stripQuantity = { $gt: 0 };
    } else {
      query.individualQuantity = { $gt: 0 };
    }

    // Sort based on strategy
    let sortOrder = {};
    if (strategy === 'FEFO') {
      sortOrder = { expiryDate: 1 }; // First Expiry First Out
    } else if (strategy === 'FIFO') {
      sortOrder = { manufacturingDate: 1 }; // First In First Out
    } else {
      sortOrder = { createdAt: 1 }; // Default to creation order
    }

    const batches = await Batch.find(query)
      .populate('supplier', 'name contactPerson')
      .sort(sortOrder);

    res.status(200).json({
      success: true,
      data: batches,
      strategy,
      unitType
    });
  } catch (error) {
    console.error('Get available batches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching available batches',
      error: error.message
    });
  }
};

// @desc    Synchronize medicine stock with batch totals
// @route   POST /api/store-manager/batches/synchronize
// @access  Private (Store Manager only)
const synchronizeBatchStock = async (req, res) => {
  try {
    const store = req.store;
    const { medicineId } = req.body;

    if (medicineId) {
      // Synchronize specific medicine
      const result = await BatchService.synchronizeMedicineStock(medicineId, store._id);
      res.status(200).json({
        success: true,
        message: 'Medicine stock synchronized with batches',
        data: result
      });
    } else {
      // Synchronize all medicines in the store
      const medicines = await Medicine.find({ store: store._id });
      const results = [];

      for (const medicine of medicines) {
        try {
          const result = await BatchService.synchronizeMedicineStock(medicine._id, store._id);
          results.push(result);
        } catch (error) {
          console.error(`Error synchronizing medicine ${medicine.name}:`, error);
          results.push({
            medicineId: medicine._id,
            error: error.message
          });
        }
      }

      res.status(200).json({
        success: true,
        message: `Synchronized ${results.length} medicines with batch data`,
        data: results
      });
    }
  } catch (error) {
    console.error('Synchronize batch stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error synchronizing batch stock',
      error: error.message
    });
  }
};

// @desc    Update expired batch status
// @route   POST /api/store-manager/batches/update-expired
// @access  Private (Store Manager only)
const updateExpiredBatches = async (req, res) => {
  try {
    const store = req.store;
    const result = await BatchService.updateExpiredStatus(store._id);

    res.status(200).json({
      success: true,
      message: 'Expired batch status updated',
      data: result
    });
  } catch (error) {
    console.error('Update expired batches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating expired batches',
      error: error.message
    });
  }
};

// @desc    Migrate medicine batch data to batch documents
// @route   POST /api/store-manager/batches/migrate-from-medicines
// @access  Private (Store Manager only)
const migrateMedicineBatches = async (req, res) => {
  try {
    const store = req.store;

    // Find medicines that have batch information but no corresponding batch documents
    const medicinesWithBatches = await Medicine.find({
      store: store._id,
      isActive: true,
      batchNumber: { $exists: true, $ne: null, $ne: '' }
    }).populate('rackLocations.rack', 'rackNumber name');

    const results = [];
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const medicine of medicinesWithBatches) {
      try {
        // Check if batch document already exists
        const existingBatch = await Batch.findOne({
          medicine: medicine._id,
          batchNumber: medicine.batchNumber,
          store: store._id,
          isActive: true
        });

        if (existingBatch) {
          skipped++;
          results.push({
            medicineId: medicine._id,
            medicineName: medicine.name,
            batchNumber: medicine.batchNumber,
            status: 'skipped',
            reason: 'Batch document already exists'
          });
          continue;
        }

        // Create batch document from medicine data
        // Extract storage location from the new rack system or legacy system
        let storageLocation = '';
        if (medicine.primaryRackLocation && medicine.primaryRackLocation.rack) {
          // Use primary rack location if available
          const rack = medicine.primaryRackLocation.rack;
          const shelf = medicine.primaryRackLocation.shelf || '';
          const position = medicine.primaryRackLocation.position || '';
          storageLocation = `${rack.rackNumber || rack.name || rack._id}${shelf ? `-${shelf}` : ''}${position ? `-${position}` : ''}`;
        } else if (medicine.rackLocations && medicine.rackLocations.length > 0) {
          // Use first rack location if no primary location
          const rackLocation = medicine.rackLocations[0];
          const rack = rackLocation.rack;
          const shelf = rackLocation.shelf || '';
          const position = rackLocation.position || '';
          storageLocation = `${rack.rackNumber || rack.name || rack._id}${shelf ? `-${shelf}` : ''}${position ? `-${position}` : ''}`;
        } else if (medicine.storageLocation?.rack) {
          // Fallback to legacy storage location
          storageLocation = medicine.storageLocation.rack;
        }

        const batchData = {
          medicine: medicine._id,
          store: store._id,
          batchNumber: medicine.batchNumber,
          manufacturingDate: medicine.manufacturingDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default to 30 days ago
          expiryDate: medicine.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default to 1 year from now
          stripQuantity: medicine.stripInfo?.stock || 0,
          individualQuantity: medicine.individualInfo?.stock || 0,
          storageLocation: storageLocation,
          notes: `Migrated from medicine record on ${new Date().toISOString()}`,
          createdBy: req.user.id
        };

        // Only add supplier if it's a valid ObjectId
        if (medicine.supplier &&
            typeof medicine.supplier === 'string' &&
            medicine.supplier.length === 24 &&
            medicine.supplier !== '' &&
            /^[0-9a-fA-F]{24}$/.test(medicine.supplier)) {
          batchData.supplier = medicine.supplier;
        }

        const batch = await Batch.create(batchData);
        created++;

        results.push({
          medicineId: medicine._id,
          medicineName: medicine.name,
          batchNumber: medicine.batchNumber,
          batchId: batch._id,
          status: 'created',
          stripQuantity: batchData.stripQuantity,
          individualQuantity: batchData.individualQuantity
        });

      } catch (error) {
        errors++;
        console.error(`Error migrating batch for medicine ${medicine.name}:`, error);
        results.push({
          medicineId: medicine._id,
          medicineName: medicine.name,
          batchNumber: medicine.batchNumber,
          status: 'error',
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Batch migration completed. Created: ${created}, Skipped: ${skipped}, Errors: ${errors}`,
      data: {
        summary: {
          totalMedicines: medicinesWithBatches.length,
          created,
          skipped,
          errors
        },
        results
      }
    });

  } catch (error) {
    console.error('Migrate medicine batches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error migrating medicine batches',
      error: error.message
    });
  }
};

// @desc    Clean up invalid supplier references in batches
// @route   POST /api/store-manager/batches/cleanup-suppliers
// @access  Private (Store Manager only)
const cleanupBatchSuppliers = async (req, res) => {
  try {
    const store = req.store;

    // Find batches with invalid supplier references
    const batchesWithInvalidSuppliers = await Batch.find({
      store: store._id,
      isActive: true,
      $or: [
        { supplier: '' },
        { supplier: { $regex: /^(?!^[0-9a-fA-F]{24}$)/ } }, // Not a valid 24-char hex string
        { supplier: { $type: 'string', $not: { $regex: /^[0-9a-fA-F]{24}$/ } } }
      ]
    });

    let cleaned = 0;
    const results = [];

    for (const batch of batchesWithInvalidSuppliers) {
      try {
        // Clear invalid supplier reference
        batch.supplier = null;
        await batch.save();
        cleaned++;

        results.push({
          batchId: batch._id,
          batchNumber: batch.batchNumber,
          status: 'cleaned',
          previousSupplier: batch.supplier
        });
      } catch (error) {
        console.error(`Error cleaning batch ${batch._id}:`, error);
        results.push({
          batchId: batch._id,
          batchNumber: batch.batchNumber,
          status: 'error',
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Supplier cleanup completed. Cleaned: ${cleaned} batches`,
      data: {
        summary: {
          totalBatches: batchesWithInvalidSuppliers.length,
          cleaned
        },
        results
      }
    });

  } catch (error) {
    console.error('Cleanup batch suppliers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cleaning up batch suppliers',
      error: error.message
    });
  }
};

// @desc    Select batches for sale using FIFO/FEFO logic
// @route   POST /api/store-manager/batches/select-for-sale
// @access  Private (Store Manager only)
const selectBatchesForSale = async (req, res) => {
  try {
    const store = req.store;
    const { medicineId, quantity, unitType = 'strip', strategy = 'FEFO' } = req.body;

    if (!medicineId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Medicine ID and valid quantity are required'
      });
    }

    // Verify medicine belongs to this store
    const medicine = await Medicine.findOne({ _id: medicineId, store: store._id });
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    // Get available batches sorted by strategy
    const query = {
      medicine: medicineId,
      store: store._id,
      isActive: true,
      isExpired: false
    };

    // Add stock filter based on unit type
    if (unitType === 'strip') {
      query.stripQuantity = { $gt: 0 };
    } else {
      query.individualQuantity = { $gt: 0 };
    }

    // Sort based on strategy
    let sortOrder = {};
    if (strategy === 'FEFO') {
      sortOrder = { expiryDate: 1 };
    } else if (strategy === 'FIFO') {
      sortOrder = { manufacturingDate: 1 };
    } else {
      sortOrder = { createdAt: 1 };
    }

    const availableBatches = await Batch.find(query)
      .populate('supplier', 'name contactPerson')
      .sort(sortOrder);

    // Select batches to fulfill the required quantity
    const selectedBatches = [];
    let remainingQuantity = quantity;

    for (const batch of availableBatches) {
      if (remainingQuantity <= 0) break;

      const availableInBatch = unitType === 'strip' ? batch.stripQuantity : batch.individualQuantity;
      const quantityFromBatch = Math.min(remainingQuantity, availableInBatch);

      if (quantityFromBatch > 0) {
        selectedBatches.push({
          batchId: batch._id,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          manufacturingDate: batch.manufacturingDate,
          quantitySelected: quantityFromBatch,
          availableQuantity: availableInBatch,
          storageLocation: batch.storageLocation,
          supplier: batch.supplier
        });

        remainingQuantity -= quantityFromBatch;
      }
    }

    // Check if we have enough stock
    const totalSelected = selectedBatches.reduce((sum, batch) => sum + batch.quantitySelected, 0);
    const shortfall = quantity - totalSelected;

    res.status(200).json({
      success: true,
      data: {
        selectedBatches,
        totalRequested: quantity,
        totalSelected,
        shortfall,
        canFulfill: shortfall === 0,
        strategy,
        unitType
      }
    });
  } catch (error) {
    console.error('Select batches for sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error selecting batches for sale',
      error: error.message
    });
  }
};

// @desc    Update storage locations for existing batches
// @route   POST /api/store-manager/batches/update-storage-locations
// @access  Private (Store Manager only)
const updateBatchStorageLocations = async (req, res) => {
  try {
    const store = req.store;

    // Find all batches with empty or missing storage locations
    const batchesNeedingUpdate = await Batch.find({
      store: store._id,
      isActive: true,
      $or: [
        { storageLocation: { $exists: false } },
        { storageLocation: '' },
        { storageLocation: null }
      ]
    }).populate('medicine');

    if (batchesNeedingUpdate.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No batches need storage location updates',
        data: {
          summary: {
            totalBatches: 0,
            updated: 0
          }
        }
      });
    }

    let updated = 0;
    const results = [];

    for (const batch of batchesNeedingUpdate) {
      try {
        // Fetch the medicine with rack location data
        const medicine = await Medicine.findById(batch.medicine._id)
          .populate('rackLocations.rack', 'rackNumber name');

        if (!medicine) {
          results.push({
            batchId: batch._id,
            batchNumber: batch.batchNumber,
            status: 'error',
            reason: 'Medicine not found'
          });
          continue;
        }

        // Extract storage location from the new rack system or legacy system
        let storageLocation = '';
        if (medicine.primaryRackLocation && medicine.primaryRackLocation.rack) {
          // Use primary rack location if available
          const rack = medicine.primaryRackLocation.rack;
          const shelf = medicine.primaryRackLocation.shelf || '';
          const position = medicine.primaryRackLocation.position || '';
          storageLocation = `${rack.rackNumber || rack.name || rack._id}${shelf ? `-${shelf}` : ''}${position ? `-${position}` : ''}`;
        } else if (medicine.rackLocations && medicine.rackLocations.length > 0) {
          // Use first rack location if no primary location
          const rackLocation = medicine.rackLocations[0];
          const rack = rackLocation.rack;
          const shelf = rackLocation.shelf || '';
          const position = rackLocation.position || '';
          storageLocation = `${rack.rackNumber || rack.name || rack._id}${shelf ? `-${shelf}` : ''}${position ? `-${position}` : ''}`;
        } else if (medicine.storageLocation?.rack) {
          // Fallback to legacy storage location
          storageLocation = medicine.storageLocation.rack;
        }

        // Update the batch with the new storage location
        batch.storageLocation = storageLocation;
        await batch.save();
        updated++;

        results.push({
          batchId: batch._id,
          batchNumber: batch.batchNumber,
          medicineName: medicine.name,
          status: 'updated',
          newStorageLocation: storageLocation
        });

      } catch (error) {
        console.error(`Error updating batch ${batch._id}:`, error);
        results.push({
          batchId: batch._id,
          batchNumber: batch.batchNumber,
          status: 'error',
          reason: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Storage location update completed. Updated: ${updated} batches`,
      data: {
        summary: {
          totalBatches: batchesNeedingUpdate.length,
          updated
        },
        results
      }
    });

  } catch (error) {
    console.error('Update batch storage locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating batch storage locations',
      error: error.message
    });
  }
};

module.exports = {
  getBatches,
  getMedicineBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  getAvailableBatches,
  selectBatchesForSale,
  synchronizeBatchStock,
  updateExpiredBatches,
  migrateMedicineBatches,
  cleanupBatchSuppliers,
  updateBatchStorageLocations
};

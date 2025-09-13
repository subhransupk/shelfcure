const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');
const Supplier = require('../models/Supplier');

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

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const batches = await Batch.find(query)
      .populate('medicine', 'name genericName manufacturer category')
      .populate('supplier', 'name contactPerson')
      .populate('createdBy', 'name')
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

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

module.exports = {
  getBatches,
  getMedicineBatches,
  createBatch,
  updateBatch,
  deleteBatch
};

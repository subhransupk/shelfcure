const Rack = require('../models/Rack');
const RackLocation = require('../models/RackLocation');
const Medicine = require('../models/Medicine');

// ===================
// RACK CRUD OPERATIONS
// ===================

// @desc    Get all racks for a store
// @route   GET /api/store-manager/racks
// @access  Private (Store Manager only)
const getRacks = async (req, res) => {
  try {
    const store = req.store;
    const { page = 1, limit = 20, search, category } = req.query;

    let query = { store: store._id, isActive: true };

    // Add search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { rackNumber: searchRegex },
        { name: searchRegex },
        { description: searchRegex }
      ];
    }

    // Add category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    const racks = await Rack.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ rackNumber: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Rack.countDocuments(query);

    res.status(200).json({
      success: true,
      count: racks.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: racks
    });
  } catch (error) {
    console.error('Get racks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching racks'
    });
  }
};

// @desc    Get single rack with detailed information
// @route   GET /api/store-manager/racks/:id
// @access  Private (Store Manager only)
const getRack = async (req, res) => {
  try {
    const store = req.store;
    const rackId = req.params.id;

    const rack = await Rack.findOne({
      _id: rackId,
      store: store._id,
      isActive: true
    }).populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!rack) {
      return res.status(404).json({
        success: false,
        message: 'Rack not found'
      });
    }

    // Get medicines assigned to this rack
    const rackLocations = await RackLocation.find({
      rack: rackId,
      store: store._id,
      isActive: true
    }).populate('medicine', 'name genericName manufacturer category')
      .populate('assignedBy', 'name email')
      .sort({ shelf: 1, position: 1 });

    res.status(200).json({
      success: true,
      data: {
        rack,
        locations: rackLocations
      }
    });
  } catch (error) {
    console.error('Get rack error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching rack'
    });
  }
};

// @desc    Create new rack
// @route   POST /api/store-manager/racks
// @access  Private (Store Manager only)
const createRack = async (req, res) => {
  try {
    const store = req.store;
    const userId = req.user.id;

    // Check if rack number already exists in this store
    const existingRack = await Rack.findOne({
      rackNumber: req.body.rackNumber,
      store: store._id,
      isActive: true
    });

    if (existingRack) {
      return res.status(400).json({
        success: false,
        message: 'Rack number already exists in this store'
      });
    }

    // Handle simplified rack creation
    let rackData = {
      rackNumber: req.body.rackNumber,
      name: req.body.name,
      description: req.body.description || '',
      notes: req.body.notes || '',
      category: req.body.category || 'general',
      accessLevel: req.body.accessLevel || 'public',
      store: store._id,
      createdBy: userId
    };

    // Handle location - support both simple string and complex object
    if (req.body.location) {
      if (typeof req.body.location === 'string') {
        rackData.location = {
          zone: req.body.location,
          floor: 'Ground'
        };
      } else {
        rackData.location = req.body.location;
      }
    }

    // Handle specifications
    rackData.specifications = {
      material: req.body.specifications?.material || 'steel',
      maxCapacity: req.body.specifications?.maxCapacity || undefined,
      specialConditions: req.body.specifications?.specialConditions || []
    };

    // Generate shelves automatically if numberOfShelves is provided
    if (req.body.numberOfShelves) {
      const numberOfShelves = parseInt(req.body.numberOfShelves);
      if (numberOfShelves > 0 && numberOfShelves <= 20) {
        rackData.shelves = [];
        for (let i = 1; i <= numberOfShelves; i++) {
          rackData.shelves.push({
            shelfNumber: i.toString(),
            positions: [
              {
                positionNumber: '1',
                isOccupied: false
              },
              {
                positionNumber: '2',
                isOccupied: false
              },
              {
                positionNumber: '3',
                isOccupied: false
              }
            ]
          });
        }
      }
    } else if (req.body.shelves) {
      // Use provided shelves if available
      rackData.shelves = req.body.shelves;
    } else {
      // Default to 3 shelves with 3 positions each
      rackData.shelves = [
        {
          shelfNumber: '1',
          positions: [
            { positionNumber: '1', isOccupied: false },
            { positionNumber: '2', isOccupied: false },
            { positionNumber: '3', isOccupied: false }
          ]
        },
        {
          shelfNumber: '2',
          positions: [
            { positionNumber: '1', isOccupied: false },
            { positionNumber: '2', isOccupied: false },
            { positionNumber: '3', isOccupied: false }
          ]
        },
        {
          shelfNumber: '3',
          positions: [
            { positionNumber: '1', isOccupied: false },
            { positionNumber: '2', isOccupied: false },
            { positionNumber: '3', isOccupied: false }
          ]
        }
      ];
    }

    const rack = await Rack.create(rackData);

    res.status(201).json({
      success: true,
      message: 'Rack created successfully',
      data: rack
    });
  } catch (error) {
    console.error('Create rack error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating rack'
    });
  }
};

// @desc    Update rack
// @route   PUT /api/store-manager/racks/:id
// @access  Private (Store Manager only)
const updateRack = async (req, res) => {
  try {
    const store = req.store;
    const userId = req.user.id;
    const rackId = req.params.id;

    // Check if rack exists and belongs to this store
    let rack = await Rack.findOne({
      _id: rackId,
      store: store._id,
      isActive: true
    });

    if (!rack) {
      return res.status(404).json({
        success: false,
        message: 'Rack not found'
      });
    }

    // Check if rack number is being changed and if it conflicts
    if (req.body.rackNumber && req.body.rackNumber !== rack.rackNumber) {
      const existingRack = await Rack.findOne({
        rackNumber: req.body.rackNumber,
        store: store._id,
        isActive: true,
        _id: { $ne: rackId }
      });

      if (existingRack) {
        return res.status(400).json({
          success: false,
          message: 'Rack number already exists in this store'
        });
      }
    }

    // Handle simplified rack update
    let updateData = {
      rackNumber: req.body.rackNumber || rack.rackNumber,
      name: req.body.name || rack.name,
      description: req.body.description !== undefined ? req.body.description : rack.description,
      notes: req.body.notes !== undefined ? req.body.notes : rack.notes,
      category: req.body.category || rack.category,
      accessLevel: req.body.accessLevel || rack.accessLevel,
      updatedBy: userId
    };

    // Handle location - support both simple string and complex object
    if (req.body.location !== undefined) {
      if (typeof req.body.location === 'string') {
        updateData.location = {
          zone: req.body.location,
          floor: rack.location?.floor || 'Ground'
        };
      } else {
        updateData.location = req.body.location;
      }
    }

    // Handle specifications
    if (req.body.specifications) {
      updateData.specifications = {
        ...rack.specifications,
        ...req.body.specifications
      };
    }

    // Handle numberOfShelves - regenerate shelves if provided
    if (req.body.numberOfShelves) {
      const numberOfShelves = parseInt(req.body.numberOfShelves);
      if (numberOfShelves > 0 && numberOfShelves <= 20) {
        updateData.shelves = [];
        for (let i = 1; i <= numberOfShelves; i++) {
          updateData.shelves.push({
            shelfNumber: i.toString(),
            positions: [
              {
                positionNumber: '1',
                isOccupied: false
              },
              {
                positionNumber: '2',
                isOccupied: false
              },
              {
                positionNumber: '3',
                isOccupied: false
              }
            ]
          });
        }
      }
    } else if (req.body.shelves) {
      // Use provided shelves if available
      updateData.shelves = req.body.shelves;
    }

    // Update rack
    Object.assign(rack, updateData);
    await rack.save();

    res.status(200).json({
      success: true,
      message: 'Rack updated successfully',
      data: rack
    });
  } catch (error) {
    console.error('Update rack error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating rack'
    });
  }
};

// @desc    Delete rack (soft delete)
// @route   DELETE /api/store-manager/racks/:id
// @access  Private (Store Manager only)
const deleteRack = async (req, res) => {
  try {
    const store = req.store;
    const userId = req.user.id;
    const rackId = req.params.id;

    const rack = await Rack.findOne({
      _id: rackId,
      store: store._id,
      isActive: true
    });

    if (!rack) {
      return res.status(404).json({
        success: false,
        message: 'Rack not found'
      });
    }

    // Check if rack has any active medicine locations
    const activeLocations = await RackLocation.countDocuments({
      rack: rackId,
      store: store._id,
      isActive: true
    });

    if (activeLocations > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete rack with active medicine locations. Please move all medicines first.'
      });
    }

    // Soft delete
    rack.isActive = false;
    rack.updatedBy = userId;
    await rack.save();

    res.status(200).json({
      success: true,
      message: 'Rack deleted successfully'
    });
  } catch (error) {
    console.error('Delete rack error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting rack'
    });
  }
};

module.exports = {
  getRacks,
  getRack,
  createRack,
  updateRack,
  deleteRack
};

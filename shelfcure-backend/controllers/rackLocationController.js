const RackLocation = require('../models/RackLocation');
const Medicine = require('../models/Medicine');
const Rack = require('../models/Rack');

// ===================
// RACK LOCATION MANAGEMENT
// ===================

// @desc    Get rack layout with medicine assignments
// @route   GET /api/store-manager/rack-layout/:rackId
// @access  Private (Store Manager only)
const getRackLayout = async (req, res) => {
  try {
    const store = req.store;
    const rackId = req.params.rackId;

    console.log('getRackLayout called with rackId:', rackId);
    console.log('Store ID:', store._id);

    // Validate rackId format
    if (!rackId || rackId === 'dummy-rack-id') {
      return res.status(400).json({
        success: false,
        message: 'Invalid rack ID provided'
      });
    }

    // Get rack details
    const rack = await Rack.findOne({
      _id: rackId,
      store: store._id,
      isActive: true
    });

    console.log('Rack found:', !!rack);

    if (!rack) {
      return res.status(404).json({
        success: false,
        message: 'Rack not found'
      });
    }

    // Get all medicine locations for this rack
    const locations = await RackLocation.find({
      rack: rackId,
      store: store._id,
      isActive: true
    }).populate('medicine', 'name genericName manufacturer category stripInfo individualInfo')
      .populate('assignedBy', 'name email')
      .sort({ shelf: 1, position: 1 });

    // Create layout structure
    const layout = rack.shelves.map(shelf => ({
      shelfNumber: shelf.shelfNumber,
      positions: shelf.positions.map(position => {
        const medicineLocation = locations.find(loc => 
          loc.shelf === shelf.shelfNumber && loc.position === position.positionNumber
        );

        return {
          positionNumber: position.positionNumber,
          isOccupied: !!medicineLocation,
          medicine: medicineLocation ? {
            id: medicineLocation.medicine._id,
            name: medicineLocation.medicine.name,
            genericName: medicineLocation.medicine.genericName,
            manufacturer: medicineLocation.medicine.manufacturer,
            category: medicineLocation.medicine.category,
            stripQuantity: medicineLocation.stripQuantity,
            individualQuantity: medicineLocation.individualQuantity,
            priority: medicineLocation.priority,
            stockStatus: medicineLocation.stockStatus,
            assignedDate: medicineLocation.assignedDate,
            assignedBy: medicineLocation.assignedBy
          } : null,
          ...position
        };
      })
    }));

    res.status(200).json({
      success: true,
      data: {
        rack: {
          id: rack._id,
          rackNumber: rack.rackNumber,
          name: rack.name,
          category: rack.category,
          totalPositions: rack.totalPositions,
          occupiedPositions: rack.occupiedPositions,
          occupancyPercentage: rack.occupancyPercentage
        },
        layout
      }
    });
  } catch (error) {
    console.error('Get rack layout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching rack layout'
    });
  }
};

// @desc    Assign medicine to rack location
// @route   POST /api/store-manager/rack-locations
// @access  Private (Store Manager only)
const assignMedicineToLocation = async (req, res) => {
  try {
    const store = req.store;
    const userId = req.user.id;
    const {
      medicineId,
      rackId,
      shelf,
      position,
      stripQuantity = 0,
      individualQuantity = 0,
      priority = 'primary',
      notes
    } = req.body;

    // Validate medicine exists and belongs to store
    const medicine = await Medicine.findOne({
      _id: medicineId,
      store: store._id,
      isActive: true
    });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    // Validate rack exists and belongs to store
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

    // Validate shelf and position exist in rack
    const rackShelf = rack.shelves.find(s => s.shelfNumber === shelf);
    if (!rackShelf) {
      return res.status(400).json({
        success: false,
        message: 'Shelf not found in rack'
      });
    }

    const rackPosition = rackShelf.positions.find(p => p.positionNumber === position);
    if (!rackPosition) {
      return res.status(400).json({
        success: false,
        message: 'Position not found in shelf'
      });
    }

    // Check if location is already occupied by another medicine
    const existingLocation = await RackLocation.findOne({
      rack: rackId,
      shelf,
      position,
      store: store._id,
      isActive: true,
      medicine: { $ne: medicineId }
    });

    if (existingLocation) {
      return res.status(400).json({
        success: false,
        message: 'Position is already occupied by another medicine'
      });
    }

    // Check if this medicine already has a location at this position
    let rackLocation = await RackLocation.findOne({
      medicine: medicineId,
      rack: rackId,
      shelf,
      position,
      store: store._id
    });

    if (rackLocation) {
      // Update existing location
      rackLocation.stripQuantity = stripQuantity;
      rackLocation.individualQuantity = individualQuantity;
      rackLocation.priority = priority;
      rackLocation.notes = notes;
      rackLocation.isActive = true;
      rackLocation.lastUpdatedBy = userId;
      
      // Add to movement history
      rackLocation.movementHistory.push({
        action: 'quantity_updated',
        quantity: {
          strips: stripQuantity,
          individual: individualQuantity
        },
        performedBy: userId,
        reason: 'Location assignment updated',
        notes: notes || 'Quantity updated during assignment'
      });

      await rackLocation.save();
    } else {
      // Create new location assignment
      rackLocation = await RackLocation.create({
        medicine: medicineId,
        store: store._id,
        rack: rackId,
        shelf,
        position,
        stripQuantity,
        individualQuantity,
        priority,
        notes,
        assignedBy: userId,
        movementHistory: [{
          action: 'assigned',
          quantity: {
            strips: stripQuantity,
            individual: individualQuantity
          },
          performedBy: userId,
          reason: 'Initial assignment',
          notes: notes || 'Medicine assigned to rack location'
        }]
      });
    }

    // Update rack position occupancy
    rack.updatePositionOccupancy(shelf, position, true);
    await rack.save();

    // Populate the response
    await rackLocation.populate('medicine', 'name genericName manufacturer category');
    await rackLocation.populate('rack', 'rackNumber name');
    await rackLocation.populate('assignedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Medicine assigned to rack location successfully',
      data: rackLocation
    });
  } catch (error) {
    console.error('Assign medicine to location error:', error);
    
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
      message: 'Server error while assigning medicine to location'
    });
  }
};

// @desc    Update medicine quantity at location
// @route   PUT /api/store-manager/rack-locations/:id
// @access  Private (Store Manager only)
const updateLocationQuantity = async (req, res) => {
  try {
    const store = req.store;
    const userId = req.user.id;
    const locationId = req.params.id;
    const { stripQuantity, individualQuantity, notes, reason } = req.body;

    const rackLocation = await RackLocation.findOne({
      _id: locationId,
      store: store._id,
      isActive: true
    });

    if (!rackLocation) {
      return res.status(404).json({
        success: false,
        message: 'Rack location not found'
      });
    }

    // Update quantity using the model method
    await rackLocation.updateQuantity(
      stripQuantity,
      individualQuantity,
      userId,
      reason || 'Quantity updated'
    );

    // Populate the response
    await rackLocation.populate('medicine', 'name genericName manufacturer category');
    await rackLocation.populate('rack', 'rackNumber name');

    res.status(200).json({
      success: true,
      message: 'Location quantity updated successfully',
      data: rackLocation
    });
  } catch (error) {
    console.error('Update location quantity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating location quantity'
    });
  }
};

// @desc    Move medicine to different location
// @route   PUT /api/store-manager/rack-locations/:id/move
// @access  Private (Store Manager only)
const moveMedicineLocation = async (req, res) => {
  try {
    const store = req.store;
    const userId = req.user.id;
    const locationId = req.params.id;
    const { newRackId, newShelf, newPosition, reason } = req.body;

    const rackLocation = await RackLocation.findOne({
      _id: locationId,
      store: store._id,
      isActive: true
    });

    if (!rackLocation) {
      return res.status(404).json({
        success: false,
        message: 'Rack location not found'
      });
    }

    // Validate new rack exists
    const newRack = await Rack.findOne({
      _id: newRackId,
      store: store._id,
      isActive: true
    });

    if (!newRack) {
      return res.status(404).json({
        success: false,
        message: 'New rack not found'
      });
    }

    // Validate new shelf and position
    const newRackShelf = newRack.shelves.find(s => s.shelfNumber === newShelf);
    if (!newRackShelf) {
      return res.status(400).json({
        success: false,
        message: 'New shelf not found in rack'
      });
    }

    const newRackPosition = newRackShelf.positions.find(p => p.positionNumber === newPosition);
    if (!newRackPosition) {
      return res.status(400).json({
        success: false,
        message: 'New position not found in shelf'
      });
    }

    // Check if new location is occupied
    const existingLocation = await RackLocation.findOne({
      rack: newRackId,
      shelf: newShelf,
      position: newPosition,
      store: store._id,
      isActive: true,
      _id: { $ne: locationId }
    });

    if (existingLocation) {
      return res.status(400).json({
        success: false,
        message: 'New position is already occupied'
      });
    }

    // Update old rack position occupancy
    const oldRack = await Rack.findById(rackLocation.rack);
    if (oldRack) {
      oldRack.updatePositionOccupancy(rackLocation.shelf, rackLocation.position, false);
      await oldRack.save();
    }

    // Move to new location using model method
    await rackLocation.moveToLocation(newRackId, newShelf, newPosition, userId, reason);

    // Update new rack position occupancy
    newRack.updatePositionOccupancy(newShelf, newPosition, true);
    await newRack.save();

    // Populate the response
    await rackLocation.populate('medicine', 'name genericName manufacturer category');
    await rackLocation.populate('rack', 'rackNumber name');

    res.status(200).json({
      success: true,
      message: 'Medicine moved to new location successfully',
      data: rackLocation
    });
  } catch (error) {
    console.error('Move medicine location error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while moving medicine location'
    });
  }
};

// @desc    Remove medicine from rack location
// @route   DELETE /api/store-manager/rack-locations/:id
// @access  Private (Store Manager only)
const removeMedicineFromLocation = async (req, res) => {
  try {
    const store = req.store;
    const userId = req.user.id;
    const locationId = req.params.id;
    const { reason } = req.body;

    const rackLocation = await RackLocation.findOne({
      _id: locationId,
      store: store._id,
      isActive: true
    });

    if (!rackLocation) {
      return res.status(404).json({
        success: false,
        message: 'Rack location not found'
      });
    }

    // Add to movement history
    rackLocation.movementHistory.push({
      action: 'removed',
      quantity: {
        strips: rackLocation.stripQuantity,
        individual: rackLocation.individualQuantity
      },
      performedBy: userId,
      reason: reason || 'Medicine removed from location',
      notes: `Removed from ${rackLocation.rack}-${rackLocation.shelf}-${rackLocation.position}`
    });

    // Soft delete
    rackLocation.isActive = false;
    rackLocation.lastUpdatedBy = userId;
    await rackLocation.save();

    // Update rack position occupancy
    const rack = await Rack.findById(rackLocation.rack);
    if (rack) {
      rack.updatePositionOccupancy(rackLocation.shelf, rackLocation.position, false);
      await rack.save();
    }

    res.status(200).json({
      success: true,
      message: 'Medicine removed from location successfully'
    });
  } catch (error) {
    console.error('Remove medicine from location error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing medicine from location'
    });
  }
};

// @desc    Search medicines by location
// @route   GET /api/store-manager/medicines/search-by-location
// @access  Private (Store Manager and Staff)
const searchMedicinesByLocation = async (req, res) => {
  try {
    const store = req.store;
    const { query, rackId, shelf, position } = req.query;

    let searchFilter = { store: store._id, isActive: true };

    // Add location filters
    if (rackId) searchFilter.rack = rackId;
    if (shelf) searchFilter.shelf = shelf;
    if (position) searchFilter.position = position;

    let locations = await RackLocation.find(searchFilter)
      .populate('medicine', 'name genericName manufacturer category barcode')
      .populate('rack', 'rackNumber name category')
      .sort({ 'medicine.name': 1 });

    // Apply text search if query provided
    if (query) {
      const searchRegex = new RegExp(query, 'i');
      locations = locations.filter(location => {
        const medicine = location.medicine;
        return medicine.name.match(searchRegex) ||
               (medicine.genericName && medicine.genericName.match(searchRegex)) ||
               medicine.manufacturer.match(searchRegex) ||
               (medicine.barcode && medicine.barcode.match(searchRegex));
      });
    }

    res.status(200).json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (error) {
    console.error('Search medicines by location error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching medicines by location'
    });
  }
};

module.exports = {
  getRackLayout,
  assignMedicineToLocation,
  updateLocationQuantity,
  moveMedicineLocation,
  removeMedicineFromLocation,
  searchMedicinesByLocation
};

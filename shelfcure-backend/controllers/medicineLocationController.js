const Medicine = require('../models/Medicine');
const RackLocation = require('../models/RackLocation');
const Rack = require('../models/Rack');

// ===================
// MEDICINE LOCATION SEARCH
// ===================

// @desc    Search medicine locations (for employees)
// @route   GET /api/store-manager/medicine-locations/search
// @access  Private (Store Manager and Staff)
const searchMedicineLocations = async (req, res) => {
  try {
    const store = req.store;
    const { query, page = 1, limit = 20 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Search medicines with their rack locations
    const medicines = await Medicine.searchWithLocations(store._id, query.trim())
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get rack locations for found medicines
    const medicineIds = medicines.map(med => med._id);
    const rackLocations = await RackLocation.find({
      medicine: { $in: medicineIds },
      store: store._id,
      isActive: true
    }).populate('rack', 'rackNumber name category location')
      .sort({ priority: 1, assignedDate: 1 });

    // Group locations by medicine
    const medicineLocations = medicines.map(medicine => {
      const locations = rackLocations.filter(loc => 
        loc.medicine.toString() === medicine._id.toString()
      );

      return {
        medicine: {
          id: medicine._id,
          name: medicine.name,
          genericName: medicine.genericName,
          manufacturer: medicine.manufacturer,
          category: medicine.category,
          barcode: medicine.barcode,
          totalStock: {
            strips: medicine.stripInfo?.stock || 0,
            individual: medicine.individualInfo?.stock || 0
          }
        },
        locations: locations.map(loc => ({
          id: loc._id,
          rack: {
            id: loc.rack._id,
            rackNumber: loc.rack.rackNumber,
            name: loc.rack.name,
            category: loc.rack.category,
            location: loc.rack.location
          },
          shelf: loc.shelf,
          position: loc.position,
          locationString: `${loc.rack.rackNumber}-${loc.shelf}-${loc.position}`,
          quantity: {
            strips: loc.stripQuantity,
            individual: loc.individualQuantity
          },
          stockStatus: loc.stockStatus,
          priority: loc.priority,
          assignedDate: loc.assignedDate,
          notes: loc.notes
        })),
        totalLocations: locations.length,
        totalRackStock: locations.reduce((total, loc) => ({
          strips: total.strips + (loc.stripQuantity || 0),
          individual: total.individual + (loc.individualQuantity || 0)
        }), { strips: 0, individual: 0 })
      };
    });

    // Filter out medicines with no rack locations if needed
    const medicinesWithLocations = medicineLocations.filter(med => med.locations.length > 0);

    res.status(200).json({
      success: true,
      count: medicinesWithLocations.length,
      data: medicinesWithLocations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: medicines.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Search medicine locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching medicine locations'
    });
  }
};

// @desc    Get medicine locations by medicine ID
// @route   GET /api/store-manager/medicine-locations/:medicineId
// @access  Private (Store Manager and Staff)
const getMedicineLocations = async (req, res) => {
  try {
    const store = req.store;
    const medicineId = req.params.medicineId;

    // Validate medicine exists
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

    // Get all rack locations for this medicine
    const rackLocations = await RackLocation.find({
      medicine: medicineId,
      store: store._id,
      isActive: true
    }).populate('rack', 'rackNumber name category location specifications')
      .populate('assignedBy', 'name email')
      .sort({ priority: 1, assignedDate: 1 });

    const locations = rackLocations.map(loc => ({
      id: loc._id,
      rack: {
        id: loc.rack._id,
        rackNumber: loc.rack.rackNumber,
        name: loc.rack.name,
        category: loc.rack.category,
        location: loc.rack.location,
        specialConditions: loc.rack.specifications?.specialConditions || []
      },
      shelf: loc.shelf,
      position: loc.position,
      locationString: `${loc.rack.rackNumber}-${loc.shelf}-${loc.position}`,
      quantity: {
        strips: loc.stripQuantity,
        individual: loc.individualQuantity
      },
      minQuantity: {
        strips: loc.minStripQuantity,
        individual: loc.minIndividualQuantity
      },
      stockStatus: loc.stockStatus,
      priority: loc.priority,
      assignedDate: loc.assignedDate,
      assignedBy: loc.assignedBy,
      lastUpdated: loc.lastUpdated,
      notes: loc.notes,
      isTemporary: loc.isTemporary
    }));

    const totalRackStock = locations.reduce((total, loc) => ({
      strips: total.strips + (loc.quantity.strips || 0),
      individual: total.individual + (loc.quantity.individual || 0)
    }), { strips: 0, individual: 0 });

    res.status(200).json({
      success: true,
      data: {
        medicine: {
          id: medicine._id,
          name: medicine.name,
          genericName: medicine.genericName,
          manufacturer: medicine.manufacturer,
          category: medicine.category,
          barcode: medicine.barcode,
          totalStock: {
            strips: medicine.stripInfo?.stock || 0,
            individual: medicine.individualInfo?.stock || 0
          }
        },
        locations,
        summary: {
          totalLocations: locations.length,
          totalRackStock,
          primaryLocation: locations.find(loc => loc.priority === 'primary'),
          stockDiscrepancy: {
            strips: (medicine.stripInfo?.stock || 0) - totalRackStock.strips,
            individual: (medicine.individualInfo?.stock || 0) - totalRackStock.individual
          }
        }
      }
    });
  } catch (error) {
    console.error('Get medicine locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching medicine locations'
    });
  }
};

// @desc    Get medicines without rack locations
// @route   GET /api/store-manager/medicine-locations/unassigned
// @access  Private (Store Manager only)
const getUnassignedMedicines = async (req, res) => {
  try {
    const store = req.store;
    const { page = 1, limit = 20, category } = req.query;

    let query = { store: store._id, isActive: true };
    
    // Add category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Find medicines without active rack locations
    const medicines = await Medicine.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter medicines that don't have any active rack locations
    const medicineIds = medicines.map(med => med._id);
    const medicinesWithLocations = await RackLocation.distinct('medicine', {
      medicine: { $in: medicineIds },
      store: store._id,
      isActive: true
    });

    const unassignedMedicines = medicines.filter(medicine => 
      !medicinesWithLocations.some(id => id.toString() === medicine._id.toString())
    );

    const total = await Medicine.countDocuments(query);

    res.status(200).json({
      success: true,
      count: unassignedMedicines.length,
      data: unassignedMedicines.map(medicine => ({
        _id: medicine._id,
        id: medicine._id,
        name: medicine.name,
        genericName: medicine.genericName,
        manufacturer: medicine.manufacturer,
        category: medicine.category,
        barcode: medicine.barcode,
        inventory: {
          stripQuantity: medicine.stripInfo?.stock || 0,
          individualQuantity: medicine.individualInfo?.stock || 0
        },
        stock: {
          strips: medicine.stripInfo?.stock || 0,
          individual: medicine.individualInfo?.stock || 0
        },
        storageConditions: medicine.storageConditions
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get unassigned medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching unassigned medicines'
    });
  }
};

// @desc    Get rack occupancy summary
// @route   GET /api/store-manager/rack-occupancy
// @access  Private (Store Manager only)
const getRackOccupancySummary = async (req, res) => {
  try {
    const store = req.store;

    // Get all racks for the store
    const racks = await Rack.find({
      store: store._id,
      isActive: true
    }).sort({ rackNumber: 1 });

    // Get occupancy data for each rack
    const occupancyData = await Promise.all(
      racks.map(async (rack) => {
        const locations = await RackLocation.find({
          rack: rack._id,
          store: store._id,
          isActive: true
        }).populate('medicine', 'name category');

        const occupiedPositions = locations.length;
        const totalPositions = rack.totalPositions;
        const occupancyPercentage = totalPositions > 0 ? Math.round((occupiedPositions / totalPositions) * 100) : 0;

        return {
          rack: {
            id: rack._id,
            rackNumber: rack.rackNumber,
            name: rack.name,
            category: rack.category
          },
          occupancy: {
            totalPositions,
            occupiedPositions,
            availablePositions: totalPositions - occupiedPositions,
            occupancyPercentage
          },
          medicines: locations.map(loc => ({
            id: loc.medicine._id,
            name: loc.medicine.name,
            category: loc.medicine.category,
            location: `${loc.shelf}-${loc.position}`,
            quantity: {
              strips: loc.stripQuantity,
              individual: loc.individualQuantity
            }
          }))
        };
      })
    );

    // Calculate overall statistics
    const totalPositions = occupancyData.reduce((sum, rack) => sum + rack.occupancy.totalPositions, 0);
    const totalOccupied = occupancyData.reduce((sum, rack) => sum + rack.occupancy.occupiedPositions, 0);
    const overallOccupancy = totalPositions > 0 ? Math.round((totalOccupied / totalPositions) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRacks: racks.length,
          totalPositions,
          occupiedPositions: totalOccupied,
          availablePositions: totalPositions - totalOccupied,
          overallOccupancy
        },
        racks: occupancyData
      }
    });
  } catch (error) {
    console.error('Get rack occupancy summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching rack occupancy summary'
    });
  }
};

module.exports = {
  searchMedicineLocations,
  getMedicineLocations,
  getUnassignedMedicines,
  getRackOccupancySummary
};

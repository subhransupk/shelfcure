const Medicine = require('../models/Medicine');
const Supplier = require('../models/Supplier');
const { validationResult } = require('express-validator');

// @desc    Get comprehensive expiry alerts for a store
// @route   GET /api/store-manager/expiry-alerts
// @access  Private (Store Manager only)
const getExpiryAlerts = async (req, res) => {
  try {
    const store = req.store;
    const {
      urgency = 'all', // 'expired', 'critical', 'warning', 'upcoming', 'all'
      days = 90, // default to 90 days for upcoming expiries
      category,
      search,
      page = 1,
      limit = 50,
      sortBy = 'expiryDate',
      sortOrder = 'asc'
    } = req.query;

    const currentDate = new Date();
    const criticalDate = new Date(currentDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
    const warningDate = new Date(currentDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
    const upcomingDate = new Date(currentDate.getTime() + (parseInt(days) * 24 * 60 * 60 * 1000));

    // Build base query
    let query = {
      store: store._id,
      isActive: true,
      expiryDate: { $exists: true, $ne: null }
    };

    // Apply urgency filter - properly handle the expiryDate field
    switch (urgency) {
      case 'expired':
        query.expiryDate = { $exists: true, $ne: null, $lt: currentDate };
        break;
      case 'critical':
        query.expiryDate = { $exists: true, $ne: null, $gte: currentDate, $lte: criticalDate };
        break;
      case 'warning':
        query.expiryDate = { $exists: true, $ne: null, $gt: criticalDate, $lte: warningDate };
        break;
      case 'upcoming':
        query.expiryDate = { $exists: true, $ne: null, $gt: warningDate, $lte: upcomingDate };
        break;
      case 'all':
        query.expiryDate = { $exists: true, $ne: null, $lte: upcomingDate };
        break;
    }

    // Apply category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Apply search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { batchNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const medicines = await Medicine.find(query)
      .select('name genericName manufacturer category batchNumber expiryDate unitTypes stripInfo individualInfo supplier rackLocations')
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Medicine.countDocuments(query);

    // Process medicines to add urgency and days to expiry
    const processedMedicines = medicines.map(medicine => {
      const daysToExpiry = Math.ceil((medicine.expiryDate - currentDate) / (1000 * 60 * 60 * 24));

      let urgencyLevel = 'upcoming';
      let urgencyColor = 'blue';

      if (daysToExpiry < 0) {
        urgencyLevel = 'expired';
        urgencyColor = 'red';
      } else if (daysToExpiry <= 7) {
        urgencyLevel = 'critical';
        urgencyColor = 'red';
      } else if (daysToExpiry <= 30) {
        urgencyLevel = 'warning';
        urgencyColor = 'orange';
      }

      // Calculate total stock value at risk
      let stockValue = 0;
      if (medicine.unitTypes?.hasStrips && medicine.stripInfo) {
        stockValue += (medicine.stripInfo.stock || 0) * (medicine.stripInfo.sellingPrice || 0);
      }
      if (medicine.unitTypes?.hasIndividual && medicine.individualInfo) {
        stockValue += (medicine.individualInfo.stock || 0) * (medicine.individualInfo.sellingPrice || 0);
      }

      // Calculate total stock manually since virtual might not be available
      const totalStock = {
        strips: medicine.unitTypes?.hasStrips ? (medicine.stripInfo?.stock || 0) : 0,
        individual: medicine.unitTypes?.hasIndividual ? (medicine.individualInfo?.stock || 0) : 0
      };

      return {
        _id: medicine._id,
        name: medicine.name,
        genericName: medicine.genericName,
        manufacturer: medicine.manufacturer,
        category: medicine.category,
        batchNumber: medicine.batchNumber,
        expiryDate: medicine.expiryDate,
        daysToExpiry,
        urgencyLevel,
        urgencyColor,
        stockValue,
        supplier: medicine.supplier, // This will be the ObjectId, not populated
        unitTypes: medicine.unitTypes,
        stripInfo: medicine.stripInfo,
        individualInfo: medicine.individualInfo,
        totalStock
      };
    });

    res.json({
      success: true,
      data: processedMedicines,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get expiry alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expiry alerts'
    });
  }
};

// @desc    Get expiry alerts summary/statistics
// @route   GET /api/store-manager/expiry-alerts/summary
// @access  Private (Store Manager only)
const getExpiryAlertsSummary = async (req, res) => {
  try {
    const store = req.store;
    const currentDate = new Date();
    const criticalDate = new Date(currentDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
    const warningDate = new Date(currentDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
    const upcomingDate = new Date(currentDate.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days

    // Get counts for different urgency levels
    const [
      expiredCount,
      criticalCount,
      warningCount,
      upcomingCount,
      totalWithExpiry
    ] = await Promise.all([
      Medicine.countDocuments({
        store: store._id,
        isActive: true,
        expiryDate: { $lt: currentDate }
      }),
      Medicine.countDocuments({
        store: store._id,
        isActive: true,
        expiryDate: { $gte: currentDate, $lte: criticalDate }
      }),
      Medicine.countDocuments({
        store: store._id,
        isActive: true,
        expiryDate: { $gt: criticalDate, $lte: warningDate }
      }),
      Medicine.countDocuments({
        store: store._id,
        isActive: true,
        expiryDate: { $gt: warningDate, $lte: upcomingDate }
      }),
      Medicine.countDocuments({
        store: store._id,
        isActive: true,
        expiryDate: { $exists: true, $ne: null }
      })
    ]);

    // Calculate total value at risk for each category
    const expiredMedicines = await Medicine.find({
      store: store._id,
      isActive: true,
      expiryDate: { $lt: currentDate }
    }).select('unitTypes stripInfo individualInfo');

    const criticalMedicines = await Medicine.find({
      store: store._id,
      isActive: true,
      expiryDate: { $gte: currentDate, $lte: criticalDate }
    }).select('unitTypes stripInfo individualInfo');

    const warningMedicines = await Medicine.find({
      store: store._id,
      isActive: true,
      expiryDate: { $gt: criticalDate, $lte: warningDate }
    }).select('unitTypes stripInfo individualInfo');

    // Calculate values
    const calculateValue = (medicines) => {
      return medicines.reduce((total, medicine) => {
        let value = 0;
        if (medicine.unitTypes?.hasStrips && medicine.stripInfo) {
          value += (medicine.stripInfo.stock || 0) * (medicine.stripInfo.sellingPrice || 0);
        }
        if (medicine.unitTypes?.hasIndividual && medicine.individualInfo) {
          value += (medicine.individualInfo.stock || 0) * (medicine.individualInfo.sellingPrice || 0);
        }
        return total + value;
      }, 0);
    };

    const expiredValue = calculateValue(expiredMedicines);
    const criticalValue = calculateValue(criticalMedicines);
    const warningValue = calculateValue(warningMedicines);

    res.json({
      success: true,
      data: {
        summary: {
          expired: { count: expiredCount, value: expiredValue },
          critical: { count: criticalCount, value: criticalValue },
          warning: { count: warningCount, value: warningValue },
          upcoming: { count: upcomingCount, value: 0 },
          total: { count: totalWithExpiry, value: expiredValue + criticalValue + warningValue }
        },
        urgencyLevels: {
          expired: { label: 'Expired', color: 'red', days: 'Past due' },
          critical: { label: 'Critical (≤7 days)', color: 'red', days: '≤7' },
          warning: { label: 'Warning (8-30 days)', color: 'orange', days: '8-30' },
          upcoming: { label: 'Upcoming (31-90 days)', color: 'blue', days: '31-90' }
        }
      }
    });
  } catch (error) {
    console.error('Get expiry alerts summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expiry alerts summary'
    });
  }
};

// @desc    Mark medicines as disposed
// @route   POST /api/store-manager/expiry-alerts/mark-disposed
// @access  Private (Store Manager only)
const markMedicinesAsDisposed = async (req, res) => {
  try {
    const store = req.store;
    const { medicineIds, reason = 'Expired', notes } = req.body;

    if (!medicineIds || !Array.isArray(medicineIds) || medicineIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide medicine IDs to mark as disposed'
      });
    }

    // Update medicines to mark as disposed
    const updateResult = await Medicine.updateMany(
      {
        _id: { $in: medicineIds },
        store: store._id
      },
      {
        $set: {
          isActive: false,
          disposalReason: reason,
          disposalNotes: notes,
          disposalDate: new Date(),
          disposedBy: req.user.id
        }
      }
    );

    // Log the disposal activity
    // TODO: Add to activity log if needed

    res.json({
      success: true,
      message: `${updateResult.modifiedCount} medicines marked as disposed`,
      data: {
        modifiedCount: updateResult.modifiedCount,
        reason,
        notes
      }
    });
  } catch (error) {
    console.error('Mark medicines as disposed error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking medicines as disposed'
    });
  }
};

// @desc    Update expiry date for a medicine
// @route   PUT /api/store-manager/expiry-alerts/:id/extend-expiry
// @access  Private (Store Manager only)
const extendExpiryDate = async (req, res) => {
  try {
    const store = req.store;
    const { id } = req.params;
    const { newExpiryDate, reason, notes } = req.body;

    if (!newExpiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide new expiry date'
      });
    }

    const medicine = await Medicine.findOne({
      _id: id,
      store: store._id
    });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    const oldExpiryDate = medicine.expiryDate;
    medicine.expiryDate = new Date(newExpiryDate);
    medicine.expiryExtensionReason = reason;
    medicine.expiryExtensionNotes = notes;
    medicine.expiryExtendedBy = req.user.id;
    medicine.expiryExtensionDate = new Date();
    medicine.originalExpiryDate = oldExpiryDate;

    await medicine.save();

    res.json({
      success: true,
      message: 'Expiry date updated successfully',
      data: {
        medicineId: medicine._id,
        medicineName: medicine.name,
        oldExpiryDate,
        newExpiryDate: medicine.expiryDate,
        reason,
        notes
      }
    });
  } catch (error) {
    console.error('Extend expiry date error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating expiry date'
    });
  }
};

module.exports = {
  getExpiryAlerts,
  getExpiryAlertsSummary,
  markMedicinesAsDisposed,
  extendExpiryDate
};

const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');
const Supplier = require('../models/Supplier');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

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

    // Execute query with pagination for medicines
    const medicines = await Medicine.find(query)
      .select('name genericName manufacturer category batchNumber expiryDate unitTypes stripInfo individualInfo supplier rackLocations')
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Also get batches that match the expiry criteria
    const batchQuery = {
      store: store._id,
      isActive: true,
      expiryDate: query.expiryDate,
      $or: [
        { stripQuantity: { $gt: 0 } },
        { individualQuantity: { $gt: 0 } }
      ]
    };

    // Apply search filter to batches if provided
    if (search) {
      const medicineIds = await Medicine.find({
        store: store._id,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { genericName: { $regex: search, $options: 'i' } },
          { manufacturer: { $regex: search, $options: 'i' } }
        ]
      }).distinct('_id');

      batchQuery.$or = [
        { medicine: { $in: medicineIds } },
        { batchNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const batches = await Batch.find(batchQuery)
      .populate('medicine', 'name genericName manufacturer category unitTypes stripInfo individualInfo')
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const medicineTotal = await Medicine.countDocuments(query);
    const batchTotal = await Batch.countDocuments(batchQuery);
    const total = medicineTotal + batchTotal;

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
        totalStock,
        type: 'medicine'
      };
    });

    // Process batches to add urgency and days to expiry
    const processedBatches = batches.map(batch => {
      const daysToExpiry = Math.ceil((batch.expiryDate - currentDate) / (1000 * 60 * 60 * 24));

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

      // Calculate total stock value at risk for this batch
      let stockValue = 0;
      if (batch.medicine?.unitTypes?.hasStrips && batch.medicine?.stripInfo) {
        stockValue += (batch.stripQuantity || 0) * (batch.medicine.stripInfo.sellingPrice || 0);
      }
      if (batch.medicine?.unitTypes?.hasIndividual && batch.medicine?.individualInfo) {
        stockValue += (batch.individualQuantity || 0) * (batch.medicine.individualInfo.sellingPrice || 0);
      }

      const totalStock = {
        strips: batch.stripQuantity || 0,
        individual: batch.individualQuantity || 0
      };

      return {
        _id: batch._id,
        name: batch.medicine?.name || 'Unknown Medicine',
        genericName: batch.medicine?.genericName || '',
        manufacturer: batch.medicine?.manufacturer || '',
        category: batch.medicine?.category || '',
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        daysToExpiry,
        urgencyLevel,
        urgencyColor,
        stockValue,
        unitTypes: batch.medicine?.unitTypes,
        stripInfo: { stock: batch.stripQuantity, sellingPrice: batch.medicine?.stripInfo?.sellingPrice },
        individualInfo: { stock: batch.individualQuantity, sellingPrice: batch.medicine?.individualInfo?.sellingPrice },
        totalStock,
        type: 'batch'
      };
    });

    // Combine and sort all items
    const allItems = [...processedMedicines, ...processedBatches].sort((a, b) => {
      if (sortBy === 'expiryDate') {
        return sortOrder === 'asc' ?
          new Date(a.expiryDate) - new Date(b.expiryDate) :
          new Date(b.expiryDate) - new Date(a.expiryDate);
      }
      return 0;
    });

    // Add cache-busting headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      data: allItems.slice((page - 1) * limit, page * limit), // Apply pagination to combined results
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
      upcomingCount
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
      })
    ]);

    // Calculate total value at risk for each category
    const expiredMedicines = await Medicine.find({
      store: store._id,
      isActive: true,
      expiryDate: { $lt: currentDate }
    }).select('name unitTypes stripInfo individualInfo expiryDate');

    const criticalMedicines = await Medicine.find({
      store: store._id,
      isActive: true,
      expiryDate: { $gte: currentDate, $lte: criticalDate }
    }).select('name unitTypes stripInfo individualInfo expiryDate');

    const warningMedicines = await Medicine.find({
      store: store._id,
      isActive: true,
      expiryDate: { $gt: criticalDate, $lte: warningDate }
    }).select('name unitTypes stripInfo individualInfo expiryDate');



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

    // Calculate the actual total count of medicines in alert categories
    const totalAlertCount = expiredCount + criticalCount + warningCount + upcomingCount;



    // Add cache-busting headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    const responseData = {
      success: true,
      data: {
        summary: {
          expired: { count: expiredCount, value: expiredValue },
          critical: { count: criticalCount, value: criticalValue },
          warning: { count: warningCount, value: warningValue },
          upcoming: { count: upcomingCount, value: 0 },
          total: { count: totalAlertCount, value: expiredValue + criticalValue + warningValue }
        },
        urgencyLevels: {
          expired: { label: 'Expired', color: 'red', days: 'Past due' },
          critical: { label: 'Critical (≤7 days)', color: 'red', days: '≤7' },
          warning: { label: 'Warning (8-30 days)', color: 'orange', days: '8-30' },
          upcoming: { label: 'Upcoming (31-90 days)', color: 'blue', days: '31-90' }
        }
      }
    };


    res.json(responseData);
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
    // Check for validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }

    const store = req.store;
    const { id } = req.params;
    const { newExpiryDate, reason, notes } = req.body;

    // Validate date format and create date object
    let parsedExpiryDate;
    try {
      parsedExpiryDate = new Date(newExpiryDate);

      // Check if the date is valid
      if (isNaN(parsedExpiryDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please use YYYY-MM-DD format',
          field: 'newExpiryDate',
          providedValue: newExpiryDate
        });
      }

      // Check if date is in the past (allow same day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      parsedExpiryDate.setHours(0, 0, 0, 0);

      if (parsedExpiryDate < today) {
        return res.status(400).json({
          success: false,
          message: 'Expiry date cannot be in the past',
          field: 'newExpiryDate',
          providedValue: newExpiryDate
        });
      }

      // Check if date is too far in the future (10 years)
      const maxFutureDate = new Date();
      maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 10);

      if (parsedExpiryDate > maxFutureDate) {
        return res.status(400).json({
          success: false,
          message: 'Expiry date cannot be more than 10 years in the future',
          field: 'newExpiryDate',
          providedValue: newExpiryDate
        });
      }

    } catch (dateError) {
      console.error('Date parsing error:', dateError);
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please use YYYY-MM-DD format',
        field: 'newExpiryDate',
        providedValue: newExpiryDate
      });
    }

    // Find the medicine
    const medicine = await Medicine.findOne({
      _id: id,
      store: store._id,
      isActive: true
    });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found or has been deactivated'
      });
    }

    // Store original expiry date for comparison and logging
    const oldExpiryDate = medicine.expiryDate;

    // Check if the new date is actually different
    if (oldExpiryDate && parsedExpiryDate.getTime() === new Date(oldExpiryDate).getTime()) {
      return res.status(400).json({
        success: false,
        message: 'New expiry date is the same as current expiry date',
        currentExpiryDate: oldExpiryDate
      });
    }

    // Use transaction to ensure data consistency
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // Update medicine with new expiry date
        medicine.expiryDate = parsedExpiryDate;
        medicine.expiryExtensionReason = reason || 'Manual extension';
        medicine.expiryExtensionNotes = notes || '';
        medicine.expiryExtendedBy = req.user.id;
        medicine.expiryExtensionDate = new Date();

        // Store original expiry date if not already stored
        if (!medicine.originalExpiryDate) {
          medicine.originalExpiryDate = oldExpiryDate;
        }

        // Save with validation within transaction
        await medicine.save({ session });
      });
    } finally {
      await session.endSession();
    }

    // Log the successful update
    console.log(`✅ Expiry date updated for medicine ${medicine.name} (ID: ${medicine._id})`);
    console.log(`   Old date: ${oldExpiryDate}`);
    console.log(`   New date: ${parsedExpiryDate}`);
    console.log(`   Updated by: ${req.user.name || req.user.email} (ID: ${req.user.id})`);

    res.json({
      success: true,
      message: 'Expiry date updated successfully',
      data: {
        medicineId: medicine._id,
        medicineName: medicine.name,
        oldExpiryDate,
        newExpiryDate: medicine.expiryDate,
        reason: medicine.expiryExtensionReason,
        notes: medicine.expiryExtensionNotes,
        updatedBy: req.user.name || req.user.email,
        updatedAt: medicine.expiryExtensionDate
      }
    });
  } catch (error) {
    console.error('❌ Extend expiry date error:', error);

    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid medicine ID format'
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      message: 'Server error while updating expiry date. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getExpiryAlerts,
  getExpiryAlertsSummary,
  markMedicinesAsDisposed,
  extendExpiryDate
};

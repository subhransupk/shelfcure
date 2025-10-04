const mongoose = require('mongoose');

// Define InventoryLog schema inline since it might not exist as a separate model
const inventoryLogSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  changeType: {
    type: String,
    enum: ['sale', 'purchase', 'purchase_return', 'adjustment', 'transfer', 'expired', 'damaged'],
    required: true
  },
  unitType: {
    type: String,
    enum: ['strip', 'individual'],
    required: true
  },
  quantityChanged: {
    type: Number,
    required: true
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  reference: {
    type: {
      type: String,
      enum: ['Sale', 'Purchase', 'PurchaseReturn', 'Adjustment', 'Transfer']
    },
    id: mongoose.Schema.Types.ObjectId,
    invoiceNumber: String,
    purchaseOrderNumber: String,
    returnNumber: String
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: String,
  batchInfo: [{
    batchNumber: String,
    expiryDate: Date,
    manufacturingDate: Date,
    quantityUsed: Number
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for better performance
inventoryLogSchema.index({ medicine: 1, store: 1, timestamp: -1 });
inventoryLogSchema.index({ store: 1, changeType: 1, timestamp: -1 });
inventoryLogSchema.index({ performedBy: 1, timestamp: -1 });

// Try to get existing model or create new one
let InventoryLog;
try {
  InventoryLog = mongoose.model('InventoryLog');
} catch (error) {
  InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema);
}

/**
 * Log inventory changes for audit trail
 * @param {Object} changeData - Inventory change data
 * @returns {Promise<Object>} Created log entry
 */
const logInventoryChange = async (changeData) => {
  try {
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
      batchInfo: changeData.batchInfo || null,
      timestamp: new Date()
    };

    // Save the log entry
    const savedLog = await InventoryLog.create(logEntry);
    console.log('📋 Inventory change logged successfully:', {
      medicine: changeData.medicine,
      changeType: changeData.changeType,
      quantity: changeData.quantityChanged,
      unitType: changeData.unitType
    });

    return savedLog;
  } catch (error) {
    console.error('❌ Inventory logging error:', error);
    
    // Fallback: log to console for debugging
    console.log('📋 Inventory Change Log (Fallback):', JSON.stringify({
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
      batchInfo: changeData.batchInfo,
      timestamp: new Date()
    }, null, 2));

    // Don't throw error - logging failure shouldn't break the main process
    return null;
  }
};

/**
 * Get inventory change history for a medicine
 * @param {string} medicineId - Medicine ID
 * @param {string} storeId - Store ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Inventory change history
 */
const getInventoryHistory = async (medicineId, storeId, options = {}) => {
  try {
    const {
      page = 1,
      limit = 50,
      changeType,
      startDate,
      endDate,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = options;

    const query = {
      medicine: medicineId,
      store: storeId
    };

    // Add filters
    if (changeType) {
      query.changeType = changeType;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      InventoryLog.find(query)
        .populate('medicine', 'name genericName manufacturer')
        .populate('performedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      InventoryLog.countDocuments(query)
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting inventory history:', error);
    throw error;
  }
};

/**
 * Get inventory summary for a store
 * @param {string} storeId - Store ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Inventory summary
 */
const getInventorySummary = async (storeId, options = {}) => {
  try {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      endDate = new Date()
    } = options;

    const matchStage = {
      store: new mongoose.Types.ObjectId(storeId),
      timestamp: {
        $gte: startDate,
        $lte: endDate
      }
    };

    const summary = await InventoryLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$changeType',
          count: { $sum: 1 },
          totalQuantityChanged: { $sum: '$quantityChanged' },
          stripChanges: {
            $sum: {
              $cond: [{ $eq: ['$unitType', 'strip'] }, '$quantityChanged', 0]
            }
          },
          individualChanges: {
            $sum: {
              $cond: [{ $eq: ['$unitType', 'individual'] }, '$quantityChanged', 0]
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return {
      period: {
        startDate,
        endDate
      },
      summary
    };
  } catch (error) {
    console.error('Error getting inventory summary:', error);
    throw error;
  }
};

/**
 * Clean up old inventory logs
 * @param {number} daysToKeep - Number of days to keep logs
 * @returns {Promise<Object>} Cleanup result
 */
const cleanupOldLogs = async (daysToKeep = 365) => {
  try {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    const result = await InventoryLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    console.log(`🧹 Cleaned up ${result.deletedCount} old inventory logs older than ${daysToKeep} days`);
    
    return {
      deletedCount: result.deletedCount,
      cutoffDate
    };
  } catch (error) {
    console.error('Error cleaning up old logs:', error);
    throw error;
  }
};

module.exports = {
  logInventoryChange,
  getInventoryHistory,
  getInventorySummary,
  cleanupOldLogs,
  InventoryLog
};

const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');
const mongoose = require('mongoose');

class BatchService {
  /**
   * Select batches for sale using FIFO/FEFO strategy
   * @param {string} medicineId - Medicine ID
   * @param {number} quantity - Required quantity
   * @param {string} unitType - 'strip' or 'individual'
   * @param {string} strategy - 'FIFO' or 'FEFO'
   * @param {string} storeId - Store ID
   * @returns {Object} Selected batches and fulfillment info
   */
  static async selectBatchesForSale(medicineId, quantity, unitType = 'strip', strategy = 'FEFO', storeId) {
    try {
      // Build query for available batches
      const query = {
        medicine: medicineId,
        store: storeId,
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
        sortOrder = { expiryDate: 1, createdAt: 1 }; // First Expiry First Out, then creation order
      } else if (strategy === 'FIFO') {
        sortOrder = { manufacturingDate: 1, createdAt: 1 }; // First In First Out, then creation order
      } else {
        sortOrder = { createdAt: 1 }; // Default to creation order
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

      return {
        selectedBatches,
        totalRequested: quantity,
        totalSelected,
        shortfall,
        canFulfill: shortfall === 0,
        strategy,
        unitType
      };
    } catch (error) {
      console.error('Error selecting batches for sale:', error);
      throw error;
    }
  }

  /**
   * Deduct quantities from selected batches
   * @param {Array} selectedBatches - Array of selected batches with quantities
   * @param {string} unitType - 'strip' or 'individual'
   * @param {string} userId - User performing the operation
   * @returns {Array} Updated batch information
   */
  static async deductFromBatches(selectedBatches, unitType, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const updatedBatches = [];

      for (const batchInfo of selectedBatches) {
        const batch = await Batch.findById(batchInfo.batchId).session(session);
        
        if (!batch) {
          throw new Error(`Batch not found: ${batchInfo.batchId}`);
        }

        // Check if we have enough stock
        const currentStock = unitType === 'strip' ? batch.stripQuantity : batch.individualQuantity;
        if (currentStock < batchInfo.quantitySelected) {
          throw new Error(`Insufficient stock in batch ${batch.batchNumber}. Available: ${currentStock}, Required: ${batchInfo.quantitySelected}`);
        }

        // Deduct quantity
        if (unitType === 'strip') {
          batch.stripQuantity -= batchInfo.quantitySelected;
        } else {
          batch.individualQuantity -= batchInfo.quantitySelected;
        }

        batch.updatedBy = userId;
        await batch.save({ session });

        updatedBatches.push({
          batchId: batch._id,
          batchNumber: batch.batchNumber,
          quantityDeducted: batchInfo.quantitySelected,
          remainingStock: unitType === 'strip' ? batch.stripQuantity : batch.individualQuantity
        });
      }

      await session.commitTransaction();
      return updatedBatches;
    } catch (error) {
      await session.abortTransaction();
      console.error('Error deducting from batches:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Add quantities to batches (for returns or new stock)
   * @param {Array} batchUpdates - Array of batch updates
   * @param {string} unitType - 'strip' or 'individual'
   * @param {string} userId - User performing the operation
   * @returns {Array} Updated batch information
   */
  static async addToBatches(batchUpdates, unitType, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const updatedBatches = [];

      for (const batchInfo of batchUpdates) {
        const batch = await Batch.findById(batchInfo.batchId).session(session);
        
        if (!batch) {
          throw new Error(`Batch not found: ${batchInfo.batchId}`);
        }

        // Add quantity
        if (unitType === 'strip') {
          batch.stripQuantity += batchInfo.quantityToAdd;
        } else {
          batch.individualQuantity += batchInfo.quantityToAdd;
        }

        batch.updatedBy = userId;
        await batch.save({ session });

        updatedBatches.push({
          batchId: batch._id,
          batchNumber: batch.batchNumber,
          quantityAdded: batchInfo.quantityToAdd,
          newStock: unitType === 'strip' ? batch.stripQuantity : batch.individualQuantity
        });
      }

      await session.commitTransaction();
      return updatedBatches;
    } catch (error) {
      await session.abortTransaction();
      console.error('Error adding to batches:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Synchronize medicine stock with batch totals
   * @param {string} medicineId - Medicine ID
   * @param {string} storeId - Store ID
   * @returns {Object} Synchronization result
   */
  static async synchronizeMedicineStock(medicineId, storeId) {
    try {
      // Get all active batches for the medicine
      const batches = await Batch.find({
        medicine: medicineId,
        store: storeId,
        isActive: true
      });

      // Calculate total stock from batches
      const totalStripStock = batches.reduce((sum, batch) => sum + (batch.stripQuantity || 0), 0);
      const totalIndividualStock = batches.reduce((sum, batch) => sum + (batch.individualQuantity || 0), 0);

      // Update medicine stock
      const medicine = await Medicine.findById(medicineId);
      if (!medicine) {
        throw new Error('Medicine not found');
      }

      const oldStripStock = medicine.stripInfo?.stock || 0;
      const oldIndividualStock = medicine.individualInfo?.stock || 0;

      // Update medicine stock
      if (medicine.stripInfo) {
        medicine.stripInfo.stock = totalStripStock;
      }
      if (medicine.individualInfo) {
        medicine.individualInfo.stock = totalIndividualStock;
      }
      if (medicine.inventory) {
        medicine.inventory.stripQuantity = totalStripStock;
        medicine.inventory.individualQuantity = totalIndividualStock;
      }

      await medicine.save();

      return {
        medicineId,
        synchronization: {
          strips: {
            oldStock: oldStripStock,
            newStock: totalStripStock,
            difference: totalStripStock - oldStripStock
          },
          individual: {
            oldStock: oldIndividualStock,
            newStock: totalIndividualStock,
            difference: totalIndividualStock - oldIndividualStock
          }
        },
        batchCount: batches.length
      };
    } catch (error) {
      console.error('Error synchronizing medicine stock:', error);
      throw error;
    }
  }

  /**
   * Get expiring batches for a store
   * @param {string} storeId - Store ID
   * @param {number} daysAhead - Days ahead to check for expiry
   * @returns {Array} Expiring batches
   */
  static async getExpiringBatches(storeId, daysAhead = 30) {
    try {
      return await Batch.findExpiringBatches(storeId, daysAhead);
    } catch (error) {
      console.error('Error getting expiring batches:', error);
      throw error;
    }
  }

  /**
   * Get expired batches for a store
   * @param {string} storeId - Store ID
   * @returns {Array} Expired batches
   */
  static async getExpiredBatches(storeId) {
    try {
      return await Batch.findExpiredBatches(storeId);
    } catch (error) {
      console.error('Error getting expired batches:', error);
      throw error;
    }
  }

  /**
   * Update expired status for all batches
   * @param {string} storeId - Store ID (optional, if not provided updates all stores)
   * @returns {Object} Update result
   */
  static async updateExpiredStatus(storeId = null) {
    try {
      const query = {
        expiryDate: { $lt: new Date() },
        isExpired: false
      };

      if (storeId) {
        query.store = storeId;
      }

      const result = await Batch.updateMany(query, {
        $set: { isExpired: true }
      });

      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        storeId: storeId || 'all'
      };
    } catch (error) {
      console.error('Error updating expired status:', error);
      throw error;
    }
  }
}

module.exports = BatchService;

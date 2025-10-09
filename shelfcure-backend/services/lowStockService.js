const Medicine = require('../models/Medicine');

/**
 * Unified Low Stock Calculation Service
 * 
 * This service provides standardized methods for calculating low stock medicines
 * across all endpoints to ensure consistency in the ShelfCure dual unit system.
 * 
 * Business Rules:
 * 1. When both strips and individual units are enabled: Low stock based on STRIP STOCK ONLY
 *    (Individual stock represents cut medicines from strips, not primary inventory)
 * 2. When only strips enabled: Use strip stock vs strip minStock
 * 3. When only individual enabled: Use individual stock vs individual minStock
 * 4. Legacy support: Fall back to old inventory fields for backward compatibility
 * 5. Only consider active medicines (isActive: true)
 */

class LowStockService {
  
  /**
   * Get the standardized low stock aggregation pipeline
   * @param {Object} additionalMatch - Additional match conditions
   * @returns {Array} MongoDB aggregation pipeline
   */
  static getLowStockAggregationPipeline(additionalMatch = {}) {
    return [
      { 
        $match: { 
          isActive: true,
          ...additionalMatch 
        } 
      },
      {
        $match: {
          $or: [
            // Both strip and individual enabled: Low stock based on STRIP STOCK ONLY
            {
              $and: [
                { 'unitTypes.hasStrips': true },
                { 'unitTypes.hasIndividual': true },
                { $expr: { $lte: ['$stripInfo.stock', '$stripInfo.minStock'] } }
              ]
            },
            // Only strips enabled
            {
              $and: [
                { 'unitTypes.hasStrips': true },
                { 'unitTypes.hasIndividual': { $ne: true } },
                { $expr: { $lte: ['$stripInfo.stock', '$stripInfo.minStock'] } }
              ]
            },
            // Only individual enabled
            {
              $and: [
                { 'unitTypes.hasIndividual': true },
                { 'unitTypes.hasStrips': { $ne: true } },
                { $expr: { $lte: ['$individualInfo.stock', '$individualInfo.minStock'] } }
              ]
            },
            // Legacy support - assume strips only (for backward compatibility)
            {
              $and: [
                { 'unitTypes': { $exists: false } },
                { $expr: { $lte: ['$stock', '$minStock'] } }
              ]
            }
          ]
        }
      }
    ];
  }

  /**
   * Get the standardized low stock query object for countDocuments/find
   * @param {Object} additionalMatch - Additional match conditions
   * @returns {Object} MongoDB query object
   */
  static getLowStockQuery(additionalMatch = {}) {
    return {
      isActive: true,
      ...additionalMatch,
      $or: [
        // Both strip and individual enabled: Low stock based on STRIP STOCK ONLY
        {
          $and: [
            { 'unitTypes.hasStrips': true },
            { 'unitTypes.hasIndividual': true },
            { $expr: { $lte: ['$stripInfo.stock', '$stripInfo.minStock'] } }
          ]
        },
        // Only strips enabled
        {
          $and: [
            { 'unitTypes.hasStrips': true },
            { 'unitTypes.hasIndividual': { $ne: true } },
            { $expr: { $lte: ['$stripInfo.stock', '$stripInfo.minStock'] } }
          ]
        },
        // Only individual enabled
        {
          $and: [
            { 'unitTypes.hasIndividual': true },
            { 'unitTypes.hasStrips': { $ne: true } },
            { $expr: { $lte: ['$individualInfo.stock', '$individualInfo.minStock'] } }
          ]
        },
        // Legacy support - assume strips only (for backward compatibility)
        {
          $and: [
            { 'unitTypes': { $exists: false } },
            { $expr: { $lte: ['$stock', '$minStock'] } }
          ]
        }
      ]
    };
  }

  /**
   * Count low stock medicines for a specific store
   * @param {ObjectId} storeId - Store ID
   * @returns {Promise<number>} Count of low stock medicines
   */
  static async countLowStockMedicines(storeId) {
    const pipeline = this.getLowStockAggregationPipeline({ store: storeId });
    pipeline.push({ $count: 'lowStockCount' });
    
    const result = await Medicine.aggregate(pipeline);
    return result.length > 0 ? result[0].lowStockCount : 0;
  }

  /**
   * Find low stock medicines for a specific store
   * @param {ObjectId} storeId - Store ID
   * @param {Object} options - Query options (limit, skip, select, etc.)
   * @returns {Promise<Array>} Array of low stock medicines
   */
  static async findLowStockMedicines(storeId, options = {}) {
    const query = this.getLowStockQuery({ store: storeId });
    
    let mongoQuery = Medicine.find(query);
    
    if (options.select) {
      mongoQuery = mongoQuery.select(options.select);
    }
    
    if (options.limit) {
      mongoQuery = mongoQuery.limit(options.limit);
    }
    
    if (options.skip) {
      mongoQuery = mongoQuery.skip(options.skip);
    }
    
    if (options.sort) {
      mongoQuery = mongoQuery.sort(options.sort);
    }
    
    return await mongoQuery.exec();
  }

  /**
   * Get low stock medicines using aggregation (for complex queries)
   * @param {ObjectId} storeId - Store ID
   * @param {Object} options - Aggregation options
   * @returns {Promise<Array>} Array of low stock medicines
   */
  static async aggregateLowStockMedicines(storeId, options = {}) {
    const pipeline = this.getLowStockAggregationPipeline({ store: storeId });
    
    if (options.additionalPipeline) {
      pipeline.push(...options.additionalPipeline);
    }
    
    return await Medicine.aggregate(pipeline);
  }

  /**
   * Check if a single medicine is low stock (for virtual field compatibility)
   * @param {Object} medicine - Medicine document
   * @returns {boolean} True if medicine is low stock
   */
  static isLowStock(medicine) {
    if (!medicine.isActive) return false;
    
    const hasStrips = medicine.unitTypes?.hasStrips;
    const hasIndividual = medicine.unitTypes?.hasIndividual;

    if (hasStrips && hasIndividual) {
      // Both enabled: Low stock based on STRIP STOCK ONLY
      return (medicine.stripInfo?.stock || 0) <= (medicine.stripInfo?.minStock || 0);
    } else if (hasStrips) {
      // Only strips enabled
      return (medicine.stripInfo?.stock || 0) <= (medicine.stripInfo?.minStock || 0);
    } else if (hasIndividual) {
      // Only individual enabled
      return (medicine.individualInfo?.stock || 0) <= (medicine.individualInfo?.minStock || 0);
    } else {
      // Legacy support
      return (medicine.stock || 0) <= (medicine.minStock || 0);
    }
  }
}

module.exports = LowStockService;

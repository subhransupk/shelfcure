const Doctor = require('../models/Doctor');
const Sale = require('../models/Sale');
const Commission = require('../models/Commission');
const mongoose = require('mongoose');

/**
 * Doctor Statistics Service
 * Handles calculation and updating of doctor-related statistics
 */
class DoctorStatsService {
  
  /**
   * Update doctor statistics based on actual sales data
   * @param {String} doctorId - Doctor ID
   * @param {String} storeId - Store ID (optional, for validation)
   */
  static async updateDoctorStats(doctorId, storeId = null) {
    try {
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      // Validate store if provided
      if (storeId && doctor.store.toString() !== storeId.toString()) {
        throw new Error('Doctor does not belong to the specified store');
      }

      // Calculate statistics from actual sales
      const stats = await Sale.aggregate([
        {
          $match: {
            'prescription.doctor': new mongoose.Types.ObjectId(doctorId),
            status: { $in: ['completed'] } // Only count completed sales
          }
        },
        {
          $group: {
            _id: null,
            totalPrescriptions: { $sum: 1 },
            totalSalesValue: { $sum: '$totalAmount' },
            lastPrescriptionDate: { $max: '$saleDate' }
          }
        }
      ]);

      const result = stats[0] || {
        totalPrescriptions: 0,
        totalSalesValue: 0,
        lastPrescriptionDate: null
      };

      // Calculate total commission earned
      const totalCommissionEarned = this.calculateCommissionAmount(
        result.totalSalesValue,
        doctor.commissionRate || 0,
        doctor.commissionType || 'percentage'
      );

      // Update doctor statistics
      doctor.totalPrescriptions = result.totalPrescriptions;
      doctor.totalCommissionEarned = totalCommissionEarned;
      doctor.lastPrescriptionDate = result.lastPrescriptionDate;

      await doctor.save();

      return {
        totalPrescriptions: result.totalPrescriptions,
        totalCommissionEarned,
        totalSalesValue: result.totalSalesValue,
        lastPrescriptionDate: result.lastPrescriptionDate
      };

    } catch (error) {
      console.error('Error updating doctor stats:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive doctor statistics for a store
   * @param {String} storeId - Store ID
   * @param {Object} options - Query options (dateRange, status)
   */
  static async getStoreStats(storeId, options = {}) {
    try {
      const { dateRange = 'thisMonth', status } = options;

      // Calculate date range
      const { startDate, endDate } = this.getDateRange(dateRange);

      // Get basic doctor counts
      const doctorStats = await Doctor.aggregate([
        { $match: { store: new mongoose.Types.ObjectId(storeId) } },
        {
          $group: {
            _id: null,
            totalDoctors: { $sum: 1 },
            activeDoctors: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            averageCommissionRate: { $avg: '$commissionRate' },
            totalPrescriptionsFromDoctors: { $sum: '$totalPrescriptions' },
            totalCommissionEarnedFromDoctors: { $sum: '$totalCommissionEarned' }
          }
        }
      ]);

      const basicStats = doctorStats[0] || {
        totalDoctors: 0,
        activeDoctors: 0,
        averageCommissionRate: 0,
        totalPrescriptionsFromDoctors: 0,
        totalCommissionEarnedFromDoctors: 0
      };

      // Get sales-based statistics for the specified period
      const salesStats = await Sale.aggregate([
        {
          $match: {
            store: new mongoose.Types.ObjectId(storeId),
            'prescription.doctor': { $exists: true, $ne: null },
            saleDate: { $gte: startDate, $lte: endDate },
            status: { $in: ['completed'] }
          }
        },
        {
          $lookup: {
            from: 'doctors',
            localField: 'prescription.doctor',
            foreignField: '_id',
            as: 'doctorInfo'
          }
        },
        {
          $unwind: '$doctorInfo'
        },
        {
          $group: {
            _id: null,
            totalPrescriptions: { $sum: 1 },
            totalSalesValue: { $sum: '$totalAmount' },
            totalCommissions: {
              $sum: {
                $multiply: [
                  '$totalAmount',
                  { $divide: [{ $ifNull: ['$doctorInfo.commissionRate', 0] }, 100] }
                ]
              }
            }
          }
        }
      ]);

      const periodStats = salesStats[0] || {
        totalPrescriptions: 0,
        totalSalesValue: 0,
        totalCommissions: 0
      };

      // Get top referrer (doctor with most prescriptions in period)
      const topReferrer = await Sale.aggregate([
        {
          $match: {
            store: new mongoose.Types.ObjectId(storeId),
            'prescription.doctor': { $exists: true, $ne: null },
            saleDate: { $gte: startDate, $lte: endDate },
            status: { $in: ['completed'] }
          }
        },
        {
          $group: {
            _id: '$prescription.doctor',
            prescriptionCount: { $sum: 1 },
            totalSalesValue: { $sum: '$totalAmount' }
          }
        },
        {
          $lookup: {
            from: 'doctors',
            localField: '_id',
            foreignField: '_id',
            as: 'doctorInfo'
          }
        },
        {
          $unwind: '$doctorInfo'
        },
        {
          $sort: { prescriptionCount: -1 }
        },
        {
          $limit: 1
        },
        {
          $project: {
            name: '$doctorInfo.name',
            prescriptions: '$prescriptionCount',
            salesValue: '$totalSalesValue'
          }
        }
      ]);

      const topReferrerData = topReferrer[0] || {
        name: 'No data',
        prescriptions: 0,
        salesValue: 0
      };

      return {
        ...basicStats,
        totalPrescriptions: periodStats.totalPrescriptions,
        thisMonthCommissions: Math.round(periodStats.totalCommissions),
        pendingCommissions: Math.round(periodStats.totalCommissions), // For now, assume all are pending
        topReferrer: topReferrerData,
        periodStats: {
          startDate,
          endDate,
          totalSalesValue: periodStats.totalSalesValue
        }
      };

    } catch (error) {
      console.error('Error getting store stats:', error);
      throw error;
    }
  }

  /**
   * Get commission history for a store
   * @param {String} storeId - Store ID
   * @param {Object} options - Query options
   */
  static async getCommissionHistory(storeId, options = {}) {
    try {
      const { dateRange = 'thisMonth', status } = options;
      const { startDate, endDate } = this.getDateRange(dateRange);

      // First, get calculated commissions from sales data
      const calculatedCommissions = await Sale.aggregate([
        {
          $match: {
            store: new mongoose.Types.ObjectId(storeId),
            'prescription.doctor': { $exists: true, $ne: null },
            saleDate: { $gte: startDate, $lte: endDate },
            status: { $in: ['completed'] }
          }
        },
        {
          $lookup: {
            from: 'doctors',
            localField: 'prescription.doctor',
            foreignField: '_id',
            as: 'doctorInfo'
          }
        },
        {
          $unwind: '$doctorInfo'
        },
        {
          $group: {
            _id: '$prescription.doctor',
            doctor: { $first: '$doctorInfo' },
            prescriptionCount: { $sum: 1 },
            salesValue: { $sum: '$totalAmount' },
            commissionRate: { $first: '$doctorInfo.commissionRate' },
            lastSaleDate: { $max: '$saleDate' },
            firstSaleDate: { $min: '$saleDate' }
          }
        },
        {
          $addFields: {
            commissionAmount: {
              $multiply: [
                '$salesValue',
                { $divide: [{ $ifNull: ['$commissionRate', 0] }, 100] }
              ]
            }
          }
        }
      ]);

      // Get existing commission records from database
      const existingCommissions = await Commission.find({
        store: storeId,
        createdAt: { $gte: startDate, $lte: endDate }
      }).populate('doctor', 'name specialization');

      // Create a map of existing commissions by doctor ID
      const existingCommissionMap = new Map();
      existingCommissions.forEach(comm => {
        const doctorId = comm.doctor._id.toString();
        existingCommissionMap.set(doctorId, comm);
      });

      // Merge calculated and existing commissions
      const mergedCommissions = calculatedCommissions.map(calc => {
        const doctorId = calc._id.toString();
        const existing = existingCommissionMap.get(doctorId);

        if (existing) {
          // Use existing commission record with updated calculations
          return {
            _id: existing._id,
            doctor: {
              _id: existing.doctor._id,
              name: existing.doctor.name,
              specialization: existing.doctor.specialization
            },
            prescriptionCount: calc.prescriptionCount,
            salesValue: calc.salesValue,
            commissionRate: calc.commissionRate,
            commissionAmount: Math.round(calc.commissionAmount),
            status: existing.status,
            paymentDate: existing.paymentDate,
            paymentMethod: existing.paymentMethod,
            createdAt: existing.createdAt,
            updatedAt: existing.updatedAt || existing.lastUpdated
          };
        } else {
          // Create new commission format for display
          return {
            _id: `comm_${doctorId}`,
            doctor: {
              _id: calc.doctor._id,
              name: calc.doctor.name,
              specialization: calc.doctor.specialization
            },
            prescriptionCount: calc.prescriptionCount,
            salesValue: calc.salesValue,
            commissionRate: calc.commissionRate,
            commissionAmount: Math.round(calc.commissionAmount),
            status: 'pending',
            createdAt: calc.lastSaleDate,
            updatedAt: calc.lastSaleDate
          };
        }
      });

      // Filter by status if specified
      const filteredCommissions = status && status !== 'all'
        ? mergedCommissions.filter(comm => comm.status === status)
        : mergedCommissions;

      // Sort by doctor name
      filteredCommissions.sort((a, b) => a.doctor.name.localeCompare(b.doctor.name));

      return filteredCommissions;

    } catch (error) {
      console.error('Error getting commission history:', error);
      throw error;
    }
  }

  /**
   * Calculate commission amount based on sales value and commission structure
   * @param {Number} salesValue - Total sales value
   * @param {Number} rate - Commission rate
   * @param {String} type - Commission type ('percentage' or 'fixed')
   */
  static calculateCommissionAmount(salesValue, rate, type = 'percentage') {
    if (type === 'fixed') {
      return rate || 0;
    }
    return Math.round((salesValue * (rate || 0)) / 100);
  }

  /**
   * Get date range based on period string
   * @param {String} dateRange - Date range identifier
   */
  static getDateRange(dateRange) {
    const now = new Date();
    let startDate, endDate;

    switch (dateRange) {
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return { startDate, endDate };
  }
}

module.exports = DoctorStatsService;

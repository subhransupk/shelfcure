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

      // Create or update commission record for the current month if there are sales
      if (result.totalPrescriptions > 0 && result.totalSalesValue > 0) {
        await this.createOrUpdateMonthlyCommission(doctorId, doctor.store, doctor.commissionRate, doctor.commissionType);
      }

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
   * Create or update monthly commission record for a doctor
   * @param {String} doctorId - Doctor ID
   * @param {String} storeId - Store ID
   * @param {Number} commissionRate - Doctor's commission rate
   * @param {String} commissionType - Commission type ('percentage' or 'fixed')
   */
  static async createOrUpdateMonthlyCommission(doctorId, storeId, commissionRate = 0, commissionType = 'percentage') {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Calculate monthly statistics from sales
      const monthlyStats = await Sale.aggregate([
        {
          $match: {
            'prescription.doctor': new mongoose.Types.ObjectId(doctorId),
            store: new mongoose.Types.ObjectId(storeId),
            status: { $in: ['completed'] },
            saleDate: {
              $gte: new Date(currentYear, currentMonth - 1, 1), // Start of current month
              $lt: new Date(currentYear, currentMonth, 1) // Start of next month
            }
          }
        },
        {
          $group: {
            _id: null,
            prescriptionCount: { $sum: 1 },
            salesValue: { $sum: '$totalAmount' }
          }
        }
      ]);

      const monthlyResult = monthlyStats[0] || {
        prescriptionCount: 0,
        salesValue: 0
      };

      // Only create commission record if there are sales this month
      if (monthlyResult.prescriptionCount > 0 && monthlyResult.salesValue > 0) {
        const commissionAmount = this.calculateCommissionAmount(
          monthlyResult.salesValue,
          commissionRate,
          commissionType
        );

        // Create or update commission record using the static method
        const commissionData = {
          store: storeId,
          doctor: doctorId,
          period: {
            month: currentMonth,
            year: currentYear
          },
          prescriptionCount: monthlyResult.prescriptionCount,
          salesValue: monthlyResult.salesValue,
          commissionRate: commissionRate,
          commissionAmount: commissionAmount
        };

        const commission = await Commission.createOrUpdate(commissionData);
        console.log(`✅ Commission record created/updated for doctor ${doctorId} - Month: ${currentMonth}/${currentYear}, Amount: ₹${commissionAmount}`);

        return commission;
      }

      return null;
    } catch (error) {
      console.error('Error creating/updating monthly commission:', error);
      throw error;
    }
  }

  /**
   * Create commission records for all historical sales of a doctor
   * This method helps populate commission records for existing sales data
   * @param {String} doctorId - Doctor ID
   * @param {String} storeId - Store ID (optional, for validation)
   */
  static async createHistoricalCommissions(doctorId, storeId = null) {
    try {
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      // Validate store if provided
      if (storeId && doctor.store.toString() !== storeId.toString()) {
        throw new Error('Doctor does not belong to the specified store');
      }

      // Get monthly sales data for this doctor
      const monthlySales = await Sale.aggregate([
        {
          $match: {
            'prescription.doctor': new mongoose.Types.ObjectId(doctorId),
            status: { $in: ['completed'] }
          }
        },
        {
          $group: {
            _id: {
              month: { $month: '$saleDate' },
              year: { $year: '$saleDate' }
            },
            prescriptionCount: { $sum: 1 },
            salesValue: { $sum: '$totalAmount' }
          }
        },
        {
          $sort: { '_id.year': -1, '_id.month': -1 }
        }
      ]);

      const createdCommissions = [];

      // Create commission records for each month
      for (const monthData of monthlySales) {
        const commissionAmount = this.calculateCommissionAmount(
          monthData.salesValue,
          doctor.commissionRate || 0,
          doctor.commissionType || 'percentage'
        );

        const commissionData = {
          store: doctor.store,
          doctor: doctorId,
          period: {
            month: monthData._id.month,
            year: monthData._id.year
          },
          prescriptionCount: monthData.prescriptionCount,
          salesValue: monthData.salesValue,
          commissionRate: doctor.commissionRate || 0,
          commissionAmount: commissionAmount
        };

        const commission = await Commission.createOrUpdate(commissionData);
        createdCommissions.push(commission);
      }

      console.log(`✅ Created/updated ${createdCommissions.length} historical commission records for doctor ${doctorId}`);
      return createdCommissions;

    } catch (error) {
      console.error('Error creating historical commissions:', error);
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

      // Get ALL commission records for the store (not filtered by date)
      const allCommissionRecords = await Commission.find({
        store: storeId
      });

      // Calculate totals from ALL commission records
      let totalPaidCommissions = 0;
      let totalCommissionAmount = 0;

      allCommissionRecords.forEach(record => {
        const commissionAmount = record.commissionAmount || 0;
        totalCommissionAmount += commissionAmount;

        // Count paid commissions
        if (record.status === 'paid') {
          totalPaidCommissions += commissionAmount;
        }
      });

      // Get commission records for the current period (This Month)
      const periodCommissionRecords = await Commission.find({
        store: storeId,
        saleDate: { $gte: startDate, $lte: endDate }
      });

      let thisMonthCommissions = 0;
      periodCommissionRecords.forEach(record => {
        thisMonthCommissions += record.commissionAmount || 0;
      });

      // If no commission records exist for this period, calculate from sales data
      if (periodCommissionRecords.length === 0) {
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
              salesValue: { $sum: '$totalAmount' },
              commissionRate: { $first: '$doctorInfo.commissionRate' }
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

        calculatedCommissions.forEach(calc => {
          thisMonthCommissions += Math.round(calc.commissionAmount);
        });
      }

      // Calculate pending commissions
      const totalPendingCommissions = totalCommissionAmount - totalPaidCommissions;

      return {
        ...basicStats,
        totalPrescriptions: periodStats.totalPrescriptions,
        thisMonthCommissions: Math.round(thisMonthCommissions), // This month commissions only
        totalCommissions: Math.round(totalCommissionAmount), // ALL commissions
        totalPaid: Math.round(totalPaidCommissions), // ALL paid commissions
        totalPending: Math.round(totalPendingCommissions), // Total - Paid
        pendingCommissions: Math.round(totalPendingCommissions), // Keep for backward compatibility
        thisMonth: Math.round(thisMonthCommissions), // This month commissions only
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
   * Get commission history for a store - returns individual commission records per sale transaction
   * @param {String} storeId - Store ID
   * @param {Object} options - Query options
   */
  static async getCommissionHistory(storeId, options = {}) {
    try {
      const { dateRange = 'thisMonth', status } = options;
      const { startDate, endDate } = this.getDateRange(dateRange);

      // Get individual sales with doctor prescriptions (no aggregation)
      const salesWithCommissions = await Sale.aggregate([
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
          $addFields: {
            commissionAmount: {
              $multiply: [
                '$totalAmount',
                { $divide: [{ $ifNull: ['$doctorInfo.commissionRate', 0] }, 100] }
              ]
            }
          }
        },
        {
          $project: {
            _id: 1,
            saleDate: 1,
            totalAmount: 1,
            invoiceNumber: 1,
            receiptNumber: 1,
            doctor: '$doctorInfo',
            commissionAmount: 1,
            commissionRate: '$doctorInfo.commissionRate'
          }
        },
        {
          $sort: { saleDate: -1 } // Most recent sales first
        }
      ]);

      // Get existing commission records from database for these specific sales
      const saleIds = salesWithCommissions.map(sale => sale._id);
      const existingCommissions = await Commission.find({
        store: storeId,
        sale: { $in: saleIds }
      }).populate('doctor', 'name specialization').populate('sale', 'saleDate totalAmount invoiceNumber receiptNumber');

      // Create a map of existing commissions by sale ID
      const existingCommissionMap = new Map();
      existingCommissions.forEach(comm => {
        const saleId = comm.sale._id.toString();
        existingCommissionMap.set(saleId, comm);
      });

      // Create commission records for each individual sale
      const individualCommissions = salesWithCommissions.map(sale => {
        const saleId = sale._id.toString();
        const existing = existingCommissionMap.get(saleId);

        if (existing) {
          // Use existing commission record
          return {
            _id: existing._id,
            doctor: {
              _id: existing.doctor._id,
              name: existing.doctor.name,
              specialization: existing.doctor.specialization
            },
            sale: {
              _id: sale._id,
              saleDate: sale.saleDate,
              invoiceNumber: sale.invoiceNumber,
              receiptNumber: sale.receiptNumber
            },
            period: existing.period,
            prescriptionCount: 1, // Each commission represents one prescription/sale
            salesValue: sale.totalAmount,
            commissionRate: sale.commissionRate,
            commissionAmount: Math.round(sale.commissionAmount),
            status: existing.status,
            paymentDate: existing.paymentDate,
            paymentMethod: existing.paymentMethod,
            createdAt: existing.createdAt,
            updatedAt: existing.updatedAt || existing.lastUpdated,
            saleDate: sale.saleDate,
            invoiceNumber: sale.invoiceNumber,
            receiptNumber: sale.receiptNumber
          };
        } else {
          // Create new commission format for display
          const saleDate = new Date(sale.saleDate);
          return {
            _id: `temp_${saleId}`, // Temporary ID for unsaved commissions
            doctor: {
              _id: sale.doctor._id,
              name: sale.doctor.name,
              specialization: sale.doctor.specialization
            },
            sale: {
              _id: sale._id,
              saleDate: sale.saleDate,
              invoiceNumber: sale.invoiceNumber,
              receiptNumber: sale.receiptNumber
            },
            period: {
              month: saleDate.getMonth() + 1,
              year: saleDate.getFullYear()
            },
            prescriptionCount: 1,
            salesValue: sale.totalAmount,
            commissionRate: sale.commissionRate,
            commissionAmount: Math.round(sale.commissionAmount),
            status: 'pending',
            createdAt: sale.saleDate,
            updatedAt: sale.saleDate,
            saleDate: sale.saleDate,
            invoiceNumber: sale.invoiceNumber,
            receiptNumber: sale.receiptNumber
          };
        }
      });

      // Filter by status if specified
      const filteredCommissions = status && status !== 'all'
        ? individualCommissions.filter(comm => comm.status === status)
        : individualCommissions;

      // Sort by sale date (most recent first), then by doctor name
      filteredCommissions.sort((a, b) => {
        const dateComparison = new Date(b.saleDate) - new Date(a.saleDate);
        if (dateComparison !== 0) return dateComparison;
        return a.doctor.name.localeCompare(b.doctor.name);
      });

      console.log(`Returning ${filteredCommissions.length} individual commission records for store ${storeId}`);
      return filteredCommissions;

    } catch (error) {
      console.error('Error getting commission history:', error);
      throw error;
    }
  }

  /**
   * Create individual commission record for a completed sale
   * @param {Object} sale - Sale document with prescription and doctor info
   */
  static async createCommissionForSale(sale) {
    try {
      // Get doctor information
      const doctor = await Doctor.findById(sale.prescription.doctor);
      if (!doctor) {
        console.log(`Doctor not found for sale ${sale._id}`);
        return null;
      }

      // Calculate commission amount
      const commissionAmount = this.calculateCommissionAmount(
        sale.totalAmount,
        doctor.commissionRate || 0,
        doctor.commissionType || 'percentage'
      );

      // Create commission record using the new model method
      const commissionData = {
        store: sale.store,
        doctor: sale.prescription.doctor,
        sale: sale._id,
        saleDate: sale.saleDate,
        invoiceNumber: sale.invoiceNumber,
        receiptNumber: sale.receiptNumber,
        prescriptionCount: 1, // Each sale represents one prescription
        salesValue: sale.totalAmount,
        commissionRate: doctor.commissionRate || 0,
        commissionAmount: commissionAmount
      };

      const commission = await Commission.createForSale(commissionData);
      console.log(`✅ Created commission record ${commission._id} for sale ${sale._id}`);
      return commission;

    } catch (error) {
      console.error('Error creating commission for sale:', error);
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

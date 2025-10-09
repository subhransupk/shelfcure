const Commission = require('../models/Commission');
const Doctor = require('../models/Doctor');
const Sale = require('../models/Sale');
const mongoose = require('mongoose');

class CommissionPaymentService {
  /**
   * Get comprehensive commission summary for a specific doctor
   * @param {String} doctorId - Doctor ID
   * @param {String} storeId - Store ID
   * @returns {Object} Commission summary with totals and payment status
   */
  static async getDoctorCommissionSummary(doctorId, storeId) {
    try {
      // Get doctor information
      const doctor = await Doctor.findOne({ _id: doctorId, store: storeId });
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      // Get all commission records for this doctor
      const commissions = await Commission.find({
        doctor: doctorId,
        store: storeId
      }).populate('paidBy', 'name').sort({ createdAt: -1 });

      // Calculate totals
      const totalCommissionEarned = commissions.reduce((sum, comm) => sum + (comm.commissionAmount || 0), 0);
      const totalCommissionPaid = commissions.reduce((sum, comm) => sum + (comm.totalPaid || 0), 0);
      const pendingCommissionAmount = totalCommissionEarned - totalCommissionPaid;

      // Determine payment status
      let paymentStatus = 'Unpaid';
      if (totalCommissionPaid === 0) {
        paymentStatus = 'Unpaid';
      } else if (pendingCommissionAmount === 0) {
        paymentStatus = 'Fully Paid';
      } else {
        paymentStatus = 'Partially Paid';
      }

      // Get payment statistics
      const totalPayments = commissions.reduce((sum, comm) => sum + (comm.paymentHistory?.length || 0), 0);
      const lastPaymentDate = this.getLastPaymentDate(commissions);

      return {
        doctor: {
          _id: doctor._id,
          name: doctor.name,
          specialization: doctor.specialization,
          commissionRate: doctor.commissionRate,
          commissionType: doctor.commissionType
        },
        summary: {
          totalCommissionEarned,
          totalCommissionPaid,
          pendingCommissionAmount,
          paymentStatus,
          totalPayments,
          lastPaymentDate,
          commissionRecords: commissions.length
        },
        commissions: commissions.map(comm => ({
          _id: comm._id,
          period: comm.period,
          prescriptionCount: comm.prescriptionCount,
          salesValue: comm.salesValue,
          commissionAmount: comm.commissionAmount,
          totalPaid: comm.totalPaid || 0,
          remainingBalance: comm.remainingBalance || comm.commissionAmount,
          status: comm.status,
          paymentDate: comm.paymentDate,
          createdAt: comm.createdAt,
          paymentHistoryCount: comm.paymentHistory?.length || 0
        }))
      };
    } catch (error) {
      console.error('Error getting doctor commission summary:', error);
      throw error;
    }
  }

  /**
   * Get detailed payment history for a specific doctor
   * @param {String} doctorId - Doctor ID
   * @param {String} storeId - Store ID
   * @param {Object} options - Query options (limit, page, etc.)
   * @returns {Object} Detailed payment history timeline
   */
  static async getDoctorPaymentHistory(doctorId, storeId, options = {}) {
    try {
      const { limit = 50, page = 1 } = options;
      const skip = (page - 1) * limit;

      // Get all commission records with payment history
      const commissions = await Commission.find({
        doctor: doctorId,
        store: storeId,
        'paymentHistory.0': { $exists: true } // Only commissions with payment history
      })
      .populate('paidBy', 'name')
      .populate('paymentHistory.processedBy', 'name')
      .sort({ 'paymentHistory.paymentDate': -1 });

      // Flatten payment history from all commissions
      const paymentTimeline = [];
      
      commissions.forEach(commission => {
        if (commission.paymentHistory && commission.paymentHistory.length > 0) {
          commission.paymentHistory.forEach(payment => {
            paymentTimeline.push({
              _id: payment._id,
              commissionId: commission._id,
              period: commission.period,
              amount: payment.amount,
              paymentMethod: payment.paymentMethod,
              paymentReference: payment.paymentReference,
              paymentDate: payment.paymentDate,
              notes: payment.notes,
              processedBy: payment.processedBy,
              runningBalance: payment.runningBalance,
              commissionAmount: commission.commissionAmount,
              salesValue: commission.salesValue,
              prescriptionCount: commission.prescriptionCount
            });
          });
        }
      });

      // Sort by payment date (most recent first)
      paymentTimeline.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

      // Apply pagination
      const paginatedHistory = paymentTimeline.slice(skip, skip + limit);

      return {
        paymentHistory: paginatedHistory,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(paymentTimeline.length / limit),
          totalRecords: paymentTimeline.length,
          hasNext: page * limit < paymentTimeline.length,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting doctor payment history:', error);
      throw error;
    }
  }

  /**
   * Record a new commission payment
   * @param {String} commissionId - Commission ID
   * @param {Object} paymentData - Payment details
   * @param {String} storeId - Store ID
   * @returns {Object} Updated commission record
   */
  static async recordCommissionPayment(commissionId, paymentData, storeId) {
    try {
      const { amount, paymentMethod, paymentReference, notes, processedBy } = paymentData;

      // Validate payment amount
      if (!amount || amount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      // Find the commission record
      const commission = await Commission.findOne({
        _id: commissionId,
        store: storeId
      }).populate('doctor', 'name');

      if (!commission) {
        throw new Error('Commission record not found');
      }

      // Check if payment amount doesn't exceed remaining balance
      const remainingBalance = commission.remainingBalance || commission.commissionAmount;
      if (amount > remainingBalance) {
        throw new Error(`Payment amount (₹${amount}) cannot exceed remaining balance (₹${remainingBalance})`);
      }

      // Record the payment using the model method
      await commission.recordPayment({
        amount,
        paymentMethod,
        paymentReference,
        notes,
        processedBy
      });

      // Return updated commission with populated fields
      const updatedCommission = await Commission.findById(commissionId)
        .populate('doctor', 'name specialization')
        .populate('paidBy', 'name')
        .populate('paymentHistory.processedBy', 'name');

      return {
        commission: updatedCommission,
        paymentRecorded: {
          amount,
          paymentMethod,
          paymentReference,
          newBalance: updatedCommission.remainingBalance,
          paymentStatus: updatedCommission.paymentStatusDisplay
        }
      };
    } catch (error) {
      console.error('Error recording commission payment:', error);
      throw error;
    }
  }

  /**
   * Get commission statistics for dashboard
   * @param {String} storeId - Store ID
   * @param {Object} options - Query options
   * @returns {Object} Commission statistics
   */
  static async getCommissionStats(storeId, options = {}) {
    try {
      const { dateRange = 'thisMonth' } = options;
      
      // Calculate date range
      const { startDate, endDate } = this.getDateRange(dateRange);

      const stats = await Commission.aggregate([
        {
          $match: {
            store: new mongoose.Types.ObjectId(storeId),
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalCommissionEarned: { $sum: '$commissionAmount' },
            totalCommissionPaid: { $sum: '$totalPaid' },
            pendingCommissions: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, '$commissionAmount', 0]
              }
            },
            totalCommissionRecords: { $sum: 1 },
            paidCommissionRecords: {
              $sum: {
                $cond: [{ $eq: ['$status', 'paid'] }, 1, 0]
              }
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalCommissionEarned: 0,
        totalCommissionPaid: 0,
        pendingCommissions: 0,
        totalCommissionRecords: 0,
        paidCommissionRecords: 0
      };

      result.pendingCommissionAmount = result.totalCommissionEarned - result.totalCommissionPaid;
      result.paymentCompletionRate = result.totalCommissionRecords > 0 
        ? Math.round((result.paidCommissionRecords / result.totalCommissionRecords) * 100)
        : 0;

      return result;
    } catch (error) {
      console.error('Error getting commission stats:', error);
      throw error;
    }
  }

  /**
   * Helper method to get the last payment date from commissions
   * @param {Array} commissions - Array of commission records
   * @returns {Date|null} Last payment date
   */
  static getLastPaymentDate(commissions) {
    let lastPaymentDate = null;
    
    commissions.forEach(commission => {
      if (commission.paymentHistory && commission.paymentHistory.length > 0) {
        commission.paymentHistory.forEach(payment => {
          if (!lastPaymentDate || payment.paymentDate > lastPaymentDate) {
            lastPaymentDate = payment.paymentDate;
          }
        });
      }
    });
    
    return lastPaymentDate;
  }

  /**
   * Helper method to calculate date ranges
   * @param {String} dateRange - Date range identifier
   * @returns {Object} Start and end dates
   */
  static getDateRange(dateRange) {
    const now = new Date();
    let startDate, endDate;

    switch (dateRange) {
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
        break;
      default:
        // All time
        startDate = new Date(2020, 0, 1);
        endDate = now;
    }

    return { startDate, endDate };
  }
}

module.exports = CommissionPaymentService;

const Affiliate = require('../models/Affiliate');
const AffiliateCommission = require('../models/AffiliateCommission');
const Store = require('../models/Store');
const Invoice = require('../models/Invoice');

class CommissionService {
  /**
   * Calculate and create commission for a new store subscription
   * @param {Object} subscriptionData - Store subscription data
   * @param {String} affiliateCode - Affiliate referral code
   */
  static async createInitialCommission(subscriptionData, affiliateCode) {
    try {
      // Find the affiliate
      const affiliate = await Affiliate.findOne({ affiliateCode });
      if (!affiliate || affiliate.status !== 'active') {
        throw new Error('Invalid or inactive affiliate');
      }

      // Find the store
      const store = await Store.findById(subscriptionData.storeId);
      if (!store) {
        throw new Error('Store not found');
      }

      // Calculate commission amount
      const baseAmount = subscriptionData.amount;
      const commissionRate = affiliate.commission.rate;
      const commissionAmount = affiliate.commission.type === 'percentage' 
        ? (baseAmount * commissionRate) / 100
        : commissionRate;

      // Create commission record
      const commission = await AffiliateCommission.create({
        affiliate: affiliate._id,
        store: store._id,
        type: 'initial',
        period: {
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        },
        baseAmount,
        commissionRate,
        commissionAmount,
        status: 'pending',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        subscription: {
          planName: subscriptionData.planName,
          planType: subscriptionData.planType,
          subscriptionStartDate: subscriptionData.startDate,
          subscriptionEndDate: subscriptionData.endDate
        },
        customerAcquisitionDate: new Date()
      });

      // Update affiliate stats
      await this.updateAffiliateStats(affiliate._id);

      return commission;
    } catch (error) {
      console.error('Error creating initial commission:', error);
      throw error;
    }
  }

  /**
   * Create recurring commission for existing subscription
   * @param {String} storeId - Store ID
   * @param {Object} invoiceData - Invoice data
   */
  static async createRecurringCommission(storeId, invoiceData) {
    try {
      // Find store and its affiliate
      const store = await Store.findById(storeId).populate('affiliate.affiliateId');
      if (!store || !store.affiliate || !store.affiliate.affiliateId) {
        return null; // No affiliate associated
      }

      const affiliate = store.affiliate.affiliateId;
      if (affiliate.status !== 'active') {
        return null; // Affiliate not active
      }

      // Check if recurring commission is enabled and within limit
      if (!affiliate.commission.recurringCommission.enabled) {
        return null;
      }

      // Check how many months of recurring commission have been paid
      const existingCommissions = await AffiliateCommission.countDocuments({
        affiliate: affiliate._id,
        store: store._id,
        type: 'recurring'
      });

      if (existingCommissions >= affiliate.commission.recurringCommission.months) {
        return null; // Reached recurring commission limit
      }

      // Calculate commission
      const baseAmount = invoiceData.totalAmount;
      const commissionRate = affiliate.commission.rate;
      const commissionAmount = affiliate.commission.type === 'percentage' 
        ? (baseAmount * commissionRate) / 100
        : commissionRate;

      // Create recurring commission
      const commission = await AffiliateCommission.create({
        affiliate: affiliate._id,
        store: store._id,
        invoice: invoiceData.invoiceId,
        type: 'recurring',
        period: {
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        },
        baseAmount,
        commissionRate,
        commissionAmount,
        status: 'pending',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subscription: {
          planName: invoiceData.planName,
          planType: invoiceData.planType,
          isRenewal: true
        }
      });

      // Update affiliate stats
      await this.updateAffiliateStats(affiliate._id);

      return commission;
    } catch (error) {
      console.error('Error creating recurring commission:', error);
      throw error;
    }
  }

  /**
   * Update affiliate statistics
   * @param {String} affiliateId - Affiliate ID
   */
  static async updateAffiliateStats(affiliateId) {
    try {
      const affiliate = await Affiliate.findById(affiliateId);
      if (!affiliate) return;

      // Get commission statistics
      const commissionStats = await AffiliateCommission.aggregate([
        { $match: { affiliate: affiliate._id } },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: '$commissionAmount' },
            pendingEarnings: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, '$commissionAmount', 0]
              }
            },
            paidEarnings: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$commissionAmount', 0]
              }
            }
          }
        }
      ]);

      // Get referral statistics
      const totalReferrals = await Store.countDocuments({
        'affiliate.affiliateId': affiliateId
      });

      const successfulReferrals = await Store.countDocuments({
        'affiliate.affiliateId': affiliateId,
        status: 'active'
      });

      // Update affiliate stats
      const stats = commissionStats[0] || {};
      affiliate.stats = {
        ...affiliate.stats,
        totalReferrals,
        successfulReferrals,
        totalEarnings: stats.totalEarnings || 0,
        pendingEarnings: stats.pendingEarnings || 0,
        paidEarnings: stats.paidEarnings || 0,
        conversionRate: totalReferrals > 0 ? Math.round((successfulReferrals / totalReferrals) * 100) : 0,
        lastReferralDate: new Date()
      };

      await affiliate.save();
    } catch (error) {
      console.error('Error updating affiliate stats:', error);
    }
  }

  /**
   * Process commission payments
   * @param {Array} commissionIds - Array of commission IDs to pay
   * @param {Object} paymentData - Payment details
   */
  static async processCommissionPayments(commissionIds, paymentData) {
    try {
      const commissions = await AffiliateCommission.find({
        _id: { $in: commissionIds },
        status: 'approved',
        paymentStatus: 'unpaid'
      }).populate('affiliate');

      const results = [];

      for (const commission of commissions) {
        // Update commission payment status
        commission.payment = {
          method: paymentData.method,
          transactionId: paymentData.transactionId || `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          paidDate: new Date(),
          paidAmount: commission.commissionAmount,
          processingFee: paymentData.processingFee || 0,
          netAmount: commission.commissionAmount - (paymentData.processingFee || 0),
          notes: paymentData.notes
        };
        commission.paymentStatus = 'paid';
        commission.paidDate = new Date();

        await commission.save();

        // Update affiliate stats
        await this.updateAffiliateStats(commission.affiliate._id);

        results.push({
          commissionId: commission._id,
          affiliateId: commission.affiliate._id,
          amount: commission.commissionAmount,
          status: 'paid'
        });
      }

      return results;
    } catch (error) {
      console.error('Error processing commission payments:', error);
      throw error;
    }
  }

  /**
   * Get commission summary for a period
   * @param {Object} filters - Filter criteria
   */
  static async getCommissionSummary(filters = {}) {
    try {
      const matchStage = {};
      
      if (filters.affiliateId) matchStage.affiliate = filters.affiliateId;
      if (filters.storeId) matchStage.store = filters.storeId;
      if (filters.status) matchStage.status = filters.status;
      if (filters.paymentStatus) matchStage.paymentStatus = filters.paymentStatus;
      
      if (filters.dateFrom || filters.dateTo) {
        matchStage.earnedDate = {};
        if (filters.dateFrom) matchStage.earnedDate.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) matchStage.earnedDate.$lte = new Date(filters.dateTo);
      }

      const summary = await AffiliateCommission.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalCommissions: { $sum: '$commissionAmount' },
            totalCount: { $sum: 1 },
            pendingCommissions: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, '$commissionAmount', 0]
              }
            },
            approvedCommissions: {
              $sum: {
                $cond: [{ $eq: ['$status', 'approved'] }, '$commissionAmount', 0]
              }
            },
            paidCommissions: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$commissionAmount', 0]
              }
            },
            pendingCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
              }
            },
            approvedCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'approved'] }, 1, 0]
              }
            },
            paidCount: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0]
              }
            }
          }
        }
      ]);

      return summary[0] || {
        totalCommissions: 0,
        totalCount: 0,
        pendingCommissions: 0,
        approvedCommissions: 0,
        paidCommissions: 0,
        pendingCount: 0,
        approvedCount: 0,
        paidCount: 0
      };
    } catch (error) {
      console.error('Error getting commission summary:', error);
      throw error;
    }
  }
}

module.exports = CommissionService;

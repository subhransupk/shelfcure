const Affiliate = require('../models/Affiliate');
const AffiliateCommission = require('../models/AffiliateCommission');
const Store = require('../models/Store');
const Invoice = require('../models/Invoice');

class CommissionService {
  /**
   * Calculate and create multi-level commissions for a new store subscription
   * @param {Object} subscriptionData - Store subscription data
   * @param {String} affiliateCode - Affiliate referral code
   */
  static async createInitialCommission(subscriptionData, affiliateCode) {
    try {
      // Prepare sale data for multi-level commission creation
      const saleData = {
        affiliateCode,
        storeId: subscriptionData.storeId,
        invoiceId: subscriptionData.invoiceId,
        amount: subscriptionData.amount,
        subscription: {
          planName: subscriptionData.planName,
          planType: subscriptionData.planType,
          subscriptionStartDate: subscriptionData.startDate,
          subscriptionEndDate: subscriptionData.endDate,
          isRenewal: false
        }
      };

      // Create multi-level commissions using the new system
      const commissions = await AffiliateCommission.createMultiLevelCommissions(saleData);

      // Check if this is the affiliate's first sale and handle referral commissions
      const firstSaleCommission = await this.handleFirstSaleCommission(affiliateCode, saleData);
      if (firstSaleCommission) {
        commissions.push(firstSaleCommission);
      }

      // Update stats for all affected affiliates
      for (const commission of commissions) {
        await this.updateAffiliateStats(commission.affiliate);
      }

      return commissions;
    } catch (error) {
      console.error('Error creating initial commission:', error);
      throw error;
    }
  }

  /**
   * Create multi-level recurring commissions for existing subscription
   * @param {String} storeId - Store ID
   * @param {Object} invoiceData - Invoice data
   * @param {String} affiliateCode - Affiliate code for the store
   */
  static async createRecurringCommission(storeId, invoiceData, affiliateCode) {
    try {
      // Find the affiliate
      const affiliate = await Affiliate.findOne({ affiliateCode, status: 'active' });
      if (!affiliate) {
        return null; // No active affiliate found
      }

      // Check if recurring commission is enabled and within limit
      if (!affiliate.commission.recurringCommission.enabled) {
        return null;
      }

      // Check how many months of recurring commission have been paid
      const existingCommissions = await AffiliateCommission.countDocuments({
        affiliate: affiliate._id,
        store: storeId,
        type: 'recurring'
      });

      if (existingCommissions >= affiliate.commission.recurringCommission.months) {
        return null; // Reached recurring commission limit
      }

      // Prepare sale data for multi-level commission creation
      const saleData = {
        affiliateCode,
        storeId,
        invoiceId: invoiceData.invoiceId,
        amount: invoiceData.totalAmount,
        subscription: {
          planName: invoiceData.planName,
          planType: invoiceData.planType,
          isRenewal: true
        }
      };

      // Create multi-level commissions (recurring for seller, one-time for referrer)
      const commissions = await AffiliateCommission.createMultiLevelCommissions(saleData);

      // Update stats for all affected affiliates
      for (const commission of commissions) {
        await this.updateAffiliateStats(commission.affiliate);
      }

      return commissions;
    } catch (error) {
      console.error('Error creating recurring commission:', error);
      throw error;
    }
  }

  /**
   * Handle affiliate referral commission when a referred affiliate makes their first sale
   * @param {String} newAffiliateId - ID of the newly referred affiliate who made a sale
   * @param {Object} firstSaleData - Data of their first sale
   */
  static async handleAffiliateReferralCommission(newAffiliateId, firstSaleData) {
    try {
      const newAffiliate = await Affiliate.findById(newAffiliateId);
      if (!newAffiliate || !newAffiliate.referredBy) {
        return null; // No referrer to pay commission to
      }

      const referrer = await Affiliate.findById(newAffiliate.referredBy);
      if (!referrer || referrer.status !== 'active' ||
          !referrer.commission.referralCommission.enabled) {
        return null; // Referrer not eligible for commission
      }

      // Create affiliate referral commission
      const commission = await AffiliateCommission.createAffiliateReferralCommission(
        referrer,
        newAffiliate,
        firstSaleData
      );

      if (commission) {
        // Update stats for the referrer
        await this.updateAffiliateStats(referrer._id);

        // Update affiliate referral stats
        referrer.stats.totalAffiliateReferrals += 1;
        referrer.stats.successfulAffiliateReferrals += 1;
        await referrer.save();
      }

      return commission;
    } catch (error) {
      console.error('Error handling affiliate referral commission:', error);
      throw error;
    }
  }

  /**
   * Check if this is an affiliate's first sale and handle referral commissions
   * @param {String} affiliateCode - Affiliate code who made the sale
   * @param {Object} saleData - Sale data
   */
  static async handleFirstSaleCommission(affiliateCode, saleData) {
    try {
      const affiliate = await Affiliate.findOne({ affiliateCode });
      if (!affiliate) return null;

      // Check if this is their first sale
      const existingCommissions = await AffiliateCommission.countDocuments({
        affiliate: affiliate._id,
        type: { $in: ['initial', 'recurring'] }
      });

      // If this is their first sale and they were referred by someone
      if (existingCommissions === 1 && affiliate.referredBy) { // 1 because we just created the initial commission
        return await this.handleAffiliateReferralCommission(affiliate._id, saleData);
      }

      return null;
    } catch (error) {
      console.error('Error handling first sale commission:', error);
      throw error;
    }
  }

  /**
   * Update affiliate statistics with multi-level commission support
   * @param {String} affiliateId - Affiliate ID
   */
  static async updateAffiliateStats(affiliateId) {
    try {
      const affiliate = await Affiliate.findById(affiliateId);
      if (!affiliate) return;

      // Get commission statistics with breakdown by type
      const commissionStats = await AffiliateCommission.aggregate([
        { $match: { affiliate: affiliate._id } },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: '$commissionAmount' },
            recurringEarnings: {
              $sum: {
                $cond: [{ $eq: ['$type', 'recurring'] }, '$commissionAmount', 0]
              }
            },
            oneTimeEarnings: {
              $sum: {
                $cond: [
                  { $in: ['$type', ['initial', 'referral_onetime', 'bonus']] },
                  '$commissionAmount',
                  0
                ]
              }
            },
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

      // Get store referral statistics
      const totalReferrals = await Store.countDocuments({
        'affiliate.affiliateId': affiliateId
      });

      const successfulReferrals = await Store.countDocuments({
        'affiliate.affiliateId': affiliateId,
        status: 'active'
      });

      // Get affiliate referral statistics
      const totalAffiliateReferrals = await Affiliate.countDocuments({
        referredBy: affiliateId
      });

      const successfulAffiliateReferrals = await Affiliate.countDocuments({
        referredBy: affiliateId,
        status: 'active'
      });

      // Update affiliate stats
      const stats = commissionStats[0] || {};
      affiliate.stats = {
        ...affiliate.stats,
        totalReferrals,
        successfulReferrals,
        totalAffiliateReferrals,
        successfulAffiliateReferrals,
        totalEarnings: stats.totalEarnings || 0,
        recurringEarnings: stats.recurringEarnings || 0,
        oneTimeEarnings: stats.oneTimeEarnings || 0,
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

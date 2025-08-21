import axios from 'axios';

// Set up axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class CommissionService {
  /**
   * Get all commissions with filtering and pagination
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  static async getCommissions(params = {}) {
    try {
      const response = await axios.get('/api/affiliates/admin/commissions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching commissions:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get commission analytics/summary
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  static async getCommissionAnalytics(params = {}) {
    try {
      const response = await axios.get('/api/affiliates/admin/commissions/summary', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching commission analytics:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get commission by ID
   * @param {String} commissionId - Commission ID
   * @returns {Promise} API response
   */
  static async getCommissionById(commissionId) {
    try {
      const response = await axios.get(`/api/affiliates/admin/commissions/${commissionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching commission:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Approve a commission
   * @param {String} commissionId - Commission ID
   * @param {Object} data - Approval data (notes, etc.)
   * @returns {Promise} API response
   */
  static async approveCommission(commissionId, data = {}) {
    try {
      const response = await axios.put(`/api/affiliates/admin/commissions/${commissionId}/approve`, data);
      return response.data;
    } catch (error) {
      console.error('Error approving commission:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Process commission payment
   * @param {Array} commissionIds - Array of commission IDs
   * @param {Object} paymentData - Payment details
   * @returns {Promise} API response
   */
  static async processPayment(commissionIds, paymentData) {
    try {
      const response = await axios.post('/api/affiliates/admin/commissions/pay', {
        commissionIds,
        paymentData
      });
      return response.data;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Bulk approve commissions
   * @param {Array} commissionIds - Array of commission IDs
   * @param {Object} data - Approval data
   * @returns {Promise} API response
   */
  static async bulkApprove(commissionIds, data = {}) {
    try {
      const response = await axios.post('/api/affiliates/admin/commissions/bulk-approve', {
        commissionIds,
        ...data
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk approving commissions:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Create manual commission
   * @param {Object} commissionData - Commission data
   * @returns {Promise} API response
   */
  static async createManualCommission(commissionData) {
    try {
      const response = await axios.post('/api/affiliates/admin/commissions/manual', commissionData);
      return response.data;
    } catch (error) {
      console.error('Error creating manual commission:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Export commissions data
   * @param {Object} params - Export parameters
   * @returns {Promise} API response
   */
  static async exportCommissions(params = {}) {
    try {
      const response = await axios.get('/api/affiliates/admin/commissions/export', {
        params,
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error exporting commissions:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get commission payment history
   * @param {String} commissionId - Commission ID
   * @returns {Promise} API response
   */
  static async getPaymentHistory(commissionId) {
    try {
      const response = await axios.get(`/api/affiliates/admin/commissions/${commissionId}/payments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get affiliate commissions
   * @param {String} affiliateId - Affiliate ID
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  static async getAffiliateCommissions(affiliateId, params = {}) {
    try {
      const response = await axios.get(`/api/affiliates/admin/commissions`, {
        params: { affiliate: affiliateId, ...params }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching affiliate commissions:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get store commissions
   * @param {String} storeId - Store ID
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  static async getStoreCommissions(storeId, params = {}) {
    try {
      const response = await axios.get(`/api/affiliates/admin/commissions`, {
        params: { store: storeId, ...params }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching store commissions:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   * @param {Object} error - Axios error object
   * @returns {Object} Formatted error
   */
  static handleError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.message || 'An error occurred',
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        message: 'Network error - please check your connection',
        status: 0,
        data: null
      };
    } else {
      // Something else happened
      return {
        message: error.message || 'An unexpected error occurred',
        status: 0,
        data: null
      };
    }
  }

  /**
   * Format currency for display
   * @param {Number} amount - Amount to format
   * @param {String} currency - Currency code
   * @returns {String} Formatted currency
   */
  static formatCurrency(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Format date for display
   * @param {String|Date} date - Date to format
   * @returns {String} Formatted date
   */
  static formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Format date and time for display
   * @param {String|Date} date - Date to format
   * @returns {String} Formatted date and time
   */
  static formatDateTime(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get status badge color
   * @param {String} status - Commission status
   * @returns {String} CSS class for status badge
   */
  static getStatusBadgeColor(status) {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      paid: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get payment status badge color
   * @param {String} paymentStatus - Payment status
   * @returns {String} CSS class for payment status badge
   */
  static getPaymentStatusBadgeColor(paymentStatus) {
    const colors = {
      unpaid: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800',
      processing: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[paymentStatus] || 'bg-gray-100 text-gray-800';
  }
}

export default CommissionService;

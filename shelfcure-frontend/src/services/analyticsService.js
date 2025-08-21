import { API_ENDPOINTS } from '../config/api';

class AnalyticsService {
  /**
   * Get comprehensive dashboard analytics
   */
  static async getDashboardAnalytics(period = 'thisMonth') {
    try {
      // Fetch all analytics data in parallel
      const [
        dashboardStats,
        revenueAnalytics,
        userGrowth,
        subscriptionAnalytics,
        affiliateAnalytics,
        recentActivities
      ] = await Promise.all([
        this.getDashboardStats(),
        this.getRevenueAnalytics(period),
        this.getUserGrowthAnalytics(period),
        this.getSubscriptionAnalytics(),
        this.getAffiliateAnalytics(period),
        this.getRecentActivities()
      ]);

      return {
        success: true,
        data: {
          dashboardStats: dashboardStats.data,
          revenueAnalytics: revenueAnalytics.data,
          userGrowth: userGrowth.data,
          subscriptionAnalytics: subscriptionAnalytics.data,
          affiliateAnalytics: affiliateAnalytics.data,
          recentActivities: recentActivities.data
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      throw error;
    }
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats() {
    try {
      const response = await fetch(API_ENDPOINTS.DASHBOARD_STATS, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get revenue analytics
   */
  static async getRevenueAnalytics(period = 'monthly', year = new Date().getFullYear()) {
    try {
      const response = await fetch(`${API_ENDPOINTS.ADMIN_REVENUE_ANALYTICS}?period=${period}&year=${year}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      throw error;
    }
  }

  /**
   * Get user growth analytics
   */
  static async getUserGrowthAnalytics(period = 'monthly', year = new Date().getFullYear()) {
    try {
      const response = await fetch(`${API_ENDPOINTS.ADMIN_USER_GROWTH}?period=${period}&year=${year}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user growth analytics:', error);
      throw error;
    }
  }

  /**
   * Get subscription analytics
   */
  static async getSubscriptionAnalytics() {
    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_SUBSCRIPTION_ANALYTICS, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching subscription analytics:', error);
      throw error;
    }
  }

  /**
   * Get affiliate analytics
   */
  static async getAffiliateAnalytics(period = 'thisMonth') {
    try {
      const response = await fetch(`${API_ENDPOINTS.ADMIN_AFFILIATES}/analytics?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching affiliate analytics:', error);
      throw error;
    }
  }

  /**
   * Get recent activities
   */
  static async getRecentActivities(limit = 10) {
    try {
      const response = await fetch(`${API_ENDPOINTS.DASHBOARD_ACTIVITIES}?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  }

  /**
   * Get system health
   */
  static async getSystemHealth() {
    try {
      const response = await fetch(API_ENDPOINTS.SYSTEM_HEALTH, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw error;
    }
  }

  /**
   * Format analytics data for charts
   */
  static formatRevenueChartData(revenueData) {
    if (!revenueData || !revenueData.length) {
      return {
        labels: [],
        datasets: [{
          label: 'Revenue (₹)',
          data: [],
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
          borderRadius: 4,
        }]
      };
    }

    return {
      labels: revenueData.map(item => {
        if (item.date) {
          const date = new Date(item.date);
          return date.toLocaleDateString('en-US', { month: 'short' });
        }
        return `Month ${item._id}`;
      }),
      datasets: [{
        label: 'Revenue (₹)',
        data: revenueData.map(item => item.totalRevenue || 0),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
        borderRadius: 4,
      }]
    };
  }

  /**
   * Format user growth chart data
   */
  static formatUserGrowthChartData(userGrowthData) {
    if (!userGrowthData || !userGrowthData.length) {
      return {
        labels: [],
        datasets: [{
          label: 'Users',
          data: [],
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
        }]
      };
    }

    return {
      labels: userGrowthData.map(item => {
        if (item.date) {
          const date = new Date(item.date);
          return date.toLocaleDateString('en-US', { month: 'short' });
        }
        return `Month ${item._id}`;
      }),
      datasets: [{
        label: 'Users',
        data: userGrowthData.map(item => item.newUsers || 0),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
      }]
    };
  }

  /**
   * Format subscription plan chart data
   */
  static formatSubscriptionPlanChartData(planDistribution) {
    if (!planDistribution || !planDistribution.length) {
      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 2,
        }]
      };
    }

    const colors = [
      { bg: 'rgba(34, 197, 94, 0.8)', border: 'rgba(34, 197, 94, 1)' },
      { bg: 'rgba(59, 130, 246, 0.8)', border: 'rgba(59, 130, 246, 1)' },
      { bg: 'rgba(147, 51, 234, 0.8)', border: 'rgba(147, 51, 234, 1)' },
      { bg: 'rgba(245, 158, 11, 0.8)', border: 'rgba(245, 158, 11, 1)' }
    ];

    return {
      labels: planDistribution.map(plan => `${plan._id || 'Unknown'} Plan`),
      datasets: [{
        data: planDistribution.map(plan => plan.count || 0),
        backgroundColor: planDistribution.map((_, index) => colors[index % colors.length].bg),
        borderColor: planDistribution.map((_, index) => colors[index % colors.length].border),
        borderWidth: 2,
      }]
    };
  }

  /**
   * Calculate growth percentage
   */
  static calculateGrowthPercentage(current, previous) {
    if (!previous || previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  /**
   * Format currency
   */
  static formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  }

  /**
   * Format number with K/M suffixes
   */
  static formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}

export default AnalyticsService;

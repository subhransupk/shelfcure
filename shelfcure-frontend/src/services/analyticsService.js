import { API_ENDPOINTS } from '../config/api';

class AnalyticsService {
  // Base API URL
  static BASE_URL = 'http://localhost:5000/api';

  // Helper method to get auth headers
  static getAuthHeaders() {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Helper method to handle API responses
  static async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

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
        salesAnalytics,
        inventoryAnalytics,
        customerAnalytics
      ] = await Promise.all([
        this.getDashboardStats(),
        this.getRevenueAnalytics(period),
        this.getUserGrowthAnalytics(period),
        this.getSubscriptionAnalytics(),
        this.getAffiliateAnalytics(period),
        this.getSalesAnalytics(period),
        this.getInventoryAnalytics(),
        this.getCustomerAnalytics()
      ]);

      return {
        success: true,
        data: {
          dashboardStats: dashboardStats.data,
          revenueAnalytics: revenueAnalytics.data,
          userGrowth: userGrowth.data,
          subscriptionAnalytics: subscriptionAnalytics.data,
          affiliateAnalytics: affiliateAnalytics.data,
          salesAnalytics: salesAnalytics.data,
          inventoryAnalytics: inventoryAnalytics.data,
          customerAnalytics: customerAnalytics.data
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
      const response = await fetch(`${this.BASE_URL}/analytics/admin/dashboard-stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
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
      const response = await fetch(`${this.BASE_URL}/analytics/admin/revenue?period=${period}&year=${year}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
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
      const response = await fetch(`${this.BASE_URL}/analytics/admin/user-growth?period=${period}&year=${year}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching user growth analytics:', error);
      throw error;
    }
  }

  /**
   * Get sales analytics
   */
  static async getSalesAnalytics(period = 'monthly', year = new Date().getFullYear()) {
    try {
      const response = await fetch(`${this.BASE_URL}/analytics/admin/sales?period=${period}&year=${year}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching sales analytics:', error);
      throw error;
    }
  }

  /**
   * Get inventory analytics
   */
  static async getInventoryAnalytics() {
    try {
      const response = await fetch(`${this.BASE_URL}/analytics/admin/inventory`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching inventory analytics:', error);
      throw error;
    }
  }

  /**
   * Get customer analytics
   */
  static async getCustomerAnalytics() {
    try {
      const response = await fetch(`${this.BASE_URL}/analytics/admin/customers`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
      throw error;
    }
  }

  /**
   * Get subscription analytics
   */
  static async getSubscriptionAnalytics() {
    try {
      const response = await fetch(`${this.BASE_URL}/analytics/admin/subscription-analytics`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching subscription analytics:', error);
      throw error;
    }
  }

  /**
   * Get affiliate analytics
   */
  static async getAffiliateAnalytics(period = 'monthly', year = new Date().getFullYear()) {
    try {
      const response = await fetch(`${this.BASE_URL}/analytics/admin/affiliate-analytics?period=${period}&year=${year}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
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
  // ===================
  // ENHANCED DATA FORMATTING UTILITIES
  // ===================

  /**
   * Format sales chart data for Chart.js
   */
  static formatSalesChartData(salesData) {
    const labels = salesData.map(item => {
      if (item.date) {
        return new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return `Period ${item._id.period || item._id.month}`;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Sales Amount (₹)',
          data: salesData.map(item => item.totalSales || 0),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
          yAxisID: 'y'
        },
        {
          label: 'Orders',
          data: salesData.map(item => item.totalOrders || 0),
          backgroundColor: 'rgba(168, 85, 247, 0.8)',
          borderColor: 'rgba(168, 85, 247, 1)',
          borderWidth: 1,
          yAxisID: 'y1'
        }
      ]
    };
  }

  /**
   * Format inventory chart data for Chart.js
   */
  static formatInventoryChartData(inventoryData) {
    if (!inventoryData || !inventoryData.categoryDistribution) {
      return { labels: [], datasets: [{ data: [], backgroundColor: [] }] };
    }

    const colors = [
      'rgba(59, 130, 246, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(168, 85, 247, 0.8)',
      'rgba(6, 182, 212, 0.8)'
    ];

    return {
      labels: inventoryData.categoryDistribution.map(item => item._id || 'Unknown'),
      datasets: [{
        data: inventoryData.categoryDistribution.map(item => item.count || 0),
        backgroundColor: colors.slice(0, inventoryData.categoryDistribution.length),
        borderWidth: 1
      }]
    };
  }

  /**
   * Format customer segments data for Chart.js
   */
  static formatCustomerSegmentsData(customerData) {
    if (!customerData || !customerData.customerSegments) {
      return { labels: [], datasets: [{ data: [], backgroundColor: [] }] };
    }

    const colors = [
      'rgba(239, 68, 68, 0.8)',   // Low Value - Red
      'rgba(245, 158, 11, 0.8)',  // Regular - Orange
      'rgba(16, 185, 129, 0.8)',  // High Value - Green
      'rgba(168, 85, 247, 0.8)'   // Premium - Purple
    ];

    return {
      labels: customerData.customerSegments.map(item => item.segment),
      datasets: [{
        data: customerData.customerSegments.map(item => item.count || 0),
        backgroundColor: colors.slice(0, customerData.customerSegments.length),
        borderWidth: 1
      }]
    };
  }

  /**
   * Format percentage values
   */
  static formatPercentage(value) {
    return `${(value || 0).toFixed(1)}%`;
  }



  /**
   * Get chart options for revenue charts
   */
  static getRevenueChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Revenue: ${AnalyticsService.formatCurrency(context.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return AnalyticsService.formatCurrency(value);
            }
          }
        }
      }
    };
  }

  /**
   * Get chart options for sales charts with dual y-axis
   */
  static getSalesChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              if (context.datasetIndex === 0) {
                return `Sales: ${AnalyticsService.formatCurrency(context.parsed.y)}`;
              }
              return `Orders: ${context.parsed.y}`;
            }
          }
        }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return AnalyticsService.formatCurrency(value);
            }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          beginAtZero: true,
          grid: {
            drawOnChartArea: false,
          },
        }
      }
    };
  }

  /**
   * Get chart options for pie/doughnut charts
   */
  static getPieChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${context.parsed} (${percentage}%)`;
            }
          }
        }
      }
    };
  }
}

export default AnalyticsService;

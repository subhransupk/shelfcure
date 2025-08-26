// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  ADMIN_LOGIN: `${API_BASE_URL}/api/auth/admin-login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  
  // Admin dashboard endpoints
  DASHBOARD_STATS: `${API_BASE_URL}/api/admin/dashboard/stats`,
  DASHBOARD_ACTIVITIES: `${API_BASE_URL}/api/admin/dashboard/activities`,
  SYSTEM_HEALTH: `${API_BASE_URL}/api/admin/system/health`,

  // Admin settings endpoints
  ADMIN_SETTINGS: `${API_BASE_URL}/api/admin/settings`,
  
  // User management endpoints
  ADMIN_USERS: `${API_BASE_URL}/api/admin/users`,
  ADMIN_CREATE_USER_WITH_SUBSCRIPTION: `${API_BASE_URL}/api/auth/admin/users`,
  
  // Store management endpoints
  ADMIN_STORES: `${API_BASE_URL}/api/stores/admin/all`,
  
  // Medicine management endpoints
  ADMIN_MEDICINES: `${API_BASE_URL}/api/medicines/admin/master`,
  
  // Subscription management endpoints
  ADMIN_SUBSCRIPTION_PLANS: `${API_BASE_URL}/api/subscriptions/plans/admin`,
  ADMIN_SUBSCRIPTIONS: `${API_BASE_URL}/api/subscriptions/admin`,
  
  // Affiliate management endpoints
  ADMIN_AFFILIATES: `${API_BASE_URL}/api/affiliates/admin`,
  ADMIN_AFFILIATE_COMMISSIONS: `${API_BASE_URL}/api/affiliates/admin/commissions`,
  
  // Invoice management endpoints
  ADMIN_INVOICES: `${API_BASE_URL}/api/invoices/admin`,
  
  // Discount management endpoints
  ADMIN_DISCOUNTS: `${API_BASE_URL}/api/discounts/admin`,
  
  // Analytics endpoints
  ADMIN_REVENUE_ANALYTICS: `${API_BASE_URL}/api/analytics/admin/revenue`,
  ADMIN_USER_GROWTH: `${API_BASE_URL}/api/analytics/admin/user-growth`,
  ADMIN_SUBSCRIPTION_ANALYTICS: `${API_BASE_URL}/api/analytics/admin/subscriptions`
};

// Helper function to make authenticated API calls
export const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };
  
  try {
    const response = await fetch(url, mergedOptions);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid, redirect to login
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect based on current path
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin-login';
        } else {
          window.location.href = '/login';
        }
        throw new Error('Authentication failed');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export default API_BASE_URL;

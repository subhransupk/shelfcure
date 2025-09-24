import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? process.env.REACT_APP_API_URL || 'https://your-production-api.com'
    : '', // Empty string for development (uses proxy)
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Add auth token for affiliate requests
    if (config.url?.includes('/affiliate-panel/')) {
      const token = localStorage.getItem('affiliateToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Add auth token for regular user requests
    const userToken = localStorage.getItem('token');
    if (userToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      // Check if it's an affiliate route
      if (error.config?.url?.includes('/affiliate-panel/')) {
        localStorage.removeItem('affiliateToken');
        localStorage.removeItem('affiliateData');
        window.location.href = '/affiliate-login';
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

import { API_ENDPOINTS } from '../config/api';

// Login service for regular users (store owners, managers, staff)
export const loginUser = async (email, password, loginType = 'store') => {
  try {
    const response = await fetch(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        loginType // This can be used to differentiate login types if needed
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    if (data.success && data.token) {
      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return {
        success: true,
        user: data.user,
        token: data.token,
        message: data.message
      };
    } else {
      throw new Error(data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Admin login service
export const loginAdmin = async (email, password) => {
  try {
    const response = await fetch(API_ENDPOINTS.ADMIN_LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Admin login failed');
    }

    if (data.success && data.token) {
      // Store admin token and user data
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      
      return {
        success: true,
        user: data.user,
        token: data.token,
        message: data.message
      };
    } else {
      throw new Error(data.message || 'Admin login failed');
    }
  } catch (error) {
    console.error('Admin login error:', error);
    throw error;
  }
};

// Register service
export const registerUser = async (userData) => {
  try {
    const response = await fetch(API_ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return {
      success: true,
      user: data.user,
      message: data.message
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Logout service
export const logoutUser = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (token) {
      await fetch(API_ENDPOINTS.LOGOUT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Admin logout service
export const logoutAdmin = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    
    if (token) {
      await fetch(API_ENDPOINTS.LOGOUT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
    }
  } catch (error) {
    console.error('Admin logout error:', error);
  } finally {
    // Always clear local storage
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
};

// Check if admin is authenticated
export const isAdminAuthenticated = () => {
  const token = localStorage.getItem('adminToken');
  const user = localStorage.getItem('adminUser');
  return !!(token && user);
};

// Get current user
export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Get current admin user
export const getCurrentAdminUser = () => {
  try {
    const user = localStorage.getItem('adminUser');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error parsing admin user data:', error);
    return null;
  }
};

// Get user token
export const getUserToken = () => {
  return localStorage.getItem('token');
};

// Get admin token
export const getAdminToken = () => {
  return localStorage.getItem('adminToken');
};

// Redirect based on user role
export const redirectAfterLogin = (user) => {
  if (!user) return;

  switch (user.role) {
    case 'superadmin':
    case 'admin':
      window.location.href = '/admin/dashboard';
      break;
    case 'store_owner':
      window.location.href = '/store-owner/dashboard';
      break;
    case 'store_manager':
      window.location.href = '/store-panel/dashboard';
      break;
    case 'staff':
    case 'cashier':
      window.location.href = '/staff/dashboard';
      break;
    default:
      window.location.href = '/dashboard';
      break;
  }
};

export default {
  loginUser,
  loginAdmin,
  registerUser,
  logoutUser,
  logoutAdmin,
  isAuthenticated,
  isAdminAuthenticated,
  getCurrentUser,
  getCurrentAdminUser,
  getUserToken,
  getAdminToken,
  redirectAfterLogin
};

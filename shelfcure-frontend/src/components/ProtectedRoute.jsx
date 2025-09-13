import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from '../services/authService';

const ProtectedRoute = ({ children, requiredRole = null, redirectTo = '/login' }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      console.log('❌ User not authenticated, redirecting to login');
      navigate(redirectTo);
      return;
    }

    // Check role if required
    if (requiredRole) {
      const user = getCurrentUser();
      if (!user || user.role !== requiredRole) {
        console.log(`❌ User role ${user?.role} doesn't match required role ${requiredRole}`);
        navigate(redirectTo);
        return;
      }
    }

    console.log('✅ User authenticated and authorized');
  }, [navigate, requiredRole, redirectTo]);

  // Don't render children if not authenticated
  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Check role if required
  if (requiredRole) {
    const user = getCurrentUser();
    if (!user || user.role !== requiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
            <button 
              onClick={() => navigate('/login')}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;

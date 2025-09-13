import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const AdminLayout = ({ 
  title, 
  subtitle, 
  children, 
  rightHeaderContent 
}) => {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Check if user is logged in and is admin
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');
    
    if (!token || !user) {
      navigate('/admin-login');
      return;
    }

    try {
      const userData = JSON.parse(user);
      if (!['superadmin', 'admin'].includes(userData.role)) {
        navigate('/admin-login');
        return;
      }
      setAdminUser(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/admin-login');
    }
  }, [navigate]);

  // Restore persisted sidebar collapsed state
  useEffect(() => {
    try {
      const stored = localStorage.getItem('adminSidebarCollapsed');
      if (stored !== null) {
        setSidebarCollapsed(stored === 'true');
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Persist sidebar collapsed state
  useEffect(() => {
    try {
      localStorage.setItem('adminSidebarCollapsed', String(sidebarCollapsed));
    } catch (e) {
      // ignore
    }
  }, [sidebarCollapsed]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin-login');
  };

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        adminUser={adminUser}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader
          title={title}
          subtitle={subtitle}
          setSidebarOpen={setSidebarOpen}
          adminUser={adminUser}
          onLogout={handleLogout}
          rightContent={rightHeaderContent}
        />

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

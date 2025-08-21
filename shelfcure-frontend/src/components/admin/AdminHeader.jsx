import React from 'react';
import { Menu } from 'lucide-react';

const AdminHeader = ({ 
  title, 
  subtitle, 
  setSidebarOpen, 
  adminUser, 
  onLogout,
  rightContent 
}) => {
  return (
    <header className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 text-left">{title}</h1>
            {subtitle && (
              <p className="text-gray-600 text-left">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {rightContent}
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{adminUser?.name}</p>
              <p className="text-xs text-gray-600 capitalize">{adminUser?.role}</p>
            </div>
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {adminUser?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;

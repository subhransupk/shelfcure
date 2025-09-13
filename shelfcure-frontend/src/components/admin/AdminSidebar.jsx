import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart, Users, Store, CreditCard, FileText, DollarSign, UserCheck,
  Receipt, Percent, Pill, MessageCircle, UserPlus, Coins, Sliders,
  Activity, Settings, Shield, X, ChevronLeft, ChevronRight, LogOut
} from 'lucide-react';

const AdminSidebar = ({ sidebarOpen, setSidebarOpen, adminUser, onLogout, collapsed = false, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: BarChart, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Store, label: 'Stores', path: '/admin/stores' },
    { icon: CreditCard, label: 'Subscriptions', path: '/admin/subscriptions' },
    { icon: FileText, label: 'Subscription Plans', path: '/admin/subscription-plans' },
    { icon: DollarSign, label: 'Custom Pricing Configs', path: '/admin/custom-pricing' },
    { icon: UserCheck, label: 'Assign Custom Subscription', path: '/admin/assign-subscription' },
    { icon: Receipt, label: 'Invoices', path: '/admin/invoices' },
    { icon: Percent, label: 'Discounts', path: '/admin/discounts' },
    { icon: Pill, label: 'Master Medicines', path: '/admin/master-medicines' },
    { icon: MessageCircle, label: 'Live Chat', path: '/admin/live-chat' },
    { icon: UserPlus, label: 'Affiliates', path: '/admin/affiliates' },
    { icon: Coins, label: 'Affiliate Commissions', path: '/admin/affiliate-commissions' },
    { icon: Sliders, label: 'Affiliate Settings', path: '/admin/affiliate-settings' },
    { icon: Activity, label: 'Analytics', path: '/admin/analytics' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const handleMenuClick = (path) => {
    navigate(path);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex lg:flex-col w-64 ${collapsed ? 'lg:w-20' : 'lg:w-64'}`}>
      {/* Sidebar Header */}
      <div className={`flex items-center justify-between h-16 border-b ${collapsed ? 'px-3' : 'px-6'}`}>
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary-500" />
          {!collapsed && (
            <span className="text-xl font-bold text-gray-900">ShelfCure Admin</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Desktop collapse toggle */}
          {typeof setCollapsed === 'function' && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          )}
          {/* Mobile close */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
            title="Close sidebar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="mt-6 flex-1">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={index}
              onClick={() => handleMenuClick(item.path)}
              title={item.label}
              className={`group flex items-center ${collapsed ? 'justify-center px-3' : 'gap-3 px-6'} py-3 text-gray-700 hover:bg-gray-100 transition-colors duration-200 w-full text-left ${
                isActive ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-500' : ''
              }`}
            >
              <item.icon className="w-5 h-5" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className={`border-t ${collapsed ? 'p-2' : 'p-4'}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center mb-2' : 'gap-3 mb-3'}`}>
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center" title={adminUser?.name}>
            <span className="text-white text-sm font-medium">
              {adminUser?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 text-left">{adminUser?.name}</p>
              <p className="text-xs text-gray-600 text-left capitalize">{adminUser?.role}</p>
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          title="Logout"
          className={`w-full ${collapsed ? 'px-2 justify-center' : 'px-3'} py-2 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 ${collapsed ? 'text-center' : 'text-left'}`}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;

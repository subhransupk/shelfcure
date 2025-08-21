import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart, Users, Store, CreditCard, FileText, DollarSign, UserCheck,
  Receipt, Percent, Pill, MessageCircle, UserPlus, Coins, Sliders,
  Activity, Settings, Shield, X
} from 'lucide-react';

const AdminSidebar = ({ sidebarOpen, setSidebarOpen, adminUser, onLogout }) => {
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
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex lg:flex-col`}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between h-16 px-6 border-b">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary-500" />
          <span className="text-xl font-bold text-gray-900">ShelfCure Admin</span>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      {/* Navigation Menu */}
      <nav className="mt-6 flex-1">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={index}
              onClick={() => handleMenuClick(item.path)}
              className={`flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors duration-200 w-full text-left ${
                isActive ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-500' : ''
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {adminUser?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 text-left">{adminUser?.name}</p>
            <p className="text-xs text-gray-600 text-left capitalize">{adminUser?.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-left"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;

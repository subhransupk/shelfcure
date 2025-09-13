import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ReturnNotifications from '../returns/ReturnNotifications';
import {
  Store,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  DollarSign,
  Calendar,
  Bell,
  User,
  FileText,
  TrendingUp,
  Pill,
  Truck,
  Stethoscope,
  UserCheck,
  Grid,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { logoutUser, getCurrentUser } from '../../services/authService';

const StoreManagerLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expiryAlertsCount, setExpiryAlertsCount] = useState(0);
  const [showReturnNotifications, setShowReturnNotifications] = useState(false);
  const [returnNotificationCount, setReturnNotificationCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();

  const navigation = [
    { name: 'Dashboard', href: '/store-panel/dashboard', icon: BarChart3 },
    { name: 'Inventory', href: '/store-panel/inventory', icon: Package },
    { name: 'Rack Management', href: '/store-panel/rack-management', icon: Grid },
    { name: 'Sales & POS', href: '/store-panel/sales', icon: ShoppingCart },
    { name: 'Returns', href: '/store-panel/returns', icon: RotateCcw },
    { name: 'Customers', href: '/store-panel/customers', icon: Users },
    { name: 'Suppliers', href: '/store-panel/suppliers', icon: Truck },
    { name: 'Purchases', href: '/store-panel/purchases', icon: DollarSign },
    { name: 'Expiry Alerts', href: '/store-panel/expiry-alerts', icon: AlertTriangle, badge: expiryAlertsCount },
    { name: 'Doctors', href: '/store-panel/doctors', icon: Stethoscope },
    { name: 'Staff', href: '/store-panel/staff', icon: UserCheck },
    { name: 'Analytics', href: '/store-panel/analytics', icon: TrendingUp },
    { name: 'Notifications', href: '/store-panel/notifications', icon: Bell },
    { name: 'Settings', href: '/store-panel/settings', icon: Settings },
  ];

  useEffect(() => {
    fetchExpiryAlertsCount();
    fetchReturnNotificationCount();
    // Refresh count every 5 minutes
    const interval = setInterval(() => {
      fetchExpiryAlertsCount();
      fetchReturnNotificationCount();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Restore/persist collapsed state
  useEffect(() => {
    try {
      const stored = localStorage.getItem('storeSidebarCollapsed');
      if (stored !== null) setSidebarCollapsed(stored === 'true');
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('storeSidebarCollapsed', String(sidebarCollapsed));
    } catch (e) {}
  }, [sidebarCollapsed]);

  const fetchExpiryAlertsCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/store-manager/expiry-alerts/summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Count expired + critical items for the badge
        const urgentCount = (data.data?.summary?.expired?.count || 0) + (data.data?.summary?.critical?.count || 0);
        setExpiryAlertsCount(urgentCount);
      }
    } catch (error) {
      console.error('Failed to fetch expiry alerts count:', error);
    }
  };

  const fetchReturnNotificationCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/store-manager/returns?status=pending&limit=1', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReturnNotificationCount(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch return notification count:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className={`store-layout ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ease-linear duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setSidebarOpen(false)} />
        
        <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transform transition ease-in-out duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <Store className="h-8 w-8 text-green-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Store Panel</span>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center justify-between px-2 py-2 text-base font-medium rounded-md ${
                      isActive
                        ? 'bg-green-100 text-green-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div className="flex items-center">
                      <item.icon className={`mr-4 h-6 w-6 ${isActive ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                      {item.name}
                    </div>
                    {item.badge > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">Store Manager</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden md:flex ${sidebarCollapsed ? 'md:w-20' : 'md:w-64'} md:flex-col md:fixed md:inset-y-0`}>
        <div className="store-sidebar">
          <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className={`flex items-center justify-between flex-shrink-0 ${sidebarCollapsed ? 'px-2' : 'px-4'}`}>
                <div className="flex items-center">
                  <Store className="h-8 w-8 text-green-600" />
                  {!sidebarCollapsed && (
                    <span className="ml-2 text-xl font-bold text-gray-900">Store Panel</span>
                  )}
                </div>
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden md:inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
              </div>
              <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      title={item.name}
                      className={`group flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-2 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-green-100 text-green-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center">
                        <item.icon className={`h-5 w-5 ${sidebarCollapsed ? '' : 'mr-3'} ${isActive ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                        {!sidebarCollapsed && <span>{item.name}</span>}
                      </div>
                      {!sidebarCollapsed && item.badge > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className={`flex items-center w-full ${sidebarCollapsed ? 'justify-center' : ''}`}>
                <div className="flex-shrink-0" title={user?.name || 'User'}>
                  <User className="h-8 w-8 text-gray-400" />
                </div>
                {!sidebarCollapsed && (
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                    <p className="text-xs text-gray-500">Store Manager</p>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowReturnNotifications(true)}
                    className="relative p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    title="Return Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {returnNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {returnNotificationCount > 9 ? '9+' : returnNotificationCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="store-main-content">
        {/* Mobile header */}
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Content area */}
        <div className="store-content-area">
          {children}
        </div>
      </div>

      {/* Return Notifications Modal */}
      {showReturnNotifications && (
        <ReturnNotifications onClose={() => setShowReturnNotifications(false)} />
      )}
    </div>
  );
};

export default StoreManagerLayout;

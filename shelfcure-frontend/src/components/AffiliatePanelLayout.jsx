import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  DollarSign,
  CreditCard,
  User,
  Share2,
  BarChart3,
  Building2,
  RefreshCw,
  Bell,
  HelpCircle,
  BookOpen,
  Menu,
  X,
  LogOut,
  ChevronDown
} from 'lucide-react';

const AffiliatePanelLayout = ({ children, title, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [affiliateData, setAffiliateData] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem('affiliateData');
    if (data) {
      setAffiliateData(JSON.parse(data));
    }
  }, []);

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/affiliate-panel/dashboard',
      icon: Home,
      description: 'Overview & metrics'
    },
    {
      name: 'Referral Management',
      href: '/affiliate-panel/referral-management',
      icon: Users,
      description: 'Manage affiliate referrals'
    },
    {
      name: 'Commission History',
      href: '/affiliate-panel/commissions',
      icon: DollarSign,
      description: 'Earnings & payouts'
    },
    {
      name: 'Payment Settings',
      href: '/affiliate-panel/payment-settings',
      icon: CreditCard,
      description: 'Bank & UPI details'
    },
    {
      name: 'Edit Profile',
      href: '/affiliate-panel/profile',
      icon: User,
      description: 'Personal information'
    },
    {
      name: 'Marketing Resources',
      href: '/affiliate-panel/marketing-resources',
      icon: Share2,
      description: 'Banners & materials'
    },
    {
      name: 'Affiliate Links & QR',
      href: '/affiliate-panel/links-qr',
      icon: Share2,
      description: 'Referral links & codes'
    },
    {
      name: 'Sales & Analytics',
      href: '/affiliate-panel/analytics',
      icon: BarChart3,
      description: 'Performance metrics'
    },
    {
      name: 'Pharmacy Onboarding',
      href: '/affiliate-panel/pharmacy-onboarding',
      icon: Building2,
      description: 'Submit new pharmacies'
    },
    {
      name: 'Renewal Management',
      href: '/affiliate-panel/renewals',
      icon: RefreshCw,
      description: 'Track renewals'
    },
    {
      name: 'Notifications',
      href: '/affiliate-panel/notifications',
      icon: Bell,
      description: 'Alert preferences'
    },
    {
      name: 'Support',
      href: '/affiliate-panel/support',
      icon: HelpCircle,
      description: 'Help & contact'
    },
    {
      name: 'Training',
      href: '/affiliate-panel/training',
      icon: BookOpen,
      description: 'Learn & grow'
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('affiliateToken');
    localStorage.removeItem('affiliateData');
    navigate('/affiliate-login');
  };

  const isActive = (href) => location.pathname === href;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop layout */}
      <div className="hidden lg:flex lg:h-screen">
        {/* Desktop Sidebar */}
        <div className="w-64 bg-white shadow-lg flex flex-col">
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SC</span>
              </div>
              <span className="ml-2 text-lg font-semibold text-gray-900">ShelfCure</span>
            </div>
          </div>

          <nav className="mt-6 px-3 flex-1 overflow-y-auto">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.href)}
                    className={`w-full text-left group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(item.href)
                        ? 'bg-green-100 text-green-700 border-r-2 border-green-600'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${
                      isActive(item.href) ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Desktop Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
              </div>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {affiliateData?.name?.charAt(0)?.toUpperCase() || 'A'}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {affiliateData?.name || 'Affiliate'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {affiliateData?.affiliateCode || 'Loading...'}
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <button
                      onClick={() => {
                        navigate('/affiliate-panel/profile');
                        setProfileDropdownOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="w-4 h-4 mr-3" />
                      Edit Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate('/affiliate-panel/payment-settings');
                        setProfileDropdownOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <CreditCard className="w-4 h-4 mr-3" />
                      Payment Settings
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <div className="py-6 px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden">
        {/* Mobile Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SC</span>
              </div>
              <span className="ml-2 text-lg font-semibold text-gray-900">ShelfCure</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-500 touch-manipulation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-6 px-3">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      navigate(item.href);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(item.href)
                        ? 'bg-green-100 text-green-700 border-r-2 border-green-600'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${
                      isActive(item.href) ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Mobile Main content */}
        <div className="min-h-screen">
          {/* Mobile Top header */}
          <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-3 sm:px-6">
              <div className="flex items-center min-w-0 flex-1">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 touch-manipulation"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <div className="ml-3 min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{title}</h1>
                  {subtitle && <p className="text-xs sm:text-sm text-gray-500 truncate">{subtitle}</p>}
                </div>
              </div>

              {/* Mobile Profile dropdown */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 touch-manipulation p-1"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {affiliateData?.name?.charAt(0)?.toUpperCase() || 'A'}
                      </span>
                    </div>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </div>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <button
                      onClick={() => {
                        navigate('/affiliate-panel/profile');
                        setProfileDropdownOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 touch-manipulation"
                    >
                      <User className="w-5 h-5 mr-3" />
                      Edit Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate('/affiliate-panel/payment-settings');
                        setProfileDropdownOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 touch-manipulation"
                    >
                      <CreditCard className="w-5 h-5 mr-3" />
                      Payment Settings
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-700 hover:bg-red-50 touch-manipulation"
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Page content */}
          <main className="flex-1">
            <div className="py-4 px-3 sm:py-6 sm:px-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AffiliatePanelLayout;

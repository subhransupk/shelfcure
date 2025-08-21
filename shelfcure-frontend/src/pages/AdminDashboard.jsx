import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import { API_ENDPOINTS, makeAuthenticatedRequest } from '../config/api';
import {
  Users,
  Store,
  TrendingUp,
  UserPlus,
  CreditCard,
  Activity,
  Pill,
  Receipt,
  Percent,
  MessageCircle,
  Coins,
  Settings,
  Database,
  Shield,
  AlertCircle,
  Loader
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [recentActivities, setRecentActivities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchRecentActivities();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await makeAuthenticatedRequest(API_ENDPOINTS.DASHBOARD_STATS);
      setDashboardData(data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const data = await makeAuthenticatedRequest(API_ENDPOINTS.DASHBOARD_ACTIVITIES);
      setRecentActivities(data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num?.toString() || '0';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard" subtitle="Welcome to ShelfCure Admin Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">Loading dashboard...</span>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Dashboard" subtitle="Welcome to ShelfCure Admin Dashboard">
        <div className="flex items-center justify-center h-64">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <span className="ml-2 text-red-600">Error loading dashboard: {error}</span>
        </div>
      </AdminLayout>
    );
  }

  const stats = [
    {
      title: 'Total Users',
      value: formatNumber(dashboardData?.totalUsers),
      change: dashboardData?.userGrowth ? `${dashboardData.userGrowth > 0 ? '+' : ''}${dashboardData.userGrowth}%` : '0%',
      icon: Users,
      color: 'bg-blue-500',
      description: 'Registered users across all stores'
    },
    {
      title: 'Active Stores',
      value: formatNumber(dashboardData?.activeStores),
      change: dashboardData?.storeGrowth ? `${dashboardData.storeGrowth > 0 ? '+' : ''}${dashboardData.storeGrowth}%` : '0%',
      icon: Store,
      color: 'bg-green-500',
      description: 'Stores with active subscriptions'
    },
    {
      title: 'Active Affiliates',
      value: formatNumber(dashboardData?.activeAffiliates),
      change: dashboardData?.affiliateGrowth ? `${dashboardData.affiliateGrowth > 0 ? '+' : ''}${dashboardData.affiliateGrowth}%` : '0%',
      icon: UserPlus,
      color: 'bg-purple-500',
      description: 'Currently active affiliate partners'
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(dashboardData?.monthlyRevenue),
      change: dashboardData?.revenueGrowth ? `${dashboardData.revenueGrowth > 0 ? '+' : ''}${dashboardData.revenueGrowth}%` : '0%',
      icon: TrendingUp,
      color: 'bg-orange-500',
      description: 'Total subscription + affiliate revenue'
    }
  ];

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Here's what's happening with your ShelfCure platform today."
    >
      {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-start flex-col">
                  <div className="flex items-start justify-start gap-3 mb-3">
                    <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-start justify-start pl-3 pt-3`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-600 text-left">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 text-left">{stat.value}</p>
                    <p className="text-sm text-green-600 text-left">{stat.change} from last month</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left">
                <Users className="w-8 h-8 text-blue-500 mb-2" />
                <h4 className="font-medium text-gray-900 text-left">Manage Users</h4>
                <p className="text-sm text-gray-600 text-left">View and manage all user accounts</p>
              </button>

              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left">
                <Store className="w-8 h-8 text-green-500 mb-2" />
                <h4 className="font-medium text-gray-900 text-left">Manage Stores</h4>
                <p className="text-sm text-gray-600 text-left">Configure stores and settings</p>
              </button>

              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left">
                <CreditCard className="w-8 h-8 text-purple-500 mb-2" />
                <h4 className="font-medium text-gray-900 text-left">Subscriptions</h4>
                <p className="text-sm text-gray-600 text-left">Manage subscription plans and billing</p>
              </button>

              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left">
                <Activity className="w-8 h-8 text-orange-500 mb-2" />
                <h4 className="font-medium text-gray-900 text-left">Analytics</h4>
                <p className="text-sm text-gray-600 text-left">View detailed system analytics</p>
              </button>

              <button
                onClick={() => navigate('/admin/master-medicines')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left"
              >
                <Pill className="w-8 h-8 text-indigo-500 mb-2" />
                <h4 className="font-medium text-gray-900 text-left">Master Medicines</h4>
                <p className="text-sm text-gray-600 text-left">Manage medicine database</p>
              </button>

              <button
                onClick={() => navigate('/admin/invoices')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left"
              >
                <Receipt className="w-8 h-8 text-teal-500 mb-2" />
                <h4 className="font-medium text-gray-900 text-left">Invoices</h4>
                <p className="text-sm text-gray-600 text-left">View and manage invoices</p>
              </button>

              <button
                onClick={() => navigate('/admin/discounts')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left"
              >
                <Percent className="w-8 h-8 text-pink-500 mb-2" />
                <h4 className="font-medium text-gray-900 text-left">Discounts</h4>
                <p className="text-sm text-gray-600 text-left">Configure discount policies</p>
              </button>

              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left">
                <MessageCircle className="w-8 h-8 text-blue-500 mb-2" />
                <h4 className="font-medium text-gray-900 text-left">Live Chat</h4>
                <p className="text-sm text-gray-600 text-left">Manage customer support chat</p>
              </button>

              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left">
                <UserPlus className="w-8 h-8 text-green-500 mb-2" />
                <h4 className="font-medium text-gray-900 text-left">Affiliates</h4>
                <p className="text-sm text-gray-600 text-left">Manage affiliate partners</p>
              </button>

              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left">
                <Coins className="w-8 h-8 text-yellow-500 mb-2" />
                <h4 className="font-medium text-gray-900 text-left">Commissions</h4>
                <p className="text-sm text-gray-600 text-left">Track affiliate payouts</p>
              </button>

              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left">
                <Settings className="w-8 h-8 text-gray-500 mb-2" />
                <h4 className="font-medium text-gray-900 text-left">System Settings</h4>
                <p className="text-sm text-gray-600 text-left">Configure global settings</p>
              </button>
            </div>
          </div>

          {/* Recent Activities & System Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">Recent Activities</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-start justify-start pl-2 pt-2">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">New store registered</p>
                    <p className="text-xs text-gray-600">MediCare Pharmacy - 2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-start justify-start pl-2 pt-2">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Subscription upgraded</p>
                    <p className="text-xs text-gray-600">HealthPlus Store - Premium Plan - 4 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-start justify-start pl-2 pt-2">
                    <Receipt className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Payment received</p>
                    <p className="text-xs text-gray-600">₹15,000 - Invoice #INV-2024-001 - 6 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-start justify-start pl-2 pt-2">
                    <UserPlus className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">New affiliate registered</p>
                    <p className="text-xs text-gray-600">MediPartner Solutions - 6 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-start justify-start pl-2 pt-2">
                    <Coins className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Commission payout</p>
                    <p className="text-xs text-gray-600">₹8,500 paid to 12 affiliates - 8 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-start justify-start pl-2 pt-2">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Live chat session</p>
                    <p className="text-xs text-gray-600">45 customer queries resolved - 10 hours ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* System Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">System Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-900">Database Status</span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">Healthy</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-900">Server Performance</span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">Optimal</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium text-gray-900">Security Status</span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">Secure</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-medium text-gray-900">API Response Time</span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">125ms</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-indigo-500" />
                    <span className="text-sm font-medium text-gray-900">Active Sessions</span>
                  </div>
                  <span className="text-sm text-blue-600 font-medium">342</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-900">Live Chat Queue</span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">3 pending</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-900">Pending Commissions</span>
                  </div>
                  <span className="text-sm text-orange-600 font-medium">₹24,500</span>
                </div>
              </div>
            </div>
          </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

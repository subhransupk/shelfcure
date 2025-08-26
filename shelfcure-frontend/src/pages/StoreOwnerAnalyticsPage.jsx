import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Store, 
  DollarSign,
  Calendar,
  Activity,
  Target,
  Award,
  Clock,
  RefreshCw,
  Download,
  Filter,
  Eye
} from 'lucide-react';
import StoreOwnerLayout from '../components/store-owner/StoreOwnerLayout';

const StoreOwnerAnalyticsPage = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/store-owner/analytics?period=${selectedPeriod}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      red: 'bg-red-100 text-red-600'
    };

    return (
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`h-10 w-10 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
            <div className="ml-4 flex-1 text-left">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
            {trend && (
              <div className="flex-shrink-0">
                <div className={`flex items-center ${
                  trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  ) : (
                    <Activity className="h-4 w-4 mr-1" />
                  )}
                  <span className="text-sm font-medium">{trendValue}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <StoreOwnerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </StoreOwnerLayout>
    );
  }

  return (
    <StoreOwnerLayout>
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
              <p className="mt-2 text-sm text-gray-700">
                Comprehensive insights into your store performance and operations.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex items-center space-x-3">
              {/* Period Filter */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
              
              {/* Refresh Button */}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              {/* Export Button */}
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Key Metrics Cards */}
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Stores"
              value={analytics?.summary?.totalStores || 0}
              subtitle="Active locations"
              icon={Store}
              trend="neutral"
              trendValue="All active"
              color="blue"
            />
            <MetricCard
              title="Total Staff"
              value={analytics?.summary?.totalStaff || 0}
              subtitle="Across all stores"
              icon={Users}
              trend="neutral"
              trendValue="Active employees"
              color="green"
            />
            <MetricCard
              title="Attendance Rate"
              value={`${analytics?.summary?.averageAttendanceRate || 0}%`}
              subtitle="Average across stores"
              icon={Target}
              trend={analytics?.summary?.averageAttendanceRate > 80 ? 'up' : 'down'}
              trendValue={`${analytics?.summary?.averageAttendanceRate > 80 ? 'Good' : 'Needs improvement'}`}
              color="purple"
            />
            <MetricCard
              title="Monthly Expenses"
              value={formatCurrency(analytics?.summary?.totalSalaryExpense || 0)}
              subtitle="Staff salaries"
              icon={DollarSign}
              trend="neutral"
              trendValue="Current month"
              color="orange"
            />
          </div>

          {/* Analytics Message */}
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="text-left">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mr-4">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Detailed Analytics Coming Soon</h3>
                    <p className="text-sm text-gray-600">Advanced reporting and insights</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-6">
                  We're working on comprehensive analytics including revenue tracking, performance metrics,
                  inventory insights, and detailed reporting features.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Performance Metrics</h4>
                  </div>
                  <p className="text-sm text-gray-600">Store-wise performance analysis and KPI tracking</p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center mr-3">
                      <Award className="h-5 w-5 text-purple-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Revenue Tracking</h4>
                  </div>
                  <p className="text-sm text-gray-600">Detailed financial insights and revenue analysis</p>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center mr-3">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Real-time Reports</h4>
                  </div>
                  <p className="text-sm text-gray-600">Live data updates and instant notifications</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <button
                onClick={() => navigate('/store-owner/stores')}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-colors text-left group"
              >
                <div className="flex items-center mb-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                    <Store className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">View Stores</h3>
                </div>
                <p className="text-sm text-gray-600">Manage your store locations and settings</p>
              </button>
              <button
                onClick={() => navigate('/store-owner/staff')}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 hover:border-green-300 transition-colors text-left group"
              >
                <div className="flex items-center mb-3">
                  <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">Manage Staff</h3>
                </div>
                <p className="text-sm text-gray-600">View and manage employees across stores</p>
              </button>
              <button
                onClick={() => navigate('/store-owner/dashboard')}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 hover:border-purple-300 transition-colors text-left group"
              >
                <div className="flex items-center mb-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center mr-3 group-hover:bg-purple-200 transition-colors">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">Dashboard</h3>
                </div>
                <p className="text-sm text-gray-600">Overview of operations and metrics</p>
              </button>
              <button
                onClick={() => navigate('/store-owner/settings')}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 hover:border-orange-300 transition-colors text-left group"
              >
                <div className="flex items-center mb-3">
                  <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center mr-3 group-hover:bg-orange-200 transition-colors">
                    <Target className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">Settings</h3>
                </div>
                <p className="text-sm text-gray-600">Configure preferences and account</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </StoreOwnerLayout>
  );
};

export default StoreOwnerAnalyticsPage;

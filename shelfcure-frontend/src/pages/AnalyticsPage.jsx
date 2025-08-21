import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import AnalyticsService from '../services/analyticsService';
import {
  DollarSign, TrendingUp, Store, Users, BarChart3, PieChart,
  MapPin, Award, Target, ArrowUpRight, ArrowDownRight,
  Activity, Clock, CheckCircle, XCircle, Pause,
  Download, RefreshCw, Star, AlertCircle
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AnalyticsPage = () => {
  const [dateFilter, setDateFilter] = useState('thisMonth');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  // Load analytics data on component mount and when filter changes
  useEffect(() => {
    loadAnalyticsData();
  }, [dateFilter]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await AnalyticsService.getDashboardAnalytics(dateFilter);

      if (response.success) {
        setAnalytics(response.data);
      } else {
        setError('Failed to load analytics data');
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return AnalyticsService.formatCurrency(amount);
  };

  const formatNumber = (num) => {
    return AnalyticsService.formatNumber(num);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const getColorClasses = (color) => {
    switch (color) {
      case 'green':
        return {
          text: 'text-green-600',
          bg: 'bg-green-100',
          icon: 'text-green-600'
        };
      case 'blue':
        return {
          text: 'text-blue-600',
          bg: 'bg-blue-100',
          icon: 'text-blue-600'
        };
      case 'purple':
        return {
          text: 'text-purple-600',
          bg: 'bg-purple-100',
          icon: 'text-purple-600'
        };
      case 'orange':
        return {
          text: 'text-orange-600',
          bg: 'bg-orange-100',
          icon: 'text-orange-600'
        };
      default:
        return {
          text: 'text-blue-600',
          bg: 'bg-blue-100',
          icon: 'text-blue-600'
        };
    }
  };

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'blue' }) => {
    const colorClasses = getColorClasses(color);

    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold ${colorClasses.text}`}>{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`${colorClasses.bg} p-3 rounded-full`}>
            <Icon className={`w-6 h-6 ${colorClasses.icon}`} />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-sm">
            {trend === 'up' ? (
              <ArrowUpRight className="w-4 h-4 mr-1 text-green-500" />
            ) : trend === 'down' ? (
              <ArrowDownRight className="w-4 h-4 mr-1 text-red-500" />
            ) : (
              <Activity className="w-4 h-4 mr-1 text-gray-500" />
            )}
            <span className={trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}>
              {trendValue}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <AdminLayout title="Analytics Dashboard" subtitle="Business performance metrics and insights">
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-lg">Loading analytics data...</span>
        </div>
      </AdminLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <AdminLayout title="Analytics Dashboard" subtitle="Business performance metrics and insights">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">Error Loading Analytics</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
          <button
            onClick={loadAnalyticsData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </AdminLayout>
    );
  }

  // Show message if no data
  if (!analytics) {
    return (
      <AdminLayout title="Analytics Dashboard" subtitle="Business performance metrics and insights">
        <div className="text-center py-12">
          <p className="text-gray-500">No analytics data available.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Analytics Dashboard"
      subtitle="Business performance metrics and insights"
      rightHeaderContent={
        <div className="flex items-center gap-3">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={loading || refreshing}
          >
            <option value="today">Today</option>
            <option value="thisWeek">This Week</option>
            <option value="thisMonth">This Month</option>
            <option value="thisQuarter">This Quarter</option>
            <option value="thisYear">This Year</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(analytics.revenueAnalytics?.summary?.currentYearTotal || 0)}
            subtitle={`Growth: ${analytics.revenueAnalytics?.summary?.growthPercentage || 0}%`}
            icon={DollarSign}
            trend={analytics.revenueAnalytics?.summary?.growthPercentage > 0 ? "up" : analytics.revenueAnalytics?.summary?.growthPercentage < 0 ? "down" : "neutral"}
            trendValue={`${analytics.revenueAnalytics?.summary?.growthPercentage || 0}% vs last year`}
            color="green"
          />

          <MetricCard
            title="Active Stores"
            value={analytics.dashboardStats?.activeStores || 0}
            subtitle={`Total: ${analytics.dashboardStats?.totalStores || 0}`}
            icon={Store}
            trend={analytics.dashboardStats?.storeGrowth > 0 ? "up" : analytics.dashboardStats?.storeGrowth < 0 ? "down" : "neutral"}
            trendValue={`${analytics.dashboardStats?.storeGrowth || 0}% this month`}
            color="blue"
          />

          <MetricCard
            title="Total Users"
            value={analytics.dashboardStats?.totalUsers || 0}
            subtitle={`New this month: ${analytics.dashboardStats?.newUsersThisMonth || 0}`}
            icon={Users}
            trend={analytics.dashboardStats?.userGrowth > 0 ? "up" : analytics.dashboardStats?.userGrowth < 0 ? "down" : "neutral"}
            trendValue={`${analytics.dashboardStats?.userGrowth || 0}% growth`}
            color="purple"
          />

          <MetricCard
            title="Active Affiliates"
            value={analytics.dashboardStats?.activeAffiliates || 0}
            subtitle={`Total: ${analytics.dashboardStats?.totalAffiliates || 0}`}
            icon={Award}
            trend={analytics.dashboardStats?.affiliateGrowth > 0 ? "up" : analytics.dashboardStats?.affiliateGrowth < 0 ? "down" : "neutral"}
            trendValue={`${analytics.dashboardStats?.affiliateGrowth || 0}% this month`}
            color="orange"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue Trend */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 text-left">Monthly Revenue Trend</h3>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-64">
              <Bar
                data={AnalyticsService.formatRevenueChartData(analytics.revenueAnalytics?.revenueData || [])}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `Revenue: ₹${context.parsed.y.toLocaleString()}`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return '₹' + (value / 1000) + 'K';
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* User Growth */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 text-left">User Growth</h3>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-64">
              <Line
                data={AnalyticsService.formatUserGrowthChartData(analytics.userGrowth?.userGrowthData || [])}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `Users: ${context.parsed.y}`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 5
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Store Network Growth & Subscription Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Store Network Growth */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 text-left">Store Network Growth</h3>
              <Store className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-64">
              <Line
                data={AnalyticsService.formatUserGrowthChartData(analytics.userGrowth?.userGrowthData || [])}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `Users: ${context.parsed.y}`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 5
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Subscription Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 text-left">Subscription Status</h3>
              <PieChart className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {analytics.subscriptionAnalytics?.statusDistribution?.map((status, index) => {
                const statusConfig = {
                  'active': { icon: CheckCircle, color: 'green', label: 'Active' },
                  'trial': { icon: Clock, color: 'blue', label: 'Trial' },
                  'expired': { icon: XCircle, color: 'red', label: 'Expired' },
                  'suspended': { icon: Pause, color: 'yellow', label: 'Suspended' },
                  'cancelled': { icon: XCircle, color: 'gray', label: 'Cancelled' }
                };

                const config = statusConfig[status._id] || statusConfig['active'];
                const IconComponent = config.icon;

                return (
                  <div key={status._id} className={`flex items-center justify-between p-3 bg-${config.color}-50 rounded-lg`}>
                    <div className="flex items-center gap-3">
                      <IconComponent className={`w-5 h-5 text-${config.color}-600`} />
                      <span className="text-sm font-medium text-gray-900">{config.label}</span>
                    </div>
                    <span className={`text-lg font-bold text-${config.color}-600`}>{status.count || 0}</span>
                  </div>
                );
              }) || (
                <div className="text-center py-4 text-gray-500">
                  No subscription data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Plan Popularity & Top Performing Stores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plan Popularity */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 text-left">Plan Popularity</h3>
              <Award className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {analytics.subscriptionAnalytics?.planDistribution?.map((plan, index) => {
                const totalPlans = analytics.subscriptionAnalytics.planDistribution.reduce((sum, p) => sum + (p.count || 0), 0);
                const percentage = totalPlans > 0 ? Math.round((plan.count / totalPlans) * 100) : 0;

                return (
                  <div key={plan._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-purple-500' :
                        index === 2 ? 'bg-orange-500' :
                        'bg-gray-500'
                      }`}></div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">{plan._id || 'Unknown'} Plan</div>
                        <div className="text-xs text-gray-500">{plan.count || 0} subscriptions</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">{percentage}%</div>
                      <div className="text-xs text-gray-500">{plan.activeCount || 0} active</div>
                    </div>
                  </div>
                );
              }) || (
                <div className="text-center py-4 text-gray-500">
                  No plan data available
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-left">Most popular subscription plans</p>
          </div>

          {/* Top Performing Stores */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 text-left">Top Performing Stores</h3>
              <Star className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {analytics.recentActivities?.recentStores?.slice(0, 3).map((store, index) => (
                <div key={store._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">{store.name}</div>
                      <div className="text-xs text-gray-600">{store.owner?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{store.subscription?.plan || 'N/A'} Plan</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-blue-600">{store.subscription?.status || 'N/A'}</div>
                        <div className="text-xs text-gray-500">status</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-purple-600">{store.code}</div>
                        <div className="text-xs text-gray-500">code</div>
                      </div>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-4 text-gray-500">
                  No store data available
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-left">Stores with highest sales activity</p>
          </div>
        </div>

        {/* Geographic Distribution & Revenue by Plan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Geographic Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 text-left">Geographic Distribution</h3>
              <MapPin className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {analytics.recentActivities?.recentStores?.slice(0, 5).map((store, index) => (
                <div key={store._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">{store.name}</div>
                      <div className="text-xs text-gray-500">{store.code}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">{store.subscription?.plan || 'N/A'}</div>
                    <div className="text-xs text-gray-500">plan</div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-4 text-gray-500">
                  No geographic data available
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-left">Store locations across regions</p>
          </div>

          {/* Revenue by Subscription Plan */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 text-left">Revenue by Subscription Plan</h3>
              <PieChart className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-64">
              <Doughnut
                data={AnalyticsService.formatSubscriptionPlanChartData(analytics.subscriptionAnalytics?.planDistribution || [])}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 20,
                        usePointStyle: true,
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const plan = analytics.planPopularity[context.dataIndex];
                          return `${context.label}: ₹${context.parsed.toLocaleString()} (${plan.percentage}%)`;
                        }
                      }
                    }
                  },
                  cutout: '60%'
                }}
              />
            </div>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 text-left">Key Performance Indicators</h3>
            <Target className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 mb-6 text-left">Important business metrics</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{formatCurrency(analytics.dashboardStats?.monthlyRevenue || 0)}</div>
              <div className="text-sm font-medium text-gray-900 mt-2">Monthly Revenue</div>
              <div className="text-xs text-gray-600">Current month revenue</div>
            </div>

            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{analytics.dashboardStats?.revenueGrowth || 0}%</div>
              <div className="text-sm font-medium text-gray-900 mt-2">Revenue Growth</div>
              <div className="text-xs text-gray-600">Month over month growth</div>
            </div>

            <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{analytics.dashboardStats?.newStoresThisMonth || 0}</div>
              <div className="text-sm font-medium text-gray-900 mt-2">New Stores</div>
              <div className="text-xs text-gray-600">New stores this month</div>
            </div>

            <div className="text-center p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">{analytics.dashboardStats?.newAffiliatesThisMonth || 0}</div>
              <div className="text-sm font-medium text-gray-900 mt-2">New Affiliates</div>
              <div className="text-xs text-gray-600">New affiliates this month</div>
            </div>
          </div>
        </div>

        {/* Additional Insights */}
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-primary-900 text-left">Business Insights</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/50 rounded-lg p-4">
              <div className="text-sm font-medium text-primary-900 text-left">Platform Status</div>
              <div className="text-lg font-bold text-green-600">
                {analytics.dashboardStats?.storeGrowth > 0 ? 'Growing' :
                 analytics.dashboardStats?.storeGrowth < 0 ? 'Declining' : 'Stable'}
              </div>
              <div className="text-xs text-primary-700">
                {analytics.dashboardStats?.newStoresThisMonth || 0} new stores this month
              </div>
            </div>

            <div className="bg-white/50 rounded-lg p-4">
              <div className="text-sm font-medium text-primary-900 text-left">Total Revenue</div>
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(analytics.revenueAnalytics?.summary?.currentYearTotal || 0)}
              </div>
              <div className="text-xs text-primary-700">Current year total</div>
            </div>

            <div className="bg-white/50 rounded-lg p-4">
              <div className="text-sm font-medium text-primary-900 text-left">Growth Rate</div>
              <div className="text-lg font-bold text-purple-600">
                {analytics.revenueAnalytics?.summary?.growthPercentage || 0}%
              </div>
              <div className="text-xs text-primary-700">Year over year growth</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AnalyticsPage;

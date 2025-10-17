import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import AnalyticsService from '../services/analyticsService';
import { MetricCard, ChartContainer, DataTable, FilterBar } from '../components/analytics';
import {
  DollarSign, TrendingUp, Store, Users, BarChart3, PieChart,
  ShoppingCart, Package, UserCheck, AlertTriangle,
  Activity, Clock, CheckCircle, XCircle, Pause,
  Download, RefreshCw, Star, AlertCircle, Eye,
  TrendingDown, Calendar, Filter, ArrowUpRight, ArrowDownRight
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
  const [activeTab, setActiveTab] = useState('overview');

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

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  // Handle export
  const handleExport = () => {
    // Implementation for exporting analytics data
    console.log('Exporting analytics data...');
  };

  // Format currency
  const formatCurrency = (amount) => {
    return AnalyticsService.formatCurrency(amount);
  };

  const formatNumber = (num) => {
    return AnalyticsService.formatNumber(num);
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
      case 'red':
        return {
          text: 'text-red-600',
          bg: 'bg-red-100',
          icon: 'text-red-600'
        };
      case 'yellow':
        return {
          text: 'text-yellow-600',
          bg: 'bg-yellow-100',
          icon: 'text-yellow-600'
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

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'sales', label: 'Sales', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'stores', label: 'Stores', icon: Store }
  ];

  return (
    <AdminLayout
      title="Analytics Dashboard"
      subtitle="Comprehensive business performance metrics and insights"
    >
      {/* Filter Bar */}
      <FilterBar
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        onRefresh={handleRefresh}
        onExport={handleExport}
        loading={loading || refreshing}
      />

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(analytics?.revenueAnalytics?.summary?.currentYearTotal || 0)}
              subtitle={`Growth: ${analytics?.revenueAnalytics?.summary?.growthPercentage || 0}%`}
              icon={DollarSign}
              trend={
                (analytics?.revenueAnalytics?.summary?.growthPercentage || 0) > 0 ? "up" :
                (analytics?.revenueAnalytics?.summary?.growthPercentage || 0) < 0 ? "down" : "neutral"
              }
              trendValue={`${analytics?.revenueAnalytics?.summary?.growthPercentage || 0}% vs last year`}
              color="green"
              loading={loading}
            />

            <MetricCard
              title="Active Stores"
              value={analytics?.dashboardStats?.activeStores || 0}
              subtitle={`Total: ${analytics?.dashboardStats?.totalStores || 0}`}
              icon={Store}
              trend={
                (analytics?.dashboardStats?.storeGrowth || 0) > 0 ? "up" :
                (analytics?.dashboardStats?.storeGrowth || 0) < 0 ? "down" : "neutral"
              }
              trendValue={`${analytics?.dashboardStats?.storeGrowth || 0} new this month`}
              color="blue"
              loading={loading}
            />

            <MetricCard
              title="Total Users"
              value={analytics?.dashboardStats?.totalUsers || 0}
              subtitle={`New this month: ${analytics?.dashboardStats?.newUsersThisMonth || 0}`}
              icon={Users}
              trend={
                (analytics?.dashboardStats?.userGrowth || 0) > 0 ? "up" :
                (analytics?.dashboardStats?.userGrowth || 0) < 0 ? "down" : "neutral"
              }
              trendValue={`${analytics?.dashboardStats?.userGrowth || 0}% growth`}
              color="purple"
              loading={loading}
            />

            <MetricCard
              title="Total Sales"
              value={analytics?.dashboardStats?.totalSales || 0}
              subtitle={`Monthly: ${analytics?.dashboardStats?.monthlyRevenue ? formatCurrency(analytics.dashboardStats.monthlyRevenue) : '₹0'}`}
              icon={ShoppingCart}
              trend={
                (analytics?.dashboardStats?.revenueGrowth || 0) > 0 ? "up" :
                (analytics?.dashboardStats?.revenueGrowth || 0) < 0 ? "down" : "neutral"
              }
              trendValue={`${analytics?.dashboardStats?.revenueGrowth || 0}% vs last month`}
              color="orange"
              loading={loading}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Revenue Trend */}
            <ChartContainer
              title="Monthly Revenue Trend"
              subtitle="Revenue performance over time"
              loading={loading}
              onRefresh={handleRefresh}
              onExport={() => console.log('Export revenue chart')}
            >
              <Bar
                data={AnalyticsService.formatRevenueChartData(analytics?.revenueAnalytics?.revenueData || [])}
                options={AnalyticsService.getRevenueChartOptions()}
              />
            </ChartContainer>

            {/* User Growth Chart */}
            <ChartContainer
              title="User Growth"
              subtitle="New user registrations over time"
              loading={loading}
              onRefresh={handleRefresh}
              onExport={() => console.log('Export user growth chart')}
            >
              <Line
                data={AnalyticsService.formatUserGrowthChartData(analytics?.userGrowth?.userGrowthData || [])}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `New Users: ${context.parsed.y}`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: { beginAtZero: true }
                  }
                }}
              />
            </ChartContainer>
          </div>

          {/* Subscription Distribution and Top Stores */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subscription Plans Distribution */}
            <ChartContainer
              title="Subscription Plans Distribution"
              subtitle="Distribution of active subscription plans"
              loading={loading}
            >
              <Doughnut
                data={AnalyticsService.formatSubscriptionPlanChartData(analytics?.subscriptionAnalytics?.planDistribution || [])}
                options={AnalyticsService.getPieChartOptions()}
              />
            </ChartContainer>

            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">Recent Activities</h3>
              <div className="space-y-3">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 text-left">New store registered</p>
                        <p className="text-xs text-gray-500 text-left">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 text-left">5 new users joined</p>
                        <p className="text-xs text-gray-500 text-left">4 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 text-left">Payment received</p>
                        <p className="text-xs text-gray-500 text-left">6 hours ago</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Sales Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Sales"
              value={formatCurrency(analytics?.salesAnalytics?.summary?.totalSales || 0)}
              subtitle="All time sales"
              icon={ShoppingCart}
              color="green"
              loading={loading}
            />
            <MetricCard
              title="Total Orders"
              value={analytics?.salesAnalytics?.summary?.totalOrders || 0}
              subtitle="Number of orders"
              icon={Package}
              color="blue"
              loading={loading}
            />
            <MetricCard
              title="Average Order Value"
              value={formatCurrency(analytics?.salesAnalytics?.summary?.averageOrderValue || 0)}
              subtitle="Per order average"
              icon={TrendingUp}
              color="purple"
              loading={loading}
            />
          </div>

          {/* Sales Chart */}
          <ChartContainer
            title="Sales Performance"
            subtitle="Sales amount and order count over time"
            loading={loading}
            onRefresh={handleRefresh}
          >
            <Bar
              data={AnalyticsService.formatSalesChartData(analytics?.salesAnalytics?.salesData || [])}
              options={AnalyticsService.getSalesChartOptions()}
            />
          </ChartContainer>

          {/* Top Performing Stores */}
          <DataTable
            title="Top Performing Stores"
            data={analytics?.salesAnalytics?.topStores || []}
            columns={[
              { key: 'storeName', label: 'Store Name' },
              {
                key: 'totalSales',
                label: 'Total Sales',
                render: (value) => formatCurrency(value)
              },
              { key: 'totalOrders', label: 'Orders' },
              {
                key: 'averageOrderValue',
                label: 'Avg Order Value',
                render: (value) => formatCurrency(value)
              }
            ]}
            loading={loading}
            searchable={true}
            sortable={true}
          />
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Inventory Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              title="Total Medicines"
              value={analytics?.inventoryAnalytics?.totalMedicines || 0}
              subtitle="Active medicines"
              icon={Package}
              color="blue"
              loading={loading}
            />
            <MetricCard
              title="Low Stock Items"
              value={analytics?.inventoryAnalytics?.lowStockItems || 0}
              subtitle="Need restocking"
              icon={AlertTriangle}
              color="orange"
              loading={loading}
            />
            <MetricCard
              title="Expired Items"
              value={analytics?.inventoryAnalytics?.expiredItems || 0}
              subtitle="Expired medicines"
              icon={XCircle}
              color="red"
              loading={loading}
            />
            <MetricCard
              title="Inventory Value"
              value={formatCurrency(analytics?.inventoryAnalytics?.totalValue || 0)}
              subtitle="Total stock value"
              icon={DollarSign}
              color="green"
              loading={loading}
            />
          </div>

          {/* Inventory Distribution Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer
              title="Medicine Categories Distribution"
              subtitle="Distribution by medicine categories"
              loading={loading}
            >
              <Doughnut
                data={AnalyticsService.formatInventoryChartData(analytics?.inventoryAnalytics || {})}
                options={AnalyticsService.getPieChartOptions()}
              />
            </ChartContainer>

            {/* Top Medicines by Value */}
            <DataTable
              title="Top Medicines by Stock Value"
              data={analytics?.inventoryAnalytics?.topMedicines || []}
              columns={[
                { key: 'name', label: 'Medicine Name' },
                { key: 'stock', label: 'Stock' },
                {
                  key: 'value',
                  label: 'Value',
                  render: (value) => formatCurrency(value)
                }
              ]}
              loading={loading}
              searchable={false}
              sortable={false}
              className="h-96"
            />
          </div>
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          {/* Customer Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              title="Total Customers"
              value={analytics?.customerAnalytics?.totalCustomers || 0}
              subtitle="All registered customers"
              icon={Users}
              color="blue"
              loading={loading}
            />
            <MetricCard
              title="New Customers"
              value={analytics?.customerAnalytics?.newCustomersThisMonth || 0}
              subtitle="This month"
              icon={UserCheck}
              color="green"
              loading={loading}
            />
            <MetricCard
              title="Active Customers"
              value={analytics?.customerAnalytics?.activeCustomers || 0}
              subtitle="Currently active"
              icon={Activity}
              color="purple"
              loading={loading}
            />
            <MetricCard
              title="Average Spending"
              value={formatCurrency(analytics?.customerAnalytics?.averageSpending || 0)}
              subtitle="Per customer"
              icon={DollarSign}
              color="orange"
              loading={loading}
            />
          </div>

          {/* Customer Segments and Top Customers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer
              title="Customer Segments"
              subtitle="Customer distribution by spending"
              loading={loading}
            >
              <Doughnut
                data={AnalyticsService.formatCustomerSegmentsData(analytics?.customerAnalytics || {})}
                options={AnalyticsService.getPieChartOptions()}
              />
            </ChartContainer>

            <DataTable
              title="Top Customers"
              data={analytics?.customerAnalytics?.topCustomers || []}
              columns={[
                { key: 'name', label: 'Customer Name' },
                {
                  key: 'totalSpent',
                  label: 'Total Spent',
                  render: (value) => formatCurrency(value)
                },
                { key: 'visitCount', label: 'Visits' }
              ]}
              loading={loading}
              searchable={false}
              sortable={false}
              className="h-96"
            />
          </div>
        </div>
      )}

      {/* Stores Tab */}
      {activeTab === 'stores' && (
        <div className="space-y-6">
          {/* Store Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Stores"
              value={analytics?.dashboardStats?.totalStores || 0}
              subtitle="All registered stores"
              icon={Store}
              color="blue"
              loading={loading}
            />
            <MetricCard
              title="Active Stores"
              value={analytics?.dashboardStats?.activeStores || 0}
              subtitle="Currently active"
              icon={CheckCircle}
              color="green"
              loading={loading}
            />
            <MetricCard
              title="New Stores"
              value={analytics?.dashboardStats?.storeGrowth || 0}
              subtitle="This month"
              icon={TrendingUp}
              color="purple"
              loading={loading}
            />
          </div>

          {/* Store Performance Table */}
          <DataTable
            title="Store Performance Overview"
            data={analytics?.salesAnalytics?.topStores || []}
            columns={[
              { key: 'storeName', label: 'Store Name' },
              {
                key: 'totalSales',
                label: 'Total Sales',
                render: (value) => formatCurrency(value)
              },
              { key: 'totalOrders', label: 'Total Orders' },
              {
                key: 'averageOrderValue',
                label: 'Avg Order Value',
                render: (value) => formatCurrency(value)
              }
            ]}
            loading={loading}
            searchable={true}
            sortable={true}
            exportable={true}
            onExport={() => console.log('Export store performance data')}
          />
        </div>
      )}
    </AdminLayout>
  );
};

export default AnalyticsPage;

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  TrendingDown,
  Activity,
  Clock,
  UserCheck,
  Eye
} from 'lucide-react';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';
import { MetricCard, ChartContainer, DataTable, FilterBar } from '../components/analytics';
import AnalyticsService from '../services/analyticsService';
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

// Generate demo analytics data for development
const generateDemoAnalyticsData = (period) => {
  const now = new Date();
  const daysInPeriod = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  // Generate daily sales data
  const dailySales = {};
  let totalRevenue = 0;
  let totalSales = 0;

  for (let i = daysInPeriod - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];

    const dailyRevenue = Math.floor(Math.random() * 5000) + 1000; // 1000-6000
    const dailySalesCount = Math.floor(Math.random() * 20) + 5; // 5-25 sales

    dailySales[dateKey] = {
      date: dateKey,
      revenue: dailyRevenue,
      sales: dailySalesCount,
      averageOrderValue: Math.round(dailyRevenue / dailySalesCount)
    };

    totalRevenue += dailyRevenue;
    totalSales += dailySalesCount;
  }

  // Generate top medicines data
  const medicineNames = [
    'Paracetamol 500mg', 'Amoxicillin 250mg', 'Ibuprofen 400mg',
    'Cetirizine 10mg', 'Omeprazole 20mg', 'Metformin 500mg',
    'Aspirin 75mg', 'Vitamin D3', 'Calcium Tablets', 'Iron Supplements'
  ];

  const topMedicines = medicineNames.slice(0, 5).map((name, index) => ({
    name,
    revenue: Math.floor(Math.random() * 10000) + 5000,
    quantity: Math.floor(Math.random() * 200) + 50,
    growth: Math.floor(Math.random() * 40) - 20 // -20% to +20%
  })).sort((a, b) => b.revenue - a.revenue);

  return {
    period,
    dateRange: {
      startDate: new Date(now.getTime() - daysInPeriod * 24 * 60 * 60 * 1000),
      endDate: now
    },
    summary: {
      totalRevenue,
      totalSales,
      averageOrderValue: Math.round(totalRevenue / totalSales)
    },
    dailySales,
    topMedicines
  };
};

const StoreManagerAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/store-manager/analytics?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication failed. Please log in again.');
          // Clear invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return;
        } else if (response.status === 403) {
          setError('Access denied. You need store manager permissions.');
          return;
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.message || 'Failed to fetch analytics');
          return;
        }
      }

      const data = await response.json();
      if (data.success) {
        setAnalyticsData(data.data);
        setError(''); // Clear any previous errors
      } else {
        setError(data.message || 'Failed to load analytics data');
      }
    } catch (error) {
      console.error('Analytics API error:', error);
      setError(`Failed to load analytics data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAnalytics();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle export
  const handleExport = () => {
    if (!analyticsData) {
      alert('No data available to export');
      return;
    }

    try {
      // Create CSV content with UTF-8 BOM
      let csvContent = '\uFEFF'; // UTF-8 BOM for proper encoding

      // Add summary data
      csvContent += "ShelfCure Store Analytics Report\n";
      csvContent += `Period: ${getPeriodLabel(period)}\n`;
      csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

      csvContent += "SUMMARY METRICS\n";
      csvContent += "Metric,Value\n";
      csvContent += `Total Revenue,${analyticsData.summary.totalRevenue}\n`;
      csvContent += `Total Sales,${analyticsData.summary.totalSales}\n`;
      csvContent += `Average Order Value,${analyticsData.summary.averageOrderValue}\n`;
      csvContent += `Revenue Growth,${analyticsData.summary.revenueGrowth || 0}%\n`;
      csvContent += `Sales Growth,${analyticsData.summary.salesGrowth || 0}%\n\n`;

      // Add daily sales data
      csvContent += "DAILY SALES\n";
      csvContent += "Date,Revenue,Sales,Transactions,Average Order Value\n";
      analyticsData.dailySales?.forEach(day => {
        csvContent += `${day.date},${day.revenue},${day.sales},${day.transactions},${day.averageOrderValue}\n`;
      });

      csvContent += "\nTOP MEDICINES\n";
      csvContent += "Medicine,Revenue,Quantity,Category\n";
      analyticsData.topMedicines?.forEach(medicine => {
        csvContent += `${medicine.name},${medicine.revenue},${medicine.quantity},${medicine.category || 'N/A'}\n`;
      });

      // Add inventory data if available
      if (analyticsData.inventory) {
        csvContent += "\nINVENTORY METRICS\n";
        csvContent += "Metric,Value\n";
        csvContent += `Total Medicines,${analyticsData.inventory.totalMedicines}\n`;
        csvContent += `Low Stock Medicines,${analyticsData.inventory.lowStockMedicines}\n`;
        csvContent += `Out of Stock Medicines,${analyticsData.inventory.outOfStockMedicines}\n`;
        csvContent += `Stock Health Percentage,${analyticsData.inventory.stockHealthPercentage}%\n`;
      }

      // Add customer data if available
      if (analyticsData.customers) {
        csvContent += "\nCUSTOMER METRICS\n";
        csvContent += "Metric,Value\n";
        csvContent += `Total Customers,${analyticsData.customers.totalCustomers}\n`;
        csvContent += `New Customers,${analyticsData.customers.newCustomers}\n`;
        csvContent += `Customer Growth,${analyticsData.customers.customerGrowth}%\n`;
      }

      // Create and download file with proper UTF-8 encoding
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `store-analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('Analytics data exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return AnalyticsService.formatCurrency(amount);
  };

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'sales', label: 'Sales Performance', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory Insights', icon: Package },
    { id: 'customers', label: 'Customer Analytics', icon: Users },
    { id: 'operations', label: 'Operations', icon: Activity }
  ];

  // Helper function to get period label
  const getPeriodLabel = (period) => {
    switch (period) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      default: return 'Last 30 Days';
    }
  };

  if (loading) {
    return (
      <StoreManagerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </StoreManagerLayout>
    );
  }

  if (error) {
    return (
      <StoreManagerLayout>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      </StoreManagerLayout>
    );
  }

  const summary = analyticsData?.summary || {};
  const dailySales = analyticsData?.dailySales || {};
  const topMedicines = analyticsData?.topMedicines || [];

  return (
    <StoreManagerLayout>
      <div className="space-y-6">
        {/* Filter Bar */}
        <FilterBar
          dateFilter={period}
          onDateFilterChange={setPeriod}
          onRefresh={handleRefresh}
          onExport={handleExport}
          loading={loading || refreshing}
          customFilters={[
            {
              label: 'Period',
              options: [
                { value: '7d', label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' },
                { value: '90d', label: 'Last 90 Days' }
              ],
              value: period,
              onChange: setPeriod
            }
          ]}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-700 text-left">{error}</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="ml-4 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-medium disabled:opacity-50"
              >
                {refreshing ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm">
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
                value={formatCurrency(analyticsData?.summary?.totalRevenue || 0)}
                subtitle={`${getPeriodLabel(period)} revenue`}
                icon={DollarSign}
                trend={analyticsData?.summary?.revenueGrowth > 0 ? "up" : analyticsData?.summary?.revenueGrowth < 0 ? "down" : "neutral"}
                trendValue={analyticsData?.summary?.revenueGrowth ? `${analyticsData.summary.revenueGrowth > 0 ? '+' : ''}${analyticsData.summary.revenueGrowth}% from last period` : "No previous data"}
                color="green"
                loading={loading}
              />
              <MetricCard
                title="Total Sales"
                value={analyticsData?.summary?.totalSales || 0}
                subtitle="Number of transactions"
                icon={ShoppingCart}
                trend={analyticsData?.summary?.salesGrowth > 0 ? "up" : analyticsData?.summary?.salesGrowth < 0 ? "down" : "neutral"}
                trendValue={analyticsData?.summary?.salesGrowth ? `${analyticsData.summary.salesGrowth > 0 ? '+' : ''}${analyticsData.summary.salesGrowth}% from last period` : "No previous data"}
                color="blue"
                loading={loading}
              />
              <MetricCard
                title="Average Order Value"
                value={formatCurrency(analyticsData?.summary?.averageOrderValue || 0)}
                subtitle="Per transaction"
                icon={TrendingUp}
                trend="neutral"
                trendValue="Average per sale"
                color="purple"
                loading={loading}
              />
              <MetricCard
                title="Top Medicine Sales"
                value={analyticsData?.topMedicines?.[0]?.revenue ? formatCurrency(analyticsData.topMedicines[0].revenue) : '₹0'}
                subtitle={analyticsData?.topMedicines?.[0]?.name || 'No data'}
                icon={Package}
                color="orange"
                loading={loading}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Sales Chart */}
              <ChartContainer
                title="Daily Sales Trend"
                subtitle="Sales performance over time"
                loading={loading}
                onRefresh={handleRefresh}
              >
                <Line
                  data={{
                    labels: analyticsData?.dailySales?.map(item =>
                      new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    ) || [],
                    datasets: [
                      {
                        label: 'Revenue',
                        data: analyticsData?.dailySales?.map(item => item.revenue) || [],
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `Revenue: ${formatCurrency(context.parsed.y)}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return formatCurrency(value);
                          }
                        }
                      }
                    }
                  }}
                />
              </ChartContainer>

              {/* Top Medicines Chart */}
              <ChartContainer
                title="Top Selling Medicines"
                subtitle="Revenue by medicine"
                loading={loading}
              >
                <Bar
                  data={{
                    labels: analyticsData?.topMedicines?.map(item => item.name) || [],
                    datasets: [
                      {
                        label: 'Revenue',
                        data: analyticsData?.topMedicines?.map(item => item.revenue) || [],
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `Revenue: ${formatCurrency(context.parsed.y)}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return formatCurrency(value);
                          }
                        }
                      }
                    }
                  }}
                />
              </ChartContainer>
            </div>
          </div>
        )}

        {/* Sales Performance Tab */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            {/* Sales Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Daily Average Sales"
                value={formatCurrency(analyticsData?.summary?.dailyAverageSales || 0)}
                subtitle="Average per day"
                icon={ShoppingCart}
                color="green"
                loading={loading}
              />
              <MetricCard
                title="Peak Sales Day"
                value={analyticsData?.peakSalesDay?.day || 'N/A'}
                subtitle={formatCurrency(analyticsData?.peakSalesDay?.amount || 0)}
                icon={TrendingUp}
                color="blue"
                loading={loading}
              />
              <MetricCard
                title="Sales Growth"
                value={`${analyticsData?.salesGrowth || 0}%`}
                subtitle="Compared to last period"
                icon={BarChart3}
                trend={analyticsData?.salesGrowth > 0 ? 'up' : analyticsData?.salesGrowth < 0 ? 'down' : 'neutral'}
                color="purple"
                loading={loading}
              />
            </div>

            {/* Detailed Sales Chart */}
            <ChartContainer
              title="Sales Performance Analysis"
              subtitle="Revenue and transaction count over time"
              loading={loading}
              onRefresh={handleRefresh}
            >
              <Bar
                data={{
                  labels: analyticsData?.dailySales?.map(item =>
                    new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  ) || [],
                  datasets: [
                    {
                      label: 'Revenue (₹)',
                      data: analyticsData?.dailySales?.map(item => item.revenue) || [],
                      backgroundColor: 'rgba(34, 197, 94, 0.8)',
                      borderColor: 'rgba(34, 197, 94, 1)',
                      borderWidth: 1,
                      yAxisID: 'y'
                    },
                    {
                      label: 'Transactions',
                      data: analyticsData?.dailySales?.map(item => item.transactions) || [],
                      backgroundColor: 'rgba(59, 130, 246, 0.8)',
                      borderColor: 'rgba(59, 130, 246, 1)',
                      borderWidth: 1,
                      yAxisID: 'y1'
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' }
                  },
                  scales: {
                    y: {
                      type: 'linear',
                      display: true,
                      position: 'left',
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return formatCurrency(value);
                        }
                      }
                    },
                    y1: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      beginAtZero: true,
                      grid: {
                        drawOnChartArea: false,
                      },
                    }
                  }
                }}
              />
            </ChartContainer>

            {/* Top Medicines Table */}
            <DataTable
              title="Top Performing Medicines"
              data={analyticsData?.topMedicines || []}
              columns={[
                { key: 'name', label: 'Medicine Name' },
                { key: 'quantity', label: 'Quantity Sold' },
                {
                  key: 'revenue',
                  label: 'Revenue',
                  render: (value) => formatCurrency(value)
                },
                { key: 'category', label: 'Category' },
                {
                  key: 'growth',
                  label: 'Growth',
                  render: (value) => (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      value > 0 ? 'bg-green-100 text-green-800' :
                      value < 0 ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {value > 0 ? '+' : ''}{value}%
                    </span>
                  )
                }
              ]}
              loading={loading}
              searchable={true}
              sortable={true}
            />
          </div>
        )}

        {/* Inventory Insights Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Inventory Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <MetricCard
                title="Total Medicines"
                value={analyticsData?.inventory?.totalMedicines || 0}
                subtitle="Active medicines"
                icon={Package}
                color="blue"
                loading={loading}
              />
              <MetricCard
                title="Inventory Value"
                value={formatCurrency(analyticsData?.inventory?.totalValue || 0)}
                subtitle="Total stock value"
                icon={DollarSign}
                color="green"
                loading={loading}
              />
              <MetricCard
                title="Low Stock Items"
                value={analyticsData?.inventory?.lowStockMedicines || 0}
                subtitle="Need restocking"
                icon={AlertTriangle}
                color="orange"
                loading={loading}
              />
              <MetricCard
                title="Out of Stock"
                value={analyticsData?.inventory?.outOfStockMedicines || 0}
                subtitle="Currently unavailable"
                icon={Package}
                color="red"
                loading={loading}
              />
              <MetricCard
                title="Expiring Soon"
                value={analyticsData?.inventory?.expiringMedicines || 0}
                subtitle="Within 30 days"
                icon={Clock}
                color="yellow"
                loading={loading}
              />
              <MetricCard
                title="Expired Items"
                value={analyticsData?.inventory?.expiredMedicines || 0}
                subtitle="Already expired"
                icon={AlertTriangle}
                color="red"
                loading={loading}
              />
              <MetricCard
                title="Stock Health"
                value={`${analyticsData?.inventory?.stockHealthPercentage || 0}%`}
                subtitle="Healthy stock levels"
                icon={TrendingUp}
                color="purple"
                loading={loading}
              />
            </div>

            {/* Inventory Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Stock Status Distribution */}
              <ChartContainer
                title="Stock Status Distribution"
                subtitle="Inventory status breakdown"
                loading={loading}
              >
                <Doughnut
                  data={{
                    labels: ['Healthy Stock', 'Low Stock', 'Out of Stock'],
                    datasets: [{
                      data: [
                        (analyticsData?.inventory?.totalMedicines || 0) - (analyticsData?.inventory?.lowStockMedicines || 0) - (analyticsData?.inventory?.outOfStockMedicines || 0),
                        analyticsData?.inventory?.lowStockMedicines || 0,
                        analyticsData?.inventory?.outOfStockMedicines || 0
                      ],
                      backgroundColor: [
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                      ],
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' }
                    }
                  }}
                />
              </ChartContainer>

              {/* Medicine Categories */}
              <ChartContainer
                title="Medicine Categories"
                subtitle="Distribution by category"
                loading={loading}
              >
                <Bar
                  data={{
                    labels: analyticsData?.inventory?.categories?.map(cat => cat.name) || [],
                    datasets: [{
                      label: 'Count',
                      data: analyticsData?.inventory?.categories?.map(cat => cat.count) || [],
                      backgroundColor: 'rgba(168, 85, 247, 0.8)',
                      borderColor: 'rgba(168, 85, 247, 1)',
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      y: { beginAtZero: true }
                    }
                  }}
                />
              </ChartContainer>
            </div>

            {/* Low Stock Alert Table */}
            <DataTable
              title="Low Stock Alerts"
              data={analyticsData?.inventory?.lowStockMedicinesData || []}
              columns={[
                { key: 'name', label: 'Medicine Name' },
                { key: 'stock', label: 'Current Stock' },
                { key: 'minStock', label: 'Min Stock Level' },
                { key: 'category', label: 'Category' },
                {
                  key: 'urgency',
                  label: 'Urgency',
                  render: (value, row) => {
                    const urgency = row.stock <= row.minStock * 0.5 ? 'High' : 'Medium';
                    return (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        urgency === 'High'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {urgency}
                      </span>
                    );
                  }
                }
              ]}
              loading={loading}
              searchable={true}
              sortable={true}
            />
          </div>
        )}

        {/* Customer Analytics Tab */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            {/* Customer Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              <MetricCard
                title="Total Customers"
                value={analyticsData?.customers?.totalCustomers || 0}
                subtitle="Registered customers"
                icon={Users}
                color="blue"
                loading={loading}
              />
              <MetricCard
                title="New Customers"
                value={analyticsData?.customers?.newCustomers || 0}
                subtitle={`This ${getPeriodLabel(period)}`}
                icon={UserCheck}
                color="green"
                loading={loading}
              />
              <MetricCard
                title="Customer Growth"
                value={`${analyticsData?.customers?.customerGrowth || 0}%`}
                subtitle="Growth rate"
                icon={TrendingUp}
                color="purple"
                loading={loading}
              />
              <MetricCard
                title="Active Customers"
                value={analyticsData?.customers?.activeCustomers || 0}
                subtitle="Recently active"
                icon={Activity}
                color="orange"
                loading={loading}
              />
              <MetricCard
                title="Average Spending"
                value={formatCurrency(analyticsData?.customers?.averageSpending || 0)}
                subtitle="Per customer"
                icon={DollarSign}
                color="green"
                loading={loading}
              />
              <MetricCard
                title="Average Order Value"
                value={formatCurrency(analyticsData?.customers?.averageOrderValue || 0)}
                subtitle="Per transaction"
                icon={TrendingUp}
                color="purple"
                loading={loading}
              />
            </div>

            {/* Customer Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Acquisition */}
              <ChartContainer
                title="Customer Acquisition"
                subtitle="New customers over time"
                loading={loading}
              >
                <Line
                  data={{
                    labels: analyticsData?.customers?.acquisitionData?.map(item =>
                      new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    ) || [],
                    datasets: [{
                      label: 'New Customers',
                      data: analyticsData?.customers?.acquisitionData?.map(item => item.count) || [],
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      borderColor: 'rgba(16, 185, 129, 1)',
                      borderWidth: 2,
                      fill: true,
                      tension: 0.4
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      y: { beginAtZero: true }
                    }
                  }}
                />
              </ChartContainer>

              {/* Customer Spending Distribution */}
              <ChartContainer
                title="Customer Spending Distribution"
                subtitle="Spending patterns"
                loading={loading}
              >
                <Doughnut
                  data={{
                    labels: ['Low Spenders', 'Medium Spenders', 'High Spenders'],
                    datasets: [{
                      data: [
                        analyticsData?.customers?.lowSpenders || 0,
                        analyticsData?.customers?.mediumSpenders || 0,
                        analyticsData?.customers?.highSpenders || 0
                      ],
                      backgroundColor: [
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(34, 197, 94, 0.8)'
                      ],
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' }
                    }
                  }}
                />
              </ChartContainer>
            </div>

            {/* Top Customers Table */}
            <DataTable
              title="Top Customers"
              data={analyticsData?.customers?.topCustomers || []}
              columns={[
                { key: 'name', label: 'Customer Name' },
                { key: 'phone', label: 'Phone' },
                { key: 'visitCount', label: 'Total Visits' },
                {
                  key: 'totalSpent',
                  label: 'Total Spent',
                  render: (value) => formatCurrency(value)
                },
                {
                  key: 'lastVisit',
                  label: 'Last Visit',
                  render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
                },
                {
                  key: 'customerType',
                  label: 'Type',
                  render: (value, row) => {
                    const type = row.totalSpent > 10000 ? 'VIP' : row.totalSpent > 5000 ? 'Regular' : 'New';
                    return (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        type === 'VIP'
                          ? 'bg-purple-100 text-purple-800'
                          : type === 'Regular'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {type}
                      </span>
                    );
                  }
                }
              ]}
              loading={loading}
              searchable={true}
              sortable={true}
            />
          </div>
        )}

        {/* Operations Tab */}
        {activeTab === 'operations' && (
          <div className="space-y-6">
            {/* Operational Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              <MetricCard
                title="Daily Transactions"
                value={analyticsData?.operations?.dailyTransactions || 0}
                subtitle="Average per day"
                icon={Activity}
                color="blue"
                loading={loading}
              />
              <MetricCard
                title="Peak Hours"
                value={analyticsData?.operations?.peakHours || 'N/A'}
                subtitle="Busiest time"
                icon={Clock}
                color="green"
                loading={loading}
              />
              <MetricCard
                title="Staff Efficiency"
                value={`${analyticsData?.operations?.staffEfficiency || 0}%`}
                subtitle="Performance score"
                icon={TrendingUp}
                color="purple"
                loading={loading}
              />
              <MetricCard
                title="System Uptime"
                value={`${analyticsData?.operations?.systemUptime || 0}%`}
                subtitle="Availability"
                icon={Activity}
                color="orange"
                loading={loading}
              />
              <MetricCard
                title="Avg Transaction Time"
                value={`${analyticsData?.operations?.averageTransactionTime || 0} min`}
                subtitle="Processing time"
                icon={Clock}
                color="indigo"
                loading={loading}
              />
              <MetricCard
                title="Total Transactions"
                value={analyticsData?.operations?.totalTransactions || 0}
                subtitle={`This ${getPeriodLabel(period)}`}
                icon={ShoppingCart}
                color="pink"
                loading={loading}
              />
            </div>

            {/* Operational Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hourly Transaction Pattern */}
              <ChartContainer
                title="Hourly Transaction Pattern"
                subtitle="Transactions by hour of day"
                loading={loading}
              >
                <Bar
                  data={{
                    labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                    datasets: [{
                      label: 'Transactions',
                      data: analyticsData?.operations?.hourlyPattern || Array(24).fill(0),
                      backgroundColor: 'rgba(59, 130, 246, 0.8)',
                      borderColor: 'rgba(59, 130, 246, 1)',
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      y: { beginAtZero: true }
                    }
                  }}
                />
              </ChartContainer>

              {/* Weekly Performance */}
              <ChartContainer
                title="Weekly Performance"
                subtitle="Performance metrics by day"
                loading={loading}
              >
                <Line
                  data={{
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [
                      {
                        label: 'Sales',
                        data: analyticsData?.operations?.weeklyPerformance?.sales || Array(7).fill(0),
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                      },
                      {
                        label: 'Transactions',
                        data: analyticsData?.operations?.weeklyPerformance?.transactions || Array(7).fill(0),
                        backgroundColor: 'rgba(168, 85, 247, 0.1)',
                        borderColor: 'rgba(168, 85, 247, 1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' }
                    },
                    scales: {
                      y: { beginAtZero: true }
                    }
                  }}
                />
              </ChartContainer>
            </div>

            {/* Category Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartContainer
                title="Sales by Category"
                subtitle="Revenue distribution by medicine category"
                loading={loading}
              >
                <Doughnut
                  data={{
                    labels: analyticsData?.operations?.categoryDistribution?.map(cat => cat.category) || [],
                    datasets: [{
                      data: analyticsData?.operations?.categoryDistribution?.map(cat => cat.revenue) || [],
                      backgroundColor: [
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(168, 85, 247, 0.8)',
                        'rgba(249, 115, 22, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(14, 165, 233, 0.8)'
                      ],
                      borderColor: [
                        'rgba(34, 197, 94, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(168, 85, 247, 1)',
                        'rgba(249, 115, 22, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(14, 165, 233, 1)'
                      ],
                      borderWidth: 2
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' }
                    }
                  }}
                />
              </ChartContainer>

              <ChartContainer
                title="Top Medicine Categories"
                subtitle="Best performing categories"
                loading={loading}
              >
                <Bar
                  data={{
                    labels: analyticsData?.operations?.categoryDistribution?.slice(0, 5).map(cat => cat.category) || [],
                    datasets: [{
                      label: 'Revenue',
                      data: analyticsData?.operations?.categoryDistribution?.slice(0, 5).map(cat => cat.revenue) || [],
                      backgroundColor: 'rgba(34, 197, 94, 0.8)',
                      borderColor: 'rgba(34, 197, 94, 1)',
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      y: { beginAtZero: true }
                    }
                  }}
                />
              </ChartContainer>
            </div>

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
                        <ShoppingCart className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 text-left">New sale completed</p>
                        <p className="text-xs text-gray-500 text-left">₹1,250 - 5 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 text-left">Inventory updated</p>
                        <p className="text-xs text-gray-500 text-left">Paracetamol restocked - 15 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 text-left">Low stock alert</p>
                        <p className="text-xs text-gray-500 text-left">Crocin Syrup - 1 hour ago</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </StoreManagerLayout>
  );
};

export default StoreManagerAnalytics;

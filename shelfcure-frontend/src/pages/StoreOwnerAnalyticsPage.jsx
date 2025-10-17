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
  Eye,
  UserCheck,
  ShoppingCart,
  Package,
  AlertTriangle
} from 'lucide-react';
import StoreOwnerLayout from '../components/store-owner/StoreOwnerLayout';
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

const StoreOwnerAnalyticsPage = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStore, setSelectedStore] = useState('all');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
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

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  // Handle export
  const handleExport = () => {
    console.log('Exporting store owner analytics data...');
  };

  // Format currency
  const formatCurrency = (amount) => {
    return AnalyticsService.formatCurrency(amount);
  };

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'stores', label: 'Store Performance', icon: Store },
    { id: 'staff', label: 'Staff Analytics', icon: Users },
    { id: 'comparison', label: 'Store Comparison', icon: TrendingUp }
  ];

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      red: 'bg-red-100 text-red-600',
      yellow: 'bg-yellow-100 text-yellow-600'
    };

    return (
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`h-10 w-10 rounded-lg ${colorClasses[color] || colorClasses.blue} flex items-center justify-center`}>
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
      <div className="space-y-6">
        {/* Filter Bar */}
        <FilterBar
          dateFilter={selectedPeriod}
          onDateFilterChange={setSelectedPeriod}
          customFilters={[
            {
              type: 'select',
              icon: Store,
              value: selectedStore,
              onChange: setSelectedStore,
              options: [
                { value: 'all', label: 'All Stores' },
                { value: 'store1', label: 'Store 1' },
                { value: 'store2', label: 'Store 2' }
              ]
            }
          ]}
          onRefresh={handleRefresh}
          onExport={handleExport}
          loading={loading || refreshing}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700 text-left">{error}</p>
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
                title="Total Stores"
                value={analytics?.summary?.totalStores || 0}
                subtitle="Active stores"
                icon={Store}
                color="blue"
                loading={loading}
              />
              <MetricCard
                title="Total Staff"
                value={analytics?.summary?.totalStaff || 0}
                subtitle="Across all stores"
                icon={Users}
                color="green"
                loading={loading}
              />
              <MetricCard
                title="Attendance Rate"
                value={`${analytics?.summary?.averageAttendanceRate || 0}%`}
                subtitle="Average attendance"
                icon={UserCheck}
                color="purple"
                loading={loading}
              />
              <MetricCard
                title="Salary Expense"
                value={formatCurrency(analytics?.summary?.totalSalaryExpense || 0)}
                subtitle="Monthly total"
                icon={DollarSign}
                color="orange"
                loading={loading}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attendance Analytics Chart */}
              <ChartContainer
                title="Attendance Analytics"
                subtitle="Daily attendance rates across stores"
                loading={loading}
                onRefresh={handleRefresh}
              >
                <Line
                  data={{
                    labels: analytics?.attendanceAnalytics?.map(item =>
                      new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    ) || [],
                    datasets: [
                      {
                        label: 'Attendance Rate (%)',
                        data: analytics?.attendanceAnalytics?.map(item => item.attendanceRate) || [],
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
                            return `Attendance: ${context.parsed.y}%`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: function(value) {
                            return value + '%';
                          }
                        }
                      }
                    }
                  }}
                />
              </ChartContainer>

              {/* Salary Analytics Chart */}
              <ChartContainer
                title="Salary Analytics"
                subtitle="Monthly salary expenses by store"
                loading={loading}
                onRefresh={handleRefresh}
              >
                <Bar
                  data={{
                    labels: analytics?.salaryAnalytics?.map(item =>
                      new Date(item.date).toLocaleDateString('en-US', { month: 'short' })
                    ) || [],
                    datasets: [
                      {
                        label: 'Salary Expense',
                        data: analytics?.salaryAnalytics?.map(item => item.totalSalaries) || [],
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
                            return `Salary: ${formatCurrency(context.parsed.y)}`;
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

        {/* Store Performance Tab */}
        {activeTab === 'stores' && (
          <div className="space-y-6">
            {/* Store Performance Table */}
            <DataTable
              title="Store Performance Overview"
              data={analytics?.storePerformance || []}
              columns={[
                { key: 'storeName', label: 'Store Name' },
                {
                  key: 'totalSales',
                  label: 'Total Sales',
                  render: (value) => formatCurrency(value || 0)
                },
                { key: 'totalOrders', label: 'Orders' },
                { key: 'staffCount', label: 'Staff' },
                {
                  key: 'attendanceRate',
                  label: 'Attendance',
                  render: (value) => `${value || 0}%`
                },
                {
                  key: 'performance',
                  label: 'Performance',
                  render: (value, row) => (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      (row.attendanceRate || 0) >= 90
                        ? 'bg-green-100 text-green-800'
                        : (row.attendanceRate || 0) >= 75
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {(row.attendanceRate || 0) >= 90 ? 'Excellent' :
                       (row.attendanceRate || 0) >= 75 ? 'Good' : 'Needs Improvement'}
                    </span>
                  )
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

        {/* Staff Analytics Tab */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            {/* Staff Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Total Staff"
                value={analytics?.summary?.totalStaff || 0}
                subtitle="Across all stores"
                icon={Users}
                color="blue"
                loading={loading}
              />
              <MetricCard
                title="Average Attendance"
                value={`${analytics?.summary?.averageAttendanceRate || 0}%`}
                subtitle="Overall attendance rate"
                icon={UserCheck}
                color="green"
                loading={loading}
              />
              <MetricCard
                title="Total Salary Expense"
                value={formatCurrency(analytics?.summary?.totalSalaryExpense || 0)}
                subtitle="Monthly expense"
                icon={DollarSign}
                color="orange"
                loading={loading}
              />
              <MetricCard
                title="Active Staff"
                value={analytics?.summary?.activeStaff || 0}
                subtitle="Currently active"
                icon={Activity}
                color="purple"
                loading={loading}
              />
            </div>

            {/* Staff Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attendance Trends */}
              <ChartContainer
                title="Attendance Trends"
                subtitle="Daily attendance across all stores"
                loading={loading}
              >
                <Line
                  data={{
                    labels: analytics?.attendanceAnalytics?.map(item =>
                      new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    ) || [],
                    datasets: [
                      {
                        label: 'Present',
                        data: analytics?.attendanceAnalytics?.map(item => item.presentCount) || [],
                        backgroundColor: 'rgba(34, 197, 94, 0.8)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 2
                      },
                      {
                        label: 'Absent',
                        data: analytics?.attendanceAnalytics?.map(item => item.absentCount) || [],
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 2
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

              {/* Working Hours */}
              <ChartContainer
                title="Working Hours"
                subtitle="Total working hours per day"
                loading={loading}
              >
                <Bar
                  data={{
                    labels: analytics?.attendanceAnalytics?.map(item =>
                      new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    ) || [],
                    datasets: [
                      {
                        label: 'Total Hours',
                        data: analytics?.attendanceAnalytics?.map(item => item.totalHours) || [],
                        backgroundColor: 'rgba(168, 85, 247, 0.8)',
                        borderColor: 'rgba(168, 85, 247, 1)',
                        borderWidth: 1
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return value + 'h';
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

        {/* Store Comparison Tab */}
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            {/* Comparison Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Best Performing Store"
                value="Store A"
                subtitle="Highest attendance rate"
                icon={Award}
                color="green"
                loading={loading}
              />
              <MetricCard
                title="Most Staff"
                value="Store B"
                subtitle="Largest team size"
                icon={Users}
                color="blue"
                loading={loading}
              />
              <MetricCard
                title="Highest Expenses"
                value="Store C"
                subtitle="Monthly salary costs"
                icon={AlertTriangle}
                color="orange"
                loading={loading}
              />
            </div>

            {/* Store Comparison Chart */}
            <ChartContainer
              title="Store Performance Comparison"
              subtitle="Attendance rates and staff counts by store"
              loading={loading}
              onRefresh={handleRefresh}
            >
              <Bar
                data={{
                  labels: analytics?.storePerformance?.map(store => store.storeName) || [],
                  datasets: [
                    {
                      label: 'Attendance Rate (%)',
                      data: analytics?.storePerformance?.map(store => store.attendanceRate) || [],
                      backgroundColor: 'rgba(34, 197, 94, 0.8)',
                      borderColor: 'rgba(34, 197, 94, 1)',
                      borderWidth: 1,
                      yAxisID: 'y'
                    },
                    {
                      label: 'Staff Count',
                      data: analytics?.storePerformance?.map(store => store.staffCount) || [],
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
                      max: 100,
                      ticks: {
                        callback: function(value) {
                          return value + '%';
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

            {/* Detailed Store Comparison Table */}
            <DataTable
              title="Detailed Store Comparison"
              data={analytics?.storePerformance || []}
              columns={[
                { key: 'storeName', label: 'Store Name' },
                { key: 'staffCount', label: 'Staff Count' },
                {
                  key: 'attendanceRate',
                  label: 'Attendance Rate',
                  render: (value) => `${value || 0}%`
                },
                {
                  key: 'totalSalaries',
                  label: 'Monthly Salary',
                  render: (value) => formatCurrency(value || 0)
                },
                {
                  key: 'avgWorkingHours',
                  label: 'Avg Working Hours',
                  render: (value) => `${value || 0}h`
                },
                {
                  key: 'efficiency',
                  label: 'Efficiency Score',
                  render: (value, row) => {
                    const score = Math.round((row.attendanceRate || 0) * 0.7 + (row.avgWorkingHours || 0) * 0.3);
                    return (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        score >= 80
                          ? 'bg-green-100 text-green-800'
                          : score >= 60
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {score}/100
                      </span>
                    );
                  }
                }
              ]}
              loading={loading}
              searchable={true}
              sortable={true}
              exportable={true}
              onExport={() => console.log('Export store comparison data')}
            />
          </div>
        )}
      </div>
    </StoreOwnerLayout>
  );
};

export default StoreOwnerAnalyticsPage;

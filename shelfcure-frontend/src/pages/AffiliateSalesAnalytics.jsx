import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AffiliatePanelLayout from '../components/AffiliatePanelLayout';
import api from '../utils/api';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Eye,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Target,
  Award,
  Clock
} from 'lucide-react';

const AffiliateSalesAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('30'); // days
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalEarnings: 0,
      totalReferrals: 0,
      conversionRate: 0,
      avgOrderValue: 0,
      clickThroughRate: 0,
      topPerformingLink: ''
    },
    trends: {
      earningsData: [],
      referralsData: [],
      conversionsData: []
    },
    performance: {
      bySource: [],
      byTimeOfDay: [],
      byDayOfWeek: [],
      topLinks: []
    },
    goals: {
      monthlyTarget: 0,
      currentProgress: 0,
      daysRemaining: 0
    }
  });

  useEffect(() => {
    // Check if user is authenticated as affiliate
    const affiliateToken = localStorage.getItem('affiliateToken');
    const affiliateData = localStorage.getItem('affiliateData');

    if (!affiliateToken || !affiliateData) {
      console.log('No affiliate authentication found, redirecting to login');
      navigate('/affiliate-login');
      return;
    }

    fetchAnalyticsData();
  }, [dateRange, navigate]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors

      // Debug logging
      const affiliateToken = localStorage.getItem('affiliateToken');
      console.log('Fetching analytics data...');
      console.log('Date range:', dateRange);
      console.log('Has affiliate token:', !!affiliateToken);
      console.log('API URL:', `/api/affiliate-panel/analytics?days=${dateRange}`);

      const response = await api.get(`/api/affiliate-panel/analytics?days=${dateRange}`);

      if (response.data.success) {
        // Ensure all nested objects exist with proper defaults
        const data = response.data.data;
        setAnalyticsData({
          overview: {
            totalEarnings: data.overview?.totalEarnings || 0,
            totalReferrals: data.overview?.totalReferrals || 0,
            conversionRate: data.overview?.conversionRate || 0,
            avgOrderValue: data.overview?.avgOrderValue || 0,
            clickThroughRate: data.overview?.clickThroughRate || 0,
            topPerformingLink: data.overview?.topPerformingLink || 'N/A'
          },
          trends: {
            earningsData: data.trends?.earningsData || [],
            referralsData: data.trends?.referralsData || [],
            conversionsData: data.trends?.conversionsData || []
          },
          performance: {
            bySource: data.performance?.bySource || [],
            byTimeOfDay: data.performance?.byTimeOfDay || [],
            byDayOfWeek: data.performance?.byDayOfWeek || [],
            topLinks: data.performance?.topLinks || []
          },
          goals: {
            monthlyTarget: data.goals?.monthlyTarget || 0,
            currentProgress: data.goals?.currentProgress || 0,
            daysRemaining: data.goals?.daysRemaining || 0
          }
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      if (error.response?.status === 401) {
        navigate('/affiliate-login');
      } else {
        setError(`Failed to load analytics data: ${error.response?.data?.message || error.message}`);
        // Show sample data when API fails so user can see the UI
        setAnalyticsData({
          overview: {
            totalEarnings: 15000,
            totalReferrals: 25,
            conversionRate: 12.5,
            avgOrderValue: 2500,
            clickThroughRate: 3.8,
            topPerformingLink: 'Pharmacy Sign-Up'
          },
          trends: {
            earningsData: [
              { date: '2024-01-01', value: 1200 },
              { date: '2024-01-02', value: 1800 },
              { date: '2024-01-03', value: 2200 }
            ],
            referralsData: [
              { date: '2024-01-01', value: 3 },
              { date: '2024-01-02', value: 5 },
              { date: '2024-01-03', value: 4 }
            ],
            conversionsData: [
              { date: '2024-01-01', value: 2 },
              { date: '2024-01-02', value: 3 },
              { date: '2024-01-03', value: 2 }
            ]
          },
          performance: {
            bySource: [
              { name: 'Direct Links', referrals: 10, earnings: 6750, percentage: 40 },
              { name: 'WhatsApp', referrals: 8, earnings: 3750, percentage: 30 },
              { name: 'Social Media', referrals: 5, earnings: 3000, percentage: 20 },
              { name: 'Email', referrals: 2, earnings: 1500, percentage: 10 }
            ],
            byTimeOfDay: [
              { hour: '9 AM', referrals: 5, earnings: 250 },
              { hour: '12 PM', referrals: 8, earnings: 400 },
              { hour: '3 PM', referrals: 12, earnings: 600 }
            ],
            byDayOfWeek: [
              { day: 'Monday', earnings: 2500 },
              { day: 'Tuesday', earnings: 2200 },
              { day: 'Wednesday', earnings: 2800 },
              { day: 'Thursday', earnings: 2100 },
              { day: 'Friday', earnings: 3200 },
              { day: 'Saturday', earnings: 1800 },
              { day: 'Sunday', earnings: 1400 }
            ],
            topLinks: [
              { name: 'Pharmacy Registration', clicks: 150, earnings: 7500, conversionRate: 15.5 },
              { name: 'Store Setup Guide', clicks: 120, earnings: 4500, conversionRate: 12.8 },
              { name: 'Premium Features', clicks: 80, earnings: 3000, conversionRate: 10.2 }
            ]
          },
          goals: {
            monthlyTarget: 20000,
            currentProgress: 15000,
            daysRemaining: 15
          }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = async () => {
    try {
      const response = await api.get(`/api/affiliate-panel/analytics/export?days=${dateRange}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-${dateRange}days-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export analytics data');
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '₹0';
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(Number(amount));
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.0%';
    }
    return `${Number(value).toFixed(1)}%`;
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (trend) => {
    return trend > 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    );
  };

  if (loading) {
    return (
      <AffiliatePanelLayout title="Sales & Analytics" subtitle="Track your performance and earnings">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      </AffiliatePanelLayout>
    );
  }

  return (
    <AffiliatePanelLayout title="Sales & Analytics" subtitle="Track your performance and earnings">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Unable to load analytics data</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  {error.includes('404') && (
                    <div className="mt-2">
                      <p>This could be due to:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Backend server is not running</li>
                        <li>API endpoint is not available</li>
                        <li>Authentication token has expired</li>
                      </ul>
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 text-xs">
                        <strong>Note:</strong> Sample data is being displayed below for demonstration purposes.
                      </div>
                      <div className="mt-3">
                        <button
                          onClick={() => navigate('/affiliate-login')}
                          className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md mr-2"
                        >
                          Re-login
                        </button>
                        <button
                          onClick={fetchAnalyticsData}
                          className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
            <button
              onClick={fetchAnalyticsData}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                const token = localStorage.getItem('affiliateToken');
                const data = localStorage.getItem('affiliateData');
                console.log('Debug Info:');
                console.log('Has affiliate token:', !!token);
                console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'None');
                console.log('Has affiliate data:', !!data);
                console.log('Affiliate data:', data ? JSON.parse(data) : 'None');
                alert(`Debug info logged to console. Has token: ${!!token}, Has data: ${!!data}`);
              }}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            >
              Debug Auth
            </button>
            <button
              onClick={exportAnalytics}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analyticsData.overview.totalEarnings)}
                </p>
                <div className="flex items-center mt-2 text-sm">
                  {getTrendIcon(12.5)}
                  <span className="ml-1 text-green-600">+12.5% from last period</span>
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.overview.totalReferrals}
                </p>
                <div className="flex items-center mt-2 text-sm">
                  {getTrendIcon(8.2)}
                  <span className="ml-1 text-green-600">+8.2% from last period</span>
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercentage(analyticsData.overview.conversionRate)}
                </p>
                <div className="flex items-center mt-2 text-sm">
                  {getTrendIcon(-2.1)}
                  <span className="ml-1 text-red-600">-2.1% from last period</span>
                </div>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analyticsData.overview.avgOrderValue)}
                </p>
                <div className="flex items-center mt-2 text-sm">
                  {getTrendIcon(5.7)}
                  <span className="ml-1 text-green-600">+5.7% from last period</span>
                </div>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <BarChart3 className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Goal Progress */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Monthly Goal Progress</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              {analyticsData.goals.daysRemaining} days remaining
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {formatCurrency(analyticsData.goals.currentProgress)} of {formatCurrency(analyticsData.goals.monthlyTarget)}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {formatPercentage(
                  analyticsData.goals.monthlyTarget > 0
                    ? (analyticsData.goals.currentProgress / analyticsData.goals.monthlyTarget) * 100
                    : 0
                )}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(
                  analyticsData.goals.monthlyTarget > 0
                    ? (analyticsData.goals.currentProgress / analyticsData.goals.monthlyTarget) * 100
                    : 0
                )}`}
                style={{
                  width: `${Math.min(
                    analyticsData.goals.monthlyTarget > 0
                      ? (analyticsData.goals.currentProgress / analyticsData.goals.monthlyTarget) * 100
                      : 0,
                    100
                  )}%`
                }}
              />
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Goal started this month</span>
              <span>
                {formatCurrency(Math.max(analyticsData.goals.monthlyTarget - analyticsData.goals.currentProgress, 0))} remaining
              </span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Earnings Trend */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Earnings Trend</h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2">Chart visualization will be implemented here</p>
                <p className="text-sm">Integration with Chart.js or similar library needed</p>
              </div>
            </div>
          </div>

          {/* Referrals by Source */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Referrals by Source</h3>
            <div className="space-y-4">
              {analyticsData.performance.bySource.length > 0 ? (
                analyticsData.performance.bySource.map((source, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-${['blue', 'green', 'purple', 'yellow'][index % 4]}-500`} />
                      <span className="text-sm font-medium text-gray-700">{source.name || 'Unknown'}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{source.referrals || source.count || 0}</div>
                      <div className="text-xs text-gray-500">{formatPercentage(source.percentage || 0)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No referral source data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performing Links */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Links</h3>
            <div className="space-y-4">
              {analyticsData.performance.topLinks.length > 0 ? (
                analyticsData.performance.topLinks.map((link, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{link.name || 'Unknown Link'}</div>
                        <div className="text-xs text-gray-500">{link.clicks || 0} clicks</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(link.earnings || 0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatPercentage(link.conversionRate || 0)} conversion
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No link performance data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Performance by Day of Week */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance by Day</h3>
            <div className="space-y-3">
              {analyticsData.performance.byDayOfWeek.length > 0 ? (
                analyticsData.performance.byDayOfWeek.map((day, index) => {
                  const maxEarnings = Math.max(...analyticsData.performance.byDayOfWeek.map(d => d.earnings || 0));
                  const percentage = maxEarnings > 0 ? ((day.earnings || 0) / maxEarnings) * 100 : 0;

                  return (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{day.day || 'Unknown'}</span>
                      <div className="flex items-center gap-4">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-16 text-right">
                          {formatCurrency(day.earnings || 0)}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No daily performance data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <Award className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Performance Insights
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Your best performing day is {
                    analyticsData.performance.byDayOfWeek.length > 0
                      ? analyticsData.performance.byDayOfWeek.reduce((best, current) =>
                          (current.earnings || 0) > (best.earnings || 0) ? current : best
                        ).day || 'Unknown'
                      : 'No data available'
                  }</li>
                  <li>Top referral source: {
                    analyticsData.performance.bySource.length > 0
                      ? analyticsData.performance.bySource[0]?.name || 'Unknown'
                      : 'No data available'
                  }</li>
                  <li>Your conversion rate is {(analyticsData.overview.conversionRate || 0) > 5 ? 'above' : 'below'} industry average</li>
                  <li>Consider focusing on {(analyticsData.overview.clickThroughRate || 0) < 3 ? 'improving click-through rates' : 'conversion optimization'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AffiliatePanelLayout>
  );
};

export default AffiliateSalesAnalytics;

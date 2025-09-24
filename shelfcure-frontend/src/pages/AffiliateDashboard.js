import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AffiliatePanelLayout from '../components/AffiliatePanelLayout';
import api from '../utils/api';
import {
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Eye,
  Copy,
  QrCode,
  FileText,
  UserPlus,
  CreditCard,
  BarChart3,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';

const AffiliateDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/affiliate-panel/dashboard');

      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      if (error.response?.status === 401) {
        navigate('/affiliate-login');
      } else {
        setError('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  if (loading) {
    return (
      <AffiliatePanelLayout title="Dashboard" subtitle="Welcome to your affiliate dashboard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      </AffiliatePanelLayout>
    );
  }

  if (error) {
    return (
      <AffiliatePanelLayout title="Dashboard" subtitle="Welcome to your affiliate dashboard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Retry
            </button>
          </div>
        </div>
      </AffiliatePanelLayout>
    );
  }

  const { affiliate, metrics, earnings, referrals, recentActivity } = dashboardData || {};

  return (
    <AffiliatePanelLayout title="Dashboard" subtitle={`Welcome back, ${affiliate?.name || 'Affiliate'}!`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Lifetime Earnings</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">₹{(metrics?.lifetimeEarnings || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{metrics?.lifetimeReferrals || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Commission Rate</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{metrics?.commissionRate || 0}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">This Month</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">₹{(metrics?.last7DaysPerformance?.earnings || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Earnings & Referrals */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Earnings Breakdown */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4 sm:mb-6">Earnings Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">₹{(earnings?.total || 0).toLocaleString()}</div>
                  <div className="text-xs sm:text-sm text-gray-500">Total Earnings</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-yellow-600">₹{(earnings?.pending || 0).toLocaleString()}</div>
                  <div className="text-xs sm:text-sm text-gray-500">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">₹{(earnings?.paid || 0).toLocaleString()}</div>
                  <div className="text-xs sm:text-sm text-gray-500">Paid Out</div>
                </div>
              </div>
            </div>

            {/* Referral Statistics */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Referral Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{referrals?.total || 0}</div>
                  <div className="text-sm text-gray-500">Total Referrals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{referrals?.active || 0}</div>
                  <div className="text-sm text-gray-500">Active Stores</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{referrals?.conversionRate || 0}%</div>
                  <div className="text-sm text-gray-500">Conversion Rate</div>
                </div>
              </div>
            </div>

            {/* Affiliate Links Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Your Affiliate Links</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unique Referral Code
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={affiliate?.affiliateCode || ''}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50"
                    />
                    <button
                      onClick={() => copyToClipboard(affiliate?.affiliateCode || '')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referral Link
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={`${window.location.origin}/register?ref=${affiliate?.affiliateCode || ''}`}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/register?ref=${affiliate?.affiliateCode || ''}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                </div>

                <div className="flex space-x-4 mt-4">
                  <button
                    onClick={() => navigate('/affiliate-panel/links-qr')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <QrCode className="w-4 h-4" />
                    Generate QR Code
                  </button>
                  <button
                    onClick={() => navigate('/affiliate-panel/marketing-resources')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    <FileText className="w-4 h-4" />
                    Marketing Materials
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Recent Activity */}
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Recent Activity</h3>
              {(recentActivity || []).length > 0 ? (
                <div className="space-y-4">
                  {(recentActivity || []).map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          activity.status === 'approved' ? 'bg-green-400' :
                          activity.status === 'pending' ? 'bg-yellow-400' :
                          'bg-gray-400'
                        }`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          {activity.type === 'initial' ? 'New referral' : 'Recurring commission'}
                        </p>
                        <p className="text-sm text-gray-500">
                          ₹{activity.amount} from {activity.store}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/affiliate-panel/referrals')}
                  className="w-full text-left px-4 py-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-3"
                >
                  <Eye className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">View All Referrals</div>
                    <div className="text-sm text-gray-500">Track your referred stores</div>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/affiliate-panel/commissions')}
                  className="w-full text-left px-4 py-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-3"
                >
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">Commission History</div>
                    <div className="text-sm text-gray-500">View earnings details</div>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/affiliate-panel/payment-settings')}
                  className="w-full text-left px-4 py-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-3"
                >
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">Payment Settings</div>
                    <div className="text-sm text-gray-500">Update payout details</div>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/affiliate-panel/pharmacy-onboarding')}
                  className="w-full text-left px-4 py-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-3"
                >
                  <UserPlus className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">Submit New Pharmacy</div>
                    <div className="text-sm text-gray-500">Add pharmacy onboarding</div>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/affiliate-panel/analytics')}
                  className="w-full text-left px-4 py-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-3"
                >
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">Sales Analytics</div>
                    <div className="text-sm text-gray-500">View performance metrics</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AffiliatePanelLayout>
  );
};

export default AffiliateDashboard;

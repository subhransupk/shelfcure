import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  TrendingUp,
  DollarSign,
  Mail,
  Eye,
  CheckCircle,
  Clock,
  Share2,
  QrCode,
  BarChart3,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AffiliatePanelLayout from '../components/AffiliatePanelLayout';
import api from '../utils/api';

const AffiliateReferralDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/affiliate-panel/referrals/dashboard');

      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Referral dashboard fetch error:', error);
      if (error.response?.status === 401) {
        navigate('/affiliate-login');
      } else {
        // Provide mock data for testing if API is not ready
        setDashboardData({
          affiliate: {
            name: 'Test Affiliate',
            affiliateCode: 'AFF001',
            referralLevel: 0,
            canRefer: true
          },
          invitationStats: {
            totalInvitations: 0,
            activeInvitations: 0,
            conversionRate: 0,
            openRate: 0,
            openedInvitations: 0
          },
          directReferrals: [],
          recentCommissions: [],
          earnings: {
            totalEarnings: 0,
            pendingEarnings: 0
          }
        });
        setError('Using demo data - API not available');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AffiliatePanelLayout title="Referral Management" subtitle="Manage your affiliate referrals and track your earnings">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      </AffiliatePanelLayout>
    );
  }

  const { affiliate, invitationStats, directReferrals, recentCommissions, earnings } = dashboardData;

  return (
    <AffiliatePanelLayout title="Referral Management" subtitle="Manage your affiliate referrals and track your earnings">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        {/* Referral Level Warning */}
        {!affiliate?.canRefer && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-yellow-600 mr-2" />
              <p>
                You have reached the maximum referral level (Level {affiliate?.referralLevel}) and cannot refer new affiliates.
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        {affiliate?.canRefer && (
          <div className="mb-6 sm:mb-8 flex justify-end">
            <button
              onClick={() => navigate('/affiliate-panel/referrals/invite')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Invite New Affiliate
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Invitations</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{invitationStats?.totalInvitations || 0}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs sm:text-sm">
              <span className="text-green-600">
                {invitationStats?.conversionRate || 0}% conversion rate
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Active Referrals</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{invitationStats?.activeInvitations || 0}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs sm:text-sm">
              <span className="text-gray-600">
                {directReferrals?.length || 0} total referrals
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Referral Earnings</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">₹{earnings?.totalEarnings?.toLocaleString() || 0}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs sm:text-sm">
              <span className="text-gray-600">
                ₹{earnings?.pendingEarnings?.toLocaleString() || 0} pending
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Open Rate</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{invitationStats?.openRate || 0}%</p>
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs sm:text-sm">
              <span className="text-gray-600">
                {invitationStats?.openedInvitations || 0} opened
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {affiliate?.canRefer && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/affiliate-panel/referrals/invite')}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <UserPlus className="h-5 w-5 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Send Invitation</p>
                  <p className="text-sm text-gray-600">Invite new affiliates via email</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/affiliate-panel/referrals/materials')}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Share2 className="h-5 w-5 text-blue-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Referral Materials</p>
                  <p className="text-sm text-gray-600">Get links, QR codes, templates</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/affiliate-panel/referrals/analytics')}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">View Analytics</p>
                  <p className="text-sm text-gray-600">Performance insights & reports</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* My Referrals */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">My Referrals</h3>
                <button
                  onClick={() => navigate('/affiliate-panel/referrals/list')}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              {directReferrals?.length > 0 ? (
                <div className="space-y-4">
                  {directReferrals.slice(0, 5).map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{referral.name}</p>
                          <p className="text-sm text-gray-600">{referral.affiliateCode}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ₹{referral.totalEarnings.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">
                          {referral.totalReferrals} referrals
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No referrals yet</p>
                  {affiliate?.canRefer && (
                    <button
                      onClick={() => navigate('/affiliate-panel/referrals/invite')}
                      className="mt-2 text-green-600 hover:text-green-700 font-medium"
                    >
                      Send your first invitation
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Recent Commissions */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Commissions</h3>
                <button
                  onClick={() => navigate('/affiliate-panel/commission-history')}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              {recentCommissions?.length > 0 ? (
                <div className="space-y-4">
                  {recentCommissions.map((commission) => (
                    <div key={commission.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <DollarSign className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {commission.sellingAffiliate?.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(commission.earnedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ₹{commission.amount.toLocaleString()}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          commission.status === 'paid' 
                            ? 'bg-green-100 text-green-800'
                            : commission.status === 'approved'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {commission.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No commissions yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Commissions will appear when your referrals make sales
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AffiliatePanelLayout>
  );
};

export default AffiliateReferralDashboard;

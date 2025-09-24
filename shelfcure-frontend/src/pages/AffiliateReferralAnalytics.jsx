import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  TrendingUp,
  Users,
  Mail,
  Eye,
  CheckCircle,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AffiliatePanelLayout from '../components/AffiliatePanelLayout';
import api from '../utils/api';

const AffiliateReferralAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const navigate = useNavigate();

  const periodOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' }
  ];

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/affiliate-panel/referrals/analytics?period=${selectedPeriod}`);

      if (response.data.success) {
        setAnalyticsData(response.data.data);
      }
    } catch (error) {
      console.error('Fetch analytics error:', error);
      if (error.response?.status === 401) {
        navigate('/affiliate-login');
      } else {
        setError('Failed to fetch analytics');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchAnalytics}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { 
    invitationAnalytics, 
    commissionAnalytics, 
    performanceComparison, 
    topReferrals, 
    conversionFunnel 
  } = analyticsData;

  return (
    <AffiliatePanelLayout title="Referral Analytics" subtitle="Track your referral performance and earnings">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/affiliate-panel/referral-management')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1">
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Conversion Funnel */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Conversion Funnel</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{conversionFunnel.invitationsSent}</p>
              <p className="text-sm text-gray-600">Invitations Sent</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Eye className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{conversionFunnel.invitationsOpened}</p>
              <p className="text-sm text-gray-600">Opened ({conversionFunnel.openRate}%)</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{conversionFunnel.affiliatesRegistered}</p>
              <p className="text-sm text-gray-600">Registered ({conversionFunnel.conversionRate}%)</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{conversionFunnel.affiliatesActive}</p>
              <p className="text-sm text-gray-600">Active ({conversionFunnel.activationRate}%)</p>
            </div>
          </div>
        </div>

        {/* Performance Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Breakdown</h3>
            <div className="space-y-4">
              {performanceComparison.recurring && (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Direct Sales</p>
                      <p className="text-sm text-gray-600">{performanceComparison.recurring.count} commissions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹{performanceComparison.recurring.totalAmount.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Avg: ₹{Math.round(performanceComparison.recurring.avgAmount).toLocaleString()}</p>
                  </div>
                </div>
              )}
              
              {performanceComparison.referral_onetime && (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Referral Commissions</p>
                      <p className="text-sm text-gray-600">{performanceComparison.referral_onetime.count} commissions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹{performanceComparison.referral_onetime.totalAmount.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Avg: ₹{Math.round(performanceComparison.referral_onetime.avgAmount).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top Performing Referrals */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Referrals</h3>
            {topReferrals.length > 0 ? (
              <div className="space-y-3">
                {topReferrals.map((referral, index) => (
                  <div key={referral.affiliate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-yellow-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{referral.affiliate.name}</p>
                        <p className="text-sm text-gray-600">{referral.affiliate.affiliateCode}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹{referral.totalEarnings.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">{referral.commissionsCount} sales</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No referral commissions yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Invitation Trends */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invitation Trends</h3>
            {invitationAnalytics.length > 0 ? (
              <div className="space-y-4">
                {invitationAnalytics.slice(-7).map((day) => (
                  <div key={day._id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{new Date(day._id).toLocaleDateString()}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-blue-600">{day.invitationsSent} sent</span>
                      <span className="text-yellow-600">{day.invitationsOpened} opened</span>
                      <span className="text-green-600">{day.invitationsConverted} converted</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No invitation data for this period</p>
              </div>
            )}
          </div>

          {/* Commission Trends */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission Trends</h3>
            {commissionAnalytics.length > 0 ? (
              <div className="space-y-4">
                {commissionAnalytics.slice(-7).map((day) => (
                  <div key={day._id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{new Date(day._id).toLocaleDateString()}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-600">{day.commissionsEarned} commissions</span>
                      <span className="font-medium text-gray-900">₹{Math.round(day.totalAmount).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No commission data for this period</p>
              </div>
            )}
          </div>
        </div>

        {/* Insights */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-3">📊 Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <p className="font-medium mb-1">Conversion Performance:</p>
              <ul className="space-y-1">
                <li>• Your open rate is {conversionFunnel.openRate}% (industry avg: 20-25%)</li>
                <li>• Your conversion rate is {conversionFunnel.conversionRate}% (industry avg: 2-5%)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Recommendations:</p>
              <ul className="space-y-1">
                <li>• {conversionFunnel.openRate < 20 ? 'Improve email subject lines' : 'Great email engagement!'}</li>
                <li>• {conversionFunnel.conversionRate < 2 ? 'Add more personal touches to invitations' : 'Excellent conversion rate!'}</li>
              </ul>
            </div>
          </div>
        </div>
        </div>
      </div>
    </AffiliatePanelLayout>
  );
};

export default AffiliateReferralAnalytics;

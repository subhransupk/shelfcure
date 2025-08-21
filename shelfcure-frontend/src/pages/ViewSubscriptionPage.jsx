import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import { API_ENDPOINTS, makeAuthenticatedRequest } from '../config/api';
import {
  ArrowLeft, CreditCard, Store, User, Calendar, 
  CheckCircle, XCircle, Clock, DollarSign, FileText,
  Mail, Phone, MapPin, Package
} from 'lucide-react';

const ViewSubscriptionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubscription();
  }, [id]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const data = await makeAuthenticatedRequest(`${API_ENDPOINTS.ADMIN_SUBSCRIPTIONS}/${id}`);

      if (data.success) {
        setSubscriptionData(data.data);
      } else {
        setError(data.message || 'Failed to fetch subscription details');
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setError('Error fetching subscription details');
      if (error.message === 'Authentication failed') {
        navigate('/admin-login');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanBadgeColor = (plan) => {
    switch (plan) {
      case 'basic': return 'bg-gray-100 text-gray-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading subscription details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/admin/subscriptions')}
              className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
            >
              Back to Subscriptions
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!subscriptionData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Subscription Not Found</h2>
            <p className="text-gray-600 mb-4">The subscription you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/admin/subscriptions')}
              className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
            >
              Back to Subscriptions
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // subscriptionData now contains the subscription data directly
  const subscription = subscriptionData;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/subscriptions')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 text-left">Subscription Details</h1>
              <p className="text-gray-600 text-left">View subscription and billing information</p>
            </div>
          </div>
        </div>

        {/* Subscription Overview Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                <CreditCard className="w-10 h-10 text-primary-500" />
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold text-left">{subscription.userName}</h2>
                <p className="text-primary-100 text-left">{subscription.userEmail}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(subscription.status)}`}>
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanBadgeColor(subscription.plan.toLowerCase())}`}>
                    {subscription.plan} Plan
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 text-left">User Information</h3>

                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 text-left">User Name</p>
                    <p className="text-gray-900 text-left">{subscription.userName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 text-left">Email</p>
                    <p className="text-gray-900 text-left">{subscription.userEmail}</p>
                  </div>
                </div>

                {subscription.userPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 text-left">Phone</p>
                      <p className="text-gray-900 text-left">{subscription.userPhone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Store className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 text-left">Store Count</p>
                    <p className="text-gray-900 text-left">{subscription.storeCount} / {subscription.storeLimit}</p>
                  </div>
                </div>
              </div>

              {/* Subscription Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 text-left">Subscription Information</h3>

                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 text-left">Plan</p>
                    <p className="text-gray-900 text-left">{subscription.plan}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 text-left">Start Date</p>
                    <p className="text-gray-900 text-left">{formatDate(subscription.startDate)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 text-left">End Date</p>
                    <p className="text-gray-900 text-left">{formatDate(subscription.endDate)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 text-left">Amount</p>
                    <p className="text-gray-900 text-left">₹{subscription.amount}</p>
                  </div>
                </div>

                {subscription.billingCycle && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 text-left">Billing Cycle</p>
                      <p className="text-gray-900 text-left">{subscription.billingCycle}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 text-left">Payment Status</p>
                <p className="text-2xl font-bold text-gray-900 text-left">{subscription.paymentStatus || 'Pending'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 text-left">Subscription Amount</p>
                <p className="text-2xl font-bold text-gray-900 text-left">₹{subscription.amount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 text-left">Remaining Days</p>
                <p className="text-2xl font-bold text-gray-900 text-left">{subscription.remainingDays || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Features */}
        {subscription.features && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 text-left flex items-center gap-2">
                <Package className="w-5 h-5" />
                Subscription Features
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(subscription.features).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-sm text-gray-900">
                      {typeof value === 'boolean' ? (value ? '✓' : '✗') : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ViewSubscriptionPage;

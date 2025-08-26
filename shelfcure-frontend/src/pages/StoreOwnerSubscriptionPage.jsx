import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Calendar, 
  CheckCircle,
  XCircle,
  Clock,
  Store,
  Users,
  Package,
  Zap,
  Shield,
  TrendingUp,
  Download,
  RefreshCw,
  AlertCircle,
  Crown,
  Star,
  ArrowRight
} from 'lucide-react';
import StoreOwnerLayout from '../components/store-owner/StoreOwnerLayout';

const StoreOwnerSubscriptionPage = () => {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch current subscription
      const subscriptionResponse = await fetch('http://localhost:5000/api/store-owner/subscription', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      // Fetch available plans
      const plansResponse = await fetch('http://localhost:5000/api/store-owner/subscription/plans', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      // Fetch payment history
      const historyResponse = await fetch('http://localhost:5000/api/store-owner/subscription/payment-history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        setSubscription(subscriptionData.data);
      }

      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setAvailablePlans(plansData.data || []);
      }

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setPaymentHistory(historyData.data || []);
      }

    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setError('Failed to load subscription information');
      
      // Mock data for development
      setSubscription({
        plan: 'standard',
        status: 'active',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        storeCountLimit: 3,
        currentStoreCount: 2,
        billingDuration: 'yearly',
        features: {
          multiStore: true,
          analytics: true,
          whatsappIntegration: true,
          billOCR: false,
          customReports: false,
          inventoryManagement: true,
          customerManagement: true,
          staffManagement: true
        },
        pricing: { amount: 19999, currency: 'INR' }
      });

      setAvailablePlans([
        {
          name: 'Basic',
          id: 'basic',
          price: 999,
          storeLimit: 1,
          features: ['Analytics', 'Inventory Management', 'Customer Management', 'Staff Management'],
          popular: false
        },
        {
          name: 'Standard',
          id: 'standard',
          price: 1999,
          storeLimit: 3,
          features: ['Multi-Store', 'Analytics', 'WhatsApp Integration', 'Inventory Management', 'Customer Management', 'Staff Management'],
          popular: true
        },
        {
          name: 'Premium',
          id: 'premium',
          price: 2999,
          storeLimit: 10,
          features: ['Multi-Store', 'Analytics', 'WhatsApp Integration', 'Bill OCR', 'Custom Reports', 'Inventory Management', 'Customer Management', 'Staff Management'],
          popular: false
        }
      ]);

      setPaymentHistory([
        { id: 1, date: '2024-01-01', amount: 19999, status: 'completed', plan: 'Standard', duration: 'Yearly' },
        { id: 2, date: '2023-01-01', amount: 19999, status: 'completed', plan: 'Standard', duration: 'Yearly' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSubscriptionData();
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
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
              <h1 className="text-2xl font-semibold text-gray-900">Subscription Management</h1>
              <p className="mt-2 text-sm text-gray-700">
                Manage your subscription plan, billing, and payment history.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex items-center space-x-3">
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

              {/* Download Invoice */}
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Invoice
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Current Subscription Card */}
          {subscription && (
            <div className="mt-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">Current Subscription</h2>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subscription.status)}`}>
                      {subscription.status?.charAt(0).toUpperCase() + subscription.status?.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Plan Details */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center mb-4">
                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mr-4">
                          <Crown className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {subscription.plan?.charAt(0).toUpperCase() + subscription.plan?.slice(1)} Plan
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(subscription.pricing?.amount)} / {subscription.billingDuration}
                          </p>
                        </div>
                      </div>

                      {/* Usage Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <Store className="h-5 w-5 text-blue-600 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-gray-600">Stores Used</p>
                              <p className="text-lg font-bold text-gray-900">
                                {subscription.currentStoreCount} / {subscription.storeCountLimit}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-gray-600">Days Remaining</p>
                              <p className="text-lg font-bold text-gray-900">
                                {getDaysRemaining(subscription.endDate)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Features */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Included Features</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(subscription.features || {}).map(([feature, enabled]) => (
                            <div key={feature} className="flex items-center">
                              {enabled ? (
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              ) : (
                                <XCircle className="h-4 w-4 text-gray-300 mr-2" />
                              )}
                              <span className={`text-sm ${enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                                {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Billing Info */}
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Billing Information</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Start Date</span>
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(subscription.startDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">End Date</span>
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(subscription.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Billing Cycle</span>
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {subscription.billingDuration}
                          </span>
                        </div>
                        <div className="flex justify-between pt-3 border-t border-gray-200">
                          <span className="text-sm font-medium text-gray-900">Next Payment</span>
                          <span className="text-sm font-bold text-green-600">
                            {formatCurrency(subscription.pricing?.amount)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-6 space-y-2">
                        <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium">
                          Upgrade Plan
                        </button>
                        <button className="w-full bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm font-medium">
                          Manage Billing
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Available Plans */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Available Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {availablePlans.map((plan) => (
                <div key={plan.id} className={`bg-white rounded-lg shadow-sm border-2 ${
                  plan.popular ? 'border-green-500 relative' : 'border-gray-200'
                } overflow-hidden`}>
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
                      <Star className="w-3 h-3 inline mr-1" />
                      Popular
                    </div>
                  )}
                  <div className="p-6">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-gray-900">{formatCurrency(plan.price)}</span>
                        <span className="text-gray-600">/month</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">Up to {plan.storeLimit} store{plan.storeLimit > 1 ? 's' : ''}</p>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      subscription?.plan === plan.id
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : plan.popular
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-white text-green-600 border border-green-600 hover:bg-green-50'
                    }`} disabled={subscription?.plan === plan.id}>
                      {subscription?.plan === plan.id ? 'Current Plan' : 'Choose Plan'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment History */}
          <div className="mt-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Payment History</h2>
              </div>
              <div className="overflow-hidden">
                {paymentHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Plan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paymentHistory.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(payment.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {payment.plan}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {payment.duration}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(payment.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-green-600 hover:text-green-900 mr-3">
                                <Download className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-2">No payment history</h3>
                    <p className="text-sm text-gray-600">Your payment history will appear here once you make payments.</p>
                  </div>
                )}
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
                  <h3 className="font-medium text-gray-900">Manage Stores</h3>
                </div>
                <p className="text-sm text-gray-600">View and manage your store locations</p>
              </button>
              <button
                onClick={() => navigate('/store-owner/analytics')}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 hover:border-green-300 transition-colors text-left group"
              >
                <div className="flex items-center mb-3">
                  <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">View Analytics</h3>
                </div>
                <p className="text-sm text-gray-600">Access detailed performance insights</p>
              </button>
              <button
                onClick={() => navigate('/store-owner/settings')}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 hover:border-purple-300 transition-colors text-left group"
              >
                <div className="flex items-center mb-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center mr-3 group-hover:bg-purple-200 transition-colors">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">Account Settings</h3>
                </div>
                <p className="text-sm text-gray-600">Configure your account preferences</p>
              </button>
              <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                <div className="flex items-center mb-3">
                  <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center mr-3">
                    <Zap className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">Need Help?</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">Contact our support team for assistance</p>
                <button className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center">
                  Contact Support
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StoreOwnerLayout>
  );
};

export default StoreOwnerSubscriptionPage;

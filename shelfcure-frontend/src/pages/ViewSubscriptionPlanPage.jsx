import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import {
  ArrowLeft, Package, DollarSign, Users, Calendar, 
  CheckCircle, XCircle, Edit, Trash2, Clock, Shield,
  Zap, Database, Smartphone, BarChart, FileText, Settings
} from 'lucide-react';

const ViewSubscriptionPlanPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [planData, setPlanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlan();
  }, [id]);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      if (!token) {
        navigate('/admin/login');
        return;
      }

      const response = await fetch(`/api/subscriptions/plans/admin/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setPlanData(data.data);
      } else {
        setError(data.message || 'Failed to fetch plan details');
      }
    } catch (error) {
      console.error('Error fetching plan:', error);
      setError('Error fetching plan details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async () => {
    if (window.confirm('Are you sure you want to delete this subscription plan? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('adminToken');
        
        const response = await fetch(`/api/subscriptions/plans/admin/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (data.success) {
          alert('Subscription plan deleted successfully!');
          navigate('/admin/subscription-plans');
        } else {
          alert(`Failed to delete plan: ${data.message}`);
        }
      } catch (error) {
        console.error('Error deleting plan:', error);
        alert('Error deleting subscription plan. Please try again.');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
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
              onClick={() => navigate('/admin/subscription-plans')}
              className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
            >
              Back to Plans
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!planData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Plan Not Found</h2>
            <p className="text-gray-600 mb-4">The subscription plan you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/admin/subscription-plans')}
              className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
            >
              Back to Plans
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/subscription-plans')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 text-left">Subscription Plan Details</h1>
              <p className="text-gray-600 text-left">View and manage subscription plan information</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/admin/subscription-plans/${id}/edit`)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Plan
            </button>
            <button
              onClick={handleDeletePlan}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Plan
            </button>
          </div>
        </div>

        {/* Plan Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-primary-500" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 text-left">{planData.name}</h2>
                  <p className="text-gray-600 text-left capitalize">{planData.planType} Plan</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {planData.isActive ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircle className="w-3 h-3 mr-1" />
                    Inactive
                  </span>
                )}
                {planData.isPopular && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Popular
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Pricing */}
              <div className="text-left">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Monthly Price</h3>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(planData.pricing.monthly)}</p>
              </div>
              
              <div className="text-left">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Yearly Price</h3>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(planData.pricing.yearly)}</p>
                <p className="text-sm text-green-600">Save {planData.pricing.discountPercentage || 0}%</p>
              </div>

              {/* Subscribers */}
              <div className="text-left">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Active Subscribers</h3>
                <p className="text-2xl font-bold text-gray-900">{planData.subscriberCount || 0}</p>
              </div>

              {/* Created Date */}
              <div className="text-left">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Created Date</h3>
                <p className="text-sm text-gray-900">{formatDate(planData.createdAt)}</p>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 text-left">Description</h3>
              <p className="text-gray-600 text-left">{planData.description}</p>
            </div>
          </div>
        </div>

        {/* Features and Limits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Core Features */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 text-left flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Core Features
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {[
                  { key: 'inventoryManagement', label: 'Inventory Management', value: true },
                  { key: 'salesAnalytics', label: 'Sales Analytics', value: planData.features?.analytics || false },
                  { key: 'customerManagement', label: 'Customer Management', value: true },
                  { key: 'supplierManagement', label: 'Supplier Management', value: planData.planType !== 'basic' }
                ].map(({ key, label, value }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 text-left">
                      {label}
                    </span>
                    {value ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Features */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 text-left flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Advanced Features
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {[
                  { key: 'expenseTracking', label: 'Expense Tracking', value: planData.features?.advancedAnalytics || false },
                  { key: 'staffManagement', label: 'Staff Management', value: planData.limits?.maxUsers > 1 },
                  { key: 'prescriptionManagement', label: 'Prescription Management', value: planData.planType !== 'basic' },
                  { key: 'wasteManagement', label: 'Waste Management', value: planData.features?.advancedAnalytics || false },
                  { key: 'storageManagement', label: 'Storage Management', value: planData.features?.advancedAnalytics || false },
                  { key: 'advancedReports', label: 'Advanced Reports', value: planData.features?.customReports || false },
                  { key: 'multiLocationSupport', label: 'Multi-location Support', value: planData.features?.multiStore || false },
                  { key: 'apiAccess', label: 'API Access', value: planData.features?.apiAccess || false }
                ].map(({ key, label, value }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 text-left">
                      {label}
                    </span>
                    {value ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Limits & Quotas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 text-left flex items-center gap-2">
              <Database className="w-5 h-5" />
              Limits & Quotas
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 text-left">Max Users</span>
                  <span className="text-sm font-medium text-gray-900">{planData.limits.maxUsers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 text-left">Max Products</span>
                  <span className="text-sm font-medium text-gray-900">
                    {planData.limits.maxProducts === -1 ? 'Unlimited' : planData.limits.maxProducts}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 text-left">Max Stores</span>
                  <span className="text-sm font-medium text-gray-900">{planData.limits.maxStores}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 text-left">Storage Limit</span>
                  <span className="text-sm font-medium text-gray-900">{planData.limits.storageLimit}GB</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 text-left">Monthly Transactions</span>
                  <span className="text-sm font-medium text-gray-900">
                    {planData.limits.maxTransactionsPerMonth === -1 ? 'Unlimited' : planData.limits.maxTransactionsPerMonth}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trial Settings */}
        {planData.trial && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 text-left flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Trial Settings
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-left">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Trial Enabled</h4>
                  <p className="text-sm text-gray-900">
                    {planData.trial.enabled ? 'Yes' : 'No'}
                  </p>
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Trial Duration</h4>
                  <p className="text-sm text-gray-900">
                    {planData.trial.durationDays} days
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ViewSubscriptionPlanPage;

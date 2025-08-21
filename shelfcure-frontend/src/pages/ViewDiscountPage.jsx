import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import { makeAuthenticatedRequest, API_ENDPOINTS } from '../config/api';
import {
  ArrowLeft, Edit, Trash2, Copy, Calendar, Percent,
  Users, TrendingUp, DollarSign, CheckCircle, XCircle,
  Clock, AlertCircle, Eye, MoreVertical
} from 'lucide-react';

const ViewDiscountPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [discount, setDiscount] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch discount details
  useEffect(() => {
    const fetchDiscount = async () => {
      try {
        setLoading(true);
        const response = await makeAuthenticatedRequest(
          `${API_ENDPOINTS.ADMIN_DISCOUNTS}/${id}`,
          {
            method: 'GET'
          }
        );

        if (response.success) {
          setDiscount(response.data);
        }
      } catch (error) {
        console.error('Error fetching discount:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDiscount();
    }
  }, [id]);

  // Delete discount handler
  const handleDeleteDiscount = async () => {
    if (!window.confirm('Are you sure you want to delete this discount? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await makeAuthenticatedRequest(
        `${API_ENDPOINTS.ADMIN_DISCOUNTS}/${id}`,
        {
          method: 'DELETE'
        }
      );

      if (response.success) {
        navigate('/admin/discounts');
      }
    } catch (error) {
      console.error('Error deleting discount:', error);
      alert('Failed to delete discount. Please try again.');
    }
  };

  // Helper functions
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (isActive) => {
    if (isActive) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-red-100 text-red-800';
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'percentage':
        return 'bg-blue-100 text-blue-800';
      case 'fixed_amount':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Loading..." subtitle="Please wait while we load the discount details">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!discount) {
    return (
      <AdminLayout title="Discount Not Found" subtitle="The requested discount could not be found">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Discount not found</h3>
          <p className="mt-1 text-sm text-gray-500">The discount you're looking for doesn't exist.</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/admin/discounts')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Discounts
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title={`Discount: ${discount.code}`}
      subtitle={discount.name}
      rightHeaderContent={
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/discounts')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Discounts
          </button>
          <button
            onClick={() => navigate(`/admin/discounts/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit Discount
          </button>
          <button
            onClick={handleDeleteDiscount}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
          </div>
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Code
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-mono font-bold text-gray-900">{discount.code}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(discount.code)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title="Copy code"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(discount.isActive)}`}>
                  {discount.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Name
                </label>
                <p className="text-gray-900">{discount.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type & Value
                </label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(discount.type)}`}>
                  {discount.type === 'percentage' ? `${discount.value}%` : formatCurrency(discount.value)}
                </span>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <p className="text-gray-900">{discount.description || 'No description provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Limits & Statistics */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Usage & Statistics</h3>
          </div>
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Uses
                </label>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className="text-2xl font-bold text-gray-900">
                    {discount.stats?.totalUses || 0}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Discount Given
                </label>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-500" />
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(discount.stats?.totalDiscountGiven || 0)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unique Customers
                </label>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span className="text-2xl font-bold text-gray-900">
                    {discount.stats?.uniqueCustomers || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Validity Period */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Validity Period</h3>
          </div>
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid From
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    {formatDate(discount.validity?.startDate)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid Until
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    {formatDate(discount.validity?.endDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Limits & Restrictions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Limits & Restrictions</h3>
          </div>
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Uses
                </label>
                <p className="text-gray-900">
                  {discount.limits?.maxUses === -1 ? 'Unlimited' : discount.limits?.maxUses || 'Not set'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Uses Per Customer
                </label>
                <p className="text-gray-900">
                  {discount.limits?.maxUsesPerCustomer || 'Not set'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Order Amount
                </label>
                <p className="text-gray-900">
                  {formatCurrency(discount.limits?.minOrderAmount || 0)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Discount Amount
                </label>
                <p className="text-gray-900">
                  {discount.limits?.maxDiscountAmount === -1 ? 'No limit' : formatCurrency(discount.limits?.maxDiscountAmount || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ViewDiscountPage;

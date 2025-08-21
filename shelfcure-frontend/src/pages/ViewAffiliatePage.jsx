import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import axios from 'axios';
import {
  ArrowLeft, Edit, Mail, Phone, Calendar, MapPin, 
  DollarSign, Users, TrendingUp, CheckCircle, Clock,
  AlertTriangle, Copy, Link, Eye, BarChart3, Target,
  Award, Building, User, FileText
} from 'lucide-react';

// Set up axios defaults
axios.defaults.baseURL = 'http://localhost:5000';

// Add request interceptor to include auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const ViewAffiliatePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [affiliate, setAffiliate] = useState(null);

  // Fetch affiliate details
  const fetchAffiliate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/affiliates/admin/${id}`);
      
      if (response.data.success) {
        setAffiliate(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch affiliate details');
      }
    } catch (error) {
      console.error('Error fetching affiliate:', error);
      if (error.response?.status === 401) {
        setError('Please log in as admin first to access this page.');
      } else if (error.response?.status === 404) {
        setError('Affiliate not found');
      } else {
        setError('Error fetching affiliate details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliate();
  }, [id]);

  // Utility functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  if (loading) {
    return (
      <AdminLayout title="Loading..." subtitle="Fetching affiliate details">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Error" subtitle="Unable to load affiliate details">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <div className="mt-2 space-x-2">
                {error.includes('log in') ? (
                  <button
                    onClick={() => navigate('/admin/login')}
                    className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Go to Login
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setError(null);
                      fetchAffiliate();
                    }}
                    className="text-sm text-red-600 hover:text-red-500"
                  >
                    Try again
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!affiliate) {
    return (
      <AdminLayout title="Not Found" subtitle="Affiliate not found">
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Affiliate not found</h3>
          <p className="text-gray-500 mb-4">The affiliate you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/admin/affiliates')}
            className="text-primary-600 hover:text-primary-500"
          >
            Back to Affiliates
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title={affiliate.name || 'Affiliate Details'} 
      subtitle={`Affiliate Code: ${affiliate.affiliateCode}`}
      rightHeaderContent={
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/affiliates')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Affiliates
          </button>
          <button
            onClick={() => navigate(`/admin/affiliates/edit/${affiliate._id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit Affiliate
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status Banner */}
        {affiliate.status === 'pending_approval' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Pending Approval</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  This affiliate is waiting for approval. Review their details and approve or reject their application.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(affiliate.stats?.totalEarnings || 0)}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Pending Earnings</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(affiliate.stats?.pendingEarnings || 0)}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold text-blue-600">{affiliate.stats?.totalReferrals || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-purple-600">{affiliate.calculatedConversionRate || 0}%</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{affiliate.name || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{affiliate.email || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{affiliate.phone || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {affiliate.dateOfBirth ? formatDate(affiliate.dateOfBirth) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              {affiliate.bio && (
                <div className="mt-6 text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <p className="text-sm text-gray-900">{affiliate.bio}</p>
                </div>
              )}
            </div>

            {/* Address Information */}
            {(affiliate.address?.street || affiliate.address?.city || affiliate.address?.state || affiliate.address?.pincode || affiliate.city || affiliate.state || affiliate.pincode) && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span className="text-sm text-gray-900">{affiliate.address?.street || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <span className="text-sm text-gray-900">{affiliate.address?.city || affiliate.city || 'N/A'}</span>
                  </div>

                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <span className="text-sm text-gray-900">{affiliate.address?.state || affiliate.state || 'N/A'}</span>
                  </div>

                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                    <span className="text-sm text-gray-900">{affiliate.address?.pincode || affiliate.pincode || 'N/A'}</span>
                  </div>

                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <span className="text-sm text-gray-900">{affiliate.address?.country || 'India'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Commission */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">Status & Commission</h3>
              <div className="space-y-4">
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(affiliate.status)}`}>
                    {affiliate.status?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate</label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-green-600">{affiliate.commission?.rate || 0}%</span>
                  </div>
                </div>
                
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Affiliate Code</label>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                      {affiliate.affiliateCode}
                    </code>
                    <button
                      onClick={() => copyToClipboard(affiliate.affiliateCode)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Copy Code"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                {affiliate.referralLink && (
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Referral Link</label>
                    <div className="flex items-center gap-2">
                      <Link className="w-4 h-4 text-gray-400" />
                      <button
                        onClick={() => copyToClipboard(affiliate.referralLink)}
                        className="text-xs text-blue-600 hover:text-blue-800 truncate"
                        title="Copy Link"
                      >
                        Copy referral link
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">Timeline</h3>
              <div className="space-y-4">
                <div className="text-left">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{formatDate(affiliate.createdAt)}</span>
                  </div>
                  {affiliate.createdBy && (
                    <p className="text-xs text-gray-500 mt-1">by {affiliate.createdBy.name}</p>
                  )}
                </div>
                
                {affiliate.approvedAt && (
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Approved</label>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-gray-900">{formatDate(affiliate.approvedAt)}</span>
                    </div>
                    {affiliate.approvedBy && (
                      <p className="text-xs text-gray-500 mt-1">by {affiliate.approvedBy.name}</p>
                    )}
                  </div>
                )}
                
                {affiliate.updatedAt && affiliate.updatedAt !== affiliate.createdAt && (
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{formatDate(affiliate.updatedAt)}</span>
                    </div>
                    {affiliate.updatedBy && (
                      <p className="text-xs text-gray-500 mt-1">by {affiliate.updatedBy.name}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ViewAffiliatePage;

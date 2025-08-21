import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import axios from 'axios';
import {
  Users, DollarSign, TrendingUp, Eye,
  Search, Filter, Plus, Download, Mail, Phone,
  Calendar, CheckCircle, XCircle, AlertTriangle,
  Link, Copy, BarChart3, Target, Award, Clock,
  Edit, Trash2, MoreVertical, RefreshCw
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

// Add response interceptor to handle auth errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      // Don't redirect automatically, just log the error
      console.warn('Authentication failed - token may be expired');
    }
    return Promise.reject(error);
  }
);

const AdminAffiliatesPage = () => {
  const navigate = useNavigate();

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      console.warn('No admin token found - you may need to log in first');
      setError('Please log in as admin first to access this page.');
      return;
    }
  }, []);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'affiliates', 'commissions', 'analytics'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('thisMonth');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAffiliates, setSelectedAffiliates] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Real data for affiliates
  const [affiliates, setAffiliates] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [analytics, setAnalytics] = useState({
    overview: {
      totalAffiliates: 0,
      activeAffiliates: 0,
      pendingAffiliates: 0,
      totalStores: 0,
      totalCommissions: 0,
      paidCommissions: 0,
      pendingCommissions: 0,
      averageCommissionRate: 0,
      totalCommissionCount: 0
    },
    thisMonth: {
      newAffiliates: 0,
      totalEarnings: 0,
      totalClicks: 0,
      totalConversions: 0,
      conversionRate: 0
    },
    topPerformers: [],
    monthlyTrend: []
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  // API Functions
  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      params.append('page', pagination.page);
      params.append('limit', pagination.limit);

      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await axios.get(`/api/affiliates/admin?${params.toString()}`);

      if (response.data.success) {
        setAffiliates(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.total,
          pages: response.data.pages
        }));
      }
    } catch (error) {
      console.error('Error fetching affiliates:', error);
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else {
        setError('Failed to load affiliates');
      }
      // Set empty data on error to prevent crashes
      setAffiliates([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`/api/affiliates/admin/analytics?period=${dateFilter}`);

      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      }
      // Keep default analytics structure on error
    }
  };

  const fetchCommissions = async () => {
    try {
      const response = await axios.get('/api/affiliates/admin/commissions');

      if (response.data.success) {
        setCommissions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching commissions:', error);
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      }
      // Set empty commissions on error
      setCommissions([]);
    }
  };

  const handleApproveAffiliate = async (affiliateId) => {
    try {
      const response = await axios.put(`/api/affiliates/admin/${affiliateId}/approve`);

      if (response.data.success) {
        setAffiliates(prev => prev.map(affiliate =>
          affiliate._id === affiliateId
            ? { ...affiliate, status: 'active', approvedAt: new Date() }
            : affiliate
        ));
      }
    } catch (error) {
      console.error('Error approving affiliate:', error);
      setError('Failed to approve affiliate');
    }
  };

  const handleUpdateAffiliate = async (affiliateId, updateData) => {
    try {
      const response = await axios.put(`/api/affiliates/admin/${affiliateId}`, updateData);

      if (response.data.success) {
        setAffiliates(prev => prev.map(affiliate =>
          affiliate._id === affiliateId
            ? { ...affiliate, ...response.data.data }
            : affiliate
        ));
      }
    } catch (error) {
      console.error('Error updating affiliate:', error);
      setError('Failed to update affiliate');
    }
  };

  const handleBulkAction = async (action, data = {}) => {
    if (selectedAffiliates.length === 0) return;

    try {
      setBulkActionLoading(true);
      const response = await axios.post('/api/affiliates/admin/bulk-action', {
        action,
        affiliateIds: selectedAffiliates,
        data
      });

      if (response.data.success) {
        await fetchAffiliates(); // Refresh the list
        setSelectedAffiliates([]);
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setError('Failed to perform bulk action');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleApproveCommission = async (commissionId) => {
    try {
      const response = await axios.put(`/api/affiliates/admin/commissions/${commissionId}/approve`);

      if (response.data.success) {
        setCommissions(prev => prev.map(commission =>
          commission._id === commissionId
            ? { ...commission, status: 'approved', approvedAt: new Date() }
            : commission
        ));
      }
    } catch (error) {
      console.error('Error approving commission:', error);
      setError('Failed to approve commission');
    }
  };

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchAffiliates();
    fetchAnalytics();
    fetchCommissions();
  }, [pagination.page, searchQuery, statusFilter, dateFilter]);

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
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        format: 'csv',
        status: statusFilter !== 'all' ? statusFilter : '',
        dateFrom: '',
        dateTo: ''
      });

      const response = await axios.get(`/api/affiliates/admin/export?${params}`, {
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'affiliates-export.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting affiliates:', error);
      setError('Failed to export affiliates data');
    }
  };

  const handleSelectAffiliate = (affiliateId) => {
    setSelectedAffiliates(prev =>
      prev.includes(affiliateId)
        ? prev.filter(id => id !== affiliateId)
        : [...prev, affiliateId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAffiliates.length === affiliates.length) {
      setSelectedAffiliates([]);
    } else {
      setSelectedAffiliates(affiliates.map(affiliate => affiliate._id));
    }
  };

  // Since we're using server-side filtering, we don't need client-side filtering
  const filteredAffiliates = affiliates;
  if (loading) {
    return (
      <AdminLayout
        title="Affiliate Management"
        subtitle="Manage affiliate partners and track commission performance"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout
        title="Affiliate Management"
        subtitle="Manage affiliate partners and track commission performance"
      >
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
                      fetchAffiliates();
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

  return (
    <AdminLayout 
      title="Affiliate Management" 
      subtitle="Manage affiliate partners and track commission performance"
      rightHeaderContent={
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/affiliates/create')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Affiliate
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Total Affiliates</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.overview.totalAffiliates}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>{analytics.overview.pendingAffiliates} pending approval</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Active Affiliates</p>
                <p className="text-2xl font-bold text-green-600">{analytics.overview.activeAffiliates}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <Target className="w-4 h-4 mr-1" />
              <span>{analytics.overview.totalStores} referred stores</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Total Commissions</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(analytics.overview.totalCommissions)}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <Award className="w-4 h-4 mr-1" />
              <span>{formatCurrency(analytics.overview.paidCommissions)} paid</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Pending Commissions</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(analytics.overview.pendingCommissions)}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <AlertTriangle className="w-4 h-4 mr-1" />
              <span>{analytics.overview.pendingCommissionCount} pending</span>
            </div>
          </div>
        </div>

        {/* Tabs and Content */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <div className="flex items-center justify-between p-6">
              <div className="flex space-x-8">
                {[
                  { key: 'overview', label: 'Overview' },
                  { key: 'affiliates', label: 'Affiliates', count: analytics.overview.totalAffiliates },
                  { key: 'commissions', label: 'Commissions' },
                  { key: 'analytics', label: 'Analytics' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 pb-4 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.key
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                    {tab.count && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        activeTab === tab.key ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {activeTab === 'affiliates' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Bulk Actions */}
                    {selectedAffiliates.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {selectedAffiliates.length} selected
                        </span>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleBulkAction(e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                          disabled={bulkActionLoading}
                        >
                          <option value="">Bulk Actions</option>
                          <option value="approve">Approve</option>
                          <option value="suspend">Suspend</option>
                          <option value="activate">Activate</option>
                        </select>
                        {bulkActionLoading && (
                          <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                        )}
                      </div>
                    )}

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search affiliates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="pending_approval">Pending</option>
                      <option value="suspended">Suspended</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <button
                    onClick={() => fetchAffiliates()}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 text-left">Top Performers</h4>
                    <div className="space-y-3">
                      {analytics.topPerformers.slice(0, 3).map((affiliate, index) => (
                        <div key={affiliate._id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-yellow-400 text-yellow-900' :
                              index === 1 ? 'bg-gray-300 text-gray-700' :
                              'bg-orange-300 text-orange-900'
                            }`}>
                              {index + 1}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{affiliate.name}</span>
                          </div>
                          <span className="text-sm font-bold text-green-600">{formatCurrency(affiliate.stats?.totalEarnings || 0)}</span>
                        </div>
                      ))}
                      {analytics.topPerformers.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No data available</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 text-left">Recent Activity</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">5 new affiliates joined</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">23 new store referrals</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">{formatCurrency(18900)} commissions paid</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 text-left">Pending Actions</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Pending Approvals</span>
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                          {analytics.overview.pendingAffiliates}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Payment Due</span>
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                          {formatCurrency(analytics.thisMonth?.totalEarnings || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Reviews Needed</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          3
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'affiliates' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedAffiliates.length === affiliates.length && affiliates.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Affiliate Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Earnings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Referral Link
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAffiliates.map((affiliate) => (
                      <tr key={affiliate._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedAffiliates.includes(affiliate._id)}
                            onChange={() => handleSelectAffiliate(affiliate._id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-left">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                <span className="text-primary-600 font-semibold text-sm">
                                  {affiliate.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{affiliate.name}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {affiliate.email}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {affiliate.phone}
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(affiliate.status)}`}>
                                {affiliate.status.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-gray-500">
                                Joined {formatDate(affiliate.createdAt)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-left">
                            <div className="text-sm font-medium text-gray-900">
                              {affiliate.stats?.totalReferrals || 0} referrals
                            </div>
                            <div className="text-sm text-gray-500">
                              {affiliate.stats?.successfulReferrals || 0} successful
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {affiliate.stats?.conversionRate || 0}% conversion rate
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-left">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(affiliate.stats?.totalEarnings || 0)}
                            </div>
                            <div className="text-sm text-green-600">
                              Pending: {formatCurrency(affiliate.stats?.pendingEarnings || 0)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {affiliate.commission?.rate || 0}% commission rate
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-left">
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
                            <div className="flex items-center gap-2 mt-1">
                              <Link className="w-3 h-3 text-gray-400" />
                              <button
                                onClick={() => copyToClipboard(affiliate.referralLink)}
                                className="text-xs text-blue-600 hover:text-blue-800 truncate max-w-32"
                                title="Copy Link"
                              >
                                Copy referral link
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => navigate(`/admin/affiliates/${affiliate._id}`)}
                              className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {affiliate.status === 'pending_approval' && (
                              <button
                                onClick={() => handleApproveAffiliate(affiliate._id)}
                                className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                title="Approve Affiliate"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {affiliate.status === 'active' ? (
                              <button
                                onClick={() => handleUpdateAffiliate(affiliate._id, { status: 'suspended' })}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                title="Suspend Affiliate"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            ) : affiliate.status === 'suspended' && (
                              <button
                                onClick={() => handleUpdateAffiliate(affiliate._id, { status: 'active' })}
                                className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                title="Activate Affiliate"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => navigate(`/admin/affiliates/edit/${affiliate._id}`)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title="Edit Affiliate"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredAffiliates.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No affiliates found</h3>
                    <p className="text-gray-500">
                      {searchQuery ? 'Try adjusting your search criteria' : 'No affiliates match the current filters'}
                    </p>
                  </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t">
                    <div className="flex items-center text-sm text-gray-700">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm">
                        Page {pagination.page} of {pagination.pages}
                      </span>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.pages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'commissions' && (
              <div className="space-y-6">
                {/* Commission Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => fetchCommissions()}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      disabled={loading}
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                    <select
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                  <button
                    onClick={() => navigate('/admin/affiliates/commissions/create')}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Manual Commission
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Commission Summary */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 text-left">Commission Summary</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Total Paid</span>
                        <span className="text-lg font-bold text-green-600">{formatCurrency(analytics.overview.paidCommissions)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Pending</span>
                        <span className="text-lg font-bold text-orange-600">{formatCurrency(analytics.overview.pendingCommissions)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Average Rate</span>
                        <span className="text-lg font-bold text-purple-600">{analytics.overview.averageCommissionRate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Schedule */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 text-left">Upcoming Payments</h4>
                    <div className="space-y-3">
                      {affiliates.filter(a => a.status === 'active').slice(0, 3).map(affiliate => (
                        <div key={affiliate.id} className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{affiliate.name}</div>
                            <div className="text-xs text-gray-500">Due: {formatDate(affiliate.nextPayment)}</div>
                          </div>
                          <span className="text-sm font-bold text-green-600">{formatCurrency(affiliate.thisMonthEarnings)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Commissions Table */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 text-left">Commission Transactions</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Affiliate
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Store
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {commissions.map((commission) => (
                          <tr key={commission._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {commission.affiliate?.name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {commission.affiliate?.affiliateCode || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {commission.store?.name || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                commission.type === 'initial' ? 'bg-blue-100 text-blue-800' :
                                commission.type === 'recurring' ? 'bg-green-100 text-green-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {commission.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {formatCurrency(commission.commissionAmount)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {commission.commissionRate}% rate
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                commission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                commission.status === 'approved' ? 'bg-green-100 text-green-800' :
                                commission.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {commission.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(commission.earnedDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                {commission.status === 'pending' && (
                                  <button
                                    onClick={() => handleApproveCommission(commission._id)}
                                    className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                    title="Approve Commission"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => navigate(`/admin/affiliates/commissions/${commission._id}`)}
                                  className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {commissions.length === 0 && !loading && (
                      <div className="text-center py-12">
                        <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No commissions found</h3>
                        <p className="text-gray-500">
                          Commission transactions will appear here once affiliates start earning
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Monthly Trend Chart */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 text-left">Monthly Commission Trends</h4>
                  <div className="h-64">
                    {analytics.monthlyTrend && analytics.monthlyTrend.length > 0 ? (
                      <div className="h-full flex items-end justify-between space-x-2">
                        {analytics.monthlyTrend.map((month, index) => (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div
                              className="bg-primary-500 rounded-t w-full transition-all duration-300 hover:bg-primary-600"
                              style={{
                                height: `${Math.max((month.totalCommissions / Math.max(...analytics.monthlyTrend.map(m => m.totalCommissions))) * 200, 10)}px`
                              }}
                              title={`${formatCurrency(month.totalCommissions)} in ${month._id.month}/${month._id.year}`}
                            ></div>
                            <div className="text-xs text-gray-600 mt-2">
                              {month._id.month}/{month._id.year}
                            </div>
                            <div className="text-xs font-medium text-gray-900">
                              {formatCurrency(month.totalCommissions)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                          <p>No trend data available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6 text-left">Performance Metrics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{analytics.overview.totalAffiliates}</div>
                      <div className="text-sm text-gray-600">Total Affiliates</div>
                      <div className="text-xs text-gray-500 mt-1">{analytics.overview.activeAffiliates} active</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{analytics.overview.totalStores}</div>
                      <div className="text-sm text-gray-600">Referred Stores</div>
                      <div className="text-xs text-gray-500 mt-1">Total referrals</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{formatCurrency(analytics.overview.totalCommissions)}</div>
                      <div className="text-sm text-gray-600">Total Commissions</div>
                      <div className="text-xs text-gray-500 mt-1">{analytics.overview.totalCommissionCount} transactions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        {analytics.overview.totalCommissionCount > 0
                          ? formatCurrency(analytics.overview.totalCommissions / analytics.overview.totalCommissionCount)
                          : formatCurrency(0)
                        }
                      </div>
                      <div className="text-sm text-gray-600">Avg. Commission</div>
                      <div className="text-xs text-gray-500 mt-1">Per transaction</div>
                    </div>
                  </div>
                </div>

                {/* Top Performing Affiliates */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6 text-left">Top Performing Affiliates</h4>
                  <div className="space-y-4">
                    {analytics.topPerformers.map((affiliate, index) => (
                      <div key={affiliate._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-400 text-yellow-900' :
                            index === 1 ? 'bg-gray-300 text-gray-700' :
                            index === 2 ? 'bg-orange-300 text-orange-900' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{affiliate.name}</div>
                            <div className="text-xs text-gray-500">
                              {affiliate.stats?.totalReferrals || 0} referrals • {affiliate.stats?.conversionRate || 0}% conversion
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(affiliate.stats?.totalEarnings || 0)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(affiliate.stats?.pendingEarnings || 0)} pending
                          </div>
                        </div>
                      </div>
                    ))}
                    {analytics.topPerformers.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Award className="w-12 h-12 mx-auto mb-2" />
                        <p>No performance data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAffiliatesPage;

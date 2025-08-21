import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import CommissionService from '../services/commissionService';
import {
  DollarSign, TrendingUp, Calendar, Filter, Search, Download,
  Eye, CheckCircle, Clock, AlertTriangle, CreditCard, Building,
  User, Store, BarChart3, PieChart, ArrowUpRight, ArrowDownRight,
  FileText, Mail, Phone, MapPin, Banknote, Wallet, RefreshCw,
  MoreVertical, AlertCircle, X
} from 'lucide-react';

const AffiliateCommissionsPage = () => {
  const navigate = useNavigate();

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('thisMonth');
  const [affiliateFilter, setAffiliateFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

  // Data state
  const [commissions, setCommissions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCommissions, setSelectedCommissions] = useState([]);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0
  });



  // Mock data for commissions (will be replaced with API data)
  const [mockCommissions] = useState([
    {
      id: 'COM-001',
      affiliateId: 'AFF-001',
      affiliateName: 'John Marketing Solutions',
      storeId: 'STORE-123',
      storeName: 'MediCare Pharmacy',
      subscriptionPlan: 'Pro Plan',
      subscriptionAmount: 1999,
      commissionRate: 15,
      commissionAmount: 299.85,
      status: 'pending',
      generatedDate: new Date('2024-01-15'),
      dueDate: new Date('2024-02-01'),
      paidDate: null,
      paymentMethod: 'Bank Transfer',
      transactionId: null,
      recurringMonth: 'January 2024',
      isRecurring: true
    },
    {
      id: 'COM-002',
      affiliateId: 'AFF-001',
      affiliateName: 'John Marketing Solutions',
      storeId: 'STORE-124',
      storeName: 'Health Plus Store',
      subscriptionPlan: 'Basic Plan',
      subscriptionAmount: 999,
      commissionRate: 15,
      commissionAmount: 149.85,
      status: 'paid',
      generatedDate: new Date('2024-01-01'),
      dueDate: new Date('2024-01-01'),
      paidDate: new Date('2024-01-01'),
      paymentMethod: 'Bank Transfer',
      transactionId: 'TXN-001',
      recurringMonth: 'January 2024',
      isRecurring: true
    },
    {
      id: 'COM-003',
      affiliateId: 'AFF-002',
      affiliateName: 'Sarah Digital Agency',
      storeId: 'STORE-125',
      storeName: 'City Pharmacy',
      subscriptionPlan: 'Enterprise',
      subscriptionAmount: 4999,
      commissionRate: 12,
      commissionAmount: 599.88,
      status: 'processing',
      generatedDate: new Date('2024-01-10'),
      dueDate: new Date('2024-02-01'),
      paidDate: null,
      paymentMethod: 'UPI',
      transactionId: null,
      recurringMonth: 'January 2024',
      isRecurring: true
    },
    {
      id: 'COM-004',
      affiliateId: 'AFF-002',
      affiliateName: 'Sarah Digital Agency',
      storeId: 'STORE-126',
      storeName: 'Quick Meds',
      subscriptionPlan: 'Pro Plan',
      subscriptionAmount: 1999,
      commissionRate: 12,
      commissionAmount: 239.88,
      status: 'paid',
      generatedDate: new Date('2023-12-15'),
      dueDate: new Date('2024-01-01'),
      paidDate: new Date('2024-01-01'),
      paymentMethod: 'UPI',
      transactionId: 'TXN-002',
      recurringMonth: 'December 2023',
      isRecurring: true
    }
  ]);



  // API Functions
  const fetchCommissions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        paymentStatus: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
        affiliate: affiliateFilter !== 'all' ? affiliateFilter : undefined,
        period: dateFilter
      };

      const response = await CommissionService.getCommissions(params);

      if (response.success) {
        setCommissions(response.data);
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            totalPages: response.pagination.totalPages,
            totalItems: response.pagination.totalItems
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching commissions:', error);
      setError(error.message || 'Failed to fetch commissions');
      setCommissions(mockCommissions); // Fallback to mock data
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const params = {
        period: dateFilter,
        affiliate: affiliateFilter !== 'all' ? affiliateFilter : undefined
      };

      const response = await CommissionService.getCommissionAnalytics(params);

      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Keep existing mock analytics on error
    }
  };

  const handleApproveCommission = async (commissionId) => {
    console.log('Approving commission:', commissionId);
    try {
      setLoading(true);
      const response = await CommissionService.approveCommission(commissionId);
      console.log('Approve response:', response);

      if (response.success) {
        // Update the commission in the list
        setCommissions(prev => prev.map(commission =>
          commission._id === commissionId
            ? { ...commission, status: 'approved', approvedAt: new Date() }
            : commission
        ));

        // Refresh analytics
        fetchAnalytics();
        alert('Commission approved successfully!');
      }
    } catch (error) {
      console.error('Error approving commission:', error);
      alert('Failed to approve commission: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handlePayCommission = async (commissionId) => {
    console.log('Processing payment for commission:', commissionId);
    try {
      setLoading(true);
      const paymentData = {
        method: 'bank_transfer',
        notes: 'Commission payment processed'
      };

      const response = await CommissionService.processPayment([commissionId], paymentData);
      console.log('Payment response:', response);

      if (response.success) {
        // Update the commission in the list
        setCommissions(prev => prev.map(commission =>
          commission._id === commissionId
            ? { ...commission, paymentStatus: 'paid', paidDate: new Date() }
            : commission
        ));

        // Refresh analytics
        fetchAnalytics();
        alert('Commission payment processed successfully!');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewCommission = (commissionId) => {
    console.log('Viewing commission details:', commissionId);
    // Navigate to commission details page
    navigate(`/admin/affiliate-commissions/${commissionId}`);
  };

  const handleDownloadReceipt = (commissionId) => {
    console.log('Downloading receipt for commission:', commissionId);
    // For now, just show an alert
    // Later this can download the actual receipt
    alert(`Downloading receipt for commission ID: ${commissionId}`);
  };

  const handleBulkPay = async () => {
    if (selectedCommissions.length === 0) {
      setError('Please select commissions to pay');
      return;
    }

    try {
      setLoading(true);
      const paymentData = {
        method: 'bank_transfer',
        notes: 'Bulk commission payment processed'
      };

      const response = await CommissionService.processPayment(selectedCommissions, paymentData);

      if (response.success) {
        // Update the commissions in the list
        setCommissions(prev => prev.map(commission =>
          selectedCommissions.includes(commission._id)
            ? { ...commission, paymentStatus: 'paid', paidDate: new Date() }
            : commission
        ));

        setSelectedCommissions([]);
        fetchAnalytics();
      }
    } catch (error) {
      console.error('Error processing bulk payment:', error);
      setError(error.message || 'Failed to process bulk payment');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        paymentStatus: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
        affiliate: affiliateFilter !== 'all' ? affiliateFilter : undefined,
        format: 'csv'
      };

      const response = await CommissionService.exportCommissions(params);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `commissions-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting commissions:', error);
      setError(error.message || 'Failed to export commissions');
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchCommissions();
    fetchAnalytics();
  }, [pagination.page, searchQuery, statusFilter, paymentStatusFilter, affiliateFilter, dateFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <CreditCard className="w-4 h-4" />;
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
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

  const formatDate = (date) => {
    if (!date) return 'N/A';

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';

    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(dateObj);
  };

  // Use real commissions data or fallback to mock data for display
  const displayCommissions = commissions.length > 0 ? commissions : mockCommissions;

  const filteredCommissions = displayCommissions.filter(commission => {
    const affiliateName = commission.affiliate?.name || commission.affiliateName || '';
    const storeName = commission.store?.name || commission.storeName || '';
    const commissionId = commission._id || commission.id || '';

    const matchesSearch = affiliateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         commissionId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || commission.status === statusFilter;
    const matchesPaymentStatus = paymentStatusFilter === 'all' || commission.paymentStatus === paymentStatusFilter;
    const matchesAffiliate = affiliateFilter === 'all' || commission.affiliate?._id === affiliateFilter || commission.affiliateId === affiliateFilter;

    return matchesSearch && matchesStatus && matchesPaymentStatus && matchesAffiliate;
  });

  const handleCommissionSelect = (commissionId, isSelected) => {
    if (isSelected) {
      setSelectedCommissions(prev => [...prev, commissionId]);
    } else {
      setSelectedCommissions(prev => prev.filter(id => id !== commissionId));
    }
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      const selectableCommissions = filteredCommissions
        .filter(c => c.status === 'approved' && c.paymentStatus === 'unpaid')
        .map(c => c._id || c.id);
      setSelectedCommissions(selectableCommissions);
    } else {
      setSelectedCommissions([]);
    }
  };

  return (
    <AdminLayout 
      title="Affiliate Commissions" 
      subtitle="Manage commission payments and track affiliate earnings"
      rightHeaderContent={
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchCommissions()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleBulkPay}
            disabled={loading || selectedCommissions.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Banknote className="w-4 h-4" />
            Bulk Pay ({selectedCommissions.length})
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {loading ? (
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-32"></div>
                  ) : (
                    formatCurrency(analytics?.overview?.totalCommissionsPaid || 1289550)
                  )}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <ArrowUpRight className="w-4 h-4 mr-1 text-green-500" />
              <span>+{analytics?.overview?.commissionGrowthRate || 12.5}% from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {loading ? (
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-32"></div>
                  ) : (
                    formatCurrency(analytics?.overview?.pendingCommissions || 45600)
                  )}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-1" />
              <span>Due: {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-blue-600">
                  {loading ? (
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-32"></div>
                  ) : (
                    formatCurrency(analytics?.thisMonth?.totalGenerated || 89400)
                  )}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <BarChart3 className="w-4 h-4 mr-1" />
              <span>{analytics?.thisMonth?.commissionsCount || 234} transactions</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Avg. Commission</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(analytics?.thisMonth?.averageCommission || 0)}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <User className="w-4 h-4 mr-1" />
              <span>{analytics?.overview?.activeCommissionEarners || 0} active affiliates</span>
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
                  { key: 'commissions', label: 'Commission Records', count: commissions.length },
                  { key: 'payments', label: 'Payment Management' },
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

              {activeTab === 'commissions' && (
                <div className="flex items-center gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search commissions..."
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
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  {/* Payment Status Filter */}
                  <select
                    value={paymentStatusFilter}
                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All Payment Status</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                  </select>

                  {/* Affiliate Filter */}
                  <select
                    value={affiliateFilter}
                    onChange={(e) => setAffiliateFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All Affiliates</option>
                    {/* These will be populated dynamically from API */}
                  </select>

                  {/* Date Filter */}
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="thisQuarter">This Quarter</option>
                    <option value="thisYear">This Year</option>
                  </select>
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
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 text-left">Payment Summary</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Total Paid</span>
                        <span className="text-lg font-bold text-green-600">{formatCurrency(analytics?.thisMonth?.totalPaid || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Pending</span>
                        <span className="text-lg font-bold text-yellow-600">{formatCurrency(analytics?.thisMonth?.totalPending || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Processing</span>
                        <span className="text-lg font-bold text-blue-600">{formatCurrency(analytics?.thisMonth?.totalProcessing || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 text-left">Payment Methods</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-700">Bank Transfer</span>
                        </div>
                        <span className="text-sm font-bold text-blue-600">{analytics?.paymentMethods?.bankTransfer || 0}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-gray-700">UPI</span>
                        </div>
                        <span className="text-sm font-bold text-purple-600">{analytics?.paymentMethods?.upi || 0}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-orange-600" />
                          <span className="text-sm text-gray-700">Wallet</span>
                        </div>
                        <span className="text-sm font-bold text-orange-600">{analytics?.paymentMethods?.wallet || 0}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 text-left">Upcoming Payments</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Due Feb 1</span>
                        <span className="text-lg font-bold text-purple-600">{formatCurrency(analytics?.overview?.pendingCommissions || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Affiliates</span>
                        <span className="text-sm font-bold text-purple-600">{analytics?.overview?.activeCommissionEarners || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Transactions</span>
                        <span className="text-sm font-bold text-purple-600">{analytics?.thisMonth?.commissionsCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'commissions' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          checked={selectedCommissions.length > 0 && selectedCommissions.length === filteredCommissions.filter(c => c.status === 'approved' && c.paymentStatus === 'unpaid').length}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commission Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Affiliate & Store
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subscription
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commission
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status & Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCommissions.map((commission) => {
                      const commissionId = commission._id || commission.id;
                      const affiliateName = commission.affiliate?.name || commission.affiliateName;
                      const storeName = commission.store?.name || commission.storeName;
                      const isSelectable = commission.status === 'approved' && commission.paymentStatus === 'unpaid';

                      return (
                        <tr key={commissionId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isSelectable && (
                              <input
                                type="checkbox"
                                checked={selectedCommissions.includes(commissionId)}
                                onChange={(e) => handleCommissionSelect(commissionId, e.target.checked)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-left">
                              <div className="text-sm font-medium text-gray-900">{commissionId}</div>
                              <div className="text-sm text-gray-500">{commission.formattedPeriod || commission.recurringMonth}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                Generated: {formatDate(commission.earnedDate || commission.generatedDate || commission.createdAt)}
                              </div>
                              {(commission.type === 'recurring' || commission.isRecurring) && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                  Recurring
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-left">
                              <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-primary-600" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{affiliateName}</div>
                                  <div className="text-xs text-gray-500">{commission.affiliate?.affiliateCode || commission.affiliateId}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Store className="w-4 h-4 text-green-600" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{storeName}</div>
                                  <div className="text-xs text-gray-500">{commission.store?.code || commission.storeId}</div>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-left">
                              <div className="text-sm font-medium text-gray-900">{commission.subscriptionPlan || 'Subscription'}</div>
                              <div className="text-sm text-gray-500">{formatCurrency(commission.baseAmount || commission.subscriptionAmount)}/month</div>
                              <div className="text-xs text-gray-500 mt-1">
                                Rate: {commission.commissionRate}%
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-left">
                              <div className="text-lg font-bold text-green-600">
                                {formatCurrency(commission.commissionAmount)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {commission.commissionRate}% of {formatCurrency(commission.baseAmount || commission.subscriptionAmount)}
                            </div>
                          </div>
                        </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-left">
                              <div className="flex items-center gap-2 mb-2">
                                {getStatusIcon(commission.status)}
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(commission.status)}`}>
                                  {commission.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mb-1">
                                {getStatusIcon(commission.paymentStatus)}
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(commission.paymentStatus)}`}>
                                  {commission.paymentStatus || 'unpaid'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                Due: {formatDate(commission.dueDate)}
                              </div>
                              {commission.paidDate && (
                                <div className="text-xs text-green-600">
                                  Paid: {formatDate(commission.paidDate)}
                                </div>
                              )}
                              {commission.payment?.method && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {commission.payment.method}
                                </div>
                              )}
                              {commission.payment?.transactionId && (
                                <div className="text-xs text-blue-600">
                                  TXN: {commission.payment.transactionId}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewCommission(commissionId)}
                                className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {commission.status === 'pending' && (
                                <button
                                  onClick={() => handleApproveCommission(commissionId)}
                                  disabled={loading}
                                  className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 disabled:opacity-50"
                                  title="Approve Commission"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              {commission.status === 'approved' && commission.paymentStatus === 'unpaid' && (
                                <button
                                  onClick={() => handlePayCommission(commissionId)}
                                  disabled={loading}
                                  className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 disabled:opacity-50"
                                  title="Process Payment"
                                >
                                  <Banknote className="w-4 h-4" />
                                </button>
                              )}
                              {commission.paymentStatus === 'paid' && (
                                <button
                                  onClick={() => handleDownloadReceipt(commissionId)}
                                  className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                  title="Download Receipt"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredCommissions.length === 0 && (
                  <div className="text-center py-12">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No commissions found</h3>
                    <p className="text-gray-500">
                      {searchQuery ? 'Try adjusting your search criteria' : 'No commissions match the current filters'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-6">
                {/* Payment Processing */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 text-left">Pending Payments</h4>
                    <div className="space-y-4">
                      {commissions.filter(c => c.status === 'pending').map(commission => (
                        <div key={commission.id} className="flex items-center justify-between p-4 bg-white rounded-lg">
                          <div className="text-left">
                            <div className="text-sm font-medium text-gray-900">{commission.affiliateName}</div>
                            <div className="text-xs text-gray-500">{commission.id} • {commission.recurringMonth}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-green-600">{formatCurrency(commission.commissionAmount)}</div>
                            <button
                              onClick={() => handlePayCommission(commission.id)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Process Payment
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 text-left">Recent Payments</h4>
                    <div className="space-y-4">
                      {commissions.filter(c => c.status === 'paid').slice(0, 3).map(commission => (
                        <div key={commission.id} className="flex items-center justify-between p-4 bg-white rounded-lg">
                          <div className="text-left">
                            <div className="text-sm font-medium text-gray-900">{commission.affiliateName}</div>
                            <div className="text-xs text-gray-500">
                              {commission.transactionId || commission.payment?.transactionId || 'N/A'} • {formatDate(commission.paidDate)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-green-600">{formatCurrency(commission.commissionAmount)}</div>
                            <div className="text-xs text-gray-500">{commission.paymentMethod}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Payment Schedule */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6 text-left">Payment Schedule</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-lg font-bold text-blue-600">1st</div>
                      <div className="text-sm text-gray-600">Monthly Payout</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-lg font-bold text-purple-600">2-3 Days</div>
                      <div className="text-sm text-gray-600">Processing Time</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-lg font-bold text-green-600">₹100</div>
                      <div className="text-sm text-gray-600">Minimum Payout</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Performance Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 text-left">Commission Trends</h4>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                        <p>Commission trends chart would go here</p>
                        <p className="text-sm">Growth: +{analytics?.overview?.commissionGrowthRate || 0}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 text-left">Payment Distribution</h4>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <PieChart className="w-12 h-12 mx-auto mb-2" />
                        <p>Payment method distribution chart</p>
                        <p className="text-sm">Bank: {analytics?.paymentMethods?.bankTransfer || 0}% | UPI: {analytics?.paymentMethods?.upi || 0}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Analytics */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6 text-left">Commission Analytics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{analytics?.overview?.totalStoresGeneratingCommissions || 0}</div>
                      <div className="text-sm text-gray-600">Active Stores</div>
                      <div className="text-xs text-green-600 mt-1">+15% from last month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{formatCurrency(analytics?.overview?.averageCommissionPerAffiliate || 0)}</div>
                      <div className="text-sm text-gray-600">Avg per Affiliate</div>
                      <div className="text-xs text-green-600 mt-1">+8% from last month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{analytics?.thisMonth?.commissionsCount || 0}</div>
                      <div className="text-sm text-gray-600">This Month</div>
                      <div className="text-xs text-green-600 mt-1">+22% from last month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">{analytics?.overview?.commissionGrowthRate || 0}%</div>
                      <div className="text-sm text-gray-600">Growth Rate</div>
                      <div className="text-xs text-green-600 mt-1">Month over month</div>
                    </div>
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

export default AffiliateCommissionsPage;

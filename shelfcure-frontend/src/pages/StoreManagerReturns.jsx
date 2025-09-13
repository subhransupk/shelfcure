import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  RotateCcw,
  Plus,
  Search,
  Filter,
  Calendar,
  Package,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';
import CreateReturnForm from '../components/returns/CreateReturnForm';

const StoreManagerReturns = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('list');
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    returnReason: '',
    refundStatus: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [analytics, setAnalytics] = useState({
    totalReturns: 0,
    totalReturnAmount: 0,
    pendingReturns: 0,
    completedReturns: 0,
    returnRate: 0,
    returnReasons: [],
    topReturnedMedicines: [],
    monthlyTrends: [],
    inventoryImpact: [],
    refundMethods: []
  });
  const [createReturnLoading, setCreateReturnLoading] = useState(false);

  // Fetch returns data
  const fetchReturns = async (page = 1) => {
    setLoading(true);
    setError('');
    
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.returnReason && { returnReason: filters.returnReason }),
        ...(filters.refundStatus && { refundStatus: filters.refundStatus }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/store-manager/returns?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch returns');
      }

      const data = await response.json();
      setReturns(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/store-manager/returns/analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setAnalytics({
            totalReturns: data.data.summary.totalReturns,
            totalReturnAmount: data.data.summary.totalReturnAmount,
            returnRate: data.data.summary.returnRate,
            pendingReturns: returns.filter(ret => ret.status === 'pending').length,
            completedReturns: returns.filter(ret => ret.status === 'completed').length,
            returnReasons: data.data.returnReasons || [],
            topReturnedMedicines: data.data.topReturnedMedicines || [],
            monthlyTrends: data.data.monthlyTrends || [],
            inventoryImpact: data.data.inventoryImpact || [],
            refundMethods: data.data.refundMethods || []
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  useEffect(() => {
    fetchReturns();
    fetchAnalytics();
  }, [filters, searchTerm]);

  // Handle navigation state (pre-selected sale)
  useEffect(() => {
    if (location.state?.preSelectedSale && location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      returnReason: '',
      refundStatus: '',
      startDate: '',
      endDate: ''
    });
    setSearchTerm('');
  };

  // Handle return creation
  const handleCreateReturn = async (returnData) => {
    setCreateReturnLoading(true);
    setError('');

    try {
      const response = await fetch('/api/store-manager/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(returnData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create return');
      }

      const data = await response.json();

      // Refresh returns list and analytics
      await Promise.all([
        fetchReturns(),
        fetchAnalytics()
      ]);

      // Switch back to list tab
      setActiveTab('list');

      // Show success message (you might want to add a toast notification here)
      console.log('Return created successfully:', data.data);

    } catch (err) {
      setError(err.message);
    } finally {
      setCreateReturnLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderAnalyticsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <RotateCcw className="h-8 w-8 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Returns</p>
            <p className="text-2xl font-semibold text-gray-900">{analytics.totalReturns}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Return Amount</p>
            <p className="text-2xl font-semibold text-gray-900">{formatCurrency(analytics.totalReturnAmount)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Pending Returns</p>
            <p className="text-2xl font-semibold text-gray-900">{analytics.pendingReturns}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Completed Returns</p>
            <p className="text-2xl font-semibold text-gray-900">{analytics.completedReturns}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFilters = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear All
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="processed">Processed</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Return Reason</label>
          <select
            value={filters.returnReason}
            onChange={(e) => handleFilterChange('returnReason', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Reasons</option>
            <option value="defective_product">Defective Product</option>
            <option value="expired_medicine">Expired Medicine</option>
            <option value="wrong_medicine_dispensed">Wrong Medicine</option>
            <option value="customer_dissatisfaction">Customer Dissatisfaction</option>
            <option value="doctor_prescription_change">Prescription Change</option>
            <option value="adverse_reaction">Adverse Reaction</option>
            <option value="duplicate_purchase">Duplicate Purchase</option>
            <option value="billing_error">Billing Error</option>
            <option value="quality_issue">Quality Issue</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Refund Status</label>
          <select
            value={filters.refundStatus}
            onChange={(e) => handleFilterChange('refundStatus', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Refund Status</option>
            <option value="pending">Pending</option>
            <option value="processed">Processed</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>
    </div>
  );

  return (
    <StoreManagerLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Returns Management</h1>
            <p className="text-gray-600">Manage medicine returns and refunds</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchReturns(pagination.page)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Return
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('list')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'list'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Return History
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Create New Return
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Return Analytics
            </button>
          </nav>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'list' && (
          <div>
            {renderAnalyticsCards()}
            {renderFilters()}
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search returns by return number, reason, or notes..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Returns Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Return Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
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
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <div className="flex items-center justify-center">
                            <RefreshCw className="animate-spin h-6 w-6 text-gray-400 mr-2" />
                            <span className="text-gray-500">Loading returns...</span>
                          </div>
                        </td>
                      </tr>
                    ) : returns.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <RotateCcw className="h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No returns found</h3>
                            <p className="text-gray-500 mb-4">
                              {searchTerm || Object.values(filters).some(f => f)
                                ? 'No returns match your search criteria.'
                                : 'No returns have been created yet.'}
                            </p>
                            <button
                              onClick={() => setActiveTab('create')}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              Create First Return
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      returns.map((returnRecord) => (
                        <tr key={returnRecord._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {returnRecord.returnNumber}
                              </div>
                              <div className="text-sm text-gray-500">
                                Sale: {returnRecord.originalSale?.receiptNumber || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {returnRecord.returnReason?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {returnRecord.customer?.name || 'Walk-in Customer'}
                            </div>
                            {returnRecord.customer?.phone && (
                              <div className="text-sm text-gray-500">
                                {returnRecord.customer.phone}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {returnRecord.items?.length || 0} item(s)
                            </div>
                            <div className="text-sm text-gray-500">
                              {returnRecord.totalItems} units
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(returnRecord.totalReturnAmount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {returnRecord.refundMethod?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(returnRecord.status)}
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(returnRecord.status)}`}>
                                {returnRecord.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </div>
                            {returnRecord.refundStatus && (
                              <div className="text-xs text-gray-500 mt-1">
                                Refund: {returnRecord.refundStatus}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(returnRecord.returnDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {/* View return details */}}
                                className="text-green-600 hover:text-green-900 p-1 rounded"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {returnRecord.status === 'pending' && (
                                <button
                                  onClick={() => {/* Edit return */}}
                                  className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                  title="Edit Return"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => fetchReturns(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchReturns(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">
                          {(pagination.page - 1) * pagination.limit + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium">{pagination.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => fetchReturns(pagination.page - 1)}
                          disabled={pagination.page <= 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        {[...Array(pagination.pages)].map((_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => fetchReturns(i + 1)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pagination.page === i + 1
                                ? 'z-10 bg-green-50 border-green-500 text-green-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => fetchReturns(pagination.page + 1)}
                          disabled={pagination.page >= pagination.pages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <CreateReturnForm
            onSubmit={handleCreateReturn}
            onCancel={() => setActiveTab('list')}
            loading={createReturnLoading}
            preSelectedSale={location.state?.preSelectedSale}
          />
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {renderAnalyticsCards()}

            {/* Analytics Charts and Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Return Reasons */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Return Reasons</h3>
                <div className="space-y-3">
                  {analytics.returnReasons && analytics.returnReasons.length > 0 ? analytics.returnReasons.map((reason, index) => {
                    const maxCount = Math.max(...analytics.returnReasons.map(r => r.count || 0));
                    const percentage = maxCount > 0 ? (reason.count / maxCount) * 100 : 0;

                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {reason._id?.replace(/_/g, ' ') || 'Unknown'}
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${percentage}%`
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-sm font-medium text-gray-900">{reason.count}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(reason.totalAmount)}</p>
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="text-sm text-gray-500 text-center py-4">No return reasons data available</p>
                  )}
                </div>
              </div>

              {/* Top Returned Medicines */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Returned Medicines</h3>
                <div className="space-y-3">
                  {analytics.topReturnedMedicines && analytics.topReturnedMedicines.length > 0 ?
                    analytics.topReturnedMedicines.slice(0, 5).map((medicine, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{medicine.medicineName}</p>
                          <p className="text-xs text-gray-500">{medicine.genericName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {medicine.totalQuantityReturned} units
                          </p>
                          <p className="text-xs text-gray-500">{formatCurrency(medicine.totalReturnAmount)}</p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-gray-500 text-center py-4">No return data available</p>
                    )
                  }
                </div>
              </div>
            </div>

            {/* Refund Methods and Inventory Impact */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Refund Methods */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Refund Methods</h3>
                <div className="space-y-3">
                  {analytics.refundMethods && analytics.refundMethods.length > 0 ? analytics.refundMethods.map((method, index) => {
                    const maxCount = Math.max(...analytics.refundMethods.map(m => m.count || 0));
                    const percentage = maxCount > 0 ? (method.count / maxCount) * 100 : 0;

                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {method._id?.replace(/_/g, ' ') || 'Unknown'}
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{
                                width: `${percentage}%`
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-sm font-medium text-gray-900">{method.count}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(method.totalAmount)}</p>
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="text-sm text-gray-500 text-center py-4">No refund methods data available</p>
                  )}
                </div>
              </div>

              {/* Inventory Impact */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Impact</h3>
                <div className="space-y-3">
                  {analytics.inventoryImpact && analytics.inventoryImpact.length > 0 ? analytics.inventoryImpact.map((impact, index) => {
                    const maxCount = Math.max(...analytics.inventoryImpact.map(i => i.count || 0));
                    const percentage = maxCount > 0 ? (impact.count / maxCount) * 100 : 0;

                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {impact._id ? 'Restored to Inventory' : 'Not Restored'}
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className={`h-2 rounded-full ${impact._id ? 'bg-green-600' : 'bg-red-600'}`}
                              style={{
                                width: `${percentage}%`
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-sm font-medium text-gray-900">{impact.totalQuantity} units</p>
                          <p className="text-xs text-gray-500">{formatCurrency(impact.totalAmount)}</p>
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="text-sm text-gray-500 text-center py-4">No inventory impact data available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StoreManagerLayout>
  );
};

export default StoreManagerReturns;

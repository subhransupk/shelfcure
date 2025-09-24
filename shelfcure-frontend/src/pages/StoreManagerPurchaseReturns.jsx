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
  X,
  Truck
} from 'lucide-react';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';
import CreatePurchaseReturnForm from '../components/purchase-returns/CreatePurchaseReturnForm';

const StoreManagerPurchaseReturns = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('list');
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    returnReason: '',
    refundStatus: '',
    supplier: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [statusModal, setStatusModal] = useState({ show: false, purchaseReturn: null });

  // Check if we should show create form based on location state
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  // Fetch purchase returns
  const fetchPurchaseReturns = async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
      });

      const response = await fetch(`/api/store-manager/purchase-returns?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPurchaseReturns(data.data || []);
        setPagination(data.pagination || pagination);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch purchase returns');
      }
    } catch (error) {
      console.error('Error fetching purchase returns:', error);
      setError('Failed to fetch purchase returns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'list') {
      fetchPurchaseReturns();
    }
  }, [activeTab, searchTerm, filters]);

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      status: '',
      returnReason: '',
      refundStatus: '',
      supplier: '',
      startDate: '',
      endDate: ''
    });
    setSearchTerm('');
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchPurchaseReturns(newPage);
  };

  // Handle successful return creation
  const handleReturnCreated = (newReturn) => {
    setActiveTab('list');
    fetchPurchaseReturns(); // Refresh the list
  };

  // Handle status update
  const handleStatusUpdate = (purchaseReturn) => {
    setStatusModal({ show: true, purchaseReturn });
  };

  // Update purchase return status
  const updatePurchaseReturnStatus = async (newStatus, purchaseReturn = null) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Use passed purchaseReturn or fallback to statusModal
      const targetReturn = purchaseReturn || statusModal.purchaseReturn;

      if (!targetReturn) {
        throw new Error('No purchase return selected');
      }

      console.log('🔄 Updating purchase return status:', {
        returnId: targetReturn._id,
        currentStatus: targetReturn.status,
        newStatus: newStatus
      });

      const response = await fetch(`/api/store-manager/purchase-returns/${targetReturn._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const responseData = await response.json();
      console.log('📤 Status update response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update purchase return status');
      }

      // Close modal and refresh list
      setStatusModal({ show: false, purchaseReturn: null });
      fetchPurchaseReturns();

      // Show success message
      console.log('✅ Purchase return status updated successfully');

      // If status was changed to completed, show additional info
      if (newStatus === 'completed') {
        console.log('🎉 Purchase return completed - inventory should be updated!');
      }
    } catch (error) {
      console.error('❌ Update status error:', error);
      setError(error.message || 'Failed to update purchase return status');
    } finally {
      setLoading(false);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'processed': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      case 'processed': return <Package className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate summary stats
  const summaryStats = {
    totalReturns: purchaseReturns.length,
    totalAmount: purchaseReturns.reduce((sum, ret) => sum + (ret.totalReturnAmount || 0), 0),
    pendingReturns: purchaseReturns.filter(ret => ret.status === 'pending').length,
    completedReturns: purchaseReturns.filter(ret => ret.status === 'completed').length
  };

  return (
    <StoreManagerLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchase Returns Management</h1>
            <p className="text-gray-600">Manage purchase returns and refunds</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchPurchaseReturns(pagination.page)}
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

        {/* Summary Stats */}
        {activeTab === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Returns</p>
                  <p className="text-2xl font-bold text-gray-900">{summaryStats.totalReturns}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <RotateCcw className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(summaryStats.totalAmount)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{summaryStats.pendingReturns}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{summaryStats.completedReturns}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
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
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Purchase Returns
              </div>
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Return
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'create' && (
          <CreatePurchaseReturnForm onSuccess={handleReturnCreated} />
        )}

        {activeTab === 'list' && (
          <div className="bg-white rounded-lg shadow-sm border">
            {/* Search and Filters */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by return number, reason, or notes..."
                      value={searchTerm}
                      onChange={handleSearch}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="processed">Processed</option>
                    <option value="completed">Completed</option>
                  </select>

                  <select
                    value={filters.returnReason}
                    onChange={(e) => handleFilterChange('returnReason', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">All Reasons</option>
                    <option value="damaged_goods">Damaged Goods</option>
                    <option value="wrong_delivery">Wrong Delivery</option>
                    <option value="quality_issues">Quality Issues</option>
                    <option value="expired_products">Expired Products</option>
                    <option value="overstock">Overstock</option>
                    <option value="supplier_error">Supplier Error</option>
                    <option value="other">Other</option>
                  </select>

                  {Object.values(filters).some(value => value) && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Purchase Returns List */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Loading purchase returns...</span>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                  <span className="ml-2 text-red-600">{error}</span>
                </div>
              ) : purchaseReturns.length === 0 ? (
                <div className="text-center py-12">
                  <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No purchase returns found</h3>
                  <p className="text-gray-600 mb-4">Get started by creating your first purchase return.</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                    Create Return
                  </button>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Return Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purchase Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
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
                    {purchaseReturns.map((purchaseReturn) => (
                      <tr key={purchaseReturn._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {purchaseReturn.returnNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {purchaseReturn.returnReason?.replace('_', ' ').toUpperCase()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {purchaseReturn.originalPurchase?.purchaseOrderNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {purchaseReturn.originalPurchase?.invoiceNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {purchaseReturn.supplier?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {purchaseReturn.supplier?.contactPerson}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(purchaseReturn.totalReturnAmount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {purchaseReturn.totalItems} items
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(purchaseReturn.status)}`}>
                            {getStatusIcon(purchaseReturn.status)}
                            {purchaseReturn.status?.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(purchaseReturn.returnDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStatusUpdate(purchaseReturn)}
                              className="text-green-600 hover:text-green-900"
                              title="Update Status"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {purchaseReturn.status === 'pending' && (
                              <button
                                onClick={() => updatePurchaseReturnStatus('completed', purchaseReturn)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Mark as Completed"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Update Modal */}
        {statusModal.show && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Update Purchase Return Status</h3>
                  <button
                    onClick={() => setStatusModal({ show: false, purchaseReturn: null })}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Return Number: <span className="font-medium">{statusModal.purchaseReturn?.returnNumber}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Current Status: <span className="font-medium capitalize">{statusModal.purchaseReturn?.status}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Select New Status:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['pending', 'approved', 'processed', 'completed', 'rejected'].map((status) => (
                      <button
                        key={status}
                        onClick={() => updatePurchaseReturnStatus(status)}
                        disabled={loading || status === statusModal.purchaseReturn?.status}
                        className={`px-3 py-2 text-sm font-medium rounded-md border ${
                          status === statusModal.purchaseReturn?.status
                            ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                            : status === 'completed'
                            ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                            : status === 'rejected'
                            ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                            : status === 'approved'
                            ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                            : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                        } transition-colors disabled:opacity-50`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Marking as "Completed" will automatically restore the returned medicines to your inventory.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StoreManagerLayout>
  );
};

export default StoreManagerPurchaseReturns;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import { makeAuthenticatedRequest, API_ENDPOINTS } from '../config/api';
import {
  Percent, Search, Eye, Plus, Edit, Trash2,
  ChevronLeft, ChevronRight, Calendar,
  CheckCircle, Clock, DollarSign,
  MoreVertical, RefreshCw,
  TrendingUp, Copy
} from 'lucide-react';

const AdminDiscountsPage = () => {
  const navigate = useNavigate();
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDiscounts, setSelectedDiscounts] = useState([]);
  const [totalDiscounts, setTotalDiscounts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const itemsPerPage = 10;

  // Fetch discounts from API
  const fetchDiscounts = async (pageOverride = null, searchOverride = null, statusOverride = null, typeOverride = null) => {
    try {
      setLoading(true);

      // Use overrides or current state values
      const page = pageOverride !== null ? pageOverride : currentPage;
      const search = searchOverride !== null ? searchOverride : searchTerm;
      const status = statusOverride !== null ? statusOverride : statusFilter;
      const type = typeOverride !== null ? typeOverride : typeFilter;

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page,
        limit: itemsPerPage,
        _t: Date.now()
      });

      if (search) {
        queryParams.append('search', search);
      }

      if (status !== 'all') {
        if (status === 'active') {
          queryParams.append('isActive', 'true');
        } else if (status === 'inactive') {
          queryParams.append('isActive', 'false');
        }
      }

      if (type !== 'all') {
        queryParams.append('type', type);
      }

      const response = await makeAuthenticatedRequest(
        `${API_ENDPOINTS.ADMIN_DISCOUNTS}?${queryParams.toString()}`,
        {
          method: 'GET'
        }
      );

      if (response.success) {
        const discountData = response.data || [];

        // Debug: Log discount data to see the structure
        console.log('Discount data received:', discountData);

        // Filter out any discounts with invalid _id fields
        const validDiscounts = discountData.filter(discount => {
          const discountId = discount._id || discount.id;
          const hasValidId = discountId &&
                            typeof discountId === 'string' &&
                            discountId.length === 24 &&
                            /^[0-9a-fA-F]{24}$/.test(discountId);

          if (!hasValidId) {
            console.warn('Invalid discount ID found:', {
              discount,
              _id: discount._id,
              id: discount.id,
              discountId,
              type: typeof discountId,
              length: discountId?.length
            });
          }
          return hasValidId;
        });

        console.log('Valid discounts after filtering:', validDiscounts);
        setDiscounts(validDiscounts);

        // Handle pagination data from API response
        const pagination = response.pagination || {};
        setTotalDiscounts(pagination.totalItems || response.total || validDiscounts.length);
        setTotalPages(pagination.totalPages || response.totalPages || Math.ceil(validDiscounts.length / itemsPerPage));
      }
    } catch (error) {
      console.error('Error fetching discounts:', error);
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load only
  useEffect(() => {
    fetchDiscounts();
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Debounced search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      setCurrentPage(1);
      fetchDiscounts(1, value, statusFilter, typeFilter);
    }, 500);
  };

  // Handle filter changes
  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
    fetchDiscounts(1, searchTerm, value, typeFilter);
  };

  const handleTypeFilterChange = (value) => {
    setTypeFilter(value);
    setCurrentPage(1);
    fetchDiscounts(1, searchTerm, statusFilter, value);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchDiscounts(page, searchTerm, statusFilter, typeFilter);
  };

  // Delete discount handler
  const handleDeleteDiscount = async (discountId) => {
    if (!window.confirm('Are you sure you want to delete this discount? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await makeAuthenticatedRequest(
        `${API_ENDPOINTS.ADMIN_DISCOUNTS}/${discountId}`,
        {
          method: 'DELETE'
        }
      );

      if (response.success) {
        // Remove from local state
        setDiscounts(prev => prev.filter(discount => discount._id !== discountId));
        // Also remove from selected if it was selected
        setSelectedDiscounts(prev => prev.filter(id => id !== discountId));
      }
    } catch (error) {
      console.error('Error deleting discount:', error);
      alert('Failed to delete discount. Please try again.');
    }
  };

  // Refresh handler
  const handleRefresh = () => {
    fetchDiscounts();
  };

  // Calculate statistics
  const stats = {
    totalDiscounts: totalDiscounts || discounts.length,
    activeDiscounts: discounts.filter(d => d.isActive !== false).length,
    totalUsage: discounts.reduce((sum, d) => sum + (d.stats?.totalUses || d.usedCount || 0), 0),
    totalSavings: discounts.reduce((sum, d) => {
      const totalUses = d.stats?.totalUses || d.usedCount || 0;
      if (d.type === 'percentage') {
        return sum + (totalUses * (d.limits?.maxDiscountAmount || d.maxDiscountAmount || 0));
      } else {
        return sum + (totalUses * d.value);
      }
    }, 0)
  };

  // Since we're doing server-side filtering, use discounts directly
  const displayDiscounts = discounts;

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'percentage': return 'bg-blue-100 text-blue-800';
      case 'fixed':
      case 'fixed_amount': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUsagePercentage = (used, limit) => {
    return limit > 0 ? Math.round((used / limit) * 100) : 0;
  };

  const handleSelectDiscount = (discountId) => {
    setSelectedDiscounts(prev => 
      prev.includes(discountId) 
        ? prev.filter(id => id !== discountId)
        : [...prev, discountId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDiscounts.length === displayDiscounts.length) {
      setSelectedDiscounts([]);
    } else {
      setSelectedDiscounts(displayDiscounts.map(d => d._id || d.id));
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Discounts" subtitle="Loading discounts...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Discounts" subtitle="Manage discount codes and promotional offers">
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Total Discounts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDiscounts}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Percent className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Active Discounts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeDiscounts}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Total Usage</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsage}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Total Savings</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSavings)}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search discounts..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </select>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => handleTypeFilterChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => navigate('/admin/discounts/create')}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Discount
              </button>
            </div>
          </div>
        </div>

        {/* Discounts Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedDiscounts.length === displayDiscounts.length && displayDiscounts.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage & Limits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Validity Period
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
                {displayDiscounts.map((discount) => (
                  <tr key={discount._id || discount.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedDiscounts.includes(discount._id || discount.id)}
                        onChange={() => handleSelectDiscount(discount._id || discount.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900">{discount.code || 'NO_CODE'}</div>
                          <button
                            onClick={() => navigator.clipboard.writeText(discount.code || 'NO_CODE')}
                            className="text-gray-400 hover:text-gray-600 p-1"
                            title="Copy code"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-sm text-gray-900 font-medium">{discount.name || 'Unnamed Discount'}</div>
                        <div className="text-sm text-gray-500">{discount.description || 'No description'}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Created: {formatDate(discount.createdDate || discount.createdAt)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-left">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(discount.type || 'percentage')}`}>
                          {(discount.type || 'percentage') === 'percentage' ? `${discount.value || 0}%` : formatCurrency(discount.value || 0)}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          Min: {formatCurrency(discount.minOrderAmount || 0)}
                        </div>
                        {discount.maxDiscountAmount && (
                          <div className="text-xs text-gray-500">
                            Max: {formatCurrency(discount.maxDiscountAmount)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-left">
                        <div className="text-sm text-gray-900">
                          {discount.usedCount} / {discount.totalUsageLimit || '∞'}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${Math.min(getUsagePercentage(discount.usedCount, discount.totalUsageLimit), 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {getUsagePercentage(discount.usedCount, discount.totalUsageLimit)}% used
                        </div>
                        {discount.usageLimitPerUser && (
                          <div className="text-xs text-gray-400 mt-1">
                            Max {discount.usageLimitPerUser} per user
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-left text-sm">
                        <div className="flex items-center text-xs text-gray-500 mb-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          From: {formatDate(discount.validFrom)}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          Until: {formatDate(discount.validUntil)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(discount.status || 'inactive')}`}>
                        {(discount.status || 'inactive').charAt(0).toUpperCase() + (discount.status || 'inactive').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const discountId = discount._id || discount.id;
                            const isValidId = discountId &&
                                            typeof discountId === 'string' &&
                                            discountId.length === 24 &&
                                            /^[0-9a-fA-F]{24}$/.test(discountId);
                            if (isValidId) {
                              navigate(`/admin/discounts/${discountId}`);
                            } else {
                              console.error('Invalid discount ID:', discountId);
                              alert('Cannot view discount: Invalid ID');
                            }
                          }}
                          className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const discountId = discount._id || discount.id;
                            const isValidId = discountId &&
                                            typeof discountId === 'string' &&
                                            discountId.length === 24 &&
                                            /^[0-9a-fA-F]{24}$/.test(discountId);
                            if (isValidId) {
                              navigate(`/admin/discounts/${discountId}/edit`);
                            } else {
                              console.error('Invalid discount ID:', discountId);
                              alert('Cannot edit discount: Invalid ID');
                            }
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Edit Discount"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const discountId = discount._id || discount.id;
                            const isValidId = discountId &&
                                            typeof discountId === 'string' &&
                                            discountId.length === 24 &&
                                            /^[0-9a-fA-F]{24}$/.test(discountId);
                            if (isValidId) {
                              handleDeleteDiscount(discountId);
                            } else {
                              console.error('Invalid discount ID:', discountId);
                              alert('Cannot delete discount: Invalid ID');
                            }
                          }}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete Discount"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="relative">
                          <button
                            className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                            title="More Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 text-left">
                    Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, totalDiscounts)}
                    </span>{' '}
                    of <span className="font-medium">{totalDiscounts}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    {totalPages > 0 && [...Array(Math.min(totalPages, 10))].map((_, index) => {
                      const page = index + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {displayDiscounts.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Percent className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No discounts found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'Get started by creating your first discount code.'}
            </p>
            <button
              onClick={() => navigate('/admin/discounts/create')}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Discount
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDiscountsPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  AlertCircle,
  Calendar,
  Search,
  Filter,
  Download,
  Trash2,
  RotateCcw,
  Package,
  DollarSign,
  Eye,
  ChevronDown,
  X
} from 'lucide-react';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';

const StoreManagerExpiryAlerts = () => {
  const navigate = useNavigate();
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters and pagination
  const [filters, setFilters] = useState({
    urgency: 'all',
    category: 'all',
    search: '',
    days: 90
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('expiryDate');
  const [sortOrder, setSortOrder] = useState('asc');

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    fetchExpiryAlerts();
    fetchSummary();
  }, [filters, currentPage, sortBy, sortOrder]);

  const fetchExpiryAlerts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams({
        urgency: filters.urgency,
        category: filters.category,
        search: filters.search,
        days: filters.days,
        page: currentPage,
        limit: 20,
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/store-manager/expiry-alerts?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch expiry alerts');
      }

      const data = await response.json();
      setExpiryAlerts(data.data);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Expiry alerts fetch error:', error);
      setError('Failed to load expiry alerts');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/store-manager/expiry-alerts/summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.data);
      }
    } catch (error) {
      console.error('Summary fetch error:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleMarkAsDisposed = async (medicineIds, reason = 'Expired', notes = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/store-manager/expiry-alerts/mark-disposed', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          medicineIds: Array.isArray(medicineIds) ? medicineIds : [medicineIds],
          reason,
          notes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to mark medicines as disposed');
      }

      const data = await response.json();

      // Refresh the data
      fetchExpiryAlerts();
      fetchSummary();
      setSelectedItems([]);

      // Show success message (you can implement a toast notification here)
      alert(`${data.data.modifiedCount} medicines marked as disposed successfully`);
    } catch (error) {
      console.error('Mark as disposed error:', error);
      alert('Failed to mark medicines as disposed');
    }
  };

  const handleExtendExpiry = async (medicineId, newExpiryDate, reason = '', notes = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/store-manager/expiry-alerts/${medicineId}/extend-expiry`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newExpiryDate,
          reason,
          notes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to extend expiry date');
      }

      const data = await response.json();

      // Refresh the data
      fetchExpiryAlerts();
      fetchSummary();

      // Show success message
      alert('Expiry date updated successfully');
    } catch (error) {
      console.error('Extend expiry error:', error);
      alert('Failed to update expiry date');
    }
  };

  const getUrgencyBadge = (urgencyLevel, daysToExpiry) => {
    const badges = {
      expired: 'bg-red-100 text-red-800 border-red-200',
      critical: 'bg-red-100 text-red-800 border-red-200',
      warning: 'bg-orange-100 text-orange-800 border-orange-200',
      upcoming: 'bg-blue-100 text-blue-800 border-blue-200'
    };

    const labels = {
      expired: 'Expired',
      critical: 'Critical',
      warning: 'Warning',
      upcoming: 'Upcoming'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badges[urgencyLevel] || badges.upcoming}`}>
        {labels[urgencyLevel] || 'Unknown'}
        {daysToExpiry !== null && (
          <span className="ml-1">
            ({daysToExpiry < 0 ? `${Math.abs(daysToExpiry)}d ago` : `${daysToExpiry}d`})
          </span>
        )}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const urgencyOptions = [
    { value: 'all', label: 'All Items', count: summary?.summary?.total?.count || 0 },
    { value: 'expired', label: 'Expired', count: summary?.summary?.expired?.count || 0 },
    { value: 'critical', label: 'Critical (≤7 days)', count: summary?.summary?.critical?.count || 0 },
    { value: 'warning', label: 'Warning (8-30 days)', count: summary?.summary?.warning?.count || 0 },
    { value: 'upcoming', label: 'Upcoming (31-90 days)', count: summary?.summary?.upcoming?.count || 0 }
  ];

  const categories = [
    'all', 'Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Cream', 'Ointment',
    'Powder', 'Inhaler', 'Spray', 'Gel', 'Lotion', 'Solution', 'Suspension',
    'Patch', 'Suppository', 'Other'
  ];

  if (loading && expiryAlerts.length === 0) {
    return (
      <StoreManagerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </StoreManagerLayout>
    );
  }

  return (
    <StoreManagerLayout>
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 text-left">Expiry Alerts</h1>
                <p className="text-gray-600 text-left">Monitor and manage medicine expiry dates</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            {summary && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {summary.summary.expired.count}
                      </div>
                      <div className="text-sm text-red-600">Expired</div>
                      <div className="text-xs text-gray-500">
                        ₹{summary.summary.expired.value?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-8 w-8 text-red-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {summary.summary.critical.count}
                      </div>
                      <div className="text-sm text-red-600">Critical</div>
                      <div className="text-xs text-gray-500">≤7 days</div>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-orange-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {summary.summary.warning.count}
                      </div>
                      <div className="text-sm text-orange-600">Warning</div>
                      <div className="text-xs text-gray-500">8-30 days</div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {summary.summary.upcoming.count}
                      </div>
                      <div className="text-sm text-blue-600">Upcoming</div>
                      <div className="text-xs text-gray-500">31-90 days</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Urgency Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level</label>
                  <select
                    value={filters.urgency}
                    onChange={(e) => handleFilterChange('urgency', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    {urgencyOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label} ({option.count})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Days Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Days Ahead</label>
                  <select
                    value={filters.days}
                    onChange={(e) => handleFilterChange('days', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                    <option value={180}>180 days</option>
                    <option value={365}>1 year</option>
                  </select>
                </div>

                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search medicines..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          {/* Expiry Alerts Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 text-left">
                  Expiry Alerts ({expiryAlerts.length})
                </h3>
                {selectedItems.length > 0 && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to mark ${selectedItems.length} medicines as disposed?`)) {
                          handleMarkAsDisposed(selectedItems, 'Expired', 'Bulk disposal from expiry alerts');
                        }
                      }}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Mark as Disposed ({selectedItems.length})
                    </button>
                    <button
                      onClick={() => {
                        alert('Return order functionality will be implemented in the next update');
                      }}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Create Return Order
                    </button>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : expiryAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No expiry alerts</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {filters.urgency === 'all'
                      ? 'All medicines are within safe expiry ranges.'
                      : `No medicines found for ${filters.urgency} urgency level.`
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems(expiryAlerts.map(item => item._id));
                              } else {
                                setSelectedItems([]);
                              }
                            }}
                          />
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('name')}
                        >
                          Medicine Name
                          {sortBy === 'name' && (
                            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Batch
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('expiryDate')}
                        >
                          Expiry Date
                          {sortBy === 'expiryDate' && (
                            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Urgency
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value at Risk
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {expiryAlerts.map((medicine) => (
                        <tr key={medicine._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                              checked={selectedItems.includes(medicine._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedItems([...selectedItems, medicine._id]);
                                } else {
                                  setSelectedItems(selectedItems.filter(id => id !== medicine._id));
                                }
                              }}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 text-left">
                              {medicine.name}
                            </div>
                            <div className="text-sm text-gray-500 text-left">
                              {medicine.genericName}
                            </div>
                            <div className="text-xs text-gray-400 text-left">
                              {medicine.manufacturer}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                            {medicine.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                            {medicine.batchNumber || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                            {formatDate(medicine.expiryDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getUrgencyBadge(medicine.urgencyLevel, medicine.daysToExpiry)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-left">
                            <div className="space-y-1">
                              {medicine.unitTypes?.hasStrips && medicine.stripInfo && (
                                <div>Strips: {medicine.stripInfo.stock || 0}</div>
                              )}
                              {medicine.unitTypes?.hasIndividual && medicine.individualInfo && (
                                <div>Units: {medicine.individualInfo.stock || 0}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600 text-left">
                            ₹{medicine.stockValue?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => navigate(`/store-panel/inventory/medicine/${medicine._id}`)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to mark "${medicine.name}" as disposed?`)) {
                                    handleMarkAsDisposed(medicine._id, 'Expired', `Disposed due to expiry on ${formatDate(medicine.expiryDate)}`);
                                  }
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Mark as Disposed"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const newDate = prompt('Enter new expiry date (YYYY-MM-DD):');
                                  if (newDate) {
                                    const reason = prompt('Reason for extending expiry date:') || 'Manual extension';
                                    handleExtendExpiry(medicine._id, newDate, reason, 'Extended from expiry alerts');
                                  }
                                }}
                                className="text-orange-600 hover:text-orange-900"
                                title="Extend Expiry Date"
                              >
                                <Calendar className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StoreManagerLayout>
  );
};

export default StoreManagerExpiryAlerts;

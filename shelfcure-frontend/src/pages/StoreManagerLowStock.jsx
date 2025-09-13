import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingDown,
  Package,
  AlertTriangle,
  RefreshCw,
  ShoppingCart,
  Eye,
  Edit,
  ArrowLeft,
  Search,
  Filter
} from 'lucide-react';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';

const StoreManagerLowStock = () => {
  const navigate = useNavigate();
  const [lowStockMedicines, setLowStockMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchLowStockMedicines();
  }, [currentPage, searchTerm, categoryFilter]);

  const fetchLowStockMedicines = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        stockStatus: 'low',
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { category: categoryFilter })
      });

      const response = await fetch(`/api/store-manager/inventory?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch low stock medicines');
      }

      const data = await response.json();
      setLowStockMedicines(data.data.medicines || []);
      setTotalPages(data.data.totalPages || 1);
      setTotalCount(data.data.totalCount || 0);
    } catch (error) {
      console.error('Low stock medicines fetch error:', error);
      setError('Failed to load low stock medicines');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (medicine) => {
    const stripStock = medicine.stripInfo?.stock || medicine.inventory?.stripQuantity || 0;
    const individualStock = medicine.individualInfo?.stock || medicine.inventory?.individualQuantity || 0;
    const stripMin = medicine.stripInfo?.minStock || medicine.inventory?.stripMinimumStock || 0;
    const individualMin = medicine.individualInfo?.minStock || medicine.inventory?.individualMinimumStock || 0;

    const hasStrips = medicine.unitTypes?.hasStrips;
    const hasIndividual = medicine.unitTypes?.hasIndividual;

    let status = 'good';
    let color = 'bg-green-100 text-green-800';
    let label = 'In Stock';

    if (hasStrips && hasIndividual) {
      // Both enabled: Check strip stock only
      if (stripStock <= stripMin) {
        status = 'low';
        color = 'bg-red-100 text-red-800';
        label = 'Low Stock';
      }
    } else if (hasStrips) {
      // Only strips enabled
      if (stripStock <= stripMin) {
        status = 'low';
        color = 'bg-red-100 text-red-800';
        label = 'Low Stock';
      }
    } else if (hasIndividual) {
      // Only individual enabled
      if (individualStock <= individualMin) {
        status = 'low';
        color = 'bg-red-100 text-red-800';
        label = 'Low Stock';
      }
    }

    return { status, color, label };
  };

  const handleReorder = (medicine) => {
    navigate('/store-panel/purchases', { 
      state: { 
        preselectedMedicine: medicine,
        action: 'reorder'
      }
    });
  };

  if (loading) {
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
            <div className="flex items-center mb-4">
              <button
                onClick={() => navigate('/store-panel/dashboard')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center">
                <TrendingDown className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 text-left">Low Stock Items</h1>
                  <p className="text-gray-600 text-left">Medicines that need immediate attention</p>
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-red-600">Critical Items</p>
                    <p className="text-2xl font-bold text-red-900">{totalCount}</p>
                  </div>
                </div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-orange-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-orange-600">Reorder Required</p>
                    <p className="text-2xl font-bold text-orange-900">{totalCount}</p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <ShoppingCart className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-blue-600">Quick Actions</p>
                    <button
                      onClick={() => navigate('/store-panel/purchases')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Create Purchase Order →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Medicines</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, generic name..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">All Categories</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Injection">Injection</option>
                  <option value="Cream">Cream</option>
                  <option value="Drops">Drops</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          {/* Low Stock Medicines Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Low Stock Medicines</h2>
              <button
                onClick={fetchLowStockMedicines}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>

            {lowStockMedicines.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Medicine Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Minimum Stock
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
                    {lowStockMedicines.map((medicine) => {
                      const stockStatus = getStockStatus(medicine);
                      const stripStock = medicine.stripInfo?.stock || medicine.inventory?.stripQuantity || 0;
                      const individualStock = medicine.individualInfo?.stock || medicine.inventory?.individualQuantity || 0;
                      const stripMin = medicine.stripInfo?.minStock || medicine.inventory?.stripMinimumStock || 0;
                      const individualMin = medicine.individualInfo?.minStock || medicine.inventory?.individualMinimumStock || 0;

                      return (
                        <tr key={medicine._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 text-left">
                                {medicine.name}
                              </div>
                              <div className="text-sm text-gray-500 text-left">
                                {medicine.genericName || 'No generic name'}
                              </div>
                              <div className="text-xs text-gray-400 text-left">
                                {medicine.manufacturer || 'Unknown manufacturer'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 text-left">
                              {medicine.unitTypes?.hasStrips && (
                                <div>Strips: {stripStock}</div>
                              )}
                              {medicine.unitTypes?.hasIndividual && (
                                <div>Individual: {individualStock}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 text-left">
                              {medicine.unitTypes?.hasStrips && (
                                <div>Strips: {stripMin}</div>
                              )}
                              {medicine.unitTypes?.hasIndividual && (
                                <div>Individual: {individualMin}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {stockStatus.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleReorder(medicine)}
                                className="text-green-600 hover:text-green-900 flex items-center"
                              >
                                <ShoppingCart className="h-4 w-4 mr-1" />
                                Reorder
                              </button>
                              <button
                                onClick={() => navigate(`/store-panel/inventory?search=${medicine.name}`)}
                                className="text-blue-600 hover:text-blue-900 flex items-center"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No low stock items</h3>
                <p className="mt-1 text-sm text-gray-500">
                  All medicines are currently well-stocked.
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
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
      </div>
    </StoreManagerLayout>
  );
};

export default StoreManagerLowStock;

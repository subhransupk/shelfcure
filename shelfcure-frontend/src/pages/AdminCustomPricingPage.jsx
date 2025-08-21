import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import { API_ENDPOINTS, makeAuthenticatedRequest } from '../config/api';
import {
  DollarSign, Search, Eye, Plus, Edit, Trash2,
  ChevronLeft, ChevronRight, Calendar, Users,
  CheckCircle, XCircle, Package, CreditCard, Loader, AlertCircle
} from 'lucide-react';

const AdminCustomPricingPage = () => {
  const navigate = useNavigate();
  const [pricingConfigs, setPricingConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchPricingConfigs();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchPricingConfigs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for now since backend endpoint doesn't exist yet
      const mockConfigs = [
        {
          id: 1,
          name: 'Enterprise Discount',
          description: 'Special pricing for enterprise customers',
          discountType: 'percentage',
          discountValue: 25,
          applicablePlans: ['premium', 'enterprise'],
          minStores: 10,
          maxStores: 100,
          isActive: true,
          createdAt: '2024-01-15',
          usageCount: 5
        },
        {
          id: 2,
          name: 'Bulk Store Pricing',
          description: 'Pricing for customers with multiple stores',
          discountType: 'fixed',
          discountValue: 5000,
          applicablePlans: ['standard', 'premium'],
          minStores: 5,
          maxStores: 50,
          isActive: true,
          createdAt: '2024-01-10',
          usageCount: 12
        },
        {
          id: 3,
          name: 'New Customer Offer',
          description: 'First-time customer discount',
          discountType: 'percentage',
          discountValue: 15,
          applicablePlans: ['basic', 'standard'],
          minStores: 1,
          maxStores: 5,
          isActive: false,
          createdAt: '2024-01-05',
          usageCount: 8
        }
      ];

      // Filter based on search and status
      let filteredConfigs = mockConfigs;
      
      if (searchTerm) {
        filteredConfigs = filteredConfigs.filter(config =>
          config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          config.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (statusFilter !== 'all') {
        filteredConfigs = filteredConfigs.filter(config =>
          statusFilter === 'active' ? config.isActive : !config.isActive
        );
      }

      setPricingConfigs(filteredConfigs);
      setTotalPages(Math.ceil(filteredConfigs.length / itemsPerPage));
    } catch (error) {
      console.error('Error fetching pricing configs:', error);
      setError('Failed to load pricing configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfig = () => {
    navigate('/admin/custom-pricing/create');
  };

  const handleViewConfig = (id) => {
    navigate(`/admin/custom-pricing/${id}`);
  };

  const handleEditConfig = (id) => {
    navigate(`/admin/custom-pricing/${id}/edit`);
  };

  const handleDeleteConfig = async (id) => {
    if (window.confirm('Are you sure you want to delete this pricing configuration?')) {
      try {
        // TODO: Implement delete API call
        console.log('Deleting config:', id);
        fetchPricingConfigs(); // Refresh list
      } catch (error) {
        console.error('Error deleting config:', error);
      }
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </span>
    );
  };

  const formatDiscount = (type, value) => {
    return type === 'percentage' ? `${value}%` : `₹${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <AdminLayout title="Custom Pricing Configurations" subtitle="Manage custom pricing rules and discounts">
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">Loading pricing configurations...</span>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Custom Pricing Configurations" subtitle="Manage custom pricing rules and discounts">
        <div className="flex items-center justify-center h-64">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <span className="ml-2 text-red-600">Error: {error}</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Custom Pricing Configurations" 
      subtitle="Manage custom pricing rules and discounts"
      rightHeaderContent={
        <button
          onClick={handleCreateConfig}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          Create Configuration
        </button>
      }
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search configurations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pricing Configurations Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Configuration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
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
                {pricingConfigs.map((config) => (
                  <tr key={config.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{config.name}</div>
                        <div className="text-sm text-gray-500">{config.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDiscount(config.discountType, config.discountValue)}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">{config.discountType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {config.minStores} - {config.maxStores} stores
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{config.usageCount} times</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(config.isActive)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewConfig(config.id)}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditConfig(config.id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteConfig(config.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pricingConfigs.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pricing configurations</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new pricing configuration.</p>
              <div className="mt-6">
                <button
                  onClick={handleCreateConfig}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Configuration
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCustomPricingPage;

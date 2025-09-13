import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List,
  Edit,
  Trash2,
  Eye,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { getRacks, deleteRack, getRackCategoryColor } from '../../services/rackService';
import { hasPermission, canManageRacks, RACK_PERMISSIONS } from '../../utils/rolePermissions';
import { getCurrentUser } from '../../services/authService';

const RackManager = ({ onViewRack, onEditRack, onCreateRack, onViewOccupancy, onAssignMedicines }) => {
  const [racks, setRacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  const user = getCurrentUser();
  const userRole = user?.role;

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'general', label: 'General' },
    { value: 'refrigerated', label: 'Refrigerated' },
    { value: 'controlled_substances', label: 'Controlled Substances' },
    { value: 'otc', label: 'OTC' },
    { value: 'prescription', label: 'Prescription' },
    { value: 'surgical', label: 'Surgical' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'expired', label: 'Expired' },
    { value: 'quarantine', label: 'Quarantine' }
  ];

  useEffect(() => {
    fetchRacks();
    console.log('RackManager - User role:', userRole);
    console.log('RackManager - Can view rack:', hasPermission(userRole, RACK_PERMISSIONS.VIEW_RACK));
    console.log('RackManager - Can create rack:', hasPermission(userRole, RACK_PERMISSIONS.CREATE_RACK));
  }, [pagination.page, searchTerm, categoryFilter]);

  const fetchRacks = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined
      };

      const response = await getRacks(params);
      setRacks(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        pages: response.pagination?.pages || 0
      }));
      setError('');
    } catch (err) {
      console.error('Error fetching racks:', err);
      setError(err.message || 'Failed to fetch racks');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRack = async (rackId, rackName) => {
    if (!window.confirm(`Are you sure you want to delete rack "${rackName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteRack(rackId);
      fetchRacks(); // Refresh the list
    } catch (err) {
      console.error('Error deleting rack:', err);
      alert(err.message || 'Failed to delete rack');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCategoryFilter = (category) => {
    setCategoryFilter(category);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const RackCard = ({ rack }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 text-left">{rack.name}</h3>
            <p className="text-sm text-gray-500 text-left">Rack #{rack.rackNumber}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRackCategoryColor(rack.category)}`}>
            {rack.category}
          </span>
        </div>

        <div className="mt-4">
          <dl className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Total</dt>
              <dd className="font-medium text-gray-900">{rack.totalPositions || 0}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Occupied</dt>
              <dd className="font-medium text-gray-900">{rack.occupiedPositions || 0}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Occupancy</dt>
              <dd className={`font-medium ${
                (rack.occupancyPercentage || 0) > 80 ? 'text-red-600' :
                (rack.occupancyPercentage || 0) > 60 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {rack.occupancyPercentage || 0}%
              </dd>
            </div>
          </dl>
        </div>

        {rack.description && (
          <p className="mt-3 text-sm text-gray-600 text-left">{rack.description}</p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex space-x-2">
            {hasPermission(userRole, RACK_PERMISSIONS.VIEW_RACK) && (
              <button
                onClick={() => onViewRack(rack)}
                className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="View Rack Layout"
              >
                <Eye className="h-3 w-3" />
              </button>
            )}
            {hasPermission(userRole, RACK_PERMISSIONS.UPDATE_RACK) && (
              <button
                onClick={() => onEditRack(rack)}
                className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                title="Edit Rack"
              >
                <Edit className="h-3 w-3" />
              </button>
            )}
            {hasPermission(userRole, RACK_PERMISSIONS.DELETE_RACK) && (
              <button
                onClick={() => handleDeleteRack(rack._id, rack.name)}
                className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                title="Delete Rack"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <MapPin className="h-3 w-3 mr-1" />
            <span>{rack.location?.zone || 'No location'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const RackListItem = ({ rack }) => (
    <li>
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-gray-600" />
              </div>
            </div>
            <div className="ml-4">
              <div className="flex items-center">
                <p className="text-sm font-medium text-gray-900 text-left">{rack.name}</p>
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRackCategoryColor(rack.category)}`}>
                  {rack.category}
                </span>
              </div>
              <p className="text-sm text-gray-500 text-left">Rack #{rack.rackNumber}</p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">{rack.totalPositions || 0}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">{rack.occupiedPositions || 0}</div>
              <div className="text-xs text-gray-500">Occupied</div>
            </div>
            <div className="text-center">
              <div className={`text-sm font-medium ${
                (rack.occupancyPercentage || 0) > 80 ? 'text-red-600' :
                (rack.occupancyPercentage || 0) > 60 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {rack.occupancyPercentage || 0}%
              </div>
              <div className="text-xs text-gray-500">Occupancy</div>
            </div>

            <div className="flex items-center space-x-2">
              {hasPermission(userRole, RACK_PERMISSIONS.VIEW_RACK) && (
                <button
                  onClick={() => onViewRack(rack)}
                  className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  title="View Rack Layout"
                >
                  <Eye className="h-3 w-3" />
                </button>
              )}
              {hasPermission(userRole, RACK_PERMISSIONS.UPDATE_RACK) && (
                <button
                  onClick={() => onEditRack(rack)}
                  className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  title="Edit Rack"
                >
                  <Edit className="h-3 w-3" />
                </button>
              )}
              {hasPermission(userRole, RACK_PERMISSIONS.DELETE_RACK) && (
                <button
                  onClick={() => handleDeleteRack(rack._id, rack.name)}
                  className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  title="Delete Rack"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 text-left">Rack Management</h1>
          <p className="mt-2 text-sm text-gray-700 text-left">
            Manage your store's rack layout, organize medicine storage locations, and track inventory placement.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          {hasPermission(userRole, RACK_PERMISSIONS.CREATE_RACK) && (
            <button
              onClick={onCreateRack}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Rack
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {hasPermission(userRole, RACK_PERMISSIONS.CREATE_RACK) && (
            <button
              onClick={onCreateRack}
              className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Create Rack</span>
            </button>
          )}

          {hasPermission(userRole, RACK_PERMISSIONS.VIEW_RACK) && (
            <button
              onClick={(e) => {
                e.preventDefault();
                console.log('View Layout clicked, racks:', racks);

                if (racks.length > 0) {
                  // Find the first rack with positions or just use the first rack
                  const rackToView = racks.find(rack => rack.totalPositions > 0) || racks[0];
                  console.log('Selected rack to view:', rackToView);
                  if (onViewRack) {
                    onViewRack(rackToView);
                  } else {
                    console.error('onViewRack function not provided');
                    alert('View layout function not available');
                  }
                } else {
                  alert('No racks available to view. Please create a rack first using the "Create Rack" button.');
                }
              }}
              className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2 transition-colors"
            >
              <Grid className="h-5 w-5" />
              <span>View Layout</span>
            </button>
          )}

          {hasPermission(userRole, RACK_PERMISSIONS.ASSIGN_MEDICINE) && (
            <button
              onClick={() => {
                if (onAssignMedicines) {
                  onAssignMedicines();
                } else {
                  alert('Medicine assignment feature coming soon!');
                }
              }}
              className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2 transition-colors"
            >
              <Package className="h-5 w-5" />
              <span>Assign Medicines</span>
            </button>
          )}

          {hasPermission(userRole, RACK_PERMISSIONS.VIEW_OCCUPANCY) && (
            <button
              onClick={() => {
                if (onViewOccupancy) {
                  onViewOccupancy();
                } else {
                  alert('Occupancy report feature coming soon!');
                }
              }}
              className="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 flex items-center justify-center space-x-2 transition-colors"
            >
              <AlertCircle className="h-5 w-5" />
              <span>Occupancy Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search racks..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => handleCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">View:</span>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Racks Display */}
      {racks.length === 0 ? (
        <div className="bg-white shadow rounded-lg">
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No racks found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || categoryFilter !== 'all'
                ? 'No racks match your current filters.'
                : 'Get started by creating your first rack.'
              }
            </p>
            {hasPermission(userRole, RACK_PERMISSIONS.CREATE_RACK) && (
              <div className="mt-6">
                <button
                  onClick={onCreateRack}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Rack
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {racks.map(rack => (
                <RackCard key={rack._id} rack={rack} />
              ))}
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {racks.map(rack => (
                  <RackListItem key={rack._id} rack={rack} />
                ))}
              </ul>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                    <span className="font-medium">{pagination.pages}</span> ({pagination.total} total racks)
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                      disabled={pagination.page === pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RackManager;

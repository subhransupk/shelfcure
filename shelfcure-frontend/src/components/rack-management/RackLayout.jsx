import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  Info, 
  Edit, 
  Plus,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { getRackLayout, getStockStatusColor, formatLocationString } from '../../services/rackService';
import { hasPermission, RACK_PERMISSIONS } from '../../utils/rolePermissions';
import { getCurrentUser } from '../../services/authService';

const RackLayout = ({ rackId, onBack, onAssignMedicine, onEditLocation }) => {
  const [rackData, setRackData] = useState(null);
  const [layout, setLayout] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [showPositionDetails, setShowPositionDetails] = useState(false);

  const user = getCurrentUser();
  const userRole = user?.role;

  useEffect(() => {
    if (rackId) {
      fetchRackLayout();
    }
  }, [rackId]);

  const fetchRackLayout = async () => {
    try {
      setLoading(true);
      const response = await getRackLayout(rackId);
      setRackData(response.data.rack);
      setLayout(response.data.layout || []);
      setError('');
    } catch (err) {
      console.error('Error fetching rack layout:', err);
      setError(err.message || 'Failed to fetch rack layout');
    } finally {
      setLoading(false);
    }
  };

  const handlePositionClick = (shelf, position) => {
    setSelectedPosition({ shelf, position });
    setShowPositionDetails(true);
  };

  const handleAssignMedicine = (shelf, position) => {
    if (onAssignMedicine) {
      onAssignMedicine(rackId, shelf.shelfNumber, position.positionNumber);
    }
  };

  const handleEditLocation = (medicine) => {
    if (onEditLocation) {
      onEditLocation(medicine);
    }
  };

  const getPositionStatusColor = (position) => {
    if (!position.isOccupied) {
      return 'bg-gray-100 border-gray-300 hover:bg-gray-200';
    }
    
    if (position.medicine?.stockStatus) {
      switch (position.medicine.stockStatus.status) {
        case 'empty':
          return 'bg-red-100 border-red-300 hover:bg-red-200';
        case 'low':
          return 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200';
        case 'good':
          return 'bg-green-100 border-green-300 hover:bg-green-200';
        default:
          return 'bg-blue-100 border-blue-300 hover:bg-blue-200';
      }
    }
    
    return 'bg-blue-100 border-blue-300 hover:bg-blue-200';
  };

  const PositionDetailsModal = () => {
    if (!selectedPosition || !showPositionDetails) return null;

    const shelf = layout.find(s => s.shelfNumber === selectedPosition.shelf);
    const position = shelf?.positions.find(p => p.positionNumber === selectedPosition.position);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 text-left">
                Position {formatLocationString(rackData?.rackNumber, selectedPosition.shelf, selectedPosition.position)}
              </h3>
              <button
                onClick={() => setShowPositionDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {position?.isOccupied && position.medicine ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 text-left">{position.medicine.name}</h4>
                  <p className="text-sm text-gray-600 text-left">{position.medicine.genericName}</p>
                  <p className="text-sm text-gray-500 text-left">{position.medicine.manufacturer}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Strip Quantity</label>
                    <p className="text-lg font-semibold text-gray-900">{position.medicine.stripQuantity || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Individual Quantity</label>
                    <p className="text-lg font-semibold text-gray-900">{position.medicine.individualQuantity || 0}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(position.medicine.stockStatus)}`}>
                    {position.medicine.stockStatus?.label || 'Unknown'}
                  </span>
                  <span className="text-xs text-gray-500">
                    Priority: {position.medicine.priority}
                  </span>
                </div>

                <div className="text-xs text-gray-500 text-left">
                  <p>Assigned: {new Date(position.medicine.assignedDate).toLocaleDateString()}</p>
                  <p>By: {position.medicine.assignedBy?.name}</p>
                </div>

                {hasPermission(userRole, RACK_PERMISSIONS.UPDATE_LOCATION) && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditLocation(position.medicine)}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Empty Position</h4>
                <p className="text-gray-600 mb-4">This position is available for medicine assignment.</p>
                {hasPermission(userRole, RACK_PERMISSIONS.ASSIGN_MEDICINE) && (
                  <button
                    onClick={() => handleAssignMedicine(shelf, position)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Assign Medicine</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <span className="text-red-700">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 text-left">
              {rackData?.name} - Layout View
            </h2>
            <p className="text-gray-600 text-left">
              Rack #{rackData?.rackNumber} • {rackData?.occupiedPositions || 0} of {rackData?.totalPositions || 0} positions occupied
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-600">Occupancy</div>
            <div className={`text-lg font-semibold ${
              (rackData?.occupancyPercentage || 0) > 80 ? 'text-red-600' : 
              (rackData?.occupancyPercentage || 0) > 60 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {rackData?.occupancyPercentage || 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3 text-left">Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
            <span className="text-sm text-gray-600">Empty</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-sm text-gray-600">Good Stock</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span className="text-sm text-gray-600">Low Stock</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-sm text-gray-600">Empty/Critical</span>
          </div>
        </div>
      </div>

      {/* Rack Layout */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {layout.map((shelf, shelfIndex) => (
            <div key={shelf.shelfNumber} className="space-y-3">
              <div className="flex items-center space-x-2">
                <h4 className="text-lg font-medium text-gray-900">Shelf {shelf.shelfNumber}</h4>
                <span className="text-sm text-gray-500">
                  ({shelf.positions.filter(p => p.isOccupied).length} of {shelf.positions.length} occupied)
                </span>
              </div>
              
              <div className="grid grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-2">
                {shelf.positions.map((position, positionIndex) => (
                  <div
                    key={position.positionNumber}
                    onClick={() => handlePositionClick(shelf.shelfNumber, position.positionNumber)}
                    className={`
                      relative aspect-square border-2 rounded-lg cursor-pointer transition-all duration-200
                      ${getPositionStatusColor(position)}
                      hover:scale-105 hover:shadow-md
                    `}
                    title={`Position ${position.positionNumber}${position.medicine ? ` - ${position.medicine.name}` : ' - Empty'}`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">
                        {position.positionNumber}
                      </span>
                    </div>
                    
                    {position.isOccupied && (
                      <div className="absolute -top-1 -right-1">
                        {position.medicine?.stockStatus?.status === 'good' ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : position.medicine?.stockStatus?.status === 'low' ? (
                          <Clock className="h-3 w-3 text-yellow-600" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-red-600" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {layout.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No layout configured</h3>
            <p className="text-gray-600">This rack doesn't have any shelves or positions configured yet.</p>
          </div>
        )}
      </div>

      {/* Position Details Modal */}
      <PositionDetailsModal />
    </div>
  );
};

export default RackLayout;

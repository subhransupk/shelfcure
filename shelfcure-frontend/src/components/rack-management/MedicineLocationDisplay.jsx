import React, { useState, useEffect } from 'react';
import { MapPin, Package, AlertCircle, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { getMedicineLocations, getStockStatusColor, formatLocationString, getPriorityColor } from '../../services/rackService';

const MedicineLocationDisplay = ({ 
  medicineId, 
  compact = false, 
  showQuantities = true, 
  maxLocations = 3,
  onLocationClick = null 
}) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (medicineId) {
      fetchMedicineLocations();
    }
  }, [medicineId]);

  const fetchMedicineLocations = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getMedicineLocations(medicineId);
      setLocations(response.data?.locations || []);
    } catch (err) {
      console.error('Error fetching medicine locations:', err);
      setError('Failed to load locations');
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationClick = (location) => {
    if (onLocationClick) {
      onLocationClick(location);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
        <span className="text-xs">Loading locations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-1 text-red-500">
        <AlertCircle className="h-3 w-3" />
        <span className="text-xs">{error}</span>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="flex items-center space-x-1 text-gray-400">
        <MapPin className="h-3 w-3" />
        <span className="text-xs">No location assigned</span>
      </div>
    );
  }

  const displayLocations = expanded ? locations : locations.slice(0, maxLocations);
  const hasMore = locations.length > maxLocations;

  if (compact) {
    return (
      <div className="space-y-1">
        {displayLocations.map((location, index) => (
          <div 
            key={index} 
            className={`flex items-center space-x-1 ${onLocationClick ? 'cursor-pointer hover:bg-gray-50 rounded px-1' : ''}`}
            onClick={() => handleLocationClick(location)}
          >
            <MapPin className="h-3 w-3 text-gray-400" />
            <span className="text-xs font-medium">
              {formatLocationString(location.rack.rackNumber, location.shelf, location.position)}
            </span>
            {showQuantities && (
              <span className="text-xs text-gray-500">
                ({location.quantity.strips || 0}s/{location.quantity.individual || 0}u)
              </span>
            )}
            <span className={`px-1 py-0.5 rounded text-xs ${getStockStatusColor(location.stockStatus)}`}>
              {location.stockStatus?.label || 'Unknown'}
            </span>
          </div>
        ))}
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            <span>{expanded ? 'Show less' : `+${locations.length - maxLocations} more`}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900 text-left">Rack Locations</h4>
        <span className="text-xs text-gray-500">{locations.length} location{locations.length !== 1 ? 's' : ''}</span>
      </div>
      
      <div className="space-y-2">
        {displayLocations.map((location, index) => (
          <div 
            key={index} 
            className={`bg-white rounded border p-2 ${onLocationClick ? 'cursor-pointer hover:border-green-300' : ''}`}
            onClick={() => handleLocationClick(location)}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-sm">
                  {formatLocationString(location.rack.rackNumber, location.shelf, location.position)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(location.priority)}`}>
                  {location.priority}
                </span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(location.stockStatus)}`}>
                {location.stockStatus?.label || 'Unknown'}
              </span>
            </div>
            
            <div className="text-xs text-gray-600 mb-2 text-left">
              <p className="font-medium">{location.rack.name}</p>
              <p>Category: {location.rack.category}</p>
              {location.rack.location?.zone && (
                <p>Zone: {location.rack.location.zone}</p>
              )}
            </div>

            {showQuantities && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-blue-50 rounded p-1">
                  <span className="text-gray-600">Strips:</span>
                  <span className="ml-1 font-medium">{location.quantity.strips || 0}</span>
                </div>
                <div className="bg-green-50 rounded p-1">
                  <span className="text-gray-600">Individual:</span>
                  <span className="ml-1 font-medium">{location.quantity.individual || 0}</span>
                </div>
              </div>
            )}

            {location.notes && (
              <div className="mt-2 text-xs text-gray-500 text-left">
                <p>Note: {location.notes}</p>
              </div>
            )}

            {onLocationClick && (
              <div className="mt-2 flex justify-end">
                <button className="text-blue-600 hover:text-blue-800">
                  <Eye className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center space-x-1 text-sm text-blue-600 hover:text-blue-800 py-1"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <span>{expanded ? 'Show less' : `Show ${locations.length - maxLocations} more locations`}</span>
        </button>
      )}
    </div>
  );
};

// Quick location summary component for inline display
export const MedicineLocationSummary = ({ medicineId, className = '' }) => {
  return (
    <MedicineLocationDisplay
      medicineId={medicineId}
      compact={true}
      showQuantities={true}
      maxLocations={2}
      className={className}
    />
  );
};

// Detailed location display for modals or dedicated sections
export const MedicineLocationDetails = ({ medicineId, onLocationClick }) => {
  return (
    <MedicineLocationDisplay
      medicineId={medicineId}
      compact={false}
      showQuantities={true}
      maxLocations={5}
      onLocationClick={onLocationClick}
    />
  );
};

export default MedicineLocationDisplay;

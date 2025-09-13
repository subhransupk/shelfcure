import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  Package, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Barcode,
  Building
} from 'lucide-react';
import { searchMedicineLocationsStaff, searchMedicineLocations, getStockStatusColor, formatLocationString, getPriorityColor } from '../../services/rackService';

const MedicineLocationSearch = ({ isStaffView = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    // Focus search input on component mount
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const debounceTimer = setTimeout(() => {
        performSearch();
      }, 300);

      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults([]);
      setSelectedMedicine(null);
    }
  }, [searchQuery]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError('');
      
      const searchFunction = isStaffView ? searchMedicineLocationsStaff : searchMedicineLocations;
      const response = await searchFunction({
        query: searchQuery.trim(),
        limit: 20
      });

      setSearchResults(response.data || []);
    } catch (err) {
      console.error('Error searching medicine locations:', err);
      setError(err.message || 'Failed to search medicine locations');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMedicineSelect = (medicine) => {
    setSelectedMedicine(selectedMedicine?.medicine.id === medicine.medicine.id ? null : medicine);
  };

  const LocationCard = ({ location, isSelected = false }) => (
    <div className={`border rounded-lg p-3 transition-all duration-200 ${
      isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-gray-900">
            {formatLocationString(location.rack.rackNumber, location.shelf, location.position)}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(location.priority)}`}>
            {location.priority}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {location.stockStatus?.status === 'good' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : location.stockStatus?.status === 'low' ? (
            <Clock className="h-4 w-4 text-yellow-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <span className={`text-xs font-medium ${getStockStatusColor(location.stockStatus)}`}>
            {location.stockStatus?.label || 'Unknown'}
          </span>
        </div>
      </div>

      <div className="text-sm text-gray-600 mb-2 text-left">
        <p className="font-medium">{location.rack.name}</p>
        <p>Category: {location.rack.category}</p>
        {location.rack.location?.zone && (
          <p>Zone: {location.rack.location.zone}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Strips:</span>
          <span className="ml-2 font-medium">{location.quantity.strips || 0}</span>
        </div>
        <div>
          <span className="text-gray-500">Individual:</span>
          <span className="ml-2 font-medium">{location.quantity.individual || 0}</span>
        </div>
      </div>

      {location.notes && (
        <div className="mt-2 text-xs text-gray-500 text-left">
          <p>Note: {location.notes}</p>
        </div>
      )}
    </div>
  );

  const MedicineCard = ({ medicine, isExpanded, onToggle }) => (
    <div className="bg-white shadow rounded-lg hover:shadow-md transition-shadow">
      <div
        className="px-4 py-5 sm:p-6 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 text-left">{medicine.medicine.name}</h3>
            {medicine.medicine.genericName && (
              <p className="text-sm text-gray-600 text-left">{medicine.medicine.genericName}</p>
            )}
            <p className="text-sm text-gray-500 text-left">{medicine.medicine.manufacturer}</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {medicine.medicine.category}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {medicine.totalLocations} location{medicine.totalLocations !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {medicine.medicine.barcode && (
          <div className="flex items-center space-x-2 mt-2">
            <Barcode className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{medicine.medicine.barcode}</span>
          </div>
        )}

        <div className="mt-4">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Total Strips</dt>
              <dd className="font-medium text-gray-900">{medicine.totalRackStock.strips}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Total Individual</dt>
              <dd className="font-medium text-gray-900">{medicine.totalRackStock.individual}</dd>
            </div>
          </dl>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4 text-left">All Locations</h4>
          <div className="space-y-4">
            {medicine.locations.map((location, index) => (
              <LocationCard key={index} location={location} />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 text-left">
            {isStaffView ? 'Find Medicine Location' : 'Medicine Location Search'}
          </h1>
          <p className="mt-2 text-sm text-gray-700 text-left">
            Search for medicines to find their rack locations and current stock levels
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by medicine name, generic name, manufacturer, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-base"
            />
          </div>

          {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
            <p className="mt-2 text-sm text-gray-500">Type at least 2 characters to search</p>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white shadow rounded-lg">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-600">Searching...</span>
          </div>
        </div>
      )}

      {/* Error State */}
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

      {/* Search Results */}
      {!loading && searchQuery.trim().length >= 2 && (
        <div>
          {searchResults.length === 0 ? (
            <div className="bg-white shadow rounded-lg">
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No medicines found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No medicines match your search query "{searchQuery}". Try different keywords.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 text-left">
                  Search Results ({searchResults.length})
                </h3>
              </div>

              <div className="space-y-4">
                {searchResults.map((medicine, index) => (
                  <MedicineCard
                    key={medicine.medicine.id}
                    medicine={medicine}
                    isExpanded={selectedMedicine?.medicine.id === medicine.medicine.id}
                    onToggle={() => handleMedicineSelect(medicine)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Instructions */}
      {searchQuery.trim().length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-6">
          <div className="flex">
            <Building className="h-6 w-6 text-blue-600" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-900 text-left">How to use Medicine Location Search</h3>
              <div className="mt-2 text-sm text-blue-800">
                <ul className="list-disc list-inside space-y-1 text-left">
                  <li>Type the medicine name, generic name, or manufacturer</li>
                  <li>You can also search using the barcode number</li>
                  <li>Click on any medicine to see all its rack locations</li>
                  <li>Each location shows current stock levels and priority</li>
                  <li>Color indicators show stock status: Green (Good), Yellow (Low), Red (Empty)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineLocationSearch;

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Package, 
  Search, 
  MapPin,
  Plus,
  AlertCircle,
  CheckCircle,
  Grid,
  List,
  Pill,
  Building
} from 'lucide-react';
import { 
  getUnassignedMedicines, 
  getRacks, 
  assignMedicineToLocation,
  getRackLayout 
} from '../../services/rackService';

const MedicineAssignment = ({ onBack }) => {
  const [unassignedMedicines, setUnassignedMedicines] = useState([]);
  const [racks, setRacks] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [selectedRack, setSelectedRack] = useState(null);
  const [rackLayout, setRackLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [medicinesResponse, racksResponse] = await Promise.all([
        getUnassignedMedicines(),
        getRacks()
      ]);

      setUnassignedMedicines(medicinesResponse.data || []);
      setRacks(racksResponse.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleRackSelect = async (rack) => {
    try {
      setSelectedRack(rack);
      const layoutResponse = await getRackLayout(rack._id);
      setRackLayout(layoutResponse.data);
    } catch (err) {
      console.error('Error fetching rack layout:', err);
      setError('Failed to load rack layout');
    }
  };

  const handleAssignMedicine = async (shelf, position) => {
    if (!selectedMedicine || !selectedRack) return;

    try {
      setAssigning(true);

      await assignMedicineToLocation({
        medicineId: selectedMedicine._id,
        rackId: selectedRack._id,
        shelf: String(shelf),
        position: String(position),
        stripQuantity: selectedMedicine.inventory?.stripQuantity || 0,
        individualQuantity: selectedMedicine.inventory?.individualQuantity || 0,
        priority: 'primary',
        notes: 'Assigned via rack management interface'
      });

      // Refresh data
      await fetchData();
      setSelectedMedicine(null);
      setSelectedRack(null);
      setRackLayout(null);

      alert('Medicine assigned successfully!');
    } catch (err) {
      console.error('Error assigning medicine:', err);
      setError(err.message || 'Failed to assign medicine');
    } finally {
      setAssigning(false);
    }
  };

  const filteredMedicines = unassignedMedicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.genericName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Loading medicines...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md mr-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 text-left">Assign Medicines to Racks</h1>
          <p className="mt-2 text-sm text-gray-700 text-left">
            Assign unassigned medicines to specific rack locations for better organization
          </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unassigned Medicines */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 text-left">
                Unassigned Medicines ({filteredMedicines.length})
              </h3>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>

            {/* Medicine List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredMedicines.length === 0 ? (
                <div className="text-center py-8">
                  <Pill className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    {searchTerm ? 'No medicines match your search' : 'All medicines are assigned to racks'}
                  </p>
                </div>
              ) : (
                filteredMedicines.map((medicine) => (
                  <div
                    key={medicine._id}
                    onClick={() => setSelectedMedicine(medicine)}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${
                      selectedMedicine?._id === medicine._id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 text-left">{medicine.name}</h4>
                        <p className="text-xs text-gray-500 text-left">{medicine.manufacturer}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {medicine.inventory?.stripQuantity || 0}s / {medicine.inventory?.individualQuantity || 0}u
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Rack Selection and Assignment */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">
              {selectedMedicine ? `Assign "${selectedMedicine.name}"` : 'Select a Medicine'}
            </h3>

            {!selectedMedicine ? (
              <div className="text-center py-8">
                <Package className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Select a medicine from the left to assign it to a rack location
                </p>
              </div>
            ) : (
              <div>
                {/* Selected Medicine Info */}
                <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <div className="ml-2">
                      <p className="text-sm font-medium text-green-800 text-left">{selectedMedicine.name}</p>
                      <p className="text-xs text-green-600 text-left">
                        Stock: {selectedMedicine.inventory?.stripQuantity || 0} strips, {selectedMedicine.inventory?.individualQuantity || 0} units
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rack Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Select Rack</label>
                  <div className="space-y-2">
                    {racks.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No racks available
                      </div>
                    ) : (
                      racks.map((rack) => (
                      <button
                        key={rack._id}
                        onClick={() => handleRackSelect(rack)}
                        className={`w-full p-3 text-left border rounded-md transition-colors ${
                          selectedRack?._id === rack._id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{rack.name}</p>
                            <p className="text-xs text-gray-500">Rack #{rack.rackNumber} • {rack.category}</p>
                          </div>
                          <div className="text-xs text-gray-500">
                            {rack.occupiedPositions || 0}/{rack.totalPositions || 0} occupied
                          </div>
                        </div>
                      </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Position Selection */}
                {selectedRack && rackLayout && rackLayout.layout && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Select Position</label>
                    <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                      {rackLayout.layout.map((shelf) => (
                        <div key={shelf.shelfNumber} className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2 text-left">
                            Shelf {shelf.shelfNumber}
                          </h4>
                          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(shelf.positions.length, 12)}, 1fr)` }}>
                            {shelf.positions.map((position) => {
                              const isOccupied = position.isOccupied;

                              return (
                                <button
                                  key={`${shelf.shelfNumber}-${position.positionNumber}`}
                                  onClick={() => !isOccupied && handleAssignMedicine(shelf.shelfNumber, position.positionNumber)}
                                  disabled={isOccupied || assigning}
                                  className={`aspect-square text-xs font-medium rounded border-2 transition-colors ${
                                    isOccupied
                                      ? 'border-red-300 bg-red-100 text-red-700 cursor-not-allowed'
                                      : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer'
                                  } ${assigning ? 'opacity-50' : ''}`}
                                  title={isOccupied ? `Occupied by ${position.medicine?.name}` : `Available position ${shelf.shelfNumber}-${position.positionNumber}`}
                                >
                                  {isOccupied ? '●' : position.positionNumber}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                            <span>Available</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                            <span>Occupied</span>
                          </div>
                        </div>
                        <span>Click available positions to assign</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      {!selectedMedicine && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <Building className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 text-left">How to Assign Medicines</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ol className="list-decimal list-inside space-y-1 text-left">
                  <li>Select a medicine from the unassigned medicines list</li>
                  <li>Choose the rack where you want to place the medicine</li>
                  <li>Click on an available position in the rack layout</li>
                  <li>The medicine will be assigned to that specific location</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineAssignment;

import React, { useState } from 'react';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';
import RackManager from '../components/rack-management/RackManager';
import RackLayout from '../components/rack-management/RackLayout';
import RackForm from '../components/rack-management/RackForm';
import MedicineLocationSearch from '../components/rack-management/MedicineLocationSearch';
import RackOccupancyReport from '../components/rack-management/RackOccupancyReport';
import MedicineAssignment from '../components/rack-management/MedicineAssignment';

const StoreManagerRackManagement = () => {
  const [currentView, setCurrentView] = useState('manager'); // 'manager', 'layout', 'form', 'search', 'occupancy', 'assign'
  const [selectedRack, setSelectedRack] = useState(null);
  const [editingRack, setEditingRack] = useState(null);

  const handleViewRack = (rack) => {
    console.log('handleViewRack called with rack:', rack);
    setSelectedRack(rack);
    setCurrentView('layout');
  };

  const handleEditRack = (rack) => {
    setEditingRack(rack);
    setCurrentView('form');
  };

  const handleCreateRack = () => {
    setEditingRack(null);
    setCurrentView('form');
  };

  const handleRackSaved = (savedRack) => {
    setCurrentView('manager');
    setEditingRack(null);
    // Optionally refresh the rack list or show success message
  };

  const handleBackToManager = () => {
    setCurrentView('manager');
    setSelectedRack(null);
    setEditingRack(null);
  };

  const handleViewOccupancy = () => {
    setCurrentView('occupancy');
  };

  const handleAssignMedicines = () => {
    setCurrentView('assign');
  };

  const handleAssignMedicine = (rackId, shelf, position) => {
    // This would typically open a medicine assignment modal
    // For now, we'll just log the action
    console.log('Assign medicine to:', { rackId, shelf, position });
    // TODO: Implement medicine assignment modal
  };

  const handleEditLocation = (medicine) => {
    // This would typically open a location edit modal
    console.log('Edit location for medicine:', medicine);
    // TODO: Implement location edit modal
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'layout':
        return (
          <RackLayout
            rackId={selectedRack?._id}
            onBack={handleBackToManager}
            onAssignMedicine={handleAssignMedicine}
            onEditLocation={handleEditLocation}
          />
        );

      case 'form':
        return (
          <RackForm
            rack={editingRack}
            onSave={handleRackSaved}
            onCancel={handleBackToManager}
          />
        );

      case 'search':
        return (
          <MedicineLocationSearch />
        );

      case 'occupancy':
        return (
          <RackOccupancyReport onBack={handleBackToManager} />
        );

      case 'assign':
        return (
          <MedicineAssignment onBack={handleBackToManager} />
        );

      default:
        return (
          <RackManager
            onViewRack={handleViewRack}
            onEditRack={handleEditRack}
            onCreateRack={handleCreateRack}
            onViewOccupancy={handleViewOccupancy}
            onAssignMedicines={handleAssignMedicines}
          />
        );
    }
  };

  return (
    <StoreManagerLayout>
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Navigation Tabs */}
          {['manager', 'search', 'occupancy', 'assign'].includes(currentView) && (
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setCurrentView('manager')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      currentView === 'manager'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Rack Management
                  </button>
                  <button
                    onClick={() => setCurrentView('search')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      currentView === 'search'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Medicine Search
                  </button>
                  <button
                    onClick={() => setCurrentView('occupancy')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      currentView === 'occupancy'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Occupancy Report
                  </button>
                  <button
                    onClick={() => setCurrentView('assign')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      currentView === 'assign'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Assign Medicines
                  </button>
                </nav>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div>
            {renderCurrentView()}
          </div>
        </div>
      </div>
    </StoreManagerLayout>
  );
};

export default StoreManagerRackManagement;

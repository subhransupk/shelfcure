import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Package
} from 'lucide-react';
import { createRack, updateRack } from '../../services/rackService';

const RackForm = ({ rack = null, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    rackNumber: '',
    name: '',
    location: '',
    numberOfShelves: 3,
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (rack) {
      setFormData({
        rackNumber: rack.rackNumber || '',
        name: rack.name || '',
        location: rack.location?.zone || rack.location || '',
        numberOfShelves: rack.shelves?.length || 3,
        notes: rack.notes || ''
      });
    }
  }, [rack]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.rackNumber.trim() || !formData.name.trim()) {
      setError('Rack number and name are required');
      return;
    }

    if (formData.numberOfShelves < 1 || formData.numberOfShelves > 20) {
      setError('Number of shelves must be between 1 and 20');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Create simplified rack data structure
      const rackData = {
        rackNumber: formData.rackNumber.trim(),
        name: formData.name.trim(),
        location: {
          zone: formData.location.trim()
        },
        numberOfShelves: parseInt(formData.numberOfShelves),
        notes: formData.notes.trim(),
        // Set sensible defaults for complex fields
        category: 'general',
        accessLevel: 'public',
        specifications: {
          material: 'steel'
        }
      };

      let response;
      if (rack) {
        response = await updateRack(rack._id, rackData);
      } else {
        response = await createRack(rackData);
      }

      if (onSave) {
        onSave(response.data);
      }
    } catch (err) {
      console.error('Error saving rack:', err);
      setError(err.message || 'Failed to save rack');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onCancel}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 text-left">
              {rack ? 'Edit Rack' : 'Create New Rack'}
            </h2>
            <p className="text-gray-600 text-left">
              {rack ? 'Update rack information' : 'Add a new storage rack to your store'}
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Simplified Rack Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Package className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900 text-left">Rack Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                Rack Number *
              </label>
              <input
                type="text"
                value={formData.rackNumber}
                onChange={(e) => handleInputChange('rackNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., R001, A1, RACK-1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Give your rack a unique number or code</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                Rack Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Main Storage, Front Counter Rack"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Give your rack a descriptive name</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Near entrance, Back wall, Left side"
              />
              <p className="text-xs text-gray-500 mt-1">Where is this rack located in your store?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                Number of Shelves *
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.numberOfShelves}
                onChange={(e) => handleInputChange('numberOfShelves', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">How many shelves does this rack have? (1-20)</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Any additional notes about this rack..."
              />
              <p className="text-xs text-gray-500 mt-1">Add any special notes or instructions for this rack</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{loading ? 'Saving...' : (rack ? 'Update Rack' : 'Create Rack')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default RackForm;

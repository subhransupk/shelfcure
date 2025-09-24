import React, { useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { createNumericInputHandler, VALIDATION_OPTIONS } from '../../utils/inputValidation';

const AddMedicineRequestForm = ({ onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    medicineName: '',
    genericName: '',
    composition: '',
    manufacturer: '',
    quantity: 1,
    priority: 'medium'
  });

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    onError(''); // Clear any previous errors
    setLoading(true);

    // Validate required fields
    if (!formData.medicineName.trim()) {
      onError('Medicine name is required');
      setLoading(false);
      return;
    }
    if (!formData.quantity || formData.quantity < 1) {
      onError('Quantity must be at least 1');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/store-manager/medicine-requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          medicineName: formData.medicineName.trim(),
          manufacturer: formData.manufacturer.trim() || 'Not specified', // Required by backend
          composition: formData.composition.trim() || formData.genericName.trim() || 'Not specified', // Required by backend
          strength: 'Not specified', // Required by backend
          packSize: 'Not specified', // Required by backend
          requestedQuantity: parseInt(formData.quantity),
          unitType: 'strip', // Default unit type
          priority: formData.priority,
          category: 'Other', // Default category
          notes: `Added via quick request form${formData.genericName.trim() ? ` - Generic: ${formData.genericName.trim()}` : ''}${formData.composition.trim() ? ` - Composition: ${formData.composition.trim()}` : ''}`
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Medicine request "${formData.medicineName}" submitted successfully!`);

        // Reset form
        setFormData({
          medicineName: '',
          genericName: '',
          composition: '',
          manufacturer: '',
          quantity: 1,
          priority: 'medium'
        });

        // Close modal after delay
        setTimeout(() => {
          onSuccess();
          setSuccess('');
        }, 2000);

      } else {
        onError(data.message || 'Failed to submit medicine request');
      }
    } catch (error) {
      console.error('Error submitting medicine request:', error);
      onError('Failed to submit medicine request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <span className="text-green-700 text-sm text-left">{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 text-left mb-1">
            Medicine Name *
          </label>
          <input
            type="text"
            name="medicineName"
            value={formData.medicineName}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Enter medicine name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 text-left mb-1">
            Quantity *
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={createNumericInputHandler(
              (value) => setFormData(prev => ({ ...prev, quantity: value })),
              null,
              { ...VALIDATION_OPTIONS.QUANTITY, min: 1 }
            )}
            required
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Enter quantity"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 text-left mb-1">
            Priority *
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            {priorities.map(priority => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 text-left mb-1">
            Generic Name
          </label>
          <input
            type="text"
            name="genericName"
            value={formData.genericName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Enter generic name (optional)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 text-left mb-1">
            Composition
          </label>
          <input
            type="text"
            name="composition"
            value={formData.composition}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Enter composition (optional)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 text-left mb-1">
            Manufacturer
          </label>
          <input
            type="text"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Enter manufacturer name (optional)"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Submitting...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Submit Request
            </>
          )}
        </button>
      </form>
    </>
  );
};

export default AddMedicineRequestForm;

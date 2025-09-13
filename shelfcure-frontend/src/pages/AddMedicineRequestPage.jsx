import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, AlertCircle } from 'lucide-react';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';

const AddMedicineRequestPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    medicineName: '',
    manufacturer: '',
    composition: '',
    strength: '',
    packSize: '',
    requestedQuantity: 1,
    unitType: 'strip',
    priority: 'medium',
    category: 'Other',
    notes: '',
    supplierInfo: {
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: ''
    },
    estimatedCost: '',
    urgencyReason: ''
  });

  const unitTypes = [
    { value: 'strip', label: 'Strip' },
    { value: 'box', label: 'Box' },
    { value: 'bottle', label: 'Bottle' },
    { value: 'piece', label: 'Piece' },
    { value: 'vial', label: 'Vial' },
    { value: 'tube', label: 'Tube' },
    { value: 'packet', label: 'Packet' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-gray-600' },
    { value: 'medium', label: 'Medium', color: 'text-blue-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
  ];

  const categories = [
    'Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Cream', 'Ointment',
    'Powder', 'Inhaler', 'Spray', 'Gel', 'Lotion', 'Solution', 'Suspension',
    'Patch', 'Suppository', 'Other'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('supplierInfo.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        supplierInfo: {
          ...prev.supplierInfo,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      // Prepare data for submission
      const submitData = {
        ...formData,
        requestedQuantity: parseInt(formData.requestedQuantity),
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined
      };

      // Remove empty supplier info fields
      Object.keys(submitData.supplierInfo).forEach(key => {
        if (!submitData.supplierInfo[key]) {
          delete submitData.supplierInfo[key];
        }
      });

      const response = await fetch('/api/store-manager/medicine-requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Medicine request submitted successfully!');
        setTimeout(() => {
          navigate('/store-panel/sales');
        }, 2000);
      } else {
        setError(data.message || 'Failed to submit medicine request');
      }
    } catch (error) {
      console.error('Error submitting medicine request:', error);
      setError('Failed to submit medicine request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StoreManagerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/store-panel/sales')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 text-left">
                    Add New Medicine for Purchase
                  </h1>
                  <p className="text-sm text-gray-500 text-left">
                    Request a new medicine that's not currently in your inventory
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700 text-left">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-700 text-left">{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Medicine Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 text-left mb-4">Medicine Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      Manufacturer/Brand *
                    </label>
                    <input
                      type="text"
                      name="manufacturer"
                      value={formData.manufacturer}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter manufacturer name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                      Composition/Generic Name *
                    </label>
                    <input
                      type="text"
                      name="composition"
                      value={formData.composition}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter composition or generic name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                      Strength/Dosage *
                    </label>
                    <input
                      type="text"
                      name="strength"
                      value={formData.strength}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., 500mg, 10ml"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                      Pack Size *
                    </label>
                    <input
                      type="text"
                      name="packSize"
                      value={formData.packSize}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., 10 tablets, 100ml bottle"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Request Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 text-left mb-4">Request Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                      Requested Quantity *
                    </label>
                    <input
                      type="number"
                      name="requestedQuantity"
                      value={formData.requestedQuantity}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                      Unit Type
                    </label>
                    <select
                      name="unitType"
                      value={formData.unitType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {unitTypes.map(unit => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {priorities.map(priority => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                    Estimated Cost (Optional)
                  </label>
                  <input
                    type="number"
                    name="estimatedCost"
                    value={formData.estimatedCost}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter estimated cost"
                  />
                </div>
              </div>

              {/* Supplier Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 text-left mb-4">Supplier Information (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                      Supplier Name
                    </label>
                    <input
                      type="text"
                      name="supplierInfo.name"
                      value={formData.supplierInfo.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter supplier name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      name="supplierInfo.contactPerson"
                      value={formData.supplierInfo.contactPerson}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter contact person name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="supplierInfo.phone"
                      value={formData.supplierInfo.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="supplierInfo.email"
                      value={formData.supplierInfo.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                    Supplier Address
                  </label>
                  <textarea
                    name="supplierInfo.address"
                    value={formData.supplierInfo.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter supplier address"
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 text-left mb-4">Additional Information</h3>
                
                {formData.priority === 'urgent' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                      Urgency Reason
                    </label>
                    <input
                      type="text"
                      name="urgencyReason"
                      value={formData.urgencyReason}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Explain why this request is urgent"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter any additional notes or special requirements"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/store-panel/sales')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </StoreManagerLayout>
  );
};

export default AddMedicineRequestPage;

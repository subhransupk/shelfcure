import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Shield, Building, Save, XCircle } from 'lucide-react';
import useAutoMessage from '../../hooks/useAutoMessage';

const EditStaffModal = ({ isOpen, onClose, staff, stores, onStaffUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff',
    isActive: true,
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const { error, setError, clearError } = useAutoMessage(4000);

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name || '',
        email: staff.email || '',
        phone: staff.phone || '',
        role: staff.role || 'staff',
        isActive: staff.isActive !== undefined ? staff.isActive : true,
        address: {
          street: staff.address?.street || '',
          city: staff.address?.city || '',
          state: staff.address?.state || '',
          pincode: staff.address?.pincode || ''
        }
      });
    }
  }, [staff]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/store-owner/staff/${staff._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        onStaffUpdated();
        onClose();
      } else {
        setError(data.message || 'Failed to update staff member');
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      setError('Error updating staff member');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !staff) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 text-left">Edit Staff Member</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-red-600 text-sm text-left">{error}</p>
                <button
                  type="button"
                  onClick={clearError}
                  className="text-red-600 hover:text-red-800 ml-4"
                  aria-label="Dismiss error"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 text-left">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                  <Shield className="w-4 h-4 inline mr-1" />
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="staff">Staff</option>
                  <option value="cashier">Cashier</option>
                  <option value="store_manager">Store Manager</option>
                </select>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 text-left">Status</h3>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Active Staff Member
              </label>
            </div>
            <p className="text-xs text-gray-500 text-left">
              Inactive staff members cannot access the system
            </p>
          </div>

          {/* Current Store Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 text-left">Store Assignment</h3>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <Building className="w-5 h-5 text-gray-400 mr-2" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    Current Store: {staff.currentStore?.name || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Store Code: {staff.currentStore?.code || 'N/A'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-left">
                To change store assignment, please contact system administrator
              </p>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 text-left">Address Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Street Address
                </label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter street address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter city"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                  State
                </label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter state"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  name="address.pincode"
                  value={formData.address.pincode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter pincode"
                />
              </div>
            </div>
          </div>

          {/* Staff Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 text-left mb-2">Staff Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-left">
                <p className="text-blue-700">Staff ID: {staff._id}</p>
                <p className="text-blue-700">Join Date: {new Date(staff.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-left">
                <p className="text-blue-700">Last Updated: {new Date(staff.updatedAt).toLocaleDateString()}</p>
                <p className="text-blue-700">Stores: {staff.stores?.length || 0}</p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Staff Member
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStaffModal;

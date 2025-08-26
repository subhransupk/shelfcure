import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StoreOwnerLayout from '../components/store-owner/StoreOwnerLayout';
import {
  ArrowLeft, Store, Mail, Phone, MapPin, Save, X
} from 'lucide-react';

const StoreOwnerEditStorePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contact: {
      email: '',
      phone: ''
    },
    address: {
      street: '',
      city: '',
      state: '',
      country: 'India',
      pincode: ''
    },
    business: {
      licenseNumber: '',
      gstNumber: ''
    },
    isActive: true
  });

  useEffect(() => {
    fetchStore();
  }, [id]);

  const fetchStore = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/store-owner/stores/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        const store = data.data;
        setFormData({
          name: store.name || '',
          description: store.description || '',
          contact: {
            email: store.contact?.email || '',
            phone: store.contact?.phone || ''
          },
          address: {
            street: store.address?.street || '',
            city: store.address?.city || '',
            state: store.address?.state || '',
            country: store.address?.country || 'India',
            pincode: store.address?.pincode || ''
          },
          business: {
            licenseNumber: store.business?.licenseNumber || '',
            gstNumber: store.business?.gstNumber || ''
          },
          isActive: store.isActive !== undefined ? store.isActive : true
        });
      } else {
        setError(data.message || 'Failed to fetch store details');
      }
    } catch (error) {
      console.error('Error fetching store:', error);
      setError('Error fetching store details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
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

    try {
      setSaving(true);
      setError('');
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/store-owner/stores/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        navigate(`/store-owner/stores/${id}`, { 
          state: { message: 'Store updated successfully' } 
        });
      } else {
        setError(data.message || 'Failed to update store');
      }
    } catch (error) {
      console.error('Error updating store:', error);
      setError('Error updating store');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <StoreOwnerLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
        </div>
      </StoreOwnerLayout>
    );
  }

  return (
    <StoreOwnerLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/store-owner/stores/${id}`)}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Store
              </button>
            </div>
          </div>
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-gray-900">Edit Store</h1>
            <p className="mt-1 text-sm text-gray-500">
              Update your store information and settings.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <X className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6 text-left">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 text-left">
                  Store Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="contact.email" className="block text-sm font-medium text-gray-700 text-left">
                  Email
                </label>
                <input
                  type="email"
                  name="contact.email"
                  id="contact.email"
                  value={formData.contact.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="contact.phone" className="block text-sm font-medium text-gray-700 text-left">
                  Phone
                </label>
                <input
                  type="tel"
                  name="contact.phone"
                  id="contact.phone"
                  value={formData.contact.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="business.licenseNumber" className="block text-sm font-medium text-gray-700 text-left">
                  License Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="business.licenseNumber"
                  id="business.licenseNumber"
                  required
                  value={formData.business.licenseNumber}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="business.gstNumber" className="block text-sm font-medium text-gray-700 text-left">
                  GST Number
                </label>
                <input
                  type="text"
                  name="business.gstNumber"
                  id="business.gstNumber"
                  value={formData.business.gstNumber}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 text-left">
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Brief description of your store"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6 text-left">Address Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 text-left">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address.street"
                  id="address.street"
                  required
                  value={formData.address.street}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 text-left">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address.city"
                  id="address.city"
                  required
                  value={formData.address.city}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="address.state" className="block text-sm font-medium text-gray-700 text-left">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address.state"
                  id="address.state"
                  required
                  value={formData.address.state}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="address.pincode" className="block text-sm font-medium text-gray-700 text-left">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address.pincode"
                  id="address.pincode"
                  required
                  pattern="[0-9]{6}"
                  value={formData.address.pincode}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="address.country" className="block text-sm font-medium text-gray-700 text-left">
                  Country
                </label>
                <input
                  type="text"
                  name="address.country"
                  id="address.country"
                  value={formData.address.country}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Store Status */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6 text-left">Store Status</h3>
            
            <div className="flex items-center">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Store is active and operational
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/store-owner/stores/${id}`)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </StoreOwnerLayout>
  );
};

export default StoreOwnerEditStorePage;

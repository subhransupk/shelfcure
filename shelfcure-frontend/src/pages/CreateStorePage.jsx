import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Store, MapPin, Phone, Mail, User, Building, RefreshCw } from 'lucide-react';
import StoreOwnerLayout from '../components/store-owner/StoreOwnerLayout';

const CreateStorePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [codeGenerating, setCodeGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    licenseNumber: '',
    gstNumber: ''
  });

  // Auto-generate store code on component mount
  useEffect(() => {
    generateStoreCode();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateStoreCode = async () => {
    setCodeGenerating(true);
    try {
      const response = await fetch('http://localhost:5000/api/store-owner/generate-store-code', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          code: data.data.code
        }));
      } else {
        console.error('Failed to generate store code');
        setMessage('Failed to generate store code. Please try again.');
      }
    } catch (error) {
      console.error('Generate store code error:', error);
      setMessage('Failed to generate store code. Please try again.');
    } finally {
      setCodeGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        alert('Store name is required');
        return;
      }
      if (!formData.licenseNumber.trim()) {
        alert('License number is required');
        return;
      }

      // Validate GST number if provided
      if (formData.gstNumber.trim() && formData.gstNumber.trim().length > 0) {
        const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstPattern.test(formData.gstNumber.trim())) {
          alert('Please enter a valid GST number (15 characters) or leave it empty');
          setLoading(false);
          return;
        }
      }

      // Structure the data according to the backend model
      const storeData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description.trim() || undefined,
        contact: {
          phone: formData.phone.trim(),
          email: formData.email.trim() || undefined
        },
        address: {
          street: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          country: 'India',
          pincode: formData.pincode.trim()
        },
        business: {
          licenseNumber: formData.licenseNumber.trim(),
          ...(formData.gstNumber.trim() && formData.gstNumber.trim().length > 0 && {
            gstNumber: formData.gstNumber.trim()
          })
        }
      };

      console.log('Sending store data:', storeData);

      const response = await fetch('http://localhost:5000/api/store-owner/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(storeData)
      });

      if (response.ok) {
        const data = await response.json();
        setMessage('Store created successfully!');
        setTimeout(() => {
          navigate('/store-owner/stores');
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create store');
      }
    } catch (error) {
      console.error('Create store error:', error);
      setMessage(error.message || 'Failed to create store. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StoreOwnerLayout>
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/store-owner/stores')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Stores
            </button>
            <h1 className="text-2xl font-semibold text-gray-900 text-left">Create New Store</h1>
            <p className="mt-2 text-sm text-gray-700 text-left">
              Add a new pharmacy store to your account.
            </p>
          </div>

          {/* Form */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 text-left">Store Information</h2>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
              {message && (
                <div className={`p-4 rounded-md ${
                  message.includes('successfully') 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message}
                </div>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 text-left">
                    Store Name *
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Store className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="Enter store name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 text-left">
                    Store Code *
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="code"
                      id="code"
                      required
                      value={formData.code}
                      readOnly
                      className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700 sm:text-sm cursor-not-allowed"
                      placeholder="Auto-generated code"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={generateStoreCode}
                        disabled={codeGenerating}
                        className="text-green-600 hover:text-green-700 focus:outline-none disabled:opacity-50"
                        title="Generate new code"
                      >
                        <RefreshCw className={`h-4 w-4 ${codeGenerating ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 text-left">
                    Auto-generated unique code. Click refresh to generate a new one.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 text-left">
                    Description
                  </label>
                  <div className="mt-1">
                    <textarea
                      name="description"
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="Enter store description (optional)"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 text-left">
                    Address *
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 pt-2 pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      name="address"
                      id="address"
                      rows={3}
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="Enter complete address"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 text-left">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    id="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter city"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 text-left">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    id="state"
                    required
                    value={formData.state}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter state"
                  />
                </div>

                <div>
                  <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 text-left">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    id="pincode"
                    required
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter pincode"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 text-left">
                    Phone Number *
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 text-left">
                    Email Address
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 text-left">
                    License Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="licenseNumber"
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter license number"
                  />
                </div>

                <div>
                  <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700 text-left">
                    GST Number
                  </label>
                  <input
                    type="text"
                    name="gstNumber"
                    id="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Leave empty if not available"
                    maxLength="15"
                  />
                  <p className="mt-1 text-xs text-gray-500 text-left">
                    Optional. If provided, must be a valid 15-character GST number.
                  </p>
                </div>
              </div>



              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => navigate('/store-owner/stores')}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {loading ? 'Creating...' : 'Create Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </StoreOwnerLayout>
  );
};

export default CreateStorePage;

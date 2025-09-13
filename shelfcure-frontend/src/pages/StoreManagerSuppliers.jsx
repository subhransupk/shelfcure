import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Search,
  Plus,
  Edit,
  Eye,
  Phone,
  MapPin,
  Mail,
  Package,
  Calendar,
  DollarSign,
  Filter,
  MoreVertical,
  X,
  AlertCircle,
  History
} from 'lucide-react';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';
import { getCurrentUser } from '../services/authService';

const StoreManagerSuppliers = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    gstNumber: '',
    panNumber: '',
    licenseNumber: '',
    paymentTerms: '30 days',
    creditLimit: 0,
    isActive: true,
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20
  });

  // API functions
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/store-manager/suppliers?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setSuppliers(data.data);
        setPagination(data.pagination);
      } else {
        setError(data.message || 'Failed to fetch suppliers');
      }
    } catch (error) {
      console.error('Fetch suppliers error:', error);
      setError('Failed to load suppliers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [pagination.page, searchTerm, statusFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }));
      } else {
        fetchSuppliers();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset form helper
  const resetForm = () => {
    setNewSupplier({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      },
      gstNumber: '',
      panNumber: '',
      licenseNumber: '',
      paymentTerms: '30 days',
      creditLimit: 0,
      isActive: true,
      notes: ''
    });
    setError('');
  };

  const handleAddSupplier = () => {
    resetForm();
    setSelectedSupplier(null);
    setShowAddModal(true);
  };

  const handleEditSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setNewSupplier(supplier);
    setError('');
    setShowEditModal(true);
  };

  // Form validation function
  const validateForm = () => {
    const errors = {};

    // Required fields validation
    if (!newSupplier.name?.trim()) {
      errors.name = 'Supplier name is required';
    } else if (newSupplier.name.trim().length < 2) {
      errors.name = 'Supplier name must be at least 2 characters';
    } else if (newSupplier.name.trim().length > 100) {
      errors.name = 'Supplier name must be less than 100 characters';
    }

    if (!newSupplier.contactPerson?.trim()) {
      errors.contactPerson = 'Contact person is required';
    } else if (newSupplier.contactPerson.trim().length < 2) {
      errors.contactPerson = 'Contact person must be at least 2 characters';
    } else if (newSupplier.contactPerson.trim().length > 100) {
      errors.contactPerson = 'Contact person must be less than 100 characters';
    }

    if (!newSupplier.phone?.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[\+]?[0-9\s\-\(\)]{10,15}$/.test(newSupplier.phone.trim())) {
      errors.phone = 'Please provide a valid phone number (10-15 digits)';
    }

    // Optional field validations (only validate if user enters something)
    if (newSupplier.email?.trim() && newSupplier.email.trim().length > 0 && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(newSupplier.email.trim())) {
      errors.email = 'Please provide a valid email address';
    }

    // GST Number - completely optional, only validate format if provided
    if (newSupplier.gstNumber?.trim() && newSupplier.gstNumber.trim().length > 0) {
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(newSupplier.gstNumber.trim())) {
        errors.gstNumber = 'Please provide a valid GST number (15 characters) or leave empty';
      }
    }

    // PAN Number - completely optional, only validate format if provided
    if (newSupplier.panNumber?.trim() && newSupplier.panNumber.trim().length > 0) {
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(newSupplier.panNumber.trim())) {
        errors.panNumber = 'Please provide a valid PAN number (10 characters) or leave empty';
      }
    }

    // Address Pincode - completely optional, only validate format if provided
    if (newSupplier.address?.pincode?.trim() && newSupplier.address.pincode.trim().length > 0) {
      if (!/^[0-9]{6}$/.test(newSupplier.address.pincode.trim())) {
        errors.pincode = 'Please provide a valid 6-digit pincode or leave empty';
      }
    }

    if (newSupplier.creditLimit && (isNaN(newSupplier.creditLimit) || parseFloat(newSupplier.creditLimit) < 0)) {
      errors.creditLimit = 'Credit limit must be a positive number';
    }

    return errors;
  };

  const handleSaveSupplier = async () => {
    try {
      setSaving(true);
      setError('');
      
      // Frontend validation
      const validationErrors = validateForm();
      if (Object.keys(validationErrors).length > 0) {
        const errorMessages = Object.values(validationErrors).join(', ');
        setError(`Validation Error: ${errorMessages}`);
        setSaving(false);
        return;
      }

      const token = localStorage.getItem('token');
      const url = showEditModal 
        ? `/api/store-manager/suppliers/${selectedSupplier._id}`
        : '/api/store-manager/suppliers';
      
      const method = showEditModal ? 'PUT' : 'POST';
      
      // Clean and prepare data
      const supplierData = {
        ...newSupplier,
        name: newSupplier.name?.trim(),
        contactPerson: newSupplier.contactPerson?.trim(),
        phone: newSupplier.phone?.trim(),
        email: newSupplier.email?.trim() || undefined,
        gstNumber: newSupplier.gstNumber?.trim() || undefined,
        panNumber: newSupplier.panNumber?.trim() || undefined,
        licenseNumber: newSupplier.licenseNumber?.trim() || undefined,
        notes: newSupplier.notes?.trim() || undefined,
        creditLimit: parseFloat(newSupplier.creditLimit) || 0,
        address: {
          street: newSupplier.address?.street?.trim() || undefined,
          city: newSupplier.address?.city?.trim() || undefined,
          state: newSupplier.address?.state?.trim() || undefined,
          pincode: newSupplier.address?.pincode?.trim() || undefined,
          country: newSupplier.address?.country?.trim() || 'India'
        }
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(supplierData)
      });

      const data = await response.json();

      if (data.success) {
        setShowAddModal(false);
        setShowEditModal(false);
        setSelectedSupplier(null);
        resetForm();
        // Refresh the suppliers list
        await fetchSuppliers();
      } else {
        // Handle backend validation errors more gracefully
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map(err => err.msg || err.message).join(', ');
          setError(`Validation Error: ${errorMessages}`);
        } else {
          setError(data.message || 'Failed to save supplier');
        }
      }
    } catch (error) {
      console.error('Save supplier error:', error);
      setError('Failed to save supplier. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setNewSupplier(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setNewSupplier(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  if (loading) {
    return (
      <StoreManagerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </StoreManagerLayout>
    );
  }

  return (
    <StoreManagerLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 text-left">Supplier Management</h1>
          <p className="text-gray-600 text-left">Manage your medicine suppliers and vendor relationships</p>
        </div>

        {/* Filters and Actions */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search suppliers..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 w-full sm:w-64"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Add Supplier Button */}
          <button
            onClick={handleAddSupplier}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Suppliers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <div key={supplier._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Truck className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 text-left">{supplier.name}</h3>
                      <p className="text-sm text-gray-500 text-left">{supplier.contactPerson}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      supplier.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {supplier.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => handleEditSupplier(supplier)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{supplier.phone}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>{supplier.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{supplier.address.city}, {supplier.address.state}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">₹{((supplier.totalPurchaseAmount || 0) / 100000).toFixed(1)}L</div>
                    <div className="text-xs text-gray-500">Total Purchases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{supplier.paymentTerms}</div>
                    <div className="text-xs text-gray-500">Payment Terms</div>
                  </div>
                </div>

                {/* Purchase History Button */}
                <div className="pt-2 border-t border-gray-200">
                  <button
                    onClick={() => navigate(`/store-panel/suppliers/${supplier._id}/purchase-history`)}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <History className="h-4 w-4 mr-2" />
                    Purchase History
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {suppliers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Truck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No suppliers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter ? 'Try adjusting your search criteria.' : 'Get started by adding your first supplier.'}
            </p>
            {!searchTerm && !statusFilter && (
              <div className="mt-6">
                <button
                  onClick={handleAddSupplier}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Supplier
                </button>
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Supplier Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 text-left">
                      {showEditModal ? 'Edit Supplier' : 'Add New Supplier'}
                    </h3>
                    <button
                      onClick={() => {
                        setShowAddModal(false);
                        setShowEditModal(false);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Supplier Name *</label>
                        <input
                          type="text"
                          value={newSupplier.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter supplier name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Contact Person *</label>
                        <input
                          type="text"
                          value={newSupplier.contactPerson}
                          onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter contact person name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Phone *</label>
                        <input
                          type="tel"
                          value={newSupplier.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Email</label>
                        <input
                          type="email"
                          value={newSupplier.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter email address"
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 text-left">Address</label>
                      <input
                        type="text"
                        value={newSupplier.address.street}
                        onChange={(e) => handleInputChange('address.street', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="Street address"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <input
                          type="text"
                          value={newSupplier.address.city}
                          onChange={(e) => handleInputChange('address.city', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={newSupplier.address.state}
                          onChange={(e) => handleInputChange('address.state', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          placeholder="State"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={newSupplier.address.pincode}
                          onChange={(e) => handleInputChange('address.pincode', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          placeholder="Pincode"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={newSupplier.address.country}
                          onChange={(e) => handleInputChange('address.country', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          placeholder="Country"
                        />
                      </div>
                    </div>

                    {/* Business Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">GST Number</label>
                        <input
                          type="text"
                          value={newSupplier.gstNumber}
                          onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter GST number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 text-left">Payment Terms</label>
                        <select
                          value={newSupplier.paymentTerms}
                          onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Select payment terms</option>
                          <option value="Cash on delivery">Cash on delivery</option>
                          <option value="15 days">15 days</option>
                          <option value="30 days">30 days</option>
                          <option value="45 days">45 days</option>
                          <option value="60 days">60 days</option>
                        </select>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 text-left">Notes</label>
                      <textarea
                        rows={3}
                        value={newSupplier.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="Additional notes about the supplier..."
                      />
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={newSupplier.isActive}
                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                        Active Supplier
                      </label>
                    </div>
                  </div>
                </div>

                {/* Error Display in Modal */}
                {error && (
                  <div className="px-4 pb-3">
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <div className="flex">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <div className="ml-2">
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={handleSaveSupplier}
                    disabled={saving}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : showEditModal ? 'Update' : 'Add'} Supplier
                  </button>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    disabled={saving}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StoreManagerLayout>
  );
};

export default StoreManagerSuppliers;

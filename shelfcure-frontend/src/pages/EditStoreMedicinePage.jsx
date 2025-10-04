import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Pill } from 'lucide-react';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';

const EditStoreMedicinePage = () => {
  const { medicineId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    composition: '',
    manufacturer: '',
    category: '',
    barcode: '',
    batchNumber: '',
    expiryDate: '',
    requiresPrescription: false,
    isActive: true,
    dosage: {
      strength: '',
      form: '',
      frequency: ''
    },
    unitTypes: {
      hasStrips: true,
      hasIndividual: true,
      unitsPerStrip: 10
    },
    stripInfo: {
      stock: '',
      purchasePrice: '',
      sellingPrice: '',
      mrp: '',
      minStock: 0,
      reorderLevel: 0
    },
    individualInfo: {
      stock: '',
      purchasePrice: '',
      sellingPrice: '',
      mrp: '',
      minStock: 0,
      reorderLevel: 0
    },
    notes: '',
    tags: []
  });

  useEffect(() => {
    fetchMedicine();
  }, [medicineId]);

  const fetchMedicine = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/store-manager/medicines/${medicineId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        const medicine = data.data;
        setFormData({
          name: medicine.name || '',
          genericName: medicine.genericName || '',
          composition: medicine.composition || '',
          manufacturer: medicine.manufacturer || '',
          category: medicine.category || '',
          barcode: medicine.barcode || '',
          batchNumber: medicine.batchNumber || '',
          expiryDate: medicine.expiryDate ? medicine.expiryDate.split('T')[0] : '',
          requiresPrescription: medicine.requiresPrescription || false,
          isActive: medicine.isActive !== false,
          dosage: {
            strength: medicine.dosage?.strength || '',
            form: medicine.dosage?.form || '',
            frequency: medicine.dosage?.frequency || ''
          },
          unitTypes: {
            hasStrips: medicine.unitTypes?.hasStrips !== false,
            hasIndividual: medicine.unitTypes?.hasIndividual !== false,
            unitsPerStrip: medicine.unitTypes?.unitsPerStrip || 10
          },
          stripInfo: {
            stock: medicine.stripInfo?.stock || '',
            purchasePrice: medicine.stripInfo?.purchasePrice || '',
            sellingPrice: medicine.stripInfo?.sellingPrice || '',
            mrp: medicine.stripInfo?.mrp || '',
            minStock: medicine.stripInfo?.minStock || 0,
            reorderLevel: medicine.stripInfo?.reorderLevel || 0
          },
          individualInfo: {
            stock: medicine.individualInfo?.stock || '',
            purchasePrice: medicine.individualInfo?.purchasePrice || '',
            sellingPrice: medicine.individualInfo?.sellingPrice || '',
            mrp: medicine.individualInfo?.mrp || '',
            minStock: medicine.individualInfo?.minStock || 0,
            reorderLevel: medicine.individualInfo?.reorderLevel || 0
          },
          notes: medicine.notes || '',
          tags: medicine.tags || []
        });
      } else {
        setError(data.message || 'Failed to fetch medicine details');
      }
    } catch (error) {
      console.error('Error fetching medicine:', error);
      setError('Error fetching medicine details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Medicine name is required';
    }
    if (!formData.composition.trim()) {
      newErrors.composition = 'Composition is required';
    }
    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'Manufacturer is required';
    }
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const submitData = {
        ...formData,
        stripInfo: {
          ...formData.stripInfo,
          purchasePrice: parseFloat(formData.stripInfo.purchasePrice) || 0,
          sellingPrice: parseFloat(formData.stripInfo.sellingPrice) || 0,
          mrp: parseFloat(formData.stripInfo.mrp) || 0,
          stock: parseInt(formData.stripInfo.stock) || 0
        },
        individualInfo: {
          ...formData.individualInfo,
          purchasePrice: parseFloat(formData.individualInfo.purchasePrice) || 0,
          sellingPrice: parseFloat(formData.individualInfo.sellingPrice) || 0,
          mrp: parseFloat(formData.individualInfo.mrp) || 0,
          stock: parseInt(formData.individualInfo.stock) || 0
        }
      };
      
      const response = await fetch(`/api/store-manager/medicines/${medicineId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });
      
      const data = await response.json();
      if (data.success) {
        navigate(`/store-panel/inventory/medicine/${medicineId}`);
      } else {
        setError(data.message || 'Failed to update medicine');
      }
    } catch (error) {
      console.error('Error updating medicine:', error);
      setError('Error updating medicine');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <StoreManagerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </StoreManagerLayout>
    );
  }

  if (error) {
    return (
      <StoreManagerLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Pill className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/store-panel/inventory')}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              Back to Inventory
            </button>
          </div>
        </div>
      </StoreManagerLayout>
    );
  }

  return (
    <StoreManagerLayout>
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate(`/store-panel/inventory/medicine/${medicineId}`)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Medicine Details
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 text-left">Edit Medicine</h1>
                  <p className="text-sm text-gray-600 text-left">Update medicine information and inventory details</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Medicine Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Paracetamol 500mg"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Generic Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Acetaminophen"
                      value={formData.genericName}
                      onChange={(e) => handleInputChange('genericName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Composition *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Paracetamol 500mg"
                      value={formData.composition}
                      onChange={(e) => handleInputChange('composition', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.composition ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.composition && (
                      <p className="mt-1 text-sm text-red-600">{errors.composition}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Manufacturer *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Sun Pharma"
                      value={formData.manufacturer}
                      onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.manufacturer ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.manufacturer && (
                      <p className="mt-1 text-sm text-red-600">{errors.manufacturer}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.category ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Category</option>
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Injection">Injection</option>
                      <option value="Cream">Cream</option>
                      <option value="Ointment">Ointment</option>
                      <option value="Drops">Drops</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-red-600">{errors.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Barcode
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 1234567890123"
                      value={formData.barcode}
                      onChange={(e) => handleInputChange('barcode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Batch Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., BT001"
                      value={formData.batchNumber}
                      onChange={(e) => handleInputChange('batchNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.requiresPrescription}
                          onChange={(e) => handleInputChange('requiresPrescription', e.target.checked)}
                          className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Requires Prescription</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => handleInputChange('isActive', e.target.checked)}
                          className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dosage Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Dosage Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Strength
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 500mg"
                      value={formData.dosage.strength}
                      onChange={(e) => handleInputChange('dosage.strength', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Form
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Tablet"
                      value={formData.dosage.form}
                      onChange={(e) => handleInputChange('dosage.form', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Frequency
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Twice daily"
                      value={formData.dosage.frequency}
                      onChange={(e) => handleInputChange('dosage.frequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Unit Configuration */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Unit Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.unitTypes.hasStrips}
                        onChange={(e) => handleInputChange('unitTypes.hasStrips', e.target.checked)}
                        className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Has Strips</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.unitTypes.hasIndividual}
                        onChange={(e) => handleInputChange('unitTypes.hasIndividual', e.target.checked)}
                        className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Has Individual Units</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Units per Strip
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.unitTypes.unitsPerStrip}
                      onChange={(e) => handleInputChange('unitTypes.unitsPerStrip', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Strip Information */}
              {formData.unitTypes.hasStrips && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Strip Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Stock (Strips)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.stripInfo.stock}
                        onChange={(e) => handleInputChange('stripInfo.stock', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Purchase Price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.stripInfo.purchasePrice}
                        onChange={(e) => handleInputChange('stripInfo.purchasePrice', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Selling Price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.stripInfo.sellingPrice}
                        onChange={(e) => handleInputChange('stripInfo.sellingPrice', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        MRP (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.stripInfo.mrp}
                        onChange={(e) => handleInputChange('stripInfo.mrp', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Min Stock Level
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stripInfo.minStock}
                        onChange={(e) => handleInputChange('stripInfo.minStock', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Reorder Level
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stripInfo.reorderLevel}
                        onChange={(e) => handleInputChange('stripInfo.reorderLevel', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Individual Information */}
              {formData.unitTypes.hasIndividual && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Individual Unit Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Stock (Individual Units)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.individualInfo.stock}
                        onChange={(e) => handleInputChange('individualInfo.stock', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Purchase Price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.individualInfo.purchasePrice}
                        onChange={(e) => handleInputChange('individualInfo.purchasePrice', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Selling Price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.individualInfo.sellingPrice}
                        onChange={(e) => handleInputChange('individualInfo.sellingPrice', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        MRP (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.individualInfo.mrp}
                        onChange={(e) => handleInputChange('individualInfo.mrp', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Min Stock Level
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.individualInfo.minStock}
                        onChange={(e) => handleInputChange('individualInfo.minStock', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                        Reorder Level
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.individualInfo.reorderLevel}
                        onChange={(e) => handleInputChange('individualInfo.reorderLevel', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Additional Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Notes
                    </label>
                    <textarea
                      rows="3"
                      placeholder="Additional notes about this medicine..."
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., pain relief, fever, headache"
                      value={formData.tags.join(', ')}
                      onChange={(e) => {
                        const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                        handleInputChange('tags', tags);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 bg-white rounded-lg shadow-sm p-6">
                <button
                  type="button"
                  onClick={() => navigate(`/store-panel/inventory/medicine/${medicineId}`)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Medicine
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

export default EditStoreMedicinePage;

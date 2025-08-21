import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import {
  ArrowLeft, Save, Eye, Pill, FileText, 
  Settings, CheckCircle, AlertTriangle,
  Thermometer, Package, Info
} from 'lucide-react';

const AddMasterMedicinePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    // Basic Medicine Information
    name: '',
    genericName: '',
    composition: '',
    manufacturer: '',
    
    // Classification
    categories: [],
    type: 'over-the-counter',
    requiresPrescription: false,
    
    // Unit Configuration
    hasStrips: true,
    hasIndividual: true,
    unitsPerStrip: 10,
    
    // Dosage Information
    strength: '',
    form: '',
    frequency: '',
    
    // Storage Conditions (optional)
    temperatureMin: '',
    temperatureMax: '',
    humidityMin: '',
    humidityMax: '',
    specialConditions: [],
    
    // Medical Information (optional)
    sideEffects: '',
    contraindications: '',
    interactions: '',
    
    // Additional Info
    barcode: '',
    tags: '',
    notes: '',
    isActive: true
  });

  const [errors, setErrors] = useState({});

  const categories = [
    'Antibiotics', 'Pain Relief', 'Fever Reducer', 'Anti-inflammatory',
    'Vitamins & Supplements', 'Antacid', 'Cough & Cold', 'Diabetes Care',
    'Heart & Blood Pressure', 'Digestive Health', 'Respiratory', 'Skin Care',
    'Eye Care', 'Ear Care', 'Mental Health', 'Hormonal', 'Allergy Relief',
    'Bone & Joint Care', 'Kidney & Urinary', 'Liver Care', 'Other'
  ];

  const forms = [
    'Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Cream', 'Ointment',
    'Powder', 'Inhaler', 'Spray', 'Gel', 'Lotion', 'Solution', 'Suspension',
    'Patch', 'Suppository', 'Other'
  ];

  const specialConditionsOptions = [
    'Keep in refrigerator',
    'Store in cool, dry place',
    'Protect from light',
    'Keep away from children',
    'Do not freeze',
    'Store upright',
    'Shake well before use'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || '' : value)
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCategorySelection = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleSpecialConditionToggle = (condition) => {
    setFormData(prev => ({
      ...prev,
      specialConditions: prev.specialConditions.includes(condition)
        ? prev.specialConditions.filter(c => c !== condition)
        : [...prev.specialConditions, condition]
    }));
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
    if (formData.categories.length === 0) {
      newErrors.categories = 'Please select at least one category';
    }
    if (!formData.strength.trim()) {
      newErrors.strength = 'Strength is required';
    }
    if (!formData.form.trim()) {
      newErrors.form = 'Form is required';
    }
    if (formData.hasStrips && (!formData.unitsPerStrip || formData.unitsPerStrip < 1)) {
      newErrors.unitsPerStrip = 'Units per strip must be at least 1';
    }
    if (!formData.hasStrips && !formData.hasIndividual) {
      newErrors.unitTypes = 'At least one unit type must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e, action = 'save') => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Process form data
      const processedData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        sideEffects: formData.sideEffects.split(',').map(effect => effect.trim()).filter(effect => effect),
        contraindications: formData.contraindications.split(',').map(contra => contra.trim()).filter(contra => contra),
        interactions: formData.interactions.split(',').map(interaction => interaction.trim()).filter(interaction => interaction)
      };
      
      console.log('Master Medicine data:', { ...processedData, action });
      
      // Navigate back to master medicines page
      navigate('/admin/master-medicines');
    } catch (error) {
      console.error('Error adding master medicine:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout 
      title="Add Master Medicine" 
      subtitle="Add a new medicine to the master database for all stores"
      rightHeaderContent={
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/master-medicines')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Master Medicines
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Medicine Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Medicine Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <Pill className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900 text-left">Basic Medicine Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Medicine Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Medicine Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Paracetamol 500mg"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 text-left">{errors.name}</p>
                  )}
                </div>

                {/* Generic Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Generic Name
                  </label>
                  <input
                    type="text"
                    name="genericName"
                    value={formData.genericName}
                    onChange={handleInputChange}
                    placeholder="e.g., Acetaminophen"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Manufacturer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Manufacturer *
                  </label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    placeholder="e.g., Cipla Ltd"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.manufacturer ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.manufacturer && (
                    <p className="mt-1 text-sm text-red-600 text-left">{errors.manufacturer}</p>
                  )}
                </div>

                {/* Composition */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Composition *
                  </label>
                  <textarea
                    name="composition"
                    value={formData.composition}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="e.g., Paracetamol 500mg"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
                      errors.composition ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.composition && (
                    <p className="mt-1 text-sm text-red-600 text-left">{errors.composition}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Classification */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900 text-left">Classification</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Categories */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-left">
                    Medical Categories * (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {categories.map(category => (
                      <label key={category} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(category)}
                          onChange={() => handleCategorySelection(category)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700 text-left">{category}</span>
                      </label>
                    ))}
                  </div>
                  {errors.categories && (
                    <p className="mt-1 text-sm text-red-600 text-left">{errors.categories}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 text-left">
                    Select multiple categories if the medicine serves multiple purposes
                  </p>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Medicine Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="over-the-counter">Over-the-Counter</option>
                    <option value="prescription">Prescription</option>
                    <option value="controlled">Controlled Substance</option>
                  </select>
                </div>

                {/* Prescription Required */}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="requiresPrescription"
                      name="requiresPrescription"
                      checked={formData.requiresPrescription}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="requiresPrescription" className="text-sm font-medium text-gray-700 text-left">
                      Requires prescription for purchase
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Unit Configuration */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <Package className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900 text-left">Unit Configuration</h3>
                <div className="ml-2">
                  <div className="group relative">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Configure how this medicine can be sold (strips/packs or individual units)
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Unit Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-left">
                    Available Unit Types *
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="hasStrips"
                        name="hasStrips"
                        checked={formData.hasStrips}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="hasStrips" className="text-sm font-medium text-gray-700 text-left">
                        Available in Strips/Packs
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="hasIndividual"
                        name="hasIndividual"
                        checked={formData.hasIndividual}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="hasIndividual" className="text-sm font-medium text-gray-700 text-left">
                        Available as Individual Units
                      </label>
                    </div>
                  </div>
                  {errors.unitTypes && (
                    <p className="mt-1 text-sm text-red-600 text-left">{errors.unitTypes}</p>
                  )}
                </div>

                {/* Units per Strip */}
                {formData.hasStrips && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                      Units per Strip/Pack *
                    </label>
                    <input
                      type="number"
                      name="unitsPerStrip"
                      value={formData.unitsPerStrip}
                      onChange={handleInputChange}
                      min="1"
                      placeholder="e.g., 10"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.unitsPerStrip ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.unitsPerStrip && (
                      <p className="mt-1 text-sm text-red-600 text-left">{errors.unitsPerStrip}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Dosage Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900 text-left">Dosage Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Strength */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Strength *
                  </label>
                  <input
                    type="text"
                    name="strength"
                    value={formData.strength}
                    onChange={handleInputChange}
                    placeholder="e.g., 500mg"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.strength ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.strength && (
                    <p className="mt-1 text-sm text-red-600 text-left">{errors.strength}</p>
                  )}
                </div>

                {/* Form */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Form *
                  </label>
                  <select
                    name="form"
                    value={formData.form}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.form ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Form</option>
                    {forms.map(form => (
                      <option key={form} value={form}>{form}</option>
                    ))}
                  </select>
                  {errors.form && (
                    <p className="mt-1 text-sm text-red-600 text-left">{errors.form}</p>
                  )}
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Typical Frequency
                  </label>
                  <input
                    type="text"
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleInputChange}
                    placeholder="e.g., 3 times daily"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Storage Conditions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <Thermometer className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900 text-left">Storage Conditions (Optional)</h3>
              </div>

              <div className="space-y-6">
                {/* Temperature Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-left">
                    Temperature Range (°C)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="number"
                        name="temperatureMin"
                        value={formData.temperatureMin}
                        onChange={handleInputChange}
                        placeholder="Min temp"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        name="temperatureMax"
                        value={formData.temperatureMax}
                        onChange={handleInputChange}
                        placeholder="Max temp"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Humidity Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-left">
                    Humidity Range (%)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="number"
                        name="humidityMin"
                        value={formData.humidityMin}
                        onChange={handleInputChange}
                        placeholder="Min humidity"
                        min="0"
                        max="100"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        name="humidityMax"
                        value={formData.humidityMax}
                        onChange={handleInputChange}
                        placeholder="Max humidity"
                        min="0"
                        max="100"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Special Conditions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-left">
                    Special Storage Conditions
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {specialConditionsOptions.map(condition => (
                      <label key={condition} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.specialConditions.includes(condition)}
                          onChange={() => handleSpecialConditionToggle(condition)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700 text-left">{condition}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Additional Information & Actions */}
          <div className="space-y-6">
            {/* Medical Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <AlertTriangle className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900 text-left">Medical Information</h3>
              </div>

              <div className="space-y-4">
                {/* Side Effects */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Common Side Effects
                  </label>
                  <textarea
                    name="sideEffects"
                    value={formData.sideEffects}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Enter side effects separated by commas"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                  <p className="mt-1 text-xs text-gray-500 text-left">
                    Separate multiple entries with commas
                  </p>
                </div>

                {/* Contraindications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Contraindications
                  </label>
                  <textarea
                    name="contraindications"
                    value={formData.contraindications}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Enter contraindications separated by commas"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Drug Interactions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Drug Interactions
                  </label>
                  <textarea
                    name="interactions"
                    value={formData.interactions}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Enter drug interactions separated by commas"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <Info className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900 text-left">Additional Information</h3>
              </div>

              <div className="space-y-4">
                {/* Barcode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Barcode (Optional)
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    placeholder="Enter barcode if available"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Tags
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="e.g., pain relief, fever, headache"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500 text-left">
                    Separate tags with commas
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Any additional notes about this medicine..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-left">
                    <label className="text-sm font-medium text-gray-900 text-left">
                      Medicine is active
                    </label>
                    <p className="text-xs text-gray-500 text-left">
                      Available for stores to add to their inventory
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {loading ? 'Adding...' : 'Add to Master Database'}
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'save_and_activate')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4" />
                  Add & Activate
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'preview')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Eye className="w-4 h-4" />
                  Preview Medicine
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};

export default AddMasterMedicinePage;

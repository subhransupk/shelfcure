import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import { API_ENDPOINTS } from '../config/api';
import { ArrowLeft, Save, Eye } from 'lucide-react';

const CreateSubscriptionPlanPage = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    // Basic Information
    planName: '',
    planType: '',
    description: '',
    
    // Pricing & Billing
    basePrice: 0,
    defaultBillingCycle: '',
    supportLevel: '',
    
    // Billing Period Discounts
    discounts: {
      1: 0,
      3: 5,
      6: 10,
      12: 20
    },
    
    // Available Billing Periods
    availablePeriods: {
      1: true,
      3: true,
      6: true,
      12: true
    },
    
    // Limits & Quotas
    maxStores: '',
    usersPerStore: 5,
    medicinesPerStore: '',
    customersPerStore: '',
    suppliersPerStore: '',
    sortOrder: 0,
    
    // Trial Settings
    enableTrial: false,
    trialDays: 14,
    
    // Core Features
    coreFeatures: {
      inventoryManagement: false,
      salesAnalytics: false,
      customerManagement: false,
      supplierManagement: false
    },
    
    // Advanced Features
    advancedFeatures: {
      expenseTracking: false,
      staffManagement: false,
      prescriptionManagement: false,
      wasteManagement: false,
      storageManagement: false,
      advancedReports: false,
      multiLocationSupport: false,
      apiAccess: false
    },
    
    // Plan Visibility & Promotion
    isPopular: false,
    isRecommended: false,
    promotionalText: '',
    
    // Status
    isActive: true
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle nested object changes
  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  // Calculate discounted price
  const calculateDiscountedPrice = (months) => {
    const basePrice = parseFloat(formData.basePrice) || 0;
    const discount = formData.discounts[months] || 0;
    const discountedPrice = basePrice * (1 - discount / 100);
    return discountedPrice.toFixed(2);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.planName.trim()) {
      newErrors.planName = 'Plan name is required';
    }
    
    if (!formData.planType) {
      newErrors.planType = 'Plan type is required';
    }
    
    if (!formData.basePrice || formData.basePrice < 0) {
      newErrors.basePrice = 'Base price is required and must be non-negative';
    }
    
    if (!formData.defaultBillingCycle) {
      newErrors.defaultBillingCycle = 'Default billing cycle is required';
    }
    
    if (!formData.supportLevel) {
      newErrors.supportLevel = 'Support level is required';
    }
    
    if (!formData.maxStores) {
      newErrors.maxStores = 'Max stores is required';
    }
    
    if (!formData.medicinesPerStore) {
      newErrors.medicinesPerStore = 'Medicines per store is required';
    }
    
    if (!formData.customersPerStore) {
      newErrors.customersPerStore = 'Customers per store is required';
    }
    
    if (!formData.suppliersPerStore) {
      newErrors.suppliersPerStore = 'Suppliers per store is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');

      if (!token) {
        navigate('/admin/login');
        return;
      }

      // Transform frontend data to backend structure
      const backendData = {
        name: formData.planName,
        description: formData.description,
        planType: formData.planType,
        pricing: {
          monthly: formData.basePrice,
          yearly: formData.basePrice * 12 * (1 - formData.discounts[12] / 100),
          currency: 'INR',
          discountPercentage: formData.discounts[12]
        },
        limits: {
          maxUsers: formData.usersPerStore,
          maxProducts: parseInt(formData.medicinesPerStore) || -1,
          maxStores: parseInt(formData.maxStores) || 1,
          maxTransactionsPerMonth: -1,
          storageLimit: 5
        },
        features: {
          multiStore: formData.advancedFeatures.multiLocationSupport,
          analytics: formData.coreFeatures.salesAnalytics,
          advancedAnalytics: formData.advancedFeatures.expenseTracking,
          whatsappIntegration: false,
          billOCR: false,
          customReports: formData.advancedFeatures.advancedReports,
          apiAccess: formData.advancedFeatures.apiAccess,
          prioritySupport: formData.supportLevel === 'priority',
          backupRestore: false,
          customBranding: false,
          affiliateProgram: false
        },
        trial: {
          enabled: formData.enableTrial,
          durationDays: formData.trialDays
        },
        isActive: formData.isActive,
        isPopular: formData.isPopular,
        sortOrder: formData.sortOrder
      };

      const response = await fetch(API_ENDPOINTS.ADMIN_SUBSCRIPTION_PLANS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backendData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Subscription plan created successfully!');
        navigate('/admin/subscription-plans');
      } else {
        // Handle validation errors
        if (response.status === 400 && data.errors) {
          // Show validation errors
          const errorMessage = data.errors.join('\n');
          alert(`Validation failed:\n${errorMessage}`);
        } else {
          alert(`Failed to create plan: ${data.message}`);
        }
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      if (error.message.includes('400')) {
        alert('Please fill in all required fields correctly.');
      } else {
        alert('Error creating plan. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Create Subscription Plan" subtitle="Create a new subscription plan with pricing and features">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/admin/subscription-plans')}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Plans
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Wider */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Basic Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Basic Plan"
                    value={formData.planName}
                    onChange={(e) => handleInputChange('planName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.planName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.planName && (
                    <p className="mt-1 text-sm text-red-600">{errors.planName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Plan Type *
                  </label>
                  <select
                    value={formData.planType}
                    onChange={(e) => handleInputChange('planType', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.planType ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Plan Type</option>
                    <option value="free">Free</option>
                    <option value="trial">Trial</option>
                    <option value="paid">Paid</option>
                  </select>
                  {errors.planType && (
                    <p className="mt-1 text-sm text-red-600">{errors.planType}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of the plan"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Billing */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Pricing & Billing</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={formData.basePrice}
                    onChange={(e) => handleInputChange('basePrice', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.basePrice ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <p className="mt-1 text-sm text-gray-500">Monthly base price</p>
                  {errors.basePrice && (
                    <p className="mt-1 text-sm text-red-600">{errors.basePrice}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Default Billing Cycle *
                  </label>
                  <select
                    value={formData.defaultBillingCycle}
                    onChange={(e) => handleInputChange('defaultBillingCycle', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.defaultBillingCycle ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Cycle</option>
                    <option value="1">1 Month</option>
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="12">12 Months</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">This is for legacy compatibility. Customers can choose from all billing periods below.</p>
                  {errors.defaultBillingCycle && (
                    <p className="mt-1 text-sm text-red-600">{errors.defaultBillingCycle}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Support Level *
                  </label>
                  <select
                    value={formData.supportLevel}
                    onChange={(e) => handleInputChange('supportLevel', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.supportLevel ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Level</option>
                    <option value="basic">Basic Support</option>
                    <option value="standard">Standard Support</option>
                    <option value="priority">Priority Support</option>
                    <option value="premium">Premium Support</option>
                    <option value="dedicated">Dedicated Support</option>
                  </select>
                  {errors.supportLevel && (
                    <p className="mt-1 text-sm text-red-600">{errors.supportLevel}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Billing Period Discounts */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Billing Period Discounts</h3>
              <p className="text-sm text-gray-600 mb-4 text-left">Set discount percentages for longer billing commitments to incentivize customers.</p>

              <div className="grid grid-cols-4 gap-4">
                {[
                  { months: 1, label: '1 Month', description: 'Base price (no discount)' },
                  { months: 3, label: '3 Months', description: 'Quarterly discount' },
                  { months: 6, label: '6 Months', description: 'Semi-annual discount' },
                  { months: 12, label: '12 Months', description: 'Annual discount' }
                ].map(({ months, label, description }) => (
                  <div key={months} className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">{label}</label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.discounts[months]}
                        onChange={(e) => handleNestedChange('discounts', months, parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        disabled={months === 1}
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-left">{description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Billing Periods */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Available Billing Periods</h3>
              <p className="text-sm text-gray-600 mb-4 text-left">Select which billing periods customers can choose from when subscribing to this plan.</p>

              <div className="flex items-center space-x-6">
                {[
                  { months: 1, label: '1 Month' },
                  { months: 3, label: '3 Months' },
                  { months: 6, label: '6 Months' },
                  { months: 12, label: '12 Months' }
                ].map(({ months, label }) => (
                  <div key={months} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`period-${months}`}
                      checked={formData.availablePeriods[months]}
                      onChange={(e) => handleNestedChange('availablePeriods', months, e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`period-${months}`} className="ml-2 text-sm text-gray-700 text-left">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Preview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Pricing Preview</h3>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { months: 1, label: '1 Month' },
                  { months: 3, label: '3 Months' },
                  { months: 6, label: '6 Months' },
                  { months: 12, label: '12 Months' }
                ].map(({ months, label }) => {
                  const price = calculateDiscountedPrice(months);
                  const discount = formData.discounts[months];
                  const isAvailable = formData.availablePeriods[months];

                  return (
                    <div key={months} className={`p-3 border rounded-lg ${isAvailable ? 'border-gray-200' : 'border-gray-100 bg-gray-50'}`}>
                      <div className="text-sm font-medium text-gray-900">{label}</div>
                      <div className="text-lg font-bold text-primary-600">₹{price}</div>
                      <div className="text-xs text-gray-500">per month</div>
                      {discount > 0 && (
                        <div className="text-xs text-green-600 font-medium">Save {discount}%</div>
                      )}
                      {!isAvailable && (
                        <div className="text-xs text-gray-400">Not available</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Limits & Quotas */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Limits & Quotas</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Max Stores *
                  </label>
                  <select
                    value={formData.maxStores}
                    onChange={(e) => handleInputChange('maxStores', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.maxStores ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Limit</option>
                    <option value="1">1 Store</option>
                    <option value="3">3 Stores</option>
                    <option value="5">5 Stores</option>
                    <option value="10">10 Stores</option>
                    <option value="25">25 Stores</option>
                    <option value="unlimited">Unlimited</option>
                  </select>
                  {errors.maxStores && (
                    <p className="mt-1 text-sm text-red-600">{errors.maxStores}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Users per Store *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usersPerStore}
                    onChange={(e) => handleInputChange('usersPerStore', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Medicines per Store *
                  </label>
                  <select
                    value={formData.medicinesPerStore}
                    onChange={(e) => handleInputChange('medicinesPerStore', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.medicinesPerStore ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Limit</option>
                    <option value="100">100 Medicines</option>
                    <option value="500">500 Medicines</option>
                    <option value="1000">1,000 Medicines</option>
                    <option value="2000">2,000 Medicines</option>
                    <option value="5000">5,000 Medicines</option>
                    <option value="unlimited">Unlimited</option>
                  </select>
                  {errors.medicinesPerStore && (
                    <p className="mt-1 text-sm text-red-600">{errors.medicinesPerStore}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Customers per Store *
                  </label>
                  <select
                    value={formData.customersPerStore}
                    onChange={(e) => handleInputChange('customersPerStore', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.customersPerStore ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Limit</option>
                    <option value="100">100 Customers</option>
                    <option value="500">500 Customers</option>
                    <option value="1000">1,000 Customers</option>
                    <option value="5000">5,000 Customers</option>
                    <option value="10000">10,000 Customers</option>
                    <option value="unlimited">Unlimited</option>
                  </select>
                  {errors.customersPerStore && (
                    <p className="mt-1 text-sm text-red-600">{errors.customersPerStore}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Suppliers per Store *
                  </label>
                  <select
                    value={formData.suppliersPerStore}
                    onChange={(e) => handleInputChange('suppliersPerStore', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.suppliersPerStore ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Limit</option>
                    <option value="10">10 Suppliers</option>
                    <option value="25">25 Suppliers</option>
                    <option value="50">50 Suppliers</option>
                    <option value="100">100 Suppliers</option>
                    <option value="unlimited">Unlimited</option>
                  </select>
                  {errors.suppliersPerStore && (
                    <p className="mt-1 text-sm text-red-600">{errors.suppliersPerStore}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Sort Order *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={(e) => handleInputChange('sortOrder', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Trial Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Trial Settings</h3>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableTrial"
                    checked={formData.enableTrial}
                    onChange={(e) => handleInputChange('enableTrial', e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="enableTrial" className="ml-2 text-sm text-gray-700 text-left">
                    Enable trial period
                  </label>
                </div>

                {formData.enableTrial && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Trial Days
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={formData.trialDays}
                      onChange={(e) => handleInputChange('trialDays', parseInt(e.target.value) || 14)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Core Features */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Core Features</h3>

              <div className="space-y-3">
                {[
                  { key: 'inventoryManagement', label: 'Inventory Management' },
                  { key: 'salesAnalytics', label: 'Sales Analytics' },
                  { key: 'customerManagement', label: 'Customer Management' },
                  { key: 'supplierManagement', label: 'Supplier Management' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`core-${key}`}
                      checked={formData.coreFeatures[key]}
                      onChange={(e) => handleNestedChange('coreFeatures', key, e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`core-${key}`} className="ml-2 text-sm text-gray-700">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Advanced Features */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Advanced Features</h3>

              <div className="space-y-3">
                {[
                  { key: 'expenseTracking', label: 'Expense Tracking' },
                  { key: 'staffManagement', label: 'Staff Management' },
                  { key: 'prescriptionManagement', label: 'Prescription Management' },
                  { key: 'wasteManagement', label: 'Waste Management' },
                  { key: 'storageManagement', label: 'Storage Management' },
                  { key: 'advancedReports', label: 'Advanced Reports' },
                  { key: 'multiLocationSupport', label: 'Multi-location Support' },
                  { key: 'apiAccess', label: 'API Access' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`advanced-${key}`}
                      checked={formData.advancedFeatures[key]}
                      onChange={(e) => handleNestedChange('advancedFeatures', key, e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`advanced-${key}`} className="ml-2 text-sm text-gray-700">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan Visibility & Promotion */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Plan Visibility & Promotion</h3>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPopular"
                    checked={formData.isPopular}
                    onChange={(e) => handleInputChange('isPopular', e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPopular" className="ml-2 text-sm text-gray-700">
                    Mark as "Popular" plan
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isRecommended"
                    checked={formData.isRecommended}
                    onChange={(e) => handleInputChange('isRecommended', e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isRecommended" className="ml-2 text-sm text-gray-700">
                    Mark as "Recommended" plan
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Promotional Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Best Value, Most Popular, Limited Time"
                    value={formData.promotionalText}
                    onChange={(e) => handleInputChange('promotionalText', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-sm text-gray-500">Optional promotional badge text to display with this plan</p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Status</h3>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Plan is active
                </label>
              </div>
            </div>
          </div>
        </form>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/admin/subscription-plans')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>

          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Plan
              </>
            )}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CreateSubscriptionPlanPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import { makeAuthenticatedRequest, API_ENDPOINTS } from '../config/api';
import {
  ArrowLeft, Save, Eye, Calendar, Percent,
  FileText, Users, Settings, CheckCircle, RefreshCw
} from 'lucide-react';

const CreateDiscountPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  
  const [formData, setFormData] = useState({
    // Basic Information
    discountName: '',
    discountCode: '',
    description: '',
    
    // Discount Value
    discountType: '',
    discountValue: 0,
    minOrderAmount: 0,
    
    // Usage Limits
    totalUsageLimit: '',
    usageLimitPerUser: '',
    
    // Validity Period
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    
    // Applicability
    applicablePlans: [],
    applicableDurations: [],
    
    // Settings
    isActive: true,
    canCombineWithOthers: false
  });

  const [errors, setErrors] = useState({});
  const [autoGenerateCode, setAutoGenerateCode] = useState(true);

  // Mock data for subscription plans
  useEffect(() => {
    const mockPlans = [
      { id: '1', name: 'Basic Plan', price: 5000 },
      { id: '2', name: 'Standard Plan', price: 8000 },
      { id: '3', name: 'Premium Plan', price: 15000 },
      { id: '4', name: 'Enterprise Plan', price: 25000 }
    ];
    setSubscriptionPlans(mockPlans);
  }, []);

  // Auto-generate discount code based on name
  useEffect(() => {
    if (autoGenerateCode && formData.discountName) {
      const code = formData.discountName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 10);
      setFormData(prev => ({ ...prev, discountCode: code }));
    }
  }, [formData.discountName, autoGenerateCode]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePlanSelection = (planId) => {
    setFormData(prev => ({
      ...prev,
      applicablePlans: prev.applicablePlans.includes(planId)
        ? prev.applicablePlans.filter(id => id !== planId)
        : [...prev.applicablePlans, planId]
    }));
  };

  const handleDurationSelection = (duration) => {
    setFormData(prev => ({
      ...prev,
      applicableDurations: prev.applicableDurations.includes(duration)
        ? prev.applicableDurations.filter(d => d !== duration)
        : [...prev.applicableDurations, duration]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.discountName.trim()) {
      newErrors.discountName = 'Discount name is required';
    }
    if (!formData.discountCode.trim()) {
      newErrors.discountCode = 'Discount code is required';
    }
    if (!formData.discountType) {
      newErrors.discountType = 'Please select discount type';
    }
    if (!formData.discountValue || formData.discountValue <= 0) {
      newErrors.discountValue = 'Please enter a valid discount value';
    }
    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      newErrors.discountValue = 'Percentage cannot exceed 100%';
    }
    if (!formData.validFrom) {
      newErrors.validFrom = 'Valid from date is required';
    }
    if (formData.validUntil && new Date(formData.validUntil) <= new Date(formData.validFrom)) {
      newErrors.validUntil = 'Valid until date must be after valid from date';
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
      // Prepare discount data for API
      const discountData = {
        name: formData.discountName,
        code: formData.discountCode.toUpperCase(),
        description: formData.description,
        type: formData.discountType,
        value: parseFloat(formData.discountValue),
        limits: {
          maxUses: formData.totalUsageLimit ? parseInt(formData.totalUsageLimit) : -1,
          maxUsesPerCustomer: formData.usageLimitPerUser ? parseInt(formData.usageLimitPerUser) : 1,
          minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
          maxDiscountAmount: -1 // Will be calculated based on type and value
        },
        validity: {
          startDate: new Date(formData.validFrom),
          endDate: formData.validUntil ? new Date(formData.validUntil) : null
        },
        applicablePlans: formData.applicablePlans,
        applicableDurations: formData.applicableDurations,
        isActive: formData.isActive,
        canCombineWithOthers: formData.canCombineWithOthers
      };

      const response = await makeAuthenticatedRequest(
        API_ENDPOINTS.ADMIN_DISCOUNTS,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(discountData)
        }
      );

      if (response.success) {
        // Navigate back to discounts page
        navigate('/admin/discounts');
      } else {
        alert('Failed to create discount. Please try again.');
      }
    } catch (error) {
      console.error('Error creating discount:', error);
      alert('Failed to create discount. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const durations = [
    { value: '1', label: '1 Month' },
    { value: '3', label: '3 Months' },
    { value: '6', label: '6 Months' },
    { value: '12', label: '1 Year' }
  ];

  return (
    <AdminLayout 
      title="Create Discount" 
      subtitle="Create a new discount code for customers"
      rightHeaderContent={
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/discounts')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Discounts
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Discount Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900 text-left">Basic Information</h3>
              </div>

              <div className="space-y-6">
                {/* Discount Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Discount Name *
                  </label>
                  <input
                    type="text"
                    name="discountName"
                    value={formData.discountName}
                    onChange={handleInputChange}
                    placeholder="e.g., New Year Special"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.discountName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.discountName && (
                    <p className="mt-1 text-sm text-red-600 text-left">{errors.discountName}</p>
                  )}
                </div>

                {/* Discount Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Discount Code * {autoGenerateCode && '(Auto-generated)'}
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      name="discountCode"
                      value={formData.discountCode}
                      onChange={(e) => {
                        setAutoGenerateCode(false);
                        handleInputChange(e);
                      }}
                      placeholder="e.g., NEWYEAR2025"
                      className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.discountCode ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setAutoGenerateCode(true)}
                      className="flex items-center gap-2 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Auto-generate code"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  {errors.discountCode && (
                    <p className="mt-1 text-sm text-red-600 text-left">{errors.discountCode}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Describe the discount and its purpose..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Discount Value */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <Percent className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900 text-left">Discount Value</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Discount Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Discount Type *
                  </label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.discountType ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Type</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                  {errors.discountType && (
                    <p className="mt-1 text-sm text-red-600 text-left">{errors.discountType}</p>
                  )}
                </div>

                {/* Discount Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    min="0"
                    step={formData.discountType === 'percentage' ? '0.01' : '1'}
                    max={formData.discountType === 'percentage' ? '100' : undefined}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.discountValue ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.discountValue && (
                    <p className="mt-1 text-sm text-red-600 text-left">{errors.discountValue}</p>
                  )}
                </div>

                {/* Minimum Order Amount */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Minimum Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    name="minOrderAmount"
                    value={formData.minOrderAmount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Usage Limits */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900 text-left">Usage Limits</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Usage Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Total Usage Limit (Leave empty for unlimited)
                  </label>
                  <input
                    type="number"
                    name="totalUsageLimit"
                    value={formData.totalUsageLimit}
                    onChange={handleInputChange}
                    min="1"
                    placeholder="Unlimited"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Usage Limit Per User */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Usage Limit Per User (Leave empty for unlimited)
                  </label>
                  <input
                    type="number"
                    name="usageLimitPerUser"
                    value={formData.usageLimitPerUser}
                    onChange={handleInputChange}
                    min="1"
                    placeholder="Unlimited"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Validity Period */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900 text-left">Validity Period</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Valid From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Valid From *
                  </label>
                  <input
                    type="date"
                    name="validFrom"
                    value={formData.validFrom}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.validFrom ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.validFrom && (
                    <p className="mt-1 text-sm text-red-600 text-left">{errors.validFrom}</p>
                  )}
                </div>

                {/* Valid Until */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Valid Until (Leave empty for no expiry)
                  </label>
                  <input
                    type="date"
                    name="validUntil"
                    value={formData.validUntil}
                    onChange={handleInputChange}
                    placeholder="dd-mm-yyyy"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.validUntil ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.validUntil && (
                    <p className="mt-1 text-sm text-red-600 text-left">{errors.validUntil}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Applicability */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900 text-left">Applicability</h3>
              </div>

              <div className="space-y-6">
                {/* Applicable Plans */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-left">
                    Applicable Plans (Leave empty for all plans)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {subscriptionPlans.map(plan => (
                      <label key={plan.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.applicablePlans.includes(plan.id)}
                          onChange={() => handlePlanSelection(plan.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="text-left">
                          <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                          <div className="text-xs text-gray-500">{formatCurrency(plan.price)}/month</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Applicable Durations */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-left">
                    Applicable Durations (Leave empty for all durations)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {durations.map(duration => (
                      <label key={duration.value} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.applicableDurations.includes(duration.value)}
                          onChange={() => handleDurationSelection(duration.value)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-gray-900 text-left">{duration.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Settings */}
          <div className="space-y-6">
            {/* Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900 text-left">Settings</h3>
              </div>

              <div className="space-y-6">
                {/* Discount is active */}
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <label className="text-sm font-medium text-gray-900 text-left">
                      Discount is active
                    </label>
                    <p className="text-xs text-gray-500 text-left">
                      Enable or disable this discount code
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

                {/* Can be combined with other discounts */}
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <label className="text-sm font-medium text-gray-900 text-left">
                      Can be combined with other discounts
                    </label>
                    <p className="text-xs text-gray-500 text-left">
                      Allow stacking with other discount codes
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="canCombineWithOthers"
                      checked={formData.canCombineWithOthers}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Discount Preview */}
            {formData.discountName && formData.discountType && formData.discountValue > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Eye className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900 text-left">Preview</h3>
                </div>

                <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
                  <div className="text-left">
                    <div className="text-lg font-bold text-primary-800">{formData.discountCode}</div>
                    <div className="text-sm font-medium text-primary-700">{formData.discountName}</div>
                    <div className="text-xs text-primary-600 mt-1">
                      {formData.discountType === 'percentage'
                        ? `${formData.discountValue}% OFF`
                        : `₹${formData.discountValue} OFF`}
                    </div>
                    {formData.minOrderAmount > 0 && (
                      <div className="text-xs text-primary-600">
                        Min order: {formatCurrency(formData.minOrderAmount)}
                      </div>
                    )}
                    {formData.description && (
                      <div className="text-xs text-primary-600 mt-2">
                        {formData.description}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

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
                  {loading ? 'Creating...' : 'Create Discount'}
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'save_and_activate')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4" />
                  Create & Activate
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'preview')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Eye className="w-4 h-4" />
                  Preview Discount
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};

export default CreateDiscountPage;

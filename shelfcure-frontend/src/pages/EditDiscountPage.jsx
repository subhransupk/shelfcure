import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import { makeAuthenticatedRequest, API_ENDPOINTS } from '../config/api';
import {
  ArrowLeft, Save, Calendar, Percent,
  FileText, Users, Settings, CheckCircle, RefreshCw
} from 'lucide-react';
import { createNumericInputHandler, VALIDATION_OPTIONS } from '../utils/inputValidation';

const EditDiscountPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
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
    validFrom: '',
    validUntil: '',
    
    // Applicability
    applicablePlans: [],
    applicableDurations: [],
    
    // Settings
    isActive: true,
    canCombineWithOthers: false
  });

  // Fetch subscription plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // Mock subscription plans for now
        const mockPlans = [
          { _id: '1', name: 'Basic Plan', planType: 'basic' },
          { _id: '2', name: 'Standard Plan', planType: 'standard' },
          { _id: '3', name: 'Premium Plan', planType: 'premium' },
          { _id: '4', name: 'Enterprise Plan', planType: 'enterprise' }
        ];
        setSubscriptionPlans(mockPlans);
      } catch (error) {
        console.error('Error fetching subscription plans:', error);
      }
    };

    fetchPlans();
  }, []);

  // Fetch discount details
  useEffect(() => {
    const fetchDiscount = async () => {
      try {
        setLoading(true);
        const response = await makeAuthenticatedRequest(
          `${API_ENDPOINTS.ADMIN_DISCOUNTS}/${id}`,
          {
            method: 'GET'
          }
        );

        if (response.success) {
          const discount = response.data;
          setFormData({
            discountName: discount.name || '',
            discountCode: discount.code || '',
            description: discount.description || '',
            discountType: discount.type || '',
            discountValue: discount.value || 0,
            minOrderAmount: discount.limits?.minOrderAmount || 0,
            totalUsageLimit: discount.limits?.maxUses === -1 ? '' : discount.limits?.maxUses?.toString() || '',
            usageLimitPerUser: discount.limits?.maxUsesPerCustomer?.toString() || '',
            validFrom: discount.validity?.startDate ? new Date(discount.validity.startDate).toISOString().split('T')[0] : '',
            validUntil: discount.validity?.endDate ? new Date(discount.validity.endDate).toISOString().split('T')[0] : '',
            applicablePlans: discount.applicablePlans || [],
            applicableDurations: discount.applicableDurations || [],
            isActive: discount.isActive !== false,
            canCombineWithOthers: discount.canCombineWithOthers === true
          });
        }
      } catch (error) {
        console.error('Error fetching discount:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDiscount();
    }
  }, [id]);

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

    setSaving(true);
    
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
        `${API_ENDPOINTS.ADMIN_DISCOUNTS}/${id}`,
        {
          method: 'PUT',
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
        alert('Failed to update discount. Please try again.');
      }
    } catch (error) {
      console.error('Error updating discount:', error);
      alert('Failed to update discount. Please try again.');
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <AdminLayout title="Loading..." subtitle="Please wait while we load the discount details">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Edit Discount" 
      subtitle={`Editing discount: ${formData.discountCode}`}
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
                    Discount Code *
                  </label>
                  <input
                    type="text"
                    name="discountCode"
                    value={formData.discountCode}
                    onChange={handleInputChange}
                    placeholder="e.g., NEWYEAR2025"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.discountCode ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
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

              <div className="space-y-6">
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
                    <option value="">Select discount type</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Fixed Amount (₹)</option>
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
                    onChange={createNumericInputHandler(
                      (value) => setFormData(prev => ({ ...prev, discountValue: value })),
                      null,
                      formData.discountType === 'percentage' ? VALIDATION_OPTIONS.PERCENTAGE : VALIDATION_OPTIONS.PRICE
                    )}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Minimum Order Amount
                  </label>
                  <input
                    type="number"
                    name="minOrderAmount"
                    value={formData.minOrderAmount}
                    onChange={handleInputChange}
                    min="0"
                    step="1"
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-sm text-gray-500 text-left">
                    Minimum order amount required to use this discount
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Settings & Preview */}
          <div className="space-y-6">
            {/* Submit Buttons */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};

export default EditDiscountPage;

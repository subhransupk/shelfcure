import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import { API_ENDPOINTS, makeAuthenticatedRequest } from '../config/api';
import { ArrowLeft, Eye, EyeOff, RefreshCw } from 'lucide-react';

const CreateUserPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState([
    { value: '', label: 'Select Plan' }
  ]);
  const [plansLoading, setPlansLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    // Basic Information
    fullName: '',
    email: '',
    phone: '',
    role: '',
    passwordOption: 'auto', // 'auto' or 'manual'
    password: '',
    
    // Address Information
    address: '',
    city: '',
    state: '',
    pincode: '',
    
    // Owner Settings (only for store owners)
    subscriptionPlan: 'basic',
    maxStores: '1',
    billingDuration: 'monthly',
    assignImmediately: false,
    startWithTrial: false,
    
    // Notification Preferences
    sendWelcomeEmail: true,
    includeCredentialsInEmail: true,
    sendWhatsAppWelcome: false,
    
    // Admin Notes
    notes: ''
  });

  const roles = [
    { value: '', label: 'Select Role' },
    { value: 'store_owner', label: 'Store Owner' },
    { value: 'store_manager', label: 'Store Manager' },
    { value: 'staff', label: 'Staff' },
    { value: 'cashier', label: 'Cashier' },
    { value: 'admin', label: 'Admin' },
  ];



  const storeLimit = [
    { value: '', label: 'Select Limit' },
    { value: '1', label: '1 Store' },
    { value: '3', label: '3 Stores' },
    { value: '5', label: '5 Stores' },
    { value: '10', label: '10 Stores' },
    { value: 'unlimited', label: 'Unlimited Stores' },
  ];

  const billingDurations = [
    { value: '', label: 'Select Duration' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly (3 months)' },
    { value: 'yearly', label: 'Yearly (12 months)' },
  ];

  // Fetch subscription plans on component mount
  useEffect(() => {
    const fetchSubscriptionPlans = async () => {
      try {
        setPlansLoading(true);
        const response = await makeAuthenticatedRequest(API_ENDPOINTS.ADMIN_SUBSCRIPTION_PLANS);

        if (response.success && response.data) {
          const planOptions = [
            { value: '', label: 'Select Plan' },
            ...response.data.map(plan => ({
              value: plan.planType || plan._id,
              label: `${plan.name} - ₹${plan.pricing?.monthly || 0}/month`
            }))
          ];
          setSubscriptionPlans(planOptions);
        } else {
          console.error('Failed to fetch subscription plans:', response.message);
          // Keep default option if API fails
        }
      } catch (error) {
        console.error('Error fetching subscription plans:', error);
        // Keep default option if API fails
      } finally {
        setPlansLoading(false);
      }
    };

    fetchSubscriptionPlans();
  }, []);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  // Generate initial password when component loads
  useEffect(() => {
    if (formData.passwordOption === 'auto' && !formData.password) {
      generatePassword();
    }
  }, []);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    
    // Auto-generate password when switching to auto mode
    if (field === 'passwordOption' && value === 'auto') {
      generatePassword();
    }
    
    // Clear password when switching to manual mode
    if (field === 'passwordOption' && value === 'manual') {
      setFormData({ ...formData, password: '', passwordOption: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted!');
    console.log('Form data:', formData);
    setLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken');

      console.log('Creating user with data:', {
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        subscriptionPlan: formData.subscriptionPlan,
        maxStores: formData.maxStores,
        billingDuration: formData.billingDuration
      });

      // Use different endpoint based on role - store owners need subscription creation
      const endpoint = formData.role === 'store_owner'
        ? API_ENDPOINTS.ADMIN_CREATE_USER_WITH_SUBSCRIPTION
        : API_ENDPOINTS.ADMIN_USERS;

      console.log('Using endpoint:', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          subscriptionPlan: formData.subscriptionPlan,
          maxStores: formData.maxStores,
          billingDuration: formData.billingDuration,
          assignImmediately: formData.assignImmediately,
          startWithTrial: formData.startWithTrial,
          sendWelcomeEmail: formData.sendWelcomeEmail,
          includeCredentialsInEmail: formData.includeCredentialsInEmail,
          sendWhatsAppWelcome: formData.sendWhatsAppWelcome,
          notes: formData.notes,
          isActive: true
        })
      });

      const data = await response.json();

      console.log('Response status:', response.status);
      console.log('Response data:', data);

      if (data.success) {
        navigate('/admin/users', {
          state: { message: 'User created successfully!' }
        });
      } else {
        console.error('Server error:', data);
        alert(data.message || data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Network error: Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const isStoreOwner = formData.role === 'store_owner';

  return (
    <AdminLayout
      title="Create New User"
      subtitle="Add a new user to the system with appropriate permissions and settings"
    >
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Basic Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-left">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="demo@admin.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                      Role *
                    </label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Password Option */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-left">
                    Password Option *
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="passwordOption"
                        value="auto"
                        checked={formData.passwordOption === 'auto'}
                        onChange={(e) => handleInputChange('passwordOption', e.target.value)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-900">Auto-generate secure password</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="passwordOption"
                        value="manual"
                        checked={formData.passwordOption === 'manual'}
                        onChange={(e) => handleInputChange('passwordOption', e.target.value)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-900">Set password manually</span>
                    </label>
                  </div>
                  
                  {/* Password Field */}
                  <div className="mt-4">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        readOnly={formData.passwordOption === 'auto'}
                        className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder={formData.passwordOption === 'auto' ? 'Password will be auto-generated' : 'Enter password'}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
                        {formData.passwordOption === 'auto' && (
                          <button
                            type="button"
                            onClick={generatePassword}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Generate new password"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-left">Address Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                      Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter full address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-left">Notification Preferences</h3>

                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3 text-left">📧 Email Notifications</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.sendWelcomeEmail}
                          onChange={(e) => handleInputChange('sendWelcomeEmail', e.target.checked)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-900">Send welcome email</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.includeCredentialsInEmail}
                          onChange={(e) => handleInputChange('includeCredentialsInEmail', e.target.checked)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-900">Include login credentials in email</span>
                      </label>
                    </div>
                  </div>

                  {/* WhatsApp Notifications */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3 text-left">📱 WhatsApp Notifications</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.sendWhatsAppWelcome}
                          onChange={(e) => handleInputChange('sendWhatsAppWelcome', e.target.checked)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-900">Send WhatsApp welcome message</span>
                      </label>

                      <div className="ml-6 text-xs text-gray-500 space-y-1">
                        <p>• Requires user to have a valid phone number</p>
                        <p>• WhatsApp Business API must be configured</p>
                        <p>• Login credentials will be included if both email and WhatsApp options are checked</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-left">Admin Notes</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Add any additional notes about this user..."
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Owner Settings */}
            <div className="lg:col-span-1">
              {isStoreOwner && (
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 text-left">Owner Settings</h3>

                  <div className="space-y-6">
                    {/* Subscription Options */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3 text-left">Subscription Options</h4>
                      <p className="text-xs text-gray-600 mb-4 text-left">
                        You can assign standard subscription plans here during user creation. For custom pricing or enterprise plans, use the Custom Subscription Assignment after creating the user.
                      </p>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                            Subscription Plan *
                          </label>
                          <select
                            required={isStoreOwner}
                            value={formData.subscriptionPlan}
                            onChange={(e) => handleInputChange('subscriptionPlan', e.target.value)}
                            disabled={plansLoading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            {plansLoading ? (
                              <option value="">Loading plans...</option>
                            ) : (
                              subscriptionPlans.map(plan => (
                                <option key={plan.value} value={plan.value}>{plan.label}</option>
                              ))
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                            Maximum Stores Allowed *
                          </label>
                          <select
                            required={isStoreOwner}
                            value={formData.maxStores}
                            onChange={(e) => handleInputChange('maxStores', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            {storeLimit.map(limit => (
                              <option key={limit.value} value={limit.value}>{limit.label}</option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1 text-left">
                            This will be automatically set based on the selected subscription plan
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                            Billing Duration *
                          </label>
                          <select
                            required={isStoreOwner}
                            value={formData.billingDuration}
                            onChange={(e) => handleInputChange('billingDuration', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            {billingDurations.map(duration => (
                              <option key={duration.value} value={duration.value}>{duration.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-3">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.assignImmediately}
                              onChange={(e) => handleInputChange('assignImmediately', e.target.checked)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-900">Assign subscription immediately</span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.startWithTrial}
                              onChange={(e) => handleInputChange('startWithTrial', e.target.checked)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-900">Start with trial period</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating User...
                  </>
                ) : (
                  'Create User'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default CreateUserPage;

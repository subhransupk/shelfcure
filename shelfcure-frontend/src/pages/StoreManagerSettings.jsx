import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Store,
  Bell,
  Shield,
  Save,
  Eye,
  EyeOff,
  Percent,
  Receipt,
  DollarSign,
  Calculator,
  Plus,
  Edit,
  Trash2,
  Power,
  Tag,
  FileText
} from 'lucide-react';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';
import { getCurrentUser } from '../services/authService';

const StoreManagerSettings = () => {
  const user = getCurrentUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [storeInfo, setStoreInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    lowStockAlerts: true,
    expiryAlerts: true,
    salesNotifications: true,
    emailNotifications: true
  });

  const [businessSettings, setBusinessSettings] = useState({
    // GST Settings
    gstEnabled: true,
    defaultGstRate: 18,
    gstNumber: '',
    includeTaxInPrice: true,

    // Discount Settings
    allowDiscounts: true,
    maxDiscountPercent: 50,
    maxDiscountAmountPerBill: 0, // 0 means no limit
    requireManagerApproval: true,
    discountOnMRP: true,
    autoApplyDiscounts: false,
    autoDiscountRules: [],

    // Sales Settings
    allowNegativeStock: false,
    requirePrescription: true,
    printReceiptByDefault: true,

    // Currency Settings
    currency: 'INR',
    currencySymbol: '₹',
    decimalPlaces: 2
  });

  // Discount Types Management
  const [discountTypes, setDiscountTypes] = useState([
    { id: 1, name: 'Percentage Discount', type: 'percentage', value: 10, maxValue: 50, isActive: true, description: 'Percentage off on total bill' },
    { id: 2, name: 'Amount Discount', type: 'amount', value: 50, maxValue: 500, isActive: true, description: 'Fixed amount off' }
  ]);

  // Tax Types Management
  const [taxTypes, setTaxTypes] = useState([
    { id: 1, name: 'Standard GST', type: 'gst', rate: 18, isActive: true, description: 'Regular GST for medicines', category: 'standard' },
    { id: 2, name: 'Reduced GST', type: 'gst', rate: 5, isActive: true, description: 'Essential medicines GST', category: 'essential' },
    { id: 3, name: 'Zero GST', type: 'gst', rate: 0, isActive: true, description: 'Life-saving drugs', category: 'lifesaving' },
    { id: 4, name: 'CGST', type: 'cgst', rate: 9, isActive: true, description: 'Central GST', category: 'split' },
    { id: 5, name: 'SGST', type: 'sgst', rate: 9, isActive: true, description: 'State GST', category: 'split' },
    { id: 6, name: 'IGST', type: 'igst', rate: 18, isActive: false, description: 'Integrated GST for inter-state', category: 'interstate' }
  ]);

  // Modal states for editing
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [showDiscountRuleModal, setShowDiscountRuleModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [editingTax, setEditingTax] = useState(null);
  const [editingDiscountRule, setEditingDiscountRule] = useState(null);
  const [gstSaving, setGstSaving] = useState(false);
  const [discountForm, setDiscountForm] = useState({
    name: '',
    type: 'percentage',
    value: 0,
    maxValue: 0,
    description: '',
    isActive: true
  });
  const [taxForm, setTaxForm] = useState({
    name: '',
    type: 'gst',
    rate: 0,
    description: '',
    category: 'standard',
    isActive: true
  });
  const [discountRuleForm, setDiscountRuleForm] = useState({
    name: '',
    minBillAmount: 0,
    discountType: 'percentage',
    discountValue: 0,
    maxDiscountAmount: 0,
    isActive: true
  });

  // Discount Type Handlers
  const handleToggleDiscount = async (discountId) => {
    const updatedDiscountTypes = discountTypes.map(discount =>
      discount.id === discountId
        ? { ...discount, isActive: !discount.isActive }
        : discount
    );
    setDiscountTypes(updatedDiscountTypes);
    setMessage('Discount status updated successfully!');

    // Auto-save
    try {
      const settingsData = {
        ...businessSettings,
        discountTypes: updatedDiscountTypes,
        taxTypes
      };
      await fetch('/api/store-manager/business-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settingsData)
      });
    } catch (error) {
      console.error('Error auto-saving discount toggle:', error);
    }

    setTimeout(() => setMessage(''), 3000);
  };

  const handleEditDiscount = (discount) => {
    setEditingDiscount(discount);
    setDiscountForm({
      name: discount.name,
      type: discount.type,
      value: discount.value,
      maxValue: discount.maxValue,
      description: discount.description,
      isActive: discount.isActive
    });
    setShowDiscountModal(true);
  };

  const handleDeleteDiscount = async (discountId) => {
    if (window.confirm('Are you sure you want to delete this discount type?')) {
      const updatedDiscountTypes = discountTypes.filter(discount => discount.id !== discountId);
      setDiscountTypes(updatedDiscountTypes);
      setMessage('Discount type deleted successfully!');

      // Auto-save
      try {
        const settingsData = {
          ...businessSettings,
          discountTypes: updatedDiscountTypes,
          taxTypes
        };
        await fetch('/api/store-manager/business-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(settingsData)
        });
      } catch (error) {
        console.error('Error auto-saving discount delete:', error);
      }

      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleAddDiscount = () => {
    setEditingDiscount(null);
    setDiscountForm({
      name: '',
      type: 'percentage',
      value: 0,
      maxValue: 0,
      description: '',
      isActive: true
    });
    setShowDiscountModal(true);
  };

  const handleSaveDiscount = async () => {
    if (!discountForm.name || !discountForm.value || !discountForm.maxValue) {
      setMessage('Please fill in all required fields!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    let updatedDiscountTypes;
    if (editingDiscount) {
      // Update existing discount
      updatedDiscountTypes = discountTypes.map(discount =>
        discount.id === editingDiscount.id
          ? { ...discount, ...discountForm }
          : discount
      );
      setDiscountTypes(updatedDiscountTypes);
      setMessage('Discount type updated successfully!');
    } else {
      // Add new discount
      const newDiscount = {
        id: Date.now(),
        ...discountForm
      };
      updatedDiscountTypes = [...discountTypes, newDiscount];
      setDiscountTypes(updatedDiscountTypes);
      setMessage('Discount type added successfully!');
    }

    setShowDiscountModal(false);

    // Auto-save the business settings
    try {
      const settingsData = {
        ...businessSettings,
        discountTypes: updatedDiscountTypes,
        taxTypes
      };

      const response = await fetch('/api/store-manager/business-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settingsData)
      });

      if (response.ok) {
        console.log('Auto-saved discount types successfully');
        // Refresh store info in case GST number was updated
        fetchStoreInfo();
      }
    } catch (error) {
      console.error('Error auto-saving discount types:', error);
    }

    setTimeout(() => setMessage(''), 3000);
  };

  // Tax Type Handlers
  const handleToggleTax = async (taxId) => {
    const updatedTaxTypes = taxTypes.map(tax =>
      tax.id === taxId
        ? { ...tax, isActive: !tax.isActive }
        : tax
    );
    setTaxTypes(updatedTaxTypes);
    setMessage('Tax status updated successfully!');

    // Auto-save
    try {
      const settingsData = {
        ...businessSettings,
        discountTypes,
        taxTypes: updatedTaxTypes
      };
      await fetch('/api/store-manager/business-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settingsData)
      });
    } catch (error) {
      console.error('Error auto-saving tax toggle:', error);
    }

    setTimeout(() => setMessage(''), 3000);
  };

  const handleEditTax = (tax) => {
    setEditingTax(tax);
    setTaxForm({
      name: tax.name,
      type: tax.type,
      rate: tax.rate,
      description: tax.description,
      category: tax.category,
      isActive: tax.isActive
    });
    setShowTaxModal(true);
  };

  const handleDeleteTax = async (taxId) => {
    if (window.confirm('Are you sure you want to delete this tax type?')) {
      const updatedTaxTypes = taxTypes.filter(tax => tax.id !== taxId);
      setTaxTypes(updatedTaxTypes);
      setMessage('Tax type deleted successfully!');

      // Auto-save
      try {
        const settingsData = {
          ...businessSettings,
          discountTypes,
          taxTypes: updatedTaxTypes
        };
        await fetch('/api/store-manager/business-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(settingsData)
        });
      } catch (error) {
        console.error('Error auto-saving tax delete:', error);
      }

      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleAddTax = () => {
    setEditingTax(null);
    setTaxForm({
      name: '',
      type: 'gst',
      rate: 0,
      description: '',
      category: 'standard',
      isActive: true
    });
    setShowTaxModal(true);
  };

  const handleSaveTax = async () => {
    if (!taxForm.name || taxForm.rate === undefined) {
      setMessage('Please fill in all required fields!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    let updatedTaxTypes;
    if (editingTax) {
      // Update existing tax
      updatedTaxTypes = taxTypes.map(tax =>
        tax.id === editingTax.id
          ? { ...tax, ...taxForm }
          : tax
      );
      setTaxTypes(updatedTaxTypes);
      setMessage('Tax type updated successfully!');
    } else {
      // Add new tax
      const newTax = {
        id: Date.now(),
        ...taxForm
      };
      updatedTaxTypes = [...taxTypes, newTax];
      setTaxTypes(updatedTaxTypes);
      setMessage('Tax type added successfully!');
    }

    setShowTaxModal(false);

    // Auto-save the business settings
    try {
      const settingsData = {
        ...businessSettings,
        discountTypes,
        taxTypes: updatedTaxTypes
      };

      const response = await fetch('/api/store-manager/business-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settingsData)
      });

      if (response.ok) {
        console.log('Auto-saved tax types successfully');
        // Refresh store info in case GST number was updated
        fetchStoreInfo();
      }
    } catch (error) {
      console.error('Error auto-saving tax types:', error);
    }

    setTimeout(() => setMessage(''), 3000);
  };

  // Discount Rule Handlers
  const handleAddDiscountRule = () => {
    setEditingDiscountRule(null);
    setDiscountRuleForm({
      name: '',
      minBillAmount: 0,
      discountType: 'percentage',
      discountValue: 0,
      maxDiscountAmount: 0,
      isActive: true
    });
    setShowDiscountRuleModal(true);
  };

  const handleEditDiscountRule = (rule) => {
    setEditingDiscountRule(rule);
    setDiscountRuleForm({
      name: rule.name,
      minBillAmount: rule.minBillAmount,
      discountType: rule.discountType,
      discountValue: rule.discountValue,
      maxDiscountAmount: rule.maxDiscountAmount || 0,
      isActive: rule.isActive
    });
    setShowDiscountRuleModal(true);
  };

  const handleSaveDiscountRule = async () => {
    if (!discountRuleForm.name || discountRuleForm.minBillAmount <= 0 || discountRuleForm.discountValue <= 0) {
      setMessage('Please fill in all required fields with valid values!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    let updatedRules;
    if (editingDiscountRule) {
      // Update existing rule
      updatedRules = businessSettings.autoDiscountRules.map(rule =>
        rule.id === editingDiscountRule.id
          ? { ...rule, ...discountRuleForm }
          : rule
      );
      setMessage('Discount rule updated successfully!');
    } else {
      // Add new rule
      const newRule = {
        id: Date.now(),
        ...discountRuleForm
      };
      updatedRules = [...(businessSettings.autoDiscountRules || []), newRule];
      setMessage('Discount rule added successfully!');
    }

    setBusinessSettings({
      ...businessSettings,
      autoDiscountRules: updatedRules
    });

    setShowDiscountRuleModal(false);

    // Auto-save the business settings
    try {
      const settingsData = {
        ...businessSettings,
        autoDiscountRules: updatedRules,
        discountTypes,
        taxTypes
      };

      const response = await fetch('/api/store-manager/business-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settingsData)
      });

      if (response.ok) {
        console.log('Auto-saved discount rules successfully');
        // Refresh store info in case GST number was updated
        fetchStoreInfo();
      }
    } catch (error) {
      console.error('Error auto-saving discount rules:', error);
    }

    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeleteDiscountRule = async (ruleId) => {
    const updatedRules = businessSettings.autoDiscountRules.filter(rule => rule.id !== ruleId);
    setBusinessSettings({
      ...businessSettings,
      autoDiscountRules: updatedRules
    });
    setMessage('Discount rule deleted successfully!');

    // Auto-save the business settings
    try {
      const settingsData = {
        ...businessSettings,
        autoDiscountRules: updatedRules,
        discountTypes,
        taxTypes
      };

      const response = await fetch('/api/store-manager/business-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settingsData)
      });

      if (response.ok) {
        console.log('Auto-saved discount rules successfully');
        // Refresh store info in case GST number was updated
        fetchStoreInfo();
      }
    } catch (error) {
      console.error('Error auto-saving discount rules:', error);
    }

    setTimeout(() => setMessage(''), 3000);
  };

  const handleToggleDiscountRule = async (ruleId) => {
    const updatedRules = businessSettings.autoDiscountRules.map(rule =>
      rule.id === ruleId
        ? { ...rule, isActive: !rule.isActive }
        : rule
    );
    setBusinessSettings({
      ...businessSettings,
      autoDiscountRules: updatedRules
    });
    setMessage('Discount rule status updated successfully!');

    // Auto-save the business settings
    try {
      const settingsData = {
        ...businessSettings,
        autoDiscountRules: updatedRules,
        discountTypes,
        taxTypes
      };

      const response = await fetch('/api/store-manager/business-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settingsData)
      });

      if (response.ok) {
        console.log('Auto-saved discount rules successfully');
        // Refresh store info in case GST number was updated
        fetchStoreInfo();
      }
    } catch (error) {
      console.error('Error auto-saving discount rules:', error);
    }

    setTimeout(() => setMessage(''), 3000);
  };

  useEffect(() => {
    fetchStoreInfo();
    fetchBusinessSettings();
  }, []);

  const fetchStoreInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/store-manager/store-info', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Store info received:', data.data);
        console.log('Store info business GST:', data.data.business?.gstNumber);
        setStoreInfo(data.data);
      }
    } catch (error) {
      console.error('Error fetching store info:', error);
    }
  };

  const fetchBusinessSettings = async () => {
    try {
      const response = await fetch('/api/store-manager/business-settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const { discountTypes: fetchedDiscountTypes, taxTypes: fetchedTaxTypes, ...settings } = data.data;
          console.log('Business settings received:', settings);
          console.log('Business settings GST:', settings.gstNumber);
          setBusinessSettings(settings);

          if (fetchedDiscountTypes) {
            setDiscountTypes(fetchedDiscountTypes);
          }

          if (fetchedTaxTypes) {
            setTaxTypes(fetchedTaxTypes);
          }
        }
      } else {
        console.error('Failed to fetch business settings:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching business settings:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Simulate API call for profile update
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Simulate API call for notification settings update
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Notification settings updated successfully!');
    } catch (error) {
      setMessage('Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessSettingsUpdate = async () => {
    setLoading(true);
    setMessage('');

    try {
      // API call to save business settings including discount and tax types
      const settingsData = {
        ...businessSettings,
        discountTypes,
        taxTypes
      };

      console.log('=== FRONTEND: Saving business settings ===');
      console.log('Settings data:', settingsData);
      console.log('Token exists:', !!localStorage.getItem('token'));
      console.log('Token preview:', localStorage.getItem('token')?.substring(0, 20) + '...');

      const response = await fetch('/api/store-manager/business-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settingsData)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const successData = await response.json();
        console.log('Success response data:', successData);
        setMessage('Business settings updated successfully!');
        // Refetch the settings to get the updated data from database
        await fetchBusinessSettings();
        // Also refetch store info to show updated GST number
        await fetchStoreInfo();
      } else {
        // Get detailed error information from response
        let errorMessage = 'Failed to update settings';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.error('Backend error response:', errorData);
          console.error('Full error details:', errorData);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          console.error('Raw response text:', await response.text());
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to update business settings';
      setMessage(errorMessage);
      console.error('Business settings update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'store', name: 'Store Info', icon: Store },
    { id: 'business', name: 'Business Settings', icon: Calculator },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield }
  ];

  return (
    <StoreManagerLayout>
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 text-left">Settings</h1>
            <p className="mt-2 text-sm text-gray-700 text-left">
              Manage your profile, store settings, and preferences.
            </p>
          </div>

          {/* Success/Error Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-md ${
              message.includes('successfully') || message.includes('updated')
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <div className="bg-white shadow rounded-lg">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        activeTab === tab.id
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'profile' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Profile Information</h3>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Name</label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Email</label>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Phone</label>
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Role</label>
                        <input
                          type="text"
                          value="Store Manager"
                          disabled
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                        />
                      </div>
                    </div>
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Update Profile
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'store' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Store Information</h3>
                  {storeInfo ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Store Name</label>
                          <p className="text-sm text-gray-900 p-2 bg-gray-50 rounded">{storeInfo.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Store Code</label>
                          <p className="text-sm text-gray-900 p-2 bg-gray-50 rounded">{storeInfo.code}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Phone</label>
                          <p className="text-sm text-gray-900 p-2 bg-gray-50 rounded">{storeInfo.phone || 'Not set'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Email</label>
                          <p className="text-sm text-gray-900 p-2 bg-gray-50 rounded">{storeInfo.email || 'Not set'}</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Address</label>
                        <p className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
                          {storeInfo.address ? 
                            `${storeInfo.address.street}, ${storeInfo.address.city}, ${storeInfo.address.state} - ${storeInfo.address.pincode}` :
                            'Address not set'
                          }
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 text-left">GST Number</label>
                          <p className="text-sm text-gray-900 p-2 bg-gray-50 rounded">{storeInfo.business?.gstNumber || 'Not set'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 text-left">License Number</label>
                          <p className="text-sm text-gray-900 p-2 bg-gray-50 rounded">{storeInfo.business?.licenseNumber || 'Not set'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Store className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Loading store information...</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'business' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Business Settings</h3>

                  {/* Tax Types Management */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Receipt className="h-5 w-5 text-green-600 mr-2" />
                        <h4 className="text-md font-medium text-gray-900">Tax & GST Types</h4>
                      </div>
                      <button
                        onClick={handleAddTax}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Tax Type
                      </button>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      {/* GST Number and Basic Settings */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                        <h5 className="text-sm font-medium text-gray-900 mb-3 text-left">Basic Tax Settings</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                              GST Number
                              {gstSaving && <span className="ml-2 text-xs text-blue-600">Saving...</span>}
                            </label>
                            <input
                              type="text"
                              value={businessSettings.gstNumber || ''}
                              onChange={(e) => {
                                const newGstNumber = e.target.value;
                                setBusinessSettings({...businessSettings, gstNumber: newGstNumber});

                                // Auto-save GST number after a short delay
                                clearTimeout(window.gstSaveTimeout);
                                setGstSaving(true);
                                window.gstSaveTimeout = setTimeout(async () => {
                                  try {
                                    const settingsData = {
                                      ...businessSettings,
                                      gstNumber: newGstNumber,
                                      discountTypes,
                                      taxTypes
                                    };

                                    const response = await fetch('/api/store-manager/business-settings', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                                      },
                                      body: JSON.stringify(settingsData)
                                    });

                                    if (response.ok) {
                                      console.log('GST number auto-saved successfully');
                                      // Refresh store info to show updated GST number
                                      await fetchStoreInfo();
                                      setMessage('GST number updated successfully!');
                                      setTimeout(() => setMessage(''), 2000);
                                    }
                                  } catch (error) {
                                    console.error('Error auto-saving GST number:', error);
                                    setMessage('Failed to save GST number');
                                    setTimeout(() => setMessage(''), 3000);
                                  } finally {
                                    setGstSaving(false);
                                  }
                                }, 1000); // Save after 1 second of no typing
                              }}
                              placeholder="Enter GST Number (e.g., 27ABCDE1234F1Z5)"
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <h6 className="text-sm font-medium text-gray-900 text-left">Include Tax in Price</h6>
                              <p className="text-xs text-gray-500 text-left">Show prices inclusive of tax</p>
                            </div>
                            <button
                              onClick={() => setBusinessSettings({...businessSettings, includeTaxInPrice: !businessSettings.includeTaxInPrice})}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                                businessSettings.includeTaxInPrice ? 'bg-green-600' : 'bg-gray-200'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  businessSettings.includeTaxInPrice ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Tax Types List */}
                      <div className="space-y-3">
                        {taxTypes.map((tax) => (
                          <div key={tax.id} className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center space-x-2">
                                    {tax.category === 'standard' && <FileText className="h-4 w-4 text-blue-500" />}
                                    {tax.category === 'essential' && <Tag className="h-4 w-4 text-green-500" />}
                                    {tax.category === 'lifesaving' && <Shield className="h-4 w-4 text-red-500" />}
                                    {tax.category === 'split' && <Calculator className="h-4 w-4 text-purple-500" />}
                                    {tax.category === 'interstate' && <Store className="h-4 w-4 text-orange-500" />}
                                    <h5 className="text-sm font-medium text-gray-900">{tax.name}</h5>
                                  </div>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    tax.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {tax.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 text-left">{tax.description}</p>
                                <div className="flex items-center space-x-4 mt-2">
                                  <span className="text-sm text-gray-600">Rate: {tax.rate}%</span>
                                  <span className="text-sm text-gray-600">Type: {tax.type.toUpperCase()}</span>
                                  <span className="text-sm text-gray-600">Category: {tax.category}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleToggleTax(tax.id)}
                                  className={`p-2 rounded-md ${
                                    tax.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'
                                  }`}
                                  title={tax.isActive ? 'Deactivate' : 'Activate'}
                                >
                                  <Power className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleEditTax(tax)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTax(tax.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Discount Types Management */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Percent className="h-5 w-5 text-green-600 mr-2" />
                        <h4 className="text-md font-medium text-gray-900">Discount Types</h4>
                      </div>
                      <button
                        onClick={handleAddDiscount}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Discount
                      </button>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-3">
                        {discountTypes.map((discount) => (
                          <div key={discount.id} className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center space-x-2">
                                    {discount.type === 'percentage' && <Percent className="h-4 w-4 text-blue-500" />}
                                    {discount.type === 'amount' && <DollarSign className="h-4 w-4 text-green-500" />}
                                    <h5 className="text-sm font-medium text-gray-900">{discount.name}</h5>
                                  </div>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    discount.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {discount.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 text-left">{discount.description}</p>
                                <div className="flex items-center space-x-4 mt-2">
                                  <span className="text-sm text-gray-600">
                                    Value: {discount.type === 'amount' ? '₹' : ''}{discount.value}{discount.type === 'percentage' ? '%' : ''}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    Max: {discount.type === 'amount' ? '₹' : ''}{discount.maxValue}{discount.type === 'percentage' ? '%' : ''}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleToggleDiscount(discount.id)}
                                  className={`p-2 rounded-md ${
                                    discount.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'
                                  }`}
                                  title={discount.isActive ? 'Deactivate' : 'Activate'}
                                >
                                  <Power className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleEditDiscount(discount)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteDiscount(discount.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Advanced Discount Settings */}
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <Settings className="h-5 w-5 text-green-600 mr-2" />
                      <h4 className="text-md font-medium text-gray-900">Advanced Discount Settings</h4>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      {/* Basic Discount Settings */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h5 className="text-sm font-medium text-gray-900 mb-3 text-left">Basic Discount Configuration</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Max Discount Percentage</label>
                            <input
                              type="number"
                              value={businessSettings.maxDiscountPercent || ''}
                              onChange={(e) => setBusinessSettings({...businessSettings, maxDiscountPercent: parseFloat(e.target.value) || 0})}
                              placeholder="Enter max discount %"
                              min="0"
                              max="100"
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Max Discount Amount Per Bill (₹)</label>
                            <input
                              type="number"
                              value={businessSettings.maxDiscountAmountPerBill || ''}
                              onChange={(e) => setBusinessSettings({...businessSettings, maxDiscountAmountPerBill: parseFloat(e.target.value) || 0})}
                              placeholder="0 = No limit"
                              min="0"
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h6 className="text-sm font-medium text-gray-900 text-left">Require Manager Approval</h6>
                              <p className="text-xs text-gray-500 text-left">Require approval for discounts</p>
                            </div>
                            <button
                              onClick={() => setBusinessSettings({...businessSettings, requireManagerApproval: !businessSettings.requireManagerApproval})}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                                businessSettings.requireManagerApproval ? 'bg-green-600' : 'bg-gray-200'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  businessSettings.requireManagerApproval ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <h6 className="text-sm font-medium text-gray-900 text-left">Auto-Apply Discounts</h6>
                              <p className="text-xs text-gray-500 text-left">Automatically apply eligible discounts</p>
                            </div>
                            <button
                              onClick={() => setBusinessSettings({...businessSettings, autoApplyDiscounts: !businessSettings.autoApplyDiscounts})}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                                businessSettings.autoApplyDiscounts ? 'bg-green-600' : 'bg-gray-200'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  businessSettings.autoApplyDiscounts ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Auto Discount Rules */}
                      {businessSettings.autoApplyDiscounts && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-sm font-medium text-gray-900 text-left">Auto Discount Rules</h5>
                            <button
                              onClick={handleAddDiscountRule}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Rule
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mb-3 text-left">
                            Rules are applied in order. The highest applicable discount will be selected automatically.
                          </p>
                          {businessSettings.autoDiscountRules && businessSettings.autoDiscountRules.length > 0 ? (
                            <div className="space-y-2">
                              {businessSettings.autoDiscountRules.map((rule) => (
                                <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <h6 className="text-sm font-medium text-gray-900">{rule.name}</h6>
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                        rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {rule.isActive ? 'Active' : 'Inactive'}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Bill ≥ ₹{rule.minBillAmount} → {rule.discountType === 'percentage' ? `${rule.discountValue}%` : `₹${rule.discountValue}`} off
                                      {rule.maxDiscountAmount > 0 && ` (max ₹${rule.maxDiscountAmount})`}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => handleToggleDiscountRule(rule.id)}
                                      className={`p-1 rounded-md ${
                                        rule.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'
                                      }`}
                                      title={rule.isActive ? 'Deactivate' : 'Activate'}
                                    >
                                      <Power className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => handleEditDiscountRule(rule)}
                                      className="p-1 text-blue-600 hover:bg-blue-50 rounded-md"
                                      title="Edit"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteDiscountRule(rule.id)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded-md"
                                      title="Delete"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-sm text-gray-500">No auto discount rules configured</p>
                              <p className="text-xs text-gray-400 mt-1">Add rules to automatically apply discounts based on bill amount</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sales Settings Section */}
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                      <h4 className="text-md font-medium text-gray-900">Sales & POS Settings</h4>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 text-left">Allow Negative Stock</h5>
                          <p className="text-sm text-gray-500 text-left">Allow sales even when stock is zero</p>
                        </div>
                        <button
                          onClick={() => setBusinessSettings({...businessSettings, allowNegativeStock: !businessSettings.allowNegativeStock})}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                            businessSettings.allowNegativeStock ? 'bg-green-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              businessSettings.allowNegativeStock ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 text-left">Require Prescription</h5>
                          <p className="text-sm text-gray-500 text-left">Require prescription for prescription medicines</p>
                        </div>
                        <button
                          onClick={() => setBusinessSettings({...businessSettings, requirePrescription: !businessSettings.requirePrescription})}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                            businessSettings.requirePrescription ? 'bg-green-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              businessSettings.requirePrescription ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 text-left">Print Receipt by Default</h5>
                          <p className="text-sm text-gray-500 text-left">Automatically print receipt after each sale</p>
                        </div>
                        <button
                          onClick={() => setBusinessSettings({...businessSettings, printReceiptByDefault: !businessSettings.printReceiptByDefault})}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                            businessSettings.printReceiptByDefault ? 'bg-green-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              businessSettings.printReceiptByDefault ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4">
                    <button
                      onClick={() => handleBusinessSettingsUpdate()}
                      disabled={loading}
                      className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Business Settings
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Notification Preferences</h3>
                  <div className="space-y-4">
                    {Object.entries(notificationSettings).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 text-left">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </h4>
                          <p className="text-sm text-gray-500 text-left">
                            {key === 'lowStockAlerts' && 'Get notified when medicines are running low'}
                            {key === 'expiryAlerts' && 'Get notified about medicines nearing expiry'}
                            {key === 'salesNotifications' && 'Get notified about daily sales summaries'}
                            {key === 'emailNotifications' && 'Receive notifications via email'}
                          </p>
                        </div>
                        <button
                          onClick={() => setNotificationSettings({
                            ...notificationSettings,
                            [key]: !value
                          })}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                            value ? 'bg-green-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              value ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                    <div className="pt-4">
                      <button
                        onClick={handleNotificationUpdate}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Preferences
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Security Settings</h3>
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={profileData.currentPassword}
                          onChange={(e) => setProfileData({...profileData, currentPassword: e.target.value})}
                          className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">New Password</label>
                      <input
                        type="password"
                        value={profileData.newPassword}
                        onChange={(e) => setProfileData({...profileData, newPassword: e.target.value})}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Confirm New Password</label>
                      <input
                        type="password"
                        value={profileData.confirmPassword}
                        onChange={(e) => setProfileData({...profileData, confirmPassword: e.target.value})}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Shield className="h-4 w-4 mr-2" />
                        )}
                        Update Password
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingDiscount ? 'Edit Discount Type' : 'Add New Discount Type'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={discountForm.name}
                    onChange={(e) => setDiscountForm({...discountForm, name: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter discount name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={discountForm.type}
                    onChange={(e) => setDiscountForm({...discountForm, type: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="amount">Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                  <input
                    type="number"
                    value={discountForm.value}
                    onChange={(e) => setDiscountForm({...discountForm, value: parseFloat(e.target.value)})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter discount value"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Value</label>
                  <input
                    type="number"
                    value={discountForm.maxValue}
                    onChange={(e) => setDiscountForm({...discountForm, maxValue: parseFloat(e.target.value)})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter maximum value"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={discountForm.description}
                    onChange={(e) => setDiscountForm({...discountForm, description: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    rows="3"
                    placeholder="Enter description"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={discountForm.isActive}
                    onChange={(e) => setDiscountForm({...discountForm, isActive: e.target.checked})}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Active</label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDiscountModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDiscount}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                >
                  {editingDiscount ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tax Modal */}
      {showTaxModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTax ? 'Edit Tax Type' : 'Add New Tax Type'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={taxForm.name}
                    onChange={(e) => setTaxForm({...taxForm, name: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter tax name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={taxForm.type}
                    onChange={(e) => setTaxForm({...taxForm, type: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="gst">GST</option>
                    <option value="cgst">CGST</option>
                    <option value="sgst">SGST</option>
                    <option value="igst">IGST</option>
                    <option value="cess">Cess</option>
                    <option value="local">Local Tax</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate (%)</label>
                  <input
                    type="number"
                    value={taxForm.rate}
                    onChange={(e) => setTaxForm({...taxForm, rate: parseFloat(e.target.value)})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter tax rate"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={taxForm.category}
                    onChange={(e) => setTaxForm({...taxForm, category: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="essential">Essential</option>
                    <option value="lifesaving">Life-saving</option>
                    <option value="split">Split</option>
                    <option value="interstate">Interstate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={taxForm.description}
                    onChange={(e) => setTaxForm({...taxForm, description: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    rows="3"
                    placeholder="Enter description"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={taxForm.isActive}
                    onChange={(e) => setTaxForm({...taxForm, isActive: e.target.checked})}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Active</label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowTaxModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTax}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                >
                  {editingTax ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discount Rule Modal */}
      {showDiscountRuleModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingDiscountRule ? 'Edit Discount Rule' : 'Add New Discount Rule'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
                  <input
                    type="text"
                    value={discountRuleForm.name}
                    onChange={(e) => setDiscountRuleForm({...discountRuleForm, name: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Bulk Purchase Discount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Bill Amount (₹)</label>
                  <input
                    type="number"
                    value={discountRuleForm.minBillAmount || ''}
                    onChange={(e) => setDiscountRuleForm({...discountRuleForm, minBillAmount: parseFloat(e.target.value) || 0})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter minimum bill amount"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                  <select
                    value={discountRuleForm.discountType}
                    onChange={(e) => setDiscountRuleForm({...discountRuleForm, discountType: e.target.value})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="amount">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Value {discountRuleForm.discountType === 'percentage' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    value={discountRuleForm.discountValue || ''}
                    onChange={(e) => setDiscountRuleForm({...discountRuleForm, discountValue: parseFloat(e.target.value) || 0})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    placeholder={discountRuleForm.discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                    min="0"
                    max={discountRuleForm.discountType === 'percentage' ? '100' : undefined}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Discount Amount (₹)</label>
                  <input
                    type="number"
                    value={discountRuleForm.maxDiscountAmount || ''}
                    onChange={(e) => setDiscountRuleForm({...discountRuleForm, maxDiscountAmount: parseFloat(e.target.value) || 0})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    placeholder="0 = No limit"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave 0 for no maximum limit</p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={discountRuleForm.isActive}
                    onChange={(e) => setDiscountRuleForm({...discountRuleForm, isActive: e.target.checked})}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Active</label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDiscountRuleModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDiscountRule}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                >
                  {editingDiscountRule ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </StoreManagerLayout>
  );
};

export default StoreManagerSettings;

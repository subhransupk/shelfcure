import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import { API_ENDPOINTS, makeAuthenticatedRequest } from '../config/api';
import {
  UserCheck, Search, Users, Store, CreditCard,
  Calendar, CheckCircle, AlertCircle, Loader, Plus
} from 'lucide-react';

const AdminAssignSubscriptionPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    storeId: '',
    subscriptionPlan: '',
    customPricing: '',
    startDate: '',
    duration: '12', // months
    notes: ''
  });

  // Options data
  const [stores, setStores] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [customPricingConfigs, setCustomPricingConfigs] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Mock data for now
      const mockStores = [
        { id: 1, name: 'City Pharmacy', code: 'CP001', owner: 'Dr. Rajesh Kumar' },
        { id: 2, name: 'HealthMart Plus', code: 'HM002', owner: 'Mrs. Priya Sharma' },
        { id: 3, name: 'MediCare Center', code: 'MC003', owner: 'Dr. Amit Patel' },
        { id: 4, name: 'Wellness Pharmacy', code: 'WP004', owner: 'Ms. Sneha Gupta' },
        { id: 5, name: 'Quick Meds', code: 'QM005', owner: 'Mr. Ravi Singh' }
      ];

      const mockPlans = [
        { id: 'basic', name: 'Basic Plan', price: 999, features: ['Inventory Management', 'Basic Reports'] },
        { id: 'standard', name: 'Standard Plan', price: 1999, features: ['All Basic Features', 'Advanced Analytics', 'Customer Management'] },
        { id: 'premium', name: 'Premium Plan', price: 2999, features: ['All Standard Features', 'Multi-Store Support', 'Priority Support'] },
        { id: 'enterprise', name: 'Enterprise Plan', price: 4999, features: ['All Premium Features', 'Custom Integrations', 'Dedicated Support'] }
      ];

      const mockCustomPricing = [
        { id: 1, name: 'Enterprise Discount', description: '25% off for 10+ stores' },
        { id: 2, name: 'Bulk Store Pricing', description: '₹5000 off for 5+ stores' },
        { id: 3, name: 'New Customer Offer', description: '15% off first year' }
      ];

      setStores(mockStores);
      setSubscriptionPlans(mockPlans);
      setCustomPricingConfigs(mockCustomPricing);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.storeId || !formData.subscriptionPlan) {
      setError('Please select both store and subscription plan');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // TODO: Implement API call to assign subscription
      console.log('Assigning subscription:', formData);
      
      // Mock success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Subscription assigned successfully!');
      
      // Reset form
      setFormData({
        storeId: '',
        subscriptionPlan: '',
        customPricing: '',
        startDate: '',
        duration: '12',
        notes: ''
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('Error assigning subscription:', error);
      setError('Failed to assign subscription');
    } finally {
      setLoading(false);
    }
  };

  const selectedStore = stores.find(store => store.id.toString() === formData.storeId);
  const selectedPlan = subscriptionPlans.find(plan => plan.id === formData.subscriptionPlan);
  const selectedCustomPricing = customPricingConfigs.find(config => config.id.toString() === formData.customPricing);

  return (
    <AdminLayout 
      title="Assign Custom Subscription" 
      subtitle="Assign subscription plans to stores with custom pricing"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800">{success}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Assignment Form */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Subscription Assignment</h3>
            <p className="text-sm text-gray-600">Select a store and assign a subscription plan with optional custom pricing</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Store Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Store className="w-4 h-4 inline mr-1" />
                  Select Store
                </label>
                <select
                  name="storeId"
                  value={formData.storeId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Choose a store...</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name} ({store.code}) - {store.owner}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subscription Plan Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CreditCard className="w-4 h-4 inline mr-1" />
                  Subscription Plan
                </label>
                <select
                  name="subscriptionPlan"
                  value={formData.subscriptionPlan}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Choose a plan...</option>
                  {subscriptionPlans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - ₹{plan.price}/month
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Pricing (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Pricing (Optional)
                </label>
                <select
                  name="customPricing"
                  value={formData.customPricing}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">No custom pricing</option>
                  {customPricingConfigs.map(config => (
                    <option key={config.id} value={config.id}>
                      {config.name} - {config.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Months)
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="1">1 Month</option>
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                  <option value="12">12 Months</option>
                  <option value="24">24 Months</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Add any additional notes about this subscription assignment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Summary */}
            {selectedStore && selectedPlan && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Assignment Summary</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Store:</strong> {selectedStore.name} ({selectedStore.code})</p>
                  <p><strong>Owner:</strong> {selectedStore.owner}</p>
                  <p><strong>Plan:</strong> {selectedPlan.name}</p>
                  <p><strong>Base Price:</strong> ₹{selectedPlan.price}/month</p>
                  {selectedCustomPricing && (
                    <p><strong>Custom Pricing:</strong> {selectedCustomPricing.name}</p>
                  )}
                  <p><strong>Duration:</strong> {formData.duration} months</p>
                  {formData.startDate && (
                    <p><strong>Start Date:</strong> {new Date(formData.startDate).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !formData.storeId || !formData.subscriptionPlan}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    Assign Subscription
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAssignSubscriptionPage;

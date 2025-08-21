import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import { API_ENDPOINTS, makeAuthenticatedRequest } from '../config/api';
import {
  Package, Search, Eye, Plus, Edit, Trash2,
  ChevronLeft, ChevronRight, Calendar, Users,
  CheckCircle, XCircle, DollarSign, CreditCard
} from 'lucide-react';

const AdminSubscriptionPlansPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  // Mock subscription plans data
  const mockPlans = [
    {
      id: 1,
      name: 'Basic Plan',
      planType: 'paid',
      description: 'Perfect for small pharmacies just getting started',
      basePrice: 999,
      supportLevel: 'basic',
      isActive: true,
      createdDate: '2023-01-01',
      subscriberCount: 2,
      totalRevenue: 21987,
      isPopular: false,
      isRecommended: false,
      promotionalText: '',
      enableTrial: true,
      trialDays: 14,
      sortOrder: 1,
      discounts: { 1: 0, 3: 5, 6: 10, 12: 20 },
      availablePeriods: { 1: true, 3: true, 6: true, 12: true },
      coreFeatures: {
        inventoryManagement: true,
        salesAnalytics: true,
        customerManagement: true,
        supplierManagement: false
      },
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
      limits: {
        maxStores: '1',
        usersPerStore: 2,
        medicinesPerStore: '500',
        customersPerStore: '100',
        suppliersPerStore: '10'
      }
    },
    {
      id: 2,
      name: 'Standard Plan',
      planType: 'paid',
      description: 'Ideal for growing pharmacies with multiple locations',
      basePrice: 1999,
      supportLevel: 'standard',
      isActive: true,
      createdDate: '2023-01-01',
      subscriberCount: 3,
      totalRevenue: 49985,
      isPopular: true,
      isRecommended: false,
      promotionalText: 'Most Popular',
      enableTrial: true,
      trialDays: 14,
      sortOrder: 2,
      discounts: { 1: 0, 3: 5, 6: 10, 12: 20 },
      availablePeriods: { 1: true, 3: true, 6: true, 12: true },
      coreFeatures: {
        inventoryManagement: true,
        salesAnalytics: true,
        customerManagement: true,
        supplierManagement: true
      },
      advancedFeatures: {
        expenseTracking: true,
        staffManagement: true,
        prescriptionManagement: false,
        wasteManagement: false,
        storageManagement: true,
        advancedReports: false,
        multiLocationSupport: true,
        apiAccess: false
      },
      limits: {
        maxStores: '3',
        usersPerStore: 5,
        medicinesPerStore: '2000',
        customersPerStore: '500',
        suppliersPerStore: '25'
      }
    },
    {
      id: 3,
      name: 'Premium Plan',
      planType: 'paid',
      description: 'Advanced features for established pharmacy chains',
      basePrice: 2999,
      supportLevel: 'priority',
      isActive: true,
      createdDate: '2023-01-01',
      subscriberCount: 2,
      totalRevenue: 35988,
      isPopular: false,
      isRecommended: true,
      promotionalText: 'Best Value',
      enableTrial: true,
      trialDays: 14,
      sortOrder: 3,
      discounts: { 1: 0, 3: 5, 6: 10, 12: 20 },
      availablePeriods: { 1: true, 3: true, 6: true, 12: true },
      coreFeatures: {
        inventoryManagement: true,
        salesAnalytics: true,
        customerManagement: true,
        supplierManagement: true
      },
      advancedFeatures: {
        expenseTracking: true,
        staffManagement: true,
        prescriptionManagement: true,
        wasteManagement: true,
        storageManagement: true,
        advancedReports: true,
        multiLocationSupport: true,
        apiAccess: false
      },
      limits: {
        maxStores: '5',
        usersPerStore: 10,
        medicinesPerStore: '5000',
        customersPerStore: '5000',
        suppliersPerStore: '50'
      }
    },
    {
      id: 4,
      name: 'Enterprise Plan',
      planType: 'paid',
      description: 'Complete solution for large pharmacy networks',
      basePrice: 4999,
      supportLevel: 'dedicated',
      isActive: true,
      createdDate: '2023-01-01',
      subscriberCount: 1,
      totalRevenue: 59988,
      isPopular: false,
      isRecommended: false,
      promotionalText: 'Enterprise Solution',
      enableTrial: false,
      trialDays: 0,
      sortOrder: 4,
      discounts: { 1: 0, 3: 5, 6: 10, 12: 20 },
      availablePeriods: { 1: true, 3: true, 6: true, 12: true },
      coreFeatures: {
        inventoryManagement: true,
        salesAnalytics: true,
        customerManagement: true,
        supplierManagement: true
      },
      advancedFeatures: {
        expenseTracking: true,
        staffManagement: true,
        prescriptionManagement: true,
        wasteManagement: true,
        storageManagement: true,
        advancedReports: true,
        multiLocationSupport: true,
        apiAccess: true
      },
      limits: {
        maxStores: 'unlimited',
        usersPerStore: 999,
        medicinesPerStore: 'unlimited',
        customersPerStore: 'unlimited',
        suppliersPerStore: 'unlimited'
      }
    },
    {
      id: 5,
      name: 'Starter Plan',
      planType: 'free',
      description: 'Trial plan for new users to explore features',
      basePrice: 0,
      supportLevel: 'basic',
      isActive: false,
      createdDate: '2023-06-01',
      subscriberCount: 0,
      totalRevenue: 0,
      isPopular: false,
      isRecommended: false,
      promotionalText: 'Free Trial',
      enableTrial: true,
      trialDays: 30,
      sortOrder: 0,
      discounts: { 1: 0, 3: 0, 6: 0, 12: 0 },
      availablePeriods: { 1: true, 3: false, 6: false, 12: false },
      coreFeatures: {
        inventoryManagement: true,
        salesAnalytics: false,
        customerManagement: true,
        supplierManagement: false
      },
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
      limits: {
        maxStores: '1',
        usersPerStore: 1,
        medicinesPerStore: '100',
        customersPerStore: '100',
        suppliersPerStore: '10'
      }
    }
  ];

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await makeAuthenticatedRequest(API_ENDPOINTS.ADMIN_SUBSCRIPTION_PLANS);

      if (data.success) {
        // Transform the API data to match the expected format
        const transformedData = data.data.map(plan => ({
          id: plan._id,
          name: plan.name,
          planType: plan.planType,
          description: plan.description,
          basePrice: plan.pricing.monthly,
          yearlyPrice: plan.pricing.yearly,
          supportLevel: plan.features.prioritySupport ? 'priority' : 'basic',
          isActive: plan.isActive,
          createdDate: plan.createdAt,
          subscriberCount: plan.subscriberCount || 0,
          totalRevenue: 0, // Will be calculated from invoices
          isPopular: plan.isPopular,
          isRecommended: false,
          promotionalText: '',
          enableTrial: plan.trial.enabled,
          trialDays: plan.trial.durationDays,
          sortOrder: plan.sortOrder,
          discounts: { 1: 0, 3: 5, 6: 10, 12: plan.pricing.discountPercentage || 20 },
          availablePeriods: { 1: true, 3: true, 6: true, 12: true },
          coreFeatures: {
            inventoryManagement: true,
            salesAnalytics: plan.features.analytics,
            customerManagement: true,
            supplierManagement: plan.planType !== 'basic'
          },
          advancedFeatures: {
            expenseTracking: plan.features.advancedAnalytics,
            staffManagement: plan.limits.maxUsers > 1,
            multiStore: plan.features.multiStore,
            whatsappIntegration: plan.features.whatsappIntegration,
            billOCR: plan.features.billOCR,
            customReports: plan.features.customReports,
            apiAccess: plan.features.apiAccess,
            prioritySupport: plan.features.prioritySupport,
            backupRestore: plan.features.backupRestore,
            customBranding: plan.features.customBranding
          },
          limits: {
            maxUsers: plan.limits.maxUsers.toString(),
            maxProducts: plan.limits.maxProducts.toString(),
            maxStores: plan.limits.maxStores.toString(),
            storageLimit: `${plan.limits.storageLimit}GB`,
            transactionsPerMonth: plan.limits.maxTransactionsPerMonth === -1 ? 'Unlimited' : plan.limits.maxTransactionsPerMonth.toString(),
            suppliersPerStore: '10'
          }
        }));

        setPlans(transformedData);
      } else {
        console.error('Failed to fetch plans:', data.message);
        // Fallback to mock data if API fails
        setPlans(mockPlans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      // Fallback to mock data if API fails
      setPlans(mockPlans);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    totalPlans: plans.length,
    activePlans: plans.filter(plan => plan.isActive).length,
    totalSubscriptions: plans.reduce((sum, plan) => sum + plan.subscriberCount, 0),
    totalUsers: plans.reduce((sum, plan) => sum + plan.subscriberCount, 0)
  };

  // Filter plans
  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && plan.isActive) ||
                         (statusFilter === 'inactive' && !plan.isActive);
    
    const matchesPrice = priceFilter === 'all' || 
                        (priceFilter === 'free' && plan.monthlyPrice === 0) ||
                        (priceFilter === 'paid' && plan.monthlyPrice > 0);
    
    return matchesSearch && matchesStatus && matchesPrice;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPlans = filteredPlans.slice(startIndex, startIndex + itemsPerPage);

  const handleDeletePlan = async (planId) => {
    if (window.confirm('Are you sure you want to delete this subscription plan? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('adminToken');

        if (!token) {
          navigate('/admin/login');
          return;
        }

        const response = await fetch(`/api/subscriptions/plans/admin/${planId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (data.success) {
          alert('Subscription plan deleted successfully!');
          // Refresh the plans list
          fetchPlans();
        } else {
          alert(`Failed to delete plan: ${data.message}`);
        }
      } catch (error) {
        console.error('Error deleting plan:', error);
        alert('Error deleting subscription plan. Please try again.');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (isActive) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? (
          <>
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </>
        ) : (
          <>
            <XCircle className="w-3 h-3 mr-1" />
            Inactive
          </>
        )}
      </span>
    );
  };

  const getPlanBadge = (planName) => {
    const planColors = {
      'basic plan': 'bg-gray-100 text-gray-800',
      'standard plan': 'bg-blue-100 text-blue-800',
      'premium plan': 'bg-purple-100 text-purple-800',
      'enterprise plan': 'bg-yellow-100 text-yellow-800',
      'starter plan': 'bg-green-100 text-green-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${planColors[planName.toLowerCase()] || planColors['basic plan']}`}>
        {planName}
      </span>
    );
  };

  const getPromotionalBadge = (plan) => {
    if (plan.isPopular) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 ml-2">
          Popular
        </span>
      );
    }
    if (plan.isRecommended) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2">
          Recommended
        </span>
      );
    }
    if (plan.promotionalText) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2">
          {plan.promotionalText}
        </span>
      );
    }
    return null;
  };

  const getSupportLevelBadge = (level) => {
    const levelColors = {
      'basic': 'bg-gray-100 text-gray-800',
      'standard': 'bg-blue-100 text-blue-800',
      'priority': 'bg-purple-100 text-purple-800',
      'premium': 'bg-yellow-100 text-yellow-800',
      'dedicated': 'bg-green-100 text-green-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${levelColors[level] || levelColors['basic']}`}>
        {level.charAt(0).toUpperCase() + level.slice(1)} Support
      </span>
    );
  };

  const getFeaturesList = (coreFeatures, advancedFeatures) => {
    const enabledCore = Object.entries(coreFeatures)
      .filter(([_, enabled]) => enabled)
      .map(([key, _]) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));

    const enabledAdvanced = Object.entries(advancedFeatures)
      .filter(([_, enabled]) => enabled)
      .map(([key, _]) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));

    return [...enabledCore, ...enabledAdvanced];
  };

  if (loading) {
    return (
      <AdminLayout title="Subscription Plans" subtitle="Manage subscription plans and pricing">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Subscription Plans" subtitle="Manage subscription plans and pricing">
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Total Plans</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPlans}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Active Plans</p>
                <p className="text-2xl font-bold text-green-600">{stats.activePlans}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Total Subscriptions</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalSubscriptions}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-primary-600">{stats.totalUsers}</p>
              </div>
              <div className="p-3 bg-primary-100 rounded-full">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search plans, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Price Filter */}
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Plans</option>
                <option value="free">Free Plans</option>
                <option value="paid">Paid Plans</option>
              </select>
            </div>

            {/* Create Plan Button */}
            <div className="flex-shrink-0">
              <button
                onClick={() => navigate('/admin/subscription-plans/create')}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Plan
              </button>
            </div>
          </div>
        </div>

        {/* Plans Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pricing & Support
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Features & Trial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Limits & Quotas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-left">
                        <div className="flex items-center space-x-2 mb-1">
                          {getPlanBadge(plan.name)}
                          {getStatusBadge(plan.isActive)}
                          {getPromotionalBadge(plan)}
                        </div>
                        <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                        <div className="text-sm text-gray-500 max-w-xs">{plan.description}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          <Calendar className="inline w-3 h-3 mr-1" />
                          Created: {formatDate(plan.createdDate)} | Sort: {plan.sortOrder}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">
                          {plan.basePrice === 0 ? 'Free' : formatCurrency(plan.basePrice) + '/month'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Discounts: 3M({plan.discounts[3]}%), 6M({plan.discounts[6]}%), 12M({plan.discounts[12]}%)
                        </div>
                        <div className="mt-2">
                          {getSupportLevelBadge(plan.supportLevel)}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Revenue: {formatCurrency(plan.totalRevenue)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-left max-w-xs">
                        <div className="text-sm text-gray-900 font-medium mb-1">Features:</div>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {getFeaturesList(plan.coreFeatures, plan.advancedFeatures).slice(0, 3).map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <CheckCircle className="w-3 h-3 text-green-500 mr-1 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                          {getFeaturesList(plan.coreFeatures, plan.advancedFeatures).length > 3 && (
                            <li className="text-gray-500">
                              +{getFeaturesList(plan.coreFeatures, plan.advancedFeatures).length - 3} more features
                            </li>
                          )}
                        </ul>
                        {plan.enableTrial && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {plan.trialDays} Day Trial
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-left max-w-xs">
                        <div className="text-sm text-gray-900 font-medium mb-1">Usage Limits:</div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>Stores: {plan.limits.maxStores}</div>
                          <div>Medicines: {plan.limits.medicinesPerStore}</div>
                          <div>Users/Store: {plan.limits.usersPerStore}</div>
                          <div>Customers: {plan.limits.customersPerStore}</div>
                          <div>Suppliers: {plan.limits.suppliersPerStore}</div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Billing Periods: {Object.entries(plan.availablePeriods)
                            .filter(([_, available]) => available)
                            .map(([months, _]) => `${months}M`)
                            .join(', ')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {plan.subscriberCount}
                      </div>
                      <div className="text-xs text-gray-500">
                        {plan.subscriberCount === 1 ? 'subscriber' : 'subscribers'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Revenue: {formatCurrency(plan.totalRevenue)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/admin/subscription-plans/${plan.id}`)}
                          className="text-primary-600 hover:text-primary-900 p-1 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/subscription-plans/${plan.id}/edit`)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Edit Plan"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Delete Plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredPlans.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No plans found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || priceFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No subscription plans available at the moment.'
                }
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 text-left">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(startIndex + itemsPerPage, filteredPlans.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredPlans.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSubscriptionPlansPage;

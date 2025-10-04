import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  BarChart3,
  Receipt,
  History,
  Star,
  Filter,
  X,
  Trash2,
  RefreshCw
} from 'lucide-react';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';
import { createNumericInputHandler, createPhoneInputHandler, VALIDATION_OPTIONS } from '../utils/inputValidation';

const StoreManagerCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'analytics', 'credit', 'add'
  const [customerType, setCustomerType] = useState(''); // '', 'vip', 'regular', 'credit'
  const [creditStatus, setCreditStatus] = useState(''); // '', 'good', 'overdue', 'defaulter'
  const [exportingData, setExportingData] = useState(false);

  // Add Customer Form State
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    customerType: '',
    address: '',
    allowCredit: false
  });
  const [addingCustomer, setAddingCustomer] = useState(false);

  // Edit Customer State
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updatingCustomer, setUpdatingCustomer] = useState(false);
  
  // Analytics state
  const [customerAnalytics, setCustomerAnalytics] = useState(null);
  const [creditManagement, setCreditManagement] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [creditTransactions, setCreditTransactions] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [creditLoading, setCreditLoading] = useState(false);

  // Credit Management Modal States
  const [showCreditPaymentModal, setShowCreditPaymentModal] = useState(false);
  const [showCreditAdjustmentModal, setShowCreditAdjustmentModal] = useState(false);
  const [showCreditHistoryModal, setShowCreditHistoryModal] = useState(false);
  const [selectedCreditCustomer, setSelectedCreditCustomer] = useState(null);
  const [creditHistory, setCreditHistory] = useState([]);
  const [creditHistoryLoading, setCreditHistoryLoading] = useState(false);

  // Credit Payment Form State
  const [creditPaymentForm, setCreditPaymentForm] = useState({
    amount: '',
    paymentMethod: 'cash',
    transactionId: '',
    notes: ''
  });
  const [processingPayment, setProcessingPayment] = useState(false);

  // Metrics recalculation state
  const [recalculatingMetrics, setRecalculatingMetrics] = useState(false);

  // Credit Adjustment Form State
  const [creditAdjustmentForm, setCreditAdjustmentForm] = useState({
    amount: '',
    adjustmentType: 'add',
    reason: 'manual_adjustment',
    notes: ''
  });
  const [processingAdjustment, setProcessingAdjustment] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchCustomerAnalytics(); // Fetch analytics data for main cards
  }, [currentPage, searchTerm]);

  // Fetch customer analytics
  const fetchCustomerAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const token = localStorage.getItem('token');

      console.log('🔍 Fetching customer analytics...');
      const response = await fetch('/api/store-manager/customers/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Analytics response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Analytics response error:', errorText);
        throw new Error('Failed to fetch customer analytics');
      }

      const data = await response.json();
      console.log('✅ Customer analytics data:', data);
      setCustomerAnalytics(data.data);
    } catch (error) {
      console.error('Customer analytics fetch error:', error);
      setError('Failed to load customer analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Fetch credit management data
  const fetchCreditManagement = async () => {
    try {
      setCreditLoading(true);
      const token = localStorage.getItem('token');

      console.log('💳 Fetching credit management data...');
      const response = await fetch('/api/store-manager/customers/credit-management', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('💰 Credit response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Credit response error:', errorText);
        throw new Error('Failed to fetch credit management data');
      }

      const data = await response.json();
      console.log('✅ Credit management data:', data);
      setCreditManagement(data.data);
    } catch (error) {
      console.error('Credit management fetch error:', error);
      setError('Failed to load credit management data');
    } finally {
      setCreditLoading(false);
    }
  };

  // Fetch analytics when analytics tab is active (refresh data)
  useEffect(() => {
    if (activeTab === 'analytics' && !analyticsLoading) {
      console.log('🔄 Analytics tab active, refreshing customer analytics data...');
      fetchCustomerAnalytics();
    }
  }, [activeTab]);

  // Fetch credit data when credit tab is active
  useEffect(() => {
    if (activeTab === 'credit') {
      console.log('🔄 Credit tab active, fetching credit management data...');
      fetchCreditManagement();
    }
  }, [activeTab]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/store-manager/customers?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      setCustomers(data.data);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      console.error('Customers fetch error:', error);
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const viewCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
  };



  const viewCustomerPurchaseHistory = (customer) => {
    // Navigate to dedicated purchase history page
    window.location.href = `/store-panel/customers/${customer._id}/history`;
  };

  const editCustomer = (customer) => {
    setEditingCustomer({
      id: customer._id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      customerType: customer.customerType || 'regular',
      address: customer.address?.street || '',
      creditLimit: customer.creditLimit || 0,
      allowCredit: customer.creditLimit > 0
    });
    setShowEditModal(true);
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!editingCustomer.name.trim()) {
      alert('Please enter customer name');
      return;
    }
    if (!editingCustomer.phone.trim()) {
      alert('Please enter phone number');
      return;
    }
    if (!/^\d{10}$/.test(editingCustomer.phone.trim())) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setUpdatingCustomer(true);
      const token = localStorage.getItem('token');

      const requestData = {
        name: editingCustomer.name.trim(),
        phone: editingCustomer.phone.trim(),
        email: editingCustomer.email.trim() || undefined,
        customerType: editingCustomer.customerType || 'regular',
        address: editingCustomer.address.trim() || undefined,
        creditLimit: editingCustomer.allowCredit ? (editingCustomer.creditLimit || 5000) : 0
      };

      console.log('Updating customer data:', requestData);

      const response = await fetch(`/api/store-manager/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Customer updated successfully:', data);

        // Reset form
        setEditingCustomer(null);
        setShowEditModal(false);

        // Refresh customers list
        fetchCustomers();

        alert('Customer updated successfully!');
      } else {
        const errorData = await response.json();
        console.error('Customer update error:', errorData);

        let errorMessage = 'Failed to update customer';
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.join(', ');
        }

        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Failed to update customer');
    } finally {
      setUpdatingCustomer(false);
    }
  };

  const deleteCustomer = async (customer) => {
    if (!window.confirm(`Are you sure you want to delete customer "${customer.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/store-manager/customers/${customer._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Customer deleted successfully!');
        fetchCustomers(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to delete customer');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Failed to delete customer');
    }
  };

  // Export functionality
  const exportCustomersToCSV = async () => {
    try {
      setExportingData(true);
      const token = localStorage.getItem('token');

      // Fetch all customers for export (without pagination)
      const response = await fetch('/api/store-manager/customers?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customers for export');
      }

      const data = await response.json();
      const customersToExport = data.data || [];

      if (customersToExport.length === 0) {
        alert('No customers found to export');
        return;
      }

      // Prepare CSV data
      const csvHeaders = [
        'Customer ID',
        'Name',
        'Phone',
        'Email',
        'Customer Type',
        'Status',
        'Total Purchases',
        'Total Spent (₹)',
        'Credit Limit (₹)',
        'Credit Balance (₹)',
        'Credit Status',
        'Last Purchase Date',
        'Registration Date',
        'Address'
      ];

      const csvRows = customersToExport.map(customer => [
        customer._id.slice(-8), // Last 8 characters of ID
        customer.name || '',
        customer.phone || '',
        customer.email || '',
        customer.customerType || 'regular',
        customer.status || 'active',
        customer.totalPurchases || 0,
        customer.totalSpent || 0,
        customer.creditLimit || 0,
        customer.creditBalance || 0,
        customer.creditStatus || 'good',
        customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toLocaleDateString() : '',
        customer.registrationDate ? new Date(customer.registrationDate).toLocaleDateString() : '',
        customer.address?.street || ''
      ]);

      // Create CSV content
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(`Successfully exported ${customersToExport.length} customers to CSV!`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export customers. Please try again.');
    } finally {
      setExportingData(false);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!newCustomer.name.trim()) {
      alert('Please enter customer name');
      return;
    }
    if (!newCustomer.phone.trim()) {
      alert('Please enter phone number');
      return;
    }
    if (!/^\d{10}$/.test(newCustomer.phone.trim())) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setAddingCustomer(true);
      const token = localStorage.getItem('token');

      const requestData = {
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.trim(),
        email: newCustomer.email.trim() || undefined,
        customerType: newCustomer.customerType || 'regular',
        address: newCustomer.address.trim() || undefined,
        creditLimit: newCustomer.allowCredit ? 5000 : 0 // Default credit limit
      };

      console.log('Sending customer data:', requestData);

      const response = await fetch('/api/store-manager/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const data = await response.json();
        alert('Customer added successfully!');

        // Reset form
        setNewCustomer({
          name: '',
          phone: '',
          email: '',
          customerType: '',
          address: '',
          allowCredit: false
        });

        // Refresh customer list and switch to list tab
        fetchCustomers();
        setActiveTab('list');
      } else {
        const errorData = await response.json();
        console.error('Customer creation error:', errorData);

        let errorMessage = 'Failed to add customer';
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.join(', ');
        }

        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Failed to add customer');
    } finally {
      setAddingCustomer(false);
    }
  };

  // Credit Management Functions
  const openCreditPaymentModal = (customer) => {
    setSelectedCreditCustomer(customer);
    setCreditPaymentForm({
      amount: '',
      paymentMethod: 'cash',
      transactionId: '',
      notes: ''
    });
    setShowCreditPaymentModal(true);
  };

  const openCreditAdjustmentModal = (customer) => {
    setSelectedCreditCustomer(customer);
    setCreditAdjustmentForm({
      amount: '',
      adjustmentType: 'add',
      reason: 'manual_adjustment',
      notes: ''
    });
    setShowCreditAdjustmentModal(true);
  };

  const openCreditHistoryModal = async (customer) => {
    setSelectedCreditCustomer(customer);
    setShowCreditHistoryModal(true);
    await fetchCreditHistory(customer.id);
  };

  const fetchCreditHistory = async (customerId) => {
    try {
      setCreditHistoryLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/store-manager/credit/customers/${customerId}/credit-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCreditHistory(data.data.transactions || []);
      } else {
        console.error('Failed to fetch credit history');
        setCreditHistory([]);
      }
    } catch (error) {
      console.error('Error fetching credit history:', error);
      setCreditHistory([]);
    } finally {
      setCreditHistoryLoading(false);
    }
  };

  const handleCreditPayment = async (e) => {
    e.preventDefault();

    if (!creditPaymentForm.amount || parseFloat(creditPaymentForm.amount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    try {
      setProcessingPayment(true);
      const token = localStorage.getItem('token');

      const requestBody = {
        amount: parseFloat(creditPaymentForm.amount),
        paymentMethod: creditPaymentForm.paymentMethod,
        transactionId: creditPaymentForm.transactionId.trim() || undefined,
        notes: creditPaymentForm.notes.trim() || undefined
      };

      const response = await fetch(`/api/store-manager/credit/customers/${selectedCreditCustomer.id}/credit-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const responseData = await response.json();
        alert('Credit payment recorded successfully!');
        setShowCreditPaymentModal(false);
        fetchCreditManagement(); // Refresh credit data
      } else {
        const errorData = await response.json();
        console.error('Credit payment error:', errorData);
        alert(errorData.message || 'Failed to record credit payment');
      }
    } catch (error) {
      console.error('Error recording credit payment:', error);
      alert('Failed to record credit payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCreditAdjustment = async (e) => {
    e.preventDefault();

    if (!creditAdjustmentForm.amount || parseFloat(creditAdjustmentForm.amount) <= 0) {
      alert('Please enter a valid adjustment amount');
      return;
    }

    try {
      setProcessingAdjustment(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/store-manager/credit/customers/${selectedCreditCustomer.id}/credit-adjustment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(creditAdjustmentForm.amount),
          adjustmentType: creditAdjustmentForm.adjustmentType,
          reason: creditAdjustmentForm.reason,
          notes: creditAdjustmentForm.notes.trim() || undefined
        })
      });

      if (response.ok) {
        alert(`Credit ${creditAdjustmentForm.adjustmentType} processed successfully!`);
        setShowCreditAdjustmentModal(false);
        fetchCreditManagement(); // Refresh credit data
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to process credit adjustment');
      }
    } catch (error) {
      console.error('Error processing credit adjustment:', error);
      alert('Failed to process credit adjustment');
    } finally {
      setProcessingAdjustment(false);
    }
  };

  // Handle recalculate all customer metrics
  const handleRecalculateAllMetrics = async () => {
    if (!window.confirm('This will recalculate metrics for all customers based on actual sales data. This may take a few minutes. Continue?')) {
      return;
    }

    setRecalculatingMetrics(true);

    try {
      const response = await fetch('/api/store-manager/customers/recalculate-all-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Metrics recalculated for ${data.data.updatedCount} customers`);

        // Refresh customer data
        fetchCustomers();

        if (activeTab === 'analytics') {
          fetchCustomerAnalytics();
        }

        if (activeTab === 'credit') {
          fetchCreditManagement();
        }
      } else {
        alert(data.message || 'Failed to recalculate metrics');
      }
    } catch (error) {
      console.error('Recalculate metrics error:', error);
      alert('Failed to recalculate customer metrics');
    } finally {
      setRecalculatingMetrics(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading && customers.length === 0) {
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
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="sm:flex sm:items-center sm:justify-between mb-6">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900 text-left">Customer Management</h1>
              <p className="mt-2 text-sm text-gray-700 text-left">
                Manage customers, track purchase history, credit payments, and customer analytics.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <div className="flex space-x-3">
                <button
                  onClick={() => setActiveTab('add')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </button>
                <button
                  onClick={exportCustomersToCSV}
                  disabled={exportingData}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exportingData ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {exportingData ? 'Exporting...' : 'Export'}
                </button>
                <button
                  onClick={handleRecalculateAllMetrics}
                  disabled={recalculatingMetrics}
                  className="inline-flex items-center px-4 py-2 border border-orange-300 rounded-md shadow-sm text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Recalculate customer metrics from actual sales data"
                >
                  {recalculatingMetrics ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {recalculatingMetrics ? 'Fixing...' : 'Fix Metrics'}
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('list')}
                className={`${
                  activeTab === 'list'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Customer List
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`${
                  activeTab === 'analytics'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Customer Analytics
              </button>
              <button
                onClick={() => setActiveTab('credit')}
                className={`${
                  activeTab === 'credit'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Credit Management
              </button>
              <button
                onClick={() => setActiveTab('add')}
                className={`${
                  activeTab === 'add'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Add Customer
              </button>
            </nav>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customerAnalytics?.summary?.totalCustomers || customers.length || 0}
                  </p>
                  <p className="text-xs text-green-600">
                    +{customerAnalytics?.summary?.newCustomersThisMonth || 0} this month
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">VIP Customers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customerAnalytics?.segments?.VIP?.count || 0}
                  </p>
                  <p className="text-xs text-purple-600">High value</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full">
                  <Star className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Credit Outstanding</p>
                  <p className="text-2xl font-bold text-red-600">
                    ₹{creditManagement?.summary?.totalOutstanding?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-red-600">
                    {creditManagement?.summary?.totalCreditCustomers || 0} customers
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Customers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customerAnalytics?.summary?.activeCustomers || 0}
                  </p>
                  <p className="text-xs text-green-600">Last 6 months</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'list' && (
            <>
              {/* Quick Actions */}
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span>View Analytics</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('credit')}
                    className="bg-red-600 text-white p-4 rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>Credit Management</span>
                  </button>
                  <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2">
                    <History className="h-5 w-5" />
                    <span>Purchase History</span>
                  </button>
                  <button
                    onClick={exportCustomersToCSV}
                    disabled={exportingData}
                    className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {exportingData ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Download className="h-5 w-5" />
                    )}
                    <span>{exportingData ? 'Exporting...' : 'Export Report'}</span>
                  </button>
                </div>
              </div>

          {/* Search and Filters */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Clear Search */}
              <div>
                <button
                  onClick={() => setSearchTerm('')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Clear Search
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          {/* Customers Grid */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              {customers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {customers.map((customer) => (
                    <div key={customer._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Users className="h-6 w-6 text-green-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-lg font-medium text-gray-900 text-left">{customer.name}</h3>
                            <p className="text-sm text-gray-500 text-left">Customer ID: {customer._id.slice(-6)}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewCustomerDetails(customer)}
                            className="text-green-600 hover:text-green-700"
                            title="View Details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => editCustomer(customer)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Edit Customer"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => viewCustomerPurchaseHistory(customer)}
                            className="text-purple-600 hover:text-purple-700"
                            title="Purchase History & Regular Medicines"
                          >
                            <History className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => deleteCustomer(customer)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete Customer"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>{customer.phone}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-4 w-4 mr-2" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                        {customer.address && (customer.address.street || customer.address.city || customer.address.state) && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>
                              {[
                                customer.address.street,
                                customer.address.city,
                                customer.address.state,
                                customer.address.pincode
                              ].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Joined: {new Date(customer.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <p className="text-lg font-semibold text-gray-900">{customer.totalPurchases || 0}</p>
                            <p className="text-xs text-gray-500">Total Purchases</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-gray-900">₹{customer.totalSpent || 0}</p>
                            <p className="text-xs text-gray-500">Total Spent</p>
                          </div>
                        </div>
                      </div>

                      {/* Credit Information */}
                      <div className="mt-3 p-2 rounded-md">
                        {customer.creditLimit && customer.creditLimit > 0 ? (
                          // Customer has credit allowed
                          <div className={`flex items-center text-sm ${
                            customer.creditBalance > 0 ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'
                          }`}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            <span>Credit Balance: ₹{customer.creditBalance || 0} / ₹{customer.creditLimit}</span>
                          </div>
                        ) : (
                          // Customer does not have credit allowed
                          <div className="flex items-center text-sm bg-gray-50 text-gray-600">
                            <CreditCard className="h-4 w-4 mr-2" />
                            <span>Credit: Not Allowed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? 'Try adjusting your search terms.' : 'Customers will appear here once you make sales.'}
                  </p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Page <span className="font-medium">{currentPage}</span> of{' '}
                        <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
            </>
          )}

          {/* Customer Analytics Tab */}
          {activeTab === 'analytics' && (
            <div>
              {analyticsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <span className="ml-2 text-gray-600">Loading analytics...</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Top Customer</p>
                          <p className="text-lg font-bold text-gray-900">
                            {customerAnalytics?.topCustomer?.name || 'No data'}
                          </p>
                          <p className="text-xs text-green-600">
                            ₹{customerAnalytics?.topCustomer?.totalSpent?.toLocaleString() || '0'} spent
                          </p>
                        </div>
                        <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full">
                          <Star className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Monthly Growth</p>
                          <p className={`text-2xl font-bold ${
                            (customerAnalytics?.summary?.monthlyGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(customerAnalytics?.summary?.monthlyGrowth || 0) >= 0 ? '+' : ''}
                            {customerAnalytics?.summary?.monthlyGrowth || 0}%
                          </p>
                          <p className="text-xs text-green-600">New customers</p>
                        </div>
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full">
                          <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Retention Rate</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {customerAnalytics?.summary?.retentionRate || 0}%
                          </p>
                          <p className="text-xs text-blue-600">Last 6 months</p>
                        </div>
                        <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">Customer Segments</h3>
                  <div className="space-y-4">
                    {customerAnalytics?.segments && Object.entries(customerAnalytics.segments).map(([segment, data]) => {
                      const colorMap = {
                        VIP: { bg: 'bg-green-50', dot: 'bg-green-500', text: 'text-green-600' },
                        Regular: { bg: 'bg-blue-50', dot: 'bg-blue-500', text: 'text-blue-600' },
                        Occasional: { bg: 'bg-yellow-50', dot: 'bg-yellow-500', text: 'text-yellow-600' },
                        Blocked: { bg: 'bg-red-50', dot: 'bg-red-500', text: 'text-red-600' }
                      };
                      const colors = colorMap[segment] || colorMap.Blocked;

                      return (
                        <div key={segment} className={`flex items-center justify-between p-3 ${colors.bg} rounded-lg`}>
                          <div className="flex items-center">
                            <div className={`w-3 h-3 ${colors.dot} rounded-full mr-3`}></div>
                            <span className="font-medium text-gray-900">{segment} Customers</span>
                          </div>
                          <span className={`${colors.text} font-semibold`}>{data.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">Top Customers by Value</h3>
                  <div className="space-y-3">
                    {customerAnalytics?.topCustomers && customerAnalytics.topCustomers.length > 0 ? (
                      customerAnalytics.topCustomers.map((customer, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-sm font-medium text-green-600">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-left">{customer.name}</p>
                              <p className="text-sm text-gray-500 text-left">{customer.purchases} purchases</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">₹{customer.amount.toLocaleString()}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No customer data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Credit Management Tab */}
          {activeTab === 'credit' && (
            <div>
              {creditLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <span className="ml-2 text-gray-600">Loading credit data...</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
                          <p className="text-2xl font-bold text-red-600">
                            ₹{creditManagement?.summary?.totalOutstanding?.toLocaleString() || '0'}
                          </p>
                          <p className="text-xs text-red-600">
                            {creditManagement?.summary?.totalCreditCustomers || 0} customers
                          </p>
                        </div>
                        <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full">
                          <CreditCard className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Overdue</p>
                          <p className="text-2xl font-bold text-orange-600">
                            ₹{creditManagement?.summary?.totalOverdueAmount?.toLocaleString() || '0'}
                          </p>
                          <p className="text-xs text-orange-600">
                            {creditManagement?.summary?.overdueCustomerCount || 0} customers
                          </p>
                        </div>
                        <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full">
                          <AlertTriangle className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Current Month</p>
                          <p className="text-2xl font-bold text-blue-600">
                            ₹{creditManagement?.summary?.currentMonthCredit?.toLocaleString() || '0'}
                          </p>
                          <p className="text-xs text-blue-600">Credit sales</p>
                        </div>
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Collected Today</p>
                          <p className="text-2xl font-bold text-green-600">
                            ₹{creditManagement?.summary?.todayCollected?.toLocaleString() || '0'}
                          </p>
                          <p className="text-xs text-green-600">
                            {creditManagement?.summary?.todayPaymentCount || 0} payments
                          </p>
                        </div>
                        <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full">
                          <CheckCircle className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Credit Customers</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Outstanding Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Credit Limit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Days Overdue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {creditManagement?.creditCustomers && creditManagement.creditCustomers.length > 0 ? (
                        creditManagement.creditCustomers.map((record, index) => (
                          <tr key={record.id || index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8">
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                                    <span className="text-xs font-medium text-white">
                                      {record.name.charAt(0)}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900 text-left">{record.name}</div>
                                  {record.phone && (
                                    <div className="text-sm text-gray-500 text-left">{record.phone}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              ₹{record.outstandingAmount?.toLocaleString() || '0'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₹{record.creditLimit?.toLocaleString() || '0'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {record.dueDate ? new Date(record.dueDate).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {record.daysOverdue > 0 ? `${record.daysOverdue} days` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                record.status === 'overdue'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {record.status === 'overdue' ? 'Overdue' : 'Current'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => openCreditHistoryModal(record)}
                                  className="text-green-600 hover:text-green-900"
                                  title="View Credit History"
                                >
                                  <History className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => openCreditPaymentModal(record)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Record Payment"
                                >
                                  <DollarSign className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => openCreditAdjustmentModal(record)}
                                  className="text-purple-600 hover:text-purple-900"
                                  title="Adjust Credit"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => window.open(`tel:${record.phone}`, '_self')}
                                  className="text-gray-600 hover:text-gray-900"
                                  title="Call Customer"
                                >
                                  <Phone className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                            No credit customers found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Add Customer Tab */}
          {activeTab === 'add' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Add New Customer</h3>
              <form onSubmit={handleAddCustomer} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                    <input
                      type="text"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter customer name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                    <input
                      type="tel"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="9876543210"
                      maxLength="10"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="customer@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Customer Type</label>
                    <select
                      value={newCustomer.customerType}
                      onChange={(e) => setNewCustomer({ ...newCustomer, customerType: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select Customer Type</option>
                      <option value="regular">Regular Customer</option>
                      <option value="vip">VIP Customer</option>
                      <option value="premium">Premium Customer</option>
                      <option value="wholesale">Wholesale Customer</option>
                      <option value="retail">Retail Customer</option>
                      <option value="corporate">Corporate Customer</option>
                      <option value="hospital">Hospital/Clinic</option>
                      <option value="pharmacy">Other Pharmacy</option>
                      <option value="doctor">Doctor/Medical Professional</option>
                      <option value="insurance">Insurance Customer</option>
                      <option value="government">Government/PSU</option>
                      <option value="ngo">NGO/Charitable Organization</option>
                      <option value="senior">Senior Citizen</option>
                      <option value="student">Student</option>
                      <option value="employee">Employee Discount</option>
                      <option value="loyalty">Loyalty Program Member</option>
                      <option value="credit">Credit Customer</option>
                      <option value="cash">Cash Only Customer</option>
                      <option value="online">Online Customer</option>
                      <option value="walk_in">Walk-in Customer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    rows={3}
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter complete address"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newCustomer.allowCredit}
                    onChange={(e) => setNewCustomer({ ...newCustomer, allowCredit: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Allow credit purchases</label>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setNewCustomer({
                        name: '',
                        phone: '',
                        email: '',
                        customerType: '',
                        address: '',
                        allowCredit: false
                      });
                      setActiveTab('list');
                    }}
                    disabled={addingCustomer}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingCustomer}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center"
                  >
                    {addingCustomer && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    )}
                    {addingCustomer ? 'Adding...' : 'Add Customer'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Customer Details Modal */}
      {showCustomerModal && selectedCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 text-left">Customer Details</h3>
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left">Name</label>
                    <p className="mt-1 text-sm text-gray-900 text-left">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left">Phone</label>
                    <p className="mt-1 text-sm text-gray-900 text-left">{selectedCustomer.phone}</p>
                  </div>
                  {selectedCustomer.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 text-left">Email</label>
                      <p className="mt-1 text-sm text-gray-900 text-left">{selectedCustomer.email}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left">Customer Since</label>
                    <p className="mt-1 text-sm text-gray-900 text-left">
                      {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {selectedCustomer.address && (selectedCustomer.address.street || selectedCustomer.address.city || selectedCustomer.address.state || selectedCustomer.address.pincode) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left">Address</label>
                    <p className="mt-1 text-sm text-gray-900 text-left">
                      {[
                        selectedCustomer.address.street,
                        selectedCustomer.address.city,
                        selectedCustomer.address.state,
                        selectedCustomer.address.pincode
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{selectedCustomer.totalPurchases || 0}</p>
                    <p className="text-sm text-gray-500">Total Purchases</p>
                    <p className="text-xs text-gray-400">All transactions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">₹{selectedCustomer.totalSpent || 0}</p>
                    <p className="text-sm text-gray-500">Total Spent</p>
                    <p className="text-xs text-gray-400">Cash + Credit combined</p>
                  </div>
                  <div className="text-center">
                    {selectedCustomer.creditLimit && selectedCustomer.creditLimit > 0 ? (
                      <>
                        <p className="text-2xl font-bold text-gray-900">₹{selectedCustomer.creditBalance || 0}</p>
                        <p className="text-sm text-gray-500">Credit Balance</p>
                        <p className="text-xs text-gray-400">Outstanding amount</p>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-gray-400">N/A</p>
                        <p className="text-sm text-gray-500">Credit Balance</p>
                        <p className="text-xs text-gray-400">Credit Not Allowed</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Metrics explanation */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700">
                    <strong>Note:</strong> Total Purchases and Total Spent include all transactions (cash + credit).
                    Credit Balance shows only outstanding credit amount. If metrics seem incorrect, use the "Fix Metrics" button above.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && editingCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 text-left">Edit Customer</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCustomer(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateCustomer} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left">Name *</label>
                    <input
                      type="text"
                      required
                      value={editingCustomer.name}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter customer name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={editingCustomer.phone}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter 10-digit phone number"
                      maxLength="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left">Email</label>
                    <input
                      type="email"
                      value={editingCustomer.email}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left">Customer Type</label>
                    <select
                      value={editingCustomer.customerType}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, customerType: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="regular">Regular</option>
                      <option value="vip">VIP</option>
                      <option value="premium">Premium</option>
                      <option value="wholesale">Wholesale</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 text-left">Address</label>
                  <textarea
                    rows={3}
                    value={editingCustomer.address}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter complete address"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="editAllowCredit"
                      checked={editingCustomer.allowCredit}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, allowCredit: e.target.checked })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="editAllowCredit" className="ml-2 block text-sm text-gray-900">
                      Allow Credit Purchases
                    </label>
                  </div>

                  {editingCustomer.allowCredit && (
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 text-left">Credit Limit (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={editingCustomer.creditLimit}
                        onChange={createNumericInputHandler(
                          (value) => setEditingCustomer({ ...editingCustomer, creditLimit: value }),
                          null,
                          VALIDATION_OPTIONS.POSITIVE_NUMBER
                        )}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter credit limit"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingCustomer(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingCustomer}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center"
                  >
                    {updatingCustomer && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    )}
                    {updatingCustomer ? 'Updating...' : 'Update Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Credit Payment Modal */}
      {showCreditPaymentModal && selectedCreditCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-left mb-4">
                Record Credit Payment
              </h3>
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600 text-left">Customer: {selectedCreditCustomer.name}</p>
                <p className="text-sm text-gray-600 text-left">Outstanding: ₹{selectedCreditCustomer.outstandingAmount?.toLocaleString()}</p>
              </div>

              <form onSubmit={handleCreditPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                    Payment Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedCreditCustomer.outstandingAmount}
                    value={creditPaymentForm.amount}
                    onChange={(e) => setCreditPaymentForm({...creditPaymentForm, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={creditPaymentForm.paymentMethod}
                    onChange={(e) => setCreditPaymentForm({...creditPaymentForm, paymentMethod: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                    Transaction ID
                  </label>
                  <input
                    type="text"
                    value={creditPaymentForm.transactionId}
                    onChange={(e) => setCreditPaymentForm({...creditPaymentForm, transactionId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Optional reference number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                    Notes
                  </label>
                  <textarea
                    value={creditPaymentForm.notes}
                    onChange={(e) => setCreditPaymentForm({...creditPaymentForm, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows="3"
                    placeholder="Optional notes"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreditPaymentModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processingPayment}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {processingPayment ? 'Processing...' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Credit Adjustment Modal */}
      {showCreditAdjustmentModal && selectedCreditCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-left mb-4">
                Credit Adjustment
              </h3>
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600 text-left">Customer: {selectedCreditCustomer.name}</p>
                <p className="text-sm text-gray-600 text-left">Current Balance: ₹{selectedCreditCustomer.outstandingAmount?.toLocaleString()}</p>
              </div>

              <form onSubmit={handleCreditAdjustment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                    Adjustment Type *
                  </label>
                  <select
                    value={creditAdjustmentForm.adjustmentType}
                    onChange={(e) => setCreditAdjustmentForm({...creditAdjustmentForm, adjustmentType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="add">Add Credit</option>
                    <option value="deduct">Deduct Credit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={creditAdjustmentForm.amount}
                    onChange={createNumericInputHandler(
                      (value) => setCreditAdjustmentForm({...creditAdjustmentForm, amount: value}),
                      null,
                      VALIDATION_OPTIONS.PRICE
                    )}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                    Reason *
                  </label>
                  <select
                    value={creditAdjustmentForm.reason}
                    onChange={(e) => setCreditAdjustmentForm({...creditAdjustmentForm, reason: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="manual_adjustment">Manual Adjustment</option>
                    <option value="promotional_credit">Promotional Credit</option>
                    <option value="compensation">Compensation</option>
                    <option value="correction">Correction</option>
                    <option value="goodwill">Goodwill</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                    Notes
                  </label>
                  <textarea
                    value={creditAdjustmentForm.notes}
                    onChange={(e) => setCreditAdjustmentForm({...creditAdjustmentForm, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows="3"
                    placeholder="Optional notes"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreditAdjustmentModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processingAdjustment}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                  >
                    {processingAdjustment ? 'Processing...' : `${creditAdjustmentForm.adjustmentType === 'add' ? 'Add' : 'Deduct'} Credit`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Credit History Modal */}
      {showCreditHistoryModal && selectedCreditCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 text-left">
                  Credit History - {selectedCreditCustomer.name}
                </h3>
                <button
                  onClick={() => setShowCreditHistoryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 text-left">Current Balance</p>
                    <p className="font-medium text-left">₹{selectedCreditCustomer.outstandingAmount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-left">Credit Limit</p>
                    <p className="font-medium text-left">₹{selectedCreditCustomer.creditLimit?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-left">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedCreditCustomer.status === 'overdue'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedCreditCustomer.status === 'overdue' ? 'Overdue' : 'Current'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {creditHistoryLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : creditHistory.length > 0 ? (
                  <div className="space-y-3">
                    {creditHistory.map((transaction, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                transaction.transactionType === 'credit_sale'
                                  ? 'bg-red-100 text-red-800'
                                  : transaction.transactionType === 'credit_payment'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {transaction.transactionType.replace('_', ' ').toUpperCase()}
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(transaction.transactionDate).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-900 mt-1 text-left">{transaction.description}</p>
                            {transaction.notes && (
                              <p className="text-xs text-gray-600 mt-1 text-left">{transaction.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-medium ${
                              transaction.balanceChange >= 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {transaction.balanceChange >= 0 ? '+' : ''}₹{Math.abs(transaction.balanceChange).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">Balance: ₹{transaction.newBalance.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No credit transactions found
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowCreditHistoryModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        </div>
      </div>
    </StoreManagerLayout>
  );
};

export default StoreManagerCustomers;

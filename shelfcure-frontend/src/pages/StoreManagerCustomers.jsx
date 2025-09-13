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
  Filter
} from 'lucide-react';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';

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
  
  // Analytics state
  const [customerAnalytics, setCustomerAnalytics] = useState(null);
  const [creditManagement, setCreditManagement] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [creditTransactions, setCreditTransactions] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [creditLoading, setCreditLoading] = useState(false);



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
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <Download className="h-4 w-4 mr-2" />
                  Export
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
                  <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2">
                    <Download className="h-5 w-5" />
                    <span>Export Report</span>
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
                            onClick={() => viewCustomerPurchaseHistory(customer)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Purchase History & Regular Medicines"
                          >
                            <History className="h-5 w-5" />
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
                        {customer.address && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>{customer.address.city}, {customer.address.state}</span>
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

                      {customer.creditBalance && customer.creditBalance > 0 && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded-md">
                          <div className="flex items-center text-sm text-yellow-800">
                            <CreditCard className="h-4 w-4 mr-2" />
                            <span>Credit Balance: ₹{customer.creditBalance}</span>
                          </div>
                        </div>
                      )}
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
                        Inactive: { bg: 'bg-red-50', dot: 'bg-red-500', text: 'text-red-600' }
                      };
                      const colors = colorMap[segment] || colorMap.Inactive;

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
                                <button className="text-green-600 hover:text-green-900" title="View Receipt">
                                  <Receipt className="h-4 w-4" />
                                </button>
                                <button className="text-blue-600 hover:text-blue-900" title="Record Payment">
                                  <DollarSign className="h-4 w-4" />
                                </button>
                                <button className="text-purple-600 hover:text-purple-900" title="Call Customer">
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

                {selectedCustomer.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-left">Address</label>
                    <p className="mt-1 text-sm text-gray-900 text-left">
                      {selectedCustomer.address.street && `${selectedCustomer.address.street}, `}
                      {selectedCustomer.address.city && `${selectedCustomer.address.city}, `}
                      {selectedCustomer.address.state && `${selectedCustomer.address.state} `}
                      {selectedCustomer.address.pincode}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{selectedCustomer.totalPurchases || 0}</p>
                    <p className="text-sm text-gray-500">Total Purchases</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">₹{selectedCustomer.totalSpent || 0}</p>
                    <p className="text-sm text-gray-500">Total Spent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">₹{selectedCustomer.creditBalance || 0}</p>
                    <p className="text-sm text-gray-500">Credit Balance</p>
                  </div>
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



        </div>
      </div>
    </StoreManagerLayout>
  );
};

export default StoreManagerCustomers;

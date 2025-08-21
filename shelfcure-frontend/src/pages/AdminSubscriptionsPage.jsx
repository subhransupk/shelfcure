import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import { API_ENDPOINTS, makeAuthenticatedRequest } from '../config/api';
import {
  CreditCard, Search, Eye,
  ChevronLeft, ChevronRight, Calendar, User,
  CheckCircle, XCircle, Clock, DollarSign, Users
} from 'lucide-react';

const AdminSubscriptionsPage = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  // Mock subscription data
  const mockSubscriptions = [
    {
      id: 1,
      userId: 1,
      userName: 'Dr. Rajesh Kumar',
      userEmail: 'rajesh@medicare.com',
      plan: 'Premium',
      status: 'active',
      startDate: '2023-01-15',
      endDate: '2024-01-15',
      amount: 35988, // Yearly premium
      billingCycle: 'yearly',
      storeCount: 5,
      nextBilling: '2024-01-15',
      paymentMethod: 'Credit Card'
    },
    {
      id: 2,
      userId: 2,
      userName: 'Mrs. Priya Sharma',
      userEmail: 'priya@healthplus.com',
      plan: 'Standard',
      status: 'active',
      startDate: '2023-02-20',
      endDate: '2024-02-20',
      amount: 23988, // Yearly standard
      billingCycle: 'yearly',
      storeCount: 3,
      nextBilling: '2024-02-20',
      paymentMethod: 'UPI'
    },
    {
      id: 3,
      userId: 3,
      userName: 'Mr. Amit Patel',
      userEmail: 'amit@citypharmacy.com',
      plan: 'Basic',
      status: 'trial',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      amount: 0, // Trial
      billingCycle: 'trial',
      storeCount: 1,
      nextBilling: '2024-01-31',
      paymentMethod: 'Pending'
    },
    {
      id: 4,
      userId: 4,
      userName: 'Dr. Sunita Reddy',
      userEmail: 'sunita@wellness.com',
      plan: 'Enterprise',
      status: 'active',
      startDate: '2023-04-05',
      endDate: '2024-04-05',
      amount: 59988, // Yearly enterprise
      billingCycle: 'yearly',
      storeCount: 10,
      nextBilling: '2024-04-05',
      paymentMethod: 'Bank Transfer'
    },
    {
      id: 5,
      userId: 5,
      userName: 'Mr. Ravi Singh',
      userEmail: 'ravi@quickmeds.com',
      plan: 'Standard',
      status: 'active',
      startDate: '2023-05-12',
      endDate: '2024-05-12',
      amount: 1999, // Monthly standard
      billingCycle: 'monthly',
      storeCount: 3,
      nextBilling: '2024-01-12',
      paymentMethod: 'Credit Card'
    },
    {
      id: 6,
      userId: 6,
      userName: 'Mrs. Kavita Joshi',
      userEmail: 'kavita@familypharmacy.com',
      plan: 'Basic',
      status: 'expired',
      startDate: '2023-06-18',
      endDate: '2023-12-18',
      amount: 11988, // Yearly basic
      billingCycle: 'yearly',
      storeCount: 1,
      nextBilling: 'Expired',
      paymentMethod: 'UPI'
    },
    {
      id: 7,
      userId: 7,
      userName: 'Dr. Vikram Mehta',
      userEmail: 'vikram@medstore.com',
      plan: 'Premium',
      status: 'trial',
      startDate: '2024-01-10',
      endDate: '2024-02-10',
      amount: 0, // Trial
      billingCycle: 'trial',
      storeCount: 5,
      nextBilling: '2024-02-10',
      paymentMethod: 'Pending'
    },
    {
      id: 8,
      userId: 8,
      userName: 'Mrs. Anita Gupta',
      userEmail: 'anita@pharmacare.com',
      plan: 'Standard',
      status: 'cancelled',
      startDate: '2023-08-15',
      endDate: '2023-11-15',
      amount: 5997, // Quarterly standard
      billingCycle: 'quarterly',
      storeCount: 3,
      nextBilling: 'Cancelled',
      paymentMethod: 'Credit Card'
    }
  ];

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await makeAuthenticatedRequest(API_ENDPOINTS.ADMIN_SUBSCRIPTIONS);

      if (data.success) {
        // The API now returns subscription data directly in the correct format
        const transformedData = (Array.isArray(data.data) ? data.data : []).map(subscription => ({
          id: subscription.id,
          userId: subscription.userId,
          userName: subscription.userName,
          userEmail: subscription.userEmail,
          userPhone: subscription.userPhone,
          plan: subscription.plan,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          amount: subscription.amount || 0,
          billingCycle: subscription.billingCycle || 'yearly',
          storeCount: subscription.storeCount || 0,
          storeLimit: subscription.storeLimit || 1,
          nextBilling: subscription.nextBilling || subscription.endDate,
          paymentMethod: subscription.paymentMethod || 'Online Payment',
          paymentStatus: subscription.paymentStatus,
          remainingDays: subscription.remainingDays,
          isActive: subscription.isActive,
          features: subscription.features,
          createdAt: subscription.createdAt,
          // For display purposes, we'll show subscription info instead of store info
          storeName: `${subscription.plan} Subscription`,
          storeCode: `SUB-${subscription.id.slice(-6).toUpperCase()}`
        }));

        setSubscriptions(transformedData);
        console.log('Subscriptions loaded:', transformedData.length);
      } else {
        console.error('Failed to fetch subscriptions:', data.message);
        // Fallback to mock data if API fails
        setSubscriptions(mockSubscriptions);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      // Fallback to mock data if API fails
      setSubscriptions(mockSubscriptions);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    totalUsers: subscriptions.length,
    trialUsers: subscriptions.filter(sub => sub.status === 'trial').length,
    activeSubscriptions: subscriptions.filter(sub => sub.status === 'active').length,
    totalRevenue: subscriptions
      .filter(sub => sub.status === 'active')
      .reduce((sum, sub) => sum + sub.amount, 0)
  };

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = subscription.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.plan.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || subscription.status === statusFilter;
    const matchesPlan = planFilter === 'all' || subscription.plan.toLowerCase() === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubscriptions = filteredSubscriptions.slice(startIndex, startIndex + itemsPerPage);

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

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Active' },
      trial: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Trial' },
      expired: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Expired' },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.expired;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getPlanBadge = (plan) => {
    const planColors = {
      basic: 'bg-gray-100 text-gray-800',
      standard: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${planColors[plan.toLowerCase()] || planColors.basic}`}>
        {plan}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout title="Subscriptions" subtitle="Manage user subscriptions and billing">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Subscriptions" subtitle="Manage user subscriptions and billing">
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Trial Users</p>
                <p className="text-2xl font-bold text-blue-600">{stats.trialUsers}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeSubscriptions}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-primary-600">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="p-3 bg-primary-100 rounded-full">
                <DollarSign className="w-6 h-6 text-primary-600" />
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
                  placeholder="Search users, email, plan..."
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
                <option value="trial">Trial</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Plan Filter */}
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Plans</option>
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan & Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Billing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stores
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(Array.isArray(paginatedSubscriptions) ? paginatedSubscriptions : []).map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">{subscription.userName}</div>
                        <div className="text-sm text-gray-500">{subscription.userEmail}</div>
                        <div className="text-sm text-gray-500">
                          <User className="inline w-3 h-3 mr-1" />
                          Subscription ID: {subscription.storeCode}
                        </div>
                        {subscription.userPhone && (
                          <div className="text-sm text-gray-500">
                            📞 {subscription.userPhone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-left space-y-1">
                        {getPlanBadge(subscription.plan)}
                        {getStatusBadge(subscription.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">
                          {subscription.amount > 0 ? formatCurrency(subscription.amount) : 'Free Trial'}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">{subscription.billingCycle}</div>
                        <div className="text-sm text-gray-500">{subscription.paymentMethod}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-left">
                        <div className="text-sm text-gray-900">
                          <Calendar className="inline w-3 h-3 mr-1" />
                          {formatDate(subscription.startDate)}
                        </div>
                        <div className="text-sm text-gray-500">
                          to {formatDate(subscription.endDate)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Next: {subscription.nextBilling === 'Expired' || subscription.nextBilling === 'Cancelled'
                            ? subscription.nextBilling
                            : formatDate(subscription.nextBilling)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {subscription.storeCount}
                      </div>
                      <div className="text-xs text-gray-500">
                        {subscription.storeCount === 1 ? 'store' : 'stores'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/admin/subscriptions/${subscription.id}`)}
                          className="text-primary-600 hover:text-primary-900 p-1 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredSubscriptions.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No subscriptions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || planFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No subscriptions available at the moment.'
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
                      {Math.min(startIndex + itemsPerPage, filteredSubscriptions.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredSubscriptions.length}</span> results
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

export default AdminSubscriptionsPage;

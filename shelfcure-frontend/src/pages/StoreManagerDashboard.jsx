import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  Plus,
  Eye,
  Calendar,
  Clock,
  CreditCard,
  RotateCcw,
  X,
  Archive,
  Trash2,
  Shield,
  AlertCircle,
  Target,
  Zap,
  TrendingDown,
  Stethoscope
} from 'lucide-react';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';
import { getCurrentUser } from '../services/authService';

const StoreManagerDashboard = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [dashboardData, setDashboardData] = useState(null);
  const [expiryAlertsSummary, setExpiryAlertsSummary] = useState(null);
  const [doctorStats, setDoctorStats] = useState(null);
  const [doctorStatsLoading, setDoctorStatsLoading] = useState(true);
  const [expiryAlertsLoading, setExpiryAlertsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
    fetchExpiryAlertsSummary();
    fetchDoctorStats();
  }, []);

  // Force refresh of expiry alerts every 5 seconds to ensure data consistency
  useEffect(() => {
    const interval = setInterval(() => {
      fetchExpiryAlertsSummary();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/store-manager/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiryAlertsSummary = async () => {
    try {
      setExpiryAlertsLoading(true);
      // Force complete state reset
      setExpiryAlertsSummary(null);
      const token = localStorage.getItem('token');

      // Force a completely fresh request with aggressive cache busting
      const timestamp = Date.now();
      const random = Math.random();
      const response = await fetch(`/api/store-manager/expiry-alerts/summary?bust=${timestamp}&rand=${random}&force=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'If-None-Match': '*'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Frontend received expiry alerts data:', data.data);
        console.log('🔍 Total count from API:', data.data?.summary?.total?.count);
        setExpiryAlertsSummary(data.data);
      } else {
        // Set default values if API fails
        setExpiryAlertsSummary({
          summary: {
            expired: { count: 0, value: 0 },
            critical: { count: 0, value: 0 },
            warning: { count: 0, value: 0 },
            upcoming: { count: 0, value: 0 },
            total: { count: 0, value: 0 }
          }
        });
      }
    } catch (error) {
      console.error('Expiry alerts summary fetch error:', error);
      // Set default values if API fails
      setExpiryAlertsSummary({
        summary: {
          expired: { count: 0, value: 0 },
          critical: { count: 0, value: 0 },
          warning: { count: 0, value: 0 },
          upcoming: { count: 0, value: 0 },
          total: { count: 0, value: 0 }
        }
      });
    } finally {
      setExpiryAlertsLoading(false);
    }
  };

  const fetchDoctorStats = async () => {
    try {
      setDoctorStatsLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/store-manager/doctors/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDoctorStats(data.data);
      } else {
        // Set default values if API fails
        setDoctorStats({
          totalCommissionEarned: 0,
          activeDoctors: 0,
          pendingCommissions: 0
        });
      }
    } catch (error) {
      console.error('Doctor stats fetch error:', error);
      // Set default values if API fails
      setDoctorStats({
        totalCommissionEarned: 0,
        activeDoctors: 0,
        pendingCommissions: 0
      });
    } finally {
      setDoctorStatsLoading(false);
    }
  };

  if (loading) {
    return (
      <StoreManagerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </StoreManagerLayout>
    );
  }

  if (error) {
    return (
      <StoreManagerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="text-red-800">{error}</div>
            </div>
            <button
              onClick={() => {
                setError('');
                fetchDashboardData();
                fetchExpiryAlertsSummary();
                fetchDoctorStats();
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Retry
            </button>
          </div>
        </div>
      </StoreManagerLayout>
    );
  }

  const metrics = dashboardData?.metrics || {};
  const recentSales = dashboardData?.recentSales || [];
  const expiringMedicines = dashboardData?.expiringMedicines || [];
  const alerts = dashboardData?.alerts || {};

  // Safety check for critical metrics
  const safeMetrics = {
    todayRevenue: metrics.todayRevenue || 0,
    monthRevenue: metrics.monthRevenue || 0,
    totalProfit: metrics.totalProfit || 0,
    todayProfit: metrics.todayProfit || 0,
    todayLoss: metrics.todayLoss || 0,
    todayCredit: metrics.todayCredit || 0,
    todaySalesCount: metrics.todaySalesCount || 0,
    monthSalesCount: metrics.monthSalesCount || 0,
    totalMedicines: metrics.totalMedicines || 0,
    inStockMedicines: metrics.inStockMedicines || 0,
    stockValue: metrics.stockValue || 0,
    totalStrips: metrics.totalStrips || 0,
    totalIndividualUnits: metrics.totalIndividualUnits || 0,
    pendingCredit: metrics.pendingCredit || 0,
    creditCustomers: metrics.creditCustomers || 0,
    todayReturns: metrics.todayReturns || 0,
    pendingReturns: metrics.pendingReturns || 0,
    outOfStock: metrics.outOfStock || 0,
    expiredMedicines: metrics.expiredMedicines || 0,
    lowStockMedicines: metrics.lowStockMedicines || 0,
    wasteImpact: metrics.wasteImpact || 0,
    preventableWaste: metrics.preventableWaste || 0,
    wastePercentage: metrics.wastePercentage || 0,
    wasteIncidents: metrics.wasteIncidents || 0
  };

  return (
    <StoreManagerLayout>
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 text-left">Store Dashboard</h1>
            <p className="text-gray-600 text-left">Welcome back, {user?.name}</p>
            {dashboardData?.store && (
              <p className="text-sm text-gray-500 text-left">
                Managing: {dashboardData.store.name} ({dashboardData.store.code})
              </p>
            )}
          </div>

          {/* Alerts */}
          {(alerts.lowStock || alerts.expiringSoon) && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <h3 className="text-sm font-medium text-yellow-800">Attention Required</h3>
              </div>
              <div className="mt-2 text-sm text-yellow-700">
                {alerts.lowStock && <p>• {safeMetrics.lowStockMedicines} medicines are running low on stock</p>}
                {alerts.expiringSoon && <p>• {expiringMedicines.length} medicines are expiring soon</p>}
              </div>
            </div>
          )}

          {/* Comprehensive Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Row 1: Financial Metrics */}
            {/* Today's Sales */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                    <p className="text-2xl font-bold text-gray-900">₹{safeMetrics.todayRevenue.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {safeMetrics.todaySalesCount} transactions
              </div>
            </div>

            {/* This Month */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">₹{safeMetrics.monthRevenue.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {safeMetrics.monthSalesCount} transactions
              </div>
            </div>

            {/* Total Profit */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Profit</p>
                    <p className="text-2xl font-bold text-gray-900">₹{safeMetrics.totalProfit.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className={`mt-2 text-sm flex items-center ${safeMetrics.todayReturns > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${safeMetrics.todayReturns > 0 ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                {safeMetrics.todayReturns > 0 ? `₹${safeMetrics.todayReturns.toFixed(2)} return impact` : 'No return impact'}
              </div>
            </div>

            {/* Today Profit */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today Profit</p>
                    <p className="text-2xl font-bold text-gray-900">₹{safeMetrics.todayProfit.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className={`mt-2 text-sm flex items-center ${safeMetrics.todayProfit > 0 ? 'text-emerald-600' : 'text-gray-600'}`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${safeMetrics.todayProfit > 0 ? 'bg-emerald-500' : 'bg-gray-500'}`}></span>
                {safeMetrics.todayProfit > 0 ? 'Profitable day' : 'No profit today'}
              </div>
            </div>

            {/* Total Medicines */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Medicines</p>
                    <p className="text-2xl font-bold text-gray-900">{safeMetrics.totalMedicines}</p>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {safeMetrics.inStockMedicines} in stock
              </div>
            </div>

            {/* Row 2: Inventory & Operations */}
            {/* Stock Value */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                    <Archive className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Stock Value</p>
                    <p className="text-2xl font-bold text-gray-900">₹{safeMetrics.stockValue.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {(safeMetrics.totalStrips + safeMetrics.totalIndividualUnits).toLocaleString()} items valued
              </div>
            </div>

            {/* Pending Credit */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg mr-3">
                    <CreditCard className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Credit</p>
                    <p className="text-2xl font-bold text-gray-900">₹{safeMetrics.pendingCredit.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {safeMetrics.creditCustomers} credit customers
              </div>
            </div>

            {/* Today Credit */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-amber-100 rounded-lg mr-3">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today Credit</p>
                    <p className="text-2xl font-bold text-gray-900">₹{safeMetrics.todayCredit.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className={`mt-2 text-sm flex items-center ${safeMetrics.todayCredit > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${safeMetrics.todayCredit > 0 ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                {safeMetrics.todayCredit > 0 ? 'Credit given today' : 'No credit given today'}
              </div>
            </div>

            {/* Today's Returns */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg mr-3">
                    <RotateCcw className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Returns</p>
                    <p className="text-2xl font-bold text-gray-900">₹{safeMetrics.todayReturns.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {safeMetrics.todayReturnsCount || 0} returns today • {safeMetrics.pendingReturns} pending
              </div>
            </div>

            {/* Today Loss */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-rose-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-rose-100 rounded-lg mr-3">
                    <TrendingDown className="h-6 w-6 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today Loss</p>
                    <p className="text-2xl font-bold text-gray-900">₹{safeMetrics.todayLoss.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className={`mt-2 text-sm flex items-center ${safeMetrics.todayLoss > 0 ? 'text-rose-600' : 'text-green-600'}`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${safeMetrics.todayLoss > 0 ? 'bg-rose-500' : 'bg-green-500'}`}></span>
                {safeMetrics.todayLoss > 0 ? 'Loss incurred today' : 'No losses today'}
              </div>
            </div>

            {/* Out of Stock */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-gray-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg mr-3">
                    <X className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                    <p className="text-2xl font-bold text-gray-900">{safeMetrics.outOfStock}</p>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {safeMetrics.expiredMedicines} expired
              </div>
            </div>

            {/* Row 3: Waste Management & Expiry Tracking */}

            {/* Waste Impact */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg mr-3">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Waste Impact</p>
                    <p className="text-2xl font-bold text-gray-900">₹{safeMetrics.wasteImpact.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {safeMetrics.wasteIncidents} incidents
              </div>
            </div>

            {/* Preventable Waste */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                    <Shield className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Preventable Waste</p>
                    <p className="text-2xl font-bold text-gray-900">₹{safeMetrics.preventableWaste.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {safeMetrics.wastePercentage.toFixed(1)}% of total waste
              </div>
            </div>

            {/* Low Stock Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg mr-3">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                    <p className="text-2xl font-bold text-gray-900">{safeMetrics.lowStockMedicines}</p>
                  </div>
                </div>
              </div>
              <div className={`mt-2 text-sm flex items-center ${safeMetrics.lowStockMedicines > 0 ? 'text-red-600' : 'text-green-600'}`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${safeMetrics.lowStockMedicines > 0 ? 'bg-red-500' : 'bg-green-500'}`}></span>
                {safeMetrics.lowStockMedicines > 0 ? 'Needs immediate attention' : 'Stock levels healthy'}
              </div>
            </div>

            {/* Doctor Commission Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <Stethoscope className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Doctor Commissions</p>
                    {doctorStatsLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600 mr-2"></div>
                        <p className="text-lg text-gray-400">Loading...</p>
                      </div>
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">₹{doctorStats?.totalCommissionEarned?.toFixed(2) || '0.00'}</p>
                    )}
                  </div>
                </div>
              </div>
              {!doctorStatsLoading && (
                <div className="mt-2 text-sm text-gray-500 flex items-center justify-between">
                  <span>{doctorStats?.activeDoctors || 0} active doctors</span>
                  <span className="text-orange-600">₹{doctorStats?.pendingCommissions?.toFixed(2) || '0.00'} pending</span>
                </div>
              )}
            </div>

            {/* Comprehensive Expiry Alerts Widget */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500 md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg mr-3">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Expiry Alerts</h3>
                    <p className="text-sm text-gray-600">Medicine expiry monitoring</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/store-panel/expiry-alerts')}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  View All →
                </button>
              </div>

              {expiryAlertsLoading ? (
                <div className="flex items-center justify-center h-20">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                  <span className="ml-2 text-gray-500">Loading expiry alerts...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Expired */}
                  <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-2xl font-bold text-red-600">
                      {expiryAlertsSummary?.summary?.expired?.count || 0}
                    </div>
                    <div className="text-xs text-red-600 font-medium">Expired</div>
                    <div className="text-xs text-gray-500 mt-1">
                      ₹{expiryAlertsSummary?.summary?.expired?.value?.toFixed(2) || '0.00'}
                    </div>
                  </div>

                  {/* Critical (≤7 days) */}
                  <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-2xl font-bold text-red-600">
                      {expiryAlertsSummary?.summary?.critical?.count || 0}
                    </div>
                    <div className="text-xs text-red-600 font-medium">Critical</div>
                    <div className="text-xs text-gray-500 mt-1">≤7 days</div>
                  </div>

                  {/* Warning (8-30 days) */}
                  <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="text-2xl font-bold text-orange-600">
                      {expiryAlertsSummary?.summary?.warning?.count || 0}
                    </div>
                    <div className="text-xs text-orange-600 font-medium">Warning</div>
                    <div className="text-xs text-gray-500 mt-1">8-30 days</div>
                  </div>

                  {/* Upcoming (31-90 days) */}
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">
                      {expiryAlertsSummary?.summary?.upcoming?.count || 0}
                    </div>
                    <div className="text-xs text-blue-600 font-medium">Upcoming</div>
                    <div className="text-xs text-gray-500 mt-1">31-90 days</div>
                  </div>
                </div>
              )}

              {/* Total Value at Risk */}
              {!expiryAlertsLoading && expiryAlertsSummary?.summary?.total && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Total Value at Risk:</span>
                    <span className="text-lg font-bold text-red-600">
                      ₹{expiryAlertsSummary.summary.total.value?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">Total Items:</span>
                    <span className="text-sm font-medium text-gray-700">
                      {(() => {
                        const count = expiryAlertsSummary?.summary?.total?.count || 0;
                        console.log('🔍 Rendering total count:', count);
                        console.log('🔍 Full expiryAlertsSummary:', JSON.stringify(expiryAlertsSummary, null, 2));
                        console.log('🔍 Summary object:', expiryAlertsSummary?.summary);
                        console.log('🔍 Total object:', expiryAlertsSummary?.summary?.total);
                        return count;
                      })()} medicines
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 text-left">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/store-panel/sales')}
                className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>New Sale</span>
              </button>
              <button
                onClick={() => navigate('/store-panel/inventory')}
                className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <Package className="h-5 w-5" />
                <span>Manage Inventory</span>
              </button>
              <button
                onClick={() => navigate('/store-panel/customers')}
                className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"
              >
                <Users className="h-5 w-5" />
                <span>View Customers</span>
              </button>
            </div>
          </div>

          {/* Recent Sales and Expiring Medicines */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Sales */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 text-left">Recent Sales</h3>
                <button
                  onClick={() => navigate('/store-panel/sales')}
                  className="text-green-600 hover:text-green-700 flex items-center space-x-1"
                >
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">View All</span>
                </button>
              </div>
              <div className="space-y-3">
                {recentSales.length > 0 ? (
                  recentSales.slice(0, 5).map((sale, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 text-left">
                          {sale.customer?.name || 'Walk-in Customer'}
                        </p>
                        <p className="text-sm text-gray-500 text-left">
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{sale.totalAmount}</p>
                        <p className="text-xs text-gray-500">{sale.items?.length || 0} items</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent sales</p>
                )}
              </div>
            </div>

            {/* Expiring Medicines */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 text-left">Expiring Soon</h3>
                <button
                  onClick={() => navigate('/store-panel/inventory')}
                  className="text-orange-600 hover:text-orange-700 flex items-center space-x-1"
                >
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">View All</span>
                </button>
              </div>
              <div className="space-y-3">
                {expiringMedicines.length > 0 ? (
                  expiringMedicines.slice(0, 5).map((medicine, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 text-left">{medicine.name}</p>
                        <p className="text-sm text-gray-500 text-left">{medicine.manufacturer}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-orange-600">
                          {medicine.expiryDate ?
                            new Date(medicine.expiryDate).toLocaleDateString() :
                            'No expiry date'
                          }
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No medicines expiring soon</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StoreManagerLayout>
  );
};

export default StoreManagerDashboard;

import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import '../models/dashboard.dart';
import '../services/api_service.dart';

class DashboardProvider extends ChangeNotifier {
  DashboardData? _dashboardData;
  bool _isLoading = false;
  String? _error;
  final ApiService _apiService = ApiService();
  final Logger _logger = Logger();

  DashboardData? get dashboardData => _dashboardData;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchDashboardData() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Fetch dashboard data from API
      final response = await _apiService.getDashboardData();

      if (response['success']) {
        // The API response structure is:
        // { success: true, data: { success: true, data: { metrics: {...}, alerts: {...}, ... } } }
        // So we need to extract response['data']['data']
        final apiData = response['data'];

        // Check if this is the wrapped response from backend
        Map<String, dynamic>? dashboardData;
        if (apiData is Map<String, dynamic>) {
          if (apiData.containsKey('data') &&
              apiData['data'] is Map<String, dynamic>) {
            // Backend response is wrapped, extract the inner data
            dashboardData = apiData['data'];
          } else {
            // Direct dashboard data
            dashboardData = apiData;
          }
        }

        if (dashboardData != null) {
          _dashboardData = DashboardData.fromJson(dashboardData);
          _error = null;

          _logger.i(
            'Dashboard parsed: ${_dashboardData?.recentSales.length ?? 0} recent sales, ${_dashboardData?.expiringMedicines.length ?? 0} expiring medicines',
          );
        } else {
          _error = 'Invalid response format';
        }
      } else {
        _error = response['message'] ?? 'Failed to fetch dashboard data';
        // Fallback to mock data if API fails
        _dashboardData = _generateMockDashboardData();
      }
    } catch (e) {
      _error = 'An error occurred: $e';
      // Fallback to mock data if API fails
      _dashboardData = _generateMockDashboardData();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  DashboardData _generateMockDashboardData() {
    final now = DateTime.now();
    return DashboardData(
      // Financial Metrics
      todayRevenue: 15250.50,
      weekRevenue: 98750.00,
      monthRevenue: 425000.00,
      totalProfit: 125000.00,
      todayProfit: 3500.00,
      todayLoss: 250.00,
      todayCredit: 2500.00,
      todaySalesCount: 45,
      weekSalesCount: 320,
      monthSalesCount: 1250,

      // Inventory Metrics
      totalMedicines: 450,
      inStockMedicines: 420,
      lowStockMedicines: 25,
      outOfStock: 5,
      stockValue: 850000.00,
      totalStrips: 12500,
      totalIndividualUnits: 8750,

      // Customer & Credit Metrics
      totalCustomers: 850,
      newCustomersThisMonth: 45,
      pendingCredit: 35000.00,
      creditCustomers: 120,

      // Returns & Waste Metrics
      todayReturns: 1200.00,
      todayReturnsCount: 8,
      completedReturnsToday: 6,
      pendingReturns: 2,
      wasteImpact: 5000.00,
      preventableWaste: 3000.00,
      wastePercentage: 2.5,
      wasteIncidents: 3,

      // Expiry Tracking
      expiredMedicines: 12,
      expiredValue: 8500.00,
      expiring30Days: 35,
      expiring30DaysValue: 45000.00,
      critical7Days: 8,

      // Doctor Commissions
      totalDoctorCommissions: 8500.00,

      // Sales Trend
      salesTrend: [
        SalesChartData(date: 'Mon', amount: 12000),
        SalesChartData(date: 'Tue', amount: 15000),
        SalesChartData(date: 'Wed', amount: 18000),
        SalesChartData(date: 'Thu', amount: 14000),
        SalesChartData(date: 'Fri', amount: 20000),
        SalesChartData(date: 'Sat', amount: 22000),
        SalesChartData(date: 'Sun', amount: 16000),
      ],

      // Top Products
      topProducts: [
        TopProduct(name: 'Aspirin 500mg', quantity: 450, revenue: 22500),
        TopProduct(name: 'Paracetamol 650mg', quantity: 380, revenue: 19000),
        TopProduct(name: 'Ibuprofen 400mg', quantity: 320, revenue: 16000),
      ],

      // Recent Sales
      recentSales: [
        RecentSale(
          id: '1',
          invoiceNumber: 'INV-001',
          amount: 2500.00,
          date: now,
          customerName: 'John Doe',
        ),
        RecentSale(
          id: '2',
          invoiceNumber: 'INV-002',
          amount: 1800.00,
          date: now.subtract(const Duration(hours: 2)),
          customerName: 'Jane Smith',
        ),
        RecentSale(
          id: '3',
          invoiceNumber: 'INV-003',
          amount: 3200.00,
          date: now.subtract(const Duration(hours: 4)),
          customerName: 'Walk-in Customer',
        ),
      ],

      // Expiring Medicines
      expiringMedicines: [
        ExpiringMedicine(
          id: '1',
          name: 'Cough Syrup',
          batchNumber: 'BATCH-001',
          expiryDate: now.add(const Duration(days: 15)),
          quantity: 50,
          price: 250.00,
        ),
        ExpiringMedicine(
          id: '2',
          name: 'Vitamin C',
          batchNumber: 'BATCH-002',
          expiryDate: now.add(const Duration(days: 8)),
          quantity: 100,
          price: 150.00,
        ),
      ],

      // Alerts
      lowStockAlert: true,
      expiringAlert: true,
      criticalExpiryAlert: false,
      outOfStockAlert: false,
    );
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  /// Retry fetching dashboard data with exponential backoff
  Future<void> retryFetchDashboardData({int maxRetries = 3}) async {
    int retryCount = 0;
    int delayMs = 1000; // Start with 1 second delay

    while (retryCount < maxRetries) {
      try {
        await fetchDashboardData();
        if (_error == null && _dashboardData != null) {
          // Success
          return;
        }
      } catch (e) {
        retryCount++;
        if (retryCount < maxRetries) {
          // Wait before retrying with exponential backoff
          await Future.delayed(Duration(milliseconds: delayMs));
          delayMs *= 2; // Double the delay for next retry
        }
      }
    }

    // If all retries failed, set error
    _error = 'Failed to fetch dashboard data after $maxRetries attempts';
    _isLoading = false;
    notifyListeners();
  }

  /// Refresh dashboard data (used for pull-to-refresh)
  Future<void> refreshDashboardData() async {
    return fetchDashboardData();
  }
}

import 'package:flutter/material.dart';
import '../models/analytics.dart';
import '../services/api_service.dart';
import 'package:logger/logger.dart';

class AnalyticsProvider extends ChangeNotifier {
  AnalyticsData? _analyticsData;
  bool _isLoading = false;
  String? _error;
  String _selectedPeriod = '30d';
  final ApiService _apiService = ApiService();
  final Logger _logger = Logger();

  AnalyticsData? get analyticsData => _analyticsData;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String get selectedPeriod => _selectedPeriod;

  Future<void> fetchAnalytics({String period = '30d'}) async {
    _selectedPeriod = period;
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.getAnalytics(period: period);

      if (response['success']) {
        final data = response['data'];
        if (data is Map<String, dynamic>) {
          _analyticsData = AnalyticsData.fromJson(data);
          _error = null;
          _logger.i('Analytics data fetched successfully for period: $period');
        } else {
          _error = 'Invalid response format';
          _analyticsData = _generateMockAnalyticsData(period);
        }
      } else {
        _error = response['message'] ?? 'Failed to fetch analytics data';
        _logger.w('Analytics API error: $_error');
        // Fallback to mock data
        _analyticsData = _generateMockAnalyticsData(period);
      }
    } catch (e) {
      _error = 'An error occurred: $e';
      _logger.e('Error fetching analytics: $e');
      // Fallback to mock data
      _analyticsData = _generateMockAnalyticsData(period);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshAnalyticsData() async {
    await fetchAnalytics(period: _selectedPeriod);
  }

  Future<void> retryFetchAnalytics({int maxRetries = 3}) async {
    int retryCount = 0;
    int delayMs = 1000;

    while (retryCount < maxRetries) {
      try {
        await fetchAnalytics(period: _selectedPeriod);
        if (_error == null && _analyticsData != null) {
          return;
        }
      } catch (e) {
        retryCount++;
        if (retryCount < maxRetries) {
          await Future.delayed(Duration(milliseconds: delayMs));
          delayMs *= 2;
        }
      }
    }

    _error = 'Failed to fetch analytics data after $maxRetries attempts';
    _isLoading = false;
    notifyListeners();
  }

  AnalyticsData _generateMockAnalyticsData(String period) {
    final daysInPeriod = period == '7d'
        ? 7
        : period == '30d'
        ? 30
        : 90;

    // Generate daily sales data
    final dailySales = <DailySalesData>[];
    for (int i = 0; i < daysInPeriod; i++) {
      dailySales.add(
        DailySalesData(
          date: 'Day ${i + 1}',
          amount: 12000 + (i * 500).toDouble(),
          transactions: 35 + i,
        ),
      );
    }

    // Generate customer acquisition data
    final acquisitionData = <AcquisitionData>[];
    for (int i = 0; i < daysInPeriod; i++) {
      acquisitionData.add(
        AcquisitionData(date: 'Day ${i + 1}', count: 5 + (i % 3)),
      );
    }

    return AnalyticsData(
      totalRevenue: 425000.00,
      monthlyRevenue: 425000.00,
      totalSales: 1250,
      totalCustomers: 850,
      averageOrderValue: 340.00,
      revenueGrowth: 12.5,
      salesGrowth: 8.3,
      dailyAverageSales: 14166.67,
      dailySales: dailySales,
      categorySales: [
        CategorySalesData(
          category: 'Pain Relief',
          amount: 125000,
          percentage: 29,
        ),
        CategorySalesData(
          category: 'Antibiotics',
          amount: 95000,
          percentage: 22,
        ),
        CategorySalesData(category: 'Vitamins', amount: 85000, percentage: 20),
        CategorySalesData(
          category: 'Cough & Cold',
          amount: 75000,
          percentage: 18,
        ),
        CategorySalesData(category: 'Others', amount: 45000, percentage: 11),
      ],
      customerSegments: [
        CustomerSegment(segment: 'Regular', count: 450, totalSpending: 250000),
        CustomerSegment(
          segment: 'Occasional',
          count: 280,
          totalSpending: 120000,
        ),
        CustomerSegment(segment: 'New', count: 120, totalSpending: 55000),
      ],
      growthRate: 12.5,
      topMedicines: [
        TopMedicine(name: 'Aspirin 500mg', quantity: 450, revenue: 22500),
        TopMedicine(name: 'Paracetamol 650mg', quantity: 380, revenue: 19000),
        TopMedicine(name: 'Ibuprofen 400mg', quantity: 320, revenue: 16000),
      ],
      totalMedicines: 450,
      lowStockMedicines: 25,
      outOfStockMedicines: 5,
      stockHealth: 85,
      expiringMedicines: 35,
      expiredMedicines: 12,
      newCustomers: 45,
      activeCustomers: 720,
      avgCustomerSpending: 500.00,
      customers: CustomerAnalyticsData(
        totalCustomers: 850,
        newCustomers: 45,
        activeCustomers: 720,
        customerGrowth: 12.5,
        averageSpending: 500.00,
        averageOrderValue: 340.00,
        totalCustomerRevenue: 425000.00,
        acquisitionData: acquisitionData,
        lowSpenders: 150,
        mediumSpenders: 450,
        highSpenders: 250,
        topCustomers: [
          TopCustomer(
            name: 'John Doe',
            phone: '9876543210',
            visitCount: 45,
            totalSpent: 15000,
            lastVisit: '2025-11-10',
          ),
          TopCustomer(
            name: 'Jane Smith',
            phone: '9876543211',
            visitCount: 38,
            totalSpent: 12500,
            lastVisit: '2025-11-09',
          ),
        ],
      ),
    );
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}

import 'package:flutter/material.dart';
import '../models/sale.dart';
import '../services/api_service.dart';

class SalesProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Sale> _sales = [];
  bool _isLoading = false;
  String? _error;
  int _currentPage = 1;
  int _totalPages = 1;
  int _totalSales = 0;
  bool _hasMorePages = true;

  // Date filtering
  DateTime? _startDate;
  DateTime? _endDate;
  String _selectedPreset =
      'all'; // 'all', 'today', 'yesterday', 'last7days', 'last30days', 'thisMonth', 'custom'

  List<Sale> get sales => _sales;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasMorePages => _hasMorePages;
  int get currentPage => _currentPage;
  int get totalPages => _totalPages;
  int get totalSales => _totalSales;
  DateTime? get startDate => _startDate;
  DateTime? get endDate => _endDate;
  String get selectedPreset => _selectedPreset;

  Future<void> fetchSales({int page = 1, bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _sales = [];
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Call API with date range and pagination
      final response = await _apiService.getSales(
        page: page,
        limit: 20,
        startDate: _startDate,
        endDate: _endDate,
      );

      print('📱 [SalesProvider] Full API Response: $response');
      print('📱 [SalesProvider] Response type: ${response.runtimeType}');
      print('📱 [SalesProvider] Response keys: ${response.keys}');
      print('📱 [SalesProvider] Success: ${response['success']}');
      print('📱 [SalesProvider] Data type: ${response['data'].runtimeType}');
      print('📱 [SalesProvider] Data: ${response['data']}');
      print('📱 [SalesProvider] Pagination: ${response['pagination']}');
      print('📱 [SalesProvider] Count: ${response['count']}');

      if (response['success'] == true && response['data'] != null) {
        final data = response['data'];

        print('📱 [SalesProvider] Processing data...');

        // Handle both array and object responses
        List<dynamic> salesList = [];
        if (data is List) {
          print('📱 [SalesProvider] Data is a List with ${data.length} items');
          salesList = data;
        } else if (data is Map && data['sales'] != null) {
          print('📱 [SalesProvider] Data is a Map with sales property');
          salesList = data['sales'] as List;
        } else {
          print('📱 [SalesProvider] Data is a Map: ${data.runtimeType}');
          print('📱 [SalesProvider] Data keys: ${(data as Map).keys}');
        }

        print('📱 [SalesProvider] Sales list length: ${salesList.length}');

        final newSales = salesList
            .map((json) => Sale.fromJson(json as Map<String, dynamic>))
            .toList();

        print('📱 [SalesProvider] Parsed ${newSales.length} sales');

        if (refresh) {
          _sales = newSales;
        } else {
          _sales.addAll(newSales);
        }

        _currentPage = page;

        // Extract pagination info from nested pagination object
        final pagination = response['pagination'] as Map<String, dynamic>?;
        if (pagination != null) {
          _totalPages = pagination['pages'] ?? 1;
          _totalSales = pagination['total'] ?? 0;
          print(
            '📱 [SalesProvider] Pagination found: pages=$_totalPages, total=$_totalSales',
          );
        } else {
          _totalPages = response['totalPages'] ?? 1;
          _totalSales = response['totalCount'] ?? response['count'] ?? 0;
          print(
            '📱 [SalesProvider] No pagination object, using fallback: pages=$_totalPages, total=$_totalSales',
          );
        }

        _hasMorePages = page < _totalPages;
        _error = null;
        print(
          '📱 [SalesProvider] ✅ Sales fetched successfully: ${_sales.length} sales loaded',
        );
      } else {
        _error = response['message'] ?? 'Failed to fetch sales';
        print('📱 [SalesProvider] ❌ Error: $_error');
      }
    } catch (e) {
      _error = 'Error fetching sales: $e';
      print('📱 [SalesProvider] ❌ Exception: $_error');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createSale(Sale sale) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Simulate network delay
      await Future.delayed(const Duration(seconds: 1));

      // Add the sale to the beginning of the list
      _sales.insert(0, sale);
      _error = null;
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'An error occurred: $e';
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void loadMore() {
    if (_hasMorePages && !_isLoading) {
      fetchSales(page: _currentPage + 1);
    }
  }

  // Date filtering methods
  void filterByDateRange(DateTime startDate, DateTime endDate) {
    _startDate = startDate;
    _endDate = endDate;
    _selectedPreset = 'custom';
    _currentPage = 1;
    _sales = [];
    fetchSales(refresh: true);
  }

  void filterByPreset(String preset) {
    _selectedPreset = preset;
    _currentPage = 1;
    _sales = [];

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    switch (preset) {
      case 'today':
        _startDate = today;
        // Set end date to beginning of tomorrow (which is end of today)
        _endDate = today.add(const Duration(days: 1));
        break;
      case 'yesterday':
        final yesterday = today.subtract(const Duration(days: 1));
        _startDate = yesterday;
        // Set end date to beginning of today (which is end of yesterday)
        _endDate = today;
        break;
      case 'last7days':
        _startDate = today.subtract(const Duration(days: 7));
        // Set end date to beginning of tomorrow (which is end of today)
        _endDate = today.add(const Duration(days: 1));
        break;
      case 'last30days':
        _startDate = today.subtract(const Duration(days: 30));
        // Set end date to beginning of tomorrow (which is end of today)
        _endDate = today.add(const Duration(days: 1));
        break;
      case 'thisMonth':
        _startDate = DateTime(now.year, now.month, 1);
        // Set end date to beginning of next month (which is end of this month)
        _endDate = DateTime(now.year, now.month + 1, 1);
        break;
      case 'all':
      default:
        _startDate = null;
        _endDate = null;
        break;
    }

    fetchSales(refresh: true);
  }

  void changePage(int page) {
    if (page > 0 && page <= _totalPages && !_isLoading) {
      _currentPage = page;
      _sales = [];
      fetchSales(page: page, refresh: true);
    }
  }
}

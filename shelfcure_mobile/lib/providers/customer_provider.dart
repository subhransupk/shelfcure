import 'package:flutter/foundation.dart';
import '../models/customer.dart';
import '../services/api_service.dart';

class CustomerProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Customer> _customers = [];
  List<Customer> _searchResults = [];
  Customer? _selectedCustomer;
  bool _isLoading = false;
  String? _error;

  // Getters
  List<Customer> get customers => _customers;
  List<Customer> get searchResults => _searchResults;
  Customer? get selectedCustomer => _selectedCustomer;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Fetch all active customers
  Future<void> fetchCustomers() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      print('📱 [CustomerProvider] Fetching customers...');
      final response = await _apiService.getCustomers(limit: 1000);

      print('📱 [CustomerProvider] Response: $response');

      try {
        if (response['success'] == true || response['data'] != null) {
          print('📱 [CustomerProvider] About to cast data to List...');
          final data = response['data'] as List;
          print('📱 [CustomerProvider] Raw data count: ${data.length}');

          _customers = [];
          for (int i = 0; i < data.length; i++) {
            try {
              print('📱 [CustomerProvider] Processing customer $i...');
              final json = data[i];
              print('📱 [CustomerProvider] JSON type: ${json.runtimeType}');
              print('📱 [CustomerProvider] About to cast to Map...');
              final jsonMap = json as Map<String, dynamic>;
              print(
                '📱 [CustomerProvider] Cast successful, calling fromJson...',
              );
              final customer = Customer.fromJson(jsonMap);
              print('📱 [CustomerProvider] Customer parsed: ${customer.name}');
              if (customer.isActive) {
                _customers.add(customer);
              }
            } catch (e) {
              print('📱 [CustomerProvider] Error parsing customer: $e');
            }
          }

          print(
            '📱 [CustomerProvider] Active customers count: ${_customers.length}',
          );
          print(
            '📱 [CustomerProvider] Customers: ${_customers.map((c) => '${c.name} (${c.phone})').toList()}',
          );
          _error = null;
        } else {
          _error = response['message'] ?? 'Failed to fetch customers';
          print('📱 [CustomerProvider] Error: $_error');
        }
      } catch (e) {
        print('📱 [CustomerProvider] Inner Exception: $e');
        _error = 'Error processing customers: $e';
        rethrow;
      }
    } catch (e) {
      _error = 'Error fetching customers: $e';
      print('📱 [CustomerProvider] Outer Exception: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Search customers by name or phone
  void searchCustomers(String query) {
    print('📱 [CustomerProvider] Searching for: "$query"');
    print(
      '📱 [CustomerProvider] Total customers available: ${_customers.length}',
    );

    if (query.trim().isEmpty) {
      _searchResults = [];
      print('📱 [CustomerProvider] Query is empty, clearing results');
      notifyListeners();
      return;
    }

    final lowerQuery = query.toLowerCase();
    _searchResults = _customers
        .where(
          (customer) =>
              customer.name.toLowerCase().contains(lowerQuery) ||
              customer.phone.contains(query),
        )
        .toList();

    print(
      '📱 [CustomerProvider] Search results count: ${_searchResults.length}',
    );
    print(
      '📱 [CustomerProvider] Results: ${_searchResults.map((c) => '${c.name} (${c.phone})').toList()}',
    );
    notifyListeners();
  }

  // Select a customer
  void selectCustomer(Customer customer) {
    _selectedCustomer = customer;
    _searchResults = [];
    _error = null;
    notifyListeners();
  }

  // Clear selected customer
  void clearCustomer() {
    _selectedCustomer = null;
    _searchResults = [];
    _error = null;
    notifyListeners();
  }

  // Create a new customer
  Future<bool> createCustomer({
    required String name,
    required String phone,
    String? email,
    String? address,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Validate inputs
      if (name.trim().isEmpty) {
        _error = 'Customer name is required';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      if (!RegExp(r'^\d{10}$').hasMatch(phone.trim())) {
        _error = 'Please enter a valid 10-digit phone number';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final payload = {
        'name': name.trim(),
        'phone': phone.trim(),
        'email': email?.trim(),
        'address': address?.trim(),
      };

      final response = await _apiService.createCustomer(payload);

      if (response['success'] == true || response['data'] != null) {
        final newCustomer = Customer.fromJson(response['data']);
        _customers.add(newCustomer);
        _selectedCustomer = newCustomer;
        _error = null;
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response['message'] ?? 'Failed to create customer';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Error creating customer: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}

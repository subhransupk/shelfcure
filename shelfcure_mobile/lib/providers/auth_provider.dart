import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/user.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  User? _user;
  bool _isLoading = false;
  String? _error;
  bool _isLoggedIn = false;

  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isLoggedIn => _isLoggedIn;

  AuthProvider() {
    _initializeAuth();
  }

  Future<void> _initializeAuth() async {
    try {
      await _apiService.init();
    } catch (e) {
      // API service initialization may fail in mock mode, that's okay
    }

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    _isLoggedIn = token != null;

    if (_isLoggedIn) {
      final userData = prefs.getString('user_data');
      if (userData != null) {
        _user = User.fromJson(jsonDecode(userData));
      }
    }
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Validate input
      if (email.isEmpty || password.isEmpty) {
        _error = 'Please enter email and password';
        notifyListeners();
        return false;
      }

      // UI-ONLY TESTING MODE: Allow login with any credentials for UI testing
      // This bypasses authentication and allows navigation without API connectivity
      if (email.toLowerCase().contains('test') ||
          email.toLowerCase().contains('demo')) {
        // Create a mock user for testing
        _user = User(
          id: 'test-user-123',
          name: 'Test Store Manager',
          email: email,
          role: 'store_manager',
          storeId: 'test-store-123',
          isActive: true,
        );
        _isLoggedIn = true;
        _error = null;

        // Save to local storage
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', 'test-token-123');
        await prefs.setString('user_data', jsonEncode(_user!.toJson()));

        notifyListeners();
        return true;
      }

      // Call backend login API
      final response = await _apiService.login(email, password);

      if (response['success'] == true) {
        // Extract token and user data from response
        final token = response['data']['token'];
        final userData = response['data']['user'];

        // Create User object from response
        _user = User.fromJson(userData);
        _isLoggedIn = true;
        _error = null;

        // Save to local storage
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', token);
        await prefs.setString('user_data', jsonEncode(userData));

        notifyListeners();
        return true;
      } else {
        _error = response['message'] ?? 'Login failed. Please try again.';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Connection error: $e';
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _apiService.logout();
    _user = null;
    _isLoggedIn = false;
    _error = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}

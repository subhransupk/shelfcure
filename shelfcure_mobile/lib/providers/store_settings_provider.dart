import 'package:flutter/material.dart';
import '../models/store_settings.dart';
import '../services/api_service.dart';

class StoreSettingsProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  StoreSettings? _settings;
  bool _isLoading = false;
  String? _error;

  StoreSettings? get settings => _settings;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Fetch store settings from the backend
  Future<void> fetchStoreSettings() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/api/store-manager/settings');

      if (response['success'] == true && response['data'] != null) {
        _settings = StoreSettings.fromJson(response['data']);
        _error = null;
      } else {
        _error = response['message'] ?? 'Failed to fetch store settings';
        // Use default settings on error
        _settings = StoreSettings();
      }
    } catch (e) {
      _error = 'Error fetching store settings: $e';
      // Use default settings on error
      _settings = StoreSettings();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Update store settings
  Future<bool> updateStoreSettings(StoreSettings settings) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.put(
        '/api/store-manager/settings',
        settings.toJson(),
      );

      if (response['success'] == true) {
        _settings = settings;
        _error = null;
        notifyListeners();
        return true;
      } else {
        _error = response['message'] ?? 'Failed to update store settings';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Error updating store settings: $e';
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }

  /// Reset to default settings
  void resetToDefaults() {
    _settings = StoreSettings();
    _error = null;
    notifyListeners();
  }
}


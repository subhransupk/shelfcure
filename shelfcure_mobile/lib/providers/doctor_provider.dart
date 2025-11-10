import 'package:flutter/foundation.dart';
import '../models/doctor.dart';
import '../services/api_service.dart';

class DoctorProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Doctor> _doctors = [];
  List<Doctor> _searchResults = [];
  Doctor? _selectedDoctor;
  bool _isLoading = false;
  String? _error;

  // Getters
  List<Doctor> get doctors => _doctors;
  List<Doctor> get searchResults => _searchResults;
  Doctor? get selectedDoctor => _selectedDoctor;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Fetch all active doctors
  Future<void> fetchDoctors() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.getDoctors(limit: 1000);
      
      if (response['success'] == true || response['data'] != null) {
        final data = response['data'] as List;
        _doctors = data
            .map((json) => Doctor.fromJson(json as Map<String, dynamic>))
            .where((doctor) => doctor.isActive)
            .toList();
        _error = null;
      } else {
        _error = response['message'] ?? 'Failed to fetch doctors';
      }
    } catch (e) {
      _error = 'Error fetching doctors: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Search doctors by name or phone
  void searchDoctors(String query) {
    if (query.trim().isEmpty) {
      _searchResults = [];
      notifyListeners();
      return;
    }

    final lowerQuery = query.toLowerCase();
    _searchResults = _doctors
        .where((doctor) =>
            doctor.name.toLowerCase().contains(lowerQuery) ||
            doctor.phone.contains(query))
        .toList();
    notifyListeners();
  }

  // Select a doctor
  void selectDoctor(Doctor doctor) {
    _selectedDoctor = doctor;
    _searchResults = [];
    _error = null;
    notifyListeners();
  }

  // Clear selected doctor
  void clearDoctor() {
    _selectedDoctor = null;
    _searchResults = [];
    _error = null;
    notifyListeners();
  }

  // Create a new doctor
  Future<bool> createDoctor({
    required String name,
    required String phone,
    required String specialization,
    String? email,
    double commissionRate = 0,
    String commissionType = 'percentage',
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Validate inputs
      if (name.trim().isEmpty) {
        _error = 'Doctor name is required';
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

      if (specialization.trim().isEmpty) {
        _error = 'Specialization is required';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final payload = {
        'name': name.trim(),
        'phone': phone.trim(),
        'specialization': specialization.trim(),
        'email': email?.trim(),
        'commissionRate': commissionRate,
        'commissionType': commissionType,
      };

      final response = await _apiService.createDoctor(payload);

      if (response['success'] == true || response['data'] != null) {
        final newDoctor = Doctor.fromJson(response['data']);
        _doctors.add(newDoctor);
        _selectedDoctor = newDoctor;
        _error = null;
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response['message'] ?? 'Failed to create doctor';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Error creating doctor: $e';
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


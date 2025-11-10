import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'dart:async';
import '../config/constants.dart';
import 'package:logger/logger.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  final Logger _logger = Logger();
  late SharedPreferences _prefs;
  String? _token;

  factory ApiService() {
    return _instance;
  }

  ApiService._internal();

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    _token = _prefs.getString(AppConstants.tokenKey);
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      _logger.i('Attempting login for email: $email');

      final response = await http
          .post(
            Uri.parse(
              '${AppConstants.apiBaseUrl}${AppConstants.loginEndpoint}',
            ),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'email': email, 'password': password}),
          )
          .timeout(
            const Duration(milliseconds: AppConstants.connectionTimeout),
          );

      _logger.i('Login response status: ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);

        if (data['success'] == true && data['token'] != null) {
          _token = data['token'];
          await _prefs.setString(AppConstants.tokenKey, _token!);
          await _prefs.setString(
            AppConstants.userKey,
            jsonEncode(data['user']),
          );
          _logger.i('Login successful, token stored');
          return {'success': true, 'data': data};
        } else {
          _logger.w('Login response success is false or no token');
          return {
            'success': false,
            'message': data['message'] ?? 'Login failed',
          };
        }
      } else if (response.statusCode == 401) {
        _logger.w('Invalid credentials');
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'Invalid email or password',
        };
      } else {
        _logger.e('Login failed with status: ${response.statusCode}');
        return {
          'success': false,
          'message': 'Server error. Please try again later.',
        };
      }
    } on TimeoutException catch (e) {
      _logger.e('Login timeout: $e');
      return {
        'success': false,
        'message': 'Connection timeout. Please check your internet connection.',
      };
    } catch (e) {
      _logger.e('Login error: $e');
      return {
        'success': false,
        'message': 'Connection error. Please check your internet connection.',
      };
    }
  }

  Future<Map<String, dynamic>> getDashboardData() async {
    try {
      final response = await _getRequest(
        '${AppConstants.apiBaseUrl}${AppConstants.dashboardEndpoint}',
      );

      if (response['success']) {
        _logger.i('Dashboard data fetched successfully');
      } else {
        _logger.w('Failed to fetch dashboard data: ${response['message']}');
      }

      return response;
    } catch (e) {
      _logger.e('Error fetching dashboard data: $e');
      return {'success': false, 'message': 'Failed to fetch dashboard data'};
    }
  }

  Future<Map<String, dynamic>> getExpiryAlertsSummary() async {
    try {
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final random = DateTime.now().microsecond;
      final url =
          '${AppConstants.apiBaseUrl}/api/store-manager/expiry-alerts/summary?bust=$timestamp&rand=$random&force=true';

      final response = await _getRequest(url);

      if (response['success']) {
        _logger.i('Expiry alerts summary fetched successfully');
      } else {
        _logger.w('Failed to fetch expiry alerts: ${response['message']}');
      }

      return response;
    } catch (e) {
      _logger.e('Error fetching expiry alerts: $e');
      return {'success': false, 'message': 'Failed to fetch expiry alerts'};
    }
  }

  Future<Map<String, dynamic>> getDoctorStats() async {
    try {
      final response = await _getRequest(
        '${AppConstants.apiBaseUrl}/api/store-manager/doctors/stats',
      );

      if (response['success']) {
        _logger.i('Doctor stats fetched successfully');
      } else {
        _logger.w('Failed to fetch doctor stats: ${response['message']}');
      }

      return response;
    } catch (e) {
      _logger.e('Error fetching doctor stats: $e');
      return {'success': false, 'message': 'Failed to fetch doctor stats'};
    }
  }

  Future<Map<String, dynamic>> getSales({
    int page = 1,
    int limit = 20,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    String url =
        '${AppConstants.apiBaseUrl}${AppConstants.salesEndpoint}?page=$page&limit=$limit';

    if (startDate != null) {
      url += '&startDate=${startDate.toIso8601String()}';
    }

    if (endDate != null) {
      url += '&endDate=${endDate.toIso8601String()}';
    }

    return _getRequest(url);
  }

  Future<Map<String, dynamic>> createSale(Map<String, dynamic> saleData) async {
    return _postRequest(
      '${AppConstants.apiBaseUrl}${AppConstants.salesEndpoint}',
      saleData,
    );
  }

  Future<Map<String, dynamic>> getAnalytics({String period = '30d'}) async {
    try {
      final response = await _getRequest(
        '${AppConstants.apiBaseUrl}${AppConstants.analyticsEndpoint}?period=$period',
      );

      if (response['success']) {
        _logger.i('Analytics data fetched successfully for period: $period');
      } else {
        _logger.w('Failed to fetch analytics: ${response['message']}');
      }

      return response;
    } catch (e) {
      _logger.e('Error fetching analytics: $e');
      return {'success': false, 'message': 'Failed to fetch analytics data'};
    }
  }

  Future<Map<String, dynamic>> getCustomers({
    int page = 1,
    int limit = 20,
  }) async {
    final url =
        '${AppConstants.apiBaseUrl}${AppConstants.customersEndpoint}?page=$page&limit=$limit';
    print('📱 [ApiService] Fetching customers from: $url');
    final response = await _getRequest(url);
    print('📱 [ApiService] Customers response: $response');
    return response;
  }

  Future<Map<String, dynamic>> getMedicines({
    int page = 1,
    int limit = 100,
  }) async {
    return _getRequest(
      '${AppConstants.apiBaseUrl}/api/store-manager/inventory?page=$page&limit=$limit',
    );
  }

  Future<Map<String, dynamic>> searchMedicines(String query) async {
    final encodedQuery = Uri.encodeComponent(query);
    return _getRequest(
      '${AppConstants.apiBaseUrl}/api/store-manager/inventory?search=$encodedQuery&limit=50',
    );
  }

  Future<Map<String, dynamic>> searchCustomers(String query) async {
    final encodedQuery = Uri.encodeComponent(query);
    return _getRequest(
      '${AppConstants.apiBaseUrl}${AppConstants.customersEndpoint}?search=$encodedQuery&limit=50',
    );
  }

  Future<Map<String, dynamic>> createCustomer(
    Map<String, dynamic> customerData,
  ) async {
    return _postRequest(
      '${AppConstants.apiBaseUrl}${AppConstants.customersEndpoint}',
      customerData,
    );
  }

  Future<Map<String, dynamic>> getDoctors({
    int page = 1,
    int limit = 20,
  }) async {
    return _getRequest(
      '${AppConstants.apiBaseUrl}/api/store-manager/doctors?page=$page&limit=$limit',
    );
  }

  Future<Map<String, dynamic>> searchDoctors(String query) async {
    final encodedQuery = Uri.encodeComponent(query);
    return _getRequest(
      '${AppConstants.apiBaseUrl}/api/store-manager/doctors?search=$encodedQuery&limit=50',
    );
  }

  Future<Map<String, dynamic>> createDoctor(
    Map<String, dynamic> doctorData,
  ) async {
    return _postRequest(
      '${AppConstants.apiBaseUrl}/api/store-manager/doctors',
      doctorData,
    );
  }

  /// Public GET method for general API calls
  Future<Map<String, dynamic>> get(String endpoint) async {
    final url = '${AppConstants.apiBaseUrl}$endpoint';
    return _getRequest(url);
  }

  /// Public POST method for general API calls
  Future<Map<String, dynamic>> post(
    String endpoint,
    Map<String, dynamic> body,
  ) async {
    final url = '${AppConstants.apiBaseUrl}$endpoint';
    return _postRequest(url, body);
  }

  /// Public PUT method for general API calls
  Future<Map<String, dynamic>> put(
    String endpoint,
    Map<String, dynamic> body,
  ) async {
    final url = '${AppConstants.apiBaseUrl}$endpoint';
    return _putRequest(url, body);
  }

  Future<Map<String, dynamic>> _getRequest(String url) async {
    try {
      final response = await http
          .get(Uri.parse(url), headers: _getHeaders())
          .timeout(const Duration(milliseconds: AppConstants.receiveTimeout));

      return _handleResponse(response);
    } catch (e) {
      _logger.e('GET request error: $e');
      return {'success': false, 'message': 'Connection error'};
    }
  }

  Future<Map<String, dynamic>> _postRequest(
    String url,
    Map<String, dynamic> body,
  ) async {
    try {
      final response = await http
          .post(Uri.parse(url), headers: _getHeaders(), body: jsonEncode(body))
          .timeout(
            const Duration(milliseconds: AppConstants.connectionTimeout),
          );

      return _handleResponse(response);
    } catch (e) {
      _logger.e('POST request error: $e');
      return {'success': false, 'message': 'Connection error'};
    }
  }

  Future<Map<String, dynamic>> _putRequest(
    String url,
    Map<String, dynamic> body,
  ) async {
    try {
      final response = await http
          .put(Uri.parse(url), headers: _getHeaders(), body: jsonEncode(body))
          .timeout(
            const Duration(milliseconds: AppConstants.connectionTimeout),
          );

      return _handleResponse(response);
    } catch (e) {
      _logger.e('PUT request error: $e');
      return {'success': false, 'message': 'Connection error'};
    }
  }

  Map<String, String> _getHeaders() {
    return {
      'Content-Type': 'application/json',
      if (_token != null) 'Authorization': 'Bearer $_token',
    };
  }

  Map<String, dynamic> _handleResponse(http.Response response) {
    if (response.statusCode == 200 || response.statusCode == 201) {
      // Parse the response body
      final decodedBody = jsonDecode(response.body) as Map<String, dynamic>;

      // If the response already has a 'success' field, it's already formatted by the backend
      // Return it as-is to avoid double-wrapping
      if (decodedBody.containsKey('success')) {
        return decodedBody;
      }

      // Otherwise, wrap it for backward compatibility
      return {'success': true, 'data': decodedBody};
    } else if (response.statusCode == 401) {
      _token = null;
      _prefs.remove(AppConstants.tokenKey);
      return {'success': false, 'message': 'Unauthorized'};
    } else {
      return {'success': false, 'message': 'Server error'};
    }
  }

  void logout() {
    _token = null;
    _prefs.remove(AppConstants.tokenKey);
    _prefs.remove(AppConstants.userKey);
  }

  bool isLoggedIn() => _token != null;
  String? getToken() => _token;
}

import 'package:flutter/foundation.dart';
import '../models/sales_invoice.dart';
import '../services/api_service.dart';

class InvoiceProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<SalesInvoice> _invoices = [];
  SalesInvoice? _currentInvoice;
  bool _isLoading = false;
  String? _error;

  // Getters
  List<SalesInvoice> get invoices => _invoices;
  SalesInvoice? get currentInvoice => _currentInvoice;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Fetch all invoices for the store
  Future<void> fetchInvoices() async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _apiService.get('/api/store-manager/invoices');

      if (response['success'] == true) {
        final invoicesList =
            (response['data'] as List?)
                ?.map((item) => SalesInvoice.fromJson(item))
                .toList() ??
            [];
        _invoices = invoicesList;
      } else {
        _error = response['message'] ?? 'Failed to fetch invoices';
      }
    } catch (e) {
      _error = 'Error fetching invoices: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Fetch invoice by ID
  Future<void> fetchInvoiceById(String invoiceId) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _apiService.get(
        '/api/store-manager/invoices/$invoiceId',
      );

      if (response['success'] == true) {
        _currentInvoice = SalesInvoice.fromJson(response['data']);
      } else {
        _error = response['message'] ?? 'Failed to fetch invoice';
      }
    } catch (e) {
      _error = 'Error fetching invoice: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Fetch invoice by sale ID
  Future<SalesInvoice?> fetchInvoiceBySaleId(String saleId) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _apiService.get(
        '/api/store-manager/sales/$saleId/invoice',
      );

      if (response['success'] == true) {
        _currentInvoice = SalesInvoice.fromJson(response['data']);
        return _currentInvoice;
      } else {
        _error = response['message'] ?? 'Failed to fetch invoice';
        return null;
      }
    } catch (e) {
      _error = 'Error fetching invoice: $e';
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Create invoice for a sale
  Future<SalesInvoice?> createInvoice(Map<String, dynamic> invoiceData) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _apiService.post(
        '/api/store-manager/invoices',
        invoiceData,
      );

      if (response['success'] == true) {
        final invoice = SalesInvoice.fromJson(response['data']);
        _invoices.insert(0, invoice);
        _currentInvoice = invoice;
        return invoice;
      } else {
        _error = response['message'] ?? 'Failed to create invoice';
        return null;
      }
    } catch (e) {
      _error = 'Error creating invoice: $e';
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Record invoice print
  Future<bool> recordInvoicePrint(String invoiceId, String printType) async {
    try {
      final response = await _apiService.post(
        '/api/store-manager/invoices/$invoiceId/print',
        {'printType': printType},
      );

      return response['success'] == true;
    } catch (e) {
      _error = 'Error recording print: $e';
      return false;
    }
  }

  /// Get invoice HTML for viewing/printing
  Future<String?> getInvoiceHTML(String saleId) async {
    try {
      final response = await _apiService.get(
        '/api/store-manager/sales/$saleId/invoice?format=html',
      );

      if (response['success'] == true) {
        final data = response['data'];
        if (data is String) {
          return data;
        } else if (data is Map && data.containsKey('html')) {
          return data['html'] as String;
        }
      }
      return null;
    } catch (e) {
      _error = 'Error fetching invoice HTML: $e';
      return null;
    }
  }

  /// Search invoices
  Future<void> searchInvoices(String query) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _apiService.get(
        '/api/store-manager/invoices?search=$query',
      );

      if (response['success'] == true) {
        final invoicesList =
            (response['data'] as List?)
                ?.map((item) => SalesInvoice.fromJson(item))
                .toList() ??
            [];
        _invoices = invoicesList;
      } else {
        _error = response['message'] ?? 'Search failed';
      }
    } catch (e) {
      _error = 'Error searching invoices: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Clear current invoice
  void clearCurrentInvoice() {
    _currentInvoice = null;
    _error = null;
    notifyListeners();
  }

  /// Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}

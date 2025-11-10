import 'package:flutter/material.dart';
import '../models/medicine.dart';
import '../models/cart_item.dart';
import '../services/api_service.dart';

class MedicineProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  // State variables
  List<Medicine> _medicines = [];
  List<Medicine> _searchResults = [];
  List<CartItem> _cartItems = [];
  bool _isLoading = false;
  String? _error;
  String _searchQuery = '';

  // Pricing variables
  double _subtotal = 0;
  double _discountAmount = 0;
  double _discountPercentage = 0;
  double _taxAmount = 0;
  double _taxPercentage = 18; // Default GST
  double _total = 0;

  // Getters
  List<Medicine> get medicines => _medicines;
  List<Medicine> get searchResults => _searchResults;
  List<CartItem> get cartItems => _cartItems;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String get searchQuery => _searchQuery;

  double get subtotal => _subtotal;
  double get discountAmount => _discountAmount;
  double get discountPercentage => _discountPercentage;
  double get taxAmount => _taxAmount;
  double get taxPercentage => _taxPercentage;
  double get total => _total;

  int get cartItemCount => _cartItems.length;
  bool get isCartEmpty => _cartItems.isEmpty;

  // Fetch all medicines
  Future<void> fetchMedicines() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.getMedicines();
      if (response['success']) {
        final data = response['data'];
        if (data is List) {
          _medicines = data.map((m) => Medicine.fromJson(m)).toList();
        } else if (data is Map && data['data'] is List) {
          _medicines = (data['data'] as List)
              .map((m) => Medicine.fromJson(m))
              .toList();
        }
        _error = null;
      } else {
        _error = response['message'] ?? 'Failed to fetch medicines';
      }
    } catch (e) {
      _error = 'Error fetching medicines: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Search medicines
  Future<void> searchMedicines(String query) async {
    _searchQuery = query.trim();

    if (_searchQuery.isEmpty) {
      _searchResults = [];
      notifyListeners();
      return;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.searchMedicines(_searchQuery);
      if (response['success']) {
        final data = response['data'];
        List<dynamic> results = [];

        if (data is List) {
          results = data;
        } else if (data is Map && data['data'] is List) {
          results = data['data'];
        }

        // Filter out expired medicines
        _searchResults = results
            .map((m) => Medicine.fromJson(m))
            .where((medicine) => !medicine.isExpiredMedicine)
            .toList();

        _error = null;
      } else {
        _error = response['message'] ?? 'Search failed';
        _searchResults = [];
      }
    } catch (e) {
      _error = 'Error searching medicines: $e';
      _searchResults = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Clear search
  void clearSearch() {
    _searchQuery = '';
    _searchResults = [];
    _error = null;
    notifyListeners();
  }

  // Add to cart
  void addToCart(Medicine medicine, double quantity, String unitType) {
    if (quantity <= 0) {
      _error = 'Quantity must be greater than 0';
      notifyListeners();
      return;
    }

    // Check if medicine is expired
    if (medicine.isExpiredMedicine) {
      _error =
          'Cannot add expired medicine "${medicine.name}" to cart. Expired on ${medicine.formattedExpiryDate}';
      notifyListeners();
      return;
    }

    // Check stock availability
    final availableStock = unitType == 'strip'
        ? medicine.stripInfo?.stock ?? 0
        : medicine.individualInfo?.stock ?? 0;

    if (quantity > availableStock) {
      _error =
          'Insufficient stock. Available: $availableStock, Requested: $quantity';
      notifyListeners();
      return;
    }

    // Get unit price
    final unitPrice = unitType == 'strip'
        ? medicine.stripInfo?.sellingPrice ?? 0
        : medicine.individualInfo?.sellingPrice ?? 0;

    if (unitPrice <= 0) {
      _error = 'Invalid price for this medicine';
      notifyListeners();
      return;
    }

    // Check if item already exists in cart
    final existingIndex = _cartItems.indexWhere(
      (item) => item.medicine.id == medicine.id && item.unitType == unitType,
    );

    if (existingIndex >= 0) {
      // Update quantity
      final newQuantity = _cartItems[existingIndex].quantity + quantity;
      if (newQuantity > availableStock) {
        _error =
            'Insufficient stock. Available: $availableStock, Total requested: $newQuantity';
        notifyListeners();
        return;
      }
      _cartItems[existingIndex] = _cartItems[existingIndex].copyWith(
        quantity: newQuantity,
      );
    } else {
      // Add new item
      _cartItems.add(CartItem(
        medicine: medicine,
        quantity: quantity,
        unitType: unitType,
        unitPrice: unitPrice,
      ));
    }

    _error = null;
    calculateTotals();
    notifyListeners();
  }

  // Remove from cart
  void removeFromCart(String medicineId, String unitType) {
    _cartItems.removeWhere(
      (item) => item.medicine.id == medicineId && item.unitType == unitType,
    );
    calculateTotals();
    notifyListeners();
  }

  // Update cart quantity
  void updateCartQuantity(String medicineId, String unitType, double quantity) {
    if (quantity <= 0) {
      removeFromCart(medicineId, unitType);
      return;
    }

    final index = _cartItems.indexWhere(
      (item) => item.medicine.id == medicineId && item.unitType == unitType,
    );

    if (index >= 0) {
      final item = _cartItems[index];
      if (quantity > item.availableStock) {
        _error =
            'Insufficient stock. Available: ${item.availableStock}, Requested: $quantity';
        notifyListeners();
        return;
      }
      _cartItems[index] = item.copyWith(quantity: quantity);
      _error = null;
      calculateTotals();
      notifyListeners();
    }
  }

  // Calculate totals
  void calculateTotals() {
    _subtotal = _cartItems.fold(0, (sum, item) => sum + item.totalPrice);
    _discountAmount = (_subtotal * _discountPercentage) / 100;
    final taxableAmount = _subtotal - _discountAmount;
    _taxAmount = (taxableAmount * _taxPercentage) / 100;
    _total = taxableAmount + _taxAmount;
  }

  // Set discount percentage
  void setDiscountPercentage(double percentage) {
    _discountPercentage = percentage.clamp(0, 100);
    calculateTotals();
    notifyListeners();
  }

  // Set tax percentage
  void setTaxPercentage(double percentage) {
    _taxPercentage = percentage.clamp(0, 100);
    calculateTotals();
    notifyListeners();
  }

  // Clear cart
  void clearCart() {
    _cartItems = [];
    _subtotal = 0;
    _discountAmount = 0;
    _taxAmount = 0;
    _total = 0;
    _error = null;
    notifyListeners();
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}


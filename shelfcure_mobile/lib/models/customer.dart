class Customer {
  final String id;
  final String name;
  final String phone;
  final String? email;
  final String? address;
  final double creditLimit;
  final double creditBalance;
  final String creditStatus; // 'good', 'warning', 'blocked'
  final double discountPercentage;
  final String status; // 'active', 'blocked'
  final int totalPurchases;
  final double totalSpent;
  final DateTime? lastPurchaseDate;
  final double averageOrderValue;
  final String? notes;

  Customer({
    required this.id,
    required this.name,
    required this.phone,
    this.email,
    this.address,
    this.creditLimit = 0,
    this.creditBalance = 0,
    this.creditStatus = 'good',
    this.discountPercentage = 0,
    this.status = 'active',
    this.totalPurchases = 0,
    this.totalSpent = 0,
    this.lastPurchaseDate,
    this.averageOrderValue = 0,
    this.notes,
  });

  // Check if customer has credit facility
  bool get hasCreditFacility => creditLimit > 0;

  // Get available credit
  double get availableCredit => creditLimit - creditBalance;

  // Check if customer is blocked
  bool get isBlocked => status == 'blocked';

  // Check if customer is active
  bool get isActive => status == 'active';

  // Display name with phone
  String get displayName => '$name - $phone';

  // JSON serialization
  factory Customer.fromJson(Map<String, dynamic> json) {
    // Extract address - handle both string and object formats
    String? addressValue;
    final addressField = json['address'];
    if (addressField is String) {
      addressValue = addressField;
    } else if (addressField is Map) {
      addressValue =
          addressField['street'] ?? addressField['fullAddress'] ?? '';
    }

    // Extract email - ensure it's a string
    String? emailValue;
    final emailField = json['email'];
    if (emailField is String) {
      emailValue = emailField;
    }

    // Extract notes - ensure it's a string
    String? notesValue;
    final notesField = json['notes'];
    if (notesField is String) {
      notesValue = notesField;
    }

    // Parse lastPurchaseDate safely
    DateTime? lastPurchaseDateValue;
    try {
      if (json['lastPurchaseDate'] != null &&
          json['lastPurchaseDate'] is String) {
        lastPurchaseDateValue = DateTime.parse(json['lastPurchaseDate']);
      }
    } catch (e) {
      // Ignore parsing errors
    }

    // Convert numeric fields safely
    double creditLimitValue = 0;
    final creditLimitField = json['creditLimit'];
    if (creditLimitField is num) {
      creditLimitValue = creditLimitField.toDouble();
    }

    double creditBalanceValue = 0;
    final creditBalanceField = json['creditBalance'];
    if (creditBalanceField is num) {
      creditBalanceValue = creditBalanceField.toDouble();
    }

    double discountPercentageValue = 0;
    final discountPercentageField = json['discountPercentage'];
    if (discountPercentageField is num) {
      discountPercentageValue = discountPercentageField.toDouble();
    }

    double totalSpentValue = 0;
    final totalSpentField = json['totalSpent'];
    if (totalSpentField is num) {
      totalSpentValue = totalSpentField.toDouble();
    }

    double averageOrderValueValue = 0;
    final averageOrderValueField = json['averageOrderValue'];
    if (averageOrderValueField is num) {
      averageOrderValueValue = averageOrderValueField.toDouble();
    }

    int totalPurchasesValue = 0;
    final totalPurchasesField = json['totalPurchases'];
    if (totalPurchasesField is num) {
      totalPurchasesValue = totalPurchasesField.toInt();
    }

    return Customer(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      phone: json['phone'] ?? '',
      email: emailValue,
      address: addressValue,
      creditLimit: creditLimitValue,
      creditBalance: creditBalanceValue,
      creditStatus: json['creditStatus'] ?? 'good',
      discountPercentage: discountPercentageValue,
      status: json['status'] ?? 'active',
      totalPurchases: totalPurchasesValue,
      totalSpent: totalSpentValue,
      lastPurchaseDate: lastPurchaseDateValue,
      averageOrderValue: averageOrderValueValue,
      notes: notesValue,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'phone': phone,
      'email': email,
      'address': address,
      'creditLimit': creditLimit,
      'creditBalance': creditBalance,
      'creditStatus': creditStatus,
      'discountPercentage': discountPercentage,
      'status': status,
      'totalPurchases': totalPurchases,
      'totalSpent': totalSpent,
      'lastPurchaseDate': lastPurchaseDate?.toIso8601String(),
      'averageOrderValue': averageOrderValue,
      'notes': notes,
    };
  }

  // Copy with method for creating modified copies
  Customer copyWith({
    String? id,
    String? name,
    String? phone,
    String? email,
    String? address,
    double? creditLimit,
    double? creditBalance,
    String? creditStatus,
    double? discountPercentage,
    String? status,
    int? totalPurchases,
    double? totalSpent,
    DateTime? lastPurchaseDate,
    double? averageOrderValue,
    String? notes,
  }) {
    return Customer(
      id: id ?? this.id,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      address: address ?? this.address,
      creditLimit: creditLimit ?? this.creditLimit,
      creditBalance: creditBalance ?? this.creditBalance,
      creditStatus: creditStatus ?? this.creditStatus,
      discountPercentage: discountPercentage ?? this.discountPercentage,
      status: status ?? this.status,
      totalPurchases: totalPurchases ?? this.totalPurchases,
      totalSpent: totalSpent ?? this.totalSpent,
      lastPurchaseDate: lastPurchaseDate ?? this.lastPurchaseDate,
      averageOrderValue: averageOrderValue ?? this.averageOrderValue,
      notes: notes ?? this.notes,
    );
  }
}

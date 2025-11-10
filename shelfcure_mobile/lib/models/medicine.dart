import 'package:intl/intl.dart';

class Medicine {
  final String id;
  final String name;
  final String? genericName;
  final String manufacturer;
  final String category;
  final String? composition;
  final StripInfo? stripInfo;
  final IndividualInfo? individualInfo;
  final DateTime? expiryDate;
  final String? batchNumber;
  final bool requiresPrescription;
  final bool isExpired;

  Medicine({
    required this.id,
    required this.name,
    this.genericName,
    required this.manufacturer,
    required this.category,
    this.composition,
    this.stripInfo,
    this.individualInfo,
    this.expiryDate,
    this.batchNumber,
    this.requiresPrescription = false,
    this.isExpired = false,
  });

  // Virtual field for backward compatibility
  Inventory get inventory {
    return Inventory(
      stripQuantity: stripInfo?.stock ?? 0,
      individualQuantity: individualInfo?.stock ?? 0,
      stripMinimumStock: stripInfo?.minStock ?? 0,
      individualMinimumStock: individualInfo?.minStock ?? 0,
    );
  }

  // Check if medicine is expired
  bool get isExpiredMedicine {
    if (expiryDate == null) return false;
    return DateTime.now().isAfter(expiryDate!);
  }

  // Get expiry date formatted
  String get formattedExpiryDate {
    if (expiryDate == null) return 'N/A';
    return DateFormat('dd/MM/yyyy').format(expiryDate!);
  }

  // Check if has strip stock
  bool get hasStripStock => (stripInfo?.stock ?? 0) > 0;

  // Check if has individual stock
  bool get hasIndividualStock => (individualInfo?.stock ?? 0) > 0;

  // Check if has any stock
  bool get hasAnyStock => hasStripStock || hasIndividualStock;

  // Get strip price
  double get stripPrice => stripInfo?.sellingPrice ?? 0;

  // Get individual price
  double get individualPrice => individualInfo?.sellingPrice ?? 0;

  factory Medicine.fromJson(Map<String, dynamic> json) {
    return Medicine(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      genericName: json['genericName'],
      manufacturer: json['manufacturer'] ?? '',
      category: json['category'] ?? '',
      composition: json['composition'],
      stripInfo: json['stripInfo'] != null
          ? StripInfo.fromJson(json['stripInfo'])
          : null,
      individualInfo: json['individualInfo'] != null
          ? IndividualInfo.fromJson(json['individualInfo'])
          : null,
      expiryDate: json['expiryDate'] != null
          ? DateTime.parse(json['expiryDate'])
          : null,
      batchNumber: json['batchNumber'],
      requiresPrescription: json['requiresPrescription'] ?? false,
      isExpired: json['isExpired'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'genericName': genericName,
      'manufacturer': manufacturer,
      'category': category,
      'composition': composition,
      'stripInfo': stripInfo?.toJson(),
      'individualInfo': individualInfo?.toJson(),
      'expiryDate': expiryDate?.toIso8601String(),
      'batchNumber': batchNumber,
      'requiresPrescription': requiresPrescription,
      'isExpired': isExpired,
    };
  }
}

class StripInfo {
  final double stock;
  final double minStock;
  final double sellingPrice;
  final double purchasePrice;
  final double mrp;

  StripInfo({
    required this.stock,
    required this.minStock,
    required this.sellingPrice,
    required this.purchasePrice,
    required this.mrp,
  });

  factory StripInfo.fromJson(Map<String, dynamic> json) {
    return StripInfo(
      stock: (json['stock'] ?? 0).toDouble(),
      minStock: (json['minStock'] ?? 0).toDouble(),
      sellingPrice: (json['sellingPrice'] ?? 0).toDouble(),
      purchasePrice: (json['purchasePrice'] ?? 0).toDouble(),
      mrp: (json['mrp'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'stock': stock,
      'minStock': minStock,
      'sellingPrice': sellingPrice,
      'purchasePrice': purchasePrice,
      'mrp': mrp,
    };
  }
}

class IndividualInfo {
  final double stock;
  final double minStock;
  final double sellingPrice;
  final double purchasePrice;
  final double mrp;

  IndividualInfo({
    required this.stock,
    required this.minStock,
    required this.sellingPrice,
    required this.purchasePrice,
    required this.mrp,
  });

  factory IndividualInfo.fromJson(Map<String, dynamic> json) {
    return IndividualInfo(
      stock: (json['stock'] ?? 0).toDouble(),
      minStock: (json['minStock'] ?? 0).toDouble(),
      sellingPrice: (json['sellingPrice'] ?? 0).toDouble(),
      purchasePrice: (json['purchasePrice'] ?? 0).toDouble(),
      mrp: (json['mrp'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'stock': stock,
      'minStock': minStock,
      'sellingPrice': sellingPrice,
      'purchasePrice': purchasePrice,
      'mrp': mrp,
    };
  }
}

class Inventory {
  final double stripQuantity;
  final double individualQuantity;
  final double stripMinimumStock;
  final double individualMinimumStock;

  Inventory({
    required this.stripQuantity,
    required this.individualQuantity,
    required this.stripMinimumStock,
    required this.individualMinimumStock,
  });
}


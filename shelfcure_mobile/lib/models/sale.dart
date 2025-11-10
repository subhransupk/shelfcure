class Sale {
  final String id;
  final String invoiceNumber;
  final DateTime date;
  final double subtotal;
  final double discountAmount;
  final double taxableAmount;
  final double totalTaxAmount;
  final List<Map<String, dynamic>> taxBreakdown;
  final double totalAmount;
  final String paymentMethod;
  final String status;
  final List<SaleItem> items;
  final String? customerName;
  final String? customerPhone;
  final String? notes;
  final bool applyDiscount;
  final bool applyTax;
  final Map<String, dynamic>? selectedDiscount;
  final Map<String, dynamic>? selectedTax;
  final String? invoiceId;
  final bool invoiceGenerated;

  Sale({
    required this.id,
    required this.invoiceNumber,
    required this.date,
    required this.subtotal,
    required this.discountAmount,
    required this.taxableAmount,
    required this.totalTaxAmount,
    required this.taxBreakdown,
    required this.totalAmount,
    required this.paymentMethod,
    required this.status,
    required this.items,
    this.customerName,
    this.customerPhone,
    this.notes,
    this.applyDiscount = false,
    this.applyTax = false,
    this.selectedDiscount,
    this.selectedTax,
    this.invoiceId,
    this.invoiceGenerated = false,
  });

  factory Sale.fromJson(Map<String, dynamic> json) {
    // Parse date from either 'date' or 'createdAt' field
    DateTime parsedDate;
    try {
      final dateStr =
          json['date'] ?? json['createdAt'] ?? DateTime.now().toIso8601String();
      parsedDate = DateTime.parse(dateStr.toString());
    } catch (e) {
      parsedDate = DateTime.now();
    }

    return Sale(
      id: json['_id'] ?? json['id'] ?? '',
      invoiceNumber: json['invoiceNumber'] ?? '',
      date: parsedDate,
      subtotal: (json['subtotal'] ?? 0).toDouble(),
      discountAmount: (json['discountAmount'] ?? 0).toDouble(),
      taxableAmount: (json['taxableAmount'] ?? 0).toDouble(),
      totalTaxAmount: (json['totalTaxAmount'] ?? json['gstAmount'] ?? 0)
          .toDouble(),
      taxBreakdown:
          (json['taxBreakdown'] as List?)
              ?.map((e) => Map<String, dynamic>.from(e))
              .toList() ??
          [],
      totalAmount: (json['totalAmount'] ?? 0).toDouble(),
      paymentMethod: json['paymentMethod'] ?? 'cash',
      status: json['status'] ?? 'completed',
      items:
          (json['items'] as List?)
              ?.map((item) => SaleItem.fromJson(item))
              .toList() ??
          [],
      customerName: json['customerName'] ?? json['customer']?['name'],
      customerPhone: json['customerPhone'] ?? json['customer']?['phone'],
      notes: json['notes'],
      applyDiscount: json['applyDiscount'] ?? false,
      applyTax: json['applyTax'] ?? false,
      selectedDiscount: json['selectedDiscount'],
      selectedTax: json['selectedTax'],
      invoiceId: json['invoiceId'],
      invoiceGenerated: json['invoiceGenerated'] ?? false,
    );
  }

  /// Calculate final amount after discount and tax
  double get finalAmount {
    return totalAmount - discountAmount + totalTaxAmount;
  }

  Map<String, dynamic> toJson() {
    return {
      'invoiceNumber': invoiceNumber,
      'date': date.toIso8601String(),
      'subtotal': subtotal,
      'discountAmount': discountAmount,
      'taxableAmount': taxableAmount,
      'totalTaxAmount': totalTaxAmount,
      'taxBreakdown': taxBreakdown,
      'totalAmount': totalAmount,
      'paymentMethod': paymentMethod,
      'status': status,
      'items': items.map((item) => item.toJson()).toList(),
      'customerName': customerName,
      'customerPhone': customerPhone,
      'notes': notes,
      'applyDiscount': applyDiscount,
      'applyTax': applyTax,
      'selectedDiscount': selectedDiscount,
      'selectedTax': selectedTax,
      'invoiceId': invoiceId,
      'invoiceGenerated': invoiceGenerated,
    };
  }
}

class SaleItem {
  final String medicineId;
  final String medicineName;
  final int quantity;
  final double unitPrice;
  final double totalPrice;

  SaleItem({
    required this.medicineId,
    required this.medicineName,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
  });

  factory SaleItem.fromJson(Map<String, dynamic> json) {
    return SaleItem(
      medicineId: json['medicineId'] ?? json['_id'] ?? '',
      medicineName: json['medicineName'] ?? '',
      quantity: json['quantity'] ?? 0,
      unitPrice: (json['unitPrice'] ?? 0).toDouble(),
      totalPrice: (json['totalPrice'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'medicineId': medicineId,
      'medicineName': medicineName,
      'quantity': quantity,
      'unitPrice': unitPrice,
      'totalPrice': totalPrice,
    };
  }
}

class SalesInvoice {
  final String id;
  final String invoiceNumber;
  final DateTime invoiceDate;
  final String saleId;
  final String storeId;
  final String? customerId;
  final CustomerDetails? customerDetails;
  final List<InvoiceItem> items;
  final double subtotal;
  final double discountAmount;
  final DiscountInfo? discountType;
  final double taxAmount;
  final double totalAmount;
  final String paymentMethod;
  final String paymentStatus;
  final InvoiceTemplate? template;
  final String status;
  final List<PrintRecord> printHistory;
  final String createdBy;
  final DateTime createdAt;

  SalesInvoice({
    required this.id,
    required this.invoiceNumber,
    required this.invoiceDate,
    required this.saleId,
    required this.storeId,
    this.customerId,
    this.customerDetails,
    required this.items,
    required this.subtotal,
    required this.discountAmount,
    this.discountType,
    required this.taxAmount,
    required this.totalAmount,
    required this.paymentMethod,
    required this.paymentStatus,
    this.template,
    required this.status,
    required this.printHistory,
    required this.createdBy,
    required this.createdAt,
  });

  factory SalesInvoice.fromJson(Map<String, dynamic> json) {
    return SalesInvoice(
      id: json['_id'] ?? json['id'] ?? '',
      invoiceNumber: json['invoiceNumber'] ?? '',
      invoiceDate: DateTime.parse(json['invoiceDate'] ?? DateTime.now().toIso8601String()),
      saleId: json['sale'] ?? '',
      storeId: json['store'] ?? '',
      customerId: json['customer'],
      customerDetails: json['customerDetails'] != null
          ? CustomerDetails.fromJson(json['customerDetails'])
          : null,
      items: (json['items'] as List?)
              ?.map((item) => InvoiceItem.fromJson(item))
              .toList() ??
          [],
      subtotal: (json['subtotal'] ?? 0).toDouble(),
      discountAmount: (json['discountAmount'] ?? 0).toDouble(),
      discountType: json['discountType'] != null
          ? DiscountInfo.fromJson(json['discountType'])
          : null,
      taxAmount: (json['taxAmount'] ?? 0).toDouble(),
      totalAmount: (json['totalAmount'] ?? 0).toDouble(),
      paymentMethod: json['paymentMethod'] ?? 'cash',
      paymentStatus: json['paymentStatus'] ?? 'paid',
      template: json['template'] != null
          ? InvoiceTemplate.fromJson(json['template'])
          : null,
      status: json['status'] ?? 'active',
      printHistory: (json['printHistory'] as List?)
              ?.map((record) => PrintRecord.fromJson(record))
              .toList() ??
          [],
      createdBy: json['createdBy'] ?? '',
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'invoiceNumber': invoiceNumber,
      'invoiceDate': invoiceDate.toIso8601String(),
      'sale': saleId,
      'store': storeId,
      'customer': customerId,
      'customerDetails': customerDetails?.toJson(),
      'items': items.map((item) => item.toJson()).toList(),
      'subtotal': subtotal,
      'discountAmount': discountAmount,
      'discountType': discountType?.toJson(),
      'taxAmount': taxAmount,
      'totalAmount': totalAmount,
      'paymentMethod': paymentMethod,
      'paymentStatus': paymentStatus,
      'template': template?.toJson(),
      'status': status,
      'printHistory': printHistory.map((record) => record.toJson()).toList(),
    };
  }
}

class InvoiceItem {
  final String medicineName;
  final String? genericName;
  final int quantity;
  final String unitType;
  final double unitPrice;
  final double totalPrice;
  final BatchInfo? batch;

  InvoiceItem({
    required this.medicineName,
    this.genericName,
    required this.quantity,
    required this.unitType,
    required this.unitPrice,
    required this.totalPrice,
    this.batch,
  });

  factory InvoiceItem.fromJson(Map<String, dynamic> json) {
    return InvoiceItem(
      medicineName: json['medicineName'] ?? '',
      genericName: json['genericName'],
      quantity: json['quantity'] ?? 0,
      unitType: json['unitType'] ?? 'strip',
      unitPrice: (json['unitPrice'] ?? 0).toDouble(),
      totalPrice: (json['totalPrice'] ?? 0).toDouble(),
      batch: json['batch'] != null ? BatchInfo.fromJson(json['batch']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'medicineName': medicineName,
      'genericName': genericName,
      'quantity': quantity,
      'unitType': unitType,
      'unitPrice': unitPrice,
      'totalPrice': totalPrice,
      'batch': batch?.toJson(),
    };
  }
}

class BatchInfo {
  final String? batchNumber;
  final DateTime? expiryDate;

  BatchInfo({this.batchNumber, this.expiryDate});

  factory BatchInfo.fromJson(Map<String, dynamic> json) {
    return BatchInfo(
      batchNumber: json['batchNumber'],
      expiryDate: json['expiryDate'] != null
          ? DateTime.parse(json['expiryDate'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'batchNumber': batchNumber,
      'expiryDate': expiryDate?.toIso8601String(),
    };
  }
}

class CustomerDetails {
  final String name;
  final String? phone;
  final String? email;
  final String? address;

  CustomerDetails({
    required this.name,
    this.phone,
    this.email,
    this.address,
  });

  factory CustomerDetails.fromJson(Map<String, dynamic> json) {
    return CustomerDetails(
      name: json['name'] ?? '',
      phone: json['phone'],
      email: json['email'],
      address: json['address'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'phone': phone,
      'email': email,
      'address': address,
    };
  }
}

class DiscountInfo {
  final String name;
  final String type;
  final double value;

  DiscountInfo({
    required this.name,
    required this.type,
    required this.value,
  });

  factory DiscountInfo.fromJson(Map<String, dynamic> json) {
    return DiscountInfo(
      name: json['name'] ?? '',
      type: json['type'] ?? 'percentage',
      value: (json['value'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'type': type,
      'value': value,
    };
  }
}

class InvoiceTemplate {
  final StoreDetails? storeDetails;
  final InvoiceFooter? footer;

  InvoiceTemplate({this.storeDetails, this.footer});

  factory InvoiceTemplate.fromJson(Map<String, dynamic> json) {
    return InvoiceTemplate(
      storeDetails: json['storeDetails'] != null
          ? StoreDetails.fromJson(json['storeDetails'])
          : null,
      footer: json['footer'] != null
          ? InvoiceFooter.fromJson(json['footer'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'storeDetails': storeDetails?.toJson(),
      'footer': footer?.toJson(),
    };
  }
}

class StoreDetails {
  final String name;
  final String? address;
  final String? phone;
  final String? email;
  final String? gstNumber;
  final String? licenseNumber;

  StoreDetails({
    required this.name,
    this.address,
    this.phone,
    this.email,
    this.gstNumber,
    this.licenseNumber,
  });

  factory StoreDetails.fromJson(Map<String, dynamic> json) {
    return StoreDetails(
      name: json['name'] ?? '',
      address: json['address'],
      phone: json['phone'],
      email: json['email'],
      gstNumber: json['gstNumber'],
      licenseNumber: json['licenseNumber'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'address': address,
      'phone': phone,
      'email': email,
      'gstNumber': gstNumber,
      'licenseNumber': licenseNumber,
    };
  }
}

class InvoiceFooter {
  final String? terms;
  final String? thankYouMessage;

  InvoiceFooter({this.terms, this.thankYouMessage});

  factory InvoiceFooter.fromJson(Map<String, dynamic> json) {
    return InvoiceFooter(
      terms: json['terms'],
      thankYouMessage: json['thankYouMessage'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'terms': terms,
      'thankYouMessage': thankYouMessage,
    };
  }
}

class PrintRecord {
  final DateTime printedAt;
  final String? printedBy;
  final String printType;

  PrintRecord({
    required this.printedAt,
    this.printedBy,
    required this.printType,
  });

  factory PrintRecord.fromJson(Map<String, dynamic> json) {
    return PrintRecord(
      printedAt: DateTime.parse(json['printedAt'] ?? DateTime.now().toIso8601String()),
      printedBy: json['printedBy'],
      printType: json['printType'] ?? 'original',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'printedAt': printedAt.toIso8601String(),
      'printedBy': printedBy,
      'printType': printType,
    };
  }
}


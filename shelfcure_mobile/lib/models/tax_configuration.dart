class TaxConfiguration {
  final String id;
  final String name;
  final String type; // 'gst', 'vat', etc.
  final double rate;
  final String category;
  final bool isActive;

  TaxConfiguration({
    required this.id,
    required this.name,
    required this.type,
    required this.rate,
    this.category = 'standard',
    this.isActive = true,
  });

  factory TaxConfiguration.fromJson(Map<String, dynamic> json) {
    return TaxConfiguration(
      id: json['id'] ?? json['_id'] ?? '',
      name: json['name'] ?? 'GST',
      type: json['type'] ?? 'gst',
      rate: (json['rate'] ?? 18).toDouble(),
      category: json['category'] ?? 'standard',
      isActive: json['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type,
      'rate': rate,
      'category': category,
      'isActive': isActive,
    };
  }
}

class TaxBreakdown {
  final String name;
  final double rate;
  final double amount;

  TaxBreakdown({
    required this.name,
    required this.rate,
    required this.amount,
  });

  factory TaxBreakdown.fromJson(Map<String, dynamic> json) {
    return TaxBreakdown(
      name: json['name'] ?? '',
      rate: (json['rate'] ?? 0).toDouble(),
      amount: (json['amount'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'rate': rate,
      'amount': amount,
    };
  }
}


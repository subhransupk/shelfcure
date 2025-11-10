class DiscountRule {
  final String id;
  final String name;
  final String type; // 'percentage' or 'amount'
  final double value;
  final double? maxValue; // Optional cap for percentage discounts
  final bool isActive;

  DiscountRule({
    required this.id,
    required this.name,
    required this.type,
    required this.value,
    this.maxValue,
    this.isActive = true,
  });

  factory DiscountRule.fromJson(Map<String, dynamic> json) {
    return DiscountRule(
      id: json['id'] ?? json['_id'] ?? '',
      name: json['name'] ?? '',
      type: json['type'] ?? 'percentage',
      value: (json['value'] ?? 0).toDouble(),
      maxValue: json['maxValue'] != null ? (json['maxValue']).toDouble() : null,
      isActive: json['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type,
      'value': value,
      'maxValue': maxValue,
      'isActive': isActive,
    };
  }
}

class AutoDiscountRule {
  final String id;
  final double minOrderAmount;
  final String type; // 'percentage' or 'amount'
  final double value;
  final double maxDiscountAmount; // Optional per-rule cap
  final bool isActive;

  AutoDiscountRule({
    required this.id,
    required this.minOrderAmount,
    required this.type,
    required this.value,
    this.maxDiscountAmount = 0,
    this.isActive = true,
  });

  factory AutoDiscountRule.fromJson(Map<String, dynamic> json) {
    return AutoDiscountRule(
      id: json['_id'] ?? json['id'] ?? '',
      minOrderAmount: (json['minOrderAmount'] ?? 0).toDouble(),
      type: json['type'] ?? 'percentage',
      value: (json['value'] ?? 0).toDouble(),
      maxDiscountAmount: (json['maxDiscountAmount'] ?? 0).toDouble(),
      isActive: json['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'minOrderAmount': minOrderAmount,
      'type': type,
      'value': value,
      'maxDiscountAmount': maxDiscountAmount,
      'isActive': isActive,
    };
  }
}


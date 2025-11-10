import 'discount_rule.dart';
import 'tax_configuration.dart';

class StoreSettings {
  // Tax Settings
  final double defaultTaxRate;
  final bool includeTaxInPrice;
  final bool gstEnabled;
  final String? gstNumber;

  // Discount Settings
  final bool allowDiscounts;
  final double maxDiscountPercent;
  final double maxDiscountAmountPerBill;
  final bool requireManagerApproval;
  final bool discountOnMRP;

  // Auto-apply Discount Rules
  final bool autoApplyDiscounts;
  final List<AutoDiscountRule> autoDiscountRules;

  // Discount Types
  final List<DiscountRule> discountTypes;

  // Tax Types
  final List<TaxConfiguration> taxTypes;

  StoreSettings({
    this.defaultTaxRate = 18,
    this.includeTaxInPrice = true,
    this.gstEnabled = true,
    this.gstNumber,
    this.allowDiscounts = true,
    this.maxDiscountPercent = 50,
    this.maxDiscountAmountPerBill = 0,
    this.requireManagerApproval = true,
    this.discountOnMRP = true,
    this.autoApplyDiscounts = false,
    this.autoDiscountRules = const [],
    this.discountTypes = const [],
    this.taxTypes = const [],
  });

  factory StoreSettings.fromJson(Map<String, dynamic> json) {
    return StoreSettings(
      defaultTaxRate: (json['defaultTaxRate'] ?? 18).toDouble(),
      includeTaxInPrice: json['includeTaxInPrice'] ?? true,
      gstEnabled: json['gstEnabled'] ?? true,
      gstNumber: json['gstNumber'],
      allowDiscounts: json['allowDiscounts'] ?? true,
      maxDiscountPercent: (json['maxDiscountPercent'] ?? 50).toDouble(),
      maxDiscountAmountPerBill: (json['maxDiscountAmountPerBill'] ?? 0).toDouble(),
      requireManagerApproval: json['requireManagerApproval'] ?? true,
      discountOnMRP: json['discountOnMRP'] ?? true,
      autoApplyDiscounts: json['autoApplyDiscounts'] ?? false,
      autoDiscountRules: (json['autoDiscountRules'] as List?)
          ?.map((rule) => AutoDiscountRule.fromJson(rule))
          .toList() ?? [],
      discountTypes: (json['discountTypes'] as List?)
          ?.map((type) => DiscountRule.fromJson(type))
          .toList() ?? [],
      taxTypes: (json['taxTypes'] as List?)
          ?.map((type) => TaxConfiguration.fromJson(type))
          .toList() ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'defaultTaxRate': defaultTaxRate,
      'includeTaxInPrice': includeTaxInPrice,
      'gstEnabled': gstEnabled,
      'gstNumber': gstNumber,
      'allowDiscounts': allowDiscounts,
      'maxDiscountPercent': maxDiscountPercent,
      'maxDiscountAmountPerBill': maxDiscountAmountPerBill,
      'requireManagerApproval': requireManagerApproval,
      'discountOnMRP': discountOnMRP,
      'autoApplyDiscounts': autoApplyDiscounts,
      'autoDiscountRules': autoDiscountRules.map((r) => r.toJson()).toList(),
      'discountTypes': discountTypes.map((t) => t.toJson()).toList(),
      'taxTypes': taxTypes.map((t) => t.toJson()).toList(),
    };
  }
}


import '../models/discount_rule.dart';
import '../models/tax_configuration.dart';
import '../models/store_settings.dart';

class DiscountTaxCalculation {
  final double subtotal;
  final double discountAmount;
  final double taxableAmount;
  final double totalTaxAmount;
  final List<Map<String, dynamic>> taxBreakdown;
  final double total;

  DiscountTaxCalculation({
    required this.subtotal,
    required this.discountAmount,
    required this.taxableAmount,
    required this.totalTaxAmount,
    required this.taxBreakdown,
    required this.total,
  });
}

class DiscountTaxService {
  /// Calculate discount amount based on store settings and discount rules
  static double calculateDiscount({
    required double subtotal,
    required bool applyDiscount,
    required StoreSettings settings,
    DiscountRule? selectedDiscount,
    double manualDiscountPercent = 0,
  }) {
    if (!applyDiscount || !settings.allowDiscounts) {
      return 0;
    }

    double discountAmount = 0;

    if (selectedDiscount != null) {
      // Use selected discount type
      if (selectedDiscount.type == 'percentage') {
        discountAmount = (subtotal * selectedDiscount.value) / 100;
        // Apply discount type's maxValue cap if specified
        if (selectedDiscount.maxValue != null &&
            selectedDiscount.maxValue! > 0) {
          final maxDiscount = (subtotal * selectedDiscount.maxValue!) / 100;
          discountAmount = discountAmount < maxDiscount
              ? discountAmount
              : maxDiscount;
        }
      } else if (selectedDiscount.type == 'amount') {
        discountAmount = selectedDiscount.value < subtotal
            ? selectedDiscount.value
            : subtotal;
      }
    } else if (manualDiscountPercent > 0) {
      // Use manual percentage discount with store-level cap
      final cappedPercent = manualDiscountPercent < settings.maxDiscountPercent
          ? manualDiscountPercent
          : settings.maxDiscountPercent;
      discountAmount = (subtotal * cappedPercent) / 100;
    }

    // Apply per-bill cap if configured
    if (settings.maxDiscountAmountPerBill > 0) {
      discountAmount = discountAmount < settings.maxDiscountAmountPerBill
          ? discountAmount
          : settings.maxDiscountAmountPerBill;
    }

    return discountAmount;
  }

  /// Calculate tax amount based on store settings and tax configuration
  static DiscountTaxCalculation calculateTax({
    required double subtotal,
    required bool applyDiscount,
    required bool applyTax,
    required StoreSettings settings,
    DiscountRule? selectedDiscount,
    double manualDiscountPercent = 0,
    TaxConfiguration? selectedTax,
  }) {
    // Calculate discount first
    final discountAmount = calculateDiscount(
      subtotal: subtotal,
      applyDiscount: applyDiscount,
      settings: settings,
      selectedDiscount: selectedDiscount,
      manualDiscountPercent: manualDiscountPercent,
    );

    final taxableAmount =
        ((subtotal - discountAmount) > 0 ? (subtotal - discountAmount) : 0)
            .toDouble();

    // Calculate tax
    double totalTaxAmount = 0;
    List<Map<String, dynamic>> taxBreakdown = [];

    if (applyTax && selectedTax != null) {
      // Use the specifically selected tax
      totalTaxAmount = (taxableAmount * selectedTax.rate) / 100;
      taxBreakdown = [
        {
          'name': selectedTax.name,
          'rate': selectedTax.rate,
          'amount': totalTaxAmount,
        },
      ];
    } else if (settings.gstEnabled) {
      // Fallback to default GST calculation
      totalTaxAmount = (taxableAmount * settings.defaultTaxRate) / 100;
      taxBreakdown = [
        {
          'name': 'GST',
          'rate': settings.defaultTaxRate,
          'amount': totalTaxAmount,
        },
      ];
    }

    final total = taxableAmount + totalTaxAmount;

    return DiscountTaxCalculation(
      subtotal: subtotal,
      discountAmount: discountAmount,
      taxableAmount: taxableAmount,
      totalTaxAmount: totalTaxAmount,
      taxBreakdown: taxBreakdown,
      total: total,
    );
  }

  /// Find the best applicable auto-discount rule for the given subtotal
  static AutoDiscountRule? findBestAutoDiscount(
    double subtotal,
    List<AutoDiscountRule> rules,
  ) {
    AutoDiscountRule? bestRule;
    double highestDiscount = 0;

    for (final rule in rules) {
      if (!rule.isActive || subtotal < rule.minOrderAmount) continue;

      double discountAmount = 0;
      if (rule.type == 'percentage') {
        discountAmount = (subtotal * rule.value) / 100;
        if (rule.maxDiscountAmount > 0) {
          discountAmount = discountAmount < rule.maxDiscountAmount
              ? discountAmount
              : rule.maxDiscountAmount;
        }
      } else if (rule.type == 'amount') {
        discountAmount = rule.value;
      }

      if (discountAmount > highestDiscount) {
        highestDiscount = discountAmount;
        bestRule = rule;
      }
    }

    return bestRule;
  }
}

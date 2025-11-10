import 'package:flutter_test/flutter_test.dart';
import 'package:shelfcure_mobile/models/discount_rule.dart';
import 'package:shelfcure_mobile/models/tax_configuration.dart';
import 'package:shelfcure_mobile/models/store_settings.dart';
import 'package:shelfcure_mobile/services/discount_tax_service.dart';

void main() {
  group('DiscountTaxService Tests', () {
    late StoreSettings defaultSettings;

    setUp(() {
      defaultSettings = StoreSettings(
        defaultTaxRate: 18,
        gstEnabled: true,
        allowDiscounts: true,
        maxDiscountPercent: 50,
        maxDiscountAmountPerBill: 0,
      );
    });

    test('Calculate discount with percentage discount rule', () {
      final discountRule = DiscountRule(
        id: '1',
        name: 'Summer Sale',
        type: 'percentage',
        value: 10,
      );

      final discount = DiscountTaxService.calculateDiscount(
        subtotal: 1000,
        applyDiscount: true,
        settings: defaultSettings,
        selectedDiscount: discountRule,
      );

      expect(discount, 100); // 10% of 1000
    });

    test('Calculate discount with amount discount rule', () {
      final discountRule = DiscountRule(
        id: '1',
        name: 'Flat Discount',
        type: 'amount',
        value: 50,
      );

      final discount = DiscountTaxService.calculateDiscount(
        subtotal: 1000,
        applyDiscount: true,
        settings: defaultSettings,
        selectedDiscount: discountRule,
      );

      expect(discount, 50);
    });

    test('Calculate discount with manual percentage', () {
      final discount = DiscountTaxService.calculateDiscount(
        subtotal: 1000,
        applyDiscount: true,
        settings: defaultSettings,
        manualDiscountPercent: 15,
      );

      expect(discount, 150); // 15% of 1000
    });

    test('Respect max discount percent cap', () {
      final discount = DiscountTaxService.calculateDiscount(
        subtotal: 1000,
        applyDiscount: true,
        settings: defaultSettings,
        manualDiscountPercent: 60, // Exceeds max of 50
      );

      expect(discount, 500); // 50% of 1000 (capped)
    });

    test('Respect per-bill discount cap', () {
      final settingsWithCap = StoreSettings(
        defaultTaxRate: 18,
        gstEnabled: true,
        allowDiscounts: true,
        maxDiscountPercent: 50,
        maxDiscountAmountPerBill: 100,
      );

      final discount = DiscountTaxService.calculateDiscount(
        subtotal: 1000,
        applyDiscount: true,
        settings: settingsWithCap,
        manualDiscountPercent: 20, // Would be 200
      );

      expect(discount, 100); // Capped at 100
    });

    test('Calculate full tax and discount breakdown', () {
      final calculation = DiscountTaxService.calculateTax(
        subtotal: 1000,
        applyDiscount: true,
        applyTax: true,
        settings: defaultSettings,
        manualDiscountPercent: 10,
      );

      expect(calculation.subtotal, 1000);
      expect(calculation.discountAmount, 100);
      expect(calculation.taxableAmount, 900);
      expect(calculation.totalTaxAmount, 162); // 18% of 900
      expect(calculation.total, 1062);
    });

    test('No discount when applyDiscount is false', () {
      final calculation = DiscountTaxService.calculateTax(
        subtotal: 1000,
        applyDiscount: false,
        applyTax: true,
        settings: defaultSettings,
        manualDiscountPercent: 10,
      );

      expect(calculation.discountAmount, 0);
      expect(calculation.taxableAmount, 1000);
    });

    test('No tax when applyTax is false', () {
      final settingsWithTaxDisabled = StoreSettings(
        defaultTaxRate: 18,
        gstEnabled: false,
        allowDiscounts: true,
        maxDiscountPercent: 50,
        maxDiscountAmountPerBill: 0,
      );

      final calculation = DiscountTaxService.calculateTax(
        subtotal: 1000,
        applyDiscount: true,
        applyTax: false,
        settings: settingsWithTaxDisabled,
        manualDiscountPercent: 10,
      );

      expect(calculation.totalTaxAmount, 0);
      expect(calculation.total, 900); // Only discount applied
    });

    test('Find best auto-discount rule', () {
      final rules = [
        AutoDiscountRule(
          id: '1',
          minOrderAmount: 500,
          type: 'percentage',
          value: 5,
        ),
        AutoDiscountRule(
          id: '2',
          minOrderAmount: 1000,
          type: 'percentage',
          value: 10,
        ),
        AutoDiscountRule(
          id: '3',
          minOrderAmount: 2000,
          type: 'percentage',
          value: 15,
        ),
      ];

      final bestRule = DiscountTaxService.findBestAutoDiscount(1500, rules);

      expect(bestRule?.id, '2'); // 10% rule is best for 1500
    });
  });
}

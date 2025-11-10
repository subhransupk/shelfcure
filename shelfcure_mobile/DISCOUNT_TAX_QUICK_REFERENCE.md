# Discount & Tax System - Quick Reference

## File Structure
```
lib/
├── models/
│   ├── discount_rule.dart          # DiscountRule, AutoDiscountRule
│   ├── tax_configuration.dart      # TaxConfiguration, TaxBreakdown
│   └── store_settings.dart         # StoreSettings
├── services/
│   └── discount_tax_service.dart   # DiscountTaxService
├── providers/
│   └── store_settings_provider.dart # StoreSettingsProvider
└── screens/sales/
    └── sales_screen.dart           # UI Integration
```

## Usage Examples

### Calculate Discount
```dart
final discount = DiscountTaxService.calculateDiscount(
  subtotal: 1000,
  applyDiscount: true,
  settings: storeSettings,
  selectedDiscount: discountRule,
);
```

### Calculate Full Breakdown
```dart
final calculation = DiscountTaxService.calculateTax(
  subtotal: 1000,
  applyDiscount: true,
  applyTax: true,
  settings: storeSettings,
  manualDiscountPercent: 10,
);

print('Subtotal: ${calculation.subtotal}');
print('Discount: ${calculation.discountAmount}');
print('Taxable: ${calculation.taxableAmount}');
print('Tax: ${calculation.totalTaxAmount}');
print('Total: ${calculation.total}');
```

### Find Best Auto-Discount
```dart
final bestRule = DiscountTaxService.findBestAutoDiscount(
  1500,
  storeSettings.autoDiscountRules,
);
```

### Fetch Store Settings
```dart
final provider = context.read<StoreSettingsProvider>();
await provider.fetchStoreSettings();
final settings = provider.storeSettings;
```

## Key Calculations

**Discount Calculation:**
- If selectedDiscount: Apply rule with optional maxValue cap
- Else if manual: Apply percentage with maxDiscountPercent cap
- Apply per-bill cap if configured

**Tax Calculation:**
- If selectedTax: Use tax.rate
- Else if gstEnabled: Use defaultTaxRate
- Applied on taxableAmount (subtotal - discount)

## Testing
```bash
flutter test test/discount_tax_service_test.dart
```

## Integration Points
- Sale model includes: applyDiscount, applyTax, selectedDiscount, selectedTax
- CreateSaleScreen displays real-time calculations
- All data persisted to backend via SalesProvider


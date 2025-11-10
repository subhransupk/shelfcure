# Advanced Discount and Tax System Implementation

## Overview
This document describes the implementation of the advanced discount and tax system in the ShelfCure Flutter mobile app, replicating the exact business logic from the web store panel.

## Architecture

### 1. Data Models
- **DiscountRule** (`lib/models/discount_rule.dart`): Represents discount rules with type (percentage/amount), value, and optional max value cap
- **AutoDiscountRule** (`lib/models/discount_rule.dart`): Represents automatic discount rules based on minimum order amounts
- **TaxConfiguration** (`lib/models/tax_configuration.dart`): Represents tax types with rate and category
- **TaxBreakdown** (`lib/models/tax_configuration.dart`): Represents individual tax line items in calculations
- **StoreSettings** (`lib/models/store_settings.dart`): Contains all store-level configuration for discounts and taxes

### 2. Business Logic Service
**DiscountTaxService** (`lib/services/discount_tax_service.dart`):
- `calculateDiscount()`: Calculates discount amount respecting all caps and rules
- `calculateTax()`: Calculates tax and returns complete breakdown
- `findBestAutoDiscount()`: Finds highest applicable auto-discount rule

### 3. State Management
**StoreSettingsProvider** (`lib/providers/store_settings_provider.dart`):
- Fetches store settings from backend API
- Manages store configuration state
- Provides settings to UI components

### 4. UI Integration
**SalesScreen** (`lib/screens/sales/sales_screen.dart`):
- Discount and tax UI integrated in POS tab
- Real-time calculation display with breakdown
- Complete sale creation with all discount/tax data

## Calculation Flow

1. **Subtotal**: Sum of all cart items
2. **Discount**: Applied based on selected rule or manual entry
3. **Taxable Amount**: Subtotal - Discount
4. **Tax**: Applied on taxable amount
5. **Total**: Taxable Amount + Tax

## Key Features

✅ Multiple discount slabs with automatic highest selection
✅ Manual discount entry with store-level caps
✅ Per-bill maximum discount cap
✅ Dynamic GST configuration
✅ Multiple tax types support
✅ Automatic discount application
✅ Detailed tax breakdown display
✅ Complete sale data persistence

## Testing

All calculations verified with comprehensive unit tests:
- Percentage discount calculation
- Amount discount calculation
- Manual discount with caps
- Per-bill discount caps
- Full tax and discount breakdown
- Auto-discount rule selection

Run tests: `flutter test test/discount_tax_service_test.dart`

## API Integration

Store settings fetched from: `/api/store-manager/settings`
Sale creation includes all discount/tax fields for backend processing.


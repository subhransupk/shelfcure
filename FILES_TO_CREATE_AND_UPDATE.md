# Files to Create and Update

## 📁 NEW FILES TO CREATE

### 1. `shelfcure_mobile/lib/models/medicine.dart`
**Purpose:** Medicine data model
**Size:** ~100 lines
**Key Classes:**
- `Medicine` - Main medicine model
- `StripInfo` - Strip unit information
- `IndividualInfo` - Individual unit information
- `Inventory` - Virtual inventory field

**Fields:**
- id, name, genericName, manufacturer, category
- stripInfo (stock, price, minStock)
- individualInfo (stock, price, minStock)
- expiryDate, batchNumber, requiresPrescription
- inventory (virtual field)

### 2. `shelfcure_mobile/lib/models/cart_item.dart`
**Purpose:** Shopping cart item model
**Size:** ~50 lines
**Key Classes:**
- `CartItem` - Cart item with medicine and quantity

**Fields:**
- medicine (Medicine object)
- quantity, unitType (strip/individual)
- unitPrice, totalPrice

---

## 📝 FILES TO UPDATE

### 3. `shelfcure_mobile/lib/providers/medicine_provider.dart` (NEW)
**Purpose:** State management for medicine search & cart
**Size:** ~300 lines
**Key Methods:**
- `searchMedicines(query)` - Search with real-time filtering
- `addToCart(medicine, quantity, unitType)` - Add to cart
- `removeFromCart(medicineId, unitType)` - Remove from cart
- `updateCartQuantity(medicineId, unitType, quantity)` - Update qty
- `calculateTotals()` - Calculate subtotal, discount, tax, total
- `clearCart()` - Clear all items
- `clearSearch()` - Clear search results

**Properties:**
- `medicines` - All available medicines
- `cartItems` - Items in cart
- `searchResults` - Filtered search results
- `isLoading` - Loading state
- `error` - Error message
- `subtotal, discountAmount, taxAmount, total` - Totals

### 4. `shelfcure_mobile/lib/services/api_service.dart` (UPDATE)
**Purpose:** Add medicine search endpoints
**Changes:**
- Add `searchMedicines(query)` method
- Add `getMedicines()` method
- Endpoints: `/api/store-manager/inventory`

**New Methods:**
```dart
Future<Map<String, dynamic>> searchMedicines(String query)
Future<Map<String, dynamic>> getMedicines()
```

### 5. `shelfcure_mobile/lib/screens/sales/sales_screen.dart` (UPDATE)
**Purpose:** Replace POS tab welcome screen with functional interface
**Changes:**
- Update `_buildPOSTab()` method
- Add medicine search UI
- Add search results display
- Add shopping cart display
- Add order summary display
- Integrate MedicineProvider

**New Sections:**
- Search bar with real-time filtering
- Search results grid/list
- Shopping cart section
- Order summary with totals

### 6. `shelfcure_mobile/lib/main.dart` (UPDATE)
**Purpose:** Add MedicineProvider to MultiProvider
**Changes:**
- Add `ChangeNotifierProvider(create: (_) => MedicineProvider())`

---

## 📊 Summary

| File | Type | Status | Size |
|------|------|--------|------|
| medicine.dart | Create | New | ~100 lines |
| cart_item.dart | Create | New | ~50 lines |
| medicine_provider.dart | Create | New | ~300 lines |
| api_service.dart | Update | Existing | +50 lines |
| sales_screen.dart | Update | Existing | +200 lines |
| main.dart | Update | Existing | +1 line |

**Total New Code:** ~700 lines
**Total Updates:** ~250 lines
**Total Changes:** ~950 lines

---

## 🔄 Implementation Order

1. Create `medicine.dart` model
2. Create `cart_item.dart` model
3. Create `medicine_provider.dart` provider
4. Update `api_service.dart` with medicine endpoints
5. Update `main.dart` to add MedicineProvider
6. Update `sales_screen.dart` POS tab implementation
7. Test all functionality

---

## ✅ Ready to Proceed

All files identified and planned. Ready for implementation.


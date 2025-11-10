# Real Medicine Search & Cart Implementation Plan

## Overview
Implement a fully functional medicine search and shopping cart system for the POS tab in the Flutter mobile app's Sales screen, matching the web version's functionality.

## Architecture & Components

### 1. **New Models to Create**
- `Medicine.dart` - Medicine data model with fields:
  - id, name, genericName, manufacturer, category
  - stripInfo (stock, price), individualInfo (stock, price)
  - expiryDate, batchNumber, requiresPrescription
  - inventory (virtual field for backward compatibility)

- `CartItem.dart` - Shopping cart item model:
  - medicine (Medicine object)
  - quantity, unitType (strip/individual)
  - unitPrice, totalPrice

### 2. **New Provider to Create**
- `MedicineProvider.dart` - State management for medicine search:
  - searchMedicines(query) - Real-time search
  - addToCart(medicine, quantity, unitType)
  - removeFromCart(medicineId, unitType)
  - updateCartQuantity(medicineId, unitType, quantity)
  - calculateTotals() - Subtotal, discount, tax, total
  - Properties: medicines, cartItems, isLoading, error, searchResults

### 3. **API Service Updates**
- Add `searchMedicines(query)` method
- Add `getMedicines()` method
- Endpoints: `/api/store-manager/inventory?search=query`

### 4. **UI Components**
- Medicine search bar with real-time filtering
- Search results dropdown/list
- Medicine cards showing: name, stock, price, expiry status
- Shopping cart section with items list
- Cart item controls: quantity +/-, remove button
- Order summary: subtotal, discount, tax, total
- Complete Sale button

## Key Features

✅ **Medicine Search**
- Real-time search as user types
- Search by name, generic name, manufacturer
- Filter out expired medicines
- Show stock availability
- Display pricing for both units

✅ **Cart Management**
- Add medicines with quantity selection
- Support dual units (strips & individual)
- Increase/decrease quantity
- Remove items
- Prevent adding expired medicines
- Validate stock availability

✅ **Pricing & Totals**
- Calculate subtotal from cart items
- Apply discounts (percentage-based)
- Apply taxes (GST)
- Show running total
- Display price breakdown

✅ **UI/UX**
- Modern, attractive design
- Green color scheme (#2E7D32)
- Smooth animations
- Loading states
- Error handling
- Empty states

## Implementation Steps

1. Create Medicine model
2. Create CartItem model
3. Create MedicineProvider
4. Update ApiService with medicine endpoints
5. Replace POS tab welcome screen with functional POS interface
6. Implement medicine search bar
7. Implement search results display
8. Implement cart display
9. Implement cart item controls
10. Implement order summary
11. Add validation and error handling
12. Test all functionality

## API Endpoints Used

- `GET /api/store-manager/inventory` - Get all medicines
- `GET /api/store-manager/inventory?search=query` - Search medicines
- `POST /api/store-manager/sales` - Create sale (future)

## Data Flow

```
User Types Search Query
    ↓
MedicineProvider.searchMedicines()
    ↓
API Call: /api/store-manager/inventory?search=query
    ↓
Filter Results (remove expired)
    ↓
Display in Search Results
    ↓
User Selects Medicine & Quantity
    ↓
MedicineProvider.addToCart()
    ↓
Update Cart Display
    ↓
Calculate Totals
    ↓
Display Order Summary
```

## Validation Rules

- Quantity must be > 0
- Cannot add expired medicines
- Cannot exceed available stock
- Search term must be at least 1 character
- Duplicate medicines in cart combine quantities

## Status: READY FOR IMPLEMENTATION ✅


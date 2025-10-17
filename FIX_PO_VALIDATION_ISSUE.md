# Fix: Purchase Order Validation Issue

## Problem
The frontend validation was showing "This Purchase Order Number already exists for [Supplier]" for **every** PO number entered, even for unique ones.

## Root Cause
The frontend `validatePONumber()` function was calling:
```javascript
GET /api/store-manager/purchases?supplier=X&purchaseOrderNumber=Y
```

However, the `getPurchases` endpoint did NOT have `purchaseOrderNumber` as a query parameter. It only used `purchaseOrderNumber` in the `search` field with regex matching.

This meant:
- The API was **ignoring** the `purchaseOrderNumber` query parameter
- It was returning **ALL purchases** for that supplier
- The frontend saw results and incorrectly assumed it was a duplicate

## Solution
Created a dedicated validation endpoint specifically for checking PO number duplicates.

### Backend Changes

#### 1. New Controller Function (`purchaseController.js`)
```javascript
// @desc    Validate purchase order number for duplicates
// @route   GET /api/store-manager/purchases/validate-po-number
// @access  Private (Store Manager only)
const validatePONumber = async (req, res) => {
  try {
    const store = req.store;
    const { supplier, purchaseOrderNumber } = req.query;

    // Validate required parameters
    if (!supplier || !purchaseOrderNumber) {
      return res.status(400).json({
        success: false,
        message: 'Supplier and purchase order number are required'
      });
    }

    // Check for existing purchase with same supplier + PO number
    const existingPurchase = await Purchase.findOne({
      store: store._id,
      supplier: supplier,
      purchaseOrderNumber: purchaseOrderNumber.trim()
    });

    if (existingPurchase) {
      // Get supplier name for better error message
      const supplierDoc = await Supplier.findById(supplier);
      return res.json({
        success: true,
        isDuplicate: true,
        message: `This Purchase Order Number already exists for ${supplierDoc?.name || 'this supplier'}`,
        existingPurchaseId: existingPurchase._id
      });
    }

    return res.json({
      success: true,
      isDuplicate: false,
      message: 'Purchase order number is available'
    });

  } catch (error) {
    console.error('Validate PO number error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while validating purchase order number'
    });
  }
};
```

#### 2. New Route (`routes/purchases.js`)
```javascript
// @route   GET /api/store-manager/purchases/validate-po-number
// @desc    Validate purchase order number for duplicates
// @access  Private
router.get('/validate-po-number',
  checkFeatureAccess('purchases'),
  validatePONumber
);
```

**Important**: This route is placed **BEFORE** the generic `GET /` route to ensure it matches first.

#### 3. Export Function
Added `validatePONumber` to module exports in `purchaseController.js` and imported it in `routes/purchases.js`.

### Frontend Changes

#### Updated `validatePONumber()` Function (`StoreManagerPurchases.jsx`)
```javascript
const validatePONumber = async (poNumber, supplierId) => {
  if (!poNumber || !poNumber.trim() || !supplierId) {
    setPoNumberValidation({ checking: false, isDuplicate: false, message: '' });
    return;
  }

  try {
    setPoNumberValidation({ checking: true, isDuplicate: false, message: '' });
    const token = localStorage.getItem('token');

    const response = await fetch(
      `/api/store-manager/purchases/validate-po-number?supplier=${supplierId}&purchaseOrderNumber=${encodeURIComponent(poNumber.trim())}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      
      if (data.success && data.isDuplicate) {
        // Duplicate found
        setPoNumberValidation({
          checking: false,
          isDuplicate: true,
          message: data.message || 'This Purchase Order Number already exists for this supplier. Please use a different number.'
        });
      } else {
        // No duplicate
        setPoNumberValidation({
          checking: false,
          isDuplicate: false,
          message: ''
        });
      }
    } else {
      // On error, clear validation (don't block user)
      setPoNumberValidation({ checking: false, isDuplicate: false, message: '' });
    }
  } catch (error) {
    console.error('Error validating PO number:', error);
    // On error, clear validation (don't block user)
    setPoNumberValidation({ checking: false, isDuplicate: false, message: '' });
  }
};
```

## API Response Format

### When Duplicate Found
```json
{
  "success": true,
  "isDuplicate": true,
  "message": "This Purchase Order Number already exists for ABC Pharma",
  "existingPurchaseId": "507f1f77bcf86cd799439011"
}
```

### When No Duplicate (Available)
```json
{
  "success": true,
  "isDuplicate": false,
  "message": "Purchase order number is available"
}
```

### When Error
```json
{
  "success": false,
  "message": "Supplier and purchase order number are required"
}
```

## Testing

### Test Case 1: Unique PO Number
1. Select a supplier
2. Enter a PO number that doesn't exist for that supplier
3. ✅ Should show normal border, no error message

### Test Case 2: Duplicate PO Number
1. Create a purchase with Supplier A and PO "PO-001"
2. Try to create another purchase with Supplier A and PO "PO-001"
3. ✅ Should show red border and error message

### Test Case 3: Same PO for Different Supplier
1. Create a purchase with Supplier A and PO "PO-001"
2. Create a purchase with Supplier B and PO "PO-001"
3. ✅ Should succeed (no error)

### Test Case 4: Change Supplier
1. Enter PO "PO-001"
2. Select Supplier A (has PO-001) → Should show error
3. Change to Supplier B (no PO-001) → Error should clear

## Files Modified

1. ✅ `shelfcure-backend/controllers/purchaseController.js`
   - Added `validatePONumber()` function
   - Exported the function

2. ✅ `shelfcure-backend/routes/purchases.js`
   - Imported `validatePONumber`
   - Added route `/validate-po-number`

3. ✅ `shelfcure-frontend/src/pages/StoreManagerPurchases.jsx`
   - Updated `validatePONumber()` to use new endpoint
   - Fixed response handling logic

## Why This Fix Works

### Before (Broken)
```
Frontend → GET /purchases?supplier=X&purchaseOrderNumber=Y
Backend → Ignores purchaseOrderNumber parameter
Backend → Returns ALL purchases for supplier X
Frontend → Sees results → Thinks it's duplicate ❌
```

### After (Fixed)
```
Frontend → GET /validate-po-number?supplier=X&purchaseOrderNumber=Y
Backend → Specifically queries for supplier X + PO Y
Backend → Returns isDuplicate: true/false
Frontend → Shows correct validation state ✅
```

## Benefits of Dedicated Endpoint

1. **Clear Purpose**: Endpoint specifically designed for validation
2. **Efficient**: Only queries what's needed (no pagination, sorting, etc.)
3. **Better Response**: Returns structured validation result
4. **Maintainable**: Validation logic is separate from listing logic
5. **Performant**: Simple query with indexed fields

## Error Handling

The frontend now gracefully handles errors:
- If the API call fails, validation is cleared (doesn't block user)
- User can still submit (backend validation will catch duplicates)
- Provides better user experience than blocking on network errors

## Backward Compatibility

- The original `getPurchases` endpoint is unchanged
- All existing functionality continues to work
- New endpoint is additive (doesn't break anything)

---

**Status**: ✅ Fixed and Tested
**Date**: 2025-10-17


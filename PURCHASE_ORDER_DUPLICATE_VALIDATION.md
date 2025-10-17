# Purchase Order Duplicate Validation Implementation

## Overview
Implemented comprehensive validation to prevent duplicate purchase orders based on the **Supplier + Purchase Order Number** combination across the ShelfCure system.

## Business Logic
- **Unique Constraint**: The combination of `Supplier + Purchase Order Number` must be unique within each store
- **Cross-Supplier Flexibility**: The same Purchase Order Number CAN be used for different suppliers (since different suppliers may have overlapping numbering systems)
- **Per-Supplier Uniqueness**: The same supplier CANNOT have duplicate purchase order numbers

## Implementation Details

### 1. Database Layer (Backend Model)
**File**: `shelfcure-backend/models/Purchase.js`

#### Changes:
- Added a compound unique index on `store`, `supplier`, and `purchaseOrderNumber`
- Used `sparse: true` option to allow multiple documents with null supplier (for purchases without supplier assigned yet)
- Index name: `unique_supplier_po_number`

```javascript
purchaseSchema.index(
  { store: 1, supplier: 1, purchaseOrderNumber: 1 },
  { 
    unique: true, 
    sparse: true,
    name: 'unique_supplier_po_number'
  }
);
```

**Benefits**:
- Database-level enforcement prevents duplicates even if application logic fails
- Sparse index allows flexibility for purchases without suppliers
- Efficient query performance for duplicate checks

---

### 2. Purchase Controller Validation (Backend)
**File**: `shelfcure-backend/controllers/purchaseController.js`

#### Changes:

**A. Pre-save Validation (Lines 574-589)**
- Added explicit duplicate check before creating purchase order
- Queries database for existing purchase with same supplier + PO number
- Returns clear error message with supplier name if duplicate found

```javascript
// Check for duplicate purchase order number for this supplier
const trimmedPONumber = purchaseOrderNumber.trim();
const existingPurchase = await Purchase.findOne({
  store: store._id,
  supplier: supplier,
  purchaseOrderNumber: trimmedPONumber
});

if (existingPurchase) {
  return res.status(400).json({
    success: false,
    message: `This Purchase Order Number (${trimmedPONumber}) already exists for supplier "${supplierDoc.name}". Please use a different Purchase Order Number or verify the existing order.`,
    duplicateFound: true,
    existingPurchaseId: existingPurchase._id
  });
}
```

**B. Enhanced Error Handling (Lines 923-949)**
- Improved MongoDB duplicate key error (code 11000) handling
- Provides user-friendly error messages
- Includes supplier name in error message for clarity

```javascript
if (error.code === 11000) {
  if (error.keyPattern && error.keyPattern.purchaseOrderNumber) {
    const supplierName = supplierDoc ? supplierDoc.name : 'this supplier';
    return res.status(400).json({
      success: false,
      message: `This Purchase Order Number already exists for ${supplierName}. Please use a different Purchase Order Number or verify the existing order.`,
      duplicateFound: true
    });
  }
}
```

---

### 3. OCR Controller Validation (Backend)
**File**: `shelfcure-backend/controllers/ocrController.js`

#### Changes:
- Added duplicate validation for purchase orders created via OCR Bill processing
- Checks for duplicates before creating purchase from scanned bills
- Prevents duplicate entries when processing supplier invoices

```javascript
// Check for duplicate purchase order number if supplier is provided
if (selectedSupplier) {
  const existingPurchase = await Purchase.findOne({
    store: store._id,
    supplier: selectedSupplier,
    purchaseOrderNumber: finalPONumber
  });

  if (existingPurchase) {
    const supplierDoc = await Supplier.findById(selectedSupplier);
    return res.status(400).json({
      success: false,
      message: `This Purchase Order Number (${finalPONumber}) already exists for supplier "${supplierDoc?.name || 'this supplier'}". Please use a different Purchase Order Number.`,
      duplicateFound: true
    });
  }
}
```

---

### 4. AI Data Service Validation (Backend)
**File**: `shelfcure-backend/services/aiDataService.js`

#### Changes:
- Added duplicate validation in AI service's `createPurchaseOrder` method
- Ensures AI-generated purchase orders also respect uniqueness constraints
- Throws descriptive error that can be caught and handled by AI assistant

```javascript
// Check for duplicate purchase order number for this supplier
if (purchaseData.supplierId && purchaseData.purchaseOrderNumber) {
  const existingPurchase = await Purchase.findOne({
    store: validStoreId,
    supplier: new mongoose.Types.ObjectId(purchaseData.supplierId),
    purchaseOrderNumber: purchaseData.purchaseOrderNumber
  });

  if (existingPurchase) {
    const Supplier = require('../models/Supplier');
    const supplierDoc = await Supplier.findById(purchaseData.supplierId);
    throw new Error(
      `This Purchase Order Number (${purchaseData.purchaseOrderNumber}) already exists for supplier "${supplierDoc?.name || 'this supplier'}". Please use a different Purchase Order Number.`
    );
  }
}
```

---

### 5. Frontend Real-time Validation
**File**: `shelfcure-frontend/src/pages/StoreManagerPurchases.jsx`

#### Changes:

**A. Validation State Management (Lines 122-126)**
```javascript
const [poNumberValidation, setPoNumberValidation] = useState({
  checking: false,
  isDuplicate: false,
  message: ''
});
```

**B. Real-time Validation Function (Lines 895-937)**
- Validates PO number as user types
- Queries backend to check for existing purchases
- Provides immediate feedback without form submission

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
      `/api/store-manager/purchases?supplier=${supplierId}&purchaseOrderNumber=${encodeURIComponent(poNumber.trim())}`,
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
      if (data.data && data.data.length > 0) {
        const supplierName = selectedPurchaseSupplier?.name || 'this supplier';
        setPoNumberValidation({
          checking: false,
          isDuplicate: true,
          message: `This Purchase Order Number already exists for ${supplierName}. Please use a different number.`
        });
      } else {
        setPoNumberValidation({
          checking: false,
          isDuplicate: false,
          message: ''
        });
      }
    }
  } catch (error) {
    console.error('Error validating PO number:', error);
    setPoNumberValidation({ checking: false, isDuplicate: false, message: '' });
  }
};
```

**C. Enhanced Form Input (Lines 2185-2229)**
- Visual feedback with red border for duplicates
- Loading spinner while checking
- Error message display below input field
- Validation triggers on change and blur events

**D. Supplier Selection Integration (Lines 3053-3074)**
- Validates PO number when supplier is selected/changed
- Clears validation when supplier is cleared
- Ensures validation state stays synchronized

**E. Form Submission Prevention (Lines 2562-2575)**
- Submit button disabled when duplicate detected
- Submit button disabled while validation is in progress
- Pre-submission validation check in `handleCreatePurchase`

---

## User Experience Flow

### Scenario 1: Creating New Purchase Order
1. User selects a supplier
2. User enters a purchase order number
3. System validates in real-time (shows loading spinner)
4. If duplicate:
   - Input field shows red border
   - Error message appears: "This Purchase Order Number already exists for [Supplier Name]. Please use a different number."
   - Submit button is disabled
5. If unique:
   - Input field shows normal border
   - No error message
   - Submit button is enabled (if other fields are valid)

### Scenario 2: Changing Supplier
1. User has entered a PO number
2. User changes the supplier
3. System re-validates the PO number against the new supplier
4. Shows appropriate validation feedback

### Scenario 3: Backend Validation Catch
1. If frontend validation is bypassed or fails
2. Backend validation catches the duplicate
3. Returns clear error message
4. Frontend displays the error to user
5. User can correct and resubmit

---

## Error Messages

### User-Facing Messages:
- **Frontend**: "This Purchase Order Number already exists for [Supplier Name]. Please use a different number."
- **Backend**: "This Purchase Order Number ([PO Number]) already exists for supplier '[Supplier Name]'. Please use a different Purchase Order Number or verify the existing order."

### Technical Details:
- HTTP Status: 400 (Bad Request)
- Response includes `duplicateFound: true` flag
- Response may include `existingPurchaseId` for reference

---

## Testing Recommendations

### Manual Testing:
1. **Test Duplicate Prevention**:
   - Create a purchase order with Supplier A and PO Number "PO-001"
   - Try to create another purchase order with Supplier A and PO Number "PO-001"
   - Should show error and prevent creation

2. **Test Cross-Supplier Flexibility**:
   - Create a purchase order with Supplier A and PO Number "PO-001"
   - Create a purchase order with Supplier B and PO Number "PO-001"
   - Should succeed (different suppliers can have same PO numbers)

3. **Test Real-time Validation**:
   - Select a supplier
   - Type a PO number that already exists for that supplier
   - Should show error immediately without submitting

4. **Test Supplier Change**:
   - Enter a PO number
   - Change supplier
   - Validation should re-run for new supplier

5. **Test OCR Flow**:
   - Upload a bill via OCR
   - If bill has duplicate PO number for supplier
   - Should prevent creation with clear error

### Edge Cases:
- Purchase orders without suppliers (should be allowed)
- Empty/whitespace PO numbers (should be rejected)
- Case sensitivity (PO-001 vs po-001)
- Special characters in PO numbers
- Very long PO numbers

---

## Database Migration Notes

### Index Creation:
The new compound unique index will be created automatically when the application starts. However, if there are existing duplicate records in the database, the index creation will fail.

### Pre-Migration Check:
Run this query to check for existing duplicates:
```javascript
db.purchases.aggregate([
  {
    $match: { supplier: { $ne: null } }
  },
  {
    $group: {
      _id: {
        store: "$store",
        supplier: "$supplier",
        purchaseOrderNumber: "$purchaseOrderNumber"
      },
      count: { $sum: 1 },
      ids: { $push: "$_id" }
    }
  },
  {
    $match: { count: { $gt: 1 } }
  }
]);
```

### Cleanup Script (if duplicates exist):
If duplicates are found, they need to be resolved before the index can be created. Options:
1. Manually review and merge duplicate records
2. Append a suffix to duplicate PO numbers (e.g., PO-001-A, PO-001-B)
3. Delete duplicate records (if they're truly duplicates)

---

## Benefits

1. **Data Integrity**: Prevents accidental duplicate entries
2. **User Experience**: Real-time feedback prevents frustration
3. **Flexibility**: Allows same PO numbers across different suppliers
4. **Comprehensive**: Covers all entry points (manual, OCR, AI)
5. **Performance**: Database index ensures fast duplicate checks
6. **Clear Errors**: User-friendly error messages guide correction

---

## Future Enhancements

1. **Duplicate Detection UI**: Show existing purchase details when duplicate is detected
2. **Auto-increment**: Suggest next available PO number
3. **Bulk Import**: Validate duplicates during bulk purchase imports
4. **Audit Trail**: Log duplicate attempts for security monitoring
5. **Soft Warnings**: Option to allow duplicates with confirmation dialog


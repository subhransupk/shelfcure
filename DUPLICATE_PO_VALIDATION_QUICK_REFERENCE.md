# Purchase Order Duplicate Validation - Quick Reference

## 🎯 What Was Implemented

Validation to prevent duplicate purchase orders based on **Supplier + Purchase Order Number** combination.

## ✅ Business Rules

| Scenario | Allowed? | Example |
|----------|----------|---------|
| Same Supplier + Same PO Number | ❌ NO | Supplier A with PO-001 (duplicate) |
| Different Supplier + Same PO Number | ✅ YES | Supplier A with PO-001, Supplier B with PO-001 |
| No Supplier + Any PO Number | ✅ YES | Purchase without supplier assigned |

## 📁 Files Modified

### Backend
1. **`shelfcure-backend/models/Purchase.js`**
   - Added compound unique index: `store + supplier + purchaseOrderNumber`

2. **`shelfcure-backend/controllers/purchaseController.js`**
   - Added pre-save duplicate check
   - Enhanced error handling for MongoDB duplicate key errors

3. **`shelfcure-backend/controllers/ocrController.js`**
   - Added duplicate validation for OCR-created purchases

4. **`shelfcure-backend/services/aiDataService.js`**
   - Added duplicate validation for AI-created purchases

### Frontend
5. **`shelfcure-frontend/src/pages/StoreManagerPurchases.jsx`**
   - Added real-time validation state
   - Added `validatePONumber()` function
   - Enhanced form input with visual feedback
   - Updated supplier selection handlers
   - Disabled submit button when duplicate detected

## 🔧 Key Functions

### Backend Validation
```javascript
// In purchaseController.js - createPurchase()
const existingPurchase = await Purchase.findOne({
  store: store._id,
  supplier: supplier,
  purchaseOrderNumber: trimmedPONumber
});

if (existingPurchase) {
  return res.status(400).json({
    success: false,
    message: `This Purchase Order Number (${trimmedPONumber}) already exists for supplier "${supplierDoc.name}". Please use a different Purchase Order Number or verify the existing order.`,
    duplicateFound: true
  });
}
```

### Frontend Validation
```javascript
// In StoreManagerPurchases.jsx
const validatePONumber = async (poNumber, supplierId) => {
  // Queries backend to check for existing purchases
  // Updates validation state with results
  // Shows error message if duplicate found
};
```

## 🎨 User Experience

### Visual Feedback
- **Normal State**: Gray border on input field
- **Checking**: Loading spinner appears
- **Duplicate Found**: 
  - Red border on input field
  - Error message below field
  - Submit button disabled
- **Valid**: Normal border, no error message

### Error Messages
**Frontend**: 
> "This Purchase Order Number already exists for [Supplier Name]. Please use a different number."

**Backend**: 
> "This Purchase Order Number ([PO Number]) already exists for supplier '[Supplier Name]'. Please use a different Purchase Order Number or verify the existing order."

## 🧪 Testing

### Manual Test Steps

**Test 1: Prevent Duplicate**
1. Create PO with Supplier A, PO Number "PO-001"
2. Try to create another PO with Supplier A, PO Number "PO-001"
3. ✅ Should show error and prevent creation

**Test 2: Allow Cross-Supplier**
1. Create PO with Supplier A, PO Number "PO-001"
2. Create PO with Supplier B, PO Number "PO-001"
3. ✅ Should succeed

**Test 3: Real-time Validation**
1. Select Supplier A
2. Type "PO-001" (existing PO for Supplier A)
3. ✅ Should show error immediately

**Test 4: Supplier Change**
1. Enter PO Number "PO-001"
2. Select Supplier A (has PO-001) → Should show error
3. Change to Supplier B (no PO-001) → Error should clear

### Automated Test
```bash
node test-duplicate-po-validation.js
```

## 🚀 API Response Examples

### Success Response
```json
{
  "success": true,
  "message": "Purchase created successfully",
  "data": {
    "_id": "...",
    "purchaseOrderNumber": "PO-001",
    "supplier": {...}
  }
}
```

### Duplicate Error Response
```json
{
  "success": false,
  "message": "This Purchase Order Number (PO-001) already exists for supplier 'ABC Pharma'. Please use a different Purchase Order Number or verify the existing order.",
  "duplicateFound": true,
  "existingPurchaseId": "..."
}
```

## 🔍 Database Query Examples

### Check for Duplicates
```javascript
const existingPurchase = await Purchase.findOne({
  store: storeId,
  supplier: supplierId,
  purchaseOrderNumber: poNumber
});
```

### Find All Duplicates (for cleanup)
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

## ⚠️ Important Notes

1. **Index Creation**: The unique index is created automatically on app start. If existing duplicates exist, index creation will fail.

2. **Sparse Index**: The index uses `sparse: true` to allow multiple purchases without suppliers.

3. **Case Sensitivity**: PO numbers are case-sensitive by default. "PO-001" ≠ "po-001"

4. **Whitespace**: PO numbers are trimmed before validation.

5. **Performance**: The compound index ensures fast duplicate checks even with large datasets.

## 🐛 Troubleshooting

### Issue: Index Creation Fails
**Cause**: Existing duplicate records in database
**Solution**: 
1. Find duplicates using the aggregate query above
2. Resolve duplicates (merge, rename, or delete)
3. Restart application to create index

### Issue: Frontend Validation Not Working
**Cause**: API endpoint not returning correct data
**Solution**: 
1. Check browser console for errors
2. Verify API endpoint is accessible
3. Check authentication token is valid

### Issue: Backend Allows Duplicates
**Cause**: Index not created or validation bypassed
**Solution**:
1. Check if index exists: `db.purchases.getIndexes()`
2. Verify validation code is not commented out
3. Check if supplier field is null (sparse index allows this)

## 📚 Related Documentation

- Full implementation details: `PURCHASE_ORDER_DUPLICATE_VALIDATION.md`
- Test script: `test-duplicate-po-validation.js`
- Purchase model: `shelfcure-backend/models/Purchase.js`
- Purchase controller: `shelfcure-backend/controllers/purchaseController.js`

## 🎓 Best Practices

1. **Always validate on both frontend and backend**
2. **Provide clear, actionable error messages**
3. **Use database constraints as the final safety net**
4. **Test edge cases (null suppliers, special characters, etc.)**
5. **Monitor for duplicate attempts in production logs**

## 📞 Support

If you encounter issues:
1. Check this quick reference
2. Review full documentation
3. Run the test script
4. Check application logs
5. Verify database indexes

---

**Last Updated**: 2025-10-17
**Version**: 1.0


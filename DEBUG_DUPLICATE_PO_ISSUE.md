# Debug Guide: Purchase Order Duplicates Still Being Created

## Issue
Despite implementing validation, duplicate purchase orders are still being created.

## Debugging Steps

### Step 1: Check if Backend is Running Latest Code
```bash
# Restart your Node.js backend server
# Make sure it picks up the latest changes
```

**What to look for:**
- Server should restart without errors
- Check console for any index creation errors

---

### Step 2: Check Database Index
Run the index checker script:
```bash
node check-purchase-index.js
```

**Expected Output:**
```
✓ Found unique_supplier_po_number index
✓ Index is correctly configured!
✓ No duplicate purchase orders found!
```

**If index is missing:**
- The index wasn't created
- Restart your Node.js application
- Check for MongoDB connection errors

**If duplicates exist:**
- The index can't be created because duplicates already exist
- You need to clean up existing duplicates first

---

### Step 3: Check Backend Logs
When creating a purchase order, you should see these logs:

```
🚀 CREATE PURCHASE CALLED
📦 Request body: {...}
🏪 Store: [Store Name] Manager: [Manager Name]
🔍 Checking for duplicate PO: {
  store: ...,
  supplier: ...,
  purchaseOrderNumber: "PO-001"
}
🔍 Existing purchase found: None
✅ No duplicate found - Proceeding with creation
💾 Creating purchase with data: {...}
✅ Purchase created successfully: [ID]
```

**If you see duplicate but it still creates:**
- The validation check is being bypassed
- Check if supplier is null/undefined

**If you don't see the logs:**
- Backend code isn't updated
- Restart the server

---

### Step 4: Test Duplicate Creation

**Test A: Create First Purchase**
1. Select Supplier: "ABC Pharma"
2. Enter PO Number: "TEST-001"
3. Add items and submit
4. ✅ Should succeed

**Test B: Try to Create Duplicate**
1. Select SAME Supplier: "ABC Pharma"
2. Enter SAME PO Number: "TEST-001"
3. Add items and submit
4. ❌ Should FAIL with error message

**What to check in backend logs:**
```
🔍 Checking for duplicate PO: {
  store: [Store ID],
  supplier: [Supplier ID],
  purchaseOrderNumber: "TEST-001"
}
🔍 Existing purchase found: [Purchase ID]  ← Should find the first purchase
❌ DUPLICATE DETECTED - Blocking creation
```

---

### Step 5: Check Frontend Validation

**Open Browser Console** and watch for:

1. When you type PO number:
```
Validating PO number...
```

2. API call:
```
GET /api/store-manager/purchases/validate-po-number?supplier=X&purchaseOrderNumber=TEST-001
```

3. Response:
```json
{
  "success": true,
  "isDuplicate": true,  ← Should be true for duplicates
  "message": "This Purchase Order Number already exists for ABC Pharma"
}
```

4. UI should show:
- Red border on input field
- Error message below field
- Submit button disabled

---

### Step 6: Common Issues and Fixes

#### Issue 1: Index Not Created
**Symptom:** Duplicates are created, no error in backend logs

**Fix:**
```bash
# Restart Node.js server
# Check logs for index creation
```

#### Issue 2: Existing Duplicates Prevent Index
**Symptom:** Server logs show index creation error

**Fix:**
```bash
# Run the checker script
node check-purchase-index.js

# Manually fix duplicates in database
# Then restart server
```

#### Issue 3: Supplier is Null/Undefined
**Symptom:** Validation is skipped

**Check:**
- Is supplier being sent in the request?
- Look at backend logs: `📦 Request body`
- Supplier field should have a valid ObjectId

**Fix:**
- Ensure supplier is selected before creating purchase
- Frontend should require supplier selection

#### Issue 4: Case Sensitivity
**Symptom:** "PO-001" and "po-001" are both allowed

**Current Behavior:** This is expected - PO numbers are case-sensitive

**To make case-insensitive:**
- Would need to add a pre-save hook to normalize case
- Or use case-insensitive regex in validation

#### Issue 5: Whitespace Issues
**Symptom:** "PO-001" and "PO-001 " (with space) are both allowed

**Fix:** Already implemented - we use `.trim()` on PO numbers

---

### Step 7: Manual Database Check

Connect to MongoDB and run:

```javascript
// Check for duplicates
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
      purchases: { $push: { id: "$_id", createdAt: "$createdAt" } }
    }
  },
  {
    $match: { count: { $gt: 1 } }
  }
])

// Check indexes
db.purchases.getIndexes()

// Look for:
{
  "name": "unique_supplier_po_number",
  "key": {
    "store": 1,
    "supplier": 1,
    "purchaseOrderNumber": 1
  },
  "unique": true,
  "sparse": true
}
```

---

### Step 8: Force Index Creation

If index is not being created automatically:

```javascript
// Connect to MongoDB shell or use a script
db.purchases.createIndex(
  { 
    store: 1, 
    supplier: 1, 
    purchaseOrderNumber: 1 
  },
  { 
    unique: true, 
    sparse: true,
    name: 'unique_supplier_po_number'
  }
)
```

**Note:** This will fail if duplicates already exist!

---

### Step 9: Clean Up Existing Duplicates

If you have existing duplicates:

```javascript
// Find duplicates
const duplicates = db.purchases.aggregate([
  { $match: { supplier: { $ne: null } } },
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
  { $match: { count: { $gt: 1 } } }
]).toArray()

// For each duplicate group, keep the first and delete the rest
duplicates.forEach(dup => {
  const idsToDelete = dup.ids.slice(1); // Keep first, delete rest
  db.purchases.deleteMany({ _id: { $in: idsToDelete } });
})
```

**⚠️ WARNING:** This will delete data! Make a backup first!

---

### Step 10: Verify Everything Works

After fixing:

1. ✅ Run `node check-purchase-index.js` - should show index exists
2. ✅ Restart backend server - should start without errors
3. ✅ Try creating duplicate - should be blocked
4. ✅ Check backend logs - should show "DUPLICATE DETECTED"
5. ✅ Check frontend - should show red border and error

---

## Quick Checklist

- [ ] Backend server restarted with latest code
- [ ] Database index exists (`unique_supplier_po_number`)
- [ ] No existing duplicates in database
- [ ] Backend logs show duplicate checking
- [ ] Frontend validation endpoint works
- [ ] Test: Can create first purchase
- [ ] Test: Cannot create duplicate purchase
- [ ] Error message is clear and helpful

---

## Still Not Working?

If you've tried everything above and it's still not working:

1. **Check the exact request being sent:**
   - Open browser DevTools → Network tab
   - Create a purchase
   - Look at the POST request to `/api/store-manager/purchases`
   - Check the payload - is `supplier` and `purchaseOrderNumber` present?

2. **Check the exact response:**
   - If duplicate, should get 400 error
   - Response should have `duplicateFound: true`
   - Message should mention the supplier name

3. **Enable more logging:**
   - Add `console.log` statements in the backend
   - Log every step of the validation process
   - Check what values are being compared

4. **Test with MongoDB directly:**
   - Try to insert a duplicate manually
   - If it succeeds, the index isn't working
   - If it fails with error code 11000, the index works

---

## Contact Information

If you need help:
1. Share the backend logs when creating a purchase
2. Share the output of `node check-purchase-index.js`
3. Share any error messages from the browser console
4. Describe exactly what happens when you try to create a duplicate


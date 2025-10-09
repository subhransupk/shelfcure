# Doctor & Customer Status Filtering Fix - Summary

## Issue Description
Inactive doctors and blocked customers were appearing in the selection dropdowns on the sales page, which is incorrect behavior. Only active doctors and active customers should be visible and selectable when creating a sale.

## Root Cause Analysis

### Backend API Behavior
- **Endpoint**: `/api/store-manager/doctors`
- **Controller**: `storeManagerDoctorsController.js` → `getDoctors` function
- **Issue**: The API only filters by status when a `status` query parameter is explicitly provided
- **Default Behavior**: When no status parameter is provided, it returns ALL doctors (active, inactive, blocked)

### Frontend Sales Page Behavior
- **File**: `shelfcure-frontend/src/pages/StoreManagerSales.jsx`
- **Functions**: `fetchDoctors()` and `fetchCustomers()`
- **Issue**: The sales page was calling both APIs without any status filters
- **Result**: All doctors (including inactive ones) and all customers (including blocked ones) were being fetched and displayed

## Solution Implemented

### Frontend Fixes Applied
1. **Doctor Filtering**: Modified the `fetchDoctors` function in the sales page to explicitly request only active doctors:

**Before:**
```javascript
const response = await fetch('/api/store-manager/doctors', {
```

**After:**
```javascript
const response = await fetch('/api/store-manager/doctors?status=active', {
```

2. **Customer Filtering**: Modified the `fetchCustomers` function in the sales page to explicitly request only active customers:

**Before:**
```javascript
const response = await fetch('/api/store-manager/customers', {
```

**After:**
```javascript
const response = await fetch('/api/store-manager/customers?status=active', {
```

### Backend Enhancement
Enhanced the customer controller to support status filtering (doctor controller already supported it):

**File**: `shelfcure-backend/controllers/storeManagerController.js`
**Function**: `getCustomers`
**Change**: Added status parameter support similar to the doctor controller

### Why This Approach
1. **Explicit and Clear**: The sales page now explicitly requests only active doctors
2. **Minimal Impact**: Doesn't change the default API behavior for other components
3. **Consistent**: Other parts of the system that need all doctors (like the doctor management page) continue to work as expected

## Verification

### Expected Behavior After Fix
- ✅ Sales page doctor dropdown shows only active doctors
- ✅ Sales page customer dropdown shows only active customers (not blocked)
- ✅ Doctor management page continues to show all doctors with proper filtering
- ✅ Customer management page continues to show all customers with proper filtering
- ✅ Dashboard stats continue to work correctly

### Files Modified
1. `shelfcure-frontend/src/pages/StoreManagerSales.jsx`
   - Line 323: Added `?status=active` query parameter to doctor API call
   - Line 303: Added `?status=active` query parameter to customer API call

2. `shelfcure-backend/controllers/storeManagerController.js`
   - Enhanced `getCustomers` function to support status filtering

### Files NOT Modified (Intentionally)
1. `shelfcure-backend/controllers/storeManagerDoctorsController.js` - Backend API behavior preserved
2. `shelfcure-frontend/src/pages/StoreManagerDoctors.jsx` - Doctor management page needs all doctors
3. `shelfcure-frontend/src/pages/StoreManagerCustomers.jsx` - Customer management page needs all customers

## Database Schema Reference

### Doctor Model Status Field
```javascript
status: {
  type: String,
  enum: ['active', 'inactive', 'blocked'],
  default: 'active'
}
```

### Customer Model Status Field
```javascript
status: {
  type: String,
  enum: ['active', 'blocked'],
  default: 'active'
}
```

## Testing

### Manual Testing Steps
1. Navigate to the sales page
2. Click on the doctor selection dropdown
3. Verify only active doctors are visible
4. Click on the customer selection dropdown
5. Verify only active customers are visible (no blocked customers)
6. Navigate to the doctor management page
7. Verify all doctors are visible with proper status indicators
8. Navigate to the customer management page
9. Verify all customers are visible with proper status indicators

### API Testing
Use the provided test script `test-doctor-status-fix.js` to verify API behavior:
- Test fetching all doctors
- Test fetching only active doctors
- Test fetching only inactive doctors
- Test fetching all customers
- Test fetching only active customers
- Test fetching only blocked customers

## Impact Assessment

### Positive Impact
- ✅ Prevents selection of inactive doctors in sales
- ✅ Prevents selection of blocked customers in sales
- ✅ Improves data integrity and prevents invalid transactions
- ✅ Better user experience for store managers
- ✅ Maintains compliance with business rules

### No Negative Impact
- ✅ Doctor management functionality unchanged
- ✅ Customer management functionality unchanged
- ✅ Dashboard statistics unchanged
- ✅ API backward compatibility maintained
- ✅ No performance impact

## Future Considerations

### Additional Improvements (Optional)
1. Consider adding similar filtering for other entities (suppliers, staff) if needed
2. Add visual indicators in the UI to show doctor/customer status
3. Consider adding a toggle in sales page to show/hide inactive entities if needed for special cases

### Related Components to Monitor
- Supplier selection in purchase orders (may need similar filtering)
- Staff selection in various forms (may need similar filtering)
- Medicine selection (expired medicines should be filtered)

## Conclusion
The fix successfully resolves the issue by ensuring only active doctors and active customers appear in the sales page selections, while maintaining the flexibility of the APIs for other use cases. The solution is minimal, targeted, and maintains system integrity. Both frontend and backend changes work together to provide a comprehensive solution that prevents invalid entity selection during sales transactions.

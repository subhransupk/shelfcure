# Testing Guide - Dynamic Dashboard Implementation

## Pre-Testing Setup

### 1. Backend Configuration
- Ensure ShelfCure backend is running on `http://localhost:5000` (or your configured URL)
- Verify database is populated with test store data
- Check that authentication is working

### 2. Mobile App Configuration
Update `lib/config/constants.dart`:
```dart
static const String apiBaseUrl = 'http://your-backend-url:5000';
```

### 3. Test User Account
Create a test store manager account with:
- Email: `manager@test.com`
- Password: `password123`
- Associated store with sales data

## Testing Scenarios

### Scenario 1: Successful Data Loading
**Steps:**
1. Launch the app
2. Login with test credentials
3. Navigate to Dashboard tab
4. Observe loading spinner

**Expected Results:**
- Loading spinner appears briefly
- Dashboard displays real data from backend
- All metrics show actual values (not mock data)
- Recent sales list populated with real transactions
- Expiring medicines list shows actual inventory

**Verification Points:**
- Financial metrics match backend database
- Inventory counts are accurate
- Customer metrics reflect real data
- No error messages displayed

### Scenario 2: Pull-to-Refresh
**Steps:**
1. Dashboard loaded with data
2. Perform pull-down gesture
3. Wait for refresh to complete

**Expected Results:**
- Refresh indicator appears
- Data reloads from backend
- Metrics update with latest values
- Refresh completes smoothly

### Scenario 3: Error Handling - Network Failure
**Steps:**
1. Disable network/WiFi
2. Launch app or navigate to Dashboard
3. Observe error state

**Expected Results:**
- Error message displayed
- Two retry buttons visible: "Retry" and "Retry (3x)"
- Fallback mock data shown (if available)
- User can attempt recovery

### Scenario 4: Retry with Exponential Backoff
**Steps:**
1. Trigger network error (disable network)
2. Click "Retry (3x)" button
3. Re-enable network during retry attempts
4. Observe retry behavior

**Expected Results:**
- First retry: immediate
- Second retry: ~1 second delay
- Third retry: ~2 second delay
- Data loads successfully when network restored

### Scenario 5: Single Retry
**Steps:**
1. Trigger network error
2. Click "Retry" button
3. Observe single attempt

**Expected Results:**
- Single API call made
- Success or error displayed
- No automatic retries

### Scenario 6: Data Accuracy Verification
**Steps:**
1. Dashboard loaded successfully
2. Compare displayed metrics with backend database
3. Check specific values:
   - Today's Revenue
   - Total Medicines
   - Low Stock Count
   - Pending Credit
   - Doctor Commissions

**Expected Results:**
- All values match backend exactly
- No rounding errors
- Currency formatting correct (₹ symbol)
- Counts are integers

### Scenario 7: Expiry Alerts Integration
**Steps:**
1. Dashboard loaded
2. Check expiry alerts section
3. Verify alert counts and values

**Expected Results:**
- Expired medicines count accurate
- Critical (7 days) count correct
- Warning (8-30 days) count correct
- Total value at risk calculated correctly

### Scenario 8: Recent Sales Display
**Steps:**
1. Dashboard loaded
2. Scroll to Recent Sales section
3. Verify sale details

**Expected Results:**
- Invoice numbers displayed correctly
- Customer names shown (or "Walk-in Customer")
- Amounts formatted with ₹ symbol
- Dates formatted correctly
- Maximum 5 recent sales shown

### Scenario 9: Expiring Medicines List
**Steps:**
1. Dashboard loaded
2. Scroll to Expiring Medicines section
3. Verify medicine details

**Expected Results:**
- Medicine names displayed
- Batch numbers shown
- Expiry dates formatted correctly
- Days until expiry calculated
- Color coding: red for urgent (≤7 days), orange for warning

### Scenario 10: Doctor Commission Stats
**Steps:**
1. Dashboard loaded
2. Check Doctor Commissions card
3. Verify commission data

**Expected Results:**
- Total commissions displayed
- Active doctors count shown
- Pending commissions amount visible
- Values match backend calculations

## Performance Testing

### Load Time
- Initial load: < 3 seconds
- Refresh: < 2 seconds
- Retry attempts: < 5 seconds total

### Memory Usage
- Monitor memory during data loading
- Check for memory leaks on repeated refreshes
- Verify proper cleanup on screen exit

### Network Usage
- Monitor API calls in network inspector
- Verify cache-busting parameters working
- Check request/response sizes

## Edge Cases

### Empty Data
- Test with store having no sales
- Test with no expiring medicines
- Test with no customers
- Verify UI handles empty states gracefully

### Large Data Sets
- Test with 1000+ recent sales
- Test with 500+ expiring medicines
- Verify performance remains acceptable

### Malformed Responses
- Test with missing fields in API response
- Test with null values
- Verify fallback to defaults works

### Timeout Scenarios
- Set very short timeout values
- Verify timeout errors handled
- Check retry mechanism activates

## Debugging

### Enable Logging
Check console output for:
```
Dashboard data fetched successfully
Expiry alerts summary fetched successfully
Doctor stats fetched successfully
```

### API Response Inspection
Use network inspector to verify:
- Correct endpoints called
- Authorization headers present
- Response status codes (200 for success)
- Response body structure

### State Management
Verify provider state:
- `isLoading` flag transitions correctly
- `error` message set appropriately
- `dashboardData` populated with parsed data

## Sign-Off Checklist

- [ ] All metrics display real data
- [ ] Error handling works correctly
- [ ] Retry logic functions properly
- [ ] Pull-to-refresh works
- [ ] Performance acceptable
- [ ] No memory leaks
- [ ] UI matches design
- [ ] All edge cases handled
- [ ] Documentation complete


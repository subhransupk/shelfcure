# 🧪 Testing Guide - Date Filtering & Pagination

## Prerequisites
- Flutter app running on emulator or device
- Backend API running with sales endpoints
- API base URL configured in `lib/config/constants.dart`
- Store manager authenticated and logged in

---

## Test Cases

### 1. Preset Date Filters
**Steps:**
1. Navigate to Sales screen → History tab
2. Click "Today" button
3. Verify sales list updates to show only today's sales
4. Repeat for: Yesterday, Last 7 Days, Last 30 Days, This Month

**Expected Results:**
- ✅ Filter button highlights in green when selected
- ✅ Sales list updates immediately
- ✅ Total sales count updates
- ✅ Page resets to 1
- ✅ Only sales within date range shown

### 2. Custom Date Range
**Steps:**
1. Click "From Date" picker
2. Select a start date (e.g., 2025-01-01)
3. Click "To Date" picker
4. Select an end date (e.g., 2025-01-31)
5. Verify sales list updates

**Expected Results:**
- ✅ Date pickers open with calendar
- ✅ Selected dates display in buttons
- ✅ Sales list filters to date range
- ✅ Total sales count updates
- ✅ Page resets to 1

### 3. Clear Filters
**Steps:**
1. Apply a date filter
2. Click "All" button
3. Verify all sales display

**Expected Results:**
- ✅ "All" button highlights
- ✅ All sales display
- ✅ Total sales count shows all sales
- ✅ Date pickers reset

### 4. Pagination - Next Page
**Steps:**
1. View first page of sales
2. Click "Next" button
3. Verify page 2 loads

**Expected Results:**
- ✅ Page number updates to 2
- ✅ New sales load
- ✅ "Previous" button becomes enabled
- ✅ "Next" button enabled if more pages exist

### 5. Pagination - Previous Page
**Steps:**
1. Navigate to page 2
2. Click "Previous" button
3. Verify page 1 loads

**Expected Results:**
- ✅ Page number updates to 1
- ✅ Original sales reload
- ✅ "Previous" button disabled
- ✅ "Next" button enabled

### 6. Page Number Buttons
**Steps:**
1. Click page number 3 directly
2. Verify page 3 loads

**Expected Results:**
- ✅ Page 3 loads immediately
- ✅ Page number button highlights
- ✅ Sales list updates
- ✅ Correct sales display

### 7. Filter Persistence
**Steps:**
1. Apply "Last 7 Days" filter
2. Navigate to page 2
3. Navigate back to page 1
4. Verify filter still applied

**Expected Results:**
- ✅ Filter persists across pages
- ✅ "Last 7 Days" button still highlighted
- ✅ Only filtered sales shown
- ✅ Correct page displays

### 8. Pagination Info Display
**Steps:**
1. View any page
2. Check pagination section

**Expected Results:**
- ✅ "Total Sales: X" displays correct count
- ✅ "Page X of Y" shows current/total pages
- ✅ Page numbers display correctly
- ✅ Button states correct (enabled/disabled)

### 9. Empty State
**Steps:**
1. Apply filter with no matching sales
2. Verify empty state displays

**Expected Results:**
- ✅ Empty state message shows
- ✅ No pagination controls visible
- ✅ Can change filter to show sales

### 10. Loading State
**Steps:**
1. Apply a filter
2. Observe loading indicator

**Expected Results:**
- ✅ Loading spinner shows briefly
- ✅ Sales load after delay
- ✅ No UI freezing

---

## Edge Cases

- [ ] Select same start and end date
- [ ] Select end date before start date
- [ ] Navigate to last page then click Next
- [ ] Navigate to first page then click Previous
- [ ] Apply filter with 0 results
- [ ] Apply filter with 1 result
- [ ] Apply filter with exactly 20 results
- [ ] Apply filter with 21+ results

---

**Status**: Ready for comprehensive testing


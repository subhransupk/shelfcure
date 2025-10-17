# 🧪 Customer Analytics Testing Checklist

## Pre-Test Setup

### 1. Login to Store Panel
- [ ] Navigate to `http://localhost:3000`
- [ ] Login as **Store Manager** (not Store Owner or Admin)
- [ ] Verify you're in the Store Panel (not Owner Panel or Admin Panel)

### 2. Navigate to Analytics
- [ ] Click on **Analytics** in the sidebar
- [ ] Click on the **Customers** tab
- [ ] Wait for data to load

---

## 📊 Test 1: Analytics Cards (6 Cards)

### Card 1: Total Customers
- [ ] Card displays without errors
- [ ] Shows a number (not "undefined" or "NaN")
- [ ] Subtitle says "Registered customers"
- [ ] Blue icon (Users icon)
- [ ] Number makes sense (should be >= 0)

**Expected**: Total count of all customers in your store

---

### Card 2: New Customers
- [ ] Card displays without errors
- [ ] Shows a number (not "undefined" or "NaN")
- [ ] Subtitle changes based on period selector:
  - 7d: "This Last 7 days"
  - 30d: "This Last 30 days"
  - 90d: "This Last 90 days"
  - 1y: "This Last 1 year"
- [ ] Green icon (UserCheck icon)
- [ ] Number changes when you change the period selector

**Test**: Change period from 30d to 7d - number should change

---

### Card 3: Customer Growth
- [ ] Card displays without errors
- [ ] Shows a percentage with % symbol
- [ ] Subtitle says "Growth rate"
- [ ] Purple icon (TrendingUp icon)
- [ ] Can be positive, negative, or 0%

**Expected**: Percentage change compared to previous period

---

### Card 4: Active Customers
- [ ] Card displays without errors
- [ ] Shows a number (not "undefined" or "NaN")
- [ ] Subtitle says "Recently active"
- [ ] Orange icon (Activity icon)
- [ ] Number should be <= Total Customers

**Expected**: Customers with purchases in last 90 days AND status='active'

---

### Card 5: Average Spending
- [ ] Card displays without errors
- [ ] Shows currency format (₹X,XXX)
- [ ] Subtitle says "Per customer"
- [ ] Green icon (DollarSign icon)
- [ ] Amount makes sense

**Expected**: Average of all customers' totalSpent field

---

### Card 6: Average Order Value
- [ ] Card displays without errors
- [ ] Shows currency format (₹X,XXX)
- [ ] Subtitle says "Per transaction"
- [ ] Purple icon (TrendingUp icon)
- [ ] Amount makes sense (usually less than Average Spending)

**Expected**: Average amount per transaction across all customers

---

## 📈 Test 2: Customer Acquisition Chart

### Visual Check
- [ ] Chart renders without errors
- [ ] Title: "Customer Acquisition"
- [ ] Subtitle: "New customers over time"
- [ ] Chart type: Line chart (green line)
- [ ] X-axis shows dates
- [ ] Y-axis shows numbers (customer count)

### Data Check
- [ ] Line shows data points (not flat at zero if you have customers)
- [ ] Dates on X-axis match the selected period
- [ ] Hovering over points shows tooltip with date and count
- [ ] Chart updates when you change the period selector

### Period Testing
- [ ] Select **7d** - Chart shows last 7 days
- [ ] Select **30d** - Chart shows last 30 days
- [ ] Select **90d** - Chart shows last 90 days
- [ ] Select **1y** - Chart shows last year

**Expected**: Daily breakdown of new customer registrations

---

## 🍩 Test 3: Customer Spending Distribution Chart

### Visual Check
- [ ] Chart renders without errors
- [ ] Title: "Customer Spending Distribution"
- [ ] Subtitle: "Spending patterns"
- [ ] Chart type: Doughnut chart
- [ ] Legend at bottom shows 3 categories

### Data Check
- [ ] Three segments visible:
  - **Low Spenders** (Red) - ₹0 to ₹1,000
  - **Medium Spenders** (Orange) - ₹1,000 to ₹5,000
  - **High Spenders** (Green) - ₹5,000+
- [ ] Percentages add up to 100%
- [ ] Hovering shows count for each segment
- [ ] Numbers match the customer spending patterns

### Logic Verification
If you have customers:
- [ ] At least one segment should have data
- [ ] Total of all segments = Total Customers count

**Expected**: Distribution of customers by their total spending

---

## 📋 Test 4: Top Customers Table

### Visual Check
- [ ] Table renders without errors
- [ ] Title: "Top Customers"
- [ ] Shows up to 10 customers
- [ ] Has 6 columns:
  1. Customer Name
  2. Phone
  3. Total Visits
  4. Total Spent
  5. Last Visit
  6. Type (Badge)

### Data Check
- [ ] Customer names are displayed correctly
- [ ] Phone numbers are formatted properly
- [ ] Total Visits shows numbers
- [ ] Total Spent shows currency format (₹X,XXX)
- [ ] Last Visit shows formatted date (MM/DD/YYYY)
- [ ] Type badge shows one of:
  - **VIP** (Purple) - Spent >₹10,000
  - **Regular** (Blue) - Spent >₹5,000
  - **New** (Gray) - Spent <₹5,000

### Functionality Check
- [ ] **Search box** works - type customer name to filter
- [ ] **Column sorting** works - click column headers to sort
- [ ] Table shows "No data available" if no customers
- [ ] Customers are sorted by Total Spent (highest first)

### Period Testing
- [ ] Change period selector - table updates with period-specific data
- [ ] Top customers change based on selected period

**Expected**: Top 10 customers by spending in the selected period

---

## 🔄 Test 5: Period Selector

### Available Periods
- [ ] **7d** - Last 7 days
- [ ] **30d** - Last 30 days (default)
- [ ] **90d** - Last 90 days
- [ ] **1y** - Last 1 year

### Functionality
- [ ] Clicking each period updates all cards
- [ ] Clicking each period updates both charts
- [ ] Clicking each period updates the table
- [ ] Active period is highlighted
- [ ] No errors in console when switching periods

---

## 🔄 Test 6: Refresh Button

- [ ] Refresh button is visible in the header
- [ ] Clicking refresh reloads all data
- [ ] Loading animation shows during refresh
- [ ] Data updates after refresh completes
- [ ] No errors in console

---

## 🚨 Test 7: Error Handling

### No Data Scenario
If you have a new store with no customers:
- [ ] All cards show "0" (not errors)
- [ ] Charts show empty state or "No data"
- [ ] Table shows "No data available"
- [ ] No console errors

### Network Error Scenario
1. Stop the backend server
2. Refresh the page
3. Check:
   - [ ] Error message is displayed
   - [ ] Error message is user-friendly
   - [ ] No infinite loading state
   - [ ] Console shows the error

---

## 🖥️ Test 8: Browser Console Check

### Open Browser Console
- **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I`
- **Firefox**: Press `F12` or `Ctrl+Shift+K`

### Check for Errors
- [ ] No red error messages in console
- [ ] No "undefined" or "null" warnings
- [ ] No "Failed to fetch" errors (if backend is running)
- [ ] No React warnings about keys or props

### Expected Console Logs
You might see:
- ✅ "Analytics API error:" (only if there's an actual error)
- ✅ Network requests to `/api/store-manager/analytics?period=30d`

---

## 📱 Test 9: Responsive Design

### Desktop View (>1024px)
- [ ] Cards display in 6 columns (xl:grid-cols-6)
- [ ] Charts display side by side (2 columns)
- [ ] Table is full width
- [ ] Everything is readable

### Tablet View (768px - 1024px)
- [ ] Cards display in 4 columns (lg:grid-cols-4)
- [ ] Charts display side by side (2 columns)
- [ ] Table is scrollable if needed

### Mobile View (<768px)
- [ ] Cards display in 2 columns (md:grid-cols-2)
- [ ] Charts stack vertically (1 column)
- [ ] Table is horizontally scrollable
- [ ] All text is readable

**Test**: Resize browser window to check responsiveness

---

## 🎨 Test 10: Visual Polish

### Loading States
- [ ] Cards show skeleton loading animation
- [ ] Charts show loading state
- [ ] Table shows loading state
- [ ] Loading is smooth (not jarring)

### Colors & Icons
- [ ] All icons render correctly (Lucide React icons)
- [ ] Color scheme is consistent:
  - Blue: Total Customers
  - Green: New Customers, Average Spending
  - Purple: Customer Growth, Average Order Value
  - Orange: Active Customers
- [ ] Text is left-aligned (not centered)
- [ ] Spacing is consistent

### Hover Effects
- [ ] Cards have subtle shadow on hover
- [ ] Chart tooltips appear on hover
- [ ] Table rows highlight on hover

---

## 🔍 Test 11: Data Accuracy Verification

### Manual Verification
If you want to verify the numbers are correct:

1. **Total Customers**:
   - Go to Customers page
   - Count total customers
   - Should match the card

2. **New Customers**:
   - Go to Customers page
   - Filter by registration date in the period
   - Count should match the card

3. **Average Spending**:
   - Go to Customers page
   - Check a few customers' "Total Spent"
   - Average should roughly match the card

4. **Top Customers**:
   - Go to Sales page
   - Check which customers have highest sales
   - Should match the table

---

## ✅ Test 12: Integration with Other Features

### Customer Creation
1. [ ] Go to Customers page
2. [ ] Create a new customer
3. [ ] Go back to Analytics → Customers tab
4. [ ] Refresh the page
5. [ ] Total Customers count should increase by 1
6. [ ] New Customers count should increase by 1 (if in current period)

### Sale Creation
1. [ ] Go to Sales page
2. [ ] Create a new sale for an existing customer
3. [ ] Go back to Analytics → Customers tab
4. [ ] Refresh the page
5. [ ] Customer's Total Spent should increase
6. [ ] Customer should appear/move up in Top Customers table
7. [ ] Active Customers might increase

---

## 🎯 Success Criteria

### All Tests Pass If:
- ✅ All 6 analytics cards display real data
- ✅ Both charts render without errors
- ✅ Top customers table shows data
- ✅ Period selector updates all components
- ✅ No console errors
- ✅ Responsive design works on all screen sizes
- ✅ Loading states work properly
- ✅ Data is accurate and matches database

### Known Acceptable Behaviors:
- ℹ️ All zeros if store has no customers (not an error)
- ℹ️ Empty charts if no data in selected period
- ℹ️ Active Customers might be 0 if no recent purchases
- ℹ️ Customer Growth might be 0% if no change

---

## 🐛 Common Issues to Watch For

### Issue 1: All Cards Show 0
**Possible Causes**:
- Store has no customers (expected)
- Backend not running
- Wrong store selected
- Database connection issue

**Fix**: Check backend logs, verify database connection

---

### Issue 2: Charts Not Rendering
**Possible Causes**:
- Chart.js not loaded
- Data format incorrect
- Browser compatibility

**Fix**: Check console for errors, verify Chart.js import

---

### Issue 3: Table Shows "No data available"
**Possible Causes**:
- No customers in selected period (expected)
- No sales in selected period (expected)
- Data aggregation issue

**Fix**: Try different period, check if customers have sales

---

### Issue 4: Period Selector Not Working
**Possible Causes**:
- State not updating
- API not being called with new period
- React re-render issue

**Fix**: Check console for API calls, verify state updates

---

## 📊 Expected Results Summary

### For a Store with Active Data:
- **Total Customers**: Should show actual count (e.g., 50)
- **New Customers**: Should show recent additions (e.g., 5 in last 30 days)
- **Customer Growth**: Should show percentage (e.g., +25%)
- **Active Customers**: Should show customers with recent purchases (e.g., 30)
- **Average Spending**: Should show realistic amount (e.g., ₹2,500)
- **Average Order Value**: Should show realistic amount (e.g., ₹800)
- **Acquisition Chart**: Should show trend line with peaks and valleys
- **Spending Distribution**: Should show mix of low/medium/high spenders
- **Top Customers Table**: Should show 10 customers sorted by spending

### For a New Store with No Data:
- All cards show **0**
- Charts show **empty state**
- Table shows **"No data available"**
- No errors in console

---

## 📝 Test Results Template

```
Date: _______________
Tester: _______________
Store: _______________

✅ PASSED:
- [ ] All 6 analytics cards working
- [ ] Customer Acquisition chart working
- [ ] Spending Distribution chart working
- [ ] Top Customers table working
- [ ] Period selector working
- [ ] Refresh button working
- [ ] No console errors
- [ ] Responsive design working

❌ FAILED:
- [ ] Issue 1: _______________________
- [ ] Issue 2: _______________________
- [ ] Issue 3: _______________________

📸 SCREENSHOTS:
- Attach screenshots of any issues found

💬 NOTES:
_________________________________
_________________________________
_________________________________
```

---

**Testing Complete!** 🎉

If all tests pass, the Customer Analytics section is fully functional and ready for production use.


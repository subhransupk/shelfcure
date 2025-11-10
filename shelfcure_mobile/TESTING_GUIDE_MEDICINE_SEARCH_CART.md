# 🧪 Testing Guide - Medicine Search & Cart Functionality

## 📋 Pre-Testing Checklist

- [ ] API base URL configured in `lib/config/constants.dart`
- [ ] Backend API running and accessible
- [ ] Store manager authenticated and logged in
- [ ] Flutter app running on emulator or device

## 🔍 Test Cases

### 1. Medicine Search Functionality

**Test 1.1: Search by Medicine Name**
- [ ] Type medicine name in search box
- [ ] Verify results appear in real-time
- [ ] Verify non-expired medicines only are shown
- [ ] Verify loading spinner appears during search

**Test 1.2: Search by Generic Name**
- [ ] Type generic name in search box
- [ ] Verify matching medicines appear
- [ ] Verify results are filtered correctly

**Test 1.3: Search by Manufacturer**
- [ ] Type manufacturer name in search box
- [ ] Verify matching medicines appear

**Test 1.4: Clear Search**
- [ ] Type search term
- [ ] Click clear button (X icon)
- [ ] Verify search results cleared
- [ ] Verify search box emptied

**Test 1.5: Empty Search Results**
- [ ] Search for non-existent medicine
- [ ] Verify "No medicines found" message appears
- [ ] Verify empty state icon displayed

**Test 1.6: Expired Medicine Filtering**
- [ ] Search for medicine with expired batches
- [ ] Verify expired medicines NOT shown in results
- [ ] Verify only non-expired medicines displayed

### 2. Add to Cart Functionality

**Test 2.1: Add Strip to Cart**
- [ ] Search for medicine with strip stock
- [ ] Click "Add Strip" button
- [ ] Enter quantity in dialog
- [ ] Click "Add to Cart"
- [ ] Verify item appears in cart
- [ ] Verify cart count incremented

**Test 2.2: Add Individual Unit to Cart**
- [ ] Search for medicine with individual stock
- [ ] Click "Add Unit" button
- [ ] Enter quantity in dialog
- [ ] Click "Add to Cart"
- [ ] Verify item appears in cart

**Test 2.3: Add Same Medicine Different Units**
- [ ] Add strip of medicine A to cart
- [ ] Add individual unit of medicine A to cart
- [ ] Verify both appear as separate items in cart
- [ ] Verify cart count shows 2

**Test 2.4: Duplicate Item Handling**
- [ ] Add medicine A (strip, qty 2) to cart
- [ ] Add medicine A (strip, qty 3) to cart again
- [ ] Verify quantities combined (total 5)
- [ ] Verify only one item in cart

**Test 2.5: Stock Validation**
- [ ] Search for medicine with limited stock (e.g., 5 units)
- [ ] Try to add quantity > available stock
- [ ] Verify error message: "Insufficient stock"
- [ ] Verify item NOT added to cart

**Test 2.6: Expired Medicine Prevention**
- [ ] Try to add expired medicine to cart
- [ ] Verify error message appears
- [ ] Verify item NOT added to cart

### 3. Cart Management

**Test 3.1: Update Quantity**
- [ ] Add medicine to cart
- [ ] Click + button to increase quantity
- [ ] Verify quantity increased
- [ ] Verify total price updated

**Test 3.2: Decrease Quantity**
- [ ] Add medicine with qty 3 to cart
- [ ] Click - button to decrease quantity
- [ ] Verify quantity decreased to 2
- [ ] Verify total price updated

**Test 3.3: Remove Item**
- [ ] Add medicine to cart
- [ ] Click delete button
- [ ] Verify item removed from cart
- [ ] Verify cart count decremented

**Test 3.4: Clear Cart**
- [ ] Add multiple medicines to cart
- [ ] Click "Clear" button
- [ ] Verify all items removed
- [ ] Verify cart shows empty state

**Test 3.5: Empty Cart State**
- [ ] Clear cart or start fresh
- [ ] Verify "Cart is empty" message
- [ ] Verify shopping cart icon displayed
- [ ] Verify "Complete Sale" button disabled

### 4. Order Summary & Calculations

**Test 4.1: Subtotal Calculation**
- [ ] Add medicine A (₹100 × 2) to cart
- [ ] Add medicine B (₹50 × 3) to cart
- [ ] Verify subtotal = ₹350

**Test 4.2: Tax Calculation**
- [ ] Add items totaling ₹1000
- [ ] Verify tax calculated at 18% = ₹180
- [ ] Verify total = ₹1180

**Test 4.3: Discount Calculation**
- [ ] Add items totaling ₹1000
- [ ] Verify discount shown as 0%
- [ ] Verify discount amount = ₹0

**Test 4.4: Complete Sale Button**
- [ ] Add items to cart
- [ ] Verify "Complete Sale" button enabled (green)
- [ ] Click button
- [ ] Verify navigates to CreateSaleScreen

**Test 4.5: Complete Sale Button Disabled**
- [ ] Clear cart
- [ ] Verify "Complete Sale" button disabled (gray)
- [ ] Verify button not clickable

### 5. UI/UX Testing

**Test 5.1: Responsive Design**
- [ ] Test on different screen sizes
- [ ] Verify layout adapts properly
- [ ] Verify no text overflow
- [ ] Verify buttons accessible

**Test 5.2: Loading States**
- [ ] Trigger search
- [ ] Verify loading spinner appears
- [ ] Verify spinner disappears when results load

**Test 5.3: Error Handling**
- [ ] Disconnect internet
- [ ] Try to search
- [ ] Verify error message displayed
- [ ] Verify graceful error handling

**Test 5.4: Color Scheme**
- [ ] Verify green color (#2E7D32) used consistently
- [ ] Verify professional appearance
- [ ] Verify good contrast for readability

## 🐛 Bug Reporting Template

**Bug Title**: [Brief description]
**Severity**: [Critical/High/Medium/Low]
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Result**: 

**Actual Result**: 

**Screenshots**: [Attach if applicable]

## ✅ Sign-Off

- [ ] All test cases passed
- [ ] No critical bugs found
- [ ] UI/UX meets requirements
- [ ] Ready for production

---

**Testing Date**: ___________
**Tested By**: ___________
**Status**: ___________


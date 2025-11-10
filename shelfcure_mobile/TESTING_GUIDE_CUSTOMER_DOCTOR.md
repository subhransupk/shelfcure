# 🧪 Testing Guide - Customer & Doctor Management

## Prerequisites
- Flutter app running on emulator or device
- Backend API running with customer/doctor endpoints
- API base URL configured in `lib/config/constants.dart`
- Store manager authenticated and logged in

---

## Test Cases

### 1. Customer Search & Selection
**Steps:**
1. Navigate to Sales screen → POS tab
2. In "Select Customer" section, type customer name or phone
3. Verify dropdown shows matching customers
4. Click on a customer to select

**Expected Results:**
- ✅ Search filters customers in real-time
- ✅ Dropdown shows customer name and phone
- ✅ Selected customer displays in green card
- ✅ Clear button appears next to title

### 2. Customer Quick-Add
**Steps:**
1. Click "Add New Customer" button
2. Fill in: Name, Phone (10 digits), Email (optional), Address (optional)
3. Click "Add Customer"

**Expected Results:**
- ✅ Form appears below search
- ✅ Validation checks phone format
- ✅ Success message shows
- ✅ New customer added to list
- ✅ Form clears after submission

### 3. Doctor Search & Selection
**Steps:**
1. In "Select Doctor (Optional)" section, type doctor name or phone
2. Verify dropdown shows matching doctors
3. Click on a doctor to select

**Expected Results:**
- ✅ Search filters doctors in real-time
- ✅ Dropdown shows Dr. prefix, specialization, phone
- ✅ Selected doctor displays in green card
- ✅ Clear button appears next to title

### 4. Doctor Quick-Add
**Steps:**
1. Click "Add New Doctor" button
2. Fill in: Name, Phone (10 digits), Specialization, Email (optional), Commission % (optional)
3. Click "Add Doctor"

**Expected Results:**
- ✅ Form appears below search
- ✅ Validation checks phone format
- ✅ Success message shows
- ✅ New doctor added to list
- ✅ Form clears after submission

### 5. Order Summary Display
**Steps:**
1. Select a customer
2. Select a doctor
3. Add medicines to cart
4. View order summary

**Expected Results:**
- ✅ Customer name displays with person icon
- ✅ Doctor name displays with medical services icon
- ✅ Both show in order summary section
- ✅ Clear buttons work independently

### 6. Complete Sale Flow
**Steps:**
1. Select customer
2. Select doctor (optional)
3. Add medicines to cart
4. Click "Complete Sale"
5. Verify customer_id and doctor_id passed to API

**Expected Results:**
- ✅ Sale created with customer association
- ✅ Sale created with doctor association (if selected)
- ✅ Sale completes successfully

---

## Error Handling Tests

### Invalid Phone Number
- Enter phone with < 10 digits
- Expected: Error message shown

### Duplicate Customer
- Try adding customer with existing phone
- Expected: Error message from API

### Network Error
- Disable network and try search
- Expected: Error message displayed

---

## UI/UX Tests

- [ ] Responsive on different screen sizes
- [ ] Smooth animations when selecting
- [ ] Clear visual feedback for selections
- [ ] Proper spacing and alignment
- [ ] Color scheme matches store panel

---

**Status**: Ready for comprehensive testing


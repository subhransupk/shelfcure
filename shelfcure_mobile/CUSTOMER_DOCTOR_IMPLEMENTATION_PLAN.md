# Customer & Doctor Management Implementation Plan

## 📋 Analysis Summary

### ✅ Existing Infrastructure
- **Backend API Endpoints**: Already exist at `/api/store-manager/customers` and `/api/store-manager/doctors`
- **Backend Models**: Customer.js and Doctor.js with comprehensive fields
- **Web Implementation**: Full customer/doctor search, selection, and quick-add in StoreManagerSales.jsx
- **Mobile API Service**: Already has `getCustomers()` method

### 📊 Implementation Scope

#### Phase 1: Create 2 New Data Models
1. **Customer.dart** (~80 lines)
   - Fields: id, name, phone, email, address, creditLimit, creditBalance, creditStatus, discountPercentage
   - JSON serialization: fromJson(), toJson()

2. **Doctor.dart** (~80 lines)
   - Fields: id, name, phone, email, specialization, commissionRate, commissionType, status
   - Virtual: fullName (Dr. + name), commissionDisplay
   - JSON serialization: fromJson(), toJson()

#### Phase 2: Create 2 New Providers
1. **CustomerProvider.dart** (~150 lines)
   - State: customers, searchResults, selectedCustomer, isLoading, error
   - Methods: fetchCustomers(), searchCustomers(), selectCustomer(), clearCustomer(), createCustomer()

2. **DoctorProvider.dart** (~150 lines)
   - State: doctors, searchResults, selectedDoctor, isLoading, error
   - Methods: fetchDoctors(), searchDoctors(), selectDoctor(), clearDoctor(), createDoctor()

#### Phase 3: Update API Service
- Add: `searchCustomers(String query)`, `createCustomer(Map data)`, `searchDoctors(String query)`, `createDoctor(Map data)`

#### Phase 4: Update main.dart
- Register CustomerProvider and DoctorProvider in MultiProvider

#### Phase 5: Update SalesScreen.dart
- Add customer/doctor selection section ABOVE medicine search
- Integrate with existing cart and summary
- Pass customer/doctor IDs to Complete Sale flow

### 🎨 UI Components to Create
1. **Customer Selection Section**
   - Search input with real-time filtering
   - Dropdown with customer list (name + phone)
   - Selected customer display with clear button
   - Quick-add customer button

2. **Doctor Selection Section**
   - Search input with real-time filtering
   - Dropdown with doctor list (name + specialization + phone)
   - Selected doctor display with clear button
   - Quick-add doctor button

3. **Quick-Add Modals**
   - Customer modal: name, phone, email (optional), address (optional)
   - Doctor modal: name, phone, specialization, commission percentage

### ✅ Integration Points
- Customer/Doctor sections positioned ABOVE medicine search
- Selected customer/doctor displayed in order summary
- Customer credit status affects payment method options
- Doctor commission info displayed in summary
- Pass customer_id and doctor_id to createSale API

### 📝 Validation Rules
✓ Customer name required, phone required (10 digits)
✓ Doctor name required, phone required (10 digits), specialization required
✓ Search minimum 1 character
✓ Only active customers/doctors shown in search
✓ Credit payment only available for customers with credit facility

---

## ❓ CONFIRMATION NEEDED

**Do you understand this task and are you ready for me to proceed with implementation?**

Please confirm:
1. ✅ Create Customer.dart and Doctor.dart models?
2. ✅ Create CustomerProvider.dart and DoctorProvider.dart?
3. ✅ Update API service with customer/doctor endpoints?
4. ✅ Update main.dart to register providers?
5. ✅ Update SalesScreen.dart with customer/doctor selection UI?
6. ✅ Estimated 2-3 hour implementation time?

Once you confirm, I'll proceed with implementation step by step!


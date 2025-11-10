# 📐 Code Structure Reference - Customer & Doctor Management

## File Organization

```
shelfcure_mobile/
├── lib/
│   ├── models/
│   │   ├── customer.dart (NEW)
│   │   ├── doctor.dart (NEW)
│   │   ├── medicine.dart
│   │   └── cart_item.dart
│   ├── providers/
│   │   ├── customer_provider.dart (NEW)
│   │   ├── doctor_provider.dart (NEW)
│   │   ├── medicine_provider.dart
│   │   └── sales_provider.dart
│   ├── screens/
│   │   └── sales/
│   │       └── sales_screen.dart (UPDATED)
│   ├── services/
│   │   └── api_service.dart (UPDATED)
│   └── main.dart (UPDATED)
```

---

## Key Classes & Methods

### Customer Model
```dart
class Customer {
  final String id, name, phone, email?, address?;
  final double creditLimit, creditBalance, discountPercentage;
  final String creditStatus, status;
  
  bool get hasCreditFacility => creditLimit > 0;
  bool get isActive => status == 'active';
  String get displayName => '$name - $phone';
}
```

### Doctor Model
```dart
class Doctor {
  final String id, name, phone, email?, specialization?;
  final double commissionRate;
  final String commissionType, status;
  
  String get fullName => 'Dr. $name';
  bool get isActive => status == 'active';
}
```

### CustomerProvider Methods
```dart
Future<void> fetchCustomers()
void searchCustomers(String query)
void selectCustomer(Customer customer)
void clearCustomer()
Future<bool> createCustomer({...})
void clearError()
```

### DoctorProvider Methods
```dart
Future<void> fetchDoctors()
void searchDoctors(String query)
void selectDoctor(Doctor doctor)
void clearDoctor()
Future<bool> createDoctor({...})
void clearError()
```

### SalesScreen UI Methods
```dart
Widget _buildCustomerSelectionSection(...)
Widget _buildDoctorSelectionSection(...)
Widget _buildOrderSummarySection(...) // UPDATED
Widget _buildPOSTab(...) // UPDATED with Consumer3
```

### ApiService Endpoints
```dart
Future<Map> getCustomers({int page, int limit})
Future<Map> searchCustomers(String query)
Future<Map> createCustomer(Map customerData)
Future<Map> getDoctors({int page, int limit})
Future<Map> searchDoctors(String query)
Future<Map> createDoctor(Map doctorData)
```

---

## State Flow

```
User Input
    ↓
SalesScreen (UI)
    ↓
CustomerProvider/DoctorProvider (State)
    ↓
ApiService (API Calls)
    ↓
Backend API
    ↓
Response → Provider → UI Update
```

---

## Integration Points

1. **main.dart**: Provider registration
2. **SalesScreen.dart**: UI components with POS tab and customer/doctor selection
3. **ApiService.dart**: API endpoints
4. **Models**: Data serialization

---

**Reference Date**: 2025-11-08


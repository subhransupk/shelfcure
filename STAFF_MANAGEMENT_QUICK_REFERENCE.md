# 🚀 Staff Management Quick Reference Guide

## 📍 Quick Navigation

### **Store Manager Panel:**
- **URL:** `/store-manager/staff`
- **Component:** `StoreManagerStaff.jsx`
- **Features:** Full staff management, attendance, payroll

### **Store Owner Panel:**
- **URL:** `/store-owner/staff`
- **Component:** `StoreOwnerStaffPage.jsx`
- **Features:** Cross-store staff overview

---

## 🔑 Key Concepts

### **Staff Roles:**
```
store_manager      - Store Manager (highest level)
pharmacist         - Licensed Pharmacist
assistant          - Pharmacy Assistant
cashier            - Cashier/Billing Staff
inventory_manager  - Inventory Manager
sales_executive    - Sales Executive
supervisor         - Supervisor
```

### **Departments:**
```
pharmacy           - Pharmacy Department
sales              - Sales Department
inventory          - Inventory Department
administration     - Administration
customer_service   - Customer Service
```

### **Staff Status:**
```
active             - Currently working
inactive           - Deactivated (soft deleted)
on_leave           - Currently on leave
terminated         - Employment ended
```

### **Attendance Status:**
```
present            - Staff was present
absent             - Staff was absent
half_day           - Half day attendance
late               - Came late
sick_leave         - On sick leave
casual_leave       - On casual leave
holiday            - Store holiday
```

### **Payment Status:**
```
pending            - Not yet paid
processing         - Payment in progress
paid               - Payment completed
cancelled          - Payment cancelled
on_hold            - Payment on hold
```

---

## 📋 Common Operations

### **1. Add New Staff Member**

**API Endpoint:**
```
POST /api/store-manager/staff
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "role": "pharmacist",
  "department": "pharmacy",
  "dateOfJoining": "2024-01-15",
  "salary": 35000,
  "workingHours": "full_time",
  "address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "9876543211",
    "relationship": "Spouse"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Staff member created successfully",
  "data": {
    "_id": "...",
    "name": "John Doe",
    "employeeId": "PHR001",
    "status": "active",
    ...
  }
}
```

---

### **2. Get All Staff**

**API Endpoint:**
```
GET /api/store-manager/staff?page=1&limit=20&search=john&role=pharmacist&status=active
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `search` - Search term (searches name, email, phone, employeeId)
- `role` - Filter by role
- `department` - Filter by department
- `status` - Filter by status (default: active)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  },
  "data": [...]
}
```

---

### **3. Mark Attendance**

**API Endpoint:**
```
POST /api/store-manager/attendance/mark
```

**Request Body (Present with auto check-in):**
```json
{
  "staffId": "staff_id_here",
  "date": "2024-01-15",
  "status": "present"
}
```

**Request Body (With manual times):**
```json
{
  "staffId": "staff_id_here",
  "date": "2024-01-15",
  "status": "present",
  "checkIn": "2024-01-15T09:00:00Z",
  "checkOut": "2024-01-15T18:00:00Z"
}
```

**Request Body (Leave):**
```json
{
  "staffId": "staff_id_here",
  "date": "2024-01-15",
  "status": "sick_leave",
  "notes": "Medical leave"
}
```

---

### **4. Get Attendance Statistics**

**API Endpoint:**
```
GET /api/store-manager/attendance/stats?date=2024-01-15
```

**Response:**
```json
{
  "success": true,
  "date": "2024-01-15",
  "stats": {
    "totalStaff": 10,
    "present": 8,
    "absent": 1,
    "late": 0,
    "onLeave": 1,
    "notMarked": 0
  }
}
```

---

### **5. Process Monthly Payroll**

**API Endpoint:**
```
POST /api/store-manager/payroll/process
```

**Request Body:**
```json
{
  "month": "2024-01",
  "staffIds": ["staff_id_1", "staff_id_2"]
}
```
*Note: If `staffIds` is not provided, processes all active staff*

**Response:**
```json
{
  "success": true,
  "message": "Payroll processed successfully",
  "processed": 8,
  "failed": 0,
  "results": [
    {
      "staffId": "...",
      "staffName": "John Doe",
      "payrollId": "...",
      "netSalary": 33500
    }
  ]
}
```

---

### **6. Update Payroll Payment Status**

**API Endpoint:**
```
PUT /api/store-manager/payroll/:id/status
```

**Request Body:**
```json
{
  "status": "paid",
  "paymentMethod": "bank_transfer",
  "paymentReference": "TXN123456",
  "paymentDate": "2024-02-01",
  "notes": "Salary for January 2024"
}
```

---

### **7. Generate Payslip**

**API Endpoint:**
```
GET /api/store-manager/payroll/:id/payslip
```

**Response:**
```json
{
  "success": true,
  "message": "Payslip generated for John Doe",
  "data": {
    "staff": {...},
    "store": {...},
    "salaryPeriod": "January 2024",
    "baseSalary": 35000,
    "allowances": {...},
    "deductions": {...},
    "grossSalary": 38500,
    "netSalary": 33500,
    "attendanceData": {...},
    "paymentStatus": "paid",
    "paymentDate": "2024-02-01"
  }
}
```

---

## 🎯 Frontend Component Usage

### **StoreManagerStaff Component**

**Import:**
```javascript
import StoreManagerStaff from '../pages/StoreManagerStaff';
```

**Usage:**
```jsx
<Route path="/store-manager/staff" element={<StoreManagerStaff />} />
```

**State Management:**
```javascript
const [staff, setStaff] = useState([]);
const [loading, setLoading] = useState(true);
const [activeTab, setActiveTab] = useState('list'); // 'list', 'attendance', 'payroll', 'add'
```

**Key Functions:**
```javascript
// Fetch staff
const fetchStaff = async () => {
  const response = await fetch('/api/store-manager/staff?page=1&limit=20', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  setStaff(data.data);
};

// Mark attendance
const markAttendance = async (staffId, status) => {
  await fetch('/api/store-manager/attendance/mark', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ staffId, date: new Date(), status })
  });
};

// Process payroll
const processPayroll = async (month) => {
  await fetch('/api/store-manager/payroll/process', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ month })
  });
};
```

---

## 🔍 Database Queries

### **Find Staff by Store:**
```javascript
const staff = await Staff.find({ store: storeId, status: 'active' })
  .populate('createdBy', 'name')
  .sort({ name: 1 });
```

### **Find Attendance for Date:**
```javascript
const attendance = await StaffAttendance.find({
  store: storeId,
  date: {
    $gte: new Date(date).setHours(0, 0, 0, 0),
    $lt: new Date(date).setHours(23, 59, 59, 999)
  }
}).populate('staff', 'name employeeId role');
```

### **Find Payroll for Month:**
```javascript
const payroll = await StaffSalary.find({
  store: storeId,
  month: monthNum,
  year: year
}).populate('staff', 'name email employeeId');
```

### **Get Attendance Summary:**
```javascript
const summary = await StaffAttendance.getAttendanceSummary(staffId, month, year);
```

---

## 🛠️ Utility Functions

### **Generate Employee ID:**
```javascript
const generateEmployeeId = (role, count) => {
  const prefixes = {
    'store_manager': 'MGR',
    'pharmacist': 'PHR',
    'assistant': 'AST',
    'cashier': 'CSH',
    'inventory_manager': 'INV',
    'sales_executive': 'SLS',
    'supervisor': 'SUP'
  };
  
  const prefix = prefixes[role] || 'EMP';
  const number = String(count + 1).padStart(3, '0');
  return `${prefix}${number}`;
};
```

### **Calculate Working Hours:**
```javascript
const calculateWorkingHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const diffMs = new Date(checkOut) - new Date(checkIn);
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
};
```

### **Calculate Pro-rated Salary:**
```javascript
const calculateProRatedSalary = (baseSalary, daysWorked, totalDays = 26) => {
  return (baseSalary * daysWorked) / totalDays;
};
```

---

## ⚠️ Important Notes

### **Employee ID Generation:**
- Auto-generated based on role prefix
- Sequential numbering per store
- Format: `PREFIX###` (e.g., PHR001, MGR002)
- Unique per store (compound index: store + employeeId)

### **Attendance Rules:**
- One attendance record per staff per day
- Compound unique index enforces this
- Use `findOneAndUpdate` for updates, not `create`
- Auto-calculates working hours from check-in/check-out

### **Payroll Rules:**
- One payroll record per staff per month
- Compound unique index enforces this
- Cannot re-process same month (will throw duplicate key error)
- Auto-calculates gross and net salary

### **Soft Delete:**
- Staff deletion sets status to 'inactive'
- Data preserved for historical records
- Can be reactivated by changing status back to 'active'

### **Store Manager Auto-inclusion:**
- Store managers automatically added to staff collection
- Happens on first access to staff list
- Ensures manager appears in staff records

---

## 🐛 Troubleshooting

### **Issue: Duplicate Employee ID**
**Solution:** Employee IDs are unique per store. Check if staff already exists with that ID.

### **Issue: Cannot mark attendance twice**
**Solution:** Use update instead of create. One attendance record per staff per day.

### **Issue: Payroll already processed**
**Solution:** Cannot re-process same month. Delete existing records first or update them.

### **Issue: Staff not appearing in list**
**Solution:** Check status filter. Default shows only 'active' staff. Use `status=all` to see all.

### **Issue: Working hours not calculating**
**Solution:** Ensure both check-in and check-out times are provided. Pre-save middleware calculates automatically.

---

## 📊 Sample Data

### **Sample Staff Record:**
```json
{
  "_id": "65abc123...",
  "name": "Dr. Rajesh Kumar",
  "email": "rajesh@pharmacy.com",
  "phone": "9876543210",
  "employeeId": "PHR001",
  "role": "pharmacist",
  "department": "pharmacy",
  "dateOfJoining": "2024-01-01",
  "salary": 45000,
  "workingHours": "full_time",
  "status": "active",
  "hasSystemAccess": true,
  "permissions": ["inventory_read", "inventory_write", "sales_read", "sales_write"],
  "performanceRating": 4,
  "attendancePercentage": 95,
  "store": "65abc456...",
  "createdBy": "65abc789...",
  "createdAt": "2024-01-01T10:00:00Z"
}
```

### **Sample Attendance Record:**
```json
{
  "_id": "65def123...",
  "staff": "65abc123...",
  "store": "65abc456...",
  "date": "2024-01-15",
  "month": 1,
  "year": 2024,
  "status": "present",
  "checkIn": {
    "time": "2024-01-15T09:00:00Z",
    "method": "manual"
  },
  "checkOut": {
    "time": "2024-01-15T18:00:00Z",
    "method": "manual"
  },
  "workingHours": {
    "scheduled": 8,
    "actual": 9,
    "overtime": 1,
    "break": 0
  },
  "createdAt": "2024-01-15T09:00:00Z"
}
```

### **Sample Payroll Record:**
```json
{
  "_id": "65ghi123...",
  "staff": "65abc123...",
  "store": "65abc456...",
  "month": 1,
  "year": 2024,
  "baseSalary": 45000,
  "allowances": {
    "hra": 9000,
    "da": 2250,
    "medical": 1500,
    "transport": 1000
  },
  "deductions": {
    "pf": 5400,
    "esi": 675,
    "tds": 2000
  },
  "attendanceData": {
    "totalWorkingDays": 26,
    "daysWorked": 24,
    "daysAbsent": 2,
    "overtimeHours": 5
  },
  "grossSalary": 58750,
  "totalAllowances": 13750,
  "totalDeductions": 8075,
  "netSalary": 50675,
  "paymentStatus": "paid",
  "paymentDate": "2024-02-01",
  "paymentMethod": "bank_transfer",
  "paymentReference": "TXN123456"
}
```

---

## 🎓 Best Practices

1. **Always validate input data** on both frontend and backend
2. **Use transactions** for critical operations (payroll processing)
3. **Log all staff-related activities** for audit trail
4. **Soft delete** instead of hard delete to preserve history
5. **Auto-calculate** working hours and salary amounts
6. **Validate unique constraints** before creating records
7. **Populate references** when fetching data for better UX
8. **Use indexes** for frequently queried fields
9. **Handle errors gracefully** with user-friendly messages
10. **Test attendance and payroll calculations** thoroughly

---

## 📞 Support

For issues or questions about Staff Management:
1. Check this quick reference guide
2. Review the comprehensive guide (STAFF_MANAGEMENT_COMPREHENSIVE_GUIDE.md)
3. Check the database models in `shelfcure-backend/models/`
4. Review the controllers in `shelfcure-backend/controllers/`
5. Check the frontend components in `shelfcure-frontend/src/pages/`

---

**Last Updated:** 2025-01-16
**Version:** 1.0


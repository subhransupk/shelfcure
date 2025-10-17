# 📋 ShelfCure Staff Management System - Comprehensive Guide

## 🎯 Overview

ShelfCure has a **comprehensive Staff Management System** that handles employee management, attendance tracking, and payroll processing for pharmacy stores. The system is accessible from both **Store Manager Panel** and **Store Owner Panel** with different levels of access and functionality.

---

## 🏗️ System Architecture

### **Two Separate Staff Management Systems:**

1. **Store Manager Staff Management** (Store Panel)
   - Full-featured staff management for individual stores
   - Includes attendance tracking and payroll processing
   - Route: `/api/store-manager/staff`
   - Frontend: `StoreManagerStaff.jsx`

2. **Store Owner Staff Management** (Owner Panel)
   - Cross-store staff overview
   - Simplified staff management across multiple stores
   - Route: `/api/store-owner/staff`
   - Frontend: `StoreOwnerStaffPage.jsx`

---

## 📊 Database Models

### **1. Staff Model** (`Staff.js`)
The primary staff record containing all employee information.

#### **Basic Information:**
- `name` - Staff member's full name (required, max 100 chars)
- `email` - Unique email address (required, validated)
- `phone` - 10-digit phone number (required, validated)
- `employeeId` - Unique employee ID per store (auto-generated, uppercase)

#### **Role and Department:**
- `role` - Employee role (enum):
  - `store_manager`
  - `pharmacist`
  - `assistant`
  - `cashier`
  - `inventory_manager`
  - `sales_executive`
  - `supervisor`
  
- `department` - Department assignment (enum):
  - `pharmacy`
  - `sales`
  - `inventory`
  - `administration`
  - `customer_service`

#### **Employment Details:**
- `dateOfJoining` - Date when employee joined (required)
- `salary` - Monthly salary amount (required, min: 0)
- `workingHours` - Employment type (enum):
  - `full_time`
  - `part_time`
  - `contract`

#### **Personal Information:**
- `address` - Object containing:
  - `street`, `city`, `state`, `pincode` (6-digit)
- `dateOfBirth` - Employee's date of birth
- `emergencyContact` - Object containing:
  - `name`, `phone` (10-digit), `relationship`

#### **Qualifications and Certifications:**
- `qualifications` - Array of objects:
  - `degree`, `institution`, `year`
- `certifications` - Array of objects:
  - `name`, `issuedBy`, `validUntil`

#### **Store Association:**
- `store` - Reference to Store (required)

#### **Performance and Attendance:**
- `performanceRating` - Rating from 1-5 (default: 3)
- `totalLeaves` - Total leaves taken (default: 0)
- `attendancePercentage` - Percentage (0-100, default: 100)

#### **Status and Access:**
- `status` - Employee status (enum):
  - `active` - Currently working
  - `inactive` - Deactivated/soft deleted
  - `on_leave` - Currently on leave
  - `terminated` - Employment ended
  
- `hasSystemAccess` - Boolean for system login access
- `permissions` - Array of permission strings:
  - `inventory_read`, `inventory_write`
  - `sales_read`, `sales_write`
  - `reports_read`
  - `customer_management`

#### **Audit Fields:**
- `createdBy` - User who created the record (required)
- `updatedBy` - User who last updated the record
- `timestamps` - Auto-generated `createdAt` and `updatedAt`

#### **Indexes:**
- Compound unique index: `store + employeeId` (ensures unique employee IDs per store)
- Single indexes: `store`, `email`, `role`, `status`
- Compound index: `store + status`

---

### **2. StaffAttendance Model** (`StaffAttendance.js`)
Tracks daily attendance for staff members.

#### **Core Fields:**
- `staff` - Reference to Staff (required, indexed)
- `user` - Reference to User (for backward compatibility)
- `store` - Reference to Store (required, indexed)
- `date` - Attendance date (required, indexed)
- `month` - Month number (1-12, auto-calculated)
- `year` - Year (auto-calculated)

#### **Attendance Status:**
- `status` - Attendance status (enum, required):
  - `present` - Staff was present
  - `absent` - Staff was absent
  - `half_day` - Half day attendance
  - `late` - Came late
  - `sick_leave` - On sick leave
  - `casual_leave` - On casual leave
  - `holiday` - Store holiday

#### **Time Tracking:**
- `checkIn` - Object containing:
  - `time` - Check-in timestamp
  - `location` - Object with `latitude`, `longitude`, `address`
  - `method` - Enum: `manual`, `biometric`, `mobile_app`, `web`
  
- `checkOut` - Object containing:
  - `time` - Check-out timestamp
  - `location` - Object with `latitude`, `longitude`, `address`
  - `method` - Enum: `manual`, `biometric`, `mobile_app`, `web`

#### **Working Hours:**
- `workingHours` - Object containing:
  - `scheduled` - Scheduled hours (default: 8)
  - `actual` - Actual hours worked (auto-calculated)
  - `overtime` - Overtime hours (auto-calculated)
  - `break` - Break time in hours

#### **Leave Information:**
- `leaveDetails` - Object containing:
  - `type` - Leave type (enum): `sick`, `casual`, `emergency`, `maternity`, `paternity`, `annual`, `other`
  - `reason` - Leave reason
  - `appliedDate` - When leave was applied
  - `approvedBy` - User reference
  - `approvedDate` - Approval date
  - `documents` - Array of document objects

#### **Performance Tracking:**
- `performance` - Object containing:
  - `rating` - Daily performance rating (1-5)
  - `notes` - Performance notes
  - `tasks_completed` - Number of tasks completed
  - `customer_interactions` - Number of customer interactions

#### **Administrative:**
- `notes` - General notes
- `isHoliday` - Boolean flag
- `holidayName` - Name of holiday
- `approvalStatus` - Enum: `pending`, `approved`, `rejected`
- `approvedBy` - User reference
- `approvedAt` - Approval timestamp

#### **Indexes:**
- Compound unique index: `staff + date` (one attendance record per staff per day)
- Compound indexes: `store + date`, `store + month + year`
- Single index: `status`

#### **Virtual Fields:**
- `formattedDate` - Formatted date string
- `totalHours` - Calculated total hours worked
- `isLate` - Boolean indicating if check-in was late

#### **Pre-save Middleware:**
- Auto-calculates `month` and `year` from `date`
- Auto-calculates `actual` working hours from check-in/check-out
- Auto-calculates `overtime` if worked more than scheduled hours

#### **Static Methods:**
- `getAttendanceSummary(staffId, month, year)` - Get attendance summary for a staff member
- `getStoreAttendanceSummary(storeId, month, year)` - Get attendance summary for entire store

---

### **3. StaffSalary Model** (`StaffSalary.js`)
Manages monthly salary processing and payments.

#### **Core Fields:**
- `staff` - Reference to Staff (required, indexed)
- `user` - Reference to User (for backward compatibility)
- `store` - Reference to Store (required, indexed)
- `month` - Salary month (1-12, required)
- `year` - Salary year (required)

#### **Salary Structure:**
- `baseSalary` - Base monthly salary (required, min: 0)
- `allowances` - Object containing:
  - `hra` - House Rent Allowance
  - `da` - Dearness Allowance
  - `medical` - Medical Allowance
  - `transport` - Transport Allowance
  - `bonus` - Bonus amount
  - `incentive` - Performance incentive
  - `overtime` - Object with `hours` and `amount`
  - `other` - Array of custom allowances

- `deductions` - Object containing:
  - `pf` - Provident Fund
  - `esi` - Employee State Insurance
  - `tds` - Tax Deducted at Source
  - `advance` - Advance deduction
  - `loan` - Loan deduction
  - `fine` - Fine/penalty
  - `absentDeduction` - Object with `days` and `amount`
  - `other` - Array of custom deductions

#### **Attendance Data:**
- `attendanceData` - Object containing:
  - `totalWorkingDays` - Total working days in month (required)
  - `daysWorked` - Days actually worked (required)
  - `daysAbsent` - Days absent (default: 0)
  - `halfDays` - Half days (default: 0)
  - `overtimeHours` - Overtime hours (default: 0)
  - `leaveDays` - Leave days (default: 0)

#### **Calculated Amounts:**
- `grossSalary` - Base + Allowances (auto-calculated)
- `totalAllowances` - Sum of all allowances (auto-calculated)
- `totalDeductions` - Sum of all deductions (auto-calculated)
- `netSalary` - Gross - Deductions (auto-calculated)

#### **Payment Information:**
- `paymentStatus` - Enum (default: `pending`):
  - `pending` - Not yet paid
  - `processing` - Payment in progress
  - `paid` - Payment completed
  - `cancelled` - Payment cancelled
  - `on_hold` - Payment on hold
  
- `paymentDate` - Date of payment
- `paymentMethod` - Enum (default: `bank_transfer`):
  - `cash`, `bank_transfer`, `cheque`, `upi`, `other`
- `paymentReference` - Payment reference number

#### **Bank Details:**
- `bankDetails` - Object containing:
  - `accountNumber`, `ifscCode`, `bankName`, `accountHolderName`

#### **Approval Workflow:**
- `approvalStatus` - Enum (default: `draft`):
  - `draft` - Not submitted
  - `pending_approval` - Awaiting approval
  - `approved` - Approved
  - `rejected` - Rejected
- `approvedBy` - User reference
- `approvedAt` - Approval timestamp
- `rejectionReason` - Reason for rejection

#### **Additional Information:**
- `notes` - Additional notes
- `payslipGenerated` - Boolean flag
- `payslipUrl` - URL to generated payslip

#### **Indexes:**
- Compound unique index: `staff + month + year` (one salary record per staff per month)
- Compound indexes: `store + month + year`, `storeOwner + month + year`
- Single indexes: `paymentStatus`, `approvalStatus`

#### **Virtual Fields:**
- `salaryPeriod` - Formatted period string (e.g., "January 2024")
- `isPaid` - Boolean indicating if payment is complete

#### **Pre-save Middleware:**
- Auto-calculates `totalAllowances`
- Auto-calculates `totalDeductions`
- Auto-calculates `grossSalary`
- Auto-calculates `netSalary`

#### **Static Methods:**
- `getSalarySummary(staffId, year)` - Get annual salary summary
- `getStoreWiseSalarySummary(storeOwnerId, month, year)` - Get store-wise breakdown

---

### **4. StaffSalaryConfig Model** (`StaffSalaryConfig.js`)
Stores salary configuration templates for staff members.

#### **Core Fields:**
- `staff` - Reference to Staff (required, indexed)
- `store` - Reference to Store (required, indexed)
- `baseSalary` - Base monthly salary (required)
- `hourlyRate` - Calculated hourly rate

#### **Allowance Configuration:**
- Percentage-based allowances (HRA, DA, Medical, Transport)
- Fixed allowances (Bonus, Incentive)
- Overtime configuration with rate multiplier

#### **Deduction Configuration:**
- Percentage-based deductions (PF, ESI, TDS)
- Fixed deductions (Advance, Loan, Fine)
- Per-day absent deduction rate

#### **Pay Schedule:**
- `frequency` - Enum: `monthly`, `bi-weekly`, `weekly`
- `payDay` - Day of month for payment (1-31)

#### **Bank Details:**
- Account information for salary transfer

#### **Status:**
- `status` - Enum: `active`, `inactive`, `suspended`
- `effectiveFrom` - Start date
- `effectiveTo` - End date (optional)

---

## 🔧 API Endpoints

### **Store Manager Routes** (`/api/store-manager/`)

#### **Staff Management:**
```
GET    /staff                    - Get all staff (with filters)
POST   /staff                    - Create new staff member
GET    /staff/stats              - Get staff statistics
GET    /staff/:id                - Get single staff member
PUT    /staff/:id                - Update staff member
DELETE /staff/:id                - Delete (soft delete) staff member
```

#### **Attendance Management:**
```
GET    /attendance               - Get attendance records
POST   /attendance/mark          - Mark attendance for a staff member
POST   /attendance/bulk          - Bulk mark attendance
GET    /attendance/stats         - Get attendance statistics
GET    /attendance/staff-list    - Get staff with today's attendance
GET    /attendance/history       - Get attendance history
POST   /attendance/manual-time   - Set manual check-in/check-out time
```

#### **Payroll Management:**
```
GET    /payroll                  - Get payroll records
POST   /payroll/process          - Process payroll for month
GET    /payroll/stats            - Get payroll statistics
GET    /payroll/:id              - Get single payroll record
PUT    /payroll/:id/status       - Update payroll payment status
GET    /payroll/:id/payslip      - Generate payslip
```

### **Store Owner Routes** (`/api/store-owner/`)

#### **Staff Management:**
```
GET    /staff                    - Get all staff across all stores
GET    /stores/:storeId/staff    - Get staff for specific store
POST   /stores/:storeId/staff    - Create staff for specific store
GET    /staff/:id                - Get staff details
PUT    /staff/:id                - Update staff
DELETE /staff/:id                - Delete staff
```

---

## 🎨 Frontend Components

### **Store Manager Panel:**

#### **Main Component:** `StoreManagerStaff.jsx`
A comprehensive staff management interface with **4 main tabs**:

1. **Staff List Tab** (`list`)
   - View all staff members
   - Search and filter by role, department, status
   - Pagination support
   - Quick actions: View, Edit, Delete, View Attendance History
   - Quick mark attendance button
   - Staff statistics cards showing:
     - Total Staff
     - Active Staff
     - Today's Present
     - Current Month Payroll

2. **Attendance Tab** (`attendance`)
   - Daily attendance tracking
   - View staff with today's attendance status
   - Mark attendance with status: Present, Absent, Late, Leave
   - Check-in/Check-out time tracking
   - Manual time entry option
   - Attendance statistics:
     - Total Staff
     - Present
     - Absent
     - Late
     - On Leave
     - Not Marked
   - Attendance history view

3. **Payroll Tab** (`payroll`)
   - Monthly payroll management
   - Process payroll for selected month
   - View payroll records with details
   - Update payment status
   - Generate payslips
   - Payroll statistics:
     - Total Payroll Amount
     - Total Staff
     - Processed Count
     - Paid Count
     - Pending Count
     - Average Salary

4. **Add Staff Tab** (`add`)
   - Comprehensive form to add new staff
   - Fields for all staff information
   - Validation and error handling
   - Auto-generate employee ID option

#### **Key Features:**
- Real-time search and filtering
- Responsive design
- Auto-refresh on data changes
- Error and success messages
- Loading states
- Modal popups for details
- Confirmation dialogs for delete actions

### **Store Owner Panel:**

#### **Main Component:** `StoreOwnerStaffPage.jsx`
Simplified staff overview across all stores.

#### **Features:**
- Grid view of all staff members
- Search functionality
- Filter by store, role, status
- Add staff modal
- Edit staff modal
- View staff details
- Delete staff with confirmation

#### **Supporting Components:**
- `AddStaffModal.jsx` - Modal for adding new staff
- `EditStaffModal.jsx` - Modal for editing staff details

---

## 🔄 Key Workflows

### **1. Adding a New Staff Member:**

**Store Manager Flow:**
1. Navigate to Staff Management
2. Click "Add Staff" button or switch to "Add" tab
3. Fill in required information:
   - Basic info (name, email, phone)
   - Role and department
   - Employment details (joining date, salary, working hours)
   - Personal information (optional)
   - Emergency contact (optional)
4. Employee ID is auto-generated based on role:
   - `MGR###` for store managers
   - `PHR###` for pharmacists
   - `AST###` for assistants
   - `CSH###` for cashiers
   - `INV###` for inventory managers
   - `SLS###` for sales executives
   - `SUP###` for supervisors
5. Submit form
6. Staff record created with status "active"

**Store Owner Flow:**
1. Navigate to Staff Management
2. Click "Add Staff" button
3. Select store from dropdown
4. Fill in staff information
5. Submit form
6. Staff added to selected store

### **2. Marking Attendance:**

**Quick Mark (from Staff List):**
1. Click quick attendance button next to staff member
2. Attendance marked as "present" with current time as check-in

**Detailed Mark (from Attendance Tab):**
1. Switch to Attendance tab
2. View list of staff with current attendance status
3. For each staff member, options to:
   - Mark Present (auto check-in)
   - Mark Late (auto check-in)
   - Mark Absent
   - Mark on Leave (sick/casual)
   - Manual Check-in (set custom time)
   - Manual Check-out (set custom time)
4. Attendance record created/updated in database

**Bulk Mark:**
1. Select multiple staff members
2. Choose status to apply
3. Bulk mark attendance for all selected

### **3. Processing Payroll:**

**Monthly Payroll Processing:**
1. Navigate to Payroll tab
2. Select month (YYYY-MM format)
3. Click "Process Payroll" button
4. System automatically:
   - Fetches all active staff
   - Retrieves attendance data for the month
   - Calculates working days, absent days, overtime
   - Applies salary configuration
   - Calculates allowances and deductions
   - Generates payroll records
5. View processed payroll in table
6. Update payment status as needed
7. Generate payslips for staff

**Payment Status Updates:**
1. Find payroll record
2. Click status update button
3. Change status: Pending → Processing → Paid
4. Add payment reference and notes
5. Save changes

### **4. Viewing Staff Details:**

**From Staff List:**
1. Click "View" (eye icon) button
2. Modal opens showing:
   - Basic information
   - Employment details
   - Personal information
   - Emergency contact
   - Qualifications and certifications
   - Performance metrics
   - Current status

**Viewing Attendance History:**
1. Click "History" button for staff member
2. View detailed attendance history
3. Filter by date range
4. See check-in/check-out times
5. View attendance statistics

---

## 🔐 Security and Permissions

### **Access Control:**
- All staff routes protected by authentication middleware
- Store Manager can only access staff in their assigned store
- Store Owner can access staff across all their stores
- Feature access controlled by subscription plan

### **Data Validation:**
- Email format validation
- Phone number validation (10 digits)
- Pincode validation (6 digits)
- Salary minimum value validation
- Date validations
- Enum validations for status, role, department

### **Audit Trail:**
- `createdBy` field tracks who created the record
- `updatedBy` field tracks who last modified
- Timestamps track when changes occurred
- Activity logging for all staff operations

---

## 📈 Statistics and Analytics

### **Staff Statistics:**
- Total staff count
- Active/Inactive breakdown
- Role distribution
- Department distribution
- Average salary
- Total salary expense

### **Attendance Statistics:**
- Daily attendance summary
- Monthly attendance percentage
- Present/Absent/Late counts
- Leave statistics
- Overtime hours tracking

### **Payroll Statistics:**
- Total payroll amount
- Processed vs pending count
- Paid vs unpaid count
- Average salary
- Gross vs net salary comparison
- Deduction breakdown

---

## 🚀 Advanced Features

### **1. Auto-generation of Employee IDs:**
- Role-based prefixes
- Sequential numbering per store
- Unique per store validation

### **2. Attendance Auto-calculation:**
- Working hours calculated from check-in/check-out
- Overtime automatically detected
- Late marking based on scheduled time

### **3. Payroll Auto-calculation:**
- Pro-rated salary based on attendance
- Automatic allowance calculation
- Automatic deduction calculation
- Overtime pay calculation

### **4. Store Manager Auto-inclusion:**
- When store manager accesses staff list
- System automatically creates staff record for them
- Ensures manager appears in staff list

### **5. Soft Delete:**
- Staff deletion is soft delete (status = 'inactive')
- Data preserved for historical records
- Can be reactivated if needed

---

## 🐛 Known Issues and Considerations

### **1. Dual User System:**
- Staff records exist in both `User` and `Staff` collections
- `User` collection for authentication
- `Staff` collection for detailed HR management
- Both references maintained for backward compatibility

### **2. Store Manager Duplication:**
- Store managers exist as both users and staff
- Auto-creation logic ensures they appear in staff list
- May need manual cleanup of duplicate records

### **3. Attendance Uniqueness:**
- One attendance record per staff per day
- Compound unique index enforces this
- Updates should use findOneAndUpdate, not create

### **4. Payroll Uniqueness:**
- One payroll record per staff per month
- Compound unique index enforces this
- Re-processing same month will fail

---

## 📝 Best Practices

### **For Store Managers:**
1. Mark attendance daily at start of shift
2. Process payroll at end of each month
3. Keep staff information updated
4. Review attendance history regularly
5. Generate payslips before payment

### **For Store Owners:**
1. Review staff across all stores regularly
2. Monitor total salary expenses
3. Track staff performance metrics
4. Ensure proper role assignments
5. Maintain emergency contact information

### **For Developers:**
1. Always use Staff model for HR operations
2. Maintain both staff and user references
3. Use soft delete for staff removal
4. Validate all inputs on both frontend and backend
5. Use transactions for critical operations
6. Log all staff-related activities
7. Test attendance and payroll calculations thoroughly

---

## 🎯 Summary

ShelfCure's Staff Management System is a **comprehensive HR solution** that handles:
- ✅ Complete employee lifecycle management
- ✅ Daily attendance tracking with check-in/check-out
- ✅ Automated payroll processing with allowances and deductions
- ✅ Multi-store support for store owners
- ✅ Role-based access control
- ✅ Performance tracking
- ✅ Leave management
- ✅ Payslip generation
- ✅ Detailed analytics and reporting

The system is designed to be **user-friendly**, **scalable**, and **feature-rich** to meet the needs of pharmacy store management.


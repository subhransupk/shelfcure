# 🔧 Payroll System - Quick Troubleshooting Guide

## 🚨 Common Error Messages and Solutions

### Error: "Salary configuration not found"

**Symptom:**
- Click "Process Payroll" button
- Get error message: "Salary configuration not found"
- No payroll records are created

**Root Cause:**
Staff members don't have `StaffSalaryConfig` records in the database.

**Solution:**

**Option 1: Initialize Salary Configs for Existing Staff (QUICK FIX)**

1. Open your browser console (F12)
2. Run this API call:

```javascript
const token = localStorage.getItem('token');

fetch('/api/store-manager/payroll/init-salary-configs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log('✅ Salary configs initialized:', data))
.catch(err => console.error('❌ Error:', err));
```

3. Refresh the page
4. Try processing payroll again

**Option 2: Manually Create Salary Config (FOR TESTING)**

Use MongoDB Compass or shell:

```javascript
db.staffsalaryconfigs.insertOne({
  staff: ObjectId("YOUR_STAFF_ID_HERE"),
  store: ObjectId("YOUR_STORE_ID_HERE"),
  baseSalary: 25000,
  allowances: {
    hra: { enabled: true, type: 'percentage', percentage: 40 },
    da: { enabled: true, type: 'percentage', percentage: 10 },
    medical: { enabled: true, type: 'fixed', amount: 1500 },
    transport: { enabled: true, type: 'fixed', amount: 1000 }
  },
  deductions: {
    pf: { enabled: true, percentage: 12 },
    esi: { enabled: false },
    tds: { enabled: false }
  },
  overtimeConfig: {
    enabled: true,
    rate: 1.5,
    maxHoursPerDay: 4,
    maxHoursPerMonth: 60
  },
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date()
});
```

**Option 3: Fix the Code (PERMANENT FIX)**

See `PAYROLL_SYSTEM_DEBUG_REPORT.md` → Fix #1

---

### Error: "No attendance records found"

**Symptom:**
- Payroll processes but shows 0 working days
- Net salary is 0 or negative
- Error message about missing attendance

**Root Cause:**
No attendance has been marked for the selected month.

**Solution:**

1. Go to **Attendance Tab**
2. Mark attendance for all staff for the selected month
3. Return to **Payroll Tab**
4. Try processing payroll again

**Quick Test Attendance (Browser Console):**

```javascript
const token = localStorage.getItem('token');

// Mark attendance for today
fetch('/api/store-manager/attendance/mark', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    staffId: 'YOUR_STAFF_ID_HERE',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    checkIn: '09:00',
    checkOut: '18:00'
  })
})
.then(res => res.json())
.then(data => console.log('✅ Attendance marked:', data))
.catch(err => console.error('❌ Error:', err));
```

---

### Error: "Payroll already processed for this month"

**Symptom:**
- Click "Process Payroll"
- Get error: "Payroll already processed for this month"
- Can't re-process payroll

**Root Cause:**
Payroll records already exist for the selected month. The system prevents duplicate processing.

**Solution:**

**Option 1: View Existing Payroll**
- The payroll has already been processed
- Check the payroll table to see existing records
- Update payment status if needed

**Option 2: Delete and Re-process (USE WITH CAUTION)**

Only do this if you need to fix incorrect calculations:

```javascript
const token = localStorage.getItem('token');

// First, get the payroll records
fetch('/api/store-manager/payroll?month=2025-01', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
  console.log('Existing payroll records:', data.data);
  
  // Manually delete from database if needed
  // WARNING: This should be done carefully
});
```

Then delete from MongoDB:

```javascript
db.staffsalaries.deleteMany({
  store: ObjectId("YOUR_STORE_ID"),
  month: 1,
  year: 2025
});
```

---

### Error: "calculateAllowances is not a function"

**Symptom:**
- Payroll processing starts but crashes
- Backend error: "salaryConfig.calculateAllowances is not a function"
- 500 Internal Server Error

**Root Cause:**
Salary config is being fetched as a plain object instead of a Mongoose document.

**Solution:**

This requires a code fix. See `PAYROLL_SYSTEM_DEBUG_REPORT.md` → Fix #2

**Temporary Workaround:**
Restart the Node.js server to ensure models are properly loaded.

---

### Error: Incorrect Salary Calculations

**Symptom:**
- Payroll processes successfully
- But gross salary, net salary, or deductions are wrong
- Numbers don't add up

**Root Cause:**
Multiple possible causes:
1. Pre-save middleware overwriting calculations
2. Incorrect absent deduction mapping
3. Missing overtime pay

**Solution:**

**Step 1: Check the Payroll Record**

```javascript
const token = localStorage.getItem('token');

fetch('/api/store-manager/payroll?month=2025-01', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
  console.log('Payroll records:', data.data);
  
  // Check each record
  data.data.forEach(record => {
    console.log('Staff:', record.staff.name);
    console.log('Base Salary:', record.baseSalary);
    console.log('Total Allowances:', record.totalAllowances);
    console.log('Total Deductions:', record.totalDeductions);
    console.log('Gross Salary:', record.grossSalary);
    console.log('Net Salary:', record.netSalary);
    console.log('---');
    
    // Manual calculation
    const expectedGross = record.baseSalary + record.totalAllowances;
    const expectedNet = expectedGross - record.totalDeductions;
    
    console.log('Expected Gross:', expectedGross);
    console.log('Expected Net:', expectedNet);
    console.log('Match:', record.grossSalary === expectedGross && record.netSalary === expectedNet);
  });
});
```

**Step 2: Verify Salary Config**

```javascript
fetch('/api/store-manager/payroll/salary-configs', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
  console.log('Salary configs:', data.data);
  
  data.data.forEach(config => {
    console.log('Staff:', config.staff.name);
    console.log('Base Salary:', config.baseSalary);
    console.log('Allowances:', config.allowances);
    console.log('Deductions:', config.deductions);
  });
});
```

**Step 3: Apply Code Fixes**

See `PAYROLL_SYSTEM_DEBUG_REPORT.md` → Fix #3 and Fix #4

---

## 🧪 Testing Workflow

### Pre-requisites Checklist

Before processing payroll, ensure:

- [ ] **Staff Created**: At least one active staff member exists
- [ ] **Salary Config**: Each staff has a salary configuration
- [ ] **Attendance Marked**: Attendance has been marked for the month
- [ ] **Month Selected**: Correct month is selected in the dropdown

### Step-by-Step Testing

**Step 1: Verify Staff**

```javascript
const token = localStorage.getItem('token');

fetch('/api/store-manager/staff', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
  console.log('✅ Active Staff:', data.data.filter(s => s.status === 'active').length);
  console.log('Staff List:', data.data.map(s => ({ name: s.name, role: s.role, status: s.status })));
});
```

**Step 2: Verify Salary Configs**

```javascript
fetch('/api/store-manager/payroll/salary-configs', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
  console.log('✅ Salary Configs:', data.data.length);
  
  const staffWithoutConfig = data.data.filter(s => !s.salaryConfig);
  if (staffWithoutConfig.length > 0) {
    console.log('❌ Staff without configs:', staffWithoutConfig.map(s => s.name));
  } else {
    console.log('✅ All staff have salary configs');
  }
});
```

**Step 3: Verify Attendance**

```javascript
const selectedMonth = '2025-01'; // Change to your month

fetch(`/api/store-manager/attendance?month=${selectedMonth}`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
  console.log('✅ Attendance Records:', data.data.length);
  
  // Group by staff
  const byStaff = {};
  data.data.forEach(record => {
    const staffId = record.staff._id;
    if (!byStaff[staffId]) {
      byStaff[staffId] = { name: record.staff.name, count: 0 };
    }
    byStaff[staffId].count++;
  });
  
  console.log('Attendance by staff:', byStaff);
});
```

**Step 4: Process Payroll**

```javascript
fetch('/api/store-manager/payroll/process', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    month: '2025-01' // Change to your month
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Payroll processed:', data);
  
  if (data.errors && data.errors.length > 0) {
    console.log('❌ Errors:', data.errors);
  }
  
  if (data.processed && data.processed.length > 0) {
    console.log('✅ Successfully processed:', data.processed.length, 'staff');
  }
})
.catch(err => console.error('❌ Error:', err));
```

**Step 5: Verify Results**

```javascript
fetch(`/api/store-manager/payroll?month=${selectedMonth}`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(res => res.json())
.then(data => {
  console.log('✅ Payroll records created:', data.count);
  console.log('Records:', data.data);
});
```

---

## 🔍 Database Inspection

### Check Collections

**Staff Collection:**
```javascript
db.staff.find({ store: ObjectId("YOUR_STORE_ID"), status: 'active' }).pretty()
```

**Salary Config Collection:**
```javascript
db.staffsalaryconfigs.find({ store: ObjectId("YOUR_STORE_ID"), status: 'active' }).pretty()
```

**Attendance Collection:**
```javascript
db.staffattendances.find({
  store: ObjectId("YOUR_STORE_ID"),
  date: { $gte: ISODate("2025-01-01"), $lte: ISODate("2025-01-31") }
}).pretty()
```

**Payroll Collection:**
```javascript
db.staffsalaries.find({
  store: ObjectId("YOUR_STORE_ID"),
  month: 1,
  year: 2025
}).pretty()
```

---

## 📊 Expected vs Actual Calculations

### Manual Calculation Formula

```
Base Salary (Pro-rated) = (Base Salary × Actual Working Days) / 26

Allowances:
  - HRA = Base Salary × HRA% (if percentage) OR Fixed Amount
  - DA = Base Salary × DA% (if percentage) OR Fixed Amount
  - Medical = Fixed Amount
  - Transport = Fixed Amount
  - Overtime = Overtime Hours × Hourly Rate × Overtime Rate

Gross Salary = Base Salary (Pro-rated) + Total Allowances + Overtime Pay

Deductions:
  - PF = Gross Salary × PF% (if enabled)
  - ESI = Gross Salary × ESI% (if enabled)
  - TDS = Gross Salary × TDS% (if enabled)
  - Absent Deduction = (Base Salary / 26) × Absent Days

Total Deductions = PF + ESI + TDS + Absent Deduction + Other Deductions

Net Salary = Gross Salary - Total Deductions
```

### Example Calculation

**Given:**
- Base Salary: ₹25,000
- Working Days: 22 out of 26
- Absent Days: 4
- HRA: 40% of base
- DA: 10% of base
- Medical: ₹1,500 (fixed)
- Transport: ₹1,000 (fixed)
- PF: 12% of gross
- Overtime: 0 hours

**Calculation:**
```
Pro-rated Base = (25,000 × 22) / 26 = ₹21,153.85

Allowances:
  HRA = 25,000 × 40% = ₹10,000
  DA = 25,000 × 10% = ₹2,500
  Medical = ₹1,500
  Transport = ₹1,000
  Total Allowances = ₹15,000

Gross Salary = 21,153.85 + 15,000 = ₹36,153.85

Deductions:
  PF = 36,153.85 × 12% = ₹4,338.46
  Absent Deduction = (25,000 / 26) × 4 = ₹3,846.15
  Total Deductions = ₹8,184.61

Net Salary = 36,153.85 - 8,184.61 = ₹27,969.24
```

---

## 🆘 Still Having Issues?

### Collect Debug Information

Run this comprehensive debug script:

```javascript
const token = localStorage.getItem('token');
const selectedMonth = '2025-01';

async function debugPayroll() {
  console.log('=== PAYROLL DEBUG REPORT ===\n');
  
  // 1. Check staff
  const staffRes = await fetch('/api/store-manager/staff', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const staffData = await staffRes.json();
  console.log('1. STAFF:');
  console.log('   Total:', staffData.data.length);
  console.log('   Active:', staffData.data.filter(s => s.status === 'active').length);
  console.log('');
  
  // 2. Check salary configs
  const configRes = await fetch('/api/store-manager/payroll/salary-configs', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const configData = await configRes.json();
  console.log('2. SALARY CONFIGS:');
  console.log('   Total:', configData.data.length);
  console.log('   Without config:', configData.data.filter(s => !s.salaryConfig).length);
  console.log('');
  
  // 3. Check attendance
  const attRes = await fetch(`/api/store-manager/attendance?month=${selectedMonth}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const attData = await attRes.json();
  console.log('3. ATTENDANCE:');
  console.log('   Total records:', attData.data.length);
  console.log('');
  
  // 4. Check existing payroll
  const payrollRes = await fetch(`/api/store-manager/payroll?month=${selectedMonth}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const payrollData = await payrollRes.json();
  console.log('4. EXISTING PAYROLL:');
  console.log('   Records:', payrollData.count);
  console.log('');
  
  console.log('=== END DEBUG REPORT ===');
}

debugPayroll();
```

Copy the output and share it for further assistance.

---

**Last Updated:** 2025-01-16
**Version:** 1.0


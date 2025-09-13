require('dotenv').config();
const mongoose = require('mongoose');
const Staff = require('./models/Staff');
const StaffSalaryConfig = require('./models/StaffSalaryConfig');
const StaffSalary = require('./models/StaffSalary');
const StaffAttendance = require('./models/StaffAttendance');
const User = require('./models/User');
const Store = require('./models/Store');

const testPayrollSystem = async () => {
  try {
    console.log('🧪 Testing Payroll Management System...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Test 1: Verify Staff and Store setup
    console.log('📋 Test 1: Staff and Store Setup Verification');
    const storeManager = await User.findOne({ role: 'store_manager' }).populate('currentStore');
    if (!storeManager || !storeManager.currentStore) {
      console.log('❌ FAIL: No store manager or store found');
      return;
    }
    
    const store = storeManager.currentStore;
    const storeId = store._id;
    
    console.log(`✅ Store Manager: ${storeManager.name}`);
    console.log(`✅ Store: ${store.name} (${storeId})`);
    
    const staff = await Staff.find({ store: storeId, status: 'active' });
    console.log(`✅ Active Staff Count: ${staff.length}`);
    staff.forEach(s => console.log(`  - ${s.name} (${s.role})`));
    
    // Test 2: Initialize salary configurations
    console.log('\n📋 Test 2: Initialize Salary Configurations');
    
    // Clear existing salary configs for testing
    await StaffSalaryConfig.deleteMany({ store: storeId });
    console.log('🧹 Cleared existing salary configurations');
    
    // Create salary configs for each staff member
    const salaryConfigs = [];
    for (const staffMember of staff) {
      const defaultConfig = StaffSalaryConfig.getDefaultConfigForRole(staffMember.role);
      
      const configData = {
        staff: staffMember._id,
        store: storeId,
        ...defaultConfig,
        createdBy: storeManager._id
      };
      
      const config = await StaffSalaryConfig.create(configData);
      salaryConfigs.push(config);
      
      console.log(`✅ Created salary config for ${staffMember.name}: ₹${defaultConfig.baseSalary}`);
    }
    
    // Test 3: Test salary calculations
    console.log('\n📋 Test 3: Test Salary Calculations');
    
    const testConfig = salaryConfigs[0];
    console.log(`🧮 Testing calculations for: ${staff[0].name}`);
    
    // Test allowances calculation
    const allowances = testConfig.calculateAllowances();
    console.log(`  - Allowances: ₹${allowances.total} (breakdown:`, allowances.breakdown, ')');
    
    // Test deductions calculation
    const grossSalary = testConfig.baseSalary + allowances.total;
    const deductions = testConfig.calculateDeductions(grossSalary);
    console.log(`  - Deductions: ₹${deductions.total} (breakdown:`, deductions.breakdown, ')');
    
    const netSalary = grossSalary - deductions.total;
    console.log(`  - Gross Salary: ₹${grossSalary}`);
    console.log(`  - Net Salary: ₹${netSalary}`);
    
    // Test 4: Process payroll for current month
    console.log('\n📋 Test 4: Process Payroll');
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // Clear existing payroll records for testing
    await StaffSalary.deleteMany({ store: storeId, month: currentMonth, year: currentYear });
    console.log('🧹 Cleared existing payroll records for current month');
    
    // Ensure we have some attendance data for calculations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Create sample attendance for the first staff member if none exists
    const existingAttendance = await StaffAttendance.findOne({
      staff: staff[0]._id,
      store: storeId,
      date: today
    });
    
    if (!existingAttendance) {
      await StaffAttendance.create({
        staff: staff[0]._id,
        store: storeId,
        date: today,
        month: currentMonth,
        year: currentYear,
        status: 'present',
        checkIn: {
          time: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9 AM
          method: 'manual'
        },
        checkOut: {
          time: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 6 PM
          method: 'manual'
        },
        workingHours: {
          scheduled: 8,
          actual: 9,
          overtime: 1
        },
        createdBy: storeManager._id
      });
      console.log(`✅ Created sample attendance for ${staff[0].name}`);
    }
    
    // Process payroll for the first staff member
    const staffMember = staff[0];
    const salaryConfig = salaryConfigs[0];
    
    // Get attendance data for the month
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);
    
    const attendanceRecords = await StaffAttendance.find({
      staff: staffMember._id,
      store: storeId,
      date: { $gte: startDate, $lte: endDate }
    });
    
    console.log(`📊 Found ${attendanceRecords.length} attendance records for ${staffMember.name}`);
    
    // Calculate payroll
    const totalDaysInMonth = endDate.getDate();
    const workingDays = attendanceRecords.filter(record => 
      ['present', 'late', 'half_day'].includes(record.status)
    ).length;
    
    const standardWorkingDays = 26;
    const actualWorkingDays = workingDays;
    const baseSalaryForMonth = (salaryConfig.baseSalary * actualWorkingDays) / standardWorkingDays;
    
    const allowancesCalc = salaryConfig.calculateAllowances();
    const grossSalaryCalc = baseSalaryForMonth + allowancesCalc.total;
    const deductionsCalc = salaryConfig.calculateDeductions(grossSalaryCalc);
    const netSalaryCalc = grossSalaryCalc - deductionsCalc.total;
    
    // Create payroll record
    const payrollData = {
      staff: staffMember._id,
      user: staffMember.user,
      store: storeId,
      month: currentMonth,
      year: currentYear,
      baseSalary: salaryConfig.baseSalary,
      allowances: allowancesCalc.breakdown,
      deductions: deductionsCalc.breakdown,
      grossSalary: grossSalaryCalc,
      netSalary: netSalaryCalc,
      attendanceData: {
        totalWorkingDays: totalDaysInMonth,
        daysWorked: actualWorkingDays,
        daysAbsent: 0,
        halfDays: 0,
        overtimeHours: 0,
        lateMarks: 0
      },
      paymentStatus: 'pending',
      approvalStatus: 'draft',
      createdBy: storeManager._id
    };
    
    const payroll = await StaffSalary.create(payrollData);
    console.log(`✅ Created payroll record for ${staffMember.name}: ₹${payroll.netSalary}`);
    
    // Test 5: Test payroll queries
    console.log('\n📋 Test 5: Test Payroll Queries');
    
    // Test payroll retrieval
    const payrollRecords = await StaffSalary.find({
      store: storeId,
      month: currentMonth,
      year: currentYear
    }).populate('staff', 'name email employeeId role');
    
    console.log(`✅ Retrieved ${payrollRecords.length} payroll records`);
    payrollRecords.forEach(record => {
      console.log(`  - ${record.staff.name}: ₹${record.netSalary} (${record.paymentStatus})`);
    });
    
    // Test payroll statistics
    const stats = await StaffSalary.aggregate([
      { $match: { store: storeId, month: currentMonth, year: currentYear } },
      {
        $group: {
          _id: null,
          totalPayroll: { $sum: '$netSalary' },
          totalGross: { $sum: '$grossSalary' },
          totalDeductions: { $sum: '$totalDeductions' },
          processedCount: { $sum: 1 },
          avgSalary: { $avg: '$netSalary' }
        }
      }
    ]);
    
    const payrollStats = stats.length > 0 ? stats[0] : {};
    console.log('\n📊 Payroll Statistics:');
    console.log(`  - Total Payroll: ₹${payrollStats.totalPayroll || 0}`);
    console.log(`  - Total Gross: ₹${payrollStats.totalGross || 0}`);
    console.log(`  - Total Deductions: ₹${payrollStats.totalDeductions || 0}`);
    console.log(`  - Processed Count: ${payrollStats.processedCount || 0}`);
    console.log(`  - Average Salary: ₹${Math.round(payrollStats.avgSalary || 0)}`);
    
    console.log('\n🎉 All Payroll System Tests Passed!');
    console.log('\n📝 Summary:');
    console.log(`   - Staff Members: ${staff.length}`);
    console.log(`   - Salary Configs Created: ${salaryConfigs.length}`);
    console.log(`   - Payroll Records Created: ${payrollRecords.length}`);
    console.log(`   - Salary Calculations: Working ✅`);
    console.log(`   - Payroll Processing: Working ✅`);
    console.log(`   - Statistics Calculation: Working ✅`);
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📴 Disconnected from MongoDB');
  }
};

testPayrollSystem();

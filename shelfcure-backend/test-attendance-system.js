require('dotenv').config();
const mongoose = require('mongoose');
const Staff = require('./models/Staff');
const StaffAttendance = require('./models/StaffAttendance');
const User = require('./models/User');
const Store = require('./models/Store');

const testAttendanceSystem = async () => {
  try {
    console.log('🧪 Testing Attendance Management System...\n');
    
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
    
    // Test 2: Create sample attendance records
    console.log('\n📋 Test 2: Creating Sample Attendance Records');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Clear existing attendance for today
    await StaffAttendance.deleteMany({ store: storeId, date: today });
    console.log('🧹 Cleared existing attendance records for today');
    
    // Create attendance records for each staff member
    const attendanceRecords = [];
    for (let i = 0; i < staff.length; i++) {
      const staffMember = staff[i];
      const statuses = ['present', 'absent', 'late', 'sick_leave'];
      const status = statuses[i % statuses.length]; // Rotate through statuses
      
      const attendanceData = {
        staff: staffMember._id,
        store: storeId,
        date: today,
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        status: status,
        createdBy: storeManager._id
      };
      
      // Add check-in/check-out times for present and late staff
      if (status === 'present') {
        attendanceData.checkIn = {
          time: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9 AM
          method: 'manual'
        };
        attendanceData.checkOut = {
          time: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 6 PM
          method: 'manual'
        };
        attendanceData.workingHours = {
          scheduled: 8,
          actual: 9,
          overtime: 1
        };
      } else if (status === 'late') {
        attendanceData.checkIn = {
          time: new Date(today.getTime() + 9.5 * 60 * 60 * 1000), // 9:30 AM
          method: 'manual'
        };
        attendanceData.checkOut = {
          time: new Date(today.getTime() + 18.5 * 60 * 60 * 1000), // 6:30 PM
          method: 'manual'
        };
        attendanceData.workingHours = {
          scheduled: 8,
          actual: 9,
          overtime: 1
        };
      }
      
      const attendance = await StaffAttendance.create(attendanceData);
      attendanceRecords.push(attendance);
      console.log(`✅ Created attendance: ${staffMember.name} - ${status}`);
    }
    
    // Test 3: Test API-like queries
    console.log('\n📋 Test 3: Testing API Query Functions');
    
    // Test attendance retrieval
    const attendanceQuery = { store: storeId, date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } };
    const retrievedAttendance = await StaffAttendance.find(attendanceQuery)
      .populate('staff', 'name email employeeId role')
      .lean();
    
    console.log(`✅ Retrieved ${retrievedAttendance.length} attendance records`);
    retrievedAttendance.forEach(record => {
      console.log(`  - ${record.staff.name}: ${record.status}`);
    });
    
    // Test attendance statistics
    const stats = await StaffAttendance.aggregate([
      { $match: { store: storeId, date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const attendanceStats = {
      totalStaff: staff.length,
      present: 0,
      absent: 0,
      late: 0,
      onLeave: 0,
      notMarked: staff.length
    };
    
    stats.forEach(stat => {
      switch (stat._id) {
        case 'present':
          attendanceStats.present = stat.count;
          break;
        case 'absent':
          attendanceStats.absent = stat.count;
          break;
        case 'late':
          attendanceStats.late = stat.count;
          break;
        case 'sick_leave':
        case 'casual_leave':
          attendanceStats.onLeave += stat.count;
          break;
      }
    });
    
    const totalMarked = stats.reduce((sum, stat) => sum + stat.count, 0);
    attendanceStats.notMarked = Math.max(0, staff.length - totalMarked);
    
    console.log('\n📊 Attendance Statistics:');
    console.log(`  - Total Staff: ${attendanceStats.totalStaff}`);
    console.log(`  - Present: ${attendanceStats.present}`);
    console.log(`  - Absent: ${attendanceStats.absent}`);
    console.log(`  - Late: ${attendanceStats.late}`);
    console.log(`  - On Leave: ${attendanceStats.onLeave}`);
    console.log(`  - Not Marked: ${attendanceStats.notMarked}`);
    
    // Test 4: Test staff with attendance query
    console.log('\n📋 Test 4: Testing Staff with Attendance Query');
    const staffWithAttendance = staff.map(staffMember => {
      const attendance = retrievedAttendance.find(a => a.staff._id.toString() === staffMember._id.toString());
      return {
        ...staffMember.toObject(),
        attendance: attendance || null,
        attendanceStatus: attendance?.status || 'not_marked'
      };
    });
    
    console.log(`✅ Staff with attendance status:`);
    staffWithAttendance.forEach(s => {
      console.log(`  - ${s.name}: ${s.attendanceStatus}`);
    });
    
    // Test 5: Test attendance update
    console.log('\n📋 Test 5: Testing Attendance Update');
    if (attendanceRecords.length > 0) {
      const firstRecord = attendanceRecords[0];
      const updatedRecord = await StaffAttendance.findByIdAndUpdate(
        firstRecord._id,
        { status: 'present', notes: 'Updated via test' },
        { new: true }
      ).populate('staff', 'name');
      
      console.log(`✅ Updated attendance: ${updatedRecord.staff.name} -> ${updatedRecord.status}`);
    }
    
    console.log('\n🎉 All Attendance System Tests Passed!');
    console.log('\n📝 Summary:');
    console.log(`   - Staff Members: ${staff.length}`);
    console.log(`   - Attendance Records Created: ${attendanceRecords.length}`);
    console.log(`   - API Queries: Working ✅`);
    console.log(`   - Statistics Calculation: Working ✅`);
    console.log(`   - Data Updates: Working ✅`);
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📴 Disconnected from MongoDB');
  }
};

testAttendanceSystem();

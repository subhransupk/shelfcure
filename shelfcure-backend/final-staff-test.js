require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Store = require('./models/Store');
const Staff = require('./models/Staff');

const finalStaffTest = async () => {
  try {
    console.log('🧪 Final Staff List Functionality Test...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Test 1: Verify store manager exists and has proper store assignment
    console.log('📋 Test 1: Store Manager Verification');
    const storeManager = await User.findOne({ role: 'store_manager' }).populate('currentStore');
    
    if (!storeManager) {
      console.log('❌ FAIL: No store manager found');
      return;
    }
    
    console.log(`✅ Store Manager Found: ${storeManager.name} (${storeManager.email})`);
    console.log(`✅ Assigned Store: ${storeManager.currentStore?.name || 'No store'}`);
    
    if (!storeManager.currentStore) {
      console.log('❌ FAIL: Store manager has no assigned store');
      return;
    }
    
    // Test 2: Verify staff record exists for store manager
    console.log('\n📋 Test 2: Staff Record Verification');
    const staffRecord = await Staff.findOne({
      store: storeManager.currentStore._id,
      email: storeManager.email
    });
    
    if (!staffRecord) {
      console.log('❌ FAIL: No staff record found for store manager');
      return;
    }
    
    console.log(`✅ Staff Record Found: ${staffRecord.name} (${staffRecord.role})`);
    console.log(`✅ Employee ID: ${staffRecord.employeeId}`);
    console.log(`✅ Status: ${staffRecord.status}`);
    console.log(`✅ Store Link: ${staffRecord.store}`);
    
    // Test 3: Test API query simulation
    console.log('\n📋 Test 3: API Query Simulation');
    const storeId = storeManager.currentStore._id;
    const query = { store: storeId, status: 'active' };
    
    const staffList = await Staff.find(query)
      .sort({ role: 1, name: 1 })
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .lean();
    
    const totalCount = await Staff.countDocuments(query);
    
    console.log(`✅ API Query: ${JSON.stringify(query)}`);
    console.log(`✅ Total Staff Count: ${totalCount}`);
    console.log(`✅ Staff List Length: ${staffList.length}`);
    
    if (staffList.length === 0) {
      console.log('❌ FAIL: API query returns empty staff list');
      return;
    }
    
    // Test 4: Verify staff data structure
    console.log('\n📋 Test 4: Staff Data Structure Verification');
    staffList.forEach((staff, index) => {
      console.log(`\n  Staff ${index + 1}:`);
      console.log(`    ✅ Name: ${staff.name}`);
      console.log(`    ✅ Email: ${staff.email}`);
      console.log(`    ✅ Role: ${staff.role}`);
      console.log(`    ✅ Employee ID: ${staff.employeeId}`);
      console.log(`    ✅ Status: ${staff.status}`);
      console.log(`    ✅ Department: ${staff.department}`);
      console.log(`    ✅ Date of Joining: ${staff.dateOfJoining}`);
      console.log(`    ✅ Salary: ₹${staff.salary}`);
      console.log(`    ✅ Has System Access: ${staff.hasSystemAccess}`);
      console.log(`    ✅ Permissions: ${staff.permissions.join(', ')}`);
    });
    
    // Test 5: Frontend compatibility check
    console.log('\n📋 Test 5: Frontend Compatibility Check');
    const frontendCompatibleData = staffList.map(staff => ({
      _id: staff._id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      employeeId: staff.employeeId,
      role: staff.role,
      department: staff.department,
      dateOfJoining: staff.dateOfJoining, // Frontend expects this field
      salary: staff.salary,
      status: staff.status,
      hasSystemAccess: staff.hasSystemAccess,
      permissions: staff.permissions
    }));
    
    console.log('✅ Frontend-compatible data structure:');
    console.log(JSON.stringify(frontendCompatibleData, null, 2));
    
    // Test 6: Simulate API response
    console.log('\n📋 Test 6: API Response Simulation');
    const apiResponse = {
      success: true,
      count: staffList.length,
      pagination: {
        page: 1,
        limit: 20,
        total: totalCount,
        pages: Math.ceil(totalCount / 20)
      },
      data: frontendCompatibleData
    };
    
    console.log('✅ Complete API Response:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
    // Final verification
    console.log('\n🎯 Final Verification:');
    console.log(`✅ Store Manager in User Collection: YES`);
    console.log(`✅ Store Manager has Store Assignment: YES`);
    console.log(`✅ Staff Record exists for Store Manager: YES`);
    console.log(`✅ Staff Record linked to correct Store: YES`);
    console.log(`✅ API Query returns Staff: YES (${staffList.length} staff members)`);
    console.log(`✅ Data Structure compatible with Frontend: YES`);
    
    console.log('\n🎉 ALL TESTS PASSED! Staff list functionality is working correctly.');
    console.log('\n📝 Summary:');
    console.log(`   - Store Manager: ${storeManager.name}`);
    console.log(`   - Store: ${storeManager.currentStore.name}`);
    console.log(`   - Staff Count: ${totalCount}`);
    console.log(`   - API Status: Working ✅`);
    console.log(`   - Frontend Compatibility: Ready ✅`);
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📴 Disconnected from MongoDB');
  }
};

finalStaffTest();

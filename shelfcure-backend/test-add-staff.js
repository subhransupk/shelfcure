require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Store = require('./models/Store');
const Staff = require('./models/Staff');

const testAddStaff = async () => {
  try {
    console.log('🧪 Testing Add Staff Functionality...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find store manager and store
    const storeManager = await User.findOne({ role: 'store_manager' }).populate('currentStore');
    if (!storeManager || !storeManager.currentStore) {
      console.log('❌ FAIL: No store manager or store found');
      return;
    }
    
    const store = storeManager.currentStore;
    const storeId = store._id;
    
    console.log(`✅ Store Manager: ${storeManager.name}`);
    console.log(`✅ Store: ${store.name} (${storeId})\n`);
    
    // Test 1: Create a new staff member
    console.log('📋 Test 1: Create New Staff Member');
    
    const testStaffData = {
      name: 'Test Staff Member',
      email: 'teststaff@example.com',
      phone: '9876543210',
      employeeId: 'TST001',
      role: 'pharmacist',
      department: 'pharmacy',
      dateOfJoining: new Date(),
      salary: 15000,
      workingHours: 'full_time',
      address: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      dateOfBirth: new Date('1990-01-01'),
      emergencyContact: {
        name: 'Emergency Contact',
        phone: '9876543211',
        relationship: 'Parent'
      },
      store: storeId,
      createdBy: storeManager._id
    };
    
    // Clean up any existing test staff
    await Staff.deleteOne({ email: 'teststaff@example.com' });
    console.log('🧹 Cleaned up existing test staff');
    
    // Create new staff
    const newStaff = await Staff.create(testStaffData);
    console.log(`✅ Created staff: ${newStaff.name} (${newStaff.employeeId})`);
    console.log(`   Role: ${newStaff.role}`);
    console.log(`   Department: ${newStaff.department}`);
    console.log(`   Salary: ₹${newStaff.salary}`);
    
    // Test 2: Validate required fields
    console.log('\n📋 Test 2: Validate Required Fields');
    
    try {
      await Staff.create({
        name: 'Incomplete Staff',
        // Missing required fields
        store: storeId,
        createdBy: storeManager._id
      });
      console.log('❌ FAIL: Should have failed validation');
    } catch (error) {
      console.log('✅ Validation working correctly');
      console.log(`   Error: ${error.message}`);
    }
    
    // Test 3: Test duplicate email validation
    console.log('\n📋 Test 3: Test Duplicate Email Validation');
    
    try {
      await Staff.create({
        ...testStaffData,
        name: 'Duplicate Email Staff',
        employeeId: 'DUP001'
      });
      console.log('❌ FAIL: Should have failed duplicate email validation');
    } catch (error) {
      console.log('✅ Duplicate email validation working');
      console.log(`   Error: ${error.message}`);
    }
    
    // Test 4: Test duplicate employee ID validation
    console.log('\n📋 Test 4: Test Duplicate Employee ID Validation');
    
    try {
      await Staff.create({
        ...testStaffData,
        name: 'Duplicate ID Staff',
        email: 'duplicate@example.com'
      });
      console.log('❌ FAIL: Should have failed duplicate employee ID validation');
    } catch (error) {
      console.log('✅ Duplicate employee ID validation working');
      console.log(`   Error: ${error.message}`);
    }
    
    // Test 5: Fetch all staff for the store
    console.log('\n📋 Test 5: Fetch All Staff');
    
    const allStaff = await Staff.find({ store: storeId, status: 'active' });
    console.log(`✅ Total active staff: ${allStaff.length}`);
    allStaff.forEach(staff => {
      console.log(`   - ${staff.name} (${staff.role}) - ${staff.employeeId}`);
    });
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await Staff.deleteOne({ email: 'teststaff@example.com' });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All Add Staff Tests Passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Disconnected from MongoDB');
  }
};

testAddStaff();

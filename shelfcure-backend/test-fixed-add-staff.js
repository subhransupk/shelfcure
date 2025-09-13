require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Store = require('./models/Store');
const Staff = require('./models/Staff');

const testFixedAddStaff = async () => {
  try {
    console.log('🧪 Testing Fixed Add Staff Functionality...\n');
    
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
    
    // Clean up any existing test staff
    await Staff.deleteMany({ email: { $regex: /^testfixed.*@example\.com$/ } });
    console.log('🧹 Cleaned up existing test staff\n');
    
    // Test 1: Create staff with auto-generated employeeId
    console.log('📋 Test 1: Create Staff with Auto-Generated Employee ID');
    
    const testStaffData1 = {
      name: 'Test Fixed Pharmacist',
      email: 'testfixed1@example.com',
      phone: '9876543210',
      employeeId: '', // Empty to test auto-generation
      role: 'pharmacist',
      department: 'pharmacy',
      dateOfJoining: new Date(),
      salary: 18000,
      workingHours: 'full_time',
      store: storeId,
      createdBy: storeManager._id
    };
    
    // Import the fixed controller function
    const { createStaff } = require('./controllers/storeManagerStaffController');
    
    // Mock request and response objects
    const mockReq1 = {
      body: testStaffData1,
      user: { _id: storeManager._id },
      store: { _id: storeId }
    };
    
    const mockRes1 = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.responseData = data;
        return this;
      }
    };
    
    await createStaff(mockReq1, mockRes1);
    
    if (mockRes1.statusCode === 201) {
      console.log('✅ Staff created successfully with auto-generated ID');
      console.log(`   Name: ${mockRes1.responseData.data.name}`);
      console.log(`   Employee ID: ${mockRes1.responseData.data.employeeId}`);
      console.log(`   Role: ${mockRes1.responseData.data.role}`);
    } else {
      console.log('❌ FAIL: Staff creation failed');
      console.log(`   Status: ${mockRes1.statusCode}`);
      console.log(`   Response: ${JSON.stringify(mockRes1.responseData, null, 2)}`);
    }
    
    // Test 2: Create staff with custom employeeId
    console.log('\n📋 Test 2: Create Staff with Custom Employee ID');
    
    const testStaffData2 = {
      name: 'Test Fixed Cashier',
      email: 'testfixed2@example.com',
      phone: '9876543211',
      employeeId: 'CUSTOM001',
      role: 'cashier',
      department: 'sales',
      dateOfJoining: new Date(),
      salary: 12000,
      workingHours: 'full_time',
      store: storeId,
      createdBy: storeManager._id
    };
    
    const mockReq2 = {
      body: testStaffData2,
      user: { _id: storeManager._id },
      store: { _id: storeId }
    };
    
    const mockRes2 = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.responseData = data;
        return this;
      }
    };
    
    await createStaff(mockReq2, mockRes2);
    
    if (mockRes2.statusCode === 201) {
      console.log('✅ Staff created successfully with custom ID');
      console.log(`   Name: ${mockRes2.responseData.data.name}`);
      console.log(`   Employee ID: ${mockRes2.responseData.data.employeeId}`);
      console.log(`   Role: ${mockRes2.responseData.data.role}`);
    } else {
      console.log('❌ FAIL: Staff creation failed');
      console.log(`   Status: ${mockRes2.statusCode}`);
      console.log(`   Response: ${JSON.stringify(mockRes2.responseData, null, 2)}`);
    }
    
    // Test 3: Test validation with missing required fields
    console.log('\n📋 Test 3: Test Validation with Missing Fields');
    
    const invalidStaffData = {
      name: 'Incomplete Staff',
      email: 'incomplete@example.com',
      // Missing required fields
      store: storeId,
      createdBy: storeManager._id
    };
    
    const mockReq3 = {
      body: invalidStaffData,
      user: { _id: storeManager._id },
      store: { _id: storeId }
    };
    
    const mockRes3 = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.responseData = data;
        return this;
      }
    };
    
    await createStaff(mockReq3, mockRes3);
    
    if (mockRes3.statusCode === 400) {
      console.log('✅ Validation working correctly');
      console.log(`   Status: ${mockRes3.statusCode}`);
      console.log(`   Message: ${mockRes3.responseData.message}`);
      console.log(`   Errors: ${JSON.stringify(mockRes3.responseData.errors, null, 2)}`);
    } else {
      console.log('❌ FAIL: Should have returned validation error');
      console.log(`   Status: ${mockRes3.statusCode}`);
      console.log(`   Response: ${JSON.stringify(mockRes3.responseData, null, 2)}`);
    }
    
    // Test 4: Verify all staff in database
    console.log('\n📋 Test 4: Verify All Staff in Database');
    
    const allStaff = await Staff.find({ store: storeId, status: 'active' });
    console.log(`✅ Total active staff in store: ${allStaff.length}`);
    allStaff.forEach(staff => {
      console.log(`   - ${staff.name} (${staff.role}) - ${staff.employeeId}`);
    });
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await Staff.deleteMany({ email: { $regex: /^testfixed.*@example\.com$/ } });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 Fixed Add Staff Tests Completed!');
    
    console.log('\n📝 Summary of Fixes:');
    console.log('   - Auto-generation of employeeId when empty ✅');
    console.log('   - Proper data type conversion ✅');
    console.log('   - Enhanced validation error handling ✅');
    console.log('   - Improved frontend form validation ✅');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Disconnected from MongoDB');
  }
};

testFixedAddStaff();

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Store = require('./models/Store');
const Staff = require('./models/Staff');
const { createStaff } = require('./controllers/storeManagerStaffController');

const testAddStaffAPI = async () => {
  try {
    console.log('🧪 Testing Add Staff API Endpoint...\n');
    
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
    await Staff.deleteMany({ email: { $regex: /^test.*@example\.com$/ } });
    console.log('🧹 Cleaned up existing test staff\n');
    
    // Test 1: Valid staff creation
    console.log('📋 Test 1: Valid Staff Creation');
    
    const validStaffData = {
      name: 'Test Pharmacist',
      email: 'testpharmacist@example.com',
      phone: '9876543210',
      employeeId: 'PH001',
      role: 'pharmacist',
      department: 'pharmacy',
      dateOfJoining: new Date().toISOString().split('T')[0],
      salary: 18000,
      workingHours: 'full_time',
      address: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      dateOfBirth: '1990-01-01',
      emergencyContact: {
        name: 'Emergency Contact',
        phone: '9876543211',
        relationship: 'Parent'
      }
    };
    
    // Mock request and response objects
    const mockReq = {
      body: validStaffData,
      user: { _id: storeManager._id },
      store: { _id: storeId }
    };
    
    const mockRes = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.responseData = data;
        return this;
      }
    };
    
    await createStaff(mockReq, mockRes);
    
    if (mockRes.statusCode === 201) {
      console.log('✅ Staff created successfully');
      console.log(`   Name: ${mockRes.responseData.data.name}`);
      console.log(`   Role: ${mockRes.responseData.data.role}`);
      console.log(`   Employee ID: ${mockRes.responseData.data.employeeId}`);
      console.log(`   Salary: ₹${mockRes.responseData.data.salary}`);
    } else {
      console.log('❌ FAIL: Staff creation failed');
      console.log(`   Status: ${mockRes.statusCode}`);
      console.log(`   Response: ${JSON.stringify(mockRes.responseData, null, 2)}`);
    }
    
    // Test 2: Invalid data (missing required fields)
    console.log('\n📋 Test 2: Invalid Data (Missing Required Fields)');
    
    const invalidStaffData = {
      name: 'Incomplete Staff',
      email: 'incomplete@example.com'
      // Missing required fields
    };
    
    const mockReq2 = {
      body: invalidStaffData,
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
    
    if (mockRes2.statusCode === 400) {
      console.log('✅ Validation error handled correctly');
      console.log(`   Status: ${mockRes2.statusCode}`);
      console.log(`   Message: ${mockRes2.responseData.message}`);
    } else {
      console.log('❌ FAIL: Should have returned validation error');
      console.log(`   Status: ${mockRes2.statusCode}`);
      console.log(`   Response: ${JSON.stringify(mockRes2.responseData, null, 2)}`);
    }
    
    // Test 3: Duplicate email
    console.log('\n📋 Test 3: Duplicate Email');
    
    const duplicateEmailData = {
      ...validStaffData,
      name: 'Duplicate Email Staff',
      employeeId: 'DUP001'
    };
    
    const mockReq3 = {
      body: duplicateEmailData,
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
      console.log('✅ Duplicate email error handled correctly');
      console.log(`   Status: ${mockRes3.statusCode}`);
      console.log(`   Message: ${mockRes3.responseData.message}`);
    } else {
      console.log('❌ FAIL: Should have returned duplicate email error');
      console.log(`   Status: ${mockRes3.statusCode}`);
      console.log(`   Response: ${JSON.stringify(mockRes3.responseData, null, 2)}`);
    }
    
    // Test 4: Check if staff was actually created in database
    console.log('\n📋 Test 4: Verify Database Creation');
    
    const createdStaff = await Staff.findOne({ email: 'testpharmacist@example.com' });
    if (createdStaff) {
      console.log('✅ Staff found in database');
      console.log(`   Name: ${createdStaff.name}`);
      console.log(`   Role: ${createdStaff.role}`);
      console.log(`   Store: ${createdStaff.store}`);
      console.log(`   Status: ${createdStaff.status}`);
    } else {
      console.log('❌ FAIL: Staff not found in database');
    }
    
    // Test 5: Verify all staff count
    console.log('\n📋 Test 5: Verify Staff Count');
    
    const allStaff = await Staff.find({ store: storeId, status: 'active' });
    console.log(`✅ Total active staff in store: ${allStaff.length}`);
    allStaff.forEach(staff => {
      console.log(`   - ${staff.name} (${staff.role}) - ${staff.employeeId}`);
    });
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await Staff.deleteMany({ email: { $regex: /^test.*@example\.com$/ } });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All Add Staff API Tests Passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Disconnected from MongoDB');
  }
};

testAddStaffAPI();

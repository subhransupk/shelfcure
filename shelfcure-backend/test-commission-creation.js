const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
const Commission = require('./models/Commission');
const Sale = require('./models/Sale');
const Store = require('./models/Store');
const Medicine = require('./models/Medicine');
const Customer = require('./models/Customer');
const User = require('./models/User');
const DoctorStatsService = require('./services/doctorStatsService');
const CommissionPaymentService = require('./services/commissionPaymentService');

// Load environment variables
require('dotenv').config();

// Test configuration
const TEST_CONFIG = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/shelfcure',
  testStoreId: null,
  testDoctorId: null,
  testMedicineId: null,
  testCustomerId: null,
  testUserId: null
};

async function connectDB() {
  try {
    await mongoose.connect(TEST_CONFIG.mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

async function setupTestData() {
  console.log('\n📋 Setting up test data...');
  
  try {
    // Find a test store
    let testStore = await Store.findOne().limit(1);
    if (!testStore) {
      console.log('❌ No store found. Please create a store first.');
      return false;
    }
    TEST_CONFIG.testStoreId = testStore._id;
    console.log(`✅ Using store: ${testStore.name} (${testStore._id})`);

    // Find or create a test doctor with commission rate
    let testDoctor = await Doctor.findOne({ 
      store: testStore._id,
      commissionRate: { $gt: 0 }
    }).limit(1);
    
    if (!testDoctor) {
      // Create a test doctor if none exists
      testDoctor = new Doctor({
        store: testStore._id,
        name: 'Dr. Test Commission',
        specialization: 'General Medicine',
        phone: '9999999999',
        commissionRate: 10, // 10% commission
        commissionType: 'percentage',
        status: 'active'
      });
      await testDoctor.save();
      console.log(`✅ Created test doctor: ${testDoctor.name}`);
    } else {
      console.log(`✅ Using existing doctor: ${testDoctor.name} (Commission: ${testDoctor.commissionRate}%)`);
    }
    TEST_CONFIG.testDoctorId = testDoctor._id;

    // Find a test medicine
    let testMedicine = await Medicine.findOne({ store: testStore._id }).limit(1);
    if (!testMedicine) {
      console.log('❌ No medicine found. Please create medicines first.');
      return false;
    }
    TEST_CONFIG.testMedicineId = testMedicine._id;
    console.log(`✅ Using medicine: ${testMedicine.name}`);

    // Find or create a test customer
    let testCustomer = await Customer.findOne({ store: testStore._id }).limit(1);
    if (!testCustomer) {
      testCustomer = new Customer({
        store: testStore._id,
        name: 'Test Customer',
        phone: '8888888888'
      });
      await testCustomer.save();
      console.log(`✅ Created test customer: ${testCustomer.name}`);
    } else {
      console.log(`✅ Using customer: ${testCustomer.name}`);
    }
    TEST_CONFIG.testCustomerId = testCustomer._id;

    // Find a test user (any user will do for testing)
    let testUser = await User.findOne().limit(1);
    if (!testUser) {
      console.log('❌ No user found. Please create a user first.');
      return false;
    }
    TEST_CONFIG.testUserId = testUser._id;
    console.log(`✅ Using user: ${testUser.name || testUser.email} (${testUser.role})`);

    return true;
  } catch (error) {
    console.error('❌ Error setting up test data:', error.message);
    return false;
  }
}

async function testCommissionCreationOnSale() {
  console.log('\n🧪 Test 1: Commission Creation on Sale');
  
  try {
    // Clear existing commission records for this doctor to start fresh
    await Commission.deleteMany({ 
      doctor: TEST_CONFIG.testDoctorId,
      'period.month': new Date().getMonth() + 1,
      'period.year': new Date().getFullYear()
    });
    console.log('🧹 Cleared existing commission records for current month');

    // Create a test sale with doctor prescription
    const saleData = {
      store: TEST_CONFIG.testStoreId,
      customer: TEST_CONFIG.testCustomerId,
      items: [{
        medicine: TEST_CONFIG.testMedicineId,
        quantity: 2,
        unitType: 'strip',
        unitPrice: 100,
        totalPrice: 200,
        discount: 0
      }],
      subtotal: 200,
      discount: 0,
      totalAmount: 200,
      paymentMethod: 'cash',
      prescription: {
        doctor: TEST_CONFIG.testDoctorId,
        required: true
      },
      status: 'completed',
      createdBy: TEST_CONFIG.testUserId
    };

    console.log('💊 Creating test sale with doctor prescription...');
    const sale = await Sale.create(saleData);
    console.log(`✅ Sale created: ${sale._id} (Amount: ₹${sale.totalAmount})`);

    // Wait a moment for the post-save middleware to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if commission record was created
    const commissionRecord = await Commission.findOne({
      doctor: TEST_CONFIG.testDoctorId,
      store: TEST_CONFIG.testStoreId,
      'period.month': new Date().getMonth() + 1,
      'period.year': new Date().getFullYear()
    });

    if (commissionRecord) {
      console.log(`✅ Commission record created automatically!`);
      console.log(`   - Commission Amount: ₹${commissionRecord.commissionAmount}`);
      console.log(`   - Sales Value: ₹${commissionRecord.salesValue}`);
      console.log(`   - Prescription Count: ${commissionRecord.prescriptionCount}`);
      return commissionRecord;
    } else {
      console.log('❌ Commission record was NOT created automatically');
      return null;
    }

  } catch (error) {
    console.error('❌ Error testing commission creation:', error.message);
    return null;
  }
}

async function testHistoricalCommissionCreation() {
  console.log('\n🧪 Test 2: Historical Commission Creation');
  
  try {
    console.log('📊 Creating historical commission records...');
    const historicalCommissions = await DoctorStatsService.createHistoricalCommissions(
      TEST_CONFIG.testDoctorId,
      TEST_CONFIG.testStoreId
    );

    console.log(`✅ Created ${historicalCommissions.length} historical commission records`);
    
    // Display some details
    for (const commission of historicalCommissions.slice(0, 3)) {
      console.log(`   - ${commission.period.month}/${commission.period.year}: ₹${commission.commissionAmount} (${commission.prescriptionCount} prescriptions)`);
    }

    return historicalCommissions;
  } catch (error) {
    console.error('❌ Error creating historical commissions:', error.message);
    return [];
  }
}

async function testCommissionTrackingAPI() {
  console.log('\n🧪 Test 3: Commission Tracking API');
  
  try {
    console.log('🔍 Testing commission summary API...');
    const summary = await CommissionPaymentService.getDoctorCommissionSummary(
      TEST_CONFIG.testDoctorId,
      TEST_CONFIG.testStoreId
    );

    console.log('✅ Commission Summary Retrieved:');
    console.log(`   - Doctor: ${summary.doctor.name}`);
    console.log(`   - Total Earned: ₹${summary.summary.totalCommissionEarned}`);
    console.log(`   - Total Paid: ₹${summary.summary.totalCommissionPaid}`);
    console.log(`   - Pending: ₹${summary.summary.pendingCommissionAmount}`);
    console.log(`   - Payment Status: ${summary.summary.paymentStatus}`);
    console.log(`   - Commission Records: ${summary.summary.commissionRecords}`);

    if (summary.commissions && summary.commissions.length > 0) {
      console.log('✅ Commission records found in API response');
      console.log(`   - Latest record: ${summary.commissions[0].period.month}/${summary.commissions[0].period.year} - ₹${summary.commissions[0].commissionAmount}`);
      return true;
    } else {
      console.log('❌ No commission records found in API response');
      return false;
    }

  } catch (error) {
    console.error('❌ Error testing commission tracking API:', error.message);
    return false;
  }
}

async function testDoctorStatsUpdate() {
  console.log('\n🧪 Test 4: Doctor Stats Update');
  
  try {
    console.log('📈 Testing doctor stats update...');
    const stats = await DoctorStatsService.updateDoctorStats(
      TEST_CONFIG.testDoctorId,
      TEST_CONFIG.testStoreId
    );

    console.log('✅ Doctor Stats Updated:');
    console.log(`   - Total Prescriptions: ${stats.totalPrescriptions}`);
    console.log(`   - Total Commission Earned: ₹${stats.totalCommissionEarned}`);
    console.log(`   - Total Sales Value: ₹${stats.totalSalesValue}`);
    console.log(`   - Last Prescription: ${stats.lastPrescriptionDate}`);

    return stats;
  } catch (error) {
    console.error('❌ Error testing doctor stats update:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Starting Commission Creation Tests\n');
  
  await connectDB();
  
  const setupSuccess = await setupTestData();
  if (!setupSuccess) {
    console.log('❌ Test setup failed. Exiting...');
    process.exit(1);
  }

  // Test 1: Commission creation on sale
  const saleCommission = await testCommissionCreationOnSale();
  
  // Test 2: Historical commission creation
  const historicalCommissions = await testHistoricalCommissionCreation();
  
  // Test 3: Commission tracking API
  const apiTest = await testCommissionTrackingAPI();
  
  // Test 4: Doctor stats update
  const statsTest = await testDoctorStatsUpdate();

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Sale Commission Creation: ${saleCommission ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Historical Commission Creation: ${historicalCommissions.length > 0 ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Commission Tracking API: ${apiTest ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Doctor Stats Update: ${statsTest ? 'PASSED' : 'FAILED'}`);

  if (saleCommission && historicalCommissions.length > 0 && apiTest && statsTest) {
    console.log('\n🎉 All tests passed! Commission creation is working correctly.');
  } else {
    console.log('\n❌ Some tests failed. Please check the implementation.');
  }

  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };

const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
const Commission = require('./models/Commission');
const Sale = require('./models/Sale');
const Store = require('./models/Store');
const DoctorStatsService = require('./services/doctorStatsService');

// Test configuration
const TEST_CONFIG = {
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/shelfcure-test',
  testStoreId: null,
  testDoctorId: null
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
    // Find or create a test store
    let testStore = await Store.findOne({ name: /test/i }).limit(1);
    if (!testStore) {
      console.log('⚠️  No test store found. Please create a store first.');
      return false;
    }
    TEST_CONFIG.testStoreId = testStore._id;
    console.log(`✅ Using test store: ${testStore.name} (${testStore._id})`);

    // Find or create a test doctor
    let testDoctor = await Doctor.findOne({ store: testStore._id }).limit(1);
    if (!testDoctor) {
      console.log('⚠️  No test doctor found. Please create a doctor first.');
      return false;
    }
    TEST_CONFIG.testDoctorId = testDoctor._id;
    console.log(`✅ Using test doctor: ${testDoctor.name} (${testDoctor._id})`);

    return true;
  } catch (error) {
    console.error('❌ Error setting up test data:', error.message);
    return false;
  }
}

async function testCommissionHistory() {
  console.log('\n🔍 Testing commission history retrieval...');
  
  try {
    const commissions = await DoctorStatsService.getCommissionHistory(TEST_CONFIG.testStoreId, {
      dateRange: 'all',
      status: 'all'
    });

    console.log(`✅ Retrieved ${commissions.length} commission records`);
    
    if (commissions.length > 0) {
      const firstCommission = commissions[0];
      console.log('📊 Sample commission data:');
      console.log(`   - ID: ${firstCommission._id}`);
      console.log(`   - Doctor: ${firstCommission.doctor.name}`);
      console.log(`   - Status: ${firstCommission.status}`);
      console.log(`   - Amount: ₹${firstCommission.commissionAmount}`);
      console.log(`   - Prescriptions: ${firstCommission.prescriptionCount}`);
    }

    return commissions;
  } catch (error) {
    console.error('❌ Error testing commission history:', error.message);
    return [];
  }
}

async function testMarkCommissionPaid(commissionId) {
  console.log('\n💰 Testing mark commission as paid...');
  
  try {
    // Simulate the controller logic
    let commission;
    
    if (commissionId.startsWith('comm_')) {
      // This is a calculated commission, need to create a new record
      const doctorId = commissionId.replace('comm_', '');
      
      // Get current commission data
      const commissionHistory = await DoctorStatsService.getCommissionHistory(TEST_CONFIG.testStoreId, { status: 'all' });
      const currentCommission = commissionHistory.find(c => c._id === commissionId);
      
      if (!currentCommission) {
        throw new Error('Commission record not found');
      }

      // Create a new commission record
      const currentDate = new Date();
      commission = new Commission({
        store: TEST_CONFIG.testStoreId,
        doctor: doctorId,
        period: {
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear()
        },
        prescriptionCount: currentCommission.prescriptionCount,
        salesValue: currentCommission.salesValue,
        commissionRate: currentCommission.commissionRate,
        commissionAmount: currentCommission.commissionAmount,
        status: 'paid',
        paymentDate: new Date()
      });

      await commission.save();
      await commission.populate('doctor');
      
      console.log('✅ Created new commission record and marked as paid');
    } else {
      // This is an existing commission record
      commission = await Commission.findById(commissionId).populate('doctor');
      
      if (!commission) {
        throw new Error('Commission record not found');
      }

      commission.status = 'paid';
      commission.paymentDate = new Date();
      commission.lastUpdated = new Date();

      await commission.save();
      
      console.log('✅ Updated existing commission record to paid');
    }

    console.log(`💰 Commission marked as paid for doctor: ${commission.doctor.name}`);
    console.log(`   - Commission ID: ${commission._id}`);
    console.log(`   - Amount: ₹${commission.commissionAmount}`);
    console.log(`   - Payment Date: ${commission.paymentDate}`);

    return commission;
  } catch (error) {
    console.error('❌ Error testing mark commission paid:', error.message);
    return null;
  }
}

async function testStatusPersistence(commissionId) {
  console.log('\n🔄 Testing status persistence...');
  
  try {
    // Fetch commission history again to verify status change
    const commissions = await DoctorStatsService.getCommissionHistory(TEST_CONFIG.testStoreId, {
      dateRange: 'all',
      status: 'all'
    });

    const updatedCommission = commissions.find(c => 
      c._id.toString() === commissionId.toString() || 
      c._id === `comm_${commissionId.replace('comm_', '')}`
    );

    if (updatedCommission && updatedCommission.status === 'paid') {
      console.log('✅ Commission status persisted correctly');
      console.log(`   - Status: ${updatedCommission.status}`);
      if (updatedCommission.paymentDate) {
        console.log(`   - Payment Date: ${new Date(updatedCommission.paymentDate).toLocaleDateString()}`);
      }
      return true;
    } else {
      console.log('❌ Commission status not persisted correctly');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing status persistence:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting Commission Functionality Tests\n');
  
  await connectDB();
  
  const setupSuccess = await setupTestData();
  if (!setupSuccess) {
    console.log('❌ Test setup failed. Exiting...');
    process.exit(1);
  }

  // Test 1: Get commission history
  const commissions = await testCommissionHistory();
  
  if (commissions.length === 0) {
    console.log('⚠️  No commissions found. Make sure there are sales with doctor prescriptions.');
    process.exit(0);
  }

  // Test 2: Mark a commission as paid
  const testCommissionId = commissions[0]._id;
  console.log(`\n🎯 Testing with commission ID: ${testCommissionId}`);
  
  const paidCommission = await testMarkCommissionPaid(testCommissionId);
  
  if (!paidCommission) {
    console.log('❌ Mark as paid test failed');
    process.exit(1);
  }

  // Test 3: Verify status persistence
  const persistenceTest = await testStatusPersistence(paidCommission._id);
  
  if (persistenceTest) {
    console.log('\n🎉 All tests passed! Commission functionality is working correctly.');
  } else {
    console.log('\n❌ Status persistence test failed');
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

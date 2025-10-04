/**
 * COMPREHENSIVE AI STORE ASSISTANT ANALYSIS & TESTING
 * 
 * This script conducts thorough testing of the AI Store Assistant
 * to verify its capability to perform all core store management operations.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const geminiAIService = require('./services/geminiAIService');

// Import models for verification
const Medicine = require('./models/Medicine');
const Customer = require('./models/Customer');
const Sale = require('./models/Sale');
const Purchase = require('./models/Purchase');
const Supplier = require('./models/Supplier');
const Doctor = require('./models/Doctor');
const Staff = require('./models/Staff');
const Return = require('./models/Return');
const Store = require('./models/Store');
const User = require('./models/User');

// Test configuration
const TEST_CONFIG = {
  CLEANUP_AFTER_TEST: true,
  VERBOSE_LOGGING: true,
  TEST_TIMEOUT: 30000
};

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  capabilities: {},
  executionTimes: []
};

/**
 * Database Connection Test
 */
async function testDatabaseConnection() {
  console.log('🔌 TESTING DATABASE CONNECTION');
  console.log('================================\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected successfully');
    
    // Test basic operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections in database`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Create test store and user
 */
async function setupTestEnvironment() {
  console.log('🏗️  SETTING UP TEST ENVIRONMENT');
  console.log('================================\n');

  try {
    // Create test owner first
    const testOwner = new User({
      name: 'AI Test Owner',
      email: 'owner@aipharmacy.com',
      phone: '9876543200',
      role: 'store_owner',
      password: 'test123456'
    });

    await testOwner.save();
    console.log('✅ Test owner created:', testOwner._id);

    // Create test store with all required fields
    const testStore = new Store({
      name: 'AI Test Pharmacy',
      code: 'AITEST01',
      owner: testOwner._id,
      contact: {
        phone: '9876543210',
        email: 'test@aipharmacy.com'
      },
      address: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        country: 'India',
        pincode: '123456'
      },
      business: {
        licenseNumber: 'LIC123456',
        gstNumber: '22AAAAA0000A1Z5'
      },
      settings: {
        gst: { rate: 18, enabled: true },
        discount: { enabled: true, maxPercentage: 20 }
      }
    });

    await testStore.save();
    console.log('✅ Test store created:', testStore._id);

    // Create test user (store manager)
    const testUser = new User({
      name: 'AI Test Manager',
      email: 'aitest@pharmacy.com',
      phone: '9876543210',
      role: 'store_manager',
      store: testStore._id,
      password: 'test123456'
    });

    await testUser.save();
    console.log('✅ Test user created:', testUser._id);

    return { testStore, testUser, testOwner };
  } catch (error) {
    console.error('❌ Test environment setup failed:', error.message);
    throw error;
  }
}

/**
 * Core Operations Test Suite
 */
const operationTests = [
  // INVENTORY MANAGEMENT
  {
    category: 'Inventory Management',
    operation: 'Add Medicine',
    command: "Add medicine 'Paracetamol 500mg' with manufacturer 'ABC Pharma' in category 'Analgesic' and composition 'Paracetamol 500mg'",
    expectedAction: true,
    verifyMethod: async (storeId) => {
      const medicine = await Medicine.findOne({ 
        store: storeId, 
        name: /paracetamol/i 
      });
      return medicine !== null;
    }
  },
  {
    category: 'Inventory Management',
    operation: 'Update Stock',
    command: "Update stock for Paracetamol to 50 strips and 500 units",
    expectedAction: true,
    verifyMethod: async (storeId) => {
      const medicine = await Medicine.findOne({ 
        store: storeId, 
        name: /paracetamol/i 
      });
      return medicine && medicine.inventory.strips >= 50;
    }
  },
  
  // CUSTOMER MANAGEMENT
  {
    category: 'Customer Management',
    operation: 'Add Customer',
    command: "Add customer 'John Doe' with phone '9876543210' and email 'john@example.com'",
    expectedAction: true,
    verifyMethod: async (storeId) => {
      const customer = await Customer.findOne({ 
        store: storeId, 
        name: /john doe/i 
      });
      return customer !== null;
    }
  },
  {
    category: 'Customer Management',
    operation: 'Update Customer',
    command: "Update John Doe's address to '123 Main Street, City'",
    expectedAction: true,
    verifyMethod: async (storeId) => {
      const customer = await Customer.findOne({ 
        store: storeId, 
        name: /john doe/i 
      });
      return customer && customer.address.includes('Main Street');
    }
  },
  
  // SALES MANAGEMENT
  {
    category: 'Sales Management',
    operation: 'Create Sale',
    command: "Create a sale for John Doe with 2 strips of Paracetamol at ₹10 per strip",
    expectedAction: true,
    verifyMethod: async (storeId) => {
      const sale = await Sale.findOne({ store: storeId });
      return sale !== null;
    }
  },
  
  // SUPPLIER MANAGEMENT
  {
    category: 'Supplier Management',
    operation: 'Add Supplier',
    command: "Add supplier 'MediCorp Distributors' with contact person 'Mr. Smith' and phone '9876543211'",
    expectedAction: true,
    verifyMethod: async (storeId) => {
      const supplier = await Supplier.findOne({ 
        store: storeId, 
        name: /medicorp/i 
      });
      return supplier !== null;
    }
  },
  
  // PURCHASE MANAGEMENT
  {
    category: 'Purchase Management',
    operation: 'Create Purchase Order',
    command: "Create purchase order for 100 strips of Paracetamol from MediCorp at ₹8 per strip",
    expectedAction: true,
    verifyMethod: async (storeId) => {
      const purchase = await Purchase.findOne({ store: storeId });
      return purchase !== null;
    }
  },
  
  // DOCTOR MANAGEMENT
  {
    category: 'Doctor Management',
    operation: 'Add Doctor',
    command: "Add doctor 'Dr. Sarah Wilson' with specialization 'General Medicine' and phone '9876543212'",
    expectedAction: true,
    verifyMethod: async (storeId) => {
      const doctor = await Doctor.findOne({ 
        store: storeId, 
        name: /sarah wilson/i 
      });
      return doctor !== null;
    }
  },
  
  // STAFF MANAGEMENT
  {
    category: 'Staff Management',
    operation: 'Add Staff',
    command: "Add staff member 'Alice Johnson' with role 'pharmacist' and email 'alice@pharmacy.com'",
    expectedAction: true,
    verifyMethod: async (storeId) => {
      const staff = await Staff.findOne({ 
        store: storeId, 
        name: /alice johnson/i 
      });
      return staff !== null;
    }
  },
  
  // RETURN PROCESSING
  {
    category: 'Return Processing',
    operation: 'Process Return',
    command: "Process return for 1 strip of Paracetamol due to expiry",
    expectedAction: true,
    verifyMethod: async (storeId) => {
      const returnRecord = await Return.findOne({ store: storeId });
      return returnRecord !== null;
    }
  }
];

/**
 * Execute a single test
 */
async function executeTest(test, context) {
  const startTime = Date.now();
  testResults.total++;
  
  console.log(`\n🧪 Testing: ${test.category} - ${test.operation}`);
  console.log(`📝 Command: "${test.command}"`);
  
  try {
    // Execute AI command
    const response = await geminiAIService.processStoreQuery(test.command, context);
    const processingTime = Date.now() - startTime;
    testResults.executionTimes.push(processingTime);
    
    console.log(`⏱️  Processing Time: ${processingTime}ms`);
    console.log(`✅ AI Response Success: ${response.success}`);
    console.log(`🎯 Action Executed: ${response.actionExecuted || false}`);
    
    // Verify database changes if applicable
    let databaseVerified = false;
    if (test.verifyMethod) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for DB operations
        databaseVerified = await test.verifyMethod(context.store._id);
        console.log(`🗄️  Database Verification: ${databaseVerified ? 'PASSED' : 'FAILED'}`);
      } catch (error) {
        console.log(`⚠️  Database verification error: ${error.message}`);
      }
    }
    
    // Determine test result
    const testPassed = response.success && (test.expectedAction ? response.actionExecuted : true) && 
                      (test.verifyMethod ? databaseVerified : true);
    
    if (testPassed) {
      testResults.passed++;
      console.log(`✅ TEST PASSED`);
    } else {
      testResults.failed++;
      console.log(`❌ TEST FAILED`);
      testResults.errors.push({
        test: `${test.category} - ${test.operation}`,
        error: 'Test conditions not met',
        response: response
      });
    }
    
    // Track capability
    if (!testResults.capabilities[test.category]) {
      testResults.capabilities[test.category] = { passed: 0, total: 0 };
    }
    testResults.capabilities[test.category].total++;
    if (testPassed) {
      testResults.capabilities[test.category].passed++;
    }
    
    return testPassed;
    
  } catch (error) {
    testResults.failed++;
    const processingTime = Date.now() - startTime;
    console.log(`❌ TEST ERROR: ${error.message}`);
    console.log(`⏱️  Processing Time: ${processingTime}ms`);
    
    testResults.errors.push({
      test: `${test.category} - ${test.operation}`,
      error: error.message
    });
    
    return false;
  }
}

/**
 * Main test execution
 */
async function runComprehensiveTests() {
  console.log('🚀 STARTING COMPREHENSIVE AI STORE ASSISTANT TESTING');
  console.log('====================================================\n');
  
  try {
    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }
    
    // Setup test environment
    const { testStore, testUser, testOwner } = await setupTestEnvironment();
    const context = {
      store: testStore,
      user: testUser,
      conversationId: `test_${Date.now()}`
    };
    
    console.log('\n🧪 EXECUTING OPERATION TESTS');
    console.log('==============================');
    
    // Execute all tests
    for (const test of operationTests) {
      await executeTest(test, context);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Delay between tests
    }
    
    // Generate final report
    generateFinalReport();
    
    // Cleanup if enabled
    if (TEST_CONFIG.CLEANUP_AFTER_TEST) {
      await cleanupTestData(testStore._id, testUser._id, testOwner._id);
    }
    
  } catch (error) {
    console.error('💥 CRITICAL ERROR:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database disconnected');
  }
}

/**
 * Generate comprehensive test report
 */
function generateFinalReport() {
  console.log('\n📊 COMPREHENSIVE TEST RESULTS');
  console.log('===============================\n');
  
  console.log(`📈 Overall Results:`);
  console.log(`   Total Tests: ${testResults.total}`);
  console.log(`   Passed: ${testResults.passed} (${((testResults.passed/testResults.total)*100).toFixed(1)}%)`);
  console.log(`   Failed: ${testResults.failed} (${((testResults.failed/testResults.total)*100).toFixed(1)}%)`);
  
  const avgTime = testResults.executionTimes.reduce((a, b) => a + b, 0) / testResults.executionTimes.length;
  console.log(`   Average Response Time: ${avgTime.toFixed(0)}ms`);
  
  console.log(`\n🎯 Capability Analysis:`);
  for (const [category, stats] of Object.entries(testResults.capabilities)) {
    const successRate = ((stats.passed / stats.total) * 100).toFixed(1);
    console.log(`   ${category}: ${stats.passed}/${stats.total} (${successRate}%)`);
  }
  
  if (testResults.errors.length > 0) {
    console.log(`\n❌ Failed Tests:`);
    testResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.test}: ${error.error}`);
    });
  }
  
  console.log(`\n🏆 FINAL ASSESSMENT:`);
  const overallSuccess = (testResults.passed / testResults.total) * 100;
  if (overallSuccess >= 90) {
    console.log(`   ✅ EXCELLENT - AI can manage ${overallSuccess.toFixed(1)}% of store operations`);
  } else if (overallSuccess >= 75) {
    console.log(`   ⚠️  GOOD - AI can manage ${overallSuccess.toFixed(1)}% of store operations`);
  } else if (overallSuccess >= 50) {
    console.log(`   ⚠️  PARTIAL - AI can manage ${overallSuccess.toFixed(1)}% of store operations`);
  } else {
    console.log(`   ❌ LIMITED - AI can only manage ${overallSuccess.toFixed(1)}% of store operations`);
  }
}

/**
 * Cleanup test data
 */
async function cleanupTestData(storeId, userId, ownerId) {
  console.log('\n🧹 CLEANING UP TEST DATA');
  console.log('=========================');

  try {
    await Promise.all([
      Medicine.deleteMany({ store: storeId }),
      Customer.deleteMany({ store: storeId }),
      Sale.deleteMany({ store: storeId }),
      Purchase.deleteMany({ store: storeId }),
      Supplier.deleteMany({ store: storeId }),
      Doctor.deleteMany({ store: storeId }),
      Staff.deleteMany({ store: storeId }),
      Return.deleteMany({ store: storeId }),
      Store.findByIdAndDelete(storeId),
      User.findByIdAndDelete(userId),
      User.findByIdAndDelete(ownerId)
    ]);

    console.log('✅ Test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

// Run the tests
if (require.main === module) {
  runComprehensiveTests();
}

module.exports = {
  runComprehensiveTests,
  operationTests,
  testResults
};

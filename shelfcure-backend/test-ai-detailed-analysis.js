/**
 * DETAILED AI ANALYSIS - DEBUGGING VERSION
 * 
 * This script provides detailed analysis of what the AI is actually doing
 * and why database operations might be failing.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const geminiAIService = require('./services/geminiAIService');

// Import models
const Medicine = require('./models/Medicine');
const Customer = require('./models/Customer');
const Store = require('./models/Store');
const User = require('./models/User');

/**
 * Test single operation with detailed logging
 */
async function testSingleOperation() {
  console.log('🔍 DETAILED AI OPERATION ANALYSIS');
  console.log('==================================\n');
  
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected');
    
    // Create test environment
    const testOwner = new User({
      name: 'Debug Test Owner',
      email: 'debug@test.com',
      phone: '9876543200',
      role: 'store_owner',
      password: 'test123456'
    });
    await testOwner.save();
    
    const testStore = new Store({
      name: 'Debug Test Pharmacy',
      code: 'DEBUG01',
      owner: testOwner._id,
      contact: {
        phone: '9876543210',
        email: 'debug@pharmacy.com'
      },
      address: {
        street: '123 Debug Street',
        city: 'Debug City',
        state: 'Debug State',
        country: 'India',
        pincode: '123456'
      },
      business: {
        licenseNumber: 'DEBUG123456',
        gstNumber: '22AAAAA0000A1Z5'
      }
    });
    await testStore.save();
    
    const testUser = new User({
      name: 'Debug Test Manager',
      email: 'debugmanager@test.com',
      phone: '9876543210',
      role: 'store_manager',
      store: testStore._id,
      password: 'test123456'
    });
    await testUser.save();
    
    console.log('✅ Test environment created');
    console.log(`   Store ID: ${testStore._id}`);
    console.log(`   User ID: ${testUser._id}`);
    
    // Test context
    const context = {
      store: testStore,
      user: testUser,
      conversationId: `debug_${Date.now()}`
    };
    
    // Test 1: Add Medicine
    console.log('\n🧪 TEST 1: ADD MEDICINE');
    console.log('========================');
    
    const command1 = "Add medicine 'Paracetamol 500mg' with manufacturer 'ABC Pharma' in category 'Analgesic'";
    console.log(`Command: "${command1}"`);
    
    const response1 = await geminiAIService.processStoreQuery(command1, context);
    
    console.log('\n📋 AI RESPONSE DETAILS:');
    console.log(`Success: ${response1.success}`);
    console.log(`Action Executed: ${response1.actionExecuted}`);
    console.log(`Intent: ${response1.intent}`);
    console.log(`Confidence: ${response1.confidence}`);
    console.log(`Response: ${response1.response?.substring(0, 200)}...`);
    
    if (response1.actionResult) {
      console.log(`Action Result: ${JSON.stringify(response1.actionResult, null, 2)}`);
    }
    
    // Check database immediately
    console.log('\n🗄️  DATABASE CHECK (Immediate):');
    const medicineCount = await Medicine.countDocuments({ store: testStore._id });
    console.log(`Medicine count in database: ${medicineCount}`);
    
    if (medicineCount > 0) {
      const medicines = await Medicine.find({ store: testStore._id });
      console.log('Found medicines:');
      medicines.forEach(med => {
        console.log(`  - ${med.name} (${med.manufacturer})`);
      });
    }
    
    // Wait and check again
    console.log('\n⏳ Waiting 3 seconds and checking again...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const medicineCount2 = await Medicine.countDocuments({ store: testStore._id });
    console.log(`Medicine count after wait: ${medicineCount2}`);
    
    // Test 2: Add Customer
    console.log('\n🧪 TEST 2: ADD CUSTOMER');
    console.log('========================');
    
    const command2 = "Add customer 'John Doe' with phone '9876543210' and email 'john@example.com'";
    console.log(`Command: "${command2}"`);
    
    const response2 = await geminiAIService.processStoreQuery(command2, context);
    
    console.log('\n📋 AI RESPONSE DETAILS:');
    console.log(`Success: ${response2.success}`);
    console.log(`Action Executed: ${response2.actionExecuted}`);
    console.log(`Response: ${response2.response?.substring(0, 200)}...`);
    
    // Check database
    console.log('\n🗄️  DATABASE CHECK:');
    const customerCount = await Customer.countDocuments({ store: testStore._id });
    console.log(`Customer count in database: ${customerCount}`);
    
    if (customerCount > 0) {
      const customers = await Customer.find({ store: testStore._id });
      console.log('Found customers:');
      customers.forEach(cust => {
        console.log(`  - ${cust.name} (${cust.phone})`);
      });
    }
    
    // Test 3: Check AI Data Service directly
    console.log('\n🧪 TEST 3: DIRECT AI DATA SERVICE TEST');
    console.log('======================================');
    
    try {
      const AIDataService = require('./services/aiDataService');
      const aiDataService = new AIDataService();
      
      console.log('Testing direct medicine creation...');
      const directMedicine = await aiDataService.createMedicine(testStore._id, {
        name: 'Direct Test Medicine',
        manufacturer: 'Direct Pharma',
        category: 'Test',
        composition: 'Test Composition'
      });
      
      console.log('✅ Direct medicine creation successful:', directMedicine._id);
      
      // Verify in database
      const directCheck = await Medicine.findById(directMedicine._id);
      console.log('✅ Direct medicine verified in database:', directCheck.name);
      
    } catch (error) {
      console.error('❌ Direct AI Data Service test failed:', error.message);
    }
    
    // Cleanup
    console.log('\n🧹 CLEANING UP...');
    await Medicine.deleteMany({ store: testStore._id });
    await Customer.deleteMany({ store: testStore._id });
    await Store.findByIdAndDelete(testStore._id);
    await User.findByIdAndDelete(testUser._id);
    await User.findByIdAndDelete(testOwner._id);
    console.log('✅ Cleanup completed');
    
  } catch (error) {
    console.error('💥 ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database disconnected');
  }
}

/**
 * Test AI service methods directly
 */
async function testAIServiceMethods() {
  console.log('\n🔧 TESTING AI SERVICE METHODS');
  console.log('==============================');
  
  try {
    // Test if methods exist
    const methods = [
      'handleInventoryActions',
      'handleCustomerActions',
      'handleSalesActions',
      'handlePurchaseActions',
      'handleSupplierActions',
      'handleDoctorActions',
      'handleStaffActions',
      'handleReturnActions',
      'executeActions',
      'processStoreQuery'
    ];
    
    console.log('Checking AI service methods:');
    methods.forEach(method => {
      const exists = typeof geminiAIService[method] === 'function';
      console.log(`  ${method}: ${exists ? '✅' : '❌'}`);
    });
    
    // Test data extraction methods
    const extractionMethods = [
      'extractMedicineData',
      'extractCustomerData',
      'extractSaleData',
      'extractPurchaseData',
      'extractSupplierData',
      'extractDoctorData',
      'extractStaffData',
      'extractReturnData'
    ];
    
    console.log('\nChecking data extraction methods:');
    extractionMethods.forEach(method => {
      const exists = typeof geminiAIService[method] === 'function';
      console.log(`  ${method}: ${exists ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.error('Error testing AI service methods:', error.message);
  }
}

/**
 * Test Gemini AI connectivity
 */
async function testGeminiConnectivity() {
  console.log('\n🤖 TESTING GEMINI AI CONNECTIVITY');
  console.log('==================================');
  
  try {
    const testMessage = "Hello, can you help me with my pharmacy?";
    const mockContext = {
      store: { _id: 'test', name: 'Test Store' },
      user: { _id: 'test', name: 'Test User', role: 'store_manager' },
      conversationId: 'test'
    };
    
    console.log('Sending test message to Gemini...');
    const response = await geminiAIService.processStoreQuery(testMessage, mockContext);
    
    console.log('✅ Gemini AI responded successfully');
    console.log(`Response length: ${response.response?.length || 0} characters`);
    console.log(`Success: ${response.success}`);
    console.log(`Intent: ${response.intent}`);
    
  } catch (error) {
    console.error('❌ Gemini AI connectivity test failed:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  await testGeminiConnectivity();
  await testAIServiceMethods();
  await testSingleOperation();
}

if (require.main === module) {
  runAllTests();
}

module.exports = { testSingleOperation, testAIServiceMethods, testGeminiConnectivity };

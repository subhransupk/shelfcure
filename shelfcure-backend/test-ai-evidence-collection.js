/**
 * AI EVIDENCE COLLECTION TEST
 * 
 * This script provides concrete evidence of AI claims vs actual database operations
 * to validate our analysis findings.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const geminiAIService = require('./services/geminiAIService');

// Import models
const Medicine = require('./models/Medicine');
const Customer = require('./models/Customer');
const Sale = require('./models/Sale');
const Supplier = require('./models/Supplier');
const Store = require('./models/Store');
const User = require('./models/User');

/**
 * Evidence collection test
 */
async function collectDatabaseEvidence() {
  console.log('📋 AI CLAIMS vs DATABASE EVIDENCE COLLECTION');
  console.log('==============================================\n');
  
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected');
    
    // Create test environment
    const testOwner = new User({
      name: 'Evidence Test Owner',
      email: 'evidence@test.com',
      phone: '9876543200',
      role: 'store_owner',
      password: 'test123456'
    });
    await testOwner.save();
    
    const testStore = new Store({
      name: 'Evidence Test Pharmacy',
      code: 'EVIDENCE01',
      owner: testOwner._id,
      contact: {
        phone: '9876543210',
        email: 'evidence@pharmacy.com'
      },
      address: {
        street: '123 Evidence Street',
        city: 'Evidence City',
        state: 'Evidence State',
        country: 'India',
        pincode: '123456'
      },
      business: {
        licenseNumber: 'EVIDENCE123456',
        gstNumber: '22AAAAA0000A1Z5'
      }
    });
    await testStore.save();
    
    const testUser = new User({
      name: 'Evidence Test Manager',
      email: 'evidencemanager@test.com',
      phone: '9876543210',
      role: 'store_manager',
      store: testStore._id,
      password: 'test123456'
    });
    await testUser.save();
    
    console.log('✅ Test environment created');
    console.log(`   Store ID: ${testStore._id}`);
    console.log(`   User ID: ${testUser._id}`);
    
    const context = {
      store: testStore,
      user: testUser,
      conversationId: `evidence_${Date.now()}`
    };
    
    // Evidence Collection Tests
    const evidenceTests = [
      {
        name: "Medicine Creation",
        command: "Add medicine 'Evidence Paracetamol 500mg' with manufacturer 'Evidence Pharma' in category 'Tablet'",
        model: Medicine,
        searchCriteria: { store: testStore._id, name: /evidence paracetamol/i }
      },
      {
        name: "Customer Creation", 
        command: "Add customer 'Evidence John Doe' with phone '9876543210' and email 'evidence@customer.com'",
        model: Customer,
        searchCriteria: { store: testStore._id, name: /evidence john/i }
      },
      {
        name: "Supplier Creation",
        command: "Add supplier 'Evidence MediCorp' with contact person 'Evidence Smith' and phone '9876543211'",
        model: Supplier,
        searchCriteria: { store: testStore._id, name: /evidence medicorp/i }
      }
    ];
    
    for (const test of evidenceTests) {
      console.log(`\n🧪 EVIDENCE TEST: ${test.name}`);
      console.log('='.repeat(50));
      console.log(`Command: "${test.command}"`);
      
      // Get initial database count
      const initialCount = await test.model.countDocuments(test.searchCriteria);
      console.log(`📊 Initial database count: ${initialCount}`);
      
      // Execute AI command
      console.log('🤖 Executing AI command...');
      const startTime = Date.now();
      const response = await geminiAIService.processStoreQuery(test.command, context);
      const processingTime = Date.now() - startTime;
      
      // AI Claims Analysis
      console.log('\n📋 AI CLAIMS:');
      console.log(`   Success: ${response.success}`);
      console.log(`   Action Executed: ${response.actionExecuted}`);
      console.log(`   Intent: ${response.intent}`);
      console.log(`   Confidence: ${response.confidence}`);
      console.log(`   Processing Time: ${processingTime}ms`);
      
      if (response.response) {
        const preview = response.response.length > 100 
          ? response.response.substring(0, 100) + '...'
          : response.response;
        console.log(`   Response: "${preview}"`);
      }
      
      // Wait for potential async operations
      console.log('\n⏳ Waiting 2 seconds for database operations...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check actual database state
      const finalCount = await test.model.countDocuments(test.searchCriteria);
      const actualRecords = await test.model.find(test.searchCriteria);
      
      console.log('\n🗄️  DATABASE REALITY:');
      console.log(`   Final database count: ${finalCount}`);
      console.log(`   Records created: ${finalCount - initialCount}`);
      
      if (actualRecords.length > 0) {
        console.log('   Found records:');
        actualRecords.forEach((record, index) => {
          console.log(`     ${index + 1}. ${record.name} (ID: ${record._id})`);
        });
      } else {
        console.log('   ❌ No records found in database');
      }
      
      // Evidence Analysis
      console.log('\n⚖️  EVIDENCE ANALYSIS:');
      const aiClaimsSuccess = response.success && response.actionExecuted;
      const databaseShowsSuccess = finalCount > initialCount;
      
      console.log(`   AI Claims Success: ${aiClaimsSuccess}`);
      console.log(`   Database Shows Success: ${databaseShowsSuccess}`);
      console.log(`   Claims Match Reality: ${aiClaimsSuccess === databaseShowsSuccess ? '✅ YES' : '❌ NO'}`);
      
      if (aiClaimsSuccess && !databaseShowsSuccess) {
        console.log('   🚨 CRITICAL ISSUE: AI claims success but no database changes!');
      } else if (!aiClaimsSuccess && databaseShowsSuccess) {
        console.log('   🤔 UNEXPECTED: AI claims failure but database changes exist!');
      } else if (aiClaimsSuccess && databaseShowsSuccess) {
        console.log('   ✅ SUCCESS: AI claims and database changes match!');
      } else {
        console.log('   ⚠️  CONSISTENT FAILURE: AI and database both show no success');
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Final Evidence Summary
    console.log('\n📊 FINAL EVIDENCE SUMMARY');
    console.log('==========================');
    
    const totalMedicines = await Medicine.countDocuments({ store: testStore._id });
    const totalCustomers = await Customer.countDocuments({ store: testStore._id });
    const totalSuppliers = await Supplier.countDocuments({ store: testStore._id });
    const totalSales = await Sale.countDocuments({ store: testStore._id });
    
    console.log(`Total records created in database:`);
    console.log(`   Medicines: ${totalMedicines}`);
    console.log(`   Customers: ${totalCustomers}`);
    console.log(`   Suppliers: ${totalSuppliers}`);
    console.log(`   Sales: ${totalSales}`);
    console.log(`   TOTAL: ${totalMedicines + totalCustomers + totalSuppliers + totalSales}`);
    
    if (totalMedicines + totalCustomers + totalSuppliers + totalSales === 0) {
      console.log('\n🚨 CRITICAL FINDING: AI claimed to execute actions but ZERO database records created!');
    } else {
      console.log('\n✅ Some database operations were successful');
    }
    
    // Cleanup
    console.log('\n🧹 CLEANING UP...');
    await Medicine.deleteMany({ store: testStore._id });
    await Customer.deleteMany({ store: testStore._id });
    await Supplier.deleteMany({ store: testStore._id });
    await Sale.deleteMany({ store: testStore._id });
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
 * Test specific Store ID validation issue
 */
async function testStoreIdValidation() {
  console.log('\n🔍 STORE ID VALIDATION EVIDENCE');
  console.log('================================');
  
  const AIDataService = require('./services/aiDataService');
  const aiDataService = new AIDataService();
  
  const testCases = [
    { id: 'test123', description: 'Simple string' },
    { id: '507f1f77bcf86cd799439011', description: 'Valid ObjectId string' },
    { id: new mongoose.Types.ObjectId(), description: 'ObjectId instance' },
    { id: null, description: 'Null value' },
    { id: undefined, description: 'Undefined value' },
    { id: '', description: 'Empty string' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\nTesting Store ID: ${testCase.id} (${testCase.description})`);
    
    try {
      const validatedId = aiDataService.validateStoreId(testCase.id);
      console.log(`✅ Validation passed: ${validatedId}`);
    } catch (error) {
      console.log(`❌ Validation failed: ${error.message}`);
    }
  }
}

/**
 * Run all evidence collection tests
 */
async function runAllEvidenceTests() {
  await collectDatabaseEvidence();
  await testStoreIdValidation();
}

if (require.main === module) {
  runAllEvidenceTests();
}

module.exports = { collectDatabaseEvidence, testStoreIdValidation };

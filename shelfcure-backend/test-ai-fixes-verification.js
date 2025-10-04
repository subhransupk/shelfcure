/**
 * AI FIXES VERIFICATION TEST
 * 
 * This script tests all the fixes we implemented to verify they work correctly.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const geminiAIService = require('./services/geminiAIService');

// Import models
const Medicine = require('./models/Medicine');
const Customer = require('./models/Customer');
const Supplier = require('./models/Supplier');
const Store = require('./models/Store');
const User = require('./models/User');

/**
 * Test all fixes
 */
async function testAllFixes() {
  console.log('🔧 TESTING ALL AI FIXES');
  console.log('========================\n');
  
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected');
    
    // Create test environment
    const testOwner = new User({
      name: 'Fix Test Owner',
      email: 'fixes@test.com',
      phone: '9876543200',
      role: 'store_owner',
      password: 'test123456'
    });
    await testOwner.save();
    
    const testStore = new Store({
      name: 'Fix Test Pharmacy',
      code: 'FIXES01',
      owner: testOwner._id,
      contact: {
        phone: '9876543210',
        email: 'fixes@pharmacy.com'
      },
      address: {
        street: '123 Fix Street',
        city: 'Fix City',
        state: 'Fix State',
        country: 'India',
        pincode: '123456'
      },
      business: {
        licenseNumber: 'FIXES123456',
        gstNumber: '22AAAAA0000A1Z5'
      }
    });
    await testStore.save();
    
    const testUser = new User({
      name: 'Fix Test Manager',
      email: 'fixmanager@test.com',
      phone: '9876543210',
      role: 'store_manager',
      store: testStore._id,
      password: 'test123456'
    });
    await testUser.save();
    
    const context = {
      store: testStore,
      user: testUser,
      conversationId: `fixes_${Date.now()}`
    };
    
    console.log('✅ Test environment created');
    console.log(`   Store ID: ${testStore._id}`);
    console.log(`   User ID: ${testUser._id}`);
    
    // Test cases for our fixes
    const fixTests = [
      {
        name: "Customer Data Extraction Fix",
        command: "Add customer 'Fix John Doe' with phone '9876543210' and email 'fix@customer.com'",
        expectedModel: Customer,
        expectedAction: true,
        description: "Tests improved customer data extraction and handler logic"
      },
      {
        name: "Supplier Data Extraction Fix", 
        command: "Add supplier 'Fix MediCorp' with contact person 'Fix Smith' and phone '9876543211'",
        expectedModel: Supplier,
        expectedAction: true,
        description: "Tests improved supplier data extraction"
      },
      {
        name: "Medicine Creation (No Double Execution)",
        command: "Add medicine 'Fix Paracetamol 500mg' with manufacturer 'Fix Pharma' in category 'Tablet'",
        expectedModel: Medicine,
        expectedAction: true,
        description: "Tests that medicine creation doesn't create duplicates"
      },
      {
        name: "Action Status Accuracy",
        command: "Add customer 'Invalid Customer'", // Intentionally incomplete
        expectedModel: Customer,
        expectedAction: false,
        description: "Tests that failed actions report correct status"
      }
    ];
    
    let totalTests = 0;
    let passedTests = 0;
    
    for (const test of fixTests) {
      totalTests++;
      console.log(`\n🧪 TEST: ${test.name}`);
      console.log('='.repeat(50));
      console.log(`Command: "${test.command}"`);
      console.log(`Description: ${test.description}`);
      
      // Get initial count
      const initialCount = await test.expectedModel.countDocuments({ store: testStore._id });
      console.log(`📊 Initial ${test.expectedModel.modelName} count: ${initialCount}`);
      
      // Execute AI command
      const startTime = Date.now();
      const response = await geminiAIService.processStoreQuery(test.command, context);
      const processingTime = Date.now() - startTime;
      
      console.log(`\n📋 AI Response:`);
      console.log(`   Success: ${response.success}`);
      console.log(`   Action Executed: ${response.actionExecuted}`);
      console.log(`   Processing Time: ${processingTime}ms`);
      
      // Wait for database operations
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check database
      const finalCount = await test.expectedModel.countDocuments({ store: testStore._id });
      const recordsCreated = finalCount - initialCount;
      
      console.log(`\n🗄️  Database Results:`);
      console.log(`   Final ${test.expectedModel.modelName} count: ${finalCount}`);
      console.log(`   Records created: ${recordsCreated}`);
      
      // Verify fix
      let testPassed = false;
      
      if (test.expectedAction) {
        // Should create records and report success
        if (response.actionExecuted && recordsCreated > 0) {
          console.log(`   ✅ EXPECTED SUCCESS: Action executed and records created`);
          
          // Check for double execution (should only create 1 record)
          if (recordsCreated === 1) {
            console.log(`   ✅ NO DOUBLE EXECUTION: Only 1 record created`);
            testPassed = true;
          } else {
            console.log(`   ❌ DOUBLE EXECUTION DETECTED: ${recordsCreated} records created`);
          }
        } else {
          console.log(`   ❌ UNEXPECTED FAILURE: Expected success but got failure`);
          console.log(`      Action Executed: ${response.actionExecuted}, Records: ${recordsCreated}`);
        }
      } else {
        // Should fail and report failure
        if (!response.actionExecuted && recordsCreated === 0) {
          console.log(`   ✅ EXPECTED FAILURE: Action failed and no records created`);
          testPassed = true;
        } else {
          console.log(`   ❌ UNEXPECTED SUCCESS: Expected failure but got success`);
          console.log(`      Action Executed: ${response.actionExecuted}, Records: ${recordsCreated}`);
        }
      }
      
      if (testPassed) {
        passedTests++;
        console.log(`\n🎉 TEST PASSED`);
      } else {
        console.log(`\n💥 TEST FAILED`);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Final Results
    console.log(`\n🏆 FINAL RESULTS`);
    console.log('================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed Tests: ${passedTests}`);
    console.log(`Failed Tests: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log(`\n🎉 ALL FIXES WORKING CORRECTLY!`);
    } else {
      console.log(`\n⚠️  SOME FIXES NEED MORE WORK`);
    }
    
    // Cleanup
    console.log('\n🧹 CLEANING UP...');
    await Medicine.deleteMany({ store: testStore._id });
    await Customer.deleteMany({ store: testStore._id });
    await Supplier.deleteMany({ store: testStore._id });
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

if (require.main === module) {
  testAllFixes();
}

module.exports = { testAllFixes };

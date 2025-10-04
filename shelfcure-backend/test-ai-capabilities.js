/**
 * COMPREHENSIVE AI CAPABILITIES TESTING
 * 
 * This script tests the ACTUAL capabilities of the AI Store Assistant
 * by attempting to execute real database operations and verifying results.
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

// Test store and user data
const testStore = {
  _id: new mongoose.Types.ObjectId(),
  name: 'AI Test Pharmacy',
  address: '123 Test Street',
  phone: '9876543210'
};

const testUser = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Test Manager',
  role: 'store_manager',
  email: 'test@pharmacy.com'
};

/**
 * CAPABILITY TEST SCENARIOS
 */
const capabilityTests = [
  // INVENTORY MANAGEMENT TESTS
  {
    category: 'Inventory Management',
    operation: 'Add Medicine',
    command: "Add medicine 'Paracetamol 500mg' with manufacturer 'ABC Pharma' in category 'Analgesic'",
    expectedAction: 'createMedicine',
    verifyMethod: async () => {
      const medicine = await Medicine.findOne({ 
        store: testStore._id, 
        name: /paracetamol/i 
      });
      return medicine !== null;
    }
  },
  {
    category: 'Inventory Management',
    operation: 'Update Stock',
    command: "Update stock for Paracetamol to 100 strips and 500 units",
    expectedAction: 'updateMedicineStock',
    verifyMethod: async () => {
      const medicine = await Medicine.findOne({ 
        store: testStore._id, 
        name: /paracetamol/i 
      });
      return medicine && (medicine.inventory.strips === 100 || medicine.inventory.units === 500);
    }
  },

  // CUSTOMER MANAGEMENT TESTS
  {
    category: 'Customer Management',
    operation: 'Add Customer',
    command: "Add customer 'John Doe' with phone number 9876543210 and email john@example.com",
    expectedAction: 'createCustomer',
    verifyMethod: async () => {
      const customer = await Customer.findOne({ 
        store: testStore._id, 
        phone: '9876543210' 
      });
      return customer !== null;
    }
  },
  {
    category: 'Customer Management',
    operation: 'Update Customer',
    command: "Update customer John Doe's email to newemail@example.com",
    expectedAction: 'updateCustomer',
    verifyMethod: async () => {
      const customer = await Customer.findOne({ 
        store: testStore._id, 
        phone: '9876543210' 
      });
      return customer && customer.email === 'newemail@example.com';
    }
  },

  // SALES MANAGEMENT TESTS
  {
    category: 'Sales Management',
    operation: 'Create Sale',
    command: "Create a sale for customer 9876543210 with 2 strips of Paracetamol at ₹20 each",
    expectedAction: 'createSale',
    verifyMethod: async () => {
      const sale = await Sale.findOne({ 
        store: testStore._id 
      }).populate('customer');
      return sale !== null;
    }
  },

  // SUPPLIER MANAGEMENT TESTS
  {
    category: 'Supplier Management',
    operation: 'Add Supplier',
    command: "Add supplier 'MedCorp' with phone 9876543211 and email contact@medcorp.com",
    expectedAction: 'createSupplier',
    verifyMethod: async () => {
      const supplier = await Supplier.findOne({ 
        store: testStore._id, 
        name: /medcorp/i 
      });
      return supplier !== null;
    }
  },

  // PURCHASE MANAGEMENT TESTS
  {
    category: 'Purchase Management',
    operation: 'Create Purchase Order',
    command: "Create purchase order for supplier MedCorp with 100 strips of Paracetamol at ₹8 each",
    expectedAction: 'createPurchaseOrder',
    verifyMethod: async () => {
      const purchase = await Purchase.findOne({ 
        store: testStore._id 
      });
      return purchase !== null;
    }
  },

  // DOCTOR MANAGEMENT TESTS (MISSING)
  {
    category: 'Doctor Management',
    operation: 'Add Doctor',
    command: "Add doctor 'Dr. Smith' with specialization 'General Medicine' and phone 9876543212",
    expectedAction: 'createDoctor',
    verifyMethod: async () => {
      const doctor = await Doctor.findOne({ 
        store: testStore._id, 
        name: /dr.*smith/i 
      });
      return doctor !== null;
    }
  },

  // STAFF MANAGEMENT TESTS (MISSING)
  {
    category: 'Staff Management',
    operation: 'Add Staff',
    command: "Add staff member 'Jane Pharmacist' with role 'pharmacist' and phone 9876543213",
    expectedAction: 'createStaff',
    verifyMethod: async () => {
      const staff = await Staff.findOne({ 
        store: testStore._id, 
        name: /jane.*pharmacist/i 
      });
      return staff !== null;
    }
  },

  // RETURN MANAGEMENT TESTS (MISSING)
  {
    category: 'Return Management',
    operation: 'Process Return',
    command: "Process return for invoice INV001 with 1 strip of Paracetamol due to expiry",
    expectedAction: 'processReturn',
    verifyMethod: async () => {
      const returnRecord = await Return.findOne({ 
        store: testStore._id 
      });
      return returnRecord !== null;
    }
  }
];

/**
 * Execute capability test
 */
async function executeCapabilityTest(test) {
  console.log(`\n🧪 Testing: ${test.operation}`);
  console.log(`📝 Command: "${test.command}"`);
  
  const startTime = Date.now();
  
  try {
    const context = {
      store: testStore,
      user: testUser,
      conversationId: `test_${Date.now()}`
    };
    
    // Execute AI command
    const response = await geminiAIService.processStoreQuery(test.command, context);
    const processingTime = Date.now() - startTime;
    
    // Check if action was executed
    const actionExecuted = response.actionExecuted || false;
    
    // Verify database changes (if applicable)
    let databaseVerified = false;
    if (test.verifyMethod) {
      try {
        databaseVerified = await test.verifyMethod();
      } catch (error) {
        console.log(`⚠️  Database verification failed: ${error.message}`);
      }
    }
    
    // Determine success
    const success = response.success && (actionExecuted || response.response.includes('✅'));
    
    console.log(`✅ AI Response Success: ${response.success}`);
    console.log(`🔧 Action Executed: ${actionExecuted}`);
    console.log(`💾 Database Verified: ${databaseVerified}`);
    console.log(`⏱️  Processing Time: ${processingTime}ms`);
    console.log(`🎯 Intent: ${response.intent || 'N/A'}`);
    console.log(`📊 Confidence: ${((response.confidence || 0) * 100).toFixed(1)}%`);
    console.log(`🤖 Response: ${response.response.substring(0, 100)}...`);
    
    return {
      category: test.category,
      operation: test.operation,
      command: test.command,
      expectedAction: test.expectedAction,
      success: success,
      actionExecuted: actionExecuted,
      databaseVerified: databaseVerified,
      processingTime: processingTime,
      intent: response.intent,
      confidence: response.confidence,
      response: response.response,
      fullCapable: success && actionExecuted && databaseVerified
    };
    
  } catch (error) {
    console.log(`❌ Test Failed: ${error.message}`);
    
    return {
      category: test.category,
      operation: test.operation,
      command: test.command,
      expectedAction: test.expectedAction,
      success: false,
      actionExecuted: false,
      databaseVerified: false,
      processingTime: Date.now() - startTime,
      error: error.message,
      fullCapable: false
    };
  }
}

/**
 * Run comprehensive capability assessment
 */
async function runCapabilityAssessment() {
  console.log('🚀 STARTING COMPREHENSIVE AI CAPABILITY ASSESSMENT');
  console.log('============================================================\n');
  
  // Connect to database for verification
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/shelfcure-test');
    console.log('📊 Connected to test database for verification\n');
  } catch (error) {
    console.log('⚠️  Database connection failed - proceeding with AI-only tests\n');
  }
  
  const results = {
    totalTests: capabilityTests.length,
    categories: {},
    overallStats: {
      aiResponseSuccess: 0,
      actionExecuted: 0,
      databaseVerified: 0,
      fullCapable: 0
    },
    testResults: []
  };
  
  // Group tests by category
  for (const test of capabilityTests) {
    if (!results.categories[test.category]) {
      results.categories[test.category] = {
        total: 0,
        aiSuccess: 0,
        actionExecuted: 0,
        databaseVerified: 0,
        fullCapable: 0,
        tests: []
      };
    }
    results.categories[test.category].total++;
  }
  
  // Execute tests
  for (const test of capabilityTests) {
    const result = await executeCapabilityTest(test);
    
    // Update statistics
    const category = results.categories[test.category];
    if (result.success) {
      results.overallStats.aiResponseSuccess++;
      category.aiSuccess++;
    }
    if (result.actionExecuted) {
      results.overallStats.actionExecuted++;
      category.actionExecuted++;
    }
    if (result.databaseVerified) {
      results.overallStats.databaseVerified++;
      category.databaseVerified++;
    }
    if (result.fullCapable) {
      results.overallStats.fullCapable++;
      category.fullCapable++;
    }
    
    category.tests.push(result);
    results.testResults.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

/**
 * Generate comprehensive capability report
 */
function generateCapabilityReport(results) {
  console.log('\n\n📋 COMPREHENSIVE AI CAPABILITY ASSESSMENT REPORT');
  console.log('============================================================');
  
  // Overall Statistics
  console.log(`\n📊 OVERALL STATISTICS:`);
  console.log(`• Total Tests: ${results.totalTests}`);
  console.log(`• AI Response Success: ${results.overallStats.aiResponseSuccess}/${results.totalTests} (${((results.overallStats.aiResponseSuccess / results.totalTests) * 100).toFixed(1)}%)`);
  console.log(`• Action Execution: ${results.overallStats.actionExecuted}/${results.totalTests} (${((results.overallStats.actionExecuted / results.totalTests) * 100).toFixed(1)}%)`);
  console.log(`• Database Verification: ${results.overallStats.databaseVerified}/${results.totalTests} (${((results.overallStats.databaseVerified / results.totalTests) * 100).toFixed(1)}%)`);
  console.log(`• Full Capability: ${results.overallStats.fullCapable}/${results.totalTests} (${((results.overallStats.fullCapable / results.totalTests) * 100).toFixed(1)}%)`);
  
  // Category Breakdown
  console.log(`\n📂 CATEGORY BREAKDOWN:`);
  Object.entries(results.categories).forEach(([category, stats]) => {
    const fullCapableRate = ((stats.fullCapable / stats.total) * 100).toFixed(1);
    console.log(`\n  ${category}:`);
    console.log(`    • AI Success: ${stats.aiSuccess}/${stats.total} (${((stats.aiSuccess / stats.total) * 100).toFixed(1)}%)`);
    console.log(`    • Action Executed: ${stats.actionExecuted}/${stats.total} (${((stats.actionExecuted / stats.total) * 100).toFixed(1)}%)`);
    console.log(`    • Database Verified: ${stats.databaseVerified}/${stats.total} (${((stats.databaseVerified / stats.total) * 100).toFixed(1)}%)`);
    console.log(`    • Full Capability: ${stats.fullCapable}/${stats.total} (${fullCapableRate}%)`);
  });
  
  // Missing Capabilities
  console.log(`\n❌ MISSING CAPABILITIES:`);
  const missingCapabilities = results.testResults.filter(test => !test.fullCapable);
  missingCapabilities.forEach(test => {
    console.log(`  • ${test.category} - ${test.operation}: ${test.expectedAction} not implemented`);
  });
  
  // Working Capabilities
  console.log(`\n✅ WORKING CAPABILITIES:`);
  const workingCapabilities = results.testResults.filter(test => test.fullCapable);
  workingCapabilities.forEach(test => {
    console.log(`  • ${test.category} - ${test.operation}: Fully functional`);
  });
  
  // Final Assessment
  const overallCapability = (results.overallStats.fullCapable / results.totalTests) * 100;
  console.log(`\n🏆 FINAL ASSESSMENT:`);
  console.log(`Overall AI Capability: ${overallCapability.toFixed(1)}%`);
  
  if (overallCapability >= 90) {
    console.log('🌟 EXCELLENT: AI can handle comprehensive store management!');
  } else if (overallCapability >= 75) {
    console.log('✅ GOOD: AI can handle most store operations effectively.');
  } else if (overallCapability >= 50) {
    console.log('⚠️  MODERATE: AI has basic capabilities but needs significant improvement.');
  } else {
    console.log('❌ POOR: AI needs major enhancements for comprehensive store management.');
  }
  
  console.log('\n============================================================');
}

// Run the assessment
if (require.main === module) {
  runCapabilityAssessment()
    .then(results => {
      generateCapabilityReport(results);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Assessment failed:', error);
      process.exit(1);
    });
}

module.exports = { runCapabilityAssessment, generateCapabilityReport };

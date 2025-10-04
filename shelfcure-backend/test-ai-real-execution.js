/**
 * REAL AI EXECUTION TEST
 * 
 * This script tests the AI Store Assistant by actually executing commands
 * and checking if they work properly (without database dependencies).
 */

require('dotenv').config();
const geminiAI = require('./services/geminiAIService');

// Mock store and user data
const mockStore = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test Pharmacy',
  address: '123 Test Street',
  phone: '9876543210',
  settings: {
    gst: { rate: 18, enabled: true },
    discount: { enabled: true, maxPercentage: 20 }
  }
};

const mockUser = {
  _id: '507f1f77bcf86cd799439012',
  name: 'Test Manager',
  role: 'store_manager',
  email: 'test@pharmacy.com'
};

/**
 * REAL EXECUTION TESTS
 */
const executionTests = [
  // WORKING CAPABILITIES
  {
    category: 'Inventory Management',
    operation: 'Add Medicine',
    command: "Add medicine 'Paracetamol 500mg' with manufacturer 'ABC Pharma' in category 'Analgesic' and composition 'Paracetamol 500mg'",
    expectedSuccess: true,
    expectedAction: true
  },
  {
    category: 'Inventory Management',
    operation: 'View Inventory',
    command: "Show me current inventory status",
    expectedSuccess: true,
    expectedAction: false // This is a query, not an action
  },
  {
    category: 'Customer Management',
    operation: 'Add Customer',
    command: "Add customer 'John Doe' with phone number 9876543210 and email john@example.com",
    expectedSuccess: true,
    expectedAction: true
  },
  {
    category: 'Customer Management',
    operation: 'View Customers',
    command: "Show me top customers",
    expectedSuccess: true,
    expectedAction: false
  },
  {
    category: 'Sales Management',
    operation: 'View Sales',
    command: "Show me today's sales report",
    expectedSuccess: true,
    expectedAction: false
  },
  {
    category: 'Analytics',
    operation: 'Store Analytics',
    command: "Give me store analytics dashboard",
    expectedSuccess: true,
    expectedAction: false
  },
  {
    category: 'Settings',
    operation: 'View Settings',
    command: "Show me current store settings",
    expectedSuccess: true,
    expectedAction: false
  },

  // MISSING CAPABILITIES
  {
    category: 'Doctor Management',
    operation: 'Add Doctor',
    command: "Add doctor 'Dr. Smith' with specialization 'General Medicine' and phone 9876543212",
    expectedSuccess: false, // Should fail due to missing handler
    expectedAction: false
  },
  {
    category: 'Staff Management',
    operation: 'Add Staff',
    command: "Add staff member 'Jane Pharmacist' with role 'pharmacist' and phone 9876543213",
    expectedSuccess: false, // Should fail due to missing handler
    expectedAction: false
  },
  {
    category: 'Return Management',
    operation: 'Process Return',
    command: "Process return for invoice INV001 with 1 strip of Paracetamol due to expiry",
    expectedSuccess: false, // Should fail due to missing handler
    expectedAction: false
  }
];

/**
 * Execute a single test
 */
async function executeTest(test) {
  console.log(`\n🧪 Testing: ${test.operation}`);
  console.log(`📂 Category: ${test.category}`);
  console.log(`📝 Command: "${test.command}"`);
  
  const startTime = Date.now();
  
  try {
    const context = {
      store: mockStore,
      user: mockUser,
      conversationId: `test_${Date.now()}`
    };
    
    // Execute the AI command
    const response = await geminiAI.processStoreQuery(test.command, context);
    const processingTime = Date.now() - startTime;
    
    // Analyze the response
    const success = response.success === true;
    const actionExecuted = response.actionExecuted === true;
    const hasResponse = response.response && response.response.length > 0;
    const hasIntent = response.intent && response.intent.length > 0;
    const hasConfidence = response.confidence && response.confidence > 0;
    
    // Check if response indicates an error
    const hasError = response.response && (
      response.response.includes('❌') ||
      response.response.includes('Failed') ||
      response.response.includes('Error') ||
      response.response.includes('not available')
    );
    
    // Determine overall success
    const overallSuccess = success && hasResponse && !hasError;
    
    console.log(`  ✅ AI Response Success: ${success}`);
    console.log(`  🔧 Action Executed: ${actionExecuted}`);
    console.log(`  📄 Has Response: ${hasResponse}`);
    console.log(`  🎯 Has Intent: ${hasIntent} (${response.intent || 'N/A'})`);
    console.log(`  📊 Has Confidence: ${hasConfidence} (${((response.confidence || 0) * 100).toFixed(1)}%)`);
    console.log(`  ❌ Has Error: ${hasError}`);
    console.log(`  ⏱️  Processing Time: ${processingTime}ms`);
    console.log(`  🏆 Overall Success: ${overallSuccess}`);
    
    // Show response preview
    const responsePreview = response.response ? response.response.substring(0, 150) + '...' : 'No response';
    console.log(`  🤖 Response Preview: ${responsePreview}`);
    
    return {
      category: test.category,
      operation: test.operation,
      command: test.command,
      expectedSuccess: test.expectedSuccess,
      expectedAction: test.expectedAction,
      actualSuccess: overallSuccess,
      actualAction: actionExecuted,
      processingTime: processingTime,
      intent: response.intent,
      confidence: response.confidence,
      hasError: hasError,
      response: response.response,
      matchesExpectation: (overallSuccess === test.expectedSuccess) && (actionExecuted === test.expectedAction)
    };
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.log(`  ❌ Test Failed: ${error.message}`);
    console.log(`  ⏱️  Processing Time: ${processingTime}ms`);
    
    return {
      category: test.category,
      operation: test.operation,
      command: test.command,
      expectedSuccess: test.expectedSuccess,
      expectedAction: test.expectedAction,
      actualSuccess: false,
      actualAction: false,
      processingTime: processingTime,
      error: error.message,
      matchesExpectation: false
    };
  }
}

/**
 * Run all execution tests
 */
async function runExecutionTests() {
  console.log('🚀 STARTING REAL AI EXECUTION TESTS');
  console.log('============================================\n');
  
  const results = [];
  
  for (const test of executionTests) {
    const result = await executeTest(test);
    results.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

/**
 * Generate execution report
 */
function generateExecutionReport(results) {
  console.log('\n\n📋 AI EXECUTION TEST REPORT');
  console.log('============================================');
  
  // Overall statistics
  const totalTests = results.length;
  const successfulTests = results.filter(r => r.actualSuccess).length;
  const actionTests = results.filter(r => r.actualAction).length;
  const matchingExpectations = results.filter(r => r.matchesExpectation).length;
  
  console.log(`\n📊 OVERALL STATISTICS:`);
  console.log(`• Total Tests: ${totalTests}`);
  console.log(`• Successful Responses: ${successfulTests}/${totalTests} (${((successfulTests / totalTests) * 100).toFixed(1)}%)`);
  console.log(`• Actions Executed: ${actionTests}/${totalTests} (${((actionTests / totalTests) * 100).toFixed(1)}%)`);
  console.log(`• Matching Expectations: ${matchingExpectations}/${totalTests} (${((matchingExpectations / totalTests) * 100).toFixed(1)}%)`);
  
  // Category breakdown
  const categories = [...new Set(results.map(r => r.category))];
  console.log(`\n📂 CATEGORY BREAKDOWN:`);
  
  categories.forEach(category => {
    const categoryResults = results.filter(r => r.category === category);
    const categorySuccess = categoryResults.filter(r => r.actualSuccess).length;
    const categoryActions = categoryResults.filter(r => r.actualAction).length;
    
    console.log(`\n  ${category}:`);
    console.log(`    • Tests: ${categoryResults.length}`);
    console.log(`    • Successful: ${categorySuccess}/${categoryResults.length} (${((categorySuccess / categoryResults.length) * 100).toFixed(1)}%)`);
    console.log(`    • Actions: ${categoryActions}/${categoryResults.length} (${((categoryActions / categoryResults.length) * 100).toFixed(1)}%)`);
  });
  
  // Working operations
  console.log(`\n✅ WORKING OPERATIONS:`);
  const workingOps = results.filter(r => r.actualSuccess);
  workingOps.forEach(op => {
    console.log(`  • ${op.category} - ${op.operation}: ${op.actualAction ? 'Action Capable' : 'Query Only'}`);
  });
  
  // Failed operations
  console.log(`\n❌ FAILED OPERATIONS:`);
  const failedOps = results.filter(r => !r.actualSuccess);
  failedOps.forEach(op => {
    console.log(`  • ${op.category} - ${op.operation}: ${op.error || 'Response had errors'}`);
  });
  
  // Performance metrics
  const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
  const maxProcessingTime = Math.max(...results.map(r => r.processingTime));
  const minProcessingTime = Math.min(...results.map(r => r.processingTime));
  
  console.log(`\n⏱️  PERFORMANCE METRICS:`);
  console.log(`• Average Processing Time: ${avgProcessingTime.toFixed(0)}ms`);
  console.log(`• Max Processing Time: ${maxProcessingTime}ms`);
  console.log(`• Min Processing Time: ${minProcessingTime}ms`);
  
  // Final assessment
  const overallCapability = (successfulTests / totalTests) * 100;
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
  
  console.log('\n============================================');
  
  return {
    totalTests,
    successfulTests,
    actionTests,
    overallCapability,
    workingOperations: workingOps.length,
    failedOperations: failedOps.length
  };
}

// Run the tests
if (require.main === module) {
  runExecutionTests()
    .then(results => {
      const summary = generateExecutionReport(results);
      
      console.log('\n💾 Execution tests complete.');
      console.log(`🎯 Key Finding: ${summary.overallCapability.toFixed(1)}% of operations are working properly.`);
      
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Execution tests failed:', error);
      process.exit(1);
    });
}

module.exports = { runExecutionTests, generateExecutionReport };

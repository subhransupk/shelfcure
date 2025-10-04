/**
 * AI ERROR HANDLING & EDGE CASES TEST
 * 
 * This script tests how the AI handles various error scenarios,
 * invalid inputs, and edge cases.
 */

require('dotenv').config();
const geminiAIService = require('./services/geminiAIService');

/**
 * Test error handling scenarios
 */
async function testErrorHandling() {
  console.log('🚨 AI ERROR HANDLING TEST');
  console.log('==========================\n');
  
  // Valid context for testing
  const validContext = {
    store: { 
      _id: '507f1f77bcf86cd799439011', // Valid ObjectId format
      name: 'Test Store',
      settings: { gst: { rate: 18 } }
    },
    user: { 
      _id: '507f1f77bcf86cd799439012', // Valid ObjectId format
      name: 'Test User', 
      role: 'store_manager' 
    },
    conversationId: 'test_error_handling'
  };
  
  const errorTestCases = [
    {
      name: "Empty Message",
      command: "",
      expectedBehavior: "Should handle gracefully"
    },
    {
      name: "Very Long Message",
      command: "Add medicine " + "very long name ".repeat(100),
      expectedBehavior: "Should handle long input"
    },
    {
      name: "Special Characters",
      command: "Add medicine 'Test@#$%^&*()' with manufacturer 'ABC<>?/\\|'",
      expectedBehavior: "Should sanitize special characters"
    },
    {
      name: "Incomplete Medicine Data",
      command: "Add medicine",
      expectedBehavior: "Should request missing information"
    },
    {
      name: "Invalid Category",
      command: "Add medicine 'Test' in category 'InvalidCategory'",
      expectedBehavior: "Should use default category or ask for valid one"
    },
    {
      name: "Ambiguous Request",
      command: "Add something",
      expectedBehavior: "Should ask for clarification"
    },
    {
      name: "Multiple Actions in One Request",
      command: "Add medicine Paracetamol and create customer John and show sales",
      expectedBehavior: "Should handle multiple actions or ask to separate"
    },
    {
      name: "Non-English Characters",
      command: "Add medicine 'पैरासिटामोल' with manufacturer 'भारत फार्मा'",
      expectedBehavior: "Should handle Unicode characters"
    },
    {
      name: "SQL Injection Attempt",
      command: "Add medicine 'Test'; DROP TABLE medicines; --",
      expectedBehavior: "Should sanitize and not execute malicious code"
    },
    {
      name: "Nonsensical Request",
      command: "Purple elephant dancing on the moon",
      expectedBehavior: "Should politely decline and suggest valid actions"
    }
  ];
  
  for (const testCase of errorTestCases) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`Command: "${testCase.command}"`);
    console.log(`Expected: ${testCase.expectedBehavior}`);
    console.log('-'.repeat(50));
    
    try {
      const startTime = Date.now();
      const response = await geminiAIService.processStoreQuery(testCase.command, validContext);
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ Response received (${processingTime}ms)`);
      console.log(`Success: ${response.success}`);
      console.log(`Intent: ${response.intent}`);
      console.log(`Action Executed: ${response.actionExecuted || false}`);
      
      if (response.response) {
        const preview = response.response.length > 150 
          ? response.response.substring(0, 150) + '...'
          : response.response;
        console.log(`Response: "${preview}"`);
      }
      
      if (response.suggestions && response.suggestions.length > 0) {
        console.log(`Suggestions: ${response.suggestions.slice(0, 2).join(', ')}`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Test invalid context scenarios
 */
async function testInvalidContext() {
  console.log('\n🔧 INVALID CONTEXT TEST');
  console.log('========================\n');
  
  const contextTestCases = [
    {
      name: "Null Context",
      context: null,
      command: "Show me sales"
    },
    {
      name: "Missing Store",
      context: {
        user: { _id: '507f1f77bcf86cd799439012', name: 'Test User', role: 'store_manager' },
        conversationId: 'test'
      },
      command: "Add medicine Paracetamol"
    },
    {
      name: "Missing User",
      context: {
        store: { _id: '507f1f77bcf86cd799439011', name: 'Test Store' },
        conversationId: 'test'
      },
      command: "Add customer John"
    },
    {
      name: "Invalid Store ID",
      context: {
        store: { _id: 'invalid-id', name: 'Test Store' },
        user: { _id: '507f1f77bcf86cd799439012', name: 'Test User', role: 'store_manager' },
        conversationId: 'test'
      },
      command: "Show inventory"
    },
    {
      name: "Wrong User Role",
      context: {
        store: { _id: '507f1f77bcf86cd799439011', name: 'Test Store' },
        user: { _id: '507f1f77bcf86cd799439012', name: 'Test User', role: 'customer' },
        conversationId: 'test'
      },
      command: "Add medicine"
    }
  ];
  
  for (const testCase of contextTestCases) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`Command: "${testCase.command}"`);
    console.log('-'.repeat(40));
    
    try {
      const response = await geminiAIService.processStoreQuery(testCase.command, testCase.context);
      console.log(`✅ Response received`);
      console.log(`Success: ${response.success}`);
      console.log(`Response: "${response.response?.substring(0, 100)}..."`);
      
    } catch (error) {
      console.log(`❌ Error (Expected): ${error.message}`);
    }
  }
}

/**
 * Test data validation edge cases
 */
async function testDataValidation() {
  console.log('\n📊 DATA VALIDATION TEST');
  console.log('========================\n');
  
  const validationTestCases = [
    {
      name: "Medicine with Minimum Data",
      message: "Add medicine 'A'",
      extractor: 'extractMedicineData'
    },
    {
      name: "Medicine with Maximum Length Name",
      message: `Add medicine '${'Very Long Medicine Name '.repeat(10)}'`,
      extractor: 'extractMedicineData'
    },
    {
      name: "Customer with Only Name",
      message: "Add customer 'John'",
      extractor: 'extractCustomerData'
    },
    {
      name: "Customer with Invalid Phone",
      message: "Add customer 'John' with phone 'invalid-phone'",
      extractor: 'extractCustomerData'
    },
    {
      name: "Customer with Invalid Email",
      message: "Add customer 'John' with email 'invalid-email'",
      extractor: 'extractCustomerData'
    },
    {
      name: "Supplier with Minimal Data",
      message: "Add supplier 'ABC'",
      extractor: 'extractSupplierData'
    }
  ];
  
  for (const testCase of validationTestCases) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`Message: "${testCase.message}"`);
    console.log('-'.repeat(40));
    
    try {
      const extractedData = geminiAIService[testCase.extractor](testCase.message);
      
      if (extractedData) {
        console.log('✅ Data extracted:');
        console.log(JSON.stringify(extractedData, null, 2));
      } else {
        console.log('❌ No data extracted');
      }
      
    } catch (error) {
      console.log(`❌ Extraction error: ${error.message}`);
    }
  }
}

/**
 * Test concurrent requests
 */
async function testConcurrentRequests() {
  console.log('\n⚡ CONCURRENT REQUESTS TEST');
  console.log('============================\n');
  
  const validContext = {
    store: { 
      _id: '507f1f77bcf86cd799439011',
      name: 'Test Store',
      settings: { gst: { rate: 18 } }
    },
    user: { 
      _id: '507f1f77bcf86cd799439012',
      name: 'Test User', 
      role: 'store_manager' 
    },
    conversationId: 'concurrent_test'
  };
  
  const commands = [
    "Show me today's sales",
    "Show inventory status",
    "Show customer list",
    "Show supplier list",
    "Show analytics"
  ];
  
  console.log('Sending 5 concurrent requests...');
  const startTime = Date.now();
  
  try {
    const promises = commands.map((command, index) => 
      geminiAIService.processStoreQuery(command, {
        ...validContext,
        conversationId: `concurrent_${index}`
      })
    );
    
    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    console.log(`✅ All requests completed in ${totalTime}ms`);
    console.log(`Average time per request: ${(totalTime / results.length).toFixed(0)}ms`);
    
    results.forEach((result, index) => {
      console.log(`Request ${index + 1}: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.intent}`);
    });
    
  } catch (error) {
    console.log(`❌ Concurrent test failed: ${error.message}`);
  }
}

/**
 * Run all error handling tests
 */
async function runAllErrorTests() {
  await testErrorHandling();
  await testInvalidContext();
  await testDataValidation();
  await testConcurrentRequests();
}

if (require.main === module) {
  runAllErrorTests();
}

module.exports = {
  testErrorHandling,
  testInvalidContext,
  testDataValidation,
  testConcurrentRequests
};

const DynamicAIAgent = require('./services/agent/DynamicAIAgent');

async function testCustomerCreation() {
  console.log('🧪 Testing Customer Creation with AI Assistant...\n');
  
  const agent = new DynamicAIAgent();
  
  // Test cases for customer creation
  const testCases = [
    {
      name: "Basic customer creation",
      message: "customer name - pink, number- 1234567802, email-pink@gmail.com",
      expectedIntent: "create",
      expectedDomain: "customers"
    },
    {
      name: "Alternative format",
      message: "add customer: name is John, phone 9876543210, email john@test.com",
      expectedIntent: "create", 
      expectedDomain: "customers"
    },
    {
      name: "Simple format",
      message: "create customer Pink with phone 1234567802",
      expectedIntent: "create",
      expectedDomain: "customers"
    },
    {
      name: "Natural language",
      message: "I want to add a new customer named Pink, phone number is 1234567802 and email is pink@gmail.com",
      expectedIntent: "create",
      expectedDomain: "customers"
    }
  ];
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`📝 Test ${i + 1}/${totalTests}: ${testCase.name}`);
    console.log(`💬 Message: "${testCase.message}"`);
    console.log('────────────────────────────────────────────────────────────');
    
    try {
      const startTime = Date.now();
      const result = await agent.processMessage(testCase.message, {
        user: { _id: 'user123', name: 'Test User', role: 'store_manager' },
        store: { _id: 'store123', name: 'Test Store' }
      });
      const processingTime = Date.now() - startTime;
      
      console.log('🧠 Understanding:', JSON.stringify(result.understanding, null, 2));
      console.log('⚡ Results:', JSON.stringify(result.results, null, 2));
      console.log(`⏱️  Processing Time: ${processingTime}ms`);
      
      // Check if the understanding is correct
      const understanding = result.understanding;
      let testPassed = true;
      let issues = [];
      
      if (understanding.intent !== testCase.expectedIntent) {
        testPassed = false;
        issues.push(`Expected intent '${testCase.expectedIntent}', got '${understanding.intent}'`);
      }
      
      if (understanding.domain !== testCase.expectedDomain) {
        testPassed = false;
        issues.push(`Expected domain '${testCase.expectedDomain}', got '${understanding.domain}'`);
      }
      
      // Check if customer data was extracted
      if (!understanding.entities.customerData) {
        testPassed = false;
        issues.push('Customer data was not extracted from the message');
      } else {
        const customerData = understanding.entities.customerData;
        if (!customerData.name) {
          issues.push('Customer name was not extracted');
        }
        if (!customerData.phone) {
          issues.push('Customer phone was not extracted');
        }
        console.log('✅ Customer Data Extracted:', customerData);
      }
      
      if (testPassed) {
        console.log('✅ PASSED');
        passedTests++;
      } else {
        console.log('❌ FAILED');
        issues.forEach(issue => console.log(`   - ${issue}`));
      }
      
    } catch (error) {
      console.log('❌ ERROR:', error.message);
    }
    
    console.log('');
  }
  
  console.log('============================================================');
  console.log(`🏁 Customer Creation Test Results: ${passedTests}/${totalTests} tests passed`);
  console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All customer creation tests passed! AI Assistant is working perfectly.');
  } else {
    console.log('⚠️  Some customer creation tests failed. AI Assistant needs improvement.');
  }
}

// Run the test
testCustomerCreation().catch(console.error);

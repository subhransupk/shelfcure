const DynamicAIAgent = require('./services/agent/DynamicAIAgent');

async function testUserQuery() {
  console.log('🧪 Testing User\'s Exact Query...\n');
  
  const agent = new DynamicAIAgent();
  
  // The exact query the user reported as not working
  const userQuery = "customer name - pink, number- 1234567802, email-pink@gmail.com";
  
  console.log(`💬 User Query: "${userQuery}"`);
  console.log('────────────────────────────────────────────────────────────');
  
  try {
    const startTime = Date.now();
    const result = await agent.processMessage(userQuery, {
      user: { _id: 'user123', name: 'Test User', role: 'store_manager' },
      store: { _id: 'store123', name: 'Test Store' }
    });
    const processingTime = Date.now() - startTime;
    
    console.log('🧠 Understanding:');
    console.log(`   Intent: ${result.understanding?.intent}`);
    console.log(`   Domain: ${result.understanding?.domain}`);
    console.log(`   Action: ${result.understanding?.action}`);
    console.log(`   Customer Data:`, result.understanding?.entities?.customerData);
    
    console.log('\n⚡ Execution Results:');
    console.log(`   Success: ${result.executionResults?.success}`);
    console.log(`   Action: ${result.executionResults?.action}`);
    console.log(`   Message: ${result.executionResults?.message}`);

    if (result.executionResults?.data?.customer) {
      console.log('\n✅ Customer Created:');
      console.log(`   ID: ${result.executionResults.data.customer._id}`);
      console.log(`   Name: ${result.executionResults.data.customer.name}`);
      console.log(`   Phone: ${result.executionResults.data.customer.phone}`);
      console.log(`   Email: ${result.executionResults.data.customer.email}`);
    }
    
    console.log(`\n⏱️  Processing Time: ${processingTime}ms`);
    
    // Check if it worked correctly
    const understanding = result.understanding;
    const results = result.executionResults;

    if (understanding?.intent === 'create' &&
        understanding?.domain === 'customers' &&
        understanding?.entities?.customerData?.name === 'pink' &&
        understanding?.entities?.customerData?.phone === '1234567802' &&
        understanding?.entities?.customerData?.email === 'pink@gmail.com' &&
        results?.success === true &&
        results?.action === 'create_customer') {
      
      console.log('\n🎉 SUCCESS! The AI assistant now correctly understands and processes the user\'s customer creation request!');
      console.log('\n📋 What the AI Assistant did:');
      console.log('   1. ✅ Identified this as a customer creation request');
      console.log('   2. ✅ Extracted customer name: "pink"');
      console.log('   3. ✅ Extracted phone number: "1234567802"');
      console.log('   4. ✅ Extracted email: "pink@gmail.com"');
      console.log('   5. ✅ Successfully created the customer');
      console.log('   6. ✅ Provided a helpful confirmation message');
      
    } else {
      console.log('\n❌ FAILED! The AI assistant still has issues processing this request.');
    }
    
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    console.log('\nThe AI assistant encountered an error processing this request.');
  }
}

// Run the test
testUserQuery().catch(console.error);

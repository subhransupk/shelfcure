/**
 * Test script for the new Gemini-based AI Store Assistant
 * 
 * This script tests the Gemini AI service to ensure it can handle
 * store management queries effectively.
 */

require('dotenv').config();
const geminiAIService = require('./services/geminiAIService');
const mongoose = require('mongoose');

// Mock store and user data for testing with valid ObjectIds
const mockStore = {
  _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
  name: 'Test Pharmacy',
  address: '123 Main St, City',
  phone: '1234567890'
};

const mockUser = {
  _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
  name: 'John Manager',
  role: 'store_manager',
  email: 'john@testpharmacy.com'
};

// Test queries to validate AI understanding
const testQueries = [
  // Inventory queries
  "Show me low stock medicines",
  "Check inventory for Paracetamol",
  "What medicines are expiring this month?",
  
  // Sales queries
  "Show me today's sales",
  "What was yesterday's revenue?",
  "Who are my top customers?",
  
  // Customer queries
  "Find customer John Smith",
  "Show customer purchase history",
  "Add new customer",
  
  // Supplier queries
  "Show all suppliers",
  "Create purchase order",
  "Check pending deliveries",
  
  // Analytics queries
  "Generate sales report",
  "Show monthly analytics",
  "Compare this month vs last month",
  
  // General queries
  "Help me with inventory management",
  "What can you do?",
  "Show dashboard overview"
];

/**
 * Test individual AI query
 */
async function testAIQuery(query, context) {
  console.log(`\n🧪 Testing: "${query}"`);
  console.log('─'.repeat(50));
  
  try {
    const startTime = Date.now();
    const result = await geminiAIService.processStoreQuery(query, context);
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ Success: ${result.success}`);
    console.log(`⏱️  Processing Time: ${processingTime}ms`);
    console.log(`🎯 Intent: ${result.intent || 'N/A'}`);
    console.log(`📊 Confidence: ${((result.confidence || 0) * 100).toFixed(1)}%`);
    console.log(`🤖 Response: ${result.response?.substring(0, 150)}${result.response?.length > 150 ? '...' : ''}`);
    
    if (result.suggestions && result.suggestions.length > 0) {
      console.log(`💡 Suggestions: ${result.suggestions.slice(0, 3).join(', ')}`);
    }
    
    if (result.quickActions && result.quickActions.length > 0) {
      console.log(`⚡ Quick Actions: ${result.quickActions.length} available`);
    }
    
    return { success: true, processingTime, result };
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test conversation context
 */
async function testConversationContext() {
  console.log('\n🔄 Testing Conversation Context...');
  console.log('='.repeat(50));
  
  try {
    const conversationId = 'test-conversation-' + Date.now();
    const context = { store: mockStore, user: mockUser, conversationId };
    
    // First message
    await testAIQuery("Show me today's sales", context);
    
    // Follow-up message (should have context)
    await testAIQuery("What about yesterday?", context);
    
    // Another follow-up
    await testAIQuery("Who was the top customer?", context);
    
    console.log('✅ Conversation context test completed!');
    
  } catch (error) {
    console.log(`❌ Conversation context test failed: ${error.message}`);
  }
}

/**
 * Test error handling
 */
async function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling...');
  console.log('='.repeat(50));
  
  try {
    // Test with invalid context
    const result = await geminiAIService.processStoreQuery("Test query", {});
    console.log(`✅ Error handling works: ${result.success ? 'Unexpected success' : 'Properly handled error'}`);
    
  } catch (error) {
    console.log(`✅ Error properly caught: ${error.message}`);
  }
}

/**
 * Run comprehensive AI tests
 */
async function runAITests() {
  console.log('🚀 Starting Gemini AI Store Assistant Tests...\n');
  console.log('='.repeat(60));
  
  // Check if API key is configured
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
    console.log('❌ GEMINI_API_KEY not configured in .env file');
    console.log('Please add your Gemini API key to the .env file to run tests');
    return;
  }
  
  const context = {
    store: mockStore,
    user: mockUser,
    conversationId: 'test-' + Date.now()
  };
  
  let successCount = 0;
  let totalTime = 0;
  
  // Test all queries
  for (const query of testQueries) {
    const result = await testAIQuery(query, context);
    if (result.success) {
      successCount++;
      totalTime += result.processingTime;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test conversation context
  await testConversationContext();
  
  // Test error handling
  await testErrorHandling();
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successful queries: ${successCount}/${testQueries.length}`);
  console.log(`⏱️  Average processing time: ${(totalTime / successCount).toFixed(0)}ms`);
  console.log(`🎯 Success rate: ${((successCount / testQueries.length) * 100).toFixed(1)}%`);
  
  if (successCount === testQueries.length) {
    console.log('\n🎉 All tests passed! Gemini AI Store Assistant is working perfectly.');
  } else {
    console.log(`\n⚠️  ${testQueries.length - successCount} tests failed. Please check the configuration.`);
  }
}

/**
 * Interactive test mode
 */
async function interactiveTest() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('\n🎮 Interactive Test Mode');
  console.log('Type your queries to test the AI assistant. Type "exit" to quit.\n');
  
  const context = {
    store: mockStore,
    user: mockUser,
    conversationId: 'interactive-' + Date.now()
  };
  
  const askQuestion = () => {
    rl.question('You: ', async (query) => {
      if (query.toLowerCase() === 'exit') {
        rl.close();
        return;
      }
      
      await testAIQuery(query, context);
      askQuestion();
    });
  };
  
  askQuestion();
}

// Run tests based on command line arguments
const args = process.argv.slice(2);

if (args.includes('--interactive') || args.includes('-i')) {
  interactiveTest();
} else {
  runAITests().then(() => {
    console.log('\n🏁 Tests completed!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

// Export for use in other test files
module.exports = {
  testAIQuery,
  testConversationContext,
  testErrorHandling,
  runAITests
};

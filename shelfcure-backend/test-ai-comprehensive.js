/**
 * Comprehensive Test Suite for AI Store Assistant
 * 
 * This script validates that the AI can handle ALL store management operations
 * including inventory, sales, customers, suppliers, analytics, and settings.
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

// Comprehensive test scenarios covering all store operations
const comprehensiveTestScenarios = [
  // INVENTORY MANAGEMENT
  {
    category: 'Inventory Management',
    tests: [
      "Show me low stock medicines",
      "Check inventory for Paracetamol",
      "Add new medicine Aspirin with 50 strips at ₹10 per strip",
      "Update stock for Paracetamol to 100 strips and 500 units",
      "What medicines are expiring this month?",
      "Show me inventory summary",
      "Which medicines need reordering?"
    ]
  },
  
  // CUSTOMER MANAGEMENT
  {
    category: 'Customer Management',
    tests: [
      "Add customer 'John Doe' with phone number 9876543210 and email john@example.com",
      "Find customer John Smith",
      "Show me top customers",
      "Update customer John's phone number to 9876543211",
      "Delete customer John Smith",
      "Show customer purchase history for phone 9876543210"
    ]
  },
  
  // SALES MANAGEMENT
  {
    category: 'Sales Management',
    tests: [
      "Show me today's sales",
      "What was yesterday's revenue?",
      "Create a sale for customer 9876543210 with 2 strips of Paracetamol at ₹20 each",
      "Show me this week's sales report",
      "Compare this month's sales with last month",
      "Who bought the most medicines this month?"
    ]
  },
  
  // SUPPLIER MANAGEMENT
  {
    category: 'Supplier Management',
    tests: [
      "Show all suppliers",
      "Add supplier 'MedCorp' with phone 9876543210 and email contact@medcorp.com",
      "Create purchase order for supplier MedCorp with 100 strips of Paracetamol at ₹8 each",
      "Check pending deliveries",
      "Show supplier payment status"
    ]
  },
  
  // ANALYTICS & REPORTING
  {
    category: 'Analytics & Reporting',
    tests: [
      "Show me store analytics dashboard",
      "Generate monthly sales report",
      "Show me staff information",
      "What are my best selling medicines?",
      "Show profit margins for this month"
    ]
  },
  
  // SETTINGS MANAGEMENT
  {
    category: 'Settings Management',
    tests: [
      "Show store settings",
      "Set GST rate to 18%",
      "Update low stock threshold to 15 units",
      "Enable auto reorder for low stock items",
      "Show current discount rules"
    ]
  },
  
  // COMPLEX MULTI-STEP OPERATIONS
  {
    category: 'Complex Operations',
    tests: [
      "Add customer 'Jane Doe' with phone 9876543220, then show me all customers",
      "Update Paracetamol stock to 50 strips and check if we need to reorder anything else",
      "Show me sales for this week and compare with last week",
      "Find all medicines expiring in next 30 days and create alerts",
      "Create a sale for customer 9876543210 for 2 strips of Paracetamol, then update inventory"
    ]
  }
];

/**
 * Test individual AI query
 */
async function testAIQuery(query, category) {
  const startTime = Date.now();
  
  try {
    const context = {
      store: mockStore,
      user: mockUser,
      conversationId: `test_${Date.now()}`
    };
    
    const response = await geminiAIService.processStoreQuery(query, context);
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ Success: ${response.success}`);
    console.log(`⏱️  Processing Time: ${processingTime}ms`);
    console.log(`🎯 Intent: ${response.intent || 'N/A'}`);
    console.log(`📊 Confidence: ${((response.confidence || 0) * 100).toFixed(1)}%`);
    console.log(`🤖 Response: ${response.response.substring(0, 100)}${response.response.length > 100 ? '...' : ''}`);
    
    if (response.suggestions && response.suggestions.length > 0) {
      console.log(`💡 Suggestions: ${response.suggestions.join(', ')}`);
    }
    
    if (response.quickActions && response.quickActions.length > 0) {
      console.log(`⚡ Quick Actions: ${response.quickActions.length} available`);
    }
    
    if (response.actionExecuted) {
      console.log(`🔧 Action Executed: ${response.actionExecuted}`);
    }
    
    return {
      success: response.success,
      processingTime,
      intent: response.intent,
      confidence: response.confidence,
      hasActions: (response.quickActions && response.quickActions.length > 0),
      actionExecuted: response.actionExecuted || false
    };
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.log(`❌ Error: ${error.message}`);
    console.log(`⏱️  Processing Time: ${processingTime}ms`);
    
    return {
      success: false,
      error: error.message,
      processingTime
    };
  }
}

/**
 * Run comprehensive AI tests
 */
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive AI Store Assistant Tests...\n');
  console.log('============================================================\n');
  
  const results = {
    totalTests: 0,
    successfulTests: 0,
    failedTests: 0,
    categoriesResults: {},
    totalProcessingTime: 0,
    averageProcessingTime: 0
  };
  
  for (const scenario of comprehensiveTestScenarios) {
    console.log(`📂 Testing Category: ${scenario.category}`);
    console.log('──────────────────────────────────────────────────');
    
    const categoryResults = {
      total: scenario.tests.length,
      successful: 0,
      failed: 0,
      tests: []
    };
    
    for (const testQuery of scenario.tests) {
      console.log(`\n🧪 Testing: "${testQuery}"`);
      console.log('──────────────────────────────────────────────────');
      
      const testResult = await testAIQuery(testQuery, scenario.category);
      
      results.totalTests++;
      results.totalProcessingTime += testResult.processingTime;
      
      if (testResult.success) {
        results.successfulTests++;
        categoryResults.successful++;
      } else {
        results.failedTests++;
        categoryResults.failed++;
      }
      
      categoryResults.tests.push({
        query: testQuery,
        result: testResult
      });
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    results.categoriesResults[scenario.category] = categoryResults;
    
    console.log(`\n📊 Category Summary: ${categoryResults.successful}/${categoryResults.total} tests passed\n`);
    console.log('============================================================\n');
  }
  
  // Calculate averages
  results.averageProcessingTime = results.totalProcessingTime / results.totalTests;
  
  return results;
}

/**
 * Generate comprehensive test report
 */
function generateTestReport(results) {
  console.log('📋 COMPREHENSIVE TEST REPORT');
  console.log('============================================================');
  console.log(`📊 Overall Results: ${results.successfulTests}/${results.totalTests} tests passed (${((results.successfulTests / results.totalTests) * 100).toFixed(1)}%)`);
  console.log(`⏱️  Total Processing Time: ${results.totalProcessingTime}ms`);
  console.log(`⚡ Average Processing Time: ${results.averageProcessingTime.toFixed(0)}ms per test`);
  console.log('\n📂 Category Breakdown:');
  
  Object.entries(results.categoriesResults).forEach(([category, categoryResult]) => {
    const successRate = ((categoryResult.successful / categoryResult.total) * 100).toFixed(1);
    console.log(`  • ${category}: ${categoryResult.successful}/${categoryResult.total} (${successRate}%)`);
  });
  
  console.log('\n🎯 AI CAPABILITIES ASSESSMENT:');
  
  // Assess different capabilities
  const inventoryTests = results.categoriesResults['Inventory Management'];
  const customerTests = results.categoriesResults['Customer Management'];
  const salesTests = results.categoriesResults['Sales Management'];
  const supplierTests = results.categoriesResults['Supplier Management'];
  const analyticsTests = results.categoriesResults['Analytics & Reporting'];
  const settingsTests = results.categoriesResults['Settings Management'];
  const complexTests = results.categoriesResults['Complex Operations'];
  
  console.log(`  📦 Inventory Management: ${inventoryTests ? ((inventoryTests.successful / inventoryTests.total) * 100).toFixed(1) : 0}% capable`);
  console.log(`  👥 Customer Management: ${customerTests ? ((customerTests.successful / customerTests.total) * 100).toFixed(1) : 0}% capable`);
  console.log(`  💰 Sales Management: ${salesTests ? ((salesTests.successful / salesTests.total) * 100).toFixed(1) : 0}% capable`);
  console.log(`  🏪 Supplier Management: ${supplierTests ? ((supplierTests.successful / supplierTests.total) * 100).toFixed(1) : 0}% capable`);
  console.log(`  📊 Analytics & Reporting: ${analyticsTests ? ((analyticsTests.successful / analyticsTests.total) * 100).toFixed(1) : 0}% capable`);
  console.log(`  ⚙️  Settings Management: ${settingsTests ? ((settingsTests.successful / settingsTests.total) * 100).toFixed(1) : 0}% capable`);
  console.log(`  🔄 Complex Operations: ${complexTests ? ((complexTests.successful / complexTests.total) * 100).toFixed(1) : 0}% capable`);
  
  const overallCapability = (results.successfulTests / results.totalTests) * 100;
  console.log(`\n🏆 OVERALL AI CAPABILITY: ${overallCapability.toFixed(1)}%`);
  
  if (overallCapability >= 90) {
    console.log('🌟 EXCELLENT: AI can handle comprehensive store management!');
  } else if (overallCapability >= 75) {
    console.log('✅ GOOD: AI can handle most store operations effectively.');
  } else if (overallCapability >= 50) {
    console.log('⚠️  MODERATE: AI has basic capabilities but needs improvement.');
  } else {
    console.log('❌ POOR: AI needs significant improvements for store management.');
  }
  
  console.log('\n============================================================');
}

// Run the comprehensive tests
if (require.main === module) {
  runComprehensiveTests()
    .then(results => {
      generateTestReport(results);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveTests, generateTestReport };

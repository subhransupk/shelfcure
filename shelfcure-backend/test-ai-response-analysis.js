/**
 * AI RESPONSE ANALYSIS
 * 
 * This script analyzes what the AI is actually returning
 * and why actions are not being executed properly.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const geminiAIService = require('./services/geminiAIService');

/**
 * Test AI response parsing
 */
async function testAIResponseParsing() {
  console.log('🔍 AI RESPONSE PARSING ANALYSIS');
  console.log('================================\n');
  
  try {
    // Mock context
    const mockContext = {
      store: { 
        _id: 'test123', 
        name: 'Test Store',
        settings: { gst: { rate: 18 } }
      },
      user: { 
        _id: 'user123', 
        name: 'Test User', 
        role: 'store_manager' 
      },
      conversationId: 'test'
    };
    
    // Test commands
    const testCommands = [
      "Add medicine 'Paracetamol 500mg' with manufacturer 'ABC Pharma' in category 'Tablet'",
      "Add customer 'John Doe' with phone '9876543210'",
      "Show me today's sales",
      "Create a sale for John Doe",
      "Add supplier 'MediCorp' with phone '9876543211'"
    ];
    
    for (const command of testCommands) {
      console.log(`\n🧪 Testing Command: "${command}"`);
      console.log('='.repeat(50));
      
      try {
        const response = await geminiAIService.processStoreQuery(command, mockContext);
        
        console.log('📋 Response Analysis:');
        console.log(`  Success: ${response.success}`);
        console.log(`  Action Executed: ${response.actionExecuted}`);
        console.log(`  Intent: ${response.intent}`);
        console.log(`  Confidence: ${response.confidence}`);
        console.log(`  Response Length: ${response.response?.length || 0} chars`);
        
        // Show first 200 characters of response
        if (response.response) {
          console.log(`  Response Preview: "${response.response.substring(0, 200)}..."`);
        }
        
        if (response.suggestions && response.suggestions.length > 0) {
          console.log(`  Suggestions: ${response.suggestions.slice(0, 3).join(', ')}`);
        }
        
        if (response.actionResult) {
          console.log(`  Action Result Type: ${typeof response.actionResult}`);
          console.log(`  Action Result: ${JSON.stringify(response.actionResult, null, 2).substring(0, 200)}...`);
        }
        
      } catch (error) {
        console.error(`❌ Error testing command: ${error.message}`);
      }
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

/**
 * Test action handler detection
 */
async function testActionHandlerDetection() {
  console.log('\n🎯 ACTION HANDLER DETECTION TEST');
  console.log('=================================\n');
  
  const mockContext = {
    store: { _id: 'test123', name: 'Test Store' },
    user: { _id: 'user123', name: 'Test User', role: 'store_manager' },
    conversationId: 'test'
  };
  
  // Test different message patterns
  const testMessages = [
    { message: "add medicine paracetamol", expected: "inventory" },
    { message: "create customer john doe", expected: "customer" },
    { message: "add customer with phone", expected: "customer" },
    { message: "medicine add new", expected: "inventory" },
    { message: "show sales today", expected: "analytics" },
    { message: "create sale for customer", expected: "sales" }
  ];
  
  for (const test of testMessages) {
    console.log(`Testing: "${test.message}"`);
    
    // Test message detection
    const lowerMessage = test.message.toLowerCase();
    
    // Check inventory detection
    const inventoryMatch = lowerMessage.includes('medicine') && 
                          (lowerMessage.includes('add') || lowerMessage.includes('create'));
    
    // Check customer detection  
    const customerMatch = lowerMessage.includes('customer') && 
                         (lowerMessage.includes('add') || lowerMessage.includes('create'));
    
    console.log(`  Inventory match: ${inventoryMatch}`);
    console.log(`  Customer match: ${customerMatch}`);
    
    // Test actual handler
    try {
      const parsedResponse = { message: test.message };
      
      const inventoryResult = await geminiAIService.handleInventoryActions(
        lowerMessage, parsedResponse, mockContext
      );
      
      const customerResult = await geminiAIService.handleCustomerActions(
        lowerMessage, parsedResponse, mockContext
      );
      
      console.log(`  Inventory handler result: ${inventoryResult ? 'TRIGGERED' : 'NOT TRIGGERED'}`);
      console.log(`  Customer handler result: ${customerResult ? 'TRIGGERED' : 'NOT TRIGGERED'}`);
      
    } catch (error) {
      console.log(`  Handler test error: ${error.message}`);
    }
    
    console.log('');
  }
}

/**
 * Test data extraction methods
 */
async function testDataExtraction() {
  console.log('\n📊 DATA EXTRACTION TEST');
  console.log('========================\n');
  
  const testMessages = [
    {
      type: 'medicine',
      message: "Add medicine 'Paracetamol 500mg' with manufacturer 'ABC Pharma' in category 'Tablet' and composition 'Paracetamol 500mg'",
      extractor: 'extractMedicineData'
    },
    {
      type: 'customer',
      message: "Add customer 'John Doe' with phone '9876543210' and email 'john@example.com'",
      extractor: 'extractCustomerData'
    },
    {
      type: 'supplier',
      message: "Add supplier 'MediCorp Distributors' with contact person 'Mr. Smith' and phone '9876543211'",
      extractor: 'extractSupplierData'
    }
  ];
  
  for (const test of testMessages) {
    console.log(`Testing ${test.type} extraction:`);
    console.log(`Message: "${test.message}"`);
    
    try {
      const extractedData = geminiAIService[test.extractor](test.message);
      
      if (extractedData) {
        console.log('✅ Data extracted successfully:');
        console.log(JSON.stringify(extractedData, null, 2));
      } else {
        console.log('❌ No data extracted');
      }
      
    } catch (error) {
      console.log(`❌ Extraction error: ${error.message}`);
    }
    
    console.log('');
  }
}

/**
 * Test Medicine schema validation
 */
async function testMedicineValidation() {
  console.log('\n🧪 MEDICINE SCHEMA VALIDATION TEST');
  console.log('===================================\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected');
    
    const Medicine = require('./models/Medicine');
    
    // Test valid medicine data
    const validMedicineData = {
      store: new mongoose.Types.ObjectId(),
      name: 'Test Medicine',
      composition: 'Test Composition',
      manufacturer: 'Test Pharma',
      category: 'Tablet', // Valid enum value
      unitTypes: {
        hasStrips: true,
        hasIndividual: true,
        unitsPerStrip: 10
      },
      stripInfo: {
        purchasePrice: 10,
        sellingPrice: 12,
        mrp: 15,
        stock: 100,
        minStock: 5,
        reorderLevel: 10
      },
      individualInfo: {
        purchasePrice: 1,
        sellingPrice: 1.2,
        mrp: 1.5,
        stock: 1000,
        minStock: 50,
        reorderLevel: 100
      }
    };
    
    console.log('Testing valid medicine data...');
    const testMedicine = new Medicine(validMedicineData);
    
    try {
      await testMedicine.validate();
      console.log('✅ Medicine validation passed');
      
      // Clean up
      if (testMedicine._id) {
        await Medicine.findByIdAndDelete(testMedicine._id);
      }
      
    } catch (validationError) {
      console.log('❌ Medicine validation failed:');
      console.log(validationError.message);
    }
    
  } catch (error) {
    console.error('Database connection error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  await testAIResponseParsing();
  await testActionHandlerDetection();
  await testDataExtraction();
  await testMedicineValidation();
}

if (require.main === module) {
  runAllTests();
}

module.exports = {
  testAIResponseParsing,
  testActionHandlerDetection,
  testDataExtraction,
  testMedicineValidation
};

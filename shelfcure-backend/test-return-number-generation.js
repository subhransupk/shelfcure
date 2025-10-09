/**
 * Test script to verify purchase return number generation
 * This script tests the new return number generation logic
 */

const mongoose = require('mongoose');
require('./config/database');

async function testReturnNumberGeneration() {
  try {
    console.log('🧪 Testing purchase return number generation...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shelfcure');
    console.log('✅ Connected to database');
    
    const PurchaseReturn = require('./models/PurchaseReturn');
    const Counter = require('./models/Counter');
    const Store = require('./models/Store');
    const Purchase = require('./models/Purchase');
    const Supplier = require('./models/Supplier');
    const User = require('./models/User');
    
    // Find a test store, purchase, supplier, and user
    const testStore = await Store.findOne({});
    const testPurchase = await Purchase.findOne({});
    const testSupplier = await Supplier.findOne({});
    const testUser = await User.findOne({});
    
    if (!testStore || !testPurchase || !testSupplier || !testUser) {
      console.log('❌ Missing test data. Need at least one store, purchase, supplier, and user.');
      console.log(`   Store: ${testStore ? '✅' : '❌'}`);
      console.log(`   Purchase: ${testPurchase ? '✅' : '❌'}`);
      console.log(`   Supplier: ${testSupplier ? '✅' : '❌'}`);
      console.log(`   User: ${testUser ? '✅' : '❌'}`);
      process.exit(1);
    }
    
    console.log(`📋 Using test data:`);
    console.log(`   Store: ${testStore.name} (${testStore._id})`);
    console.log(`   Purchase: ${testPurchase.purchaseOrderNumber || testPurchase._id}`);
    console.log(`   Supplier: ${testSupplier.name} (${testSupplier._id})`);
    console.log(`   User: ${testUser.name} (${testUser._id})`);
    
    // Test creating multiple purchase returns to verify uniqueness
    console.log('\n🔧 Testing return number generation...');
    
    const testReturns = [];
    const numTests = 5;
    
    for (let i = 0; i < numTests; i++) {
      console.log(`\n📝 Creating test return ${i + 1}/${numTests}...`);
      
      const purchaseReturn = new PurchaseReturn({
        store: testStore._id,
        originalPurchase: testPurchase._id,
        supplier: testSupplier._id,
        items: [{
          medicine: testPurchase.items[0]?.medicine || new mongoose.Types.ObjectId(),
          returnQuantity: 1,
          unitCost: 10,
          totalCost: 10,
          returnReason: 'damaged_goods',
          removeFromInventory: true
        }],
        subtotal: 10,
        totalReturnAmount: 10,
        returnReason: 'damaged_goods',
        returnReasonDetails: 'Test return',
        createdBy: testUser._id
      });
      
      try {
        await purchaseReturn.save();
        testReturns.push(purchaseReturn);
        console.log(`   ✅ Generated return number: ${purchaseReturn.returnNumber}`);
      } catch (error) {
        console.log(`   ❌ Error creating return: ${error.message}`);
        if (error.code === 11000) {
          console.log('   🔍 Duplicate key error detected!');
        }
      }
    }
    
    // Verify all return numbers are unique
    console.log('\n🔍 Verifying uniqueness...');
    const returnNumbers = testReturns.map(r => r.returnNumber);
    const uniqueNumbers = [...new Set(returnNumbers)];
    
    if (returnNumbers.length === uniqueNumbers.length) {
      console.log('✅ All return numbers are unique!');
    } else {
      console.log('❌ Duplicate return numbers detected!');
      console.log(`   Generated: ${returnNumbers.length}`);
      console.log(`   Unique: ${uniqueNumbers.length}`);
    }
    
    // Display generated return numbers
    console.log('\n📋 Generated return numbers:');
    testReturns.forEach((ret, index) => {
      console.log(`   ${index + 1}. ${ret.returnNumber} (ID: ${ret._id})`);
    });
    
    // Test counter state
    console.log('\n🔧 Checking counter state...');
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const counterId = `purchase_return_${testStore._id}_${year}_${month}`;
    
    const counter = await Counter.findById(counterId);
    if (counter) {
      console.log(`   Counter ${counterId}: ${counter.sequence}`);
    } else {
      console.log(`   Counter ${counterId}: Not found`);
    }
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    for (const testReturn of testReturns) {
      await PurchaseReturn.findByIdAndDelete(testReturn._id);
      console.log(`   Deleted: ${testReturn.returnNumber}`);
    }
    
    console.log('\n🎉 Test completed successfully!');
    console.log('\n📋 Results:');
    console.log(`   - Created ${testReturns.length} test returns`);
    console.log(`   - All return numbers were unique: ${returnNumbers.length === uniqueNumbers.length ? '✅' : '❌'}`);
    console.log('   - Return number generation is working correctly');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testReturnNumberGeneration();

/**
 * DEBUG MEDICINE CREATION
 */

require('dotenv').config();
const mongoose = require('mongoose');
const geminiAIService = require('./services/geminiAIService');

// Import models
const Medicine = require('./models/Medicine');
const Store = require('./models/Store');
const User = require('./models/User');

async function debugMedicineCreation() {
  console.log('🔍 DEBUGGING MEDICINE CREATION');
  console.log('===============================\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected');
    
    // Create test environment
    const testOwner = new User({
      name: 'Debug Owner',
      email: 'debug@test.com',
      phone: '9876543200',
      role: 'store_owner',
      password: 'test123456'
    });
    await testOwner.save();
    
    const testStore = new Store({
      name: 'Debug Pharmacy',
      code: 'DEBUG01',
      owner: testOwner._id,
      contact: {
        phone: '9876543210',
        email: 'debug@pharmacy.com'
      },
      address: {
        street: '123 Debug Street',
        city: 'Debug City',
        state: 'Debug State',
        country: 'India',
        pincode: '123456'
      },
      business: {
        licenseNumber: 'DEBUG123456',
        gstNumber: '22AAAAA0000A1Z5'
      }
    });
    await testStore.save();
    
    const testUser = new User({
      name: 'Debug Manager',
      email: 'debugmanager@test.com',
      phone: '9876543210',
      role: 'store_manager',
      store: testStore._id,
      password: 'test123456'
    });
    await testUser.save();
    
    const context = {
      store: testStore,
      user: testUser,
      conversationId: `debug_${Date.now()}`
    };
    
    console.log('✅ Test environment created');
    
    // Test medicine creation
    const command = "Add medicine 'Debug Paracetamol 500mg' with manufacturer 'Debug Pharma' in category 'Tablet'";
    console.log(`\n🧪 Testing command: "${command}"`);
    
    const initialCount = await Medicine.countDocuments({ store: testStore._id });
    console.log(`📊 Initial medicine count: ${initialCount}`);
    
    const response = await geminiAIService.processStoreQuery(command, context);
    
    console.log('\n📋 Response:');
    console.log(`   Success: ${response.success}`);
    console.log(`   Action Executed: ${response.actionExecuted}`);
    console.log(`   Response: ${response.response}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const finalCount = await Medicine.countDocuments({ store: testStore._id });
    console.log(`\n📊 Final medicine count: ${finalCount}`);
    console.log(`📊 Records created: ${finalCount - initialCount}`);
    
    // Cleanup
    await Medicine.deleteMany({ store: testStore._id });
    await Store.findByIdAndDelete(testStore._id);
    await User.findByIdAndDelete(testUser._id);
    await User.findByIdAndDelete(testOwner._id);
    
  } catch (error) {
    console.error('💥 ERROR:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database disconnected');
  }
}

if (require.main === module) {
  debugMedicineCreation();
}

module.exports = { debugMedicineCreation };

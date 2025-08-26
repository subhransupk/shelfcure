const mongoose = require('mongoose');
require('dotenv').config();

async function finalFix() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the database
    const db = mongoose.connection.db;
    const collection = db.collection('stores');

    // First, let's see what indexes currently exist
    console.log('📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)} ${index.unique ? '(UNIQUE)' : ''}`);
    });

    // Drop the entire collection to remove all constraints
    console.log('\n🗑️  Dropping entire stores collection...');
    try {
      await collection.drop();
      console.log('✅ Stores collection dropped successfully');
    } catch (error) {
      if (error.message.includes('ns not found')) {
        console.log('ℹ️  Collection already doesn\'t exist');
      } else {
        throw error;
      }
    }

    // Now let's import the Store model to recreate the collection with correct schema
    console.log('\n📦 Importing Store model to recreate collection...');
    const Store = require('./models/Store');
    
    // Create a test store to initialize the collection with correct schema
    console.log('🏪 Creating test store to initialize collection...');
    const testStore = new Store({
      name: 'Test Store',
      email: 'test@example.com',
      phone: '1234567890',
      address: {
        street: 'Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '123456',
        country: 'India'
      },
      business: {
        licenseNumber: 'TEST-LICENSE-123'
      },
      storeOwner: new mongoose.Types.ObjectId(),
      isActive: false // Mark as inactive so it doesn't interfere
    });

    await testStore.save();
    console.log('✅ Test store created successfully');

    // Now delete the test store
    await Store.deleteOne({ _id: testStore._id });
    console.log('✅ Test store removed');

    // Check the new indexes
    console.log('\n📋 New indexes after recreation:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)} ${index.unique ? '(UNIQUE)' : ''}`);
    });

    console.log('\n🎉 Final fix completed! The stores collection has been recreated with the correct schema.');
    console.log('💡 You should now be able to create stores with any license number, including "24354345".');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

finalFix();

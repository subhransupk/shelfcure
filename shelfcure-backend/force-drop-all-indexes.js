const mongoose = require('mongoose');
require('dotenv').config();

async function forceDropAllIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the stores collection
    const db = mongoose.connection.db;
    const collection = db.collection('stores');

    // List all indexes
    console.log('📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)} ${index.unique ? '(UNIQUE)' : ''}`);
    });

    // Drop ALL indexes except _id (which can't be dropped)
    console.log('\n🗑️  Dropping all indexes except _id...');
    for (const index of indexes) {
      if (index.name !== '_id_') {
        try {
          await collection.dropIndex(index.name);
          console.log(`✅ Dropped index: ${index.name}`);
        } catch (error) {
          console.log(`❌ Failed to drop index ${index.name}: ${error.message}`);
        }
      }
    }

    // List indexes after dropping
    console.log('\n📋 Indexes after dropping:');
    const indexesAfter = await collection.indexes();
    indexesAfter.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)} ${index.unique ? '(UNIQUE)' : ''}`);
    });

    // Also check if there are any stores with the problematic license number
    console.log('\n🔍 Checking for stores with license number "24354345"...');
    const problematicStores = await collection.find({ 'business.licenseNumber': '24354345' }).toArray();
    console.log(`Found ${problematicStores.length} stores with this license number:`);
    problematicStores.forEach(store => {
      console.log(`  - ${store.name} (${store.code}) - Active: ${store.isActive}`);
    });

    if (problematicStores.length > 0) {
      console.log('\n🗑️  Removing all stores with license number "24354345"...');
      const deleteResult = await collection.deleteMany({ 'business.licenseNumber': '24354345' });
      console.log(`✅ Deleted ${deleteResult.deletedCount} stores`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

forceDropAllIndexes();

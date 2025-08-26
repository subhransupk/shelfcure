const mongoose = require('mongoose');
require('dotenv').config();

async function dropLicenseIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the stores collection
    const db = mongoose.connection.db;
    const collection = db.collection('stores');

    // List existing indexes
    console.log('📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Drop the unique index on business.licenseNumber
    try {
      await collection.dropIndex('business.licenseNumber_1');
      console.log('✅ Successfully dropped business.licenseNumber_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  Index business.licenseNumber_1 does not exist (already dropped)');
      } else {
        console.log('❌ Error dropping index:', error.message);
      }
    }

    // List indexes after dropping
    console.log('📋 Indexes after dropping:');
    const indexesAfter = await collection.indexes();
    indexesAfter.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

dropLicenseIndex();

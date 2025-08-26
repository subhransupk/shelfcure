const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Store = require('./models/Store');

async function cleanDuplicateLicense() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find stores with the problematic license number
    const licenseNumber = '24354345';
    const stores = await Store.find({ 'business.licenseNumber': licenseNumber });
    
    console.log(`📋 Found ${stores.length} stores with license number "${licenseNumber}":`);
    stores.forEach((store, index) => {
      console.log(`  ${index + 1}. ${store.name} (${store.code}) - Active: ${store.isActive} - Created: ${store.createdAt}`);
    });

    if (stores.length > 0) {
      // Remove all stores with this license number (both active and inactive)
      const result = await Store.deleteMany({ 'business.licenseNumber': licenseNumber });
      console.log(`✅ Removed ${result.deletedCount} stores with license number "${licenseNumber}"`);
    } else {
      console.log('ℹ️  No stores found with this license number');
    }

    // Also check if there are any other duplicate license numbers
    console.log('\n📊 Checking for other duplicate license numbers...');
    const duplicates = await Store.aggregate([
      {
        $group: {
          _id: '$business.licenseNumber',
          count: { $sum: 1 },
          stores: { $push: { name: '$name', code: '$code', isActive: '$isActive' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (duplicates.length > 0) {
      console.log('⚠️  Found other duplicate license numbers:');
      duplicates.forEach(dup => {
        console.log(`  License: ${dup._id} (${dup.count} stores)`);
        dup.stores.forEach(store => {
          console.log(`    - ${store.name} (${store.code}) - Active: ${store.isActive}`);
        });
      });
    } else {
      console.log('✅ No other duplicate license numbers found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

cleanDuplicateLicense();

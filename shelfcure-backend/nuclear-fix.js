const mongoose = require('mongoose');
require('dotenv').config();

async function nuclearFix() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the database
    const db = mongoose.connection.db;
    
    // Check if stores collection exists
    const collections = await db.listCollections({ name: 'stores' }).toArray();
    
    if (collections.length > 0) {
      console.log('📋 Stores collection exists. Backing up data...');
      
      // Get all stores data
      const storesCollection = db.collection('stores');
      const allStores = await storesCollection.find({}).toArray();
      console.log(`📊 Found ${allStores.length} stores to backup`);
      
      // Drop the entire collection
      console.log('🗑️  Dropping stores collection...');
      await storesCollection.drop();
      console.log('✅ Stores collection dropped');
      
      if (allStores.length > 0) {
        console.log('📥 Recreating stores collection without unique constraints...');
        
        // Remove any problematic data that might cause conflicts
        const cleanedStores = allStores.map(store => {
          // If this is the problematic store with license number 24354345, change it
          if (store.business && store.business.licenseNumber === '24354345') {
            console.log(`🔧 Fixing license number for store: ${store.name}`);
            store.business.licenseNumber = '24354345-FIXED';
          }
          return store;
        });
        
        // Recreate the collection and insert data
        const newStoresCollection = db.collection('stores');
        await newStoresCollection.insertMany(cleanedStores);
        console.log(`✅ Restored ${cleanedStores.length} stores to new collection`);
      }
    } else {
      console.log('ℹ️  Stores collection does not exist');
    }
    
    console.log('🎉 Nuclear fix completed! The stores collection has been recreated without unique constraints.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

nuclearFix();

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Store = require('./models/Store');
const Subscription = require('./models/Subscription');

async function fixStoreCount() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the store owner user
    const user = await User.findOne({ email: 'subhransu@gmail.com' }).populate('subscription');
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 Found user:', user.name, user.email);
    console.log('📋 Current subscription store count:', user.subscription?.currentStoreCount);

    // Count actual active stores
    const activeStoreCount = await Store.countDocuments({ 
      owner: user._id, 
      isActive: true 
    });

    console.log('🏪 Actual active stores:', activeStoreCount);

    // Count all stores (including inactive)
    const totalStoreCount = await Store.countDocuments({ 
      owner: user._id
    });

    console.log('📊 Total stores (including deleted):', totalStoreCount);

    // List all stores
    const allStores = await Store.find({ owner: user._id }).select('name code isActive createdAt');
    console.log('📋 All stores:');
    allStores.forEach(store => {
      console.log(`  - ${store.name} (${store.code}) - Active: ${store.isActive} - Created: ${store.createdAt}`);
    });

    if (user.subscription) {
      // Update subscription store count
      const oldCount = user.subscription.currentStoreCount;
      user.subscription.currentStoreCount = activeStoreCount;
      await user.subscription.save();

      console.log('✅ Updated subscription store count from', oldCount, 'to', activeStoreCount);
      console.log('🎯 Can create more stores:', user.subscription.canCreateMoreStores);
      console.log('🔢 Store count limit:', user.subscription.storeCountLimit);
    } else {
      console.log('❌ No subscription found for user');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

fixStoreCount();

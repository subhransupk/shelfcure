const mongoose = require('mongoose');
require('dotenv').config();

async function debugSubscriptions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const Subscription = require('./models/Subscription');
    const User = require('./models/User'); // Need this for populate to work
    
    // Test the exact query used in the admin endpoint
    const subscriptionQuery = { storeOwner: { $ne: null } };
    console.log('Query:', subscriptionQuery);
    
    const subscriptions = await Subscription.find(subscriptionQuery)
      .populate('storeOwner', 'name email phone createdAt')
      .sort({ endDate: 1 });
    
    console.log('Total subscriptions found:', subscriptions.length);
    
    subscriptions.forEach((sub, index) => {
      console.log(`Subscription ${index + 1}:`);
      console.log('  ID:', sub._id);
      console.log('  StoreOwner populated:', sub.storeOwner ? 'YES' : 'NO');
      if (sub.storeOwner) {
        console.log('  Owner name:', sub.storeOwner.name);
        console.log('  Owner email:', sub.storeOwner.email);
      }
      console.log('  Plan:', sub.plan);
      console.log('  Status:', sub.status);
      console.log('---');
    });
    
    // Also test without the filter and without populate to see raw storeOwner values
    console.log('\n=== ALL SUBSCRIPTIONS (no filter, no populate) ===');
    const allSubsRaw = await Subscription.find({}).sort({ endDate: 1 });

    console.log('Total all subscriptions (raw):', allSubsRaw.length);

    allSubsRaw.forEach((sub, index) => {
      console.log(`Raw Sub ${index + 1}:`);
      console.log('  ID:', sub._id);
      console.log('  StoreOwner raw value:', sub.storeOwner);
      console.log('  StoreOwner type:', typeof sub.storeOwner);
      console.log('  Plan:', sub.plan);
      console.log('  Status:', sub.status);
      console.log('  Created:', sub.createdAt);
      console.log('---');
    });

    // Now test with populate
    console.log('\n=== ALL SUBSCRIPTIONS (with populate) ===');
    const allSubs = await Subscription.find({})
      .populate('storeOwner', 'name email phone createdAt')
      .sort({ endDate: 1 });

    console.log('Total all subscriptions (populated):', allSubs.length);

    allSubs.forEach((sub, index) => {
      console.log(`Pop Sub ${index + 1}:`);
      console.log('  ID:', sub._id);
      console.log('  StoreOwner populated:', sub.storeOwner ? 'YES' : 'NO');
      if (sub.storeOwner) {
        console.log('  Owner name:', sub.storeOwner.name);
        console.log('  Owner email:', sub.storeOwner.email);
      }
      console.log('  Plan:', sub.plan);
      console.log('  Status:', sub.status);
      console.log('---');
    });
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

debugSubscriptions();

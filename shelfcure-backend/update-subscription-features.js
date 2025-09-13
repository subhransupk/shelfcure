const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Subscription = require('./models/Subscription');

async function updateSubscriptionFeatures() {
  try {
    console.log('🔄 Updating subscription features...');
    
    // Find all subscriptions
    const subscriptions = await Subscription.find({});
    console.log(`📊 Found ${subscriptions.length} subscriptions to update`);
    
    for (const subscription of subscriptions) {
      console.log(`\n🔧 Updating subscription ${subscription._id} (Plan: ${subscription.plan})`);
      
      // Get the plan features
      const planFeatures = Subscription.getPlanFeatures(subscription.plan);
      
      // Update the subscription with new features
      subscription.features = {
        ...subscription.features,
        ...planFeatures.features
      };
      
      await subscription.save();
      console.log(`✅ Updated subscription ${subscription._id}`);
      console.log(`   Features: ${Object.keys(subscription.features).join(', ')}`);
    }
    
    console.log('\n🎉 All subscriptions updated successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error updating subscriptions:', error);
    process.exit(1);
  }
}

updateSubscriptionFeatures();

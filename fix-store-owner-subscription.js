require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const SubscriptionPlan = require('./models/SubscriptionPlan');

async function fixStoreOwnerSubscription() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the store owner
    const storeOwner = await User.findById('68ec9f46a1597adc370d9169');
    if (!storeOwner) {
      console.log('❌ Store owner not found');
      return;
    }

    console.log('Found store owner:', storeOwner.name, storeOwner.email);

    // Find or create a subscription plan
    let subscriptionPlan = await SubscriptionPlan.findOne({ name: 'Premium' });
    if (!subscriptionPlan) {
      console.log('Creating Premium subscription plan...');
      subscriptionPlan = await SubscriptionPlan.create({
        name: 'Premium',
        price: 2999,
        duration: 365, // days
        features: {
          maxStores: 5,
          maxUsers: 50,
          maxProducts: 10000,
          analytics: true,
          whatsappIntegration: true,
          billOCR: true,
          customReports: true,
          multiStore: true
        },
        isActive: true
      });
      console.log('✅ Premium plan created');
    }

    // Create subscription for store owner
    const subscription = {
      plan: subscriptionPlan._id,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      maxUsers: 50,
      maxProducts: 10000,
      features: {
        multiStore: true,
        analytics: true,
        whatsappIntegration: true,
        billOCR: true,
        customReports: true
      }
    };

    // Update store owner with subscription
    storeOwner.subscription = subscription;
    await storeOwner.save();

    console.log('✅ Store owner subscription updated successfully!');
    console.log('Subscription details:', {
      plan: subscriptionPlan.name,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixStoreOwnerSubscription();

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const SubscriptionPlan = require('./models/SubscriptionPlan');
const Subscription = require('./models/Subscription');

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
        description: 'Premium plan with advanced features for growing pharmacies',
        planType: 'premium',
        pricing: {
          monthly: 2999,
          yearly: 29990,
          currency: 'INR',
          discountPercentage: 17
        },
        limits: {
          maxUsers: 50,
          maxProducts: 10000,
          maxStores: 5,
          maxTransactionsPerMonth: -1,
          storageLimit: 50
        },
        features: {
          multiStore: true,
          analytics: true,
          advancedAnalytics: true,
          whatsappIntegration: true,
          billOCR: true,
          customReports: true,
          apiAccess: true,
          prioritySupport: true,
          customBranding: false
        },
        isActive: true
      });
      console.log('✅ Premium plan created');
    }

    // Create subscription document for store owner
    const subscription = await Subscription.create({
      storeOwner: storeOwner._id,
      plan: 'premium',
      status: 'active',
      billingDuration: 'yearly',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      storeCountLimit: 5,
      currentStoreCount: 1,
      features: {
        multiStore: true,
        analytics: true,
        whatsappIntegration: true,
        billOCR: true,
        customReports: true,
        inventoryManagement: true,
        customerManagement: true,
        staffManagement: true,
        purchaseManagement: true,
        salesManagement: true,
        doctorManagement: true
      },
      limits: {
        maxUsers: 50,
        maxProducts: 10000,
        maxTransactions: -1,
        maxStorage: 50
      },
      pricing: {
        amount: 29990,
        currency: 'INR',
        taxAmount: 5398,
        discountAmount: 0,
        totalAmount: 35388
      },
      paymentStatus: 'paid',
      autoRenewal: true
    });

    // Update store owner with subscription reference
    storeOwner.subscription = subscription._id;
    await storeOwner.save();

    console.log('✅ Store owner subscription created successfully!');
    console.log('Subscription details:', {
      id: subscription._id,
      plan: subscription.plan,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      storeCountLimit: subscription.storeCountLimit
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixStoreOwnerSubscription();

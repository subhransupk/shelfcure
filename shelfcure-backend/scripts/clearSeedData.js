require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Store = require('../models/Store');
const Medicine = require('../models/Medicine');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Affiliate = require('../models/Affiliate');
const Invoice = require('../models/Invoice');
const Discount = require('../models/Discount');

const clearSeedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Removing all seed data...');
    
    // Clear all collections
    await User.deleteMany({});
    await Store.deleteMany({});
    await Medicine.deleteMany({});
    await SubscriptionPlan.deleteMany({});
    await Affiliate.deleteMany({});
    await Invoice.deleteMany({});
    await Discount.deleteMany({});

    console.log('✅ All seed data removed successfully!');
    console.log('Your database is now clean and ready for your own data.');

  } catch (error) {
    console.error('❌ Error clearing seed data:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

clearSeedData();

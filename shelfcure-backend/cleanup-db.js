const mongoose = require('mongoose');
require('dotenv').config();

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Subscription = require('./models/Subscription');
    const User = require('./models/User');

    console.log('Cleaning up database...');

    // Delete all subscriptions
    const subResult = await Subscription.deleteMany({});
    console.log('Deleted subscriptions:', subResult.deletedCount);

    // Delete all non-superadmin users
    const userResult = await User.deleteMany({ role: { $ne: 'superadmin' } });
    console.log('Deleted non-admin users:', userResult.deletedCount);

    console.log('Database cleaned successfully');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanup();

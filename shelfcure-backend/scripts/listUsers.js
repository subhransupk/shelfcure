const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Store = require('../models/Store');

const listUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({})
      .populate('currentStore', 'name code')
      .select('name email phone role isActive currentStore createdAt')
      .sort({ createdAt: -1 });

    console.log('\n=== All Users in Database ===');
    console.log(`Total users: ${users.length}\n`);

    if (users.length === 0) {
      console.log('No users found in database.');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Phone: ${user.phone}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Store: ${user.currentStore ? user.currentStore.name : 'None'}`);
        console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
        console.log('   ---');
      });
    }

    // Get all stores
    const stores = await Store.find({})
      .populate('owner', 'name email')
      .populate('staff.user', 'name email role')
      .select('name code owner staff isActive createdAt')
      .sort({ createdAt: -1 });

    console.log('\n=== All Stores in Database ===');
    console.log(`Total stores: ${stores.length}\n`);

    if (stores.length === 0) {
      console.log('No stores found in database.');
    } else {
      stores.forEach((store, index) => {
        console.log(`${index + 1}. ${store.name} (${store.code})`);
        console.log(`   Owner: ${store.owner ? store.owner.name : 'None'}`);
        console.log(`   Active: ${store.isActive}`);
        console.log(`   Staff Count: ${store.staff ? store.staff.length : 0}`);
        
        if (store.staff && store.staff.length > 0) {
          console.log('   Staff:');
          store.staff.forEach((staff, staffIndex) => {
            if (staff.user) {
              console.log(`     ${staffIndex + 1}. ${staff.user.name} (${staff.role}) - ${staff.isActive ? 'Active' : 'Inactive'}`);
            }
          });
        }
        
        console.log(`   Created: ${store.createdAt.toLocaleDateString()}`);
        console.log('   ---');
      });
    }

    // Filter store managers specifically
    const storeManagers = users.filter(user => user.role === 'store_manager');
    
    console.log('\n=== Store Managers ===');
    console.log(`Total store managers: ${storeManagers.length}\n`);

    if (storeManagers.length === 0) {
      console.log('No store managers found.');
      console.log('\nTo create a test store manager, run:');
      console.log('node scripts/createStoreManager.js');
    } else {
      storeManagers.forEach((manager, index) => {
        console.log(`${index + 1}. ${manager.name}`);
        console.log(`   Email: ${manager.email}`);
        console.log(`   Phone: ${manager.phone}`);
        console.log(`   Active: ${manager.isActive}`);
        console.log(`   Store: ${manager.currentStore ? manager.currentStore.name : 'None'}`);
        console.log('   ---');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error listing users:', error);
    process.exit(1);
  }
};

// Run the script
listUsers();

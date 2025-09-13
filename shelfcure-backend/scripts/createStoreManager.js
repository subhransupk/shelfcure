const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Store = require('../models/Store');

const createStoreManager = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if store manager already exists
    const existingManager = await User.findOne({ 
      email: 'manager@test.com',
      role: 'store_manager' 
    });

    if (existingManager) {
      console.log('Store manager already exists:', existingManager.email);
      process.exit(0);
    }

    // Find the first store to assign the manager to
    const store = await Store.findOne({ isActive: true });
    
    if (!store) {
      console.log('No active store found. Please create a store first.');
      process.exit(1);
    }

    console.log('Found store:', store.name, '(ID:', store._id, ')');

    // Create store manager user
    const storeManager = await User.create({
      name: 'Test Store Manager',
      email: 'manager@test.com',
      phone: '+1234567890',
      password: 'password123', // This will be hashed automatically
      role: 'store_manager',
      isActive: true,
      emailVerified: true,
      currentStore: store._id
    });

    console.log('Store manager created:', storeManager.email);

    // Add the store manager to the store's staff array
    await Store.findByIdAndUpdate(store._id, {
      $push: {
        staff: {
          user: storeManager._id,
          role: 'store_manager',
          permissions: {
            inventory: { view: true, add: true, edit: true, delete: true },
            sales: { view: true, create: true, refund: true },
            customers: { view: true, add: true, edit: true },
            reports: { view: true, export: true },
            settings: { view: true, edit: false }
          },
          isActive: true,
          joinedAt: new Date()
        }
      }
    });

    console.log('Store manager added to store staff');

    console.log('\n=== Store Manager Created Successfully ===');
    console.log('Email: manager@test.com');
    console.log('Password: password123');
    console.log('Role: store_manager');
    console.log('Assigned Store:', store.name);
    console.log('Store ID:', store._id);
    console.log('\nYou can now login with these credentials!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating store manager:', error);
    process.exit(1);
  }
};

// Run the script
createStoreManager();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Store = require('../models/Store');

const fixStoreManager = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Connected to MongoDB');

    // Find the new store manager
    const email = 'mota@gmail.com';
    const newPassword = 'password123';

    const storeManager = await User.findOne({ 
      email: email,
      role: 'store_manager' 
    });

    if (!storeManager) {
      console.log('Store manager not found with email:', email);
      process.exit(1);
    }

    console.log('Found store manager:', storeManager.name);
    console.log('Current status:', {
      isActive: storeManager.isActive,
      isLocked: storeManager.isLocked,
      loginAttempts: storeManager.loginAttempts
    });

    // Hash the new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user
    await User.findByIdAndUpdate(storeManager._id, {
      password: hashedPassword,
      isActive: true,
      loginAttempts: 0,
      lockUntil: undefined,
      emailVerified: true
    });

    console.log('\n=== Store Manager Fixed ===');
    console.log('Name:', storeManager.name);
    console.log('Email:', email);
    console.log('Password:', newPassword);
    console.log('Status: Active');
    console.log('Role: store_manager');

    // Check if assigned to store
    const store = await Store.findOne({
      'staff.user': storeManager._id,
      'staff.role': 'store_manager',
      isActive: true
    });

    if (store) {
      console.log('Assigned Store:', store.name, '(' + store.code + ')');
    } else {
      console.log('⚠️  Warning: Store manager not assigned to any store');
    }

    console.log('\n✅ You can now login with these credentials!');

    process.exit(0);
  } catch (error) {
    console.error('Error fixing store manager:', error);
    process.exit(1);
  }
};

// Run the script
fixStoreManager();

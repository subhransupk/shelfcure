const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');

const resetStoreManagerPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find the store manager
    const storeManager = await User.findOne({ 
      email: 'pinku@gmail.com',
      role: 'store_manager' 
    });

    if (!storeManager) {
      console.log('Store manager not found with email: pinku@gmail.com');
      process.exit(1);
    }

    console.log('Found store manager:', storeManager.name);

    // Reset password to a known value
    const newPassword = 'password123';
    
    // Hash the new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password
    await User.findByIdAndUpdate(storeManager._id, {
      password: hashedPassword,
      loginAttempts: 0,
      lockUntil: undefined
    });

    console.log('\n=== Password Reset Successful ===');
    console.log('Store Manager:', storeManager.name);
    console.log('Email: pinku@gmail.com');
    console.log('New Password: password123');
    console.log('Role: store_manager');
    console.log('\nYou can now login with these credentials!');

    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
};

// Run the script
resetStoreManagerPassword();

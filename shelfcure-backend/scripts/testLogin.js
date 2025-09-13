const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Store = require('../models/Store');

const testLogin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Connected to MongoDB');

    // Test credentials
    const email = 'pinku@gmail.com';
    const password = 'password123';

    console.log('\n=== Testing Login Credentials ===');
    console.log('Email:', email);
    console.log('Password:', password);

    // Find user with password field included
    const user = await User.findOne({ email })
      .select('+password')
      .populate('currentStore', 'name');

    if (!user) {
      console.log('❌ User not found with email:', email);
      process.exit(1);
    }

    console.log('\n=== User Found ===');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Active:', user.isActive);
    console.log('Locked:', user.isLocked);
    console.log('Login Attempts:', user.loginAttempts);
    console.log('Current Store:', user.currentStore?.name || 'None');
    console.log('Password Hash Length:', user.password ? user.password.length : 'No password');

    // Check if account is locked
    if (user.isLocked) {
      console.log('❌ Account is locked until:', user.lockUntil);
      process.exit(1);
    }

    // Check if account is active
    if (!user.isActive) {
      console.log('❌ Account is not active');
      process.exit(1);
    }

    // Test password comparison
    console.log('\n=== Testing Password ===');
    const isMatch = await user.matchPassword(password);
    console.log('Password Match:', isMatch ? '✅ YES' : '❌ NO');

    if (!isMatch) {
      console.log('❌ Password does not match');
      
      // Let's also test with bcrypt directly
      console.log('\n=== Direct bcrypt Test ===');
      const directMatch = await bcrypt.compare(password, user.password);
      console.log('Direct bcrypt compare:', directMatch ? '✅ YES' : '❌ NO');
      
      process.exit(1);
    }

    // Test JWT token generation
    console.log('\n=== Testing JWT Token ===');
    try {
      const token = user.getSignedJwtToken();
      console.log('JWT Token Generated:', token ? '✅ YES' : '❌ NO');
      console.log('Token Length:', token ? token.length : 0);
    } catch (error) {
      console.log('❌ JWT Token Error:', error.message);
    }

    console.log('\n✅ All login tests passed! The user should be able to login.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
};

// Run the test
testLogin();

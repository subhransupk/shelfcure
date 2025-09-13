const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Test with existing store manager
    const storeManager = await User.findOne({ email: 'mota@gmail.com' }).select('+password');
    if (storeManager) {
      console.log('\nTesting existing store manager:');
      console.log('Name:', storeManager.name);
      console.log('Email:', storeManager.email);
      console.log('Role:', storeManager.role);
      console.log('Active:', storeManager.isActive);
      console.log('Password hash exists:', !!storeManager.password);
      
      // Test password matching
      const testPasswords = ['password123', 'manager123', 'mota123', 'admin123'];
      for (const password of testPasswords) {
        try {
          const isMatch = await storeManager.matchPassword(password);
          console.log(`Password "${password}" matches:`, isMatch);
          if (isMatch) break;
        } catch (error) {
          console.log(`Error testing password "${password}":`, error.message);
        }
      }
    }
    
    // Create the expected store manager user
    console.log('\nCreating expected store manager user...');
    const existingManager = await User.findOne({ email: 'manager@shelfcure.com' });
    if (existingManager) {
      console.log('manager@shelfcure.com already exists');
    } else {
      const newManager = await User.create({
        name: 'Store Manager',
        email: 'manager@shelfcure.com',
        phone: '+91-9876543211',
        password: 'manager123',
        role: 'store_manager',
        isActive: true,
        emailVerified: true
      });
      console.log('Created new store manager:', newManager.email);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testLogin();

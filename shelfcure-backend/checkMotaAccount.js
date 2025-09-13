const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Store = require('./models/Store');

async function checkMotaAccount() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find the mota account
    const motaUser = await User.findOne({ email: 'mota@gmail.com' }).select('+password');
    if (!motaUser) {
      console.log('❌ mota@gmail.com account not found');
      return;
    }
    
    console.log('✅ Found mota account:');
    console.log('Name:', motaUser.name);
    console.log('Email:', motaUser.email);
    console.log('Role:', motaUser.role);
    console.log('Active:', motaUser.isActive);
    console.log('Email Verified:', motaUser.emailVerified);
    console.log('Password hash exists:', !!motaUser.password);
    console.log('Login attempts:', motaUser.loginAttempts);
    console.log('Account locked:', motaUser.isLocked);
    console.log('Lock until:', motaUser.lockUntil);
    console.log('Stores:', motaUser.stores);
    console.log('Current store:', motaUser.currentStore);
    
    // Test common passwords
    const testPasswords = ['password123', 'mota123', 'admin123', 'manager123', 'mota', 'Password123'];
    console.log('\n🔍 Testing common passwords...');
    
    for (const password of testPasswords) {
      try {
        const isMatch = await motaUser.matchPassword(password);
        console.log(`Password "${password}":`, isMatch ? '✅ MATCH' : '❌ No match');
        if (isMatch) {
          console.log(`\n🎉 FOUND WORKING PASSWORD: "${password}"`);
          break;
        }
      } catch (error) {
        console.log(`Error testing password "${password}":`, error.message);
      }
    }
    
    // Check if user has store access
    if (motaUser.stores && motaUser.stores.length > 0) {
      console.log('\n🏪 Checking store access...');
      for (const storeId of motaUser.stores) {
        const store = await Store.findById(storeId);
        if (store) {
          console.log(`Store: ${store.name} (${store._id}) - Active: ${store.isActive}`);
        }
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMotaAccount();

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Store = require('./models/Store');

async function testStoreOwnerUserCreation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find an active store
    const store = await Store.findOne({ isActive: true });
    if (!store) {
      console.log('❌ No active store found');
      return;
    }
    
    console.log('✅ Found store:', store.name);
    
    // Simulate creating a user through store owner panel
    const testUserData = {
      name: 'Test Store Manager',
      email: 'testmanager@test.com',
      phone: '+1234567890',
      password: 'testpass123', // This should work after login
      role: 'store_manager',
      stores: [store._id],
      currentStore: store._id,
      isActive: true,
      emailVerified: true
    };
    
    console.log('🔧 Creating user with password:', testUserData.password);
    
    // Delete existing test user if exists
    await User.deleteOne({ email: testUserData.email });
    
    // Create user (this will trigger the pre-save hook to hash password)
    const user = await User.create(testUserData);
    
    console.log('✅ User created successfully');
    console.log('User ID:', user._id);
    console.log('User name:', user.name);
    console.log('User email:', user.email);
    console.log('User role:', user.role);
    
    // Test the password immediately
    console.log('\n🧪 Testing password...');
    const userWithPassword = await User.findById(user._id).select('+password');
    const isMatch = await userWithPassword.matchPassword('testpass123');
    console.log(`Password "testpass123" works:`, isMatch ? '✅ YES' : '❌ NO');
    
    if (isMatch) {
      console.log('\n🎉 SUCCESS! User created through store owner panel simulation works!');
      console.log('Login credentials:');
      console.log('Email: testmanager@test.com');
      console.log('Password: testpass123');
    } else {
      console.log('\n❌ FAILED! Password does not work');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testStoreOwnerUserCreation();

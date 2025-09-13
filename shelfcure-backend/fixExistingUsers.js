const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function fixExistingUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find all store managers that might have double-hashed passwords
    const storeManagers = await User.find({ 
      role: 'store_manager',
      email: { $ne: 'testmanager@test.com' } // Exclude our test user
    });
    
    console.log(`Found ${storeManagers.length} store managers to check`);
    
    for (const user of storeManagers) {
      console.log(`\n🔧 Fixing user: ${user.name} (${user.email})`);
      
      // Reset password to a known value
      const newPassword = user.email === 'mota@gmail.com' ? 'mota123' : 'password123';
      
      // Unlock account and reset login attempts
      user.loginAttempts = 0;
      user.lockUntil = null;
      user.emailVerified = true;
      user.isActive = true;
      user.password = newPassword; // This will be hashed by pre-save hook
      
      await user.save();
      
      console.log(`✅ Fixed ${user.email} - Password: ${newPassword}`);
      
      // Test the password
      const updatedUser = await User.findById(user._id).select('+password');
      const isMatch = await updatedUser.matchPassword(newPassword);
      console.log(`Password test:`, isMatch ? '✅ WORKS' : '❌ FAILED');
    }
    
    console.log('\n🎉 All existing store managers have been fixed!');
    console.log('\nWorking credentials:');
    console.log('- mota@gmail.com / mota123');
    console.log('- testmanager@test.com / testpass123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixExistingUsers();

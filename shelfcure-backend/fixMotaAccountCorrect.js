const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function fixMotaAccountCorrect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find the mota account
    const motaUser = await User.findOne({ email: 'mota@gmail.com' });
    if (!motaUser) {
      console.log('❌ mota@gmail.com account not found');
      return;
    }
    
    console.log('🔧 Fixing mota account issues (correct way)...');
    
    // 1. Unlock the account
    motaUser.loginAttempts = 0;
    motaUser.lockUntil = null;
    console.log('✅ Account unlocked');
    
    // 2. Verify email
    motaUser.emailVerified = true;
    console.log('✅ Email verified');
    
    // 3. Set a known password (let the pre-save hook handle hashing)
    const newPassword = 'mota123';
    motaUser.password = newPassword;
    console.log('✅ Password set to: mota123 (will be hashed by pre-save hook)');
    
    // 4. Ensure account is active
    motaUser.isActive = true;
    console.log('✅ Account activated');
    
    // Save changes (this will trigger the pre-save hook to hash the password)
    await motaUser.save();
    console.log('✅ All changes saved to database');
    
    // Test the new password
    console.log('\n🧪 Testing new password...');
    const updatedUser = await User.findOne({ email: 'mota@gmail.com' }).select('+password');
    const isMatch = await updatedUser.matchPassword(newPassword);
    console.log(`Password "${newPassword}" works:`, isMatch ? '✅ YES' : '❌ NO');
    
    if (isMatch) {
      console.log('\n🎉 Account fixed successfully! You can now login with:');
      console.log('Email: mota@gmail.com');
      console.log('Password: mota123');
    } else {
      console.log('\n❌ Password test failed. There might be another issue.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixMotaAccountCorrect();

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function fixMotaAccount() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find the mota account
    const motaUser = await User.findOne({ email: 'mota@gmail.com' });
    if (!motaUser) {
      console.log('❌ mota@gmail.com account not found');
      return;
    }
    
    console.log('🔧 Fixing mota account issues...');
    
    // 1. Unlock the account
    motaUser.loginAttempts = 0;
    motaUser.lockUntil = null;
    console.log('✅ Account unlocked');
    
    // 2. Verify email
    motaUser.emailVerified = true;
    console.log('✅ Email verified');
    
    // 3. Set a known password
    const newPassword = 'mota123';
    const salt = await bcrypt.genSalt(10);
    motaUser.password = await bcrypt.hash(newPassword, salt);
    console.log('✅ Password set to: mota123');
    
    // 4. Ensure account is active
    motaUser.isActive = true;
    console.log('✅ Account activated');
    
    // Save changes
    await motaUser.save();
    console.log('✅ All changes saved to database');
    
    // Test the new password
    console.log('\n🧪 Testing new password...');
    const updatedUser = await User.findOne({ email: 'mota@gmail.com' }).select('+password');
    const isMatch = await updatedUser.matchPassword(newPassword);
    console.log(`Password "${newPassword}" works:`, isMatch ? '✅ YES' : '❌ NO');
    
    console.log('\n🎉 Account fixed! You can now login with:');
    console.log('Email: mota@gmail.com');
    console.log('Password: mota123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixMotaAccount();

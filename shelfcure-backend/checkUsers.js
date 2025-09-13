const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const users = await User.find({}, 'name email role isActive').lean();
    console.log('Existing users:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`);
    });
    
    const storeManager = await User.findOne({ email: 'manager@shelfcure.com' }).select('+password');
    if (storeManager) {
      console.log('\nStore manager found:', storeManager.name, storeManager.email);
      console.log('Password hash exists:', !!storeManager.password);
      console.log('Role:', storeManager.role);
      console.log('Active:', storeManager.isActive);
      console.log('Stores:', storeManager.stores);
    } else {
      console.log('\nNo store manager found with email: manager@shelfcure.com');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();

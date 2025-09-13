require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: 'admin@shelfcure.com' 
    });

    if (existingAdmin) {
      console.log('✅ Admin already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@shelfcure.com',
      phone: '+91 99999 99999',
      password: 'admin123',
      role: 'superadmin',
      isActive: true,
      isEmailVerified: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@shelfcure.com');
    console.log('Password: admin123');
    console.log('Role: superadmin');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createAdmin();

const mongoose = require('mongoose');
const User = require('../models/User');
const Store = require('../models/Store');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: process.env.DEMO_ADMIN_EMAIL || 'admin@shelfcure.com' 
    });

    if (existingAdmin) {
      console.log('⚠️ Admin user already exists');
      process.exit(0);
    }

    // Create admin user first (needed for store owner)
    let adminUser = await User.findOne({
      email: process.env.DEMO_ADMIN_EMAIL || 'admin@shelfcure.com'
    });

    if (!adminUser) {
      adminUser = await User.create({
        name: 'System Administrator',
        email: process.env.DEMO_ADMIN_EMAIL || 'admin@shelfcure.com',
        phone: '+91-9876543210',
        password: process.env.DEMO_ADMIN_PASSWORD || 'admin123',
        role: 'superadmin',
        isActive: true,
        emailVerified: true,
        permissions: {
          inventory: { view: true, add: true, edit: true, delete: true },
          sales: { view: true, create: true, edit: true, delete: true, refund: true },
          purchases: { view: true, create: true, edit: true, delete: true },
          customers: { view: true, add: true, edit: true, delete: true },
          reports: { view: true, export: true },
          settings: { view: true, edit: true }
        },
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            sms: false
          },
          defaultUnitType: 'both'
        }
      });
      console.log('✅ Admin user created');
    }

    // Create default store
    let defaultStore = await Store.findOne({ name: process.env.DEFAULT_STORE_NAME || 'Main Store' });

    if (!defaultStore) {
      defaultStore = await Store.create({
        name: process.env.DEFAULT_STORE_NAME || 'Main Store',
        code: 'MAIN001',
        description: 'Main pharmacy store for ShelfCure demo',
        contact: {
          phone: '+91-9876543210',
          email: 'mainstore@shelfcure.com',
          website: 'https://shelfcure.com'
        },
        address: {
          street: '123 Main Street',
          city: 'Demo City',
          state: 'Demo State',
          country: 'India',
          pincode: '123456'
        },
        business: {
          licenseNumber: 'DEMO-LICENSE-001',
          gstNumber: '22AAAAA0000A1Z5',
          drugLicenseNumber: 'DRUG-LIC-001',
          establishmentYear: 2020
        },
        owner: adminUser._id,
        isActive: true,
        operatingHours: {
          monday: { open: '09:00', close: '21:00', closed: false },
          tuesday: { open: '09:00', close: '21:00', closed: false },
          wednesday: { open: '09:00', close: '21:00', closed: false },
          thursday: { open: '09:00', close: '21:00', closed: false },
          friday: { open: '09:00', close: '21:00', closed: false },
          saturday: { open: '09:00', close: '21:00', closed: false },
          sunday: { open: '10:00', close: '20:00', closed: false }
        },
        subscription: {
          plan: 'premium',
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          maxUsers: 50,
          maxProducts: 10000,
          features: {
            multiStore: true,
            analytics: true,
            whatsappIntegration: true,
            billOCR: true,
            customReports: true
          }
        },
        createdBy: adminUser._id
      });
      console.log('✅ Default store created');
    }

    // Update admin user with store references
    adminUser.stores = [defaultStore._id];
    adminUser.currentStore = defaultStore._id;
    await adminUser.save();

    console.log('✅ Admin user created successfully');
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Password:', process.env.DEMO_ADMIN_PASSWORD || 'admin123');
    console.log('🏪 Default Store:', defaultStore.name);

    // Create a store manager user as well
    const managerUser = await User.create({
      name: 'Store Manager',
      email: 'manager@shelfcure.com',
      phone: '+91-9876543211',
      password: 'manager123',
      role: 'store_manager',
      isActive: true,
      emailVerified: true,
      stores: [defaultStore._id],
      currentStore: defaultStore._id,
      permissions: {
        inventory: { view: true, add: true, edit: true, delete: false },
        sales: { view: true, create: true, edit: true, delete: false, refund: true },
        purchases: { view: true, create: true, edit: true, delete: false },
        customers: { view: true, add: true, edit: true, delete: false },
        reports: { view: true, export: false },
        settings: { view: true, edit: false }
      }
    });

    console.log('✅ Manager user created successfully');
    console.log('📧 Manager Email:', managerUser.email);
    console.log('🔑 Manager Password: manager123');

    // Create a staff user
    const staffUser = await User.create({
      name: 'Staff Member',
      email: 'staff@shelfcure.com',
      phone: '+91-9876543212',
      password: 'staff123',
      role: 'staff',
      isActive: true,
      emailVerified: true,
      stores: [defaultStore._id],
      currentStore: defaultStore._id,
      permissions: {
        inventory: { view: true, add: false, edit: false, delete: false },
        sales: { view: true, create: true, edit: false, delete: false, refund: false },
        purchases: { view: false, create: false, edit: false, delete: false },
        customers: { view: true, add: true, edit: false, delete: false },
        reports: { view: false, export: false },
        settings: { view: false, edit: false }
      }
    });

    console.log('✅ Staff user created successfully');
    console.log('📧 Staff Email:', staffUser.email);
    console.log('🔑 Staff Password: staff123');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('='.repeat(50));
    console.log('ADMIN LOGIN:');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: ${process.env.DEMO_ADMIN_PASSWORD || 'admin123'}`);
    console.log('='.repeat(50));
    console.log('MANAGER LOGIN:');
    console.log(`Email: ${managerUser.email}`);
    console.log('Password: manager123');
    console.log('='.repeat(50));
    console.log('STAFF LOGIN:');
    console.log(`Email: ${staffUser.email}`);
    console.log('Password: staff123');
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Store = require('../models/Store');
const Medicine = require('../models/Medicine');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Affiliate = require('../models/Affiliate');
const Invoice = require('../models/Invoice');
const Discount = require('../models/Discount');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Store.deleteMany({});
    await Medicine.deleteMany({});
    await SubscriptionPlan.deleteMany({});
    await Affiliate.deleteMany({});
    await Invoice.deleteMany({});
    await Discount.deleteMany({});

    // Create admin user
    console.log('Creating admin user...');
    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@shelfcure.com',
      phone: '+91 99999 99999',
      password: 'admin123', // Let the User model hash this automatically
      role: 'superadmin',
      isActive: true,
      isEmailVerified: true
    });

    // Create subscription plans
    console.log('Creating subscription plans...');
    const plans = [
      {
        name: 'Basic Plan',
        description: 'Perfect for small pharmacies just getting started',
        planType: 'basic',
        pricing: {
          monthly: 999,
          yearly: 9999,
          currency: 'INR'
        },
        limits: {
          maxUsers: 2,
          maxProducts: 1000,
          maxStores: 1,
          maxTransactionsPerMonth: 500,
          storageLimit: 5
        },
        features: {
          multiStore: false,
          analytics: true,
          advancedAnalytics: false,
          whatsappIntegration: false,
          billOCR: false,
          customReports: false,
          apiAccess: false,
          prioritySupport: false,
          backupRestore: true,
          customBranding: false,
          affiliateProgram: false
        },
        isActive: true,
        isPopular: false,
        sortOrder: 1,
        createdBy: adminUser._id
      },
      {
        name: 'Standard Plan',
        description: 'Great for growing pharmacies with multiple users',
        planType: 'standard',
        pricing: {
          monthly: 1999,
          yearly: 19999,
          currency: 'INR'
        },
        limits: {
          maxUsers: 5,
          maxProducts: 5000,
          maxStores: 1,
          maxTransactionsPerMonth: 2000,
          storageLimit: 20
        },
        features: {
          multiStore: false,
          analytics: true,
          advancedAnalytics: true,
          whatsappIntegration: true,
          billOCR: true,
          customReports: false,
          apiAccess: false,
          prioritySupport: false,
          backupRestore: true,
          customBranding: false,
          affiliateProgram: false
        },
        isActive: true,
        isPopular: true,
        sortOrder: 2,
        createdBy: adminUser._id
      },
      {
        name: 'Premium Plan',
        description: 'Advanced features for established pharmacy chains',
        planType: 'premium',
        pricing: {
          monthly: 4999,
          yearly: 49999,
          currency: 'INR'
        },
        limits: {
          maxUsers: 15,
          maxProducts: 20000,
          maxStores: 5,
          maxTransactionsPerMonth: 10000,
          storageLimit: 100
        },
        features: {
          multiStore: true,
          analytics: true,
          advancedAnalytics: true,
          whatsappIntegration: true,
          billOCR: true,
          customReports: true,
          apiAccess: true,
          prioritySupport: true,
          backupRestore: true,
          customBranding: true,
          affiliateProgram: true
        },
        isActive: true,
        isPopular: false,
        sortOrder: 3,
        createdBy: adminUser._id
      }
    ];

    const createdPlans = await SubscriptionPlan.create(plans);
    console.log(`Created ${createdPlans.length} subscription plans`);

    // Create sample stores
    console.log('Creating sample stores...');
    
    const stores = [];
    for (let i = 1; i <= 5; i++) {
      // Create store owner
      const owner = await User.create({
        name: `Store Owner ${i}`,
        email: `owner${i}@pharmacy${i}.com`,
        phone: `+91 98765 4321${i}`,
        password: 'password123', // Let the User model hash this automatically
        role: 'store_owner',
        isActive: true,
        isEmailVerified: true
      });

      // Create store
      const store = await Store.create({
        name: `Pharmacy Store ${i}`,
        code: `STORE${String(i).padStart(3, '0')}`,
        description: `A modern pharmacy store serving the community`,
        owner: owner._id,
        contact: {
          email: `contact@pharmacy${i}.com`,
          phone: `+91 98765 4321${i}`,
          website: `https://pharmacy${i}.com`
        },
        address: {
          street: `${i}23 Main Street`,
          city: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'][i - 1],
          state: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal'][i - 1],
          country: 'India',
          pincode: `40000${i}`
        },
        business: {
          licenseNumber: `LIC-${i}23456`,
          gstNumber: `2${i}ABCDE1234F1Z${i}`,
          establishedYear: 2020 + i
        },
        subscription: {
          plan: createdPlans[Math.floor(Math.random() * createdPlans.length)].planType,
          status: Math.random() > 0.2 ? 'active' : 'trial',
          startDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000)
        },
        isActive: Math.random() > 0.1,
        createdBy: adminUser._id
      });

      // Update owner's current store
      owner.currentStore = store._id;
      owner.stores = [store._id];
      await owner.save();

      // Create a store manager for the first store
      if (i === 1) {
        const manager = await User.create({
          name: 'Store Manager',
          email: 'manager@shelfcure.com',
          phone: '+91 98765 43210',
          password: 'manager123',
          role: 'store_manager',
          currentStore: store._id,
          stores: [store._id],
          isActive: true,
          isEmailVerified: true
        });
        console.log('Created store manager:', manager.email);
      }

      stores.push(store);
    }
    console.log(`Created ${stores.length} stores`);

    // Create sample medicines
    console.log('Creating sample medicines...');
    const medicines = [
      {
        name: 'Paracetamol 500mg',
        genericName: 'Acetaminophen',
        composition: 'Paracetamol 500mg',
        manufacturer: 'Cipla Ltd',
        category: 'Tablet',
        form: 'Tablet',
        type: 'over-the-counter',
        unitTypes: {
          hasStrips: true,
          hasIndividual: true,
          unitsPerStrip: 10
        },
        stripInfo: {
          purchasePrice: 15,
          sellingPrice: 20,
          mrp: 25,
          stock: 100,
          minStock: 10,
          reorderLevel: 20
        },
        individualInfo: {
          purchasePrice: 1.5,
          sellingPrice: 2,
          mrp: 2.5,
          stock: 1000,
          minStock: 100,
          reorderLevel: 200
        },
        isActive: true,
        store: stores[0]._id,
        createdBy: adminUser._id
      },
      {
        name: 'Amoxicillin 250mg',
        genericName: 'Amoxicillin',
        composition: 'Amoxicillin Trihydrate 250mg',
        manufacturer: 'Sun Pharma',
        category: 'Capsule',
        form: 'Capsule',
        type: 'prescription',
        unitTypes: {
          hasStrips: true,
          hasIndividual: true,
          unitsPerStrip: 10
        },
        stripInfo: {
          purchasePrice: 45,
          sellingPrice: 60,
          mrp: 75,
          stock: 50,
          minStock: 5,
          reorderLevel: 10
        },
        individualInfo: {
          purchasePrice: 4.5,
          sellingPrice: 6,
          mrp: 7.5,
          stock: 500,
          minStock: 50,
          reorderLevel: 100
        },
        isActive: true,
        store: stores[0]._id,
        createdBy: adminUser._id
      },
      {
        name: 'Cough Syrup 100ml',
        genericName: 'Dextromethorphan',
        composition: 'Dextromethorphan HBr 15mg/5ml',
        manufacturer: 'Lupin Limited',
        category: 'Syrup',
        form: 'Syrup',
        type: 'over-the-counter',
        unitTypes: {
          hasStrips: false,
          hasIndividual: true,
          unitsPerStrip: 1
        },
        individualInfo: {
          purchasePrice: 85,
          sellingPrice: 110,
          mrp: 125,
          stock: 75,
          minStock: 10,
          reorderLevel: 20
        },
        isActive: true,
        store: stores[1]._id,
        createdBy: adminUser._id
      }
    ];

    const createdMedicines = await Medicine.create(medicines);
    console.log(`Created ${createdMedicines.length} medicines`);

    // Create sample affiliates
    console.log('Creating sample affiliates...');
    const affiliates = [
      {
        name: 'John Marketing',
        email: 'john@marketing.com',
        phone: '+91 98765 43210',
        businessName: 'Digital Marketing Solutions',
        businessType: 'company',
        affiliateCode: 'JOHN2024',
        commission: {
          type: 'percentage',
          rate: 10,
          recurringCommission: {
            enabled: true,
            months: 12
          }
        },
        status: 'active',
        approvedBy: adminUser._id,
        approvedAt: new Date(),
        createdBy: adminUser._id
      },
      {
        name: 'Sarah Affiliate',
        email: 'sarah@affiliate.com',
        phone: '+91 87654 32109',
        businessName: 'Healthcare Partners',
        businessType: 'partnership',
        affiliateCode: 'SARAH2024',
        commission: {
          type: 'percentage',
          rate: 15,
          recurringCommission: {
            enabled: true,
            months: 6
          }
        },
        status: 'pending_approval',
        createdBy: adminUser._id
      }
    ];

    const createdAffiliates = await Affiliate.create(affiliates);
    console.log(`Created ${createdAffiliates.length} affiliates`);

    // Create sample discounts
    console.log('Creating sample discounts...');
    const discounts = [
      {
        name: 'New Year Special',
        description: '20% off on all plans for new customers',
        code: 'NEWYEAR2024',
        type: 'percentage',
        value: 20,
        applicableTo: 'all_plans',
        limits: {
          maxUses: 100,
          maxUsesPerCustomer: 1,
          minOrderAmount: 500
        },
        validity: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        isActive: true,
        createdBy: adminUser._id
      },
      {
        name: 'First Time Customer',
        description: 'Flat ₹500 off for first-time customers',
        code: 'FIRST500',
        type: 'fixed_amount',
        value: 500,
        applicableTo: 'first_time_only',
        limits: {
          maxUses: -1,
          maxUsesPerCustomer: 1,
          minOrderAmount: 1000
        },
        validity: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        },
        customerRestrictions: {
          newCustomersOnly: true
        },
        isActive: true,
        createdBy: adminUser._id
      }
    ];

    const createdDiscounts = await Discount.create(discounts);
    console.log(`Created ${createdDiscounts.length} discounts`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Admin Login Credentials:');
    console.log('Email: admin@shelfcure.com');
    console.log('Password: admin123');
    console.log('\n🏪 Sample Store Owner Credentials:');
    console.log('Email: owner1@pharmacy1.com');
    console.log('Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

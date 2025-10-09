require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const User = require('../models/User');
const Store = require('../models/Store');
const Medicine = require('../models/Medicine');
const Customer = require('../models/Customer');
const Doctor = require('../models/Doctor');
const Sale = require('../models/Sale');
const SubscriptionPlan = require('../models/SubscriptionPlan');

const seedDemoSalesData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if store "Some (ST9508)" exists, if not create it
    let demoStore = await Store.findOne({ code: 'ST9508' });
    let storeOwner;

    if (!demoStore) {
      console.log('🏪 Creating demo store "Some (ST9508)"...');
      
      // Create store owner first
      storeOwner = await User.create({
        name: 'Demo Store Owner',
        email: 'demo.owner@shelfcure.com',
        phone: '+91-9876543210',
        password: 'demo123',
        role: 'store_owner',
        isActive: true,
        isEmailVerified: true
      });

      // Create the demo store
      demoStore = await Store.create({
        name: 'Some',
        code: 'ST9508',
        description: 'Demo pharmacy store for testing filter functionality',
        owner: storeOwner._id,
        contact: {
          email: 'contact@some-pharmacy.com',
          phone: '+91-9876543210',
          website: 'https://some-pharmacy.com'
        },
        address: {
          street: '123 Demo Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          pincode: '400001'
        },
        business: {
          licenseNumber: 'DEMO-LIC-9508',
          gstNumber: '27ABCDE1234F1Z5',
          drugLicenseNumber: 'DRUG-LIC-9508',
          establishedYear: 2020
        },
        isActive: true,
        createdBy: storeOwner._id
      });

      console.log('✅ Demo store created successfully');
    } else {
      storeOwner = await User.findById(demoStore.owner);
      console.log('✅ Found existing demo store');
    }

    // Create store manager for the demo store
    let storeManager = await User.findOne({ email: 'manager@some-pharmacy.com' });
    if (!storeManager) {
      storeManager = await User.create({
        name: 'Demo Store Manager',
        email: 'manager@some-pharmacy.com',
        phone: '+91-9876543211',
        password: 'manager123',
        role: 'store_manager',
        currentStore: demoStore._id,
        stores: [demoStore._id],
        isActive: true,
        isEmailVerified: true,
        permissions: {
          inventory: { view: true, add: true, edit: true, delete: true },
          sales: { view: true, create: true, edit: true, delete: true, refund: true },
          purchases: { view: true, create: true, edit: true, delete: true },
          customers: { view: true, add: true, edit: true, delete: true },
          reports: { view: true, export: true },
          settings: { view: true, edit: true }
        }
      });
      console.log('✅ Store manager created');
    }

    // Clear existing demo data for this store
    console.log('🧹 Clearing existing demo data...');
    await Sale.deleteMany({ store: demoStore._id });
    await Customer.deleteMany({ store: demoStore._id });
    await Doctor.deleteMany({ store: demoStore._id });
    await Medicine.deleteMany({ store: demoStore._id });

    // Create demo medicines
    console.log('💊 Creating demo medicines...');
    const medicines = [
      {
        name: 'Paracetamol 500mg',
        genericName: 'Acetaminophen',
        composition: 'Paracetamol 500mg',
        manufacturer: 'Cipla Ltd',
        category: 'Tablet',
        form: 'Tablet',
        type: 'over-the-counter',
        unitTypes: { hasStrips: true, hasIndividual: true, unitsPerStrip: 10 },
        stripInfo: { purchasePrice: 15, sellingPrice: 20, mrp: 25, stock: 100, minStock: 10, reorderLevel: 20 },
        individualInfo: { purchasePrice: 1.5, sellingPrice: 2, mrp: 2.5, stock: 1000, minStock: 100, reorderLevel: 200 },
        isActive: true,
        store: demoStore._id,
        createdBy: storeManager._id
      },
      {
        name: 'Amoxicillin 250mg',
        genericName: 'Amoxicillin',
        composition: 'Amoxicillin 250mg',
        manufacturer: 'Sun Pharma',
        category: 'Capsule',
        form: 'Capsule',
        type: 'prescription',
        unitTypes: { hasStrips: true, hasIndividual: true, unitsPerStrip: 10 },
        stripInfo: { purchasePrice: 45, sellingPrice: 60, mrp: 75, stock: 50, minStock: 5, reorderLevel: 10 },
        individualInfo: { purchasePrice: 4.5, sellingPrice: 6, mrp: 7.5, stock: 500, minStock: 50, reorderLevel: 100 },
        isActive: true,
        store: demoStore._id,
        createdBy: storeManager._id
      },
      {
        name: 'Cough Syrup 100ml',
        genericName: 'Dextromethorphan',
        composition: 'Dextromethorphan HBr 15mg/5ml',
        manufacturer: 'Lupin Limited',
        category: 'Syrup',
        form: 'Syrup',
        type: 'over-the-counter',
        unitTypes: { hasStrips: false, hasIndividual: true, unitsPerStrip: 1 },
        individualInfo: { purchasePrice: 85, sellingPrice: 110, mrp: 125, stock: 75, minStock: 10, reorderLevel: 20 },
        isActive: true,
        store: demoStore._id,
        createdBy: storeManager._id
      },
      {
        name: 'Aspirin 75mg',
        genericName: 'Acetylsalicylic Acid',
        composition: 'Aspirin 75mg',
        manufacturer: 'Bayer',
        category: 'Tablet',
        form: 'Tablet',
        type: 'over-the-counter',
        unitTypes: { hasStrips: true, hasIndividual: true, unitsPerStrip: 14 },
        stripInfo: { purchasePrice: 25, sellingPrice: 35, mrp: 42, stock: 80, minStock: 8, reorderLevel: 15 },
        individualInfo: { purchasePrice: 1.8, sellingPrice: 2.5, mrp: 3, stock: 1120, minStock: 112, reorderLevel: 210 },
        isActive: true,
        store: demoStore._id,
        createdBy: storeManager._id
      },
      {
        name: 'Vitamin D3 60K IU',
        genericName: 'Cholecalciferol',
        composition: 'Cholecalciferol 60000 IU',
        manufacturer: 'Abbott',
        category: 'Capsule',
        form: 'Capsule',
        type: 'prescription',
        unitTypes: { hasStrips: true, hasIndividual: true, unitsPerStrip: 4 },
        stripInfo: { purchasePrice: 120, sellingPrice: 150, mrp: 180, stock: 30, minStock: 3, reorderLevel: 6 },
        individualInfo: { purchasePrice: 30, sellingPrice: 37.5, mrp: 45, stock: 120, minStock: 12, reorderLevel: 24 },
        isActive: true,
        store: demoStore._id,
        createdBy: storeManager._id
      }
    ];

    const createdMedicines = await Medicine.create(medicines);
    console.log(`✅ Created ${createdMedicines.length} medicines`);

    // Create demo doctors
    console.log('👨‍⚕️ Creating demo doctors...');
    const doctors = [
      {
        name: 'Rajesh Kumar',
        phone: '9876543220',
        email: 'dr.rajesh@hospital.com',
        specialization: 'General Physician',
        qualification: 'MBBS, MD',
        registrationNumber: 'MH12345',
        address: { street: '456 Medical Street', city: 'Mumbai', state: 'Maharashtra', pincode: '400002' },
        status: 'active',
        store: demoStore._id,
        createdBy: storeManager._id
      },
      {
        name: 'Priya Sharma',
        phone: '9876543221',
        email: 'dr.priya@childcare.com',
        specialization: 'Pediatrician',
        qualification: 'MBBS, DCH',
        registrationNumber: 'MH12346',
        address: { street: '789 Kids Avenue', city: 'Mumbai', state: 'Maharashtra', pincode: '400003' },
        status: 'active',
        store: demoStore._id,
        createdBy: storeManager._id
      },
      {
        name: 'Amit Patel',
        phone: '9876543222',
        email: 'dr.amit@heartcare.com',
        specialization: 'Cardiologist',
        qualification: 'MBBS, DM Cardiology',
        registrationNumber: 'MH12347',
        address: { street: '321 Heart Lane', city: 'Mumbai', state: 'Maharashtra', pincode: '400004' },
        status: 'active',
        store: demoStore._id,
        createdBy: storeManager._id
      },
      {
        name: 'Sunita Joshi',
        phone: '9876543223',
        email: 'dr.sunita@skincare.com',
        specialization: 'Dermatologist',
        qualification: 'MBBS, MD Dermatology',
        registrationNumber: 'MH12348',
        address: { street: '654 Skin Street', city: 'Mumbai', state: 'Maharashtra', pincode: '400005' },
        status: 'active',
        store: demoStore._id,
        createdBy: storeManager._id
      }
    ];

    const createdDoctors = await Doctor.create(doctors);
    console.log(`✅ Created ${createdDoctors.length} doctors`);

    console.log('👥 Creating demo customers...');
    const customers = [
      {
        name: 'Rahul Gupta',
        phone: '9876543230',
        email: 'rahul.gupta@email.com',
        address: { street: '101 Customer Street', city: 'Mumbai', state: 'Maharashtra', pincode: '400010' },
        dateOfBirth: new Date('1985-03-15'),
        gender: 'male',
        isActive: true,
        store: demoStore._id,
        createdBy: storeManager._id
      },
      {
        name: 'Sneha Patel',
        phone: '9876543231',
        email: 'sneha.patel@email.com',
        address: { street: '202 Family Avenue', city: 'Mumbai', state: 'Maharashtra', pincode: '400011' },
        dateOfBirth: new Date('1990-07-22'),
        gender: 'female',
        isActive: true,
        store: demoStore._id,
        createdBy: storeManager._id
      },
      {
        name: 'Arjun Singh',
        phone: '9876543232',
        email: 'arjun.singh@email.com',
        address: { street: '303 Health Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400012' },
        dateOfBirth: new Date('1978-11-08'),
        gender: 'male',
        isActive: true,
        store: demoStore._id,
        createdBy: storeManager._id
      },
      {
        name: 'Kavya Sharma',
        phone: '9876543233',
        email: 'kavya.sharma@email.com',
        address: { street: '404 Wellness Lane', city: 'Mumbai', state: 'Maharashtra', pincode: '400013' },
        dateOfBirth: new Date('1992-05-18'),
        gender: 'female',
        isActive: true,
        store: demoStore._id,
        createdBy: storeManager._id
      },
      {
        name: 'Vikram Joshi',
        phone: '9876543234',
        email: 'vikram.joshi@email.com',
        address: { street: '505 Medicine Street', city: 'Mumbai', state: 'Maharashtra', pincode: '400014' },
        dateOfBirth: new Date('1980-12-03'),
        gender: 'male',
        isActive: true,
        store: demoStore._id,
        createdBy: storeManager._id
      },
      {
        name: 'Meera Reddy',
        phone: '9876543235',
        email: 'meera.reddy@email.com',
        address: { street: '606 Care Avenue', city: 'Mumbai', state: 'Maharashtra', pincode: '400015' },
        dateOfBirth: new Date('1988-09-25'),
        gender: 'female',
        isActive: true,
        store: demoStore._id,
        createdBy: storeManager._id
      }
    ];

    const createdCustomers = await Customer.create(customers);
    console.log(`✅ Created ${createdCustomers.length} customers`);

    // Create demo sales with various scenarios for testing filters
    console.log('💰 Creating demo sales data...');
    const salesData = [];

    // Helper function to create sale data
    const createSaleData = (customer, doctor, medicines, paymentStatus, paymentMethod, daysAgo) => {
      const saleDate = new Date();
      saleDate.setDate(saleDate.getDate() - daysAgo);

      const items = medicines.map(med => ({
        medicine: med.medicine._id,
        quantity: med.quantity,
        unitType: med.unitType,
        unitPrice: med.unitType === 'strip' ? med.medicine.stripInfo.sellingPrice : med.medicine.individualInfo.sellingPrice,
        totalPrice: med.quantity * (med.unitType === 'strip' ? med.medicine.stripInfo.sellingPrice : med.medicine.individualInfo.sellingPrice)
      }));

      const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const gstAmount = subtotal * 0.18; // 18% GST
      const totalAmount = subtotal + gstAmount;

      let paidAmount = totalAmount;
      if (paymentStatus === 'pending') paidAmount = 0;
      if (paymentStatus === 'partial') paidAmount = totalAmount * 0.6; // 60% paid

      return {
        store: demoStore._id,
        customer: customer._id,
        items: items,
        subtotal: subtotal,
        gstAmount: gstAmount,
        totalAmount: totalAmount,
        paymentMethod: paymentMethod,
        paymentStatus: paymentStatus,
        paidAmount: paidAmount,
        balanceAmount: totalAmount - paidAmount,
        prescription: doctor ? {
          doctor: doctor._id,
          prescriptionDate: saleDate,
          notes: `Prescribed by ${doctor.name}`
        } : null,
        createdBy: storeManager._id,
        createdAt: saleDate,
        updatedAt: saleDate
      };
    };

    // Create various sales scenarios for comprehensive testing
    const salesScenarios = [
      // Recent sales with different doctors and payment statuses
      { customer: createdCustomers[0], doctor: createdDoctors[0], medicines: [{ medicine: createdMedicines[0], quantity: 2, unitType: 'strip' }], paymentStatus: 'paid', paymentMethod: 'cash', daysAgo: 1 },
      { customer: createdCustomers[1], doctor: createdDoctors[1], medicines: [{ medicine: createdMedicines[1], quantity: 1, unitType: 'strip' }], paymentStatus: 'pending', paymentMethod: 'credit', daysAgo: 2 },
      { customer: createdCustomers[2], doctor: createdDoctors[2], medicines: [{ medicine: createdMedicines[2], quantity: 1, unitType: 'individual' }], paymentStatus: 'paid', paymentMethod: 'upi', daysAgo: 3 },
      { customer: createdCustomers[3], doctor: null, medicines: [{ medicine: createdMedicines[3], quantity: 1, unitType: 'strip' }], paymentStatus: 'partial', paymentMethod: 'card', daysAgo: 4 },
      { customer: createdCustomers[4], doctor: createdDoctors[3], medicines: [{ medicine: createdMedicines[4], quantity: 2, unitType: 'individual' }], paymentStatus: 'paid', paymentMethod: 'cash', daysAgo: 5 },

      // Week-old sales
      { customer: createdCustomers[0], doctor: createdDoctors[1], medicines: [{ medicine: createdMedicines[0], quantity: 3, unitType: 'individual' }], paymentStatus: 'pending', paymentMethod: 'credit', daysAgo: 7 },
      { customer: createdCustomers[5], doctor: createdDoctors[0], medicines: [{ medicine: createdMedicines[1], quantity: 1, unitType: 'strip' }], paymentStatus: 'paid', paymentMethod: 'upi', daysAgo: 8 },
      { customer: createdCustomers[1], doctor: null, medicines: [{ medicine: createdMedicines[2], quantity: 2, unitType: 'individual' }], paymentStatus: 'paid', paymentMethod: 'cash', daysAgo: 9 },
      { customer: createdCustomers[2], doctor: createdDoctors[2], medicines: [{ medicine: createdMedicines[3], quantity: 1, unitType: 'strip' }], paymentStatus: 'partial', paymentMethod: 'card', daysAgo: 10 },

      // Two weeks old sales
      { customer: createdCustomers[3], doctor: createdDoctors[3], medicines: [{ medicine: createdMedicines[4], quantity: 1, unitType: 'strip' }], paymentStatus: 'paid', paymentMethod: 'cash', daysAgo: 14 },
      { customer: createdCustomers[4], doctor: createdDoctors[0], medicines: [{ medicine: createdMedicines[0], quantity: 2, unitType: 'strip' }], paymentStatus: 'pending', paymentMethod: 'credit', daysAgo: 15 },
      { customer: createdCustomers[5], doctor: null, medicines: [{ medicine: createdMedicines[1], quantity: 5, unitType: 'individual' }], paymentStatus: 'paid', paymentMethod: 'upi', daysAgo: 16 },

      // Month-old sales
      { customer: createdCustomers[0], doctor: createdDoctors[1], medicines: [{ medicine: createdMedicines[2], quantity: 1, unitType: 'individual' }], paymentStatus: 'paid', paymentMethod: 'card', daysAgo: 30 },
      { customer: createdCustomers[1], doctor: createdDoctors[2], medicines: [{ medicine: createdMedicines[3], quantity: 2, unitType: 'strip' }], paymentStatus: 'partial', paymentMethod: 'cash', daysAgo: 32 },
      { customer: createdCustomers[2], doctor: null, medicines: [{ medicine: createdMedicines[4], quantity: 1, unitType: 'individual' }], paymentStatus: 'pending', paymentMethod: 'credit', daysAgo: 35 }
    ];

    // Generate sales data one by one to avoid receipt number conflicts
    const createdSales = [];
    for (const scenario of salesScenarios) {
      const saleData = createSaleData(
        scenario.customer,
        scenario.doctor,
        scenario.medicines,
        scenario.paymentStatus,
        scenario.paymentMethod,
        scenario.daysAgo
      );

      try {
        const sale = await Sale.create(saleData);
        createdSales.push(sale);
        console.log(`✅ Created sale ${sale.receiptNumber}`);
      } catch (error) {
        console.error(`❌ Error creating sale:`, error.message);
      }
    }

    console.log(`✅ Created ${createdSales.length} sales records`);

    console.log('\n🎉 Demo sales data seeded successfully!');
    console.log('\n📋 Demo Store Login Credentials:');
    console.log('='.repeat(50));
    console.log('STORE MANAGER LOGIN:');
    console.log('Email: manager@some-pharmacy.com');
    console.log('Password: manager123');
    console.log('Store: Some (ST9508)');
    console.log('='.repeat(50));
    console.log('\n🧪 Test Data Summary:');
    console.log(`• Store: ${demoStore.name} (${demoStore.code})`);
    console.log(`• Medicines: ${createdMedicines.length}`);
    console.log(`• Doctors: ${createdDoctors.length}`);
    console.log(`• Customers: ${createdCustomers.length}`);
    console.log(`• Sales: ${createdSales.length}`);
    console.log('\n🔍 Filter Test Scenarios Available:');
    console.log('• Doctor Name: Dr. Rajesh Kumar, Dr. Priya Sharma, Dr. Amit Patel, Dr. Sunita Joshi');
    console.log('• Customer Name: Rahul Gupta, Sneha Patel, Arjun Singh, Kavya Sharma, Vikram Joshi, Meera Reddy');
    console.log('• Phone Numbers: +91-9876543230 to +91-9876543235');
    console.log('• Payment Status: Paid, Credit (Pending/Partial)');
    console.log('• Date Range: Last 35 days with various dates');

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding demo sales data:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the seeding function if this file is executed directly
if (require.main === module) {
  seedDemoSalesData();
}

module.exports = seedDemoSalesData;

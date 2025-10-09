require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const User = require('../models/User');
const Store = require('../models/Store');
const Medicine = require('../models/Medicine');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');

const seedSuppliersAndPurchases = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find existing demo store or create one
    let demoStore = await Store.findOne({ code: 'ST9508' });
    let storeManager;

    if (!demoStore) {
      console.log('❌ Demo store not found. Please run the main seed script first.');
      console.log('Run: npm run seed');
      process.exit(1);
    }

    // Find store manager
    storeManager = await User.findOne({ 
      email: 'manager@some-pharmacy.com',
      role: 'store_manager' 
    });

    if (!storeManager) {
      console.log('❌ Store manager not found. Please run the main seed script first.');
      process.exit(1);
    }

    console.log(`✅ Found demo store: ${demoStore.name} (${demoStore.code})`);
    console.log(`✅ Found store manager: ${storeManager.name}`);

    // Clear existing suppliers and purchases for this store
    console.log('🧹 Clearing existing suppliers and purchases...');
    await Purchase.deleteMany({ store: demoStore._id });
    await Supplier.deleteMany({ store: demoStore._id });

    // Create demo suppliers
    console.log('🏢 Creating demo suppliers...');
    const suppliersData = [
      {
        name: 'MediCorp Pharmaceuticals',
        contactPerson: 'Rajesh Kumar',
        phone: '+91-9876543210',
        email: 'rajesh@medicorp.com',
        address: {
          street: '123 Industrial Area, Phase 1',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India'
        },
        gstNumber: '27ABCDE1234F1Z5',
        panNumber: 'ABCDE1234F',
        licenseNumber: 'MH-DL-001',
        paymentTerms: '30 days',
        creditLimit: 500000,
        notes: 'Primary supplier for general medicines',
        isActive: true,
        store: demoStore._id,
        addedBy: storeManager._id
      },
      {
        name: 'HealthPlus Distributors',
        contactPerson: 'Priya Sharma',
        phone: '+91-9876543211',
        email: 'priya@healthplus.com',
        address: {
          street: '456 Medical Complex, Sector 2',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001',
          country: 'India'
        },
        gstNumber: '07FGHIJ5678K2L6',
        panNumber: 'FGHIJ5678K',
        licenseNumber: 'DL-DL-002',
        paymentTerms: '45 days',
        creditLimit: 300000,
        notes: 'Specialized in cardiac and diabetic medicines',
        isActive: true,
        store: demoStore._id,
        addedBy: storeManager._id
      },
      {
        name: 'Global Pharma Solutions',
        contactPerson: 'Amit Patel',
        phone: '+91-9876543212',
        email: 'amit@globalpharma.com',
        address: {
          street: '789 Pharma Park, Block A',
          city: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380001',
          country: 'India'
        },
        gstNumber: '24MNOPQ9012R3S7',
        panNumber: 'MNOPQ9012R',
        licenseNumber: 'GJ-DL-003',
        paymentTerms: '60 days',
        creditLimit: 750000,
        notes: 'International brands and specialty medicines',
        isActive: true,
        store: demoStore._id,
        addedBy: storeManager._id
      },
      {
        name: 'QuickMed Supplies',
        contactPerson: 'Sunita Joshi',
        phone: '+91-9876543213',
        email: 'sunita@quickmed.com',
        address: {
          street: '321 Supply Chain Hub',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          country: 'India'
        },
        gstNumber: '27TUVWX3456Y4Z8',
        panNumber: 'TUVWX3456Y',
        licenseNumber: 'MH-DL-004',
        paymentTerms: '15 days',
        creditLimit: 200000,
        notes: 'Fast delivery, emergency supplies',
        isActive: true,
        store: demoStore._id,
        addedBy: storeManager._id
      },
      {
        name: 'BioMed Enterprises',
        contactPerson: 'Vikram Singh',
        phone: '+91-9876543214',
        email: 'vikram@biomed.com',
        address: {
          street: '654 Bio Park, Zone 3',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
          country: 'India'
        },
        gstNumber: '29ABCXY7890Z1A2',
        panNumber: 'ABCXY7890Z',
        licenseNumber: 'KA-DL-005',
        paymentTerms: '30 days',
        creditLimit: 400000,
        notes: 'Biotechnology and advanced medicines',
        isActive: true,
        store: demoStore._id,
        addedBy: storeManager._id
      }
    ];

    const createdSuppliers = await Supplier.create(suppliersData);
    console.log(`✅ Created ${createdSuppliers.length} suppliers`);

    // Get some existing medicines from the store
    const existingMedicines = await Medicine.find({ 
      store: demoStore._id,
      isActive: true 
    }).limit(10);

    if (existingMedicines.length === 0) {
      console.log('⚠️ No medicines found. Creating some basic medicines first...');
      
      // Create basic medicines for purchase orders
      const basicMedicines = [
        {
          name: 'Paracetamol 500mg',
          genericName: 'Acetaminophen',
          composition: 'Paracetamol 500mg',
          manufacturer: 'Cipla Ltd',
          category: 'Tablet',
          form: 'Tablet',
          type: 'over-the-counter',
          unitTypes: { hasStrips: true, hasIndividual: true, unitsPerStrip: 10 },
          stripInfo: { purchasePrice: 15, sellingPrice: 20, mrp: 25, stock: 50, minStock: 10, reorderLevel: 20 },
          individualInfo: { purchasePrice: 1.5, sellingPrice: 2, mrp: 2.5, stock: 500, minStock: 100, reorderLevel: 200 },
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
          stripInfo: { purchasePrice: 45, sellingPrice: 55, mrp: 65, stock: 30, minStock: 5, reorderLevel: 15 },
          individualInfo: { purchasePrice: 4.5, sellingPrice: 5.5, mrp: 6.5, stock: 300, minStock: 50, reorderLevel: 150 },
          isActive: true,
          store: demoStore._id,
          createdBy: storeManager._id
        },
        {
          name: 'Crocin Advance 500mg',
          genericName: 'Paracetamol',
          composition: 'Paracetamol 500mg',
          manufacturer: 'GSK',
          category: 'Tablet',
          form: 'Tablet',
          type: 'over-the-counter',
          unitTypes: { hasStrips: true, hasIndividual: true, unitsPerStrip: 15 },
          stripInfo: { purchasePrice: 25, sellingPrice: 32, mrp: 40, stock: 25, minStock: 8, reorderLevel: 18 },
          individualInfo: { purchasePrice: 1.67, sellingPrice: 2.13, mrp: 2.67, stock: 375, minStock: 120, reorderLevel: 270 },
          isActive: true,
          store: demoStore._id,
          createdBy: storeManager._id
        }
      ];

      const createdMedicines = await Medicine.create(basicMedicines);
      existingMedicines.push(...createdMedicines);
      console.log(`✅ Created ${createdMedicines.length} basic medicines`);
    }

    console.log('📦 Creating demo purchase orders...');
    
    // Create purchase orders with different statuses and scenarios
    const purchaseOrdersData = [];
    
    // Purchase Order 1 - Recent completed order
    purchaseOrdersData.push({
      store: demoStore._id,
      supplier: createdSuppliers[0]._id, // MediCorp Pharmaceuticals
      purchaseOrderNumber: 'PO-2024-001',
      invoiceNumber: 'INV-MC-001',
      items: [
        {
          medicine: existingMedicines[0]._id,
          medicineName: existingMedicines[0].name,
          manufacturer: existingMedicines[0].manufacturer,
          quantity: 50,
          unitType: 'strip',
          unitCost: 15,
          totalCost: 750,
          discount: 5,
          discountAmount: 37.5,
          taxRate: 18,
          taxAmount: 128.25,
          netAmount: 840.75
        },
        {
          medicine: existingMedicines[1]._id,
          medicineName: existingMedicines[1].name,
          manufacturer: existingMedicines[1].manufacturer,
          quantity: 30,
          unitType: 'strip',
          unitCost: 45,
          totalCost: 1350,
          discount: 3,
          discountAmount: 40.5,
          taxRate: 18,
          taxAmount: 235.71,
          netAmount: 1545.21
        }
      ],
      subtotal: 2100,
      totalDiscount: 77.5,
      totalTax: 363.96,
      totalAmount: 2385.96,
      paymentMethod: 'credit',
      paymentTerms: '30 days',
      paymentStatus: 'paid',
      paidAmount: 2385.96,
      status: 'completed',
      inventoryUpdated: true,
      purchaseDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      orderDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      expectedDeliveryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      receivedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      createdBy: storeManager._id,
      receivedBy: storeManager._id,
      notes: 'Regular monthly stock replenishment',
      fiscalYear: '2024-25',
      quarter: 'Q3',
      month: 'October'
    });

    // Purchase Order 2 - Pending delivery
    purchaseOrdersData.push({
      store: demoStore._id,
      supplier: createdSuppliers[1]._id, // HealthPlus Distributors
      purchaseOrderNumber: 'PO-2024-002',
      invoiceNumber: 'INV-HP-002',
      items: [
        {
          medicine: existingMedicines[2]._id,
          medicineName: existingMedicines[2].name,
          manufacturer: existingMedicines[2].manufacturer,
          quantity: 40,
          unitType: 'strip',
          unitCost: 25,
          totalCost: 1000,
          discount: 2,
          discountAmount: 20,
          taxRate: 18,
          taxAmount: 176.4,
          netAmount: 1156.4
        }
      ],
      subtotal: 1000,
      totalDiscount: 20,
      totalTax: 176.4,
      totalAmount: 1156.4,
      paymentMethod: 'credit',
      paymentTerms: '45 days',
      paymentStatus: 'pending',
      paidAmount: 0,
      balanceAmount: 1156.4,
      status: 'shipped',
      inventoryUpdated: false,
      purchaseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      createdBy: storeManager._id,
      notes: 'Specialty medicines order',
      fiscalYear: '2024-25',
      quarter: 'Q3',
      month: 'October'
    });

    // Purchase Order 3 - Draft order (just created)
    purchaseOrdersData.push({
      store: demoStore._id,
      supplier: createdSuppliers[2]._id, // Global Pharma Solutions
      purchaseOrderNumber: 'PO-2024-003',
      items: [
        {
          medicine: existingMedicines[0]._id,
          medicineName: existingMedicines[0].name,
          manufacturer: existingMedicines[0].manufacturer,
          quantity: 100,
          unitType: 'strip',
          unitCost: 15,
          totalCost: 1500,
          discount: 8,
          discountAmount: 120,
          taxRate: 18,
          taxAmount: 248.4,
          netAmount: 1628.4
        },
        {
          medicine: existingMedicines[1]._id,
          medicineName: existingMedicines[1].name,
          manufacturer: existingMedicines[1].manufacturer,
          quantity: 60,
          unitType: 'strip',
          unitCost: 45,
          totalCost: 2700,
          discount: 5,
          discountAmount: 135,
          taxRate: 18,
          taxAmount: 461.7,
          netAmount: 3026.7
        }
      ],
      subtotal: 4200,
      totalDiscount: 255,
      totalTax: 710.1,
      totalAmount: 4655.1,
      paymentMethod: 'credit',
      paymentTerms: '60 days',
      paymentStatus: 'pending',
      paidAmount: 0,
      balanceAmount: 4655.1,
      status: 'draft',
      inventoryUpdated: false,
      purchaseDate: new Date(),
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdBy: storeManager._id,
      notes: 'Bulk order for international brands',
      fiscalYear: '2024-25',
      quarter: 'Q3',
      month: 'October'
    });

    // Purchase Order 4 - Partial payment
    purchaseOrdersData.push({
      store: demoStore._id,
      supplier: createdSuppliers[3]._id, // QuickMed Supplies
      purchaseOrderNumber: 'PO-2024-004',
      invoiceNumber: 'INV-QM-004',
      items: [
        {
          medicine: existingMedicines[2]._id,
          medicineName: existingMedicines[2].name,
          manufacturer: existingMedicines[2].manufacturer,
          quantity: 25,
          unitType: 'strip',
          unitCost: 25,
          totalCost: 625,
          discount: 0,
          discountAmount: 0,
          taxRate: 18,
          taxAmount: 112.5,
          netAmount: 737.5
        }
      ],
      subtotal: 625,
      totalDiscount: 0,
      totalTax: 112.5,
      totalAmount: 737.5,
      paymentMethod: 'credit',
      paymentTerms: '15 days',
      paymentStatus: 'partial',
      paidAmount: 400,
      balanceAmount: 337.5,
      status: 'received',
      inventoryUpdated: true,
      purchaseDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
      orderDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      expectedDeliveryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
      receivedDate: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
      createdBy: storeManager._id,
      receivedBy: storeManager._id,
      notes: 'Emergency supply order',
      fiscalYear: '2024-25',
      quarter: 'Q3',
      month: 'October'
    });

    // Purchase Order 5 - Overdue payment
    purchaseOrdersData.push({
      store: demoStore._id,
      supplier: createdSuppliers[4]._id, // BioMed Enterprises
      purchaseOrderNumber: 'PO-2024-005',
      invoiceNumber: 'INV-BM-005',
      items: [
        {
          medicine: existingMedicines[1]._id,
          medicineName: existingMedicines[1].name,
          manufacturer: existingMedicines[1].manufacturer,
          quantity: 20,
          unitType: 'strip',
          unitCost: 45,
          totalCost: 900,
          discount: 10,
          discountAmount: 90,
          taxRate: 18,
          taxAmount: 145.8,
          netAmount: 955.8
        }
      ],
      subtotal: 900,
      totalDiscount: 90,
      totalTax: 145.8,
      totalAmount: 955.8,
      paymentMethod: 'credit',
      paymentTerms: '30 days',
      paymentStatus: 'overdue',
      paidAmount: 0,
      balanceAmount: 955.8,
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days overdue
      status: 'completed',
      inventoryUpdated: true,
      purchaseDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
      orderDate: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000),
      expectedDeliveryDate: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(Date.now() - 37 * 24 * 60 * 60 * 1000),
      receivedDate: new Date(Date.now() - 37 * 24 * 60 * 60 * 1000),
      createdBy: storeManager._id,
      receivedBy: storeManager._id,
      notes: 'Biotechnology medicines - payment overdue',
      fiscalYear: '2024-25',
      quarter: 'Q2',
      month: 'September'
    });

    // Create the purchase orders
    const createdPurchases = await Purchase.create(purchaseOrdersData);
    console.log(`✅ Created ${createdPurchases.length} purchase orders`);

    console.log('\n🎉 Demo suppliers and purchases seeded successfully!');
    console.log('\n📋 Demo Data Summary:');
    console.log('='.repeat(50));
    console.log(`• Store: ${demoStore.name} (${demoStore.code})`);
    console.log(`• Suppliers: ${createdSuppliers.length}`);
    console.log(`• Purchase Orders: ${createdPurchases.length}`);
    console.log(`• Medicines: ${existingMedicines.length}`);
    
    console.log('\n🏢 Created Suppliers:');
    createdSuppliers.forEach((supplier, index) => {
      console.log(`${index + 1}. ${supplier.name} - ${supplier.contactPerson} (${supplier.phone})`);
    });

    console.log('\n📦 Created Purchase Orders:');
    createdPurchases.forEach((purchase, index) => {
      console.log(`${index + 1}. ${purchase.purchaseOrderNumber} - ₹${purchase.totalAmount} (${purchase.status})`);
    });

    console.log('\n🔑 Login Credentials:');
    console.log('Email: manager@some-pharmacy.com');
    console.log('Password: manager123');
    console.log('Store: Some (ST9508)');

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding suppliers and purchases:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the seeding function if this file is executed directly
if (require.main === module) {
  seedSuppliersAndPurchases();
}

module.exports = seedSuppliersAndPurchases;

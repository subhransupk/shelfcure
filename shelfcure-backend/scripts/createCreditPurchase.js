require('dotenv').config();
const mongoose = require('mongoose');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const SupplierTransaction = require('../models/SupplierTransaction');
const Store = require('../models/Store');
const User = require('../models/User');
const Medicine = require('../models/Medicine');

async function createCreditPurchase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the demo store and manager
    const demoStore = await Store.findOne({ code: 'ST9508' });
    const storeManager = await User.findOne({ email: 'manager@some-pharmacy.com' });
    
    if (!demoStore || !storeManager) {
      console.log('❌ Demo store or manager not found');
      return;
    }

    console.log(`✅ Found demo store: ${demoStore.name} (${demoStore.code})`);
    console.log(`✅ Found store manager: ${storeManager.name}`);

    // Find a supplier with no outstanding balance
    const supplier = await Supplier.findOne({ 
      store: demoStore._id, 
      name: 'HealthPlus Distributors' 
    });

    if (!supplier) {
      console.log('❌ HealthPlus Distributors supplier not found');
      return;
    }

    console.log(`✅ Found supplier: ${supplier.name}`);
    console.log(`   Current Outstanding Balance: ₹${supplier.outstandingBalance}`);

    // Find some medicines
    const medicines = await Medicine.find({ 
      store: demoStore._id,
      isActive: true 
    }).limit(2);

    if (medicines.length === 0) {
      console.log('❌ No medicines found');
      return;
    }

    console.log(`✅ Found ${medicines.length} medicines`);

    // Create a credit purchase
    const purchaseItems = medicines.map((medicine, index) => ({
      medicine: medicine._id,
      medicineName: medicine.name,
      manufacturer: medicine.manufacturer,
      quantity: 10 + (index * 5),
      unitType: 'strip',
      unitCost: 25 + (index * 10),
      totalCost: (10 + (index * 5)) * (25 + (index * 10)),
      discount: 5,
      discountAmount: ((10 + (index * 5)) * (25 + (index * 10))) * 0.05,
      taxRate: 18,
      taxAmount: (((10 + (index * 5)) * (25 + (index * 10))) * 0.95) * 0.18,
      netAmount: (((10 + (index * 5)) * (25 + (index * 10))) * 0.95) * 1.18
    }));

    const subtotal = purchaseItems.reduce((sum, item) => sum + item.totalCost, 0);
    const totalDiscount = purchaseItems.reduce((sum, item) => sum + item.discountAmount, 0);
    const totalTax = purchaseItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal - totalDiscount + totalTax;

    console.log(`💰 Creating credit purchase for ₹${totalAmount.toFixed(2)}`);

    const purchaseData = {
      store: demoStore._id,
      supplier: supplier._id,
      purchaseOrderNumber: `PO-CREDIT-${Date.now()}`,
      invoiceNumber: `INV-CREDIT-${Date.now()}`,
      items: purchaseItems,
      subtotal,
      totalDiscount,
      totalTax,
      totalAmount,
      paymentMethod: 'credit',
      paymentTerms: supplier.paymentTerms,
      creditAmount: totalAmount,
      balanceAmount: totalAmount,
      status: 'completed',
      inventoryUpdated: false,
      purchaseDate: new Date(),
      orderDate: new Date(),
      createdBy: storeManager._id,
      notes: 'Test credit purchase to verify outstanding balance functionality'
    };

    const purchase = await Purchase.create(purchaseData);
    console.log(`✅ Created purchase: ${purchase.purchaseOrderNumber}`);

    // Create supplier transaction
    await SupplierTransaction.createTransaction({
      store: demoStore._id,
      supplier: supplier._id,
      transactionType: 'purchase_credit',
      amount: totalAmount,
      balanceChange: totalAmount,
      reference: {
        type: 'Purchase',
        id: purchase._id,
        number: purchase.purchaseOrderNumber
      },
      description: `Credit purchase - PO ${purchase.purchaseOrderNumber}`,
      notes: 'Test credit purchase',
      processedBy: storeManager._id
    });

    console.log(`💳 Created supplier credit transaction for ₹${totalAmount.toFixed(2)}`);

    // Update supplier stats
    await supplier.updatePurchaseStats();

    // Get updated supplier
    const updatedSupplier = await Supplier.findById(supplier._id);
    console.log(`✅ Updated supplier statistics:`);
    console.log(`   - Total Purchases: ${updatedSupplier.totalPurchases}`);
    console.log(`   - Total Purchase Amount: ₹${updatedSupplier.totalPurchaseAmount}`);
    console.log(`   - Outstanding Balance: ₹${updatedSupplier.outstandingBalance}`);

    console.log('\n🎉 Credit purchase created successfully!');
    console.log('Now you can test the frontend to see the outstanding balance indicator.');

  } catch (error) {
    console.error('❌ Error creating credit purchase:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

// Run the script
createCreditPurchase();

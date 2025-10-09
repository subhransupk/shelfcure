require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

// Import models
const User = require('../models/User');
const Store = require('../models/Store');
const Supplier = require('../models/Supplier');

const testSupplierRequirement = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find demo store and manager
    const demoStore = await Store.findOne({ code: 'ST9508' });
    const storeManager = await User.findOne({ 
      email: 'manager@some-pharmacy.com',
      role: 'store_manager' 
    });

    if (!demoStore || !storeManager) {
      console.log('❌ Demo data not found. Please run seed scripts first.');
      process.exit(1);
    }

    // Get a supplier for valid test
    const supplier = await Supplier.findOne({ store: demoStore._id });
    
    if (!supplier) {
      console.log('❌ No suppliers found. Please run seed-suppliers script first.');
      process.exit(1);
    }

    console.log(`✅ Found demo store: ${demoStore.name}`);
    console.log(`✅ Found store manager: ${storeManager.name}`);
    console.log(`✅ Found supplier: ${supplier.name}`);

    // Login to get token
    console.log('\n🔐 Logging in as store manager...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'manager@some-pharmacy.com',
      password: 'manager123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Test 1: Try to create purchase order WITHOUT supplier (should fail)
    console.log('\n🧪 Test 1: Creating purchase order WITHOUT supplier (should fail)...');
    try {
      const invalidPurchaseData = {
        // supplier: supplier._id, // Intentionally omitted
        purchaseOrderNumber: 'TEST-PO-001',
        items: [
          {
            medicineName: 'Test Medicine',
            quantity: 10,
            unitCost: 50,
            totalCost: 500,
            netAmount: 500
          }
        ],
        subtotal: 500,
        totalAmount: 500,
        paymentMethod: 'cash'
      };

      await axios.post('http://localhost:5000/api/store-manager/purchases', invalidPurchaseData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('❌ Test 1 FAILED: Purchase order was created without supplier (this should not happen)');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Test 1 PASSED: Purchase order creation failed as expected');
        console.log(`   Error message: ${error.response.data.message || error.response.data.errors?.[0]?.msg}`);
      } else {
        console.log('❌ Test 1 FAILED: Unexpected error:', error.message);
      }
    }

    // Test 2: Try to create purchase order WITH supplier (should succeed)
    console.log('\n🧪 Test 2: Creating purchase order WITH supplier (should succeed)...');
    try {
      const validPurchaseData = {
        supplier: supplier._id, // Valid supplier ID
        purchaseOrderNumber: 'TEST-PO-002',
        items: [
          {
            medicineName: 'Test Medicine',
            quantity: 10,
            unitCost: 50,
            totalCost: 500,
            netAmount: 500
          }
        ],
        subtotal: 500,
        totalAmount: 500,
        paymentMethod: 'cash'
      };

      const response = await axios.post('http://localhost:5000/api/store-manager/purchases', validPurchaseData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Test 2 PASSED: Purchase order created successfully with supplier');
      console.log(`   Purchase Order ID: ${response.data.purchase._id}`);
      console.log(`   Purchase Order Number: ${response.data.purchase.purchaseOrderNumber}`);
    } catch (error) {
      console.log('❌ Test 2 FAILED: Purchase order creation failed unexpectedly');
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }

    // Test 3: Try with invalid supplier ID (should fail)
    console.log('\n🧪 Test 3: Creating purchase order with INVALID supplier ID (should fail)...');
    try {
      const invalidSupplierData = {
        supplier: '507f1f77bcf86cd799439011', // Invalid ObjectId
        purchaseOrderNumber: 'TEST-PO-003',
        items: [
          {
            medicineName: 'Test Medicine',
            quantity: 10,
            unitCost: 50,
            totalCost: 500,
            netAmount: 500
          }
        ],
        subtotal: 500,
        totalAmount: 500,
        paymentMethod: 'cash'
      };

      await axios.post('http://localhost:5000/api/store-manager/purchases', invalidSupplierData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('❌ Test 3 FAILED: Purchase order was created with invalid supplier (this should not happen)');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Test 3 PASSED: Purchase order creation failed as expected');
        console.log(`   Error message: ${error.response.data.message}`);
      } else {
        console.log('❌ Test 3 FAILED: Unexpected error:', error.message);
      }
    }

    console.log('\n🎉 Supplier requirement testing completed!');
    console.log('\n📋 Summary:');
    console.log('• Test 1: Purchase without supplier - Should fail ✓');
    console.log('• Test 2: Purchase with valid supplier - Should succeed ✓');
    console.log('• Test 3: Purchase with invalid supplier - Should fail ✓');

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error testing supplier requirement:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the test function if this file is executed directly
if (require.main === module) {
  testSupplierRequirement();
}

module.exports = testSupplierRequirement;

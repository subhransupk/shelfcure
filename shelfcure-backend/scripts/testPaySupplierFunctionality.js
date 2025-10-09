require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

// Import models
const User = require('../models/User');
const Store = require('../models/Store');
const Purchase = require('../models/Purchase');
const Supplier = require('../models/Supplier');
const SupplierTransaction = require('../models/SupplierTransaction');

const testPaySupplierFunctionality = async () => {
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

    // Find a purchase with pending/partial payment
    const purchaseWithBalance = await Purchase.findOne({ 
      store: demoStore._id,
      paymentStatus: { $in: ['pending', 'partial', 'overdue'] },
      $or: [
        { balanceAmount: { $gt: 0 } },
        { creditAmount: { $gt: 0 } }
      ]
    }).populate('supplier', 'name');

    if (!purchaseWithBalance) {
      console.log('❌ No purchases with outstanding balance found. Please run seed-suppliers script first.');
      process.exit(1);
    }

    console.log(`✅ Found demo store: ${demoStore.name}`);
    console.log(`✅ Found store manager: ${storeManager.name}`);
    console.log(`✅ Found purchase with balance: ${purchaseWithBalance.purchaseOrderNumber}`);
    console.log(`   Supplier: ${purchaseWithBalance.supplier?.name || 'No supplier'}`);
    console.log(`   Total Amount: ₹${purchaseWithBalance.totalAmount}`);
    console.log(`   Paid Amount: ₹${purchaseWithBalance.paidAmount || 0}`);
    console.log(`   Balance Amount: ₹${purchaseWithBalance.balanceAmount || purchaseWithBalance.creditAmount || 0}`);
    console.log(`   Payment Status: ${purchaseWithBalance.paymentStatus}`);

    // Login to get token
    console.log('\n🔐 Logging in as store manager...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'manager@some-pharmacy.com',
      password: 'manager123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Test 1: Make a partial payment
    console.log('\n🧪 Test 1: Making partial payment...');
    const outstandingAmount = purchaseWithBalance.balanceAmount || purchaseWithBalance.creditAmount || 0;
    const partialPaymentAmount = Math.min(500, outstandingAmount / 2); // Pay half or ₹500, whichever is smaller

    try {
      const paymentData = {
        amount: partialPaymentAmount,
        paymentMethod: 'cash',
        notes: 'Test partial payment'
      };

      const response = await axios.post(
        `http://localhost:5000/api/store-manager/purchases/${purchaseWithBalance._id}/payment`, 
        paymentData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('✅ Test 1 PASSED: Partial payment recorded successfully');
      console.log(`   Payment Amount: ₹${response.data.data.paymentAmount}`);
      console.log(`   New Balance: ₹${response.data.data.newBalance}`);
      console.log(`   Payment Status: ${response.data.data.paymentStatus}`);

      // Test 2: Try to pay more than outstanding balance (should fail)
      console.log('\n🧪 Test 2: Trying to pay more than outstanding balance (should fail)...');
      try {
        const excessPaymentData = {
          amount: response.data.data.newBalance + 1000, // More than remaining balance
          paymentMethod: 'cash',
          notes: 'Test excess payment'
        };

        await axios.post(
          `http://localhost:5000/api/store-manager/purchases/${purchaseWithBalance._id}/payment`, 
          excessPaymentData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        console.log('❌ Test 2 FAILED: Excess payment was accepted (this should not happen)');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          console.log('✅ Test 2 PASSED: Excess payment rejected as expected');
          console.log(`   Error message: ${error.response.data.message}`);
        } else {
          console.log('❌ Test 2 FAILED: Unexpected error:', error.message);
        }
      }

      // Test 3: Complete the payment
      if (response.data.data.newBalance > 0) {
        console.log('\n🧪 Test 3: Completing the payment...');
        try {
          const finalPaymentData = {
            amount: response.data.data.newBalance,
            paymentMethod: 'upi',
            transactionId: 'UPI123456789',
            notes: 'Final payment to complete purchase'
          };

          const finalResponse = await axios.post(
            `http://localhost:5000/api/store-manager/purchases/${purchaseWithBalance._id}/payment`, 
            finalPaymentData,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          console.log('✅ Test 3 PASSED: Final payment recorded successfully');
          console.log(`   Payment Amount: ₹${finalResponse.data.data.paymentAmount}`);
          console.log(`   New Balance: ₹${finalResponse.data.data.newBalance}`);
          console.log(`   Payment Status: ${finalResponse.data.data.paymentStatus}`);
        } catch (error) {
          console.log('❌ Test 3 FAILED: Final payment failed');
          console.log(`   Error: ${error.response?.data?.message || error.message}`);
        }
      } else {
        console.log('\n✅ Purchase is already fully paid after partial payment');
      }

    } catch (error) {
      console.log('❌ Test 1 FAILED: Partial payment failed');
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n🎉 Pay Supplier functionality testing completed!');
    console.log('\n📋 Summary:');
    console.log('• Test 1: Partial payment - Should succeed ✓');
    console.log('• Test 2: Excess payment - Should fail ✓');
    console.log('• Test 3: Final payment - Should succeed ✓');

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error testing Pay Supplier functionality:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the test function if this file is executed directly
if (require.main === module) {
  testPaySupplierFunctionality();
}

module.exports = testPaySupplierFunctionality;

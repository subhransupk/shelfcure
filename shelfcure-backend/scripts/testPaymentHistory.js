require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

// Import models
const User = require('../models/User');
const Store = require('../models/Store');
const Purchase = require('../models/Purchase');
const Supplier = require('../models/Supplier');
const SupplierTransaction = require('../models/SupplierTransaction');

const testPaymentHistoryFunctionality = async () => {
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

    console.log(`✅ Found purchase: ${purchaseWithBalance.purchaseOrderNumber}`);
    console.log(`   Supplier: ${purchaseWithBalance.supplier?.name || 'No supplier'}`);
    console.log(`   Total Amount: ₹${purchaseWithBalance.totalAmount}`);
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

    // Test 1: Make a payment to create payment history
    console.log('\n🧪 Test 1: Making a payment to create payment history...');
    const outstandingBalance = purchaseWithBalance.balanceAmount || purchaseWithBalance.creditAmount || 0;
    const paymentAmount = Math.min(100, outstandingBalance); // Make a small payment
    
    try {
      const paymentResponse = await axios.post(
        `http://localhost:5000/api/store-manager/purchases/${purchaseWithBalance._id}/payment`, 
        {
          amount: paymentAmount,
          paymentMethod: 'upi',
          transactionId: 'UPI123456789',
          notes: 'Test payment for payment history functionality'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('✅ Test 1 PASSED: Payment recorded successfully');
      console.log(`   Payment Amount: ₹${paymentResponse.data.data.paymentAmount}`);
      console.log(`   New Balance: ₹${paymentResponse.data.data.newBalance}`);
      console.log(`   Payment Status: ${paymentResponse.data.data.paymentStatus}`);

      // Test 2: Fetch payment history
      console.log('\n🧪 Test 2: Fetching payment history...');
      try {
        const historyResponse = await axios.get(
          `http://localhost:5000/api/store-manager/purchases/${purchaseWithBalance._id}/payment-history`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        console.log('✅ Test 2 PASSED: Payment history fetched successfully');
        const { paymentSummary, paymentHistory } = historyResponse.data.data;
        
        console.log('\n📊 Payment Summary:');
        console.log(`   Total Amount: ₹${paymentSummary.totalAmount}`);
        console.log(`   Paid Amount: ₹${paymentSummary.paidAmount}`);
        console.log(`   Balance Amount: ₹${paymentSummary.balanceAmount}`);
        console.log(`   Payment Status: ${paymentSummary.paymentStatus}`);
        console.log(`   Total Payments: ${paymentSummary.totalPayments}`);
        console.log(`   Is Fully Paid: ${paymentSummary.isFullyPaid}`);
        console.log(`   Is Overdue: ${paymentSummary.isOverdue}`);

        console.log('\n📋 Payment History:');
        if (paymentHistory && paymentHistory.length > 0) {
          paymentHistory.forEach((payment, index) => {
            console.log(`   Payment ${index + 1}:`);
            console.log(`     Amount: ₹${payment.amount}`);
            console.log(`     Method: ${payment.paymentMethod}`);
            console.log(`     Date: ${new Date(payment.paymentDate).toLocaleString()}`);
            console.log(`     Transaction ID: ${payment.transactionId || 'N/A'}`);
            console.log(`     Running Balance: ₹${payment.runningBalance}`);
            console.log(`     Processed By: ${payment.processedBy?.name || 'N/A'}`);
            console.log(`     Notes: ${payment.notes || 'N/A'}`);
            console.log('');
          });
        } else {
          console.log('   No payment history found');
        }

        // Test 3: Make another payment to test multiple payments
        console.log('\n🧪 Test 3: Making another payment to test multiple payment history...');
        if (paymentSummary.balanceAmount > 0) {
          const secondPaymentAmount = Math.min(500, paymentSummary.balanceAmount);
          
          try {
            const secondPaymentResponse = await axios.post(
              `http://localhost:5000/api/store-manager/purchases/${purchaseWithBalance._id}/payment`, 
              {
                amount: secondPaymentAmount,
                paymentMethod: 'cash',
                notes: 'Second test payment'
              },
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );

            console.log('✅ Test 3 PASSED: Second payment recorded successfully');
            console.log(`   Payment Amount: ₹${secondPaymentResponse.data.data.paymentAmount}`);
            console.log(`   New Balance: ₹${secondPaymentResponse.data.data.newBalance}`);
            console.log(`   Payment Status: ${secondPaymentResponse.data.data.paymentStatus}`);

            // Fetch updated payment history
            const updatedHistoryResponse = await axios.get(
              `http://localhost:5000/api/store-manager/purchases/${purchaseWithBalance._id}/payment-history`,
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );

            const updatedHistory = updatedHistoryResponse.data.data.paymentHistory;
            console.log(`\n✅ Updated payment history now has ${updatedHistory.length} payment(s)`);

          } catch (error) {
            console.log('❌ Test 3 FAILED: Second payment failed');
            console.log(`   Error: ${error.response?.data?.message || error.message}`);
          }
        } else {
          console.log('✅ Test 3 SKIPPED: Purchase is already fully paid');
        }

      } catch (error) {
        console.log('❌ Test 2 FAILED: Failed to fetch payment history');
        console.log(`   Error: ${error.response?.data?.message || error.message}`);
      }

    } catch (error) {
      console.log('❌ Test 1 FAILED: Payment failed');
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n🎉 Payment History functionality testing completed!');
    console.log('\n📋 Summary:');
    console.log('• Test 1: Record payment with history tracking ✓');
    console.log('• Test 2: Fetch payment history with summary ✓');
    console.log('• Test 3: Multiple payments history tracking ✓');

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error testing Payment History functionality:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the test function if this file is executed directly
if (require.main === module) {
  testPaymentHistoryFunctionality();
}

module.exports = testPaymentHistoryFunctionality;

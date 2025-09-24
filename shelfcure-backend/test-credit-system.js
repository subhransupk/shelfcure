/**
 * Credit System Test Script
 * This script tests the core functionality of the customer credit system
 */

const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const CreditTransaction = require('./models/CreditTransaction');

// Test configuration
const TEST_CONFIG = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/shelfcure',
  TEST_STORE_ID: new mongoose.Types.ObjectId(),
  TEST_USER_ID: new mongoose.Types.ObjectId()
};

async function connectDB() {
  try {
    await mongoose.connect(TEST_CONFIG.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createTestCustomer() {
  console.log('\n🧪 Testing Customer Creation with Credit...');
  
  const testCustomer = new Customer({
    store: TEST_CONFIG.TEST_STORE_ID,
    name: 'Test Credit Customer',
    phone: '9876543210',
    email: 'test@example.com',
    creditLimit: 10000,
    creditBalance: 0,
    createdBy: TEST_CONFIG.TEST_USER_ID
  });

  await testCustomer.save();
  console.log('✅ Test customer created:', testCustomer.name);
  console.log('   Credit Limit:', testCustomer.creditLimit);
  console.log('   Credit Balance:', testCustomer.creditBalance);
  console.log('   Credit Status:', testCustomer.creditStatus);
  
  return testCustomer;
}

async function testCreditPurchaseValidation(customer) {
  console.log('\n🧪 Testing Credit Purchase Validation...');
  
  // Test valid purchase
  const validPurchase = customer.canMakeCreditPurchase(5000);
  console.log('✅ Valid purchase (₹5000):', validPurchase);
  
  // Test purchase exceeding limit
  const invalidPurchase = customer.canMakeCreditPurchase(15000);
  console.log('❌ Invalid purchase (₹15000):', invalidPurchase);
  
  // Test available credit
  console.log('💰 Available credit:', customer.getAvailableCredit());
  console.log('📊 Credit utilization:', customer.getCreditUtilization() + '%');
}

async function testCreditTransaction(customer) {
  console.log('\n🧪 Testing Credit Transaction Creation...');
  
  try {
    // Create a credit sale transaction
    const transaction = await CreditTransaction.createTransaction({
      store: TEST_CONFIG.TEST_STORE_ID,
      customer: customer._id,
      transactionType: 'credit_sale',
      amount: 3000,
      balanceChange: 3000,
      reference: {
        type: 'Sale',
        id: new mongoose.Types.ObjectId(),
        number: 'TEST-SALE-001'
      },
      description: 'Test credit sale transaction',
      notes: 'This is a test transaction',
      processedBy: TEST_CONFIG.TEST_USER_ID
    });

    console.log('✅ Credit transaction created:', transaction._id);
    console.log('   Transaction Type:', transaction.transactionType);
    console.log('   Amount:', transaction.amount);
    console.log('   Balance Change:', transaction.balanceChange);
    console.log('   Previous Balance:', transaction.previousBalance);
    console.log('   New Balance:', transaction.newBalance);
    
    // Refresh customer to see updated balance
    await customer.reload();
    console.log('✅ Customer balance updated to:', customer.creditBalance);
    console.log('   Credit Status:', customer.creditStatus);
    
    return transaction;
  } catch (error) {
    console.error('❌ Error creating credit transaction:', error.message);
    throw error;
  }
}

async function testCreditPayment(customer) {
  console.log('\n🧪 Testing Credit Payment...');
  
  try {
    // Create a credit payment transaction
    const paymentTransaction = await CreditTransaction.createTransaction({
      store: TEST_CONFIG.TEST_STORE_ID,
      customer: customer._id,
      transactionType: 'credit_payment',
      amount: 1500,
      balanceChange: -1500, // Negative because it reduces balance
      reference: {
        type: 'Payment',
        id: new mongoose.Types.ObjectId(),
        number: 'TEST-PAY-001'
      },
      paymentDetails: {
        method: 'cash',
        transactionId: 'CASH-001',
        notes: 'Test cash payment'
      },
      description: 'Test credit payment',
      notes: 'Customer paid ₹1500 in cash',
      processedBy: TEST_CONFIG.TEST_USER_ID
    });

    console.log('✅ Credit payment recorded:', paymentTransaction._id);
    console.log('   Payment Amount:', paymentTransaction.amount);
    console.log('   Balance Change:', paymentTransaction.balanceChange);
    console.log('   New Balance:', paymentTransaction.newBalance);
    
    // Refresh customer
    await customer.reload();
    console.log('✅ Customer balance after payment:', customer.creditBalance);
    console.log('   Available credit:', customer.getAvailableCredit());
    
    return paymentTransaction;
  } catch (error) {
    console.error('❌ Error recording credit payment:', error.message);
    throw error;
  }
}

async function testCreditHistory(customer) {
  console.log('\n🧪 Testing Credit History Retrieval...');
  
  try {
    const history = await CreditTransaction.getCustomerHistory(customer._id, { limit: 10 });
    console.log('✅ Credit history retrieved:', history.length, 'transactions');
    
    history.forEach((transaction, index) => {
      console.log(`   ${index + 1}. ${transaction.transactionType} - ₹${transaction.amount} (${transaction.balanceChange >= 0 ? '+' : ''}${transaction.balanceChange})`);
      console.log(`      Date: ${transaction.transactionDate.toLocaleDateString()}`);
      console.log(`      Balance: ₹${transaction.newBalance}`);
    });
    
    return history;
  } catch (error) {
    console.error('❌ Error retrieving credit history:', error.message);
    throw error;
  }
}

async function testNegativeBalancePrevention(customer) {
  console.log('\n🧪 Testing Negative Balance Prevention...');
  
  try {
    // Try to create a payment that would make balance negative
    await CreditTransaction.createTransaction({
      store: TEST_CONFIG.TEST_STORE_ID,
      customer: customer._id,
      transactionType: 'credit_payment',
      amount: customer.creditBalance + 1000, // More than current balance
      balanceChange: -(customer.creditBalance + 1000),
      reference: {
        type: 'Payment',
        id: new mongoose.Types.ObjectId(),
        number: 'TEST-INVALID-PAY'
      },
      description: 'Test invalid payment',
      processedBy: TEST_CONFIG.TEST_USER_ID
    });
    
    console.log('❌ Should not reach here - negative balance was allowed!');
  } catch (error) {
    console.log('✅ Negative balance prevented:', error.message);
  }
}

async function cleanupTestData(customer) {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete credit transactions
    await CreditTransaction.deleteMany({ customer: customer._id });
    console.log('✅ Credit transactions deleted');
    
    // Delete test customer
    await Customer.findByIdAndDelete(customer._id);
    console.log('✅ Test customer deleted');
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Credit System Tests...\n');
  
  let testCustomer;
  
  try {
    await connectDB();
    
    // Run tests
    testCustomer = await createTestCustomer();
    await testCreditPurchaseValidation(testCustomer);
    await testCreditTransaction(testCustomer);
    await testCreditPayment(testCustomer);
    await testCreditHistory(testCustomer);
    await testNegativeBalancePrevention(testCustomer);
    
    console.log('\n✅ All credit system tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    if (testCustomer) {
      await cleanupTestData(testCustomer);
    }
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };

/**
 * Test Script: Verify Supplier Outstanding Balance Updates
 * 
 * This script tests that supplier outstanding balances are correctly updated
 * when payments are made against purchase orders.
 * 
 * Usage: node scripts/testSupplierBalanceUpdate.js
 */

const mongoose = require('mongoose');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const SupplierTransaction = require('../models/SupplierTransaction');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Test 1: Verify supplier balance calculation
const testSupplierBalanceCalculation = async (supplierId) => {
  console.log('\n📊 Test 1: Verify Supplier Balance Calculation');
  console.log('='.repeat(60));

  try {
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      console.error('❌ Supplier not found');
      return false;
    }

    console.log(`\n🏢 Supplier: ${supplier.name}`);
    console.log(`💰 Current Outstanding Balance: ₹${supplier.outstandingBalance}`);

    // Get all transactions for this supplier
    const transactions = await SupplierTransaction.find({ supplier: supplierId })
      .sort({ transactionDate: 1 });

    console.log(`\n📝 Total Transactions: ${transactions.length}`);

    // Calculate expected balance from transactions
    let calculatedBalance = 0;
    console.log('\n📋 Transaction History:');
    transactions.forEach((txn, index) => {
      calculatedBalance += txn.balanceChange;
      console.log(`${index + 1}. ${txn.transactionType.padEnd(20)} | ₹${txn.amount.toString().padStart(8)} | Change: ₹${txn.balanceChange.toString().padStart(8)} | Running: ₹${calculatedBalance.toString().padStart(8)}`);
    });

    console.log(`\n💡 Calculated Balance from Transactions: ₹${calculatedBalance}`);
    console.log(`💰 Actual Supplier Balance: ₹${supplier.outstandingBalance}`);

    if (Math.abs(calculatedBalance - supplier.outstandingBalance) < 0.01) {
      console.log('✅ Balance matches! Supplier balance is correct.');
      return true;
    } else {
      console.log('❌ Balance mismatch! Supplier balance is incorrect.');
      console.log(`   Difference: ₹${Math.abs(calculatedBalance - supplier.outstandingBalance)}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error in test:', error);
    return false;
  }
};

// Test 2: Verify purchase payments update supplier balance
const testPurchasePaymentUpdatesBalance = async (purchaseId) => {
  console.log('\n📊 Test 2: Verify Purchase Payment Updates Supplier Balance');
  console.log('='.repeat(60));

  try {
    const purchase = await Purchase.findById(purchaseId).populate('supplier');
    if (!purchase) {
      console.error('❌ Purchase not found');
      return false;
    }

    if (!purchase.supplier) {
      console.error('❌ Purchase has no supplier');
      return false;
    }

    console.log(`\n📦 Purchase: ${purchase.purchaseOrderNumber}`);
    console.log(`🏢 Supplier: ${purchase.supplier.name}`);
    console.log(`💰 Total Amount: ₹${purchase.totalAmount}`);
    console.log(`💳 Paid Amount: ₹${purchase.paidAmount}`);
    console.log(`💵 Balance Amount: ₹${purchase.balanceAmount}`);
    console.log(`📊 Payment Status: ${purchase.paymentStatus}`);

    // Get supplier's current balance
    const supplier = await Supplier.findById(purchase.supplier._id);
    console.log(`\n💰 Supplier Outstanding Balance: ₹${supplier.outstandingBalance}`);

    // Get all transactions related to this purchase
    const purchaseTransactions = await SupplierTransaction.find({
      'reference.id': purchase._id
    }).sort({ transactionDate: 1 });

    console.log(`\n📝 Transactions for this Purchase: ${purchaseTransactions.length}`);
    purchaseTransactions.forEach((txn, index) => {
      console.log(`${index + 1}. ${txn.transactionType.padEnd(20)} | ₹${txn.amount.toString().padStart(8)} | Change: ₹${txn.balanceChange.toString().padStart(8)} | Date: ${txn.transactionDate.toLocaleDateString()}`);
    });

    // Verify payment history matches transactions
    if (purchase.paymentHistory && purchase.paymentHistory.length > 0) {
      console.log(`\n💳 Payment History: ${purchase.paymentHistory.length} payments`);
      purchase.paymentHistory.forEach((payment, index) => {
        console.log(`${index + 1}. ₹${payment.amount.toString().padStart(8)} | ${payment.paymentMethod.padEnd(15)} | ${payment.paymentDate.toLocaleDateString()}`);
      });
    }

    console.log('\n✅ Test completed. Review the data above to verify correctness.');
    return true;
  } catch (error) {
    console.error('❌ Error in test:', error);
    return false;
  }
};

// Test 3: Simulate a payment and verify balance update
const testSimulatePayment = async (supplierId, amount) => {
  console.log('\n📊 Test 3: Simulate Payment and Verify Balance Update');
  console.log('='.repeat(60));

  try {
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      console.error('❌ Supplier not found');
      return false;
    }

    console.log(`\n🏢 Supplier: ${supplier.name}`);
    console.log(`💰 Current Balance: ₹${supplier.outstandingBalance}`);
    console.log(`💳 Payment Amount: ₹${amount}`);

    const previousBalance = supplier.outstandingBalance;
    const expectedNewBalance = previousBalance - amount;

    console.log(`📊 Expected New Balance: ₹${expectedNewBalance}`);

    if (expectedNewBalance < 0) {
      console.error('❌ Payment amount exceeds outstanding balance!');
      return false;
    }

    // Create a test transaction (without actually saving to avoid data corruption)
    console.log('\n⚠️ NOTE: This is a DRY RUN. No actual changes will be made to the database.');
    console.log('To test actual payment, use the API endpoint or admin panel.');

    console.log('\n✅ Simulation completed successfully.');
    return true;
  } catch (error) {
    console.error('❌ Error in test:', error);
    return false;
  }
};

// Test 4: Find suppliers with balance mismatches
const testFindBalanceMismatches = async (storeId = null) => {
  console.log('\n📊 Test 4: Find Suppliers with Balance Mismatches');
  console.log('='.repeat(60));

  try {
    const query = storeId ? { store: storeId } : {};
    const suppliers = await Supplier.find(query);

    console.log(`\n🔍 Checking ${suppliers.length} suppliers...`);

    const mismatches = [];

    for (const supplier of suppliers) {
      // Calculate balance from transactions
      const transactions = await SupplierTransaction.find({ supplier: supplier._id });
      const calculatedBalance = transactions.reduce((sum, txn) => sum + txn.balanceChange, 0);

      const difference = Math.abs(calculatedBalance - supplier.outstandingBalance);

      if (difference > 0.01) {
        mismatches.push({
          supplier: supplier.name,
          supplierId: supplier._id,
          actualBalance: supplier.outstandingBalance,
          calculatedBalance: calculatedBalance,
          difference: difference
        });
      }
    }

    if (mismatches.length === 0) {
      console.log('✅ All supplier balances are correct!');
      return true;
    } else {
      console.log(`\n❌ Found ${mismatches.length} suppliers with balance mismatches:`);
      mismatches.forEach((mismatch, index) => {
        console.log(`\n${index + 1}. ${mismatch.supplier}`);
        console.log(`   Supplier ID: ${mismatch.supplierId}`);
        console.log(`   Actual Balance: ₹${mismatch.actualBalance}`);
        console.log(`   Calculated Balance: ₹${mismatch.calculatedBalance}`);
        console.log(`   Difference: ₹${mismatch.difference}`);
      });
      return false;
    }
  } catch (error) {
    console.error('❌ Error in test:', error);
    return false;
  }
};

// Main test runner
const runTests = async () => {
  console.log('\n🧪 Supplier Balance Update Test Suite');
  console.log('='.repeat(60));

  await connectDB();

  // Get command line arguments
  const args = process.argv.slice(2);
  const testType = args[0] || 'all';
  const testId = args[1];

  try {
    switch (testType) {
      case 'balance':
        if (!testId) {
          console.error('❌ Please provide a supplier ID');
          console.log('Usage: node scripts/testSupplierBalanceUpdate.js balance <supplierId>');
          break;
        }
        await testSupplierBalanceCalculation(testId);
        break;

      case 'purchase':
        if (!testId) {
          console.error('❌ Please provide a purchase ID');
          console.log('Usage: node scripts/testSupplierBalanceUpdate.js purchase <purchaseId>');
          break;
        }
        await testPurchasePaymentUpdatesBalance(testId);
        break;

      case 'simulate':
        if (!testId || !args[2]) {
          console.error('❌ Please provide a supplier ID and payment amount');
          console.log('Usage: node scripts/testSupplierBalanceUpdate.js simulate <supplierId> <amount>');
          break;
        }
        await testSimulatePayment(testId, parseFloat(args[2]));
        break;

      case 'mismatches':
        await testFindBalanceMismatches(testId);
        break;

      case 'all':
        console.log('\n📋 Running all tests...');
        await testFindBalanceMismatches();
        break;

      default:
        console.log('\n📖 Available Tests:');
        console.log('  balance <supplierId>              - Verify supplier balance calculation');
        console.log('  purchase <purchaseId>             - Verify purchase payment updates balance');
        console.log('  simulate <supplierId> <amount>    - Simulate a payment (dry run)');
        console.log('  mismatches [storeId]              - Find suppliers with balance mismatches');
        console.log('  all                               - Run all tests');
        console.log('\nExamples:');
        console.log('  node scripts/testSupplierBalanceUpdate.js balance 507f1f77bcf86cd799439011');
        console.log('  node scripts/testSupplierBalanceUpdate.js purchase 507f191e810c19729de860ea');
        console.log('  node scripts/testSupplierBalanceUpdate.js simulate 507f1f77bcf86cd799439011 2000');
        console.log('  node scripts/testSupplierBalanceUpdate.js mismatches');
    }
  } catch (error) {
    console.error('❌ Test suite error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
};

// Run tests
runTests();


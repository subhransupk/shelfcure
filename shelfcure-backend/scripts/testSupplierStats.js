require('dotenv').config();
const mongoose = require('mongoose');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const SupplierTransaction = require('../models/SupplierTransaction');
const Store = require('../models/Store');

async function testSupplierStats() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all suppliers
    const suppliers = await Supplier.find({}).populate('store', 'name code');
    console.log(`\n📊 Found ${suppliers.length} suppliers`);

    for (const supplier of suppliers) {
      console.log(`\n🏢 Supplier: ${supplier.name}`);
      console.log(`   Store: ${supplier.store?.name} (${supplier.store?.code})`);
      console.log(`   Current Stats:`);
      console.log(`   - Total Purchases: ${supplier.totalPurchases}`);
      console.log(`   - Total Purchase Amount: ₹${supplier.totalPurchaseAmount}`);
      console.log(`   - Outstanding Balance: ₹${supplier.outstandingBalance}`);
      console.log(`   - Last Purchase Date: ${supplier.lastPurchaseDate}`);

      // Get actual purchase data
      const purchases = await Purchase.find({
        supplier: supplier._id,
        status: { $in: ['completed', 'received'] }
      });

      const actualStats = purchases.reduce((acc, purchase) => {
        acc.count += 1;
        acc.totalAmount += purchase.totalAmount;
        if (!acc.lastDate || purchase.purchaseDate > acc.lastDate) {
          acc.lastDate = purchase.purchaseDate;
        }
        return acc;
      }, { count: 0, totalAmount: 0, lastDate: null });

      console.log(`   Actual Data from Purchases:`);
      console.log(`   - Actual Purchase Count: ${actualStats.count}`);
      console.log(`   - Actual Total Amount: ₹${actualStats.totalAmount}`);
      console.log(`   - Actual Last Purchase: ${actualStats.lastDate}`);

      // Get supplier transactions
      const transactions = await SupplierTransaction.find({
        supplier: supplier._id
      }).sort({ transactionDate: -1 });

      console.log(`   Supplier Transactions: ${transactions.length}`);
      let calculatedBalance = 0;
      transactions.forEach(transaction => {
        calculatedBalance += transaction.balanceChange;
        console.log(`   - ${transaction.transactionType}: ${transaction.balanceChange > 0 ? '+' : ''}₹${transaction.balanceChange} (Balance: ₹${transaction.newBalance})`);
      });

      // Update stats if they don't match
      if (supplier.totalPurchases !== actualStats.count || 
          supplier.totalPurchaseAmount !== actualStats.totalAmount) {
        console.log(`   🔄 Updating supplier statistics...`);
        await supplier.updatePurchaseStats();
        
        const updatedSupplier = await Supplier.findById(supplier._id);
        console.log(`   ✅ Updated Stats:`);
        console.log(`   - Total Purchases: ${updatedSupplier.totalPurchases}`);
        console.log(`   - Total Purchase Amount: ₹${updatedSupplier.totalPurchaseAmount}`);
        console.log(`   - Outstanding Balance: ₹${updatedSupplier.outstandingBalance}`);
      } else {
        console.log(`   ✅ Statistics are up to date`);
      }
    }

    console.log('\n🎉 Supplier statistics test completed!');

  } catch (error) {
    console.error('❌ Error testing supplier stats:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

// Run the test
testSupplierStats();

/**
 * Quick fix for duplicate return number issue
 * This script will remove the duplicate entry and allow new returns to be created
 */

const mongoose = require('mongoose');

// Simple connection without requiring config files
async function quickFix() {
  try {
    console.log('🔧 Quick fix for duplicate return number...\n');
    
    // Try different connection strings
    const connectionStrings = [
      'mongodb://localhost:27017/shelfcure',
      'mongodb://127.0.0.1:27017/shelfcure',
      process.env.MONGODB_URI
    ].filter(Boolean);
    
    let connected = false;
    for (const connectionString of connectionStrings) {
      try {
        console.log(`Trying to connect to: ${connectionString}`);
        await mongoose.connect(connectionString, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000
        });
        console.log('✅ Connected to database');
        connected = true;
        break;
      } catch (err) {
        console.log(`❌ Failed to connect to ${connectionString}`);
      }
    }
    
    if (!connected) {
      console.log('❌ Could not connect to MongoDB. Please ensure MongoDB is running.');
      console.log('\nAlternative solutions:');
      console.log('1. Start MongoDB service');
      console.log('2. Restart the backend server to pick up the new code');
      console.log('3. Manually delete the duplicate return number from the database');
      process.exit(1);
    }
    
    // Define the schema inline to avoid import issues
    const purchaseReturnSchema = new mongoose.Schema({
      returnNumber: { type: String, unique: true },
      store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
      originalPurchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' },
      supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
      items: [{}],
      subtotal: Number,
      totalReturnAmount: Number,
      returnReason: String,
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }, { timestamps: true });
    
    const PurchaseReturn = mongoose.model('PurchaseReturn', purchaseReturnSchema);
    
    // Find the problematic return number
    const duplicateReturnNumber = 'PR-202510-0001';
    console.log(`🔍 Looking for duplicate return number: ${duplicateReturnNumber}`);
    
    const duplicateReturns = await PurchaseReturn.find({ returnNumber: duplicateReturnNumber });
    console.log(`Found ${duplicateReturns.length} returns with this number`);
    
    if (duplicateReturns.length === 0) {
      console.log('✅ No duplicates found. The issue may have been resolved.');
    } else if (duplicateReturns.length === 1) {
      console.log('✅ Only one return found. No duplicates to fix.');
      console.log('The error might be caused by the old code still running.');
      console.log('Please restart the backend server to pick up the new code.');
    } else {
      console.log(`❌ Found ${duplicateReturns.length} duplicate returns:`);
      
      duplicateReturns.forEach((ret, index) => {
        console.log(`   ${index + 1}. ID: ${ret._id}, Created: ${ret.createdAt}`);
      });
      
      // Keep the oldest one, remove the rest
      const sortedReturns = duplicateReturns.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const keepReturn = sortedReturns[0];
      const removeReturns = sortedReturns.slice(1);
      
      console.log(`\n📋 Keeping: ${keepReturn._id} (oldest)`);
      console.log(`🗑️  Removing: ${removeReturns.length} duplicate(s)`);
      
      for (const returnToRemove of removeReturns) {
        await PurchaseReturn.findByIdAndDelete(returnToRemove._id);
        console.log(`   ✅ Deleted: ${returnToRemove._id}`);
      }
      
      console.log('\n✅ Duplicates removed successfully!');
    }
    
    // Check if there are any other duplicates
    console.log('\n🔍 Checking for other duplicate return numbers...');
    const allDuplicates = await PurchaseReturn.aggregate([
      { $group: { _id: '$returnNumber', count: { $sum: 1 }, docs: { $push: '$$ROOT' } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    if (allDuplicates.length === 0) {
      console.log('✅ No other duplicates found.');
    } else {
      console.log(`❌ Found ${allDuplicates.length} other duplicate groups:`);
      allDuplicates.forEach(dup => {
        console.log(`   - ${dup._id}: ${dup.count} occurrences`);
      });
    }
    
    console.log('\n🎉 Quick fix completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart the backend server to pick up the new code');
    console.log('2. Try creating a purchase return again');
    console.log('3. The new atomic counter logic should prevent future duplicates');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Quick fix failed:', error.message);
    console.log('\nManual fix instructions:');
    console.log('1. Connect to MongoDB directly');
    console.log('2. Run: db.purchasereturns.deleteOne({returnNumber: "PR-202510-0001"})');
    console.log('3. Keep only the oldest document if multiple exist');
    console.log('4. Restart the backend server');
    process.exit(1);
  }
}

// Run the quick fix
quickFix();

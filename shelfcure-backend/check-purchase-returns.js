const mongoose = require('mongoose');
require('./config/database');

async function checkPurchaseReturns() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shelfcure');
    
    const PurchaseReturn = require('./models/PurchaseReturn');
    
    console.log('Checking existing purchase returns...');
    const returns = await PurchaseReturn.find({}).select('returnNumber store createdAt').sort({ createdAt: -1 }).limit(10);
    
    console.log('Recent purchase returns:');
    if (returns.length === 0) {
      console.log('No purchase returns found.');
    } else {
      returns.forEach(ret => {
        console.log(`- ${ret.returnNumber} (Store: ${ret.store}, Created: ${ret.createdAt})`);
      });
    }
    
    // Check for duplicates
    const duplicates = await PurchaseReturn.aggregate([
      { $group: { _id: '$returnNumber', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    if (duplicates.length > 0) {
      console.log('\nFound duplicate return numbers:');
      duplicates.forEach(dup => {
        console.log(`- ${dup._id}: ${dup.count} occurrences`);
      });
    } else {
      console.log('\nNo duplicate return numbers found.');
    }
    
    // Check the current month pattern
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const currentMonthPattern = `PR-${year}${month}-`;
    
    console.log(`\nChecking current month pattern: ${currentMonthPattern}`);
    const currentMonthReturns = await PurchaseReturn.find({
      returnNumber: { $regex: `^${currentMonthPattern}` }
    }).select('returnNumber').sort({ returnNumber: -1 });
    
    console.log(`Found ${currentMonthReturns.length} returns for current month:`);
    currentMonthReturns.forEach(ret => {
      console.log(`- ${ret.returnNumber}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPurchaseReturns();

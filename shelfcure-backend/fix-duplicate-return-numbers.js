/**
 * Script to fix duplicate purchase return numbers
 * This script will identify and fix any existing duplicate return numbers
 */

const mongoose = require('mongoose');
require('./config/database');

async function fixDuplicateReturnNumbers() {
  try {
    console.log('🔧 Starting duplicate return number fix...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shelfcure');
    console.log('✅ Connected to database');
    
    const PurchaseReturn = require('./models/PurchaseReturn');
    const Counter = require('./models/Counter');
    
    // Find all duplicate return numbers
    console.log('🔍 Searching for duplicate return numbers...');
    const duplicates = await PurchaseReturn.aggregate([
      { $group: { _id: '$returnNumber', count: { $sum: 1 }, docs: { $push: '$$ROOT' } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate return numbers found!');
    } else {
      console.log(`❌ Found ${duplicates.length} duplicate return number groups:`);
      
      for (const duplicate of duplicates) {
        console.log(`\n📋 Duplicate return number: ${duplicate._id}`);
        console.log(`   Count: ${duplicate.count}`);
        
        // Sort documents by creation date (keep the oldest one)
        const sortedDocs = duplicate.docs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const keepDoc = sortedDocs[0];
        const duplicateDocs = sortedDocs.slice(1);
        
        console.log(`   Keeping: ${keepDoc._id} (created: ${keepDoc.createdAt})`);
        
        // Generate new return numbers for duplicates
        for (let i = 0; i < duplicateDocs.length; i++) {
          const doc = duplicateDocs[i];
          const today = new Date(doc.createdAt);
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, '0');
          
          // Generate new unique return number
          const counterId = `purchase_return_${doc.store}_${year}_${month}`;
          const counter = await Counter.findOneAndUpdate(
            { _id: counterId },
            { $inc: { sequence: 1 } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
          );
          
          const newReturnNumber = `PR-${year}${month}-${String(counter.sequence).padStart(4, '0')}`;
          
          // Update the document with new return number
          await PurchaseReturn.findByIdAndUpdate(doc._id, {
            returnNumber: newReturnNumber
          });
          
          console.log(`   Updated: ${doc._id} -> ${newReturnNumber}`);
        }
      }
      
      console.log('\n✅ All duplicate return numbers have been fixed!');
    }
    
    // Verify no duplicates remain
    console.log('\n🔍 Verifying fix...');
    const remainingDuplicates = await PurchaseReturn.aggregate([
      { $group: { _id: '$returnNumber', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    if (remainingDuplicates.length === 0) {
      console.log('✅ Verification passed - no duplicates remain!');
    } else {
      console.log('❌ Verification failed - duplicates still exist:');
      remainingDuplicates.forEach(dup => {
        console.log(`   - ${dup._id}: ${dup.count} occurrences`);
      });
    }
    
    // Initialize counters for existing return numbers
    console.log('\n🔧 Initializing counters for existing return numbers...');
    const allReturns = await PurchaseReturn.find({}).select('returnNumber store createdAt');
    const counterMap = new Map();
    
    for (const returnDoc of allReturns) {
      if (returnDoc.returnNumber && returnDoc.returnNumber.startsWith('PR-')) {
        const parts = returnDoc.returnNumber.split('-');
        if (parts.length >= 3) {
          const yearMonth = parts[1];
          const sequence = parseInt(parts[2]);
          
          if (!isNaN(sequence) && yearMonth.length === 6) {
            const year = yearMonth.substring(0, 4);
            const month = yearMonth.substring(4, 6);
            const counterId = `purchase_return_${returnDoc.store}_${year}_${month}`;
            
            const currentMax = counterMap.get(counterId) || 0;
            if (sequence > currentMax) {
              counterMap.set(counterId, sequence);
            }
          }
        }
      }
    }
    
    // Update counters
    for (const [counterId, maxSequence] of counterMap) {
      await Counter.findOneAndUpdate(
        { _id: counterId },
        { 
          $set: { 
            sequence: maxSequence,
            description: 'Purchase Return Counter',
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
      console.log(`   Updated counter ${counterId}: ${maxSequence}`);
    }
    
    console.log('\n🎉 All fixes completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Fixed ${duplicates.length} duplicate groups`);
    console.log(`   - Initialized ${counterMap.size} counters`);
    console.log('   - Return number generation should now work correctly');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fixing duplicate return numbers:', error);
    process.exit(1);
  }
}

// Run the fix
fixDuplicateReturnNumbers();

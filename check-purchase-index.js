/**
 * Check Purchase Order Duplicate Index
 * 
 * This script checks if the unique index is properly created on the Purchase collection
 * Run with: node check-purchase-index.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}\n`)
};

async function checkIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shelfcure', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    log.success('Connected to MongoDB');

    // Get the purchases collection
    const db = mongoose.connection.db;
    const collection = db.collection('purchases');

    log.section('Checking Indexes on Purchases Collection');

    // Get all indexes
    const indexes = await collection.indexes();
    
    console.log('Found indexes:');
    indexes.forEach((index, i) => {
      console.log(`\n${i + 1}. ${index.name}`);
      console.log('   Keys:', JSON.stringify(index.key, null, 2));
      if (index.unique) {
        log.success('   Unique: true');
      }
      if (index.sparse) {
        log.info('   Sparse: true');
      }
    });

    // Check for our specific index
    log.section('Checking for Duplicate Prevention Index');
    
    const uniqueIndex = indexes.find(idx => idx.name === 'unique_supplier_po_number');
    
    if (uniqueIndex) {
      log.success('Found unique_supplier_po_number index');
      console.log('   Keys:', JSON.stringify(uniqueIndex.key));
      console.log('   Unique:', uniqueIndex.unique);
      console.log('   Sparse:', uniqueIndex.sparse);
      
      // Verify it has the correct fields
      if (uniqueIndex.key.store === 1 && 
          uniqueIndex.key.supplier === 1 && 
          uniqueIndex.key.purchaseOrderNumber === 1 &&
          uniqueIndex.unique === true) {
        log.success('Index is correctly configured!');
      } else {
        log.error('Index exists but is not correctly configured');
      }
    } else {
      log.error('unique_supplier_po_number index NOT FOUND!');
      log.warning('The index may not have been created yet.');
      log.info('Try restarting your Node.js application to create the index.');
    }

    // Check for existing duplicates
    log.section('Checking for Existing Duplicates');
    
    const duplicates = await collection.aggregate([
      {
        $match: { supplier: { $ne: null } }
      },
      {
        $group: {
          _id: {
            store: '$store',
            supplier: '$supplier',
            purchaseOrderNumber: '$purchaseOrderNumber'
          },
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray();

    if (duplicates.length > 0) {
      log.error(`Found ${duplicates.length} duplicate purchase order(s):`);
      duplicates.forEach((dup, i) => {
        console.log(`\n${i + 1}. Store: ${dup._id.store}`);
        console.log(`   Supplier: ${dup._id.supplier}`);
        console.log(`   PO Number: ${dup._id.purchaseOrderNumber}`);
        console.log(`   Count: ${dup.count}`);
        console.log(`   IDs: ${dup.ids.join(', ')}`);
      });
      log.warning('\nThese duplicates must be resolved before the unique index can work properly.');
    } else {
      log.success('No duplicate purchase orders found!');
    }

    // Test the index (if it exists)
    if (uniqueIndex) {
      log.section('Testing Index Enforcement');
      
      // Get a sample purchase
      const samplePurchase = await collection.findOne({ supplier: { $ne: null } });
      
      if (samplePurchase) {
        log.info('Testing with sample purchase:');
        console.log('   Store:', samplePurchase.store);
        console.log('   Supplier:', samplePurchase.supplier);
        console.log('   PO Number:', samplePurchase.purchaseOrderNumber);
        
        try {
          // Try to insert a duplicate
          await collection.insertOne({
            store: samplePurchase.store,
            supplier: samplePurchase.supplier,
            purchaseOrderNumber: samplePurchase.purchaseOrderNumber,
            items: [],
            subtotal: 0,
            totalAmount: 0,
            createdBy: samplePurchase.createdBy,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          log.error('Index did NOT prevent duplicate! This is a problem.');
          
          // Clean up the test duplicate
          await collection.deleteOne({
            store: samplePurchase.store,
            supplier: samplePurchase.supplier,
            purchaseOrderNumber: samplePurchase.purchaseOrderNumber,
            _id: { $ne: samplePurchase._id }
          });
          
        } catch (error) {
          if (error.code === 11000) {
            log.success('Index correctly prevented duplicate insertion!');
          } else {
            log.error('Unexpected error:', error.message);
          }
        }
      } else {
        log.warning('No sample purchase found to test with');
      }
    }

    log.section('Summary');
    console.log('Index Status:', uniqueIndex ? '✅ Created' : '❌ Missing');
    console.log('Duplicates:', duplicates.length === 0 ? '✅ None' : `❌ ${duplicates.length} found`);
    
    if (!uniqueIndex) {
      log.warning('\nRECOMMENDATION: Restart your Node.js application to create the index.');
    } else if (duplicates.length > 0) {
      log.warning('\nRECOMMENDATION: Resolve existing duplicates before relying on the index.');
    } else {
      log.success('\nEverything looks good! The duplicate prevention should be working.');
    }

  } catch (error) {
    log.error('Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    log.info('Database connection closed');
  }
}

checkIndexes();


/**
 * Test Script for Purchase Order Duplicate Validation
 * 
 * This script tests the duplicate validation logic for purchase orders
 * Run with: node test-duplicate-po-validation.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Purchase = require('./shelfcure-backend/models/Purchase');
const Supplier = require('./shelfcure-backend/models/Supplier');
const Store = require('./shelfcure-backend/models/Store');
const User = require('./shelfcure-backend/models/User');

// Color codes for console output
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

// Test data
let testStore, testUser, testSupplier1, testSupplier2;

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shelfcure', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    log.success('Connected to MongoDB');
  } catch (error) {
    log.error(`Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
}

async function setupTestData() {
  log.section('Setting Up Test Data');

  try {
    // Find or create test store
    testStore = await Store.findOne({ name: 'Test Store for PO Validation' });
    if (!testStore) {
      testStore = await Store.create({
        name: 'Test Store for PO Validation',
        owner: new mongoose.Types.ObjectId(),
        business: {
          licenseNumber: `TEST-PO-${Date.now()}`,
          gstNumber: 'TEST123456789',
          address: {
            street: 'Test Street',
            city: 'Test City',
            state: 'Test State',
            pincode: '123456'
          }
        },
        contact: {
          phone: '1234567890',
          email: 'test@test.com'
        }
      });
      log.success(`Created test store: ${testStore.name}`);
    } else {
      log.info(`Using existing test store: ${testStore.name}`);
    }

    // Find or create test user
    testUser = await User.findOne({ email: 'testmanager@test.com' });
    if (!testUser) {
      testUser = await User.create({
        name: 'Test Manager',
        email: 'testmanager@test.com',
        password: 'test123',
        role: 'store_manager',
        store: testStore._id
      });
      log.success(`Created test user: ${testUser.name}`);
    } else {
      log.info(`Using existing test user: ${testUser.name}`);
    }

    // Create test suppliers
    testSupplier1 = await Supplier.create({
      name: `Test Supplier 1 - ${Date.now()}`,
      contactPerson: 'Contact 1',
      phone: '1111111111',
      store: testStore._id,
      addedBy: testUser._id
    });
    log.success(`Created test supplier 1: ${testSupplier1.name}`);

    testSupplier2 = await Supplier.create({
      name: `Test Supplier 2 - ${Date.now()}`,
      contactPerson: 'Contact 2',
      phone: '2222222222',
      store: testStore._id,
      addedBy: testUser._id
    });
    log.success(`Created test supplier 2: ${testSupplier2.name}`);

  } catch (error) {
    log.error(`Failed to setup test data: ${error.message}`);
    throw error;
  }
}

async function test1_CreateUniquePurchaseOrder() {
  log.section('Test 1: Create Unique Purchase Order');

  try {
    const purchase = await Purchase.create({
      store: testStore._id,
      supplier: testSupplier1._id,
      purchaseOrderNumber: 'PO-TEST-001',
      items: [{
        medicineName: 'Test Medicine',
        quantity: 10,
        unitType: 'strip',
        unitCost: 100,
        totalCost: 1000,
        netAmount: 1000
      }],
      subtotal: 1000,
      totalAmount: 1000,
      createdBy: testUser._id
    });

    log.success(`Created purchase order: ${purchase.purchaseOrderNumber} for ${testSupplier1.name}`);
    return true;
  } catch (error) {
    log.error(`Failed to create unique purchase order: ${error.message}`);
    return false;
  }
}

async function test2_PreventDuplicateForSameSupplier() {
  log.section('Test 2: Prevent Duplicate PO Number for Same Supplier');

  try {
    await Purchase.create({
      store: testStore._id,
      supplier: testSupplier1._id,
      purchaseOrderNumber: 'PO-TEST-001', // Same PO number, same supplier
      items: [{
        medicineName: 'Test Medicine 2',
        quantity: 5,
        unitType: 'strip',
        unitCost: 50,
        totalCost: 250,
        netAmount: 250
      }],
      subtotal: 250,
      totalAmount: 250,
      createdBy: testUser._id
    });

    log.error('FAILED: Should have prevented duplicate PO number for same supplier');
    return false;
  } catch (error) {
    if (error.code === 11000 || error.message.includes('duplicate')) {
      log.success('Correctly prevented duplicate PO number for same supplier');
      return true;
    } else {
      log.error(`Unexpected error: ${error.message}`);
      return false;
    }
  }
}

async function test3_AllowSamePOForDifferentSupplier() {
  log.section('Test 3: Allow Same PO Number for Different Supplier');

  try {
    const purchase = await Purchase.create({
      store: testStore._id,
      supplier: testSupplier2._id, // Different supplier
      purchaseOrderNumber: 'PO-TEST-001', // Same PO number
      items: [{
        medicineName: 'Test Medicine 3',
        quantity: 15,
        unitType: 'strip',
        unitCost: 75,
        totalCost: 1125,
        netAmount: 1125
      }],
      subtotal: 1125,
      totalAmount: 1125,
      createdBy: testUser._id
    });

    log.success(`Correctly allowed same PO number (${purchase.purchaseOrderNumber}) for different supplier: ${testSupplier2.name}`);
    return true;
  } catch (error) {
    log.error(`FAILED: Should have allowed same PO number for different supplier: ${error.message}`);
    return false;
  }
}

async function test4_CheckDuplicateQuery() {
  log.section('Test 4: Check Duplicate Detection Query');

  try {
    // This simulates the validation query in the controller
    const existingPurchase = await Purchase.findOne({
      store: testStore._id,
      supplier: testSupplier1._id,
      purchaseOrderNumber: 'PO-TEST-001'
    });

    if (existingPurchase) {
      log.success('Duplicate detection query works correctly');
      log.info(`Found existing purchase: ${existingPurchase._id}`);
      return true;
    } else {
      log.error('FAILED: Duplicate detection query did not find existing purchase');
      return false;
    }
  } catch (error) {
    log.error(`Failed duplicate detection query: ${error.message}`);
    return false;
  }
}

async function test5_AllowPurchaseWithoutSupplier() {
  log.section('Test 5: Allow Purchase Order Without Supplier');

  try {
    const purchase = await Purchase.create({
      store: testStore._id,
      // No supplier
      purchaseOrderNumber: 'PO-TEST-NO-SUPPLIER',
      items: [{
        medicineName: 'Test Medicine 4',
        quantity: 20,
        unitType: 'strip',
        unitCost: 60,
        totalCost: 1200,
        netAmount: 1200
      }],
      subtotal: 1200,
      totalAmount: 1200,
      createdBy: testUser._id
    });

    log.success(`Correctly allowed purchase order without supplier: ${purchase.purchaseOrderNumber}`);
    return true;
  } catch (error) {
    log.error(`FAILED: Should have allowed purchase without supplier: ${error.message}`);
    return false;
  }
}

async function cleanupTestData() {
  log.section('Cleaning Up Test Data');

  try {
    // Delete test purchases
    const deletedPurchases = await Purchase.deleteMany({
      store: testStore._id,
      purchaseOrderNumber: { $regex: /^PO-TEST/ }
    });
    log.info(`Deleted ${deletedPurchases.deletedCount} test purchases`);

    // Delete test suppliers
    await Supplier.deleteMany({ _id: { $in: [testSupplier1._id, testSupplier2._id] } });
    log.info('Deleted test suppliers');

    // Optionally delete test store and user (commented out to preserve for future tests)
    // await Store.deleteOne({ _id: testStore._id });
    // await User.deleteOne({ _id: testUser._id });

    log.success('Cleanup completed');
  } catch (error) {
    log.error(`Failed to cleanup test data: ${error.message}`);
  }
}

async function runTests() {
  log.section('Purchase Order Duplicate Validation Tests');

  const results = {
    passed: 0,
    failed: 0,
    total: 5
  };

  try {
    await connectDB();
    await setupTestData();

    // Run tests
    if (await test1_CreateUniquePurchaseOrder()) results.passed++;
    else results.failed++;

    if (await test2_PreventDuplicateForSameSupplier()) results.passed++;
    else results.failed++;

    if (await test3_AllowSamePOForDifferentSupplier()) results.passed++;
    else results.failed++;

    if (await test4_CheckDuplicateQuery()) results.passed++;
    else results.failed++;

    if (await test5_AllowPurchaseWithoutSupplier()) results.passed++;
    else results.failed++;

    // Cleanup
    await cleanupTestData();

    // Summary
    log.section('Test Summary');
    console.log(`Total Tests: ${results.total}`);
    console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);

    if (results.failed === 0) {
      log.success('\nAll tests passed! ✨');
    } else {
      log.error(`\n${results.failed} test(s) failed. Please review the output above.`);
    }

  } catch (error) {
    log.error(`Test execution failed: ${error.message}`);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    log.info('Database connection closed');
  }
}

// Run tests
runTests();


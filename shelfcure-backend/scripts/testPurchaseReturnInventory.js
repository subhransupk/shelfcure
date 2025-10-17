/**
 * Test Script: Verify Purchase Return Inventory Reduction
 * 
 * This script tests that purchase returns correctly DECREASE inventory
 * when medicines are returned to suppliers.
 * 
 * Usage: node scripts/testPurchaseReturnInventory.js
 */

const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
const PurchaseReturn = require('../models/PurchaseReturn');
const InventoryLog = require('../models/InventoryLog');
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

// Test 1: Verify inventory logs show negative changes for purchase returns
const testInventoryLogsForPurchaseReturns = async () => {
  console.log('\n📊 Test 1: Verify Inventory Logs for Purchase Returns');
  console.log('='.repeat(60));

  try {
    const purchaseReturnLogs = await InventoryLog.find({
      'reference.type': 'PurchaseReturn'
    })
      .sort({ timestamp: -1 })
      .limit(20)
      .populate('medicine', 'name')
      .populate('performedBy', 'name');

    if (purchaseReturnLogs.length === 0) {
      console.log('⚠️ No purchase return inventory logs found');
      return false;
    }

    console.log(`\n📝 Found ${purchaseReturnLogs.length} purchase return inventory logs:`);

    let allCorrect = true;
    purchaseReturnLogs.forEach((log, index) => {
      const isCorrect = log.quantityChanged < 0; // Should be negative
      const status = isCorrect ? '✅' : '❌';
      
      console.log(`\n${index + 1}. ${status} ${log.medicine?.name || 'Unknown Medicine'}`);
      console.log(`   Return Number: ${log.reference.returnNumber}`);
      console.log(`   Unit Type: ${log.unitType}`);
      console.log(`   Quantity Changed: ${log.quantityChanged} ${isCorrect ? '(Correct - Negative)' : '(WRONG - Should be Negative!)'}`);
      console.log(`   Previous Stock: ${log.previousStock}`);
      console.log(`   New Stock: ${log.newStock}`);
      console.log(`   Date: ${log.timestamp.toLocaleDateString()}`);

      if (!isCorrect) {
        allCorrect = false;
        console.log(`   ⚠️ ERROR: Purchase return should DECREASE inventory (negative quantityChanged)`);
      }
    });

    if (allCorrect) {
      console.log('\n✅ All purchase return inventory logs are correct!');
      return true;
    } else {
      console.log('\n❌ Some purchase return inventory logs have incorrect values!');
      return false;
    }
  } catch (error) {
    console.error('❌ Error in test:', error);
    return false;
  }
};

// Test 2: Verify specific purchase return reduced inventory
const testSpecificPurchaseReturn = async (returnId) => {
  console.log('\n📊 Test 2: Verify Specific Purchase Return');
  console.log('='.repeat(60));

  try {
    const purchaseReturn = await PurchaseReturn.findById(returnId)
      .populate('items.medicine', 'name stripInfo.stock individualInfo.stock');

    if (!purchaseReturn) {
      console.error('❌ Purchase return not found');
      return false;
    }

    console.log(`\n📦 Purchase Return: ${purchaseReturn.returnNumber}`);
    console.log(`Status: ${purchaseReturn.status}`);
    console.log(`Inventory Status: ${purchaseReturn.inventoryRestorationStatus}`);

    console.log(`\n📋 Items (${purchaseReturn.items.length}):`);

    for (const item of purchaseReturn.items) {
      console.log(`\n  Medicine: ${item.medicineName}`);
      console.log(`  Return Quantity: ${item.returnQuantity} ${item.unitType}(s)`);
      console.log(`  Remove From Inventory: ${item.removeFromInventory}`);
      console.log(`  Inventory Updated: ${item.inventoryUpdated}`);

      if (item.inventoryUpdateDetails) {
        const details = item.inventoryUpdateDetails;
        const isCorrect = details.quantityChanged < 0; // Should be negative
        const status = isCorrect ? '✅' : '❌';

        console.log(`\n  ${status} Inventory Update Details:`);
        console.log(`     Quantity Changed: ${details.quantityChanged} ${isCorrect ? '(Correct - Negative)' : '(WRONG - Should be Negative!)'}`);
        console.log(`     Previous Stock: ${details.previousStock}`);
        console.log(`     New Stock: ${details.newStock}`);
        console.log(`     Updated At: ${details.updatedAt?.toLocaleDateString()}`);

        if (!isCorrect) {
          console.log(`     ⚠️ ERROR: Purchase return should DECREASE inventory!`);
        }
      }

      // Check current medicine stock
      if (item.medicine) {
        const currentStock = item.unitType === 'strip' 
          ? item.medicine.stripInfo?.stock 
          : item.medicine.individualInfo?.stock;
        console.log(`  Current Stock: ${currentStock} ${item.unitType}(s)`);
      }
    }

    console.log('\n✅ Test completed. Review the data above to verify correctness.');
    return true;
  } catch (error) {
    console.error('❌ Error in test:', error);
    return false;
  }
};

// Test 3: Find purchase returns with incorrect inventory changes
const findIncorrectPurchaseReturns = async () => {
  console.log('\n📊 Test 3: Find Purchase Returns with Incorrect Inventory Changes');
  console.log('='.repeat(60));

  try {
    const purchaseReturns = await PurchaseReturn.find({
      status: 'completed',
      inventoryRestorationStatus: 'completed'
    });

    console.log(`\n🔍 Checking ${purchaseReturns.length} completed purchase returns...`);

    const incorrect = [];

    for (const pr of purchaseReturns) {
      for (const item of pr.items) {
        if (item.inventoryUpdateDetails && item.inventoryUpdateDetails.quantityChanged > 0) {
          incorrect.push({
            returnNumber: pr.returnNumber,
            returnId: pr._id,
            medicineName: item.medicineName,
            quantityChanged: item.inventoryUpdateDetails.quantityChanged,
            unitType: item.unitType
          });
        }
      }
    }

    if (incorrect.length === 0) {
      console.log('✅ All purchase returns have correct inventory changes (negative values)!');
      return true;
    } else {
      console.log(`\n❌ Found ${incorrect.length} items with incorrect inventory changes:`);
      incorrect.forEach((item, index) => {
        console.log(`\n${index + 1}. Return: ${item.returnNumber}`);
        console.log(`   Medicine: ${item.medicineName}`);
        console.log(`   Quantity Changed: ${item.quantityChanged} (Should be negative!)`);
        console.log(`   Unit Type: ${item.unitType}`);
        console.log(`   Return ID: ${item.returnId}`);
      });
      return false;
    }
  } catch (error) {
    console.error('❌ Error in test:', error);
    return false;
  }
};

// Test 4: Simulate inventory calculation for a medicine
const testMedicineInventoryCalculation = async (medicineId) => {
  console.log('\n📊 Test 4: Verify Medicine Inventory Calculation');
  console.log('='.repeat(60));

  try {
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      console.error('❌ Medicine not found');
      return false;
    }

    console.log(`\n💊 Medicine: ${medicine.name}`);
    console.log(`Current Strip Stock: ${medicine.stripInfo?.stock || 0}`);
    console.log(`Current Individual Stock: ${medicine.individualInfo?.stock || 0}`);

    // Get all inventory logs for this medicine
    const logs = await InventoryLog.find({ medicine: medicineId })
      .sort({ timestamp: 1 });

    console.log(`\n📝 Total Inventory Logs: ${logs.length}`);

    // Calculate expected stock from logs
    let calculatedStripStock = 0;
    let calculatedIndividualStock = 0;

    console.log('\n📋 Inventory Change History:');
    logs.forEach((log, index) => {
      if (log.unitType === 'strip') {
        calculatedStripStock += log.quantityChanged;
      } else if (log.unitType === 'individual') {
        calculatedIndividualStock += log.quantityChanged;
      }

      const changeType = log.changeType.padEnd(20);
      const quantity = log.quantityChanged.toString().padStart(6);
      const emoji = log.quantityChanged > 0 ? '📈' : '📉';

      console.log(`${index + 1}. ${emoji} ${changeType} | ${log.unitType.padEnd(10)} | ${quantity} | Running: S:${calculatedStripStock} I:${calculatedIndividualStock}`);
    });

    console.log(`\n💡 Calculated from Logs:`);
    console.log(`   Strip Stock: ${calculatedStripStock}`);
    console.log(`   Individual Stock: ${calculatedIndividualStock}`);

    console.log(`\n💰 Actual in Database:`);
    console.log(`   Strip Stock: ${medicine.stripInfo?.stock || 0}`);
    console.log(`   Individual Stock: ${medicine.individualInfo?.stock || 0}`);

    const stripMatch = Math.abs(calculatedStripStock - (medicine.stripInfo?.stock || 0)) < 0.01;
    const individualMatch = Math.abs(calculatedIndividualStock - (medicine.individualInfo?.stock || 0)) < 0.01;

    if (stripMatch && individualMatch) {
      console.log('\n✅ Inventory matches calculated values!');
      return true;
    } else {
      console.log('\n❌ Inventory mismatch detected!');
      if (!stripMatch) {
        console.log(`   Strip difference: ${Math.abs(calculatedStripStock - (medicine.stripInfo?.stock || 0))}`);
      }
      if (!individualMatch) {
        console.log(`   Individual difference: ${Math.abs(calculatedIndividualStock - (medicine.individualInfo?.stock || 0))}`);
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Error in test:', error);
    return false;
  }
};

// Main test runner
const runTests = async () => {
  console.log('\n🧪 Purchase Return Inventory Test Suite');
  console.log('='.repeat(60));

  await connectDB();

  const args = process.argv.slice(2);
  const testType = args[0] || 'all';
  const testId = args[1];

  try {
    switch (testType) {
      case 'logs':
        await testInventoryLogsForPurchaseReturns();
        break;

      case 'return':
        if (!testId) {
          console.error('❌ Please provide a purchase return ID');
          console.log('Usage: node scripts/testPurchaseReturnInventory.js return <returnId>');
          break;
        }
        await testSpecificPurchaseReturn(testId);
        break;

      case 'medicine':
        if (!testId) {
          console.error('❌ Please provide a medicine ID');
          console.log('Usage: node scripts/testPurchaseReturnInventory.js medicine <medicineId>');
          break;
        }
        await testMedicineInventoryCalculation(testId);
        break;

      case 'find-incorrect':
        await findIncorrectPurchaseReturns();
        break;

      case 'all':
        console.log('\n📋 Running all tests...');
        await testInventoryLogsForPurchaseReturns();
        await findIncorrectPurchaseReturns();
        break;

      default:
        console.log('\n📖 Available Tests:');
        console.log('  logs                    - Check inventory logs for purchase returns');
        console.log('  return <returnId>       - Verify specific purchase return');
        console.log('  medicine <medicineId>   - Verify medicine inventory calculation');
        console.log('  find-incorrect          - Find purchase returns with incorrect changes');
        console.log('  all                     - Run all tests');
        console.log('\nExamples:');
        console.log('  node scripts/testPurchaseReturnInventory.js logs');
        console.log('  node scripts/testPurchaseReturnInventory.js return 507f191e810c19729de860ea');
        console.log('  node scripts/testPurchaseReturnInventory.js medicine 507f1f77bcf86cd799439011');
        console.log('  node scripts/testPurchaseReturnInventory.js find-incorrect');
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


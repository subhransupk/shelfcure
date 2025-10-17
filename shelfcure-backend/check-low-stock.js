require('dotenv').config();
const mongoose = require('mongoose');
const Medicine = require('./models/Medicine');

async function checkLowStock() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const storeId = '68ec9f46a1597adc370d916f';

    // Check the test medicines we created
    const testMedicines = await Medicine.find({ 
      store: storeId, 
      name: { $in: ['Aspirin 75mg', 'Ibuprofen 400mg'] } 
    });

    console.log('🔍 Checking low stock medicines...');
    
    testMedicines.forEach(med => {
      console.log(`\nMedicine: ${med.name}`);
      console.log(`  Strip stock: ${med.stripInfo.stock}, Min: ${med.stripInfo.minStock}, Low: ${med.stripInfo.stock <= med.stripInfo.minStock}`);
      console.log(`  Individual stock: ${med.individualInfo.stock}, Min: ${med.individualInfo.minStock}, Low: ${med.individualInfo.stock <= med.individualInfo.minStock}`);
      console.log(`  Has strips: ${med.unitTypes.hasStrips}, Has individual: ${med.unitTypes.hasIndividual}`);
    });

    // Test the aggregation query directly
    console.log('\n🔍 Testing aggregation query...');
    const lowStockMedicines = await Medicine.aggregate([
      { $match: { store: new mongoose.Types.ObjectId(storeId), isActive: true } },
      {
        $match: {
          $or: [
            // Both strip and individual enabled: Low stock based on STRIP STOCK ONLY
            {
              $and: [
                { 'unitTypes.hasStrips': true },
                { 'unitTypes.hasIndividual': true },
                { $expr: { $lte: ['$stripInfo.stock', '$stripInfo.minStock'] } }
              ]
            },
            // Only strips enabled
            {
              $and: [
                { 'unitTypes.hasStrips': true },
                { 'unitTypes.hasIndividual': { $ne: true } },
                { $expr: { $lte: ['$stripInfo.stock', '$stripInfo.minStock'] } }
              ]
            },
            // Only individual enabled
            {
              $and: [
                { 'unitTypes.hasIndividual': true },
                { 'unitTypes.hasStrips': { $ne: true } },
                { $expr: { $lte: ['$individualInfo.stock', '$individualInfo.minStock'] } }
              ]
            }
          ]
        }
      },
      {
        $project: {
          name: 1,
          genericName: 1,
          stripInfo: 1,
          individualInfo: 1,
          unitTypes: 1
        }
      }
    ]);

    console.log(`Found ${lowStockMedicines.length} low stock medicines:`);
    lowStockMedicines.forEach((med, index) => {
      console.log(`${index + 1}. ${med.name}`);
      console.log(`   Strip: ${med.stripInfo.stock}/${med.stripInfo.minStock}`);
      console.log(`   Individual: ${med.individualInfo.stock}/${med.individualInfo.minStock}`);
    });

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

checkLowStock();

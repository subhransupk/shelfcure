const mongoose = require('mongoose');
const Medicine = require('./models/Medicine');

async function analyzeLowStock() {
  try {
    await mongoose.connect('mongodb://localhost:27017/shelfcure', { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('Connected to MongoDB');
    
    // Get a sample medicine to understand the data structure
    const sampleMedicine = await Medicine.findOne().lean();
    console.log('Sample Medicine Structure:');
    console.log(JSON.stringify(sampleMedicine, null, 2));
    
    // Count total medicines
    const totalCount = await Medicine.countDocuments();
    console.log('\nTotal medicines in database:', totalCount);
    
    console.log('\n=== LOW STOCK ANALYSIS ===');
    
    // Method 1: Dashboard aggregation (corrected logic)
    const dashboardResult = await Medicine.aggregate([
      {
        $match: {
          $or: [
            {
              $and: [
                { 'unitTypes.hasStrips': true },
                { 'unitTypes.hasIndividual': true },
                { $expr: { $lte: ['$stripInfo.stock', '$stripInfo.minStock'] } }
              ]
            },
            {
              $and: [
                { 'unitTypes.hasStrips': true },
                { 'unitTypes.hasIndividual': { $ne: true } },
                { $expr: { $lte: ['$stripInfo.stock', '$stripInfo.minStock'] } }
              ]
            },
            {
              $and: [
                { 'unitTypes.hasIndividual': true },
                { 'unitTypes.hasStrips': { $ne: true } },
                { $expr: { $lte: ['$individualInfo.stock', '$individualInfo.minStock'] } }
              ]
            },
            {
              $and: [
                { 'unitTypes': { $exists: false } },
                { $expr: { $lte: ['$inventory.stripQuantity', '$inventory.stripMinimumStock'] } }
              ]
            }
          ]
        }
      },
      { $count: 'lowStockCount' }
    ]);
    
    console.log('Dashboard method result:', dashboardResult);
    
    // Method 2: Analytics method
    const analyticsCount = await Medicine.countDocuments({
      isActive: true,
      $or: [
        {
          'unitTypes.hasStrips': true,
          $expr: { $lte: ['$stripInfo.stock', '$stripInfo.minStock'] }
        },
        {
          'unitTypes.hasIndividual': true,
          $expr: { $lte: ['$individualInfo.stock', '$individualInfo.minStock'] }
        },
        {
          'unitTypes.hasStrips': { $ne: true },
          'unitTypes.hasIndividual': { $ne: true },
          $expr: { $lte: ['$stock', '$minStock'] }
        }
      ]
    });
    
    console.log('Analytics method result:', analyticsCount);
    
    // Method 3: Check what the virtual field returns
    const medicinesWithVirtual = await Medicine.find().limit(5);
    console.log('\nVirtual isLowStock field results:');
    medicinesWithVirtual.forEach((med, index) => {
      console.log(`Medicine ${index + 1}: ${med.name} - isLowStock: ${med.isLowStock}`);
    });
    
    // Get some actual low stock medicines to examine
    const lowStockMedicines = await Medicine.find({
      isActive: true,
      $or: [
        {
          'unitTypes.hasStrips': true,
          $expr: { $lte: ['$stripInfo.stock', '$stripInfo.minStock'] }
        },
        {
          'unitTypes.hasIndividual': true,
          $expr: { $lte: ['$individualInfo.stock', '$individualInfo.minStock'] }
        }
      ]
    }).limit(3).lean();
    
    console.log('\nSample Low Stock Medicines:');
    lowStockMedicines.forEach((med, index) => {
      console.log(`Medicine ${index + 1}:`);
      console.log(`  Name: ${med.name}`);
      console.log(`  Unit Types: ${JSON.stringify(med.unitTypes)}`);
      console.log(`  Strip Info: ${JSON.stringify(med.stripInfo)}`);
      console.log(`  Individual Info: ${JSON.stringify(med.individualInfo)}`);
      console.log(`  Legacy Stock: ${med.stock}, Min: ${med.minStock}`);
      console.log('---');
    });
    
    await mongoose.disconnect();
    console.log('\nDatabase connection closed');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

analyzeLowStock();

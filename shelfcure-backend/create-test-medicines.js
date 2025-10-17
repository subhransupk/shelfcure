require('dotenv').config();
const mongoose = require('mongoose');
const Medicine = require('./models/Medicine');

async function createTestMedicines() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const storeId = '68ec9f46a1597adc370d916f';
    const userId = '68ec9f46a1597adc370d9174';

    console.log('🧪 Creating test medicines for notification testing...');

    // Create medicines with low stock
    const lowStockMedicines = [
      {
        name: 'Aspirin 75mg',
        genericName: 'Acetylsalicylic Acid',
        composition: 'Aspirin 75mg',
        manufacturer: 'Bayer',
        category: 'Tablet',
        store: storeId,
        createdBy: userId,
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
        unitTypes: {
          hasStrips: true,
          hasIndividual: true,
          unitsPerStrip: 10
        },
        stripInfo: {
          purchasePrice: 12,
          sellingPrice: 15,
          mrp: 18,
          stock: 2, // Low stock
          minStock: 10,
          reorderLevel: 15
        },
        individualInfo: {
          purchasePrice: 1.2,
          sellingPrice: 1.5,
          mrp: 1.8,
          stock: 20, // Low stock
          minStock: 100,
          reorderLevel: 150
        }
      },
      {
        name: 'Ibuprofen 400mg',
        genericName: 'Ibuprofen',
        composition: 'Ibuprofen 400mg',
        manufacturer: 'Abbott',
        category: 'Tablet',
        store: storeId,
        createdBy: userId,
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months from now
        unitTypes: {
          hasStrips: true,
          hasIndividual: true,
          unitsPerStrip: 10
        },
        stripInfo: {
          purchasePrice: 18,
          sellingPrice: 22,
          mrp: 25,
          stock: 1, // Very low stock
          minStock: 15,
          reorderLevel: 20
        },
        individualInfo: {
          purchasePrice: 1.8,
          sellingPrice: 2.2,
          mrp: 2.5,
          stock: 10, // Very low stock
          minStock: 150,
          reorderLevel: 200
        }
      }
    ];

    // Create medicines with expiring dates
    const expiringMedicines = [
      {
        name: 'Cough Syrup',
        genericName: 'Dextromethorphan',
        composition: 'Dextromethorphan 15mg/5ml',
        manufacturer: 'Sun Pharma',
        category: 'Syrup',
        store: storeId,
        createdBy: userId,
        expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now - critical
        unitTypes: {
          hasStrips: false,
          hasIndividual: true,
          unitsPerStrip: 1
        },
        stripInfo: {
          purchasePrice: 0,
          sellingPrice: 0,
          mrp: 0,
          stock: 0,
          minStock: 0,
          reorderLevel: 0
        },
        individualInfo: {
          purchasePrice: 45,
          sellingPrice: 55,
          mrp: 60,
          stock: 25,
          minStock: 5,
          reorderLevel: 10
        }
      },
      {
        name: 'Vitamin C Tablets',
        genericName: 'Ascorbic Acid',
        composition: 'Vitamin C 500mg',
        manufacturer: 'Himalaya',
        category: 'Tablet',
        store: storeId,
        createdBy: userId,
        expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now - warning
        unitTypes: {
          hasStrips: true,
          hasIndividual: true,
          unitsPerStrip: 10
        },
        stripInfo: {
          purchasePrice: 8,
          sellingPrice: 12,
          mrp: 15,
          stock: 50,
          minStock: 10,
          reorderLevel: 20
        },
        individualInfo: {
          purchasePrice: 0.8,
          sellingPrice: 1.2,
          mrp: 1.5,
          stock: 500,
          minStock: 100,
          reorderLevel: 200
        }
      }
    ];

    // Create all test medicines
    const allTestMedicines = [...lowStockMedicines, ...expiringMedicines];
    
    for (const medicineData of allTestMedicines) {
      // Check if medicine already exists
      const existing = await Medicine.findOne({ 
        name: medicineData.name, 
        store: storeId 
      });
      
      if (!existing) {
        const medicine = await Medicine.create(medicineData);
        console.log(`✅ Created medicine: ${medicine.name}`);
        console.log(`   Stock: ${medicine.stripInfo.stock} strips, ${medicine.individualInfo.stock} units`);
        console.log(`   Expiry: ${medicine.expiryDate ? medicine.expiryDate.toDateString() : 'No expiry set'}`);
      } else {
        console.log(`⚠️ Medicine already exists: ${medicineData.name}`);
      }
    }

    console.log('\n📊 Summary of test medicines created:');
    console.log(`- ${lowStockMedicines.length} medicines with low stock`);
    console.log(`- ${expiringMedicines.length} medicines with expiring dates`);
    
    console.log('\n✅ Test medicines creation completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating test medicines:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

createTestMedicines();

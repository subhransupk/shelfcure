const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
const Rack = require('../models/Rack');
const RackLocation = require('../models/RackLocation');
const Store = require('../models/Store');
require('dotenv').config();

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Migration script to convert legacy storage locations to new rack system
const migrateStorageLocations = async () => {
  try {
    console.log('🔄 Starting rack system migration...');

    // Get all stores
    const stores = await Store.find({ isActive: true });
    console.log(`📊 Found ${stores.length} active stores`);

    for (const store of stores) {
      console.log(`\n🏪 Processing store: ${store.name} (${store.code})`);

      // Create default racks for stores that don't have any
      const existingRacks = await Rack.find({ store: store._id, isActive: true });
      
      if (existingRacks.length === 0) {
        console.log('  📦 Creating default racks...');
        
        // Create default racks
        const defaultRacks = [
          {
            rackNumber: 'R001',
            name: 'General Storage Rack 1',
            description: 'Main storage rack for general medicines',
            category: 'general',
            store: store._id,
            location: { zone: 'Main Area', floor: 'Ground' },
            specifications: { material: 'steel', maxCapacity: 100 },
            shelves: [
              {
                shelfNumber: '1',
                positions: Array.from({ length: 10 }, (_, i) => ({
                  positionNumber: (i + 1).toString(),
                  isOccupied: false
                }))
              },
              {
                shelfNumber: '2',
                positions: Array.from({ length: 10 }, (_, i) => ({
                  positionNumber: (i + 1).toString(),
                  isOccupied: false
                }))
              },
              {
                shelfNumber: '3',
                positions: Array.from({ length: 10 }, (_, i) => ({
                  positionNumber: (i + 1).toString(),
                  isOccupied: false
                }))
              }
            ],
            createdBy: store.owner
          },
          {
            rackNumber: 'R002',
            name: 'Refrigerated Storage Rack',
            description: 'Temperature controlled storage for refrigerated medicines',
            category: 'refrigerated',
            store: store._id,
            location: { zone: 'Cold Storage', floor: 'Ground' },
            specifications: { 
              material: 'steel', 
              maxCapacity: 50,
              specialConditions: ['refrigerated', 'temperature_controlled']
            },
            shelves: [
              {
                shelfNumber: '1',
                positions: Array.from({ length: 8 }, (_, i) => ({
                  positionNumber: (i + 1).toString(),
                  isOccupied: false
                }))
              },
              {
                shelfNumber: '2',
                positions: Array.from({ length: 8 }, (_, i) => ({
                  positionNumber: (i + 1).toString(),
                  isOccupied: false
                }))
              }
            ],
            createdBy: store.owner
          },
          {
            rackNumber: 'R003',
            name: 'Controlled Substances Rack',
            description: 'Secure storage for controlled substances',
            category: 'controlled_substances',
            store: store._id,
            location: { zone: 'Secure Area', floor: 'Ground' },
            specifications: { 
              material: 'steel', 
              maxCapacity: 30,
              specialConditions: ['secure', 'restricted_access']
            },
            accessLevel: 'manager_only',
            shelves: [
              {
                shelfNumber: '1',
                positions: Array.from({ length: 6 }, (_, i) => ({
                  positionNumber: (i + 1).toString(),
                  isOccupied: false
                }))
              }
            ],
            createdBy: store.owner
          }
        ];

        const createdRacks = await Rack.insertMany(defaultRacks);
        console.log(`  ✅ Created ${createdRacks.length} default racks`);
      }

      // Get medicines with legacy storage locations
      const medicinesWithLegacyLocations = await Medicine.find({
        store: store._id,
        isActive: true,
        $or: [
          { 'storageLocation.rack': { $exists: true, $ne: '' } },
          { 'storageLocation.shelf': { $exists: true, $ne: '' } },
          { 'storageLocation.position': { $exists: true, $ne: '' } }
        ]
      });

      console.log(`  📋 Found ${medicinesWithLegacyLocations.length} medicines with legacy storage locations`);

      // Get all racks for this store
      const storeRacks = await Rack.find({ store: store._id, isActive: true });
      const generalRack = storeRacks.find(r => r.category === 'general');

      if (!generalRack) {
        console.log('  ⚠️  No general rack found, skipping medicine migration');
        continue;
      }

      let migratedCount = 0;
      let skippedCount = 0;

      for (const medicine of medicinesWithLegacyLocations) {
        try {
          // Check if this medicine already has rack locations
          const existingRackLocation = await RackLocation.findOne({
            medicine: medicine._id,
            store: store._id,
            isActive: true
          });

          if (existingRackLocation) {
            skippedCount++;
            continue;
          }

          // Determine target rack based on medicine category or storage conditions
          let targetRack = generalRack;
          
          if (medicine.storageConditions?.specialConditions?.includes('refrigerated')) {
            const refrigeratedRack = storeRacks.find(r => r.category === 'refrigerated');
            if (refrigeratedRack) targetRack = refrigeratedRack;
          }

          if (medicine.requiresPrescription && medicine.category === 'controlled_substances') {
            const controlledRack = storeRacks.find(r => r.category === 'controlled_substances');
            if (controlledRack) targetRack = controlledRack;
          }

          // Find an available position in the target rack
          let assignedShelf = null;
          let assignedPosition = null;

          for (const shelf of targetRack.shelves) {
            const availablePosition = shelf.positions.find(p => !p.isOccupied);
            if (availablePosition) {
              assignedShelf = shelf.shelfNumber;
              assignedPosition = availablePosition.positionNumber;
              break;
            }
          }

          if (!assignedShelf || !assignedPosition) {
            console.log(`    ⚠️  No available positions in ${targetRack.name} for ${medicine.name}`);
            skippedCount++;
            continue;
          }

          // Create rack location
          const rackLocation = await RackLocation.create({
            medicine: medicine._id,
            store: store._id,
            rack: targetRack._id,
            shelf: assignedShelf,
            position: assignedPosition,
            stripQuantity: medicine.stripInfo?.stock || 0,
            individualQuantity: medicine.individualInfo?.stock || 0,
            priority: 'primary',
            assignedBy: store.owner,
            notes: 'Migrated from legacy storage location',
            movementHistory: [{
              action: 'assigned',
              quantity: {
                strips: medicine.stripInfo?.stock || 0,
                individual: medicine.individualInfo?.stock || 0
              },
              performedBy: store.owner,
              reason: 'Migration from legacy system',
              notes: `Legacy location: ${medicine.storageLocation?.rack || 'Unknown'}-${medicine.storageLocation?.shelf || 'Unknown'}-${medicine.storageLocation?.position || 'Unknown'}`
            }]
          });

          // Update rack position occupancy
          targetRack.updatePositionOccupancy(assignedShelf, assignedPosition, true);
          await targetRack.save();

          migratedCount++;

        } catch (error) {
          console.error(`    ❌ Error migrating ${medicine.name}:`, error.message);
          skippedCount++;
        }
      }

      console.log(`  ✅ Migration completed for ${store.name}:`);
      console.log(`     - Migrated: ${migratedCount} medicines`);
      console.log(`     - Skipped: ${skippedCount} medicines`);
    }

    console.log('\n🎉 Rack system migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Rollback function to remove migrated data if needed
const rollbackMigration = async () => {
  try {
    console.log('🔄 Starting rollback...');

    const result = await RackLocation.deleteMany({
      'movementHistory.reason': 'Migration from legacy system'
    });

    console.log(`✅ Rollback completed. Removed ${result.deletedCount} migrated rack locations.`);

  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  await connectDB();

  const command = process.argv[2];

  try {
    switch (command) {
      case 'migrate':
        await migrateStorageLocations();
        break;
      case 'rollback':
        await rollbackMigration();
        break;
      default:
        console.log('Usage: node migrateRackSystem.js [migrate|rollback]');
        console.log('  migrate  - Migrate legacy storage locations to new rack system');
        console.log('  rollback - Remove migrated rack locations');
    }
  } catch (error) {
    console.error('Script execution failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  migrateStorageLocations,
  rollbackMigration
};

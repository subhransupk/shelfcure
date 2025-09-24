const mongoose = require('mongoose');
const Rack = require('../models/Rack');
const RackLocation = require('../models/RackLocation');
const Medicine = require('../models/Medicine');
const Store = require('../models/Store');
const User = require('../models/User');
require('dotenv').config();

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Sample rack configurations
const getSampleRacks = (storeId, createdBy) => [
  {
    rackNumber: 'A001',
    name: 'Main Pharmacy Rack A',
    description: 'Primary storage for commonly used medicines',
    category: 'general',
    store: storeId,
    location: {
      zone: 'Front Counter Area',
      floor: 'Ground',
      coordinates: { x: 10, y: 5 }
    },
    specifications: {
      material: 'steel',
      maxCapacity: 120,
      specialConditions: ['dry', 'ventilated']
    },
    accessLevel: 'public',
    shelves: [
      {
        shelfNumber: '1',
        positions: Array.from({ length: 12 }, (_, i) => ({
          positionNumber: (i + 1).toString().padStart(2, '0'),
          isOccupied: false,
          width: 15,
          height: 20,
          depth: 10,
          maxWeight: 5
        }))
      },
      {
        shelfNumber: '2',
        positions: Array.from({ length: 12 }, (_, i) => ({
          positionNumber: (i + 1).toString().padStart(2, '0'),
          isOccupied: false,
          width: 15,
          height: 20,
          depth: 10,
          maxWeight: 5
        }))
      },
      {
        shelfNumber: '3',
        positions: Array.from({ length: 12 }, (_, i) => ({
          positionNumber: (i + 1).toString().padStart(2, '0'),
          isOccupied: false,
          width: 15,
          height: 20,
          depth: 10,
          maxWeight: 5
        }))
      }
    ],
    createdBy,
    tags: ['main', 'general', 'high-traffic']
  },
  {
    rackNumber: 'B001',
    name: 'Cold Storage Rack B',
    description: 'Temperature-controlled storage for refrigerated medicines',
    category: 'refrigerated',
    store: storeId,
    location: {
      zone: 'Cold Storage Room',
      floor: 'Ground',
      coordinates: { x: 25, y: 15 }
    },
    specifications: {
      material: 'steel',
      maxCapacity: 60,
      specialConditions: ['refrigerated', 'temperature_controlled', 'humidity_controlled'],
      temperature: { min: 2, max: 8, unit: 'celsius' },
      humidity: { min: 45, max: 65 }
    },
    accessLevel: 'restricted',
    shelves: [
      {
        shelfNumber: '1',
        positions: Array.from({ length: 10 }, (_, i) => ({
          positionNumber: (i + 1).toString().padStart(2, '0'),
          isOccupied: false,
          width: 12,
          height: 15,
          depth: 8,
          maxWeight: 3
        }))
      },
      {
        shelfNumber: '2',
        positions: Array.from({ length: 10 }, (_, i) => ({
          positionNumber: (i + 1).toString().padStart(2, '0'),
          isOccupied: false,
          width: 12,
          height: 15,
          depth: 8,
          maxWeight: 3
        }))
      }
    ],
    createdBy,
    tags: ['cold', 'refrigerated', 'temperature-sensitive']
  },
  {
    rackNumber: 'C001',
    name: 'Controlled Substances Vault',
    description: 'Secure storage for controlled and scheduled medicines',
    category: 'controlled_substances',
    store: storeId,
    location: {
      zone: 'Secure Vault',
      floor: 'Ground',
      coordinates: { x: 5, y: 25 }
    },
    specifications: {
      material: 'steel',
      maxCapacity: 40,
      specialConditions: ['secure', 'restricted_access', 'monitored']
    },
    accessLevel: 'manager_only',
    shelves: [
      {
        shelfNumber: '1',
        positions: Array.from({ length: 8 }, (_, i) => ({
          positionNumber: (i + 1).toString().padStart(2, '0'),
          isOccupied: false,
          width: 10,
          height: 12,
          depth: 8,
          maxWeight: 2
        }))
      },
      {
        shelfNumber: '2',
        positions: Array.from({ length: 8 }, (_, i) => ({
          positionNumber: (i + 1).toString().padStart(2, '0'),
          isOccupied: false,
          width: 10,
          height: 12,
          depth: 8,
          maxWeight: 2
        }))
      }
    ],
    createdBy,
    tags: ['controlled', 'secure', 'restricted']
  },
  {
    rackNumber: 'D001',
    name: 'OTC Medicines Rack D',
    description: 'Over-the-counter medicines and general health products',
    category: 'otc',
    store: storeId,
    location: {
      zone: 'Customer Area',
      floor: 'Ground',
      coordinates: { x: 15, y: 10 }
    },
    specifications: {
      material: 'steel',
      maxCapacity: 100,
      specialConditions: ['dry', 'accessible']
    },
    accessLevel: 'public',
    shelves: [
      {
        shelfNumber: '1',
        positions: Array.from({ length: 15 }, (_, i) => ({
          positionNumber: (i + 1).toString().padStart(2, '0'),
          isOccupied: false,
          width: 12,
          height: 18,
          depth: 10,
          maxWeight: 4
        }))
      },
      {
        shelfNumber: '2',
        positions: Array.from({ length: 15 }, (_, i) => ({
          positionNumber: (i + 1).toString().padStart(2, '0'),
          isOccupied: false,
          width: 12,
          height: 18,
          depth: 10,
          maxWeight: 4
        }))
      }
    ],
    createdBy,
    tags: ['otc', 'customer-accessible', 'general-health']
  },
  {
    rackNumber: 'E001',
    name: 'Emergency Medicine Rack',
    description: 'Quick access storage for emergency and critical medicines',
    category: 'emergency',
    store: storeId,
    location: {
      zone: 'Emergency Station',
      floor: 'Ground',
      coordinates: { x: 20, y: 5 }
    },
    specifications: {
      material: 'steel',
      maxCapacity: 50,
      specialConditions: ['quick_access', 'monitored']
    },
    accessLevel: 'restricted',
    shelves: [
      {
        shelfNumber: '1',
        positions: Array.from({ length: 10 }, (_, i) => ({
          positionNumber: (i + 1).toString().padStart(2, '0'),
          isOccupied: false,
          width: 15,
          height: 20,
          depth: 12,
          maxWeight: 5
        }))
      }
    ],
    createdBy,
    tags: ['emergency', 'critical', 'quick-access']
  }
];

// Seed sample rack data
const seedRackData = async () => {
  try {
    console.log('🌱 Starting rack data seeding...');

    // Get all active stores
    const stores = await Store.find({ isActive: true }).populate('owner');
    console.log(`📊 Found ${stores.length} active stores`);

    if (stores.length === 0) {
      console.log('⚠️  No active stores found. Please create stores first.');
      return;
    }

    let totalRacksCreated = 0;

    for (const store of stores) {
      console.log(`\n🏪 Processing store: ${store.name} (${store.code})`);

      // Check if store already has racks
      const existingRacks = await Rack.find({ store: store._id, isActive: true });
      
      if (existingRacks.length > 0) {
        console.log(`  ⏭️  Store already has ${existingRacks.length} racks, skipping...`);
        continue;
      }

      // Get store owner or first store manager as creator
      let creator = store.owner;
      if (!creator) {
        const storeManager = await User.findOne({
          role: 'store_manager',
          stores: store._id,
          isActive: true
        });
        creator = storeManager;
      }

      if (!creator) {
        console.log('  ⚠️  No valid creator found for store, skipping...');
        continue;
      }

      // Create sample racks
      const sampleRacks = getSampleRacks(store._id, creator._id);
      
      try {
        const createdRacks = await Rack.insertMany(sampleRacks);
        totalRacksCreated += createdRacks.length;
        
        console.log(`  ✅ Created ${createdRacks.length} sample racks:`);
        createdRacks.forEach(rack => {
          console.log(`     - ${rack.rackNumber}: ${rack.name} (${rack.category})`);
        });

      } catch (error) {
        console.error(`  ❌ Error creating racks for ${store.name}:`, error.message);
      }
    }

    console.log(`\n🎉 Rack seeding completed! Created ${totalRacksCreated} racks total.`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};

// Seed sample medicine assignments to racks
const seedMedicineAssignments = async () => {
  try {
    console.log('🌱 Starting medicine assignment seeding...');

    const stores = await Store.find({ isActive: true });
    let totalAssignments = 0;

    for (const store of stores) {
      console.log(`\n🏪 Processing store: ${store.name}`);

      // Get racks for this store
      const racks = await Rack.find({ store: store._id, isActive: true });
      if (racks.length === 0) {
        console.log('  ⚠️  No racks found, skipping...');
        continue;
      }

      // Get medicines for this store
      const medicines = await Medicine.find({ 
        store: store._id, 
        isActive: true 
      }).limit(20); // Limit to first 20 medicines for demo

      if (medicines.length === 0) {
        console.log('  ⚠️  No medicines found, skipping...');
        continue;
      }

      let assignmentCount = 0;

      for (const medicine of medicines) {
        try {
          // Check if medicine already has rack assignments
          const existingAssignment = await RackLocation.findOne({
            medicine: medicine._id,
            store: store._id,
            isActive: true
          });

          if (existingAssignment) continue;

          // Select appropriate rack based on medicine category
          let targetRack = racks.find(r => r.category === 'general'); // Default

          if (medicine.category === 'Injection' || medicine.requiresPrescription) {
            const controlledRack = racks.find(r => r.category === 'controlled_substances');
            if (controlledRack) targetRack = controlledRack;
          } else if (medicine.storageConditions?.specialConditions?.includes('refrigerated')) {
            const coldRack = racks.find(r => r.category === 'refrigerated');
            if (coldRack) targetRack = coldRack;
          } else if (!medicine.requiresPrescription) {
            const otcRack = racks.find(r => r.category === 'otc');
            if (otcRack) targetRack = otcRack;
          }

          if (!targetRack) continue;

          // Find available position
          let availableShelf = null;
          let availablePosition = null;

          for (const shelf of targetRack.shelves) {
            const position = shelf.positions.find(p => !p.isOccupied);
            if (position) {
              availableShelf = shelf.shelfNumber;
              availablePosition = position.positionNumber;
              break;
            }
          }

          if (!availableShelf) continue;

          // Create rack location
          await RackLocation.create({
            medicine: medicine._id,
            store: store._id,
            rack: targetRack._id,
            shelf: availableShelf,
            position: availablePosition,
            stripQuantity: Math.floor(Math.random() * 50) + 10,
            individualQuantity: Math.floor(Math.random() * 200) + 50,
            priority: Math.random() > 0.7 ? 'secondary' : 'primary',
            assignedBy: store.owner,
            notes: 'Sample assignment for testing',
            movementHistory: [{
              action: 'assigned',
              quantity: {
                strips: Math.floor(Math.random() * 50) + 10,
                individual: Math.floor(Math.random() * 200) + 50
              },
              performedBy: store.owner,
              reason: 'Initial sample assignment',
              notes: 'Created during seeding process'
            }]
          });

          // Update rack position occupancy
          targetRack.updatePositionOccupancy(availableShelf, availablePosition, true);
          await targetRack.save();

          assignmentCount++;

        } catch (error) {
          console.error(`    ❌ Error assigning ${medicine.name}:`, error.message);
        }
      }

      totalAssignments += assignmentCount;
      console.log(`  ✅ Created ${assignmentCount} medicine assignments`);
    }

    console.log(`\n🎉 Medicine assignment seeding completed! Created ${totalAssignments} assignments total.`);

  } catch (error) {
    console.error('❌ Assignment seeding failed:', error);
    throw error;
  }
};

// Clean up seeded data
const cleanupSeedData = async () => {
  try {
    console.log('🧹 Cleaning up seeded data...');

    // Remove seeded rack locations
    const locationResult = await RackLocation.deleteMany({
      'movementHistory.reason': { $in: ['Initial sample assignment', 'Created during seeding process'] }
    });

    // Remove seeded racks
    const rackResult = await Rack.deleteMany({
      tags: { $in: ['main', 'general', 'high-traffic'] }
    });

    console.log(`✅ Cleanup completed:`);
    console.log(`   - Removed ${locationResult.deletedCount} rack locations`);
    console.log(`   - Removed ${rackResult.deletedCount} racks`);

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  await connectDB();

  const command = process.argv[2];

  try {
    switch (command) {
      case 'racks':
        await seedRackData();
        break;
      case 'assignments':
        await seedMedicineAssignments();
        break;
      case 'all':
        await seedRackData();
        await seedMedicineAssignments();
        break;
      case 'cleanup':
        await cleanupSeedData();
        break;
      default:
        console.log('Usage: node seedRackData.js [racks|assignments|all|cleanup]');
        console.log('  racks       - Seed sample rack structures');
        console.log('  assignments - Seed sample medicine assignments');
        console.log('  all         - Seed both racks and assignments');
        console.log('  cleanup     - Remove all seeded data');
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
  seedRackData,
  seedMedicineAssignments,
  cleanupSeedData
};

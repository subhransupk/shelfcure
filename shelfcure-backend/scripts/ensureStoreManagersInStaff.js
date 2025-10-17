/**
 * Migration Script: Ensure All Store Managers are in Staff Collection
 * 
 * This script finds all users with role 'store_manager' and ensures they
 * have corresponding Staff records in the Staff collection.
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Staff = require('../models/Staff');
const Store = require('../models/Store');
require('dotenv').config();

const ensureStoreManagersInStaff = async () => {
  try {
    console.log('🔄 Starting Store Manager to Staff migration...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Find all users with role 'store_manager'
    const storeManagers = await User.find({ role: 'store_manager' })
      .populate('currentStore', 'name')
      .populate('stores', 'name');

    console.log(`📊 Found ${storeManagers.length} store managers\n`);

    let createdCount = 0;
    let existingCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const manager of storeManagers) {
      try {
        console.log(`\n🔍 Processing: ${manager.name} (${manager.email})`);

        // Get the store(s) this manager is associated with
        const stores = manager.stores && manager.stores.length > 0 
          ? manager.stores 
          : (manager.currentStore ? [manager.currentStore] : []);

        if (stores.length === 0) {
          console.log(`⚠️  Skipped: No stores associated with ${manager.name}`);
          skippedCount++;
          continue;
        }

        // Process each store
        for (const store of stores) {
          const storeId = store._id || store;
          console.log(`   📍 Checking store: ${store.name || storeId}`);

          // Check if staff record already exists
          const existingStaff = await Staff.findOne({
            store: storeId,
            $or: [
              { userAccount: manager._id },
              { email: manager.email }
            ]
          });

          if (existingStaff) {
            console.log(`   ✅ Staff record already exists: ${existingStaff.employeeId}`);
            
            // Ensure userAccount is linked
            if (!existingStaff.userAccount) {
              existingStaff.userAccount = manager._id;
              await existingStaff.save();
              console.log(`   🔗 Linked userAccount to existing staff record`);
            }

            // Ensure role is store_manager
            if (existingStaff.role !== 'store_manager') {
              existingStaff.role = 'store_manager';
              await existingStaff.save();
              console.log(`   🔄 Updated role to store_manager`);
            }

            // Sync lastSeen
            if (manager.lastLogin || manager.lastActivity) {
              existingStaff.lastSeen = manager.lastLogin || manager.lastActivity;
              existingStaff.lastActivity = manager.lastActivity || manager.lastLogin;
              await existingStaff.save();
              console.log(`   🕐 Synced lastSeen: ${existingStaff.lastSeen}`);
            }

            existingCount++;
            continue;
          }

          // Create new staff record
          console.log(`   📝 Creating new staff record...`);

          // Generate unique employee ID
          const existingStaffCount = await Staff.countDocuments({ store: storeId });
          const employeeId = `MGR${String(existingStaffCount + 1).padStart(3, '0')}`;

          const staffData = {
            name: manager.name,
            email: manager.email,
            phone: manager.phone || '0000000000',
            employeeId: employeeId,
            role: 'store_manager',
            department: 'administration',
            dateOfJoining: manager.createdAt || new Date(),
            salary: 0,
            workingHours: 'full_time',
            status: 'active',
            hasSystemAccess: true,
            userAccount: manager._id,
            lastSeen: manager.lastLogin || manager.lastActivity,
            lastActivity: manager.lastActivity || manager.lastLogin,
            permissions: [
              'inventory_read', 
              'inventory_write', 
              'sales_read', 
              'sales_write', 
              'reports_read', 
              'customer_management'
            ],
            store: storeId,
            createdBy: manager._id
          };

          const newStaff = await Staff.create(staffData);
          console.log(`   ✅ Created staff record: ${newStaff.employeeId}`);
          createdCount++;
        }
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Error processing ${manager.name}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ New staff records created: ${createdCount}`);
    console.log(`✅ Existing staff records found: ${existingCount}`);
    console.log(`⚠️  Skipped (no stores): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(60) + '\n');

    // Verify results
    console.log('🔍 Verification: Checking all store managers have staff records...\n');

    let verifiedCount = 0;
    let missingCount = 0;

    for (const manager of storeManagers) {
      const staffRecords = await Staff.find({
        $or: [
          { userAccount: manager._id },
          { email: manager.email }
        ]
      });

      if (staffRecords.length > 0) {
        verifiedCount++;
        console.log(`✅ ${manager.name}: ${staffRecords.length} staff record(s)`);
      } else {
        missingCount++;
        console.log(`❌ ${manager.name}: NO staff records found`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Verification Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Store managers with staff records: ${verifiedCount}`);
    console.log(`❌ Store managers missing staff records: ${missingCount}`);
    console.log('='.repeat(60) + '\n');

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run the migration
ensureStoreManagersInStaff();


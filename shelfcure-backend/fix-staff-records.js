require('dotenv').config();
const mongoose = require('mongoose');
const Staff = require('./models/Staff');
const User = require('./models/User');
const Store = require('./models/Store');

const fixStaffRecords = async () => {
  try {
    console.log('🔧 Fixing Staff Records...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Step 1: Clean up broken staff references in Store collection
    console.log('🧹 Cleaning up broken staff references in stores...');
    const stores = await Store.find({}).populate('staff.user', 'name email role');
    
    for (const store of stores) {
      if (store.staff && store.staff.length > 0) {
        const validStaff = [];
        
        for (const staffMember of store.staff) {
          if (staffMember.user && staffMember.user.name) {
            validStaff.push(staffMember);
            console.log(`  ✅ Valid staff: ${staffMember.user.name} (${staffMember.role})`);
          } else {
            console.log(`  ❌ Removing broken staff reference: ${staffMember._id}`);
          }
        }
        
        // Update store with only valid staff
        if (validStaff.length !== store.staff.length) {
          await Store.findByIdAndUpdate(store._id, { staff: validStaff });
          console.log(`  🔄 Updated store ${store.name} staff list`);
        }
      }
    }
    
    // Step 2: Ensure all store managers have proper Staff records
    console.log('\n👥 Ensuring store managers have Staff records...');
    const storeManagers = await User.find({ role: 'store_manager' }).populate('currentStore', 'name code');
    
    for (const manager of storeManagers) {
      if (manager.currentStore) {
        const storeId = manager.currentStore._id;
        
        // Check if staff record exists for this manager in this store
        const existingStaff = await Staff.findOne({
          store: storeId,
          $or: [
            { email: manager.email },
            { createdBy: manager._id }
          ]
        });
        
        if (!existingStaff) {
          // Check if there's a staff record with this email but different store
          const staffByEmail = await Staff.findOne({ email: manager.email });

          if (staffByEmail) {
            // Update existing staff record to link to correct store
            await Staff.findByIdAndUpdate(staffByEmail._id, {
              store: storeId,
              updatedBy: manager._id,
              role: 'store_manager',
              name: manager.name // Update name in case it changed
            });
            console.log(`  🔄 Updated existing Staff record for ${manager.name} to link to ${manager.currentStore.name}`);
          } else {
            // Generate unique employee ID
            const existingStaffCount = await Staff.countDocuments({ store: storeId });
            const employeeId = `MGR${String(existingStaffCount + 1).padStart(3, '0')}`;

            // Create staff record
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
              permissions: ['inventory_read', 'inventory_write', 'sales_read', 'sales_write', 'reports_read', 'customer_management'],
              store: storeId,
              createdBy: manager._id
            };

            const newStaff = await Staff.create(staffData);
            console.log(`  ✅ Created Staff record for ${manager.name} at ${manager.currentStore.name}`);
          }
        } else {
          // Update existing staff record to ensure it's linked to correct store
          if (!existingStaff.store || !existingStaff.store.equals(storeId)) {
            await Staff.findByIdAndUpdate(existingStaff._id, { 
              store: storeId,
              updatedBy: manager._id 
            });
            console.log(`  🔄 Updated Staff record for ${manager.name} to link to ${manager.currentStore.name}`);
          } else {
            console.log(`  ✅ Staff record already exists for ${manager.name} at ${manager.currentStore.name}`);
          }
        }
      } else {
        console.log(`  ⚠️ Store manager ${manager.name} has no assigned store`);
      }
    }
    
    // Step 3: Remove orphaned staff records (not linked to any store)
    console.log('\n🗑️ Cleaning up orphaned staff records...');
    const orphanedStaff = await Staff.find({ 
      $or: [
        { store: null },
        { store: { $exists: false } }
      ]
    });
    
    for (const staff of orphanedStaff) {
      console.log(`  ❌ Removing orphaned staff record: ${staff.name} (${staff.email})`);
      await Staff.findByIdAndDelete(staff._id);
    }
    
    // Step 4: Verify the fix
    console.log('\n🔍 Verification - Final state:');
    const finalStaff = await Staff.find({}).populate('store', 'name code');
    console.log(`📋 Total Staff Records: ${finalStaff.length}`);
    finalStaff.forEach(staff => {
      console.log(`  - ${staff.name} (${staff.role}) at ${staff.store?.name || 'No Store'} - Status: ${staff.status}`);
    });
    
    const finalStoreManagers = await User.find({ role: 'store_manager' }).populate('currentStore', 'name code');
    console.log(`\n👥 Store Managers: ${finalStoreManagers.length}`);
    for (const manager of finalStoreManagers) {
      if (manager.currentStore) {
        const staffRecord = await Staff.findOne({
          store: manager.currentStore._id,
          email: manager.email
        });
        console.log(`  - ${manager.name}: ${staffRecord ? '✅ Has Staff record' : '❌ Missing Staff record'}`);
      }
    }
    
    console.log('\n🎉 Staff records fix completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Disconnected from MongoDB');
  }
};

fixStaffRecords();

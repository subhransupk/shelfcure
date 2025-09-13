require('dotenv').config();
const mongoose = require('mongoose');
const Staff = require('./models/Staff');
const User = require('./models/User');
const Store = require('./models/Store');

const debugStaffIssue = async () => {
  try {
    console.log('🔍 Debugging Staff List Issue...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find all staff records
    const allStaff = await Staff.find({}).populate('store', 'name code');
    console.log('📋 Staff Collection Records:', allStaff.length);
    allStaff.forEach(staff => {
      console.log(`  - ${staff.name} (${staff.role}) at ${staff.store?.name || 'No Store'} - Status: ${staff.status}`);
    });
    
    // Find all store managers
    const storeManagers = await User.find({ role: 'store_manager' }).populate('currentStore', 'name code');
    console.log('\n👥 Store Managers in User Collection:', storeManagers.length);
    storeManagers.forEach(manager => {
      console.log(`  - ${manager.name} (${manager.email}) at ${manager.currentStore?.name || 'No Store'} - Active: ${manager.isActive}`);
    });
    
    // Find all stores and their staff
    const stores = await Store.find({}).populate('owner', 'name email').populate('staff.user', 'name email role');
    console.log('\n🏪 Stores and their Staff:', stores.length);
    stores.forEach(store => {
      console.log(`  - Store: ${store.name} (Owner: ${store.owner?.name || 'No Owner'})`);
      if (store.staff && store.staff.length > 0) {
        store.staff.forEach(staffMember => {
          console.log(`    * ${staffMember.user?.name || 'Unknown'} (${staffMember.role}) - Active: ${staffMember.isActive}`);
        });
      } else {
        console.log('    * No staff members found');
      }
    });
    
    // Check if store managers exist in Staff collection for their stores
    console.log('\n🔍 Checking Store Manager presence in Staff collection:');
    for (const manager of storeManagers) {
      if (manager.currentStore) {
        const staffRecord = await Staff.findOne({
          store: manager.currentStore._id,
          $or: [
            { email: manager.email },
            { createdBy: manager._id },
            { name: manager.name }
          ]
        });
        
        console.log(`  - ${manager.name}: ${staffRecord ? '✅ Found in Staff collection' : '❌ NOT found in Staff collection'}`);
      }
    }
    
    console.log('\n🎯 Analysis Complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Disconnected from MongoDB');
  }
};

debugStaffIssue();

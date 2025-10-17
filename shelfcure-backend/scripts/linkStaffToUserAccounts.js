/**
 * Migration Script: Link Staff Records to User Accounts
 * 
 * This script links existing Staff records with hasSystemAccess=true
 * to their corresponding User accounts based on email matching.
 * It also syncs the lastSeen field from User's lastLogin.
 */

const mongoose = require('mongoose');
const Staff = require('../models/Staff');
const User = require('../models/User');
require('dotenv').config();

const linkStaffToUserAccounts = async () => {
  try {
    console.log('🔄 Starting Staff-to-User account linking migration...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Find all staff with system access but no linked user account
    const staffWithSystemAccess = await Staff.find({
      hasSystemAccess: true,
      $or: [
        { userAccount: null },
        { userAccount: { $exists: false } }
      ]
    });

    console.log(`📊 Found ${staffWithSystemAccess.length} staff members with system access but no linked user account\n`);

    let linkedCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;

    for (const staff of staffWithSystemAccess) {
      try {
        // Find matching user by email
        const user = await User.findOne({ email: staff.email });

        if (user) {
          // Link user account to staff
          staff.userAccount = user._id;
          
          // Sync lastSeen from user's lastLogin or lastActivity
          if (user.lastLogin || user.lastActivity) {
            staff.lastSeen = user.lastLogin || user.lastActivity;
            staff.lastActivity = user.lastActivity || user.lastLogin;
          }

          await staff.save();
          linkedCount++;
          console.log(`✅ Linked: ${staff.name} (${staff.email}) -> User ID: ${user._id}`);
          if (staff.lastSeen) {
            console.log(`   Last seen synced: ${staff.lastSeen}`);
          }
        } else {
          notFoundCount++;
          console.log(`⚠️  No User account found for: ${staff.name} (${staff.email})`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error linking ${staff.name}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully linked: ${linkedCount}`);
    console.log(`⚠️  No User account found: ${notFoundCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(60) + '\n');

    // Also update all staff with linked user accounts to sync lastSeen
    console.log('🔄 Syncing lastSeen for all staff with linked user accounts...\n');

    const staffWithUserAccounts = await Staff.find({
      userAccount: { $exists: true, $ne: null }
    }).populate('userAccount', 'lastLogin lastActivity');

    let syncedCount = 0;
    for (const staff of staffWithUserAccounts) {
      if (staff.userAccount) {
        const userLastSeen = staff.userAccount.lastLogin || staff.userAccount.lastActivity;
        if (userLastSeen && (!staff.lastSeen || new Date(userLastSeen) > new Date(staff.lastSeen))) {
          staff.lastSeen = userLastSeen;
          staff.lastActivity = staff.userAccount.lastActivity || userLastSeen;
          await staff.save();
          syncedCount++;
          console.log(`✅ Synced lastSeen for: ${staff.name} -> ${userLastSeen}`);
        }
      }
    }

    console.log(`\n✅ Synced lastSeen for ${syncedCount} staff members\n`);

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run the migration
linkStaffToUserAccounts();


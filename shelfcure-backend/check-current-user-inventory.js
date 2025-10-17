require('dotenv').config();
const mongoose = require('mongoose');
const Medicine = require('./models/Medicine');

async function checkCurrentUserInventory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Current user's store from the logs
    const storeId = '68ecae96858560f264e41504';

    console.log('🔍 Checking inventory for current user store...');
    console.log('Store ID:', storeId);

    const medicines = await Medicine.find({ store: storeId });
    console.log('\n📊 Medicines in store:', medicines.length);

    if (medicines.length > 0) {
      console.log('\nMedicine List:');
      medicines.forEach((med, index) => {
        console.log(`${index + 1}. ${med.name}`);
        console.log(`   Strip Stock: ${med.stripInfo.stock}, Min: ${med.stripInfo.minStock}`);
        console.log(`   Individual Stock: ${med.individualInfo.stock}, Min: ${med.individualInfo.minStock}`);
        console.log(`   Low Stock: Strip=${med.stripInfo.stock <= med.stripInfo.minStock}, Individual=${med.individualInfo.stock <= med.individualInfo.minStock}`);
        console.log('');
      });
    } else {
      console.log('❌ No medicines found in store!');
      console.log('This explains why there are no real low stock alerts.');
    }

    // Check if there are any real notifications that should exist
    const Notification = require('./models/Notification');
    const realNotifications = await Notification.find({ 
      storeId: storeId,
      type: { $in: ['low_stock', 'expiry_alert'] }
    });

    console.log('\n📢 Real inventory-based notifications:', realNotifications.length);
    if (realNotifications.length > 0) {
      realNotifications.forEach(notif => {
        console.log(`- ${notif.title}: ${notif.message}`);
      });
    }

    // Check fake notifications I created
    const fakeNotifications = await Notification.find({ 
      storeId: storeId,
      'metadata.medicineId': { $regex: /^test-/ }
    });

    console.log('\n🧪 Fake test notifications:', fakeNotifications.length);
    if (fakeNotifications.length > 0) {
      console.log('These should be removed as they are not based on real inventory.');
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkCurrentUserInventory();

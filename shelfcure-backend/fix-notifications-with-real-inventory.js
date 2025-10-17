require('dotenv').config();
const mongoose = require('mongoose');
const Medicine = require('./models/Medicine');
const Notification = require('./models/Notification');
const NotificationService = require('./services/notificationService');

async function fixNotificationsWithRealInventory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const storeId = '68ecae96858560f264e41504';
    const userId = '68ecaec2858560f264e41525';

    console.log('🧹 Step 1: Removing fake test notifications...');
    
    // Remove fake notifications
    const deletedFake = await Notification.deleteMany({ 
      storeId: storeId,
      'metadata.medicineId': { $regex: /^test-/ }
    });
    console.log(`✅ Removed ${deletedFake.deletedCount} fake notifications`);

    // Remove duplicate notifications
    const duplicates = await Notification.deleteMany({
      storeId: storeId,
      type: { $in: ['low_stock', 'expiry_alert'] },
      'metadata.medicineId': { $exists: false }
    });
    console.log(`✅ Removed ${duplicates.deletedCount} duplicate notifications`);

    console.log('\n📦 Step 2: Adding real medicines to inventory...');

    // Create real medicines with actual low stock and expiry dates
    const realMedicines = [
      {
        name: 'Paracetamol 500mg',
        genericName: 'Acetaminophen',
        composition: 'Paracetamol 500mg',
        manufacturer: 'Cipla Ltd',
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
          purchasePrice: 15,
          sellingPrice: 20,
          mrp: 25,
          stock: 3, // Low stock - below minimum
          minStock: 10,
          reorderLevel: 15
        },
        individualInfo: {
          purchasePrice: 1.5,
          sellingPrice: 2,
          mrp: 2.5,
          stock: 30, // Low stock - below minimum
          minStock: 100,
          reorderLevel: 150
        }
      },
      {
        name: 'Aspirin 75mg',
        genericName: 'Acetylsalicylic Acid',
        composition: 'Aspirin 75mg',
        manufacturer: 'Bayer',
        category: 'Tablet',
        store: storeId,
        createdBy: userId,
        expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now - expiring soon
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
          minStock: 8,
          reorderLevel: 12
        },
        individualInfo: {
          purchasePrice: 1.2,
          sellingPrice: 1.5,
          mrp: 1.8,
          stock: 20, // Low stock
          minStock: 80,
          reorderLevel: 120
        }
      },
      {
        name: 'Cough Syrup',
        genericName: 'Dextromethorphan',
        composition: 'Dextromethorphan 15mg/5ml',
        manufacturer: 'Sun Pharma',
        category: 'Syrup',
        store: storeId,
        createdBy: userId,
        expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now - critical expiry
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
          stock: 15, // Good stock
          minStock: 5,
          reorderLevel: 10
        }
      }
    ];

    // Create medicines
    for (const medicineData of realMedicines) {
      // Check if medicine already exists
      const existing = await Medicine.findOne({ 
        name: medicineData.name, 
        store: storeId 
      });
      
      if (!existing) {
        const medicine = await Medicine.create(medicineData);
        console.log(`✅ Created medicine: ${medicine.name}`);
        console.log(`   Stock: ${medicine.stripInfo.stock} strips (min: ${medicine.stripInfo.minStock}), ${medicine.individualInfo.stock} units (min: ${medicine.individualInfo.minStock})`);
        console.log(`   Expiry: ${medicine.expiryDate.toDateString()}`);
      } else {
        console.log(`⚠️ Medicine already exists: ${medicineData.name}`);
      }
    }

    console.log('\n🔄 Step 3: Running real notification checks...');
    
    // Run the notification service to generate real notifications
    await NotificationService.runNotificationChecks(storeId);

    console.log('\n📊 Step 4: Checking final results...');
    
    // Check final inventory
    const finalMedicines = await Medicine.find({ store: storeId });
    console.log(`Medicines in store: ${finalMedicines.length}`);

    // Check final notifications
    const finalNotifications = await Notification.find({ storeId: storeId }).sort({ createdAt: -1 });
    console.log(`Total notifications: ${finalNotifications.length}`);

    // Calculate real summary
    const summary = {
      unreadAlerts: 0,
      whatsappMessages: 0,
      lowStockItems: 0,
      expiringSoon: 0
    };

    finalNotifications.forEach(notification => {
      if (!notification.isRead) {
        summary.unreadAlerts++;
      }

      switch (notification.type) {
        case 'whatsapp':
          summary.whatsappMessages++;
          break;
        case 'low_stock':
          summary.lowStockItems++;
          break;
        case 'expiry_alert':
          summary.expiringSoon++;
          break;
      }
    });

    console.log('\n📈 Real Notification Summary:');
    console.log('- Unread Alerts:', summary.unreadAlerts);
    console.log('- WhatsApp Messages:', summary.whatsappMessages);
    console.log('- Low Stock Items:', summary.lowStockItems);
    console.log('- Expiring Soon:', summary.expiringSoon);

    console.log('\n✅ Fix completed! Notifications are now based on real inventory data.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

fixNotificationsWithRealInventory();

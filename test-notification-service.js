require('dotenv').config();
const mongoose = require('mongoose');
const NotificationService = require('./shelfcure-backend/services/notificationService');
const Notification = require('./shelfcure-backend/models/Notification');

async function testNotificationService() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const storeId = '68ec9f46a1597adc370d916f';
    const userId = '68ec9f46a1597adc370d9174';

    console.log('\n🧪 Testing Notification Service...');

    // Test 1: Create a simple notification
    console.log('\n1. Creating a test notification...');
    const testNotification = await NotificationService.createNotification({
      storeId,
      userId,
      type: 'system',
      priority: 'medium',
      title: 'Test Notification',
      message: 'This is a test notification created by the service',
      actionRequired: false,
      metadata: {
        testId: 'test-001',
        timestamp: new Date()
      }
    });

    console.log('✅ Test notification created:', testNotification._id);

    // Test 2: Run notification checks for the store
    console.log('\n2. Running notification checks for store...');
    await NotificationService.runNotificationChecks(storeId);
    console.log('✅ Notification checks completed');

    // Test 3: Check if notifications were created
    console.log('\n3. Checking recent notifications...');
    const recentNotifications = await Notification.find({ storeId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title message type priority createdAt');

    console.log(`Found ${recentNotifications.length} recent notifications:`);
    recentNotifications.forEach((notification, index) => {
      console.log(`${index + 1}. ${notification.title} (${notification.type}, ${notification.priority})`);
      console.log(`   Message: ${notification.message}`);
      console.log(`   Created: ${notification.createdAt}`);
    });

    // Test 4: Test low stock alerts generation
    console.log('\n4. Testing low stock alerts generation...');
    await NotificationService.generateLowStockAlerts(storeId);
    console.log('✅ Low stock alerts generation completed');

    // Test 5: Test expiry alerts generation
    console.log('\n5. Testing expiry alerts generation...');
    await NotificationService.generateExpiryAlerts(storeId);
    console.log('✅ Expiry alerts generation completed');

    // Test 6: Check final notification count
    console.log('\n6. Final notification count check...');
    const totalNotifications = await Notification.countDocuments({ storeId });
    console.log(`Total notifications for store: ${totalNotifications}`);

    // Test 7: Test notification formatting
    console.log('\n7. Testing notification display format...');
    const sampleNotification = await Notification.findOne({ storeId }).sort({ createdAt: -1 });
    if (sampleNotification) {
      const displayFormat = sampleNotification.toDisplayFormat();
      console.log('Sample notification in display format:');
      console.log(JSON.stringify(displayFormat, null, 2));
    }

    console.log('\n✅ All notification service tests completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testNotificationService();

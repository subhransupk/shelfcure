require('dotenv').config();
const mongoose = require('mongoose');
const NotificationService = require('./services/notificationService');

async function createNotificationsForCurrentUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Current user's store from the logs
    const storeId = '68ecae96858560f264e41504';
    const userId = '68ecaec2858560f264e41525';

    console.log('🧪 Creating test notifications for current user store...');

    // Create low stock notification
    await NotificationService.createNotification({
      storeId,
      userId,
      type: 'low_stock',
      priority: 'high',
      title: 'Low Stock Alert',
      message: 'Paracetamol 500mg is running low (2 strips remaining)',
      actionRequired: true,
      actionUrl: '/store-panel/inventory?search=Paracetamol',
      metadata: {
        medicineId: 'test-med-1',
        medicineName: 'Paracetamol 500mg',
        currentStock: 2,
        threshold: 10,
        unit: 'strips'
      }
    });

    // Create expiry alert
    await NotificationService.createNotification({
      storeId,
      userId,
      type: 'expiry_alert',
      priority: 'medium',
      title: 'Medicine Expiry Alert',
      message: 'Aspirin 75mg expires in 15 days',
      actionRequired: true,
      actionUrl: '/store-panel/expiry-alerts',
      metadata: {
        medicineId: 'test-med-2',
        medicineName: 'Aspirin 75mg',
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        daysToExpiry: 15
      }
    });

    // Create WhatsApp message
    await NotificationService.createNotification({
      storeId,
      userId,
      type: 'whatsapp',
      priority: 'low',
      title: 'WhatsApp Message',
      message: 'Customer inquiry about medicine availability',
      actionRequired: false,
      metadata: {
        customerName: 'John Doe',
        customerPhone: '+1234567890'
      }
    });

    // Create system notification
    await NotificationService.createNotification({
      storeId,
      userId,
      type: 'system',
      priority: 'low',
      title: 'System Update',
      message: 'ShelfCure has been updated with new features',
      actionRequired: false,
      metadata: {
        version: '2.1.0'
      }
    });

    // Create customer message
    await NotificationService.createNotification({
      storeId,
      userId,
      type: 'customer_message',
      priority: 'medium',
      title: 'Customer Inquiry',
      message: 'Customer asked about insulin availability',
      actionRequired: true,
      actionUrl: '/store-panel/customers',
      metadata: {
        customerId: 'customer-123',
        customerName: 'Jane Smith'
      }
    });

    console.log('✅ Test notifications created for current user store');
    console.log('Store ID:', storeId);
    console.log('User ID:', userId);
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating notifications:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

createNotificationsForCurrentUser();

const cron = require('node-cron');
const NotificationService = require('../services/notificationService');
const BatchService = require('../services/batchService');

class NotificationJobs {

  static init() {
    console.log('🕐 Initializing notification cron jobs...');

    // Run notification checks every hour
    cron.schedule('0 * * * *', async () => {
      console.log('⏰ Running hourly notification checks...');
      try {
        await NotificationService.runAllNotificationChecks();

        // Also update expired batch status every hour
        console.log('🔄 Updating expired batch status...');
        await BatchService.updateExpiredStatus();
        console.log('✅ Expired batch status updated');
      } catch (error) {
        console.error('Error in hourly notification job:', error);
      }
    });

    // Run critical checks every 15 minutes during business hours (9 AM - 6 PM)
    cron.schedule('*/15 9-18 * * *', async () => {
      console.log('⏰ Running critical notification checks...');
      try {
        // Only run low stock and critical expiry checks
        const Store = require('../models/Store');
        const Medicine = require('../models/Medicine');
        const Batch = require('../models/Batch');
        const User = require('../models/User');
        const Notification = require('../models/Notification');

        const activeStores = await Store.find({ isActive: true }).select('_id');

        for (const store of activeStores) {
          await NotificationService.generateLowStockAlerts(store._id);

          // Update expired batch status for this store
          await BatchService.updateExpiredStatus(store._id);

          // Check for critical expiry (7 days or less) - both medicine-level and batch-level
          const currentDate = new Date();
          const criticalDate = new Date(currentDate.getTime() + (7 * 24 * 60 * 60 * 1000));

          // Check medicine-level expiry for legacy medicines
          const criticalMedicines = await Medicine.find({
            store: store._id,
            isActive: true,
            expiryDate: {
              $gte: currentDate,
              $lte: criticalDate
            }
          }).select('name expiryDate');

          // Check batch-level expiry for batch-aware medicines
          const criticalBatches = await Batch.find({
            store: store._id,
            isActive: true,
            expiryDate: {
              $gte: currentDate,
              $lte: criticalDate
            },
            $or: [
              { stripQuantity: { $gt: 0 } },
              { individualQuantity: { $gt: 0 } }
            ]
          }).populate('medicine', 'name').select('medicine expiryDate batchNumber');

          const storeManagers = await User.find({
            role: 'store_manager',
            storeId: store._id,
            isActive: true
          });
          
          // Process medicine-level expiry alerts
          for (const medicine of criticalMedicines) {
            // Check if we already have a recent notification
            const recentNotification = await Notification.findOne({
              storeId: store._id,
              type: 'expiry_alert',
              'metadata.medicineId': medicine._id,
              createdAt: { $gte: new Date(Date.now() - 4 * 60 * 60 * 1000) } // Last 4 hours
            });

            if (recentNotification) continue;

            const daysToExpiry = Math.ceil((medicine.expiryDate - currentDate) / (1000 * 60 * 60 * 24));

            for (const manager of storeManagers) {
              await NotificationService.createNotification({
                storeId: store._id,
                userId: manager._id,
                type: 'expiry_alert',
                priority: 'high',
                title: 'Critical Expiry Alert',
                message: `${medicine.name} expires in ${daysToExpiry} day${daysToExpiry > 1 ? 's' : ''}`,
                actionRequired: true,
                actionUrl: `/store-panel/expiry-alerts?search=${encodeURIComponent(medicine.name)}`,
                metadata: {
                  medicineId: medicine._id,
                  medicineName: medicine.name,
                  expiryDate: medicine.expiryDate,
                  daysToExpiry
                }
              });
            }
          }

          // Process batch-level expiry alerts
          for (const batch of criticalBatches) {
            if (!batch.medicine) continue;

            // Check if we already have a recent notification for this batch
            const recentBatchNotification = await Notification.findOne({
              storeId: store._id,
              type: 'batch_expiry_alert',
              'metadata.batchId': batch._id,
              createdAt: { $gte: new Date(Date.now() - 4 * 60 * 60 * 1000) } // Last 4 hours
            });

            if (recentBatchNotification) continue;

            const daysToExpiry = Math.ceil((batch.expiryDate - currentDate) / (1000 * 60 * 60 * 24));

            for (const manager of storeManagers) {
              await NotificationService.createNotification({
                storeId: store._id,
                userId: manager._id,
                type: 'batch_expiry_alert',
                priority: 'high',
                title: 'Critical Batch Expiry Alert',
                message: `${batch.medicine.name} (Batch: ${batch.batchNumber}) expires in ${daysToExpiry} day${daysToExpiry > 1 ? 's' : ''}`,
                actionRequired: true,
                actionUrl: `/store-panel/expiry-alerts?search=${encodeURIComponent(batch.medicine.name)}`,
                metadata: {
                  medicineId: batch.medicine._id,
                  medicineName: batch.medicine.name,
                  batchId: batch._id,
                  batchNumber: batch.batchNumber,
                  expiryDate: batch.expiryDate,
                  daysToExpiry
                }
              });
            }
          }
        }
      } catch (error) {
        console.error('Error in critical notification job:', error);
      }
    });

    // Run payment reminders daily at 9 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('⏰ Running daily payment reminder checks...');
      try {
        await NotificationService.generatePaymentReminders();
      } catch (error) {
        console.error('Error in payment reminder job:', error);
      }
    });

    // Update expired batch status daily at 1 AM
    cron.schedule('0 1 * * *', async () => {
      console.log('🔄 Running daily expired batch status update...');
      try {
        const result = await BatchService.updateExpiredStatus();
        console.log(`✅ Updated expired status for ${result.modifiedCount} batches across all stores`);
      } catch (error) {
        console.error('Error in daily expired batch update job:', error);
      }
    });

    // Clean up old notifications weekly (Sunday at 2 AM)
    cron.schedule('0 2 * * 0', async () => {
      console.log('🧹 Cleaning up old notifications...');
      try {
        const Notification = require('../models/Notification');
        
        // Delete notifications older than 30 days
        const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
        
        const result = await Notification.deleteMany({
          createdAt: { $lt: thirtyDaysAgo }
        });
        
        console.log(`🗑️ Deleted ${result.deletedCount} old notifications`);
      } catch (error) {
        console.error('Error cleaning up notifications:', error);
      }
    });

    console.log('✅ Notification cron jobs initialized');
  }

  // Manual trigger for testing
  static async runManualCheck(storeId = null) {
    console.log('🔧 Running manual notification check...');
    try {
      if (storeId) {
        await NotificationService.runNotificationChecks(storeId);
      } else {
        await NotificationService.runAllNotificationChecks();
      }
      console.log('✅ Manual notification check completed');
    } catch (error) {
      console.error('Error in manual notification check:', error);
      throw error;
    }
  }
}

module.exports = NotificationJobs;

const Notification = require('../models/Notification');
const NotificationSettings = require('../models/NotificationSettings');
const Medicine = require('../models/Medicine');
const Store = require('../models/Store');
const User = require('../models/User');

class NotificationService {
  
  // Create a notification
  static async createNotification(data) {
    try {
      const notification = await Notification.createNotification(data);
      console.log(`📢 Notification created: ${notification.title} for store ${data.storeId}`);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Generate low stock alerts for a store
  static async generateLowStockAlerts(storeId) {
    try {
      console.log(`🔍 Checking low stock for store: ${storeId}`);
      
      const store = await Store.findById(storeId);
      if (!store) {
        console.log(`❌ Store not found: ${storeId}`);
        return;
      }

      // Get store managers for this store
      const storeManagers = await User.find({ 
        role: 'store_manager',
        storeId: storeId,
        isActive: true
      });

      if (storeManagers.length === 0) {
        console.log(`❌ No active store managers found for store: ${storeId}`);
        return;
      }

      // Find medicines with low stock
      const lowStockMedicines = await Medicine.aggregate([
        { $match: { store: storeId, isActive: true } },
        {
          $match: {
            $or: [
              // Both strip and individual enabled: Low stock based on STRIP STOCK ONLY
              {
                $and: [
                  { 'unitTypes.hasStrips': true },
                  { 'unitTypes.hasIndividual': true },
                  { $expr: { $lte: ['$stripInfo.stock', '$stripInfo.minStock'] } }
                ]
              },
              // Only strips enabled
              {
                $and: [
                  { 'unitTypes.hasStrips': true },
                  { 'unitTypes.hasIndividual': { $ne: true } },
                  { $expr: { $lte: ['$stripInfo.stock', '$stripInfo.minStock'] } }
                ]
              },
              // Only individual enabled
              {
                $and: [
                  { 'unitTypes.hasIndividual': true },
                  { 'unitTypes.hasStrips': { $ne: true } },
                  { $expr: { $lte: ['$individualInfo.stock', '$individualInfo.minStock'] } }
                ]
              }
            ]
          }
        },
        {
          $project: {
            name: 1,
            genericName: 1,
            stripInfo: 1,
            individualInfo: 1,
            unitTypes: 1
          }
        }
      ]);

      console.log(`📊 Found ${lowStockMedicines.length} low stock medicines`);

      // Create notifications for each low stock medicine
      for (const medicine of lowStockMedicines) {
        // Check if we already have a recent notification for this medicine
        const recentNotification = await Notification.findOne({
          storeId,
          type: 'low_stock',
          'metadata.medicineId': medicine._id,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        });

        if (recentNotification) {
          console.log(`⏭️ Skipping duplicate low stock alert for ${medicine.name}`);
          continue;
        }

        // Determine current stock and threshold
        let currentStock, threshold, unit;
        if (medicine.unitTypes?.hasStrips && medicine.stripInfo) {
          currentStock = medicine.stripInfo.stock || 0;
          threshold = medicine.stripInfo.minStock || 0;
          unit = 'strips';
        } else if (medicine.unitTypes?.hasIndividual && medicine.individualInfo) {
          currentStock = medicine.individualInfo.stock || 0;
          threshold = medicine.individualInfo.minStock || 0;
          unit = 'units';
        }

        // Create notification for each store manager
        for (const manager of storeManagers) {
          await this.createNotification({
            storeId,
            userId: manager._id,
            type: 'low_stock',
            priority: currentStock === 0 ? 'high' : 'medium',
            title: 'Low Stock Alert',
            message: `${medicine.name} is running low (${currentStock} ${unit} remaining, threshold: ${threshold})`,
            actionRequired: true,
            actionUrl: `/store-panel/inventory?search=${encodeURIComponent(medicine.name)}`,
            metadata: {
              medicineId: medicine._id,
              medicineName: medicine.name,
              currentStock,
              threshold,
              unit
            }
          });
        }
      }

    } catch (error) {
      console.error('Error generating low stock alerts:', error);
    }
  }

  // Generate expiry alerts for a store
  static async generateExpiryAlerts(storeId) {
    try {
      console.log(`🔍 Checking expiry alerts for store: ${storeId}`);
      
      const store = await Store.findById(storeId);
      if (!store) return;

      const storeManagers = await User.find({ 
        role: 'store_manager',
        storeId: storeId,
        isActive: true
      });

      if (storeManagers.length === 0) return;

      const currentDate = new Date();
      const criticalDate = new Date(currentDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
      const warningDate = new Date(currentDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days

      // Find medicines expiring soon
      const expiringMedicines = await Medicine.find({
        store: storeId,
        isActive: true,
        expiryDate: {
          $gte: currentDate,
          $lte: warningDate
        }
      }).select('name genericName expiryDate stripInfo individualInfo');

      console.log(`📊 Found ${expiringMedicines.length} expiring medicines`);

      for (const medicine of expiringMedicines) {
        // Check if we already have a recent notification for this medicine
        const recentNotification = await Notification.findOne({
          storeId,
          type: 'expiry_alert',
          'metadata.medicineId': medicine._id,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (recentNotification) continue;

        const daysToExpiry = Math.ceil((medicine.expiryDate - currentDate) / (1000 * 60 * 60 * 24));
        let priority = 'low';
        
        if (daysToExpiry <= 7) {
          priority = 'high';
        } else if (daysToExpiry <= 30) {
          priority = 'medium';
        }

        // Create notification for each store manager
        for (const manager of storeManagers) {
          await this.createNotification({
            storeId,
            userId: manager._id,
            type: 'expiry_alert',
            priority,
            title: 'Medicine Expiry Alert',
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

    } catch (error) {
      console.error('Error generating expiry alerts:', error);
    }
  }

  // Generate payment reminder notifications
  static async generatePaymentReminders() {
    try {
      console.log('🔍 Checking payment reminders...');
      
      // This would typically check subscription due dates
      // For now, we'll create a sample implementation
      
      const stores = await Store.find({ isActive: true }).populate('owner');
      
      for (const store of stores) {
        if (!store.owner) continue;

        // Check if subscription is due soon (this is a simplified example)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 3); // 3 days from now

        await this.createNotification({
          storeId: store._id,
          userId: store.owner._id,
          type: 'payment_reminder',
          priority: 'high',
          title: 'Payment Reminder',
          message: 'Your subscription payment is due in 3 days',
          actionRequired: true,
          actionUrl: '/owner-panel/subscription',
          metadata: {
            dueDate,
            amount: 2999 // This would come from subscription data
          }
        });
      }

    } catch (error) {
      console.error('Error generating payment reminders:', error);
    }
  }

  // Run all notification checks for a store
  static async runNotificationChecks(storeId) {
    try {
      console.log(`🔄 Running notification checks for store: ${storeId}`);
      
      await Promise.all([
        this.generateLowStockAlerts(storeId),
        this.generateExpiryAlerts(storeId)
      ]);
      
      console.log(`✅ Completed notification checks for store: ${storeId}`);
    } catch (error) {
      console.error('Error running notification checks:', error);
    }
  }

  // Run notification checks for all active stores
  static async runAllNotificationChecks() {
    try {
      console.log('🔄 Running notification checks for all stores...');
      
      const activeStores = await Store.find({ isActive: true }).select('_id');
      
      for (const store of activeStores) {
        await this.runNotificationChecks(store._id);
      }
      
      // Also run payment reminders
      await this.generatePaymentReminders();
      
      console.log('✅ Completed notification checks for all stores');
    } catch (error) {
      console.error('Error running all notification checks:', error);
    }
  }
}

module.exports = NotificationService;

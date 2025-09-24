const mongoose = require('mongoose');

// Notification Settings Schema
const notificationSettingsSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    lowStock: { type: Boolean, default: true },
    expiryAlerts: { type: Boolean, default: true },
    customerMessages: { type: Boolean, default: true },
    systemUpdates: { type: Boolean, default: false },
    paymentReminders: { type: Boolean, default: true }
  },
  whatsapp: {
    lowStock: { type: Boolean, default: false },
    expiryAlerts: { type: Boolean, default: true },
    customerMessages: { type: Boolean, default: true },
    systemUpdates: { type: Boolean, default: false },
    paymentReminders: { type: Boolean, default: false }
  },
  sms: {
    lowStock: { type: Boolean, default: false },
    expiryAlerts: { type: Boolean, default: false },
    customerMessages: { type: Boolean, default: false },
    systemUpdates: { type: Boolean, default: false },
    paymentReminders: { type: Boolean, default: true }
  },
  push: {
    lowStock: { type: Boolean, default: true },
    expiryAlerts: { type: Boolean, default: true },
    customerMessages: { type: Boolean, default: true },
    systemUpdates: { type: Boolean, default: true },
    paymentReminders: { type: Boolean, default: true }
  },
  preferences: {
    quietHours: {
      enabled: { type: Boolean, default: true },
      startTime: { type: String, default: '22:00' },
      endTime: { type: String, default: '08:00' }
    },
    frequency: {
      type: String,
      enum: ['immediate', 'hourly', 'daily'],
      default: 'immediate'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }
}, {
  timestamps: true
});

// Static method to get or create settings for a store
notificationSettingsSchema.statics.getOrCreateSettings = async function(storeId, userId) {
  let settings = await this.findOne({ storeId });
  
  if (!settings) {
    settings = new this({
      storeId,
      userId
    });
    await settings.save();
  }
  
  return settings;
};

// Method to check if notifications are allowed during quiet hours
notificationSettingsSchema.methods.isQuietHour = function() {
  if (!this.preferences.quietHours.enabled) {
    return false;
  }
  
  const now = new Date();
  const currentTime = now.getHours() * 100 + now.getMinutes();
  
  const startTime = parseInt(this.preferences.quietHours.startTime.replace(':', ''));
  const endTime = parseInt(this.preferences.quietHours.endTime.replace(':', ''));
  
  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  }
  
  return currentTime >= startTime && currentTime <= endTime;
};

// Method to check if a notification type is enabled for a channel
notificationSettingsSchema.methods.isNotificationEnabled = function(channel, type) {
  return this[channel] && this[channel][type];
};

module.exports = mongoose.model('NotificationSettings', notificationSettingsSchema);

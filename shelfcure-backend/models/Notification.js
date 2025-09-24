const mongoose = require('mongoose');

// Notification Schema
const notificationSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['low_stock', 'expiry_alert', 'payment_reminder', 'customer_message', 'system', 'whatsapp', 'email', 'sms'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionUrl: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ storeId: 1, userId: 1, createdAt: -1 });
notificationSchema.index({ storeId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, storeId: 1, createdAt: -1 });

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();

  // Emit real-time notification via Socket.IO if available
  try {
    // Get the io instance from the global app
    const { getIO } = require('../utils/socketManager');
    const io = getIO();

    if (io) {
      const formattedNotification = notification.toDisplayFormat();
      io.to(`store-${data.storeId}`).emit('new-notification', formattedNotification);
      console.log(`📡 Emitted notification to store-${data.storeId}:`, notification.title);
    }
  } catch (error) {
    console.error('Error emitting notification:', error);
  }

  return notification;
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = async function(notificationIds, storeId) {
  return this.updateMany(
    { 
      _id: { $in: notificationIds },
      storeId: storeId
    },
    { 
      $set: { isRead: true }
    }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(storeId, userId) {
  return this.countDocuments({
    storeId,
    userId,
    isRead: false
  });
};

// Static method to get notifications with filters
notificationSchema.statics.getNotifications = async function(filters = {}) {
  const {
    storeId,
    userId,
    type,
    search,
    isRead,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = filters;

  const query = {};
  
  if (storeId) query.storeId = storeId;
  if (userId) query.userId = userId;
  if (type) query.type = type;
  if (typeof isRead === 'boolean') query.isRead = isRead;
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } }
    ];
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    this.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    this.countDocuments(query)
  ]);

  return {
    notifications,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit)
    }
  };
};

// Method to format notification for display
notificationSchema.methods.toDisplayFormat = function() {
  return {
    id: this._id,
    type: this.type,
    priority: this.priority,
    title: this.title,
    message: this.message,
    isRead: this.isRead,
    actionRequired: this.actionRequired,
    actionUrl: this.actionUrl,
    metadata: this.metadata,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    timeAgo: this.getTimeAgo()
  };
};

// Method to get human-readable time ago
notificationSchema.methods.getTimeAgo = function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

module.exports = mongoose.model('Notification', notificationSchema);

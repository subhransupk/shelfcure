const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Import middleware
const { protect, authorize } = require('../middleware/auth');

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

const Notification = mongoose.model('Notification', notificationSchema);

// Apply authentication middleware
router.use(protect);

// Note: Store manager notification routes are handled in /routes/storeManager.js
// to avoid route conflicts and ensure proper middleware application

// Create notification (internal use)
router.post('/create', async (req, res) => {
  try {
    const { storeId, userId, type, priority, title, message, actionRequired, actionUrl, metadata } = req.body;

    const notification = new Notification({
      storeId,
      userId,
      type,
      priority,
      title,
      message,
      actionRequired,
      actionUrl,
      metadata
    });

    await notification.save();

    // Emit real-time notification via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`store-${storeId}`).emit('new-notification', notification);
    }

    res.json({
      success: true,
      data: notification
    });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
});

// Note: Store manager notification stats route is handled in /routes/storeManager.js

module.exports = router;

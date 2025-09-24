const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Import middleware
const { protect, authorize } = require('../middleware/auth');

// Import models
const Notification = require('../models/Notification');
const NotificationSettings = require('../models/NotificationSettings');

// Apply authentication middleware
router.use(protect);

// Note: Store manager notification routes are handled in /routes/storeManager.js
// to avoid route conflicts and ensure proper middleware application

// Create notification (internal use)
router.post('/create', async (req, res) => {
  try {
    const { storeId, userId, type, priority, title, message, actionRequired, actionUrl, metadata } = req.body;

    const notification = await Notification.createNotification({
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

    res.json({
      success: true,
      data: notification.toDisplayFormat()
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

// Get notifications with filters
router.get('/', async (req, res) => {
  try {
    const { type, search, page = 1, limit = 20, isRead } = req.query;
    const userId = req.user.id;

    // For admin users, they might not have a specific store
    const storeId = req.user.storeId || req.query.storeId;

    const result = await Notification.getNotifications({
      storeId,
      userId,
      type,
      search,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      page,
      limit
    });

    res.json({
      success: true,
      data: result.notifications.map(n => ({
        ...n,
        timeAgo: new Date(n.createdAt).toLocaleString()
      })),
      pagination: result.pagination
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Mark notifications as read
router.post('/mark-read', async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const userId = req.user.id;
    const storeId = req.user.storeId || req.query.storeId;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: 'Notification IDs array is required'
      });
    }

    await Notification.markAsRead(notificationIds, storeId);

    res.json({
      success: true,
      message: 'Notifications marked as read'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: error.message
    });
  }
});

// Get unread count
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user.id;
    const storeId = req.user.storeId || req.query.storeId;

    const count = await Notification.getUnreadCount(storeId, userId);

    res.json({
      success: true,
      data: { count }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
});

// Note: Store manager notification stats route is handled in /routes/storeManager.js

module.exports = router;

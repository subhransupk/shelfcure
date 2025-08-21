const express = require('express');
const router = express.Router();
const {
  getChatSessions,
  getChatSession,
  createChatSession,
  updateChatSession,
  assignAgent,
  getChatAnalytics,
  getOnlineAgents,
  updateAgentStatus,
  getAgentWorkload
} = require('../controllers/chatController');

const {
  getMessages,
  sendMessage,
  markAsRead,
  editMessage,
  deleteMessage,
  addReaction
} = require('../controllers/messageController');

// Import auth middleware (assuming it exists)
// const { protect, authorize } = require('../middleware/auth');

// For now, we'll create a simple auth middleware placeholder
const protect = (req, res, next) => {
  // TODO: Implement proper JWT authentication
  // For development, we'll skip auth or use mock user
  req.user = {
    _id: '507f1f77bcf86cd799439011', // Mock user ID
    name: 'Admin User',
    email: 'admin@shelfcure.com',
    role: 'admin'
  };
  next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'User role is not authorized to access this route'
      });
    }

    next();
  };
};

// Chat Session Routes
router.route('/sessions')
  .get(protect, authorize('admin', 'store_manager', 'staff'), getChatSessions)
  .post(createChatSession); // Public route for creating chat sessions

router.route('/sessions/:id')
  .get(protect, getChatSession)
  .put(protect, authorize('admin', 'store_manager', 'staff'), updateChatSession);

router.route('/sessions/:id/assign')
  .put(protect, authorize('admin', 'store_manager'), assignAgent);

// Message Routes
router.route('/sessions/:sessionId/messages')
  .get(protect, getMessages)
  .post(sendMessage); // Can be used by both authenticated and unauthenticated users

router.route('/messages/:messageId')
  .put(protect, editMessage)
  .delete(protect, authorize('admin', 'store_manager', 'staff'), deleteMessage);

router.route('/messages/:messageId/read')
  .put(protect, markAsRead);

router.route('/messages/:messageId/reactions')
  .post(protect, addReaction);

// Analytics and Management Routes
router.route('/analytics')
  .get(protect, authorize('admin', 'store_manager'), getChatAnalytics);

router.route('/agents/online')
  .get(protect, authorize('admin', 'store_manager', 'staff'), getOnlineAgents);

router.route('/agents/:agentId/status')
  .put(protect, authorize('admin', 'store_manager', 'staff'), updateAgentStatus);

router.route('/agents/:agentId/workload')
  .get(protect, authorize('admin', 'store_manager'), getAgentWorkload);

module.exports = router;

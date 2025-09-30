const express = require('express');
const router = express.Router();

// Import controllers
const {
  processMessage,
  getHelp,
  clearConversation,
  getAnalytics,
  uploadDocument,
  upload
} = require('../controllers/aiAssistantController');

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const {
  storeManagerOnly,
  logStoreManagerActivity
} = require('../middleware/storeManagerAuth');

// Apply authentication and authorization middleware to all routes
router.use(protect);
router.use(authorize('store_manager'));
router.use(storeManagerOnly);

// ===================
// AI ASSISTANT ROUTES
// ===================

/**
 * @route   POST /api/store-manager/ai-assistant/chat
 * @desc    Process user message and return AI assistant response
 * @access  Private (Store Manager only)
 */
router.post('/chat',
  logStoreManagerActivity('ai_assistant_chat'),
  processMessage
);

/**
 * @route   GET /api/store-manager/ai-assistant/help
 * @desc    Get AI assistant capabilities and help information
 * @access  Private (Store Manager only)
 */
router.get('/help',
  logStoreManagerActivity('ai_assistant_help'),
  getHelp
);

/**
 * @route   DELETE /api/store-manager/ai-assistant/conversations/:id
 * @desc    Clear conversation history
 * @access  Private (Store Manager only)
 */
router.delete('/conversations/:id',
  logStoreManagerActivity('clear_ai_conversation'),
  clearConversation
);

/**
 * @route   GET /api/store-manager/ai-assistant/analytics
 * @desc    Get AI assistant usage analytics
 * @access  Private (Store Manager only)
 */
router.get('/analytics',
  logStoreManagerActivity('view_ai_analytics'),
  getAnalytics
);

/**
 * @route   POST /api/store-manager/ai-assistant/upload-document
 * @desc    Upload and analyze document (image/PDF)
 * @access  Private (Store Manager only)
 */
router.post('/upload-document',
  upload.single('document'),
  logStoreManagerActivity('upload_document'),
  uploadDocument
);

module.exports = router;

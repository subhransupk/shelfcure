const geminiAIService = require('../services/geminiAIService');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

/**
 * @desc    Process AI assistant message
 * @route   POST /api/store-manager/ai-assistant/chat
 * @access  Private (Store Manager only)
 */
const processMessage = async (req, res) => {
  const startTime = Date.now();

  try {
    console.log('🤖 Gemini AI Assistant processing message:', req.body);

    const { message, conversationId, documents } = req.body;
    const store = req.store;
    const user = req.user;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required and cannot be empty'
      });
    }

    // Check if user has access to the store
    if (!store || !store._id) {
      return res.status(403).json({
        success: false,
        message: 'Store context not found. Please ensure you have access to a store.',
        code: 'STORE_REQUIRED'
      });
    }

    // Check user role
    if (user.role !== 'store_manager') {
      return res.status(403).json({
        success: false,
        message: 'Only store managers can use the AI assistant',
        code: 'INSUFFICIENT_ROLE'
      });
    }

    // Process the message using Gemini AI
    const context = {
      store,
      user,
      conversationId: conversationId || null,
      documents: documents || [] // Include uploaded documents in context
    };

    const result = await geminiAIService.processStoreQuery(message, context);

    // Log processing time
    const processingTime = Date.now() - startTime;
    console.log(`⚡ AI processing completed in ${processingTime}ms`);

    if (result.success) {
      const responseData = {
        response: result.response,
        suggestions: result.suggestions,
        quickActions: result.quickActions,
        intent: result.intent,
        confidence: result.confidence,
        conversationId: result.conversationId,
        processingTime
      };

      // Add follow-up actions if available (for enhanced customer management)
      if (result.followUpActions) {
        responseData.followUpActions = result.followUpActions;
      }

      // Add action execution result if available
      if (result.actionExecuted) {
        responseData.actionExecuted = result.actionExecuted;
        responseData.actionResult = result.actionResult;
      }

      // Add confirmation requirements for customer deletion
      if (result.requiresConfirmation) {
        responseData.requiresConfirmation = result.requiresConfirmation;
        responseData.confirmationData = result.confirmationData;
      }

      res.status(200).json({
        success: true,
        data: responseData
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.response,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ AI Assistant Controller error:', error);
    
    const processingTime = Date.now() - startTime;
    
    res.status(500).json({
      success: false,
      message: 'I apologize, but I encountered an error while processing your request. Please try again in a moment.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      processingTime
    });
  }
};

/**
 * @desc    Get AI assistant help and capabilities
 * @route   GET /api/store-manager/ai-assistant/help
 * @access  Private (Store Manager only)
 */
const getHelp = async (req, res) => {
  try {
    const capabilities = {
      inventory: {
        title: 'Inventory Management',
        description: 'Manage your pharmacy inventory efficiently',
        examples: [
          'Show me low stock medicines',
          'Check inventory for Paracetamol',
          'What medicines are expiring this month?',
          'Add new medicine to inventory'
        ]
      },
      sales: {
        title: 'Sales & POS',
        description: 'Handle sales transactions and reports',
        examples: [
          'Show today\'s sales',
          'Create a new sale',
          'Who are my top customers this month?',
          'What was yesterday\'s revenue?'
        ]
      },
      customers: {
        title: 'Customer Management',
        description: 'Manage customer information and history',
        examples: [
          'Show all customers',
          'Find customer John Smith',
          'Add new customer',
          'Show customer purchase history'
        ]
      },
      suppliers: {
        title: 'Supplier Management',
        description: 'Manage suppliers and purchase orders',
        examples: [
          'Show all suppliers',
          'Create purchase order',
          'Check pending deliveries',
          'Add new supplier'
        ]
      },
      analytics: {
        title: 'Analytics & Reports',
        description: 'Get insights and generate reports',
        examples: [
          'Show sales analytics',
          'Generate monthly report',
          'Compare this month vs last month',
          'Show inventory turnover'
        ]
      },
      general: {
        title: 'General Assistance',
        description: 'Get help with any store management task',
        examples: [
          'Show dashboard overview',
          'What can you help me with?',
          'How do I manage expiry alerts?',
          'Help me with staff management'
        ]
      }
    };

    const quickStart = [
      {
        icon: 'BarChart3',
        title: 'Sales Overview',
        description: 'Get today\'s sales performance',
        query: 'Show me today\'s sales performance'
      },
      {
        icon: 'Package',
        title: 'Inventory Status',
        description: 'Check stock levels and alerts',
        query: 'Show me low stock medicines'
      },
      {
        icon: 'Users',
        title: 'Customer Insights',
        description: 'View customer analytics',
        query: 'Show me top customers this month'
      },
      {
        icon: 'ShoppingCart',
        title: 'Purchase Orders',
        description: 'Manage supplier orders',
        query: 'Show pending purchase orders'
      }
    ];

    res.status(200).json({
      success: true,
      data: {
        capabilities,
        quickStart,
        tips: [
          'Ask questions in natural language - I understand context',
          'Be specific about time periods (today, this week, last month)',
          'I can help with complex queries across multiple areas',
          'Use follow-up questions to dive deeper into topics'
        ]
      }
    });

  } catch (error) {
    console.error('Error getting AI assistant help:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving help information',
      error: error.message
    });
  }
};

/**
 * @desc    Clear conversation history
 * @route   DELETE /api/store-manager/ai-assistant/conversations/:id
 * @access  Private (Store Manager only)
 */
const clearConversation = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required'
      });
    }

    // Clear the conversation from Gemini service
    geminiAIService.clearConversation(id);

    res.status(200).json({
      success: true,
      message: 'Conversation history cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing conversation history',
      error: error.message
    });
  }
};

/**
 * @desc    Get conversation analytics
 * @route   GET /api/store-manager/ai-assistant/analytics
 * @access  Private (Store Manager only)
 */
const getAnalytics = async (req, res) => {
  try {
    const activeConversations = geminiAIService.getActiveConversations();
    
    res.status(200).json({
      success: true,
      data: {
        activeConversations: activeConversations.length,
        totalQueries: activeConversations.length, // Simplified for now
        averageResponseTime: '< 2s',
        topIntents: ['inventory', 'sales', 'customers'],
        status: 'operational'
      }
    });

  } catch (error) {
    console.error('Error getting AI analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving analytics',
      error: error.message
    });
  }
};

/**
 * @desc    Upload and analyze document
 * @route   POST /api/store-manager/ai-assistant/upload-document
 * @access  Private (Store Manager only)
 */
const uploadDocument = async (req, res) => {
  try {
    console.log('📄 Document upload request received');

    const store = req.store;
    const user = req.user;

    // Check if user has access to the store
    if (!store || !store._id) {
      return res.status(403).json({
        success: false,
        message: 'Store context not found. Please ensure you have access to a store.',
        code: 'STORE_REQUIRED'
      });
    }

    // Check user role
    if (user.role !== 'store_manager') {
      return res.status(403).json({
        success: false,
        message: 'Only store managers can upload documents',
        code: 'INSUFFICIENT_ROLE'
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document uploaded'
      });
    }

    const file = req.file;
    console.log('📄 Processing uploaded file:', file.originalname);

    // Create document URL (relative to uploads directory)
    const documentUrl = `/uploads/documents/${file.filename}`;

    // Try to analyze the document using Gemini AI
    let analysis;
    try {
      const context = { store, user };
      analysis = await geminiAIService.analyzeDocument(file.path, file.mimetype, context);
    } catch (analysisError) {
      console.error('Document analysis failed:', analysisError);

      // Provide fallback analysis based on error type
      if (analysisError.status === 503 || analysisError.message?.includes('overloaded')) {
        analysis = {
          summary: "Document uploaded successfully! The AI analysis service is temporarily busy. You can still use the document and I'll try to analyze it when you ask specific questions about it.",
          documentType: 'uploaded',
          extractedData: {},
          suggestions: [
            "What information should I extract from this document?",
            "Create a purchase order from this bill",
            "Add medicines from this document to inventory",
            "Tell me what you see in this document"
          ],
          error: 'analysis_service_busy'
        };
      } else {
        analysis = {
          summary: "Document uploaded successfully! I couldn't analyze it automatically, but you can ask me specific questions about it.",
          documentType: 'uploaded',
          extractedData: {},
          suggestions: [
            "What do you see in this document?",
            "Extract medicine information",
            "Create a purchase order",
            "Help me understand this document"
          ],
          error: 'analysis_failed'
        };
      }
    }

    res.json({
      success: true,
      data: {
        url: documentUrl,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        type: file.mimetype,
        analysis: analysis
      }
    });

  } catch (error) {
    console.error('Error uploading document:', error);

    // Provide more specific error messages
    let errorMessage = 'Error uploading document';
    if (error.code === 'LIMIT_FILE_SIZE') {
      errorMessage = 'File size too large. Please upload a file smaller than 10MB.';
    } else if (error.message?.includes('Invalid file type')) {
      errorMessage = 'Invalid file type. Please upload an image (JPG, PNG) or PDF file.';
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/documents');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images (JPG, PNG) and PDF files are allowed.'));
    }
  }
});

module.exports = {
  processMessage,
  getHelp,
  clearConversation,
  getAnalytics,
  uploadDocument,
  upload
};

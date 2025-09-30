const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['user', 'agent'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  intent: {
    type: String,
    default: null
  },
  entities: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  actionResult: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  }
});

const conversationSchema = new mongoose.Schema({
  // User and Store Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  
  // Conversation Metadata
  title: {
    type: String,
    default: 'New Conversation'
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  
  // Messages
  messages: [messageSchema],
  
  // Conversation Context
  context: {
    // Current topic/domain being discussed
    currentTopic: {
      type: String,
      enum: ['sales', 'inventory', 'customers', 'purchases', 'analytics', 'general'],
      default: 'general'
    },
    
    // Recently mentioned entities for context
    recentEntities: {
      medicines: [{
        name: String,
        id: mongoose.Schema.Types.ObjectId,
        mentionedAt: { type: Date, default: Date.now }
      }],
      customers: [{
        name: String,
        id: mongoose.Schema.Types.ObjectId,
        mentionedAt: { type: Date, default: Date.now }
      }],
      suppliers: [{
        name: String,
        id: mongoose.Schema.Types.ObjectId,
        mentionedAt: { type: Date, default: Date.now }
      }],
      dateRanges: [{
        startDate: Date,
        endDate: Date,
        description: String,
        mentionedAt: { type: Date, default: Date.now }
      }]
    },
    
    // Pending actions or confirmations
    pendingAction: {
      type: {
        type: String,
        enum: ['purchase_order', 'inventory_update', 'customer_creation', 'sale_creation'],
        default: null
      },
      data: mongoose.Schema.Types.Mixed,
      expiresAt: Date
    },
    
    // User preferences learned during conversation
    preferences: {
      preferredDateFormat: {
        type: String,
        enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
        default: 'DD/MM/YYYY'
      },
      preferredCurrency: {
        type: String,
        default: 'INR'
      },
      preferredUnits: {
        type: String,
        enum: ['strips', 'individual', 'both'],
        default: 'both'
      }
    }
  },
  
  // Analytics
  messageCount: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  totalDuration: {
    type: Number, // in minutes
    default: 0
  },
  
  // Feedback
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  feedback: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for better performance
conversationSchema.index({ user: 1, store: 1 });
conversationSchema.index({ user: 1, lastActivity: -1 });
conversationSchema.index({ store: 1, createdAt: -1 });
conversationSchema.index({ status: 1 });

// Update lastActivity on message addition
conversationSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastActivity = new Date();
    this.messageCount = this.messages.length;
    
    // Update title based on first user message if still default
    if (this.title === 'New Conversation' && this.messages.length > 0) {
      const firstUserMessage = this.messages.find(msg => msg.type === 'user');
      if (firstUserMessage) {
        // Create title from first 50 characters of first user message
        this.title = firstUserMessage.content.substring(0, 50) + 
                    (firstUserMessage.content.length > 50 ? '...' : '');
      }
    }
  }
  next();
});

// Clean up old context entities (keep only last 10 of each type)
conversationSchema.methods.cleanupContext = function() {
  const maxEntities = 10;
  
  if (this.context.recentEntities.medicines.length > maxEntities) {
    this.context.recentEntities.medicines = this.context.recentEntities.medicines
      .sort((a, b) => b.mentionedAt - a.mentionedAt)
      .slice(0, maxEntities);
  }
  
  if (this.context.recentEntities.customers.length > maxEntities) {
    this.context.recentEntities.customers = this.context.recentEntities.customers
      .sort((a, b) => b.mentionedAt - a.mentionedAt)
      .slice(0, maxEntities);
  }
  
  if (this.context.recentEntities.suppliers.length > maxEntities) {
    this.context.recentEntities.suppliers = this.context.recentEntities.suppliers
      .sort((a, b) => b.mentionedAt - a.mentionedAt)
      .slice(0, maxEntities);
  }
  
  if (this.context.recentEntities.dateRanges.length > maxEntities) {
    this.context.recentEntities.dateRanges = this.context.recentEntities.dateRanges
      .sort((a, b) => b.mentionedAt - a.mentionedAt)
      .slice(0, maxEntities);
  }
};

// Add message to conversation
conversationSchema.methods.addMessage = function(type, content, metadata = {}) {
  const message = {
    type,
    content,
    timestamp: new Date(),
    ...metadata
  };
  
  this.messages.push(message);
  this.cleanupContext();
  
  return message;
};

// Get recent messages for context
conversationSchema.methods.getRecentMessages = function(count = 10) {
  return this.messages
    .slice(-count)
    .map(msg => ({
      type: msg.type,
      content: msg.content,
      timestamp: msg.timestamp,
      intent: msg.intent
    }));
};

module.exports = mongoose.model('Conversation', conversationSchema);

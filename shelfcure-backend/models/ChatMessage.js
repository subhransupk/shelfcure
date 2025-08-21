const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  // Message Identification
  messageId: {
    type: String,
    required: true,
    unique: true,
    default: () => `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  
  // Associated Chat Session
  sessionId: {
    type: mongoose.Schema.ObjectId,
    ref: 'ChatSession',
    required: true
  },
  
  // Message Content
  content: {
    type: String,
    required: true,
    maxlength: [2000, 'Message cannot be more than 2000 characters']
  },
  
  // Message Type
  type: {
    type: String,
    enum: ['user', 'agent', 'system', 'bot'],
    required: true
  },
  
  // Sender Information
  sender: {
    senderId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null
    },
    senderName: {
      type: String,
      required: true,
      trim: true
    },
    senderRole: {
      type: String,
      enum: ['customer', 'agent', 'system', 'bot'],
      required: true
    }
  },
  
  // Message Status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  
  // Read Status
  readBy: [{
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Message Metadata
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  
  // Attachments
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'video', 'audio'],
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    originalName: String,
    size: Number,
    mimeType: String,
    url: String
  }],
  
  // Message Reactions
  reactions: [{
    emoji: String,
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // System Message Data
  systemData: {
    action: String,
    data: mongoose.Schema.Types.Mixed
  },
  
  // Message Threading
  replyTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'ChatMessage',
    default: null
  },
  
  // Internal Flags
  isInternal: {
    type: Boolean,
    default: false
  },
  
  // Delivery Information
  deliveredAt: Date,
  readAt: Date,
  
  // IP and User Agent (for security)
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
chatMessageSchema.virtual('isFromCustomer').get(function() {
  return this.type === 'user' || this.sender.senderRole === 'customer';
});

chatMessageSchema.virtual('isFromAgent').get(function() {
  return this.type === 'agent' || this.sender.senderRole === 'agent';
});

chatMessageSchema.virtual('isSystemMessage').get(function() {
  return this.type === 'system';
});

chatMessageSchema.virtual('hasAttachments').get(function() {
  return this.attachments && this.attachments.length > 0;
});

chatMessageSchema.virtual('isRead').get(function() {
  return this.status === 'read' || this.readAt !== null;
});

// Indexes for performance
chatMessageSchema.index({ sessionId: 1, createdAt: -1 });
chatMessageSchema.index({ messageId: 1 });
chatMessageSchema.index({ 'sender.senderId': 1 });
chatMessageSchema.index({ type: 1 });
chatMessageSchema.index({ status: 1 });
chatMessageSchema.index({ createdAt: -1 });

// Middleware to update session's lastActivity and messageCount
chatMessageSchema.post('save', async function() {
  try {
    const ChatSession = mongoose.model('ChatSession');
    await ChatSession.findByIdAndUpdate(this.sessionId, {
      lastActivity: new Date(),
      $inc: { messageCount: 1 }
    });
  } catch (error) {
    console.error('Error updating chat session:', error);
  }
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);

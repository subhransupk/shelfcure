const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  // Session Identification
  sessionId: {
    type: String,
    required: true,
    unique: true,
    default: () => `CHAT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  
  // Chat Type and Source
  type: {
    type: String,
    enum: ['website', 'store', 'whatsapp', 'mobile'],
    required: true,
    default: 'website'
  },
  
  // Customer Information
  customer: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    phone: {
      type: String,
      required: true,
      match: [/^\+?[\d\s\-\(\)]{10,}$/, 'Please add a valid phone number']
    },
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null
    }
  },
  
  // Store Information (for store-initiated chats)
  store: {
    storeId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Store',
      default: null
    },
    storeName: String
  },
  
  // Agent Assignment
  agent: {
    agentId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null
    },
    agentName: String,
    assignedAt: Date
  },
  
  // Chat Details
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Subject cannot be more than 200 characters']
  },
  
  // Chat Status
  status: {
    type: String,
    enum: ['pending', 'active', 'closed', 'transferred'],
    default: 'pending'
  },
  
  // Priority Level
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Timing Information
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  
  // Wait and Response Times (in minutes)
  waitTime: {
    type: Number,
    default: 0
  },
  averageResponseTime: {
    type: Number,
    default: 0
  },
  
  // Chat Statistics
  messageCount: {
    type: Number,
    default: 0
  },
  
  // Customer Feedback
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  feedback: {
    type: String,
    maxlength: [500, 'Feedback cannot be more than 500 characters'],
    default: null
  },
  
  // Tags and Categories
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: ['general', 'technical', 'billing', 'product', 'complaint', 'feature_request'],
    default: 'general'
  },
  
  // Resolution Information
  resolved: {
    type: Boolean,
    default: false
  },
  resolution: {
    type: String,
    maxlength: [1000, 'Resolution cannot be more than 1000 characters'],
    default: null
  },
  
  // Metadata
  ipAddress: String,
  userAgent: String,
  referrer: String,
  
  // Internal Notes (for agents)
  internalNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
chatSessionSchema.virtual('duration').get(function() {
  if (this.endTime) {
    return Math.round((this.endTime - this.startTime) / (1000 * 60)); // Duration in minutes
  }
  return Math.round((Date.now() - this.startTime) / (1000 * 60));
});

chatSessionSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

chatSessionSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

chatSessionSchema.virtual('isClosed').get(function() {
  return this.status === 'closed';
});

// Indexes for performance
chatSessionSchema.index({ sessionId: 1 });
chatSessionSchema.index({ status: 1 });
chatSessionSchema.index({ 'agent.agentId': 1 });
chatSessionSchema.index({ 'store.storeId': 1 });
chatSessionSchema.index({ 'customer.email': 1 });
chatSessionSchema.index({ startTime: -1 });
chatSessionSchema.index({ lastActivity: -1 });

// Middleware to update lastActivity on save
chatSessionSchema.pre('save', function(next) {
  if (this.isModified() && !this.isModified('lastActivity')) {
    this.lastActivity = new Date();
  }
  next();
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = createServer(app);

// Socket.IO setup for real-time features
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3001", // Allow both ports for development
      "http://localhost:3002"  // Additional port if needed
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(compression());
app.use(morgan('combined'));

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:3001", // Allow both ports for development
    "http://localhost:3002"  // Additional port if needed
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Store-Context',
    'Cache-Control',
    'Pragma',
    'X-Requested-With'
  ]
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'shelfcure-session-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/shelfcure',
    touchAfter: 24 * 3600 // lazy session update
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Global flag to track database connection status
global.isDatabaseConnected = false;

// Database connection
const connectDB = async () => {
  try {
    // Set mongoose connection options to prevent crashes
    mongoose.set('strictQuery', false);

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
    });

    global.isDatabaseConnected = true;
    console.log(`🗄️  MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
      global.isDatabaseConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
      global.isDatabaseConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
      global.isDatabaseConnected = true;
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('🔧 Running in development mode with mock data (database disabled)');
    console.log('📝 Using in-memory mock authentication for testing');
    global.isDatabaseConnected = false;

    // Don't exit the process, just continue without database
    // The server will still run and serve mock data
  }
};

// Connect to database (non-blocking)
connectDB().catch(err => {
  console.error('❌ Failed to initialize database connection:', err.message);
  console.log('🔧 Server will continue running with mock data');
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  // Join store-specific rooms for multi-store support
  socket.on('join-store', (storeId) => {
    socket.join(`store-${storeId}`);
    console.log(`👤 User ${socket.id} joined store ${storeId}`);
  });

  // Handle real-time inventory updates
  socket.on('inventory-update', (data) => {
    socket.to(`store-${data.storeId}`).emit('inventory-updated', data);
  });

  // Handle real-time sales updates
  socket.on('sale-completed', (data) => {
    socket.to(`store-${data.storeId}`).emit('sale-notification', data);
  });

  // Chat-specific Socket.IO handlers

  // Join chat session room
  socket.on('join-chat', (sessionId) => {
    socket.join(`chat-${sessionId}`);
    console.log(`💬 User ${socket.id} joined chat session ${sessionId}`);

    // Notify others in the chat that someone joined
    socket.to(`chat-${sessionId}`).emit('user-joined-chat', {
      socketId: socket.id,
      timestamp: new Date()
    });
  });

  // Leave chat session room
  socket.on('leave-chat', (sessionId) => {
    socket.leave(`chat-${sessionId}`);
    console.log(`💬 User ${socket.id} left chat session ${sessionId}`);

    // Notify others in the chat that someone left
    socket.to(`chat-${sessionId}`).emit('user-left-chat', {
      socketId: socket.id,
      timestamp: new Date()
    });
  });

  // Handle new chat messages
  socket.on('send-message', async (data) => {
    try {
      const { sessionId, content, type, senderInfo } = data;

      // Create message in database
      const ChatMessage = require('./models/ChatMessage');
      const message = await ChatMessage.create({
        sessionId,
        content,
        type: type || 'user',
        sender: senderInfo,
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent']
      });

      // Populate the message
      const populatedMessage = await ChatMessage.findById(message._id)
        .populate('sender.senderId', 'name avatar');

      // Emit to all users in the chat session
      io.to(`chat-${sessionId}`).emit('new-message', populatedMessage);

      // Emit to admin dashboard for real-time updates
      io.to('admin-dashboard').emit('chat-message-received', {
        sessionId,
        message: populatedMessage
      });

    } catch (error) {
      console.error('Error handling send-message:', error);
      socket.emit('message-error', {
        error: 'Failed to send message',
        details: error.message
      });
    }
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    const { sessionId, senderInfo } = data;
    socket.to(`chat-${sessionId}`).emit('user-typing', {
      senderInfo,
      timestamp: new Date()
    });
  });

  socket.on('typing-stop', (data) => {
    const { sessionId, senderInfo } = data;
    socket.to(`chat-${sessionId}`).emit('user-stopped-typing', {
      senderInfo,
      timestamp: new Date()
    });
  });

  // Handle agent assignment
  socket.on('assign-agent', async (data) => {
    try {
      const { sessionId, agentId, agentInfo } = data;

      // Update session in database
      const ChatSession = require('./models/ChatSession');
      await ChatSession.findByIdAndUpdate(sessionId, {
        'agent.agentId': agentId,
        'agent.agentName': agentInfo.name,
        'agent.assignedAt': new Date(),
        status: 'active'
      });

      // Create system message
      const ChatMessage = require('./models/ChatMessage');
      const systemMessage = await ChatMessage.create({
        sessionId,
        content: `${agentInfo.name} has joined the chat`,
        type: 'system',
        sender: {
          senderName: 'System',
          senderRole: 'system'
        }
      });

      // Notify all users in the chat
      io.to(`chat-${sessionId}`).emit('agent-assigned', {
        agentInfo,
        systemMessage,
        timestamp: new Date()
      });

      // Update admin dashboard
      io.to('admin-dashboard').emit('chat-session-updated', {
        sessionId,
        status: 'active',
        agent: agentInfo
      });

    } catch (error) {
      console.error('Error handling assign-agent:', error);
      socket.emit('assignment-error', {
        error: 'Failed to assign agent',
        details: error.message
      });
    }
  });

  // Handle chat session status updates
  socket.on('update-chat-status', async (data) => {
    try {
      const { sessionId, status, resolution } = data;

      const ChatSession = require('./models/ChatSession');
      const updateData = { status };

      if (status === 'closed') {
        updateData.endTime = new Date();
        updateData.resolved = true;
        if (resolution) updateData.resolution = resolution;
      }

      await ChatSession.findByIdAndUpdate(sessionId, updateData);

      // Create system message
      const ChatMessage = require('./models/ChatMessage');
      const systemMessage = await ChatMessage.create({
        sessionId,
        content: `Chat session ${status}`,
        type: 'system',
        sender: {
          senderName: 'System',
          senderRole: 'system'
        }
      });

      // Notify all users in the chat
      io.to(`chat-${sessionId}`).emit('chat-status-updated', {
        status,
        systemMessage,
        timestamp: new Date()
      });

      // Update admin dashboard
      io.to('admin-dashboard').emit('chat-session-updated', {
        sessionId,
        status
      });

    } catch (error) {
      console.error('Error updating chat status:', error);
      socket.emit('status-update-error', {
        error: 'Failed to update chat status',
        details: error.message
      });
    }
  });

  // Handle admin dashboard connection
  socket.on('join-admin-dashboard', () => {
    socket.join('admin-dashboard');
    console.log(`👨‍💼 Admin ${socket.id} joined dashboard`);
  });

  // Handle agent online status
  socket.on('agent-online', (agentInfo) => {
    socket.join('online-agents');
    io.to('admin-dashboard').emit('agent-status-changed', {
      agentId: agentInfo.id,
      status: 'online',
      timestamp: new Date()
    });
  });

  socket.on('agent-offline', (agentInfo) => {
    socket.leave('online-agents');
    io.to('admin-dashboard').emit('agent-status-changed', {
      agentId: agentInfo.id,
      status: 'offline',
      timestamp: new Date()
    });
  });

  // Handle message read status
  socket.on('mark-messages-read', async (data) => {
    try {
      const { sessionId, userId } = data;

      const ChatMessage = require('./models/ChatMessage');
      await ChatMessage.updateMany(
        {
          sessionId,
          'readBy.userId': { $ne: userId },
          'sender.senderId': { $ne: userId }
        },
        {
          $push: {
            readBy: {
              userId,
              readAt: new Date()
            }
          }
        }
      );

      // Notify other users in the chat
      socket.to(`chat-${sessionId}`).emit('messages-read', {
        userId,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('👤 User disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Set up socket manager
const { setIO } = require('./utils/socketManager');
setIO(io);

// Initialize notification jobs
const NotificationJobs = require('./jobs/notificationJobs');
NotificationJobs.init();

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/ocr', require('./routes/ocr'));

// Admin Routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/affiliates', require('./routes/affiliates'));
app.use('/api/affiliate-panel', require('./routes/affiliatePanel'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/discounts', require('./routes/discounts'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/chat', require('./routes/chat'));

// Store Owner Routes
app.use('/api/store-owner', require('./routes/storeOwnerClean'));

// Store Manager Routes
app.use('/api/store-manager', require('./routes/storeManager'));
app.use('/api/store-manager/suppliers', require('./routes/suppliers'));
app.use('/api/store-manager/suppliers', require('./routes/supplierPayment'));
app.use('/api/store-manager/purchases', require('./routes/purchases'));
app.use('/api/store-manager/purchase-returns', require('./routes/purchaseReturns'));
app.use('/api/store-manager/medicine-requests', require('./routes/medicineRequests'));
app.use('/api/store-manager/expiry-alerts', require('./routes/expiryAlerts'));
app.use('/api/store-manager/returns', require('./routes/returns'));
app.use('/api/store-manager/credit', require('./routes/credit'));

// Medicine Location Routes (accessible to store staff for read-only operations)
app.use('/api/medicine-locations', require('./routes/medicineLocation'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'ShelfCure API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
});

// Database collections viewer endpoint
app.get('/api/db/collections', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    const collectionsData = {};

    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await db.collection(collectionName).countDocuments();
      const sampleDoc = await db.collection(collectionName).findOne();

      collectionsData[collectionName] = {
        count,
        sampleDocument: sampleDoc
      };
    }

    res.json({
      database: 'shelfcure',
      collections: collectionsData,
      totalCollections: collections.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch collections',
      message: error.message
    });
  }
});

// View specific collection data
app.get('/api/db/collections/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;

    const db = mongoose.connection.db;
    const collection = db.collection(name);

    const documents = await collection.find({}).skip(skip).limit(limit).toArray();
    const totalCount = await collection.countDocuments();

    res.json({
      collection: name,
      totalDocuments: totalCount,
      currentPage: Math.floor(skip / limit) + 1,
      documentsPerPage: limit,
      documents
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch collection data',
      message: error.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🏥 Welcome to ShelfCure API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/api/health'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Global Error:', error);
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      error: 'Validation Error',
      messages: errors
    });
  }
  
  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      error: 'Duplicate Error',
      message: `${field} already exists`
    });
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid Token',
      message: 'Please login again'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token Expired',
      message: 'Please login again'
    });
  }
  
  // Default error
  res.status(error.status || 500).json({
    error: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  console.error('Promise:', promise);
  // Don't exit the process, just log the error
  // In production, you might want to exit gracefully
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error('Stack:', err.stack);
  // Don't exit the process, just log the error
  // In production, you might want to exit gracefully
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 ShelfCure API Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = { app, server, io };

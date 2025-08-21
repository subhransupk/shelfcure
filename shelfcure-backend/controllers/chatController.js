const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const Store = require('../models/Store');

// @desc    Get all chat sessions with filters
// @route   GET /api/chat/sessions
// @access  Private (Admin/Agent)
exports.getChatSessions = async (req, res) => {
  try {
    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for chat sessions, using mock data');

      const mockSessions = [
        {
          _id: '1',
          sessionId: 'CS001',
          customer: { name: 'John Doe', email: 'john@example.com', phone: '+91-9876543210' },
          store: { storeId: '1', name: 'City Pharmacy' },
          agent: { agentId: 'admin', name: 'Admin User' },
          status: 'active',
          type: 'support',
          priority: 'medium',
          subject: 'Order inquiry',
          startTime: new Date(),
          lastActivity: new Date(),
          messageCount: 5
        },
        {
          _id: '2',
          sessionId: 'CS002',
          customer: { name: 'Jane Smith', email: 'jane@example.com', phone: '+91-9876543211' },
          store: { storeId: '2', name: 'HealthMart Plus' },
          agent: { agentId: 'admin', name: 'Admin User' },
          status: 'closed',
          type: 'complaint',
          priority: 'high',
          subject: 'Product quality issue',
          startTime: new Date(Date.now() - 86400000),
          endTime: new Date(Date.now() - 3600000),
          lastActivity: new Date(Date.now() - 3600000),
          messageCount: 12
        }
      ];

      return res.status(200).json({
        success: true,
        data: mockSessions,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: mockSessions.length,
          itemsPerPage: 20
        }
      });
    }

    const {
      status,
      type,
      agentId,
      storeId,
      priority,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 20
    } = req.query;

    // Build filter object
    const filter = {};

    if (status && status !== 'all') filter.status = status;
    if (type) filter.type = type;
    if (agentId) filter['agent.agentId'] = agentId;
    if (storeId) filter['store.storeId'] = storeId;
    if (priority) filter.priority = priority;

    if (dateFrom || dateTo) {
      filter.startTime = {};
      if (dateFrom) filter.startTime.$gte = new Date(dateFrom);
      if (dateTo) filter.startTime.$lte = new Date(dateTo);
    }

    if (search) {
      filter.$or = [
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { sessionId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const sessions = await ChatSession.find(filter)
      .populate('agent.agentId', 'name email avatar')
      .populate('store.storeId', 'name')
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ChatSession.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat sessions',
      error: error.message
    });
  }
};

// @desc    Get single chat session
// @route   GET /api/chat/sessions/:id
// @access  Private
exports.getChatSession = async (req, res) => {
  try {
    const session = await ChatSession.findById(req.params.id)
      .populate('agent.agentId', 'name email avatar role')
      .populate('store.storeId', 'name address');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error fetching chat session:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat session',
      error: error.message
    });
  }
};

// @desc    Create new chat session
// @route   POST /api/chat/sessions
// @access  Public
exports.createChatSession = async (req, res) => {
  try {
    const {
      type = 'website',
      customer,
      subject,
      priority = 'normal',
      storeId,
      initialMessage
    } = req.body;

    // Validate required fields
    if (!customer || !customer.name || !customer.email || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Please provide customer name, email, and subject'
      });
    }

    // Create chat session
    const sessionData = {
      type,
      customer,
      subject,
      priority,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer')
    };

    // Add store information if provided
    if (storeId) {
      const store = await Store.findById(storeId);
      if (store) {
        sessionData.store = {
          storeId: store._id,
          storeName: store.name
        };
      }
    }

    const session = await ChatSession.create(sessionData);

    // Create initial system message
    await ChatMessage.create({
      sessionId: session._id,
      content: `Chat session started. Customer: ${customer.name}`,
      type: 'system',
      sender: {
        senderName: 'System',
        senderRole: 'system'
      }
    });

    // Create initial customer message if provided
    if (initialMessage) {
      await ChatMessage.create({
        sessionId: session._id,
        content: initialMessage,
        type: 'user',
        sender: {
          senderName: customer.name,
          senderRole: 'customer'
        }
      });
    }

    res.status(201).json({
      success: true,
      data: session,
      message: 'Chat session created successfully'
    });
  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating chat session',
      error: error.message
    });
  }
};

// @desc    Update chat session
// @route   PUT /api/chat/sessions/:id
// @access  Private (Admin/Agent)
exports.updateChatSession = async (req, res) => {
  try {
    const { status, priority, tags, resolution, rating, feedback } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (tags) updateData.tags = tags;
    if (resolution) updateData.resolution = resolution;
    if (rating) updateData.rating = rating;
    if (feedback) updateData.feedback = feedback;

    // If closing the session, set endTime
    if (status === 'closed') {
      updateData.endTime = new Date();
      updateData.resolved = true;
    }

    const session = await ChatSession.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    res.status(200).json({
      success: true,
      data: session,
      message: 'Chat session updated successfully'
    });
  } catch (error) {
    console.error('Error updating chat session:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating chat session',
      error: error.message
    });
  }
};

// @desc    Assign agent to chat session
// @route   PUT /api/chat/sessions/:id/assign
// @access  Private (Admin/Agent)
exports.assignAgent = async (req, res) => {
  try {
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide agent ID'
      });
    }

    // Verify agent exists
    const agent = await User.findById(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    const session = await ChatSession.findByIdAndUpdate(
      req.params.id,
      {
        'agent.agentId': agentId,
        'agent.agentName': agent.name,
        'agent.assignedAt': new Date(),
        status: 'active'
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    // Create system message about agent assignment
    await ChatMessage.create({
      sessionId: session._id,
      content: `${agent.name} has been assigned to this chat`,
      type: 'system',
      sender: {
        senderName: 'System',
        senderRole: 'system'
      }
    });

    res.status(200).json({
      success: true,
      data: session,
      message: 'Agent assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning agent:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning agent',
      error: error.message
    });
  }
};

// @desc    Get chat analytics
// @route   GET /api/chat/analytics
// @access  Private (Admin)
exports.getChatAnalytics = async (req, res) => {
  try {
    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for chat analytics, using mock data');

      const mockAnalytics = {
        totalChats: 45,
        activeChats: 8,
        pendingChats: 3,
        closedChats: 34,
        avgWaitTime: 2.5,
        avgResponseTime: 1.2,
        avgResolutionTime: 15.8,
        customerSatisfaction: 4.2,
        agentPerformance: [
          { agentId: 'admin', name: 'Admin User', totalChats: 25, avgResponseTime: 1.1, satisfaction: 4.3 },
          { agentId: 'agent1', name: 'Support Agent 1', totalChats: 20, avgResponseTime: 1.3, satisfaction: 4.1 }
        ],
        hourlyDistribution: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          count: Math.floor(Math.random() * 10)
        })),
        topIssues: [
          { category: 'Order Inquiry', count: 15 },
          { category: 'Product Information', count: 12 },
          { category: 'Technical Support', count: 8 },
          { category: 'Billing', count: 6 },
          { category: 'Complaint', count: 4 }
        ]
      };

      return res.status(200).json({
        success: true,
        data: mockAnalytics
      });
    }

    const { period = 'today', storeId } = req.query;

    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case 'today':
        dateFilter = {
          startTime: {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          }
        };
        break;
      case 'week':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        dateFilter = { startTime: { $gte: weekStart } };
        break;
      case 'month':
        dateFilter = {
          startTime: {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1)
          }
        };
        break;
    }

    if (storeId) {
      dateFilter['store.storeId'] = storeId;
    }

    const [
      totalChats,
      activeChats,
      pendingChats,
      closedChats,
      avgWaitTime,
      avgResponseTime,
      avgRating
    ] = await Promise.all([
      ChatSession.countDocuments(dateFilter),
      ChatSession.countDocuments({ ...dateFilter, status: 'active' }),
      ChatSession.countDocuments({ ...dateFilter, status: 'pending' }),
      ChatSession.countDocuments({ ...dateFilter, status: 'closed' }),
      ChatSession.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, avgWaitTime: { $avg: '$waitTime' } } }
      ]),
      ChatSession.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, avgResponseTime: { $avg: '$averageResponseTime' } } }
      ]),
      ChatSession.aggregate([
        { $match: { ...dateFilter, rating: { $ne: null } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalChats,
        activeChats,
        pendingChats,
        closedChats,
        averageWaitTime: avgWaitTime[0]?.avgWaitTime || 0,
        averageResponseTime: avgResponseTime[0]?.avgResponseTime || 0,
        customerSatisfaction: avgRating[0]?.avgRating || 0,
        resolutionRate: totalChats > 0 ? (closedChats / totalChats) * 100 : 0
      }
    });
  } catch (error) {
    console.error('Error fetching chat analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat analytics',
      error: error.message
    });
  }
};

// @desc    Get online agents
// @route   GET /api/chat/agents/online
// @access  Private
exports.getOnlineAgents = async (req, res) => {
  try {
    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for online agents, using mock data');

      const mockAgents = [
        {
          _id: 'admin',
          name: 'Admin User',
          email: 'admin@shelfcure.com',
          role: 'admin',
          lastLogin: new Date(),
          status: 'online'
        },
        {
          _id: 'agent1',
          name: 'Support Agent 1',
          email: 'agent1@shelfcure.com',
          role: 'staff',
          lastLogin: new Date(Date.now() - 300000),
          status: 'busy'
        }
      ];

      return res.status(200).json({
        success: true,
        data: mockAgents,
        count: mockAgents.length
      });
    }

    // This would typically check Redis or another real-time store
    // For now, we'll return agents who have been active recently
    const agents = await User.find({
      role: { $in: ['admin', 'manager', 'staff'] },
      isActive: true,
      lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).select('name email avatar role lastLogin');

    res.status(200).json({
      success: true,
      data: agents,
      count: agents.length
    });
  } catch (error) {
    console.error('Error fetching online agents:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching online agents',
      error: error.message
    });
  }
};

// @desc    Update agent status
// @route   PUT /api/chat/agents/:agentId/status
// @access  Private
exports.updateAgentStatus = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { status } = req.body; // 'online', 'offline', 'busy', 'away'

    if (!['online', 'offline', 'busy', 'away'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: online, offline, busy, away'
      });
    }

    const agent = await User.findByIdAndUpdate(
      agentId,
      {
        chatStatus: status,
        lastActivity: new Date()
      },
      { new: true }
    ).select('name email avatar role chatStatus');

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    res.status(200).json({
      success: true,
      data: agent,
      message: `Agent status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating agent status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating agent status',
      error: error.message
    });
  }
};

// @desc    Get agent workload
// @route   GET /api/chat/agents/:agentId/workload
// @access  Private
exports.getAgentWorkload = async (req, res) => {
  try {
    const { agentId } = req.params;

    const [activeChats, totalChatsToday, avgResponseTime] = await Promise.all([
      ChatSession.countDocuments({
        'agent.agentId': agentId,
        status: 'active'
      }),
      ChatSession.countDocuments({
        'agent.agentId': agentId,
        startTime: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }),
      ChatSession.aggregate([
        {
          $match: {
            'agent.agentId': agentId,
            averageResponseTime: { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: '$averageResponseTime' }
          }
        }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        agentId,
        activeChats,
        totalChatsToday,
        averageResponseTime: avgResponseTime[0]?.avgResponseTime || 0
      }
    });
  } catch (error) {
    console.error('Error fetching agent workload:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching agent workload',
      error: error.message
    });
  }
};

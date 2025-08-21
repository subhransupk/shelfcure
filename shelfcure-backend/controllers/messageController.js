const ChatMessage = require('../models/ChatMessage');
const ChatSession = require('../models/ChatSession');
const User = require('../models/User');

// @desc    Get messages for a chat session
// @route   GET /api/chat/sessions/:sessionId/messages
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify session exists
    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    const skip = (page - 1) * limit;

    const messages = await ChatMessage.find({ sessionId })
      .populate('sender.senderId', 'name avatar')
      .populate('replyTo', 'content sender.senderName')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ChatMessage.countDocuments({ sessionId });

    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
};

// @desc    Send a message
// @route   POST /api/chat/sessions/:sessionId/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content, type = 'user', replyTo, attachments } = req.body;
    const user = req.user; // Assuming auth middleware sets this

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Verify session exists
    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    // Determine sender information
    let senderInfo = {
      senderName: 'Anonymous',
      senderRole: 'customer'
    };

    if (user) {
      senderInfo = {
        senderId: user._id,
        senderName: user.name,
        senderRole: user.role === 'superadmin' || user.role === 'admin' || user.role === 'manager' || user.role === 'staff' ? 'agent' : 'customer'
      };
    } else if (type === 'user' && session.customer) {
      senderInfo = {
        senderName: session.customer.name,
        senderRole: 'customer'
      };
    }

    // Create message
    const messageData = {
      sessionId,
      content: content.trim(),
      type,
      sender: senderInfo,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    if (replyTo) messageData.replyTo = replyTo;
    if (attachments && attachments.length > 0) messageData.attachments = attachments;

    const message = await ChatMessage.create(messageData);

    // Populate the message for response
    const populatedMessage = await ChatMessage.findById(message._id)
      .populate('sender.senderId', 'name avatar')
      .populate('replyTo', 'content sender.senderName');

    // Update session status if needed
    if (session.status === 'pending' && type === 'agent') {
      await ChatSession.findByIdAndUpdate(sessionId, { status: 'active' });
    }

    res.status(201).json({
      success: true,
      data: populatedMessage,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// @desc    Mark message as read
// @route   PUT /api/chat/messages/:messageId/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if already read by this user
    const alreadyRead = message.readBy.some(read => read.userId.toString() === user._id.toString());
    
    if (!alreadyRead) {
      message.readBy.push({
        userId: user._id,
        readAt: new Date()
      });
      
      // Update status if this is the first read
      if (message.status === 'delivered') {
        message.status = 'read';
        message.readAt = new Date();
      }
      
      await message.save();
    }

    res.status(200).json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking message as read',
      error: error.message
    });
  }
};

// @desc    Edit a message
// @route   PUT /api/chat/messages/:messageId
// @access  Private
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const user = req.user;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user can edit this message
    if (!user || (message.sender.senderId && message.sender.senderId.toString() !== user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this message'
      });
    }

    // Update message
    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const populatedMessage = await ChatMessage.findById(message._id)
      .populate('sender.senderId', 'name avatar')
      .populate('replyTo', 'content sender.senderName');

    res.status(200).json({
      success: true,
      data: populatedMessage,
      message: 'Message updated successfully'
    });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({
      success: false,
      message: 'Error editing message',
      error: error.message
    });
  }
};

// @desc    Delete a message
// @route   DELETE /api/chat/messages/:messageId
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const user = req.user;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user can delete this message (admin or message sender)
    const canDelete = user && (
      user.role === 'superadmin' || 
      user.role === 'admin' ||
      (message.sender.senderId && message.sender.senderId.toString() === user._id.toString())
    );

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    await ChatMessage.findByIdAndDelete(messageId);

    // Update session message count
    await ChatSession.findByIdAndUpdate(message.sessionId, {
      $inc: { messageCount: -1 }
    });

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message',
      error: error.message
    });
  }
};

// @desc    Add reaction to message
// @route   POST /api/chat/messages/:messageId/reactions
// @access  Private
exports.addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required'
      });
    }

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      reaction => reaction.userId.toString() === user._id.toString() && reaction.emoji === emoji
    );

    if (existingReaction) {
      // Remove existing reaction
      message.reactions = message.reactions.filter(
        reaction => !(reaction.userId.toString() === user._id.toString() && reaction.emoji === emoji)
      );
    } else {
      // Add new reaction
      message.reactions.push({
        emoji,
        userId: user._id,
        addedAt: new Date()
      });
    }

    await message.save();

    res.status(200).json({
      success: true,
      data: message.reactions,
      message: existingReaction ? 'Reaction removed' : 'Reaction added'
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding reaction',
      error: error.message
    });
  }
};

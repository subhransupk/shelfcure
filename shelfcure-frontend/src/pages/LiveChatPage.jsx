import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import {
  MessageCircle, Send, Phone, Mail, User, FileText,
  Clock, CheckCircle, AlertCircle, Minimize2, Maximize2,
  X, Paperclip, Smile, MoreVertical
} from 'lucide-react';

const LiveChatPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  
  // Determine user type from URL params or context
  const searchParams = new URLSearchParams(location.search);
  const userType = searchParams.get('type') || 'website'; // 'website' or 'store'
  const storeId = searchParams.get('storeId');
  
  // Chat states
  const [chatStage, setChatStage] = useState('form'); // 'form', 'waiting', 'connected', 'ended'
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('offline'); // 'offline', 'connecting', 'online'
  
  // Form states for website visitors
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    message: '',
    subject: 'General Inquiry'
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Chat session info
  const [chatSession, setChatSession] = useState({
    id: null,
    agent: null,
    startTime: null,
    waitTime: 0
  });
  const [socket, setSocket] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const subjects = [
    'General Inquiry',
    'Product Information',
    'Order Support',
    'Technical Issue',
    'Billing Question',
    'Store Partnership',
    'Complaint',
    'Other'
  ];

  // Initialize chat based on user type
  useEffect(() => {
    if (userType === 'store') {
      // Store users can directly start chatting
      setChatStage('waiting');
      initializeStoreChat();
    }
    // Website users need to fill form first
  }, [userType]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Socket.IO initialization
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('agent-assigned', (data) => {
      setChatSession(prev => ({
        ...prev,
        agent: data.agentInfo
      }));
      setMessages(prev => [...prev, data.systemMessage]);
      setChatStage('connected');
    });

    newSocket.on('user-typing', (data) => {
      if (data.senderInfo.senderRole === 'agent') {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    newSocket.on('chat-status-updated', (data) => {
      if (data.status === 'closed') {
        setChatStage('ended');
      }
      setMessages(prev => [...prev, data.systemMessage]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const initializeStoreChat = async () => {
    try {
      setConnectionStatus('connecting');
      setLoading(true);

      // Create chat session via API
      const response = await axios.post('/api/chat/sessions', {
        type: 'store',
        customer: {
          name: 'Store User',
          email: 'store@example.com',
          phone: '+1234567890'
        },
        subject: 'Store Support',
        storeId: storeId,
        initialMessage: 'Hello, I need help with my store.'
      });

      if (response.data.success) {
        const session = response.data.data;
        setSessionId(session._id);
        setChatSession({
          id: session._id,
          agent: session.agent,
          startTime: new Date(session.startTime),
          waitTime: 0
        });

        // Join socket room
        if (socket) {
          socket.emit('join-chat', session._id);
        }

        // Fetch initial messages
        const messagesResponse = await axios.get(`/api/chat/sessions/${session._id}/messages`);
        if (messagesResponse.data.success) {
          setMessages(messagesResponse.data.data);
        }

        setConnectionStatus('online');
        setChatStage('waiting');
      }

    } catch (error) {
      console.error('Failed to initialize store chat:', error);
      setConnectionStatus('offline');
      setError('Failed to start chat session');
    } finally {
      setLoading(false);
    }
  };

  const handleFormInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.mobile.trim()) {
      errors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobile.replace(/\D/g, ''))) {
      errors.mobile = 'Please enter a valid 10-digit mobile number';
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Please describe your inquiry';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      // Create chat session via API
      const response = await axios.post('/api/chat/sessions', {
        type: 'website',
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.mobile
        },
        subject: formData.subject,
        initialMessage: formData.message
      });

      if (response.data.success) {
        const session = response.data.data;
        setSessionId(session._id);
        setChatSession({
          id: session._id,
          agent: session.agent,
          startTime: new Date(session.startTime),
          waitTime: 0
        });

        // Join socket room
        if (socket) {
          socket.emit('join-chat', session._id);
        }

        // Fetch initial messages
        const messagesResponse = await axios.get(`/api/chat/sessions/${session._id}/messages`);
        if (messagesResponse.data.success) {
          setMessages(messagesResponse.data.data);
        }

        setChatStage('waiting');
        setConnectionStatus('online');
      }

    } catch (error) {
      console.error('Failed to submit form:', error);
      setError('Failed to start chat. Please try again.');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !sessionId) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      // Send message via Socket.IO for real-time delivery
      if (socket) {
        socket.emit('send-message', {
          sessionId,
          content: messageContent,
          type: 'user',
          senderInfo: {
            senderName: userType === 'store' ? 'Store User' : formData.name,
            senderRole: 'customer'
          }
        });
      }

      // Also send via API for persistence
      await axios.post(`/api/chat/sessions/${sessionId}/messages`, {
        content: messageContent,
        type: 'user'
      });

      // Emit typing indicator
      if (socket) {
        socket.emit('typing-start', {
          sessionId,
          senderInfo: {
            senderName: userType === 'store' ? 'Store User' : formData.name,
            senderRole: 'customer'
          }
        });

        setTimeout(() => {
          socket.emit('typing-stop', {
            sessionId,
            senderInfo: {
              senderName: userType === 'store' ? 'Store User' : formData.name,
              senderRole: 'customer'
            }
          });
        }, 1000);
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
    }
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'online': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'online': return 'Online';
      case 'connecting': return 'Connecting...';
      default: return 'Offline';
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-3 rounded-lg shadow-lg hover:bg-primary-700 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">ShelfCure Support</span>
          {messages.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {messages.filter(m => m.sender === 'agent' && m.unread).length || ''}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md h-[600px] flex flex-col">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4 rounded">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-500"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-primary-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6" />
            <div>
              <h3 className="font-semibold text-left">ShelfCure Support</h3>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
                <span>{getStatusText()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-primary-700 rounded"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate(-1)}
              className="p-1 hover:bg-primary-700 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {chatStage === 'form' && (
            /* Contact Form for Website Visitors */
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="text-center mb-6">
                <MessageCircle className="w-12 h-12 text-primary-600 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-gray-900 text-left">Start a Conversation</h4>
                <p className="text-sm text-gray-600 text-left">Fill out the form below to connect with our support team</p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormInputChange}
                      placeholder="Enter your full name"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        formErrors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {formErrors.name && (
                    <p className="mt-1 text-xs text-red-600 text-left">{formErrors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormInputChange}
                      placeholder="Enter your email address"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        formErrors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {formErrors.email && (
                    <p className="mt-1 text-xs text-red-600 text-left">{formErrors.email}</p>
                  )}
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleFormInputChange}
                      placeholder="Enter your mobile number"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        formErrors.mobile ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {formErrors.mobile && (
                    <p className="mt-1 text-xs text-red-600 text-left">{formErrors.mobile}</p>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Subject
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleFormInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Message *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleFormInputChange}
                      rows={3}
                      placeholder="Describe your inquiry or issue..."
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
                        formErrors.message ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {formErrors.message && (
                    <p className="mt-1 text-xs text-red-600 text-left">{formErrors.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <MessageCircle className="w-4 h-4" />
                  )}
                  {isSubmitting ? 'Starting Chat...' : 'Start Chat'}
                </button>
              </form>
            </div>
          )}

          {(chatStage === 'waiting' || chatStage === 'connected') && (
            /* Chat Interface */
            <>
              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-primary-600 text-white'
                          : message.sender === 'system'
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}>
                        {message.sender === 'agent' && (
                          <div className="text-xs font-medium text-gray-600 mb-1 text-left">
                            {message.senderName}
                          </div>
                        )}
                        <div className="text-sm text-left">{message.content}</div>
                        <div className={`text-xs mt-1 ${
                          message.sender === 'user' ? 'text-primary-200' : 'text-gray-500'
                        } text-right`}>
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg">
                        <div className="flex items-center gap-1">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-xs text-gray-500 ml-2">Agent is typing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {chatStage === 'connected' && (
                <div className="p-4 border-t border-gray-200 bg-white">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <Smile className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {chatStage === 'waiting' && (
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Waiting for an available agent...</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveChatPage;

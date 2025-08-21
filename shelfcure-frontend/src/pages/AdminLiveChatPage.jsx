import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import axios from 'axios';
import io from 'socket.io-client';
import {
  MessageCircle, Users, Clock, CheckCircle, XCircle,
  Search, Filter, Eye, MessageSquare, Phone, Mail,
  Calendar, TrendingUp, AlertTriangle, User, Zap
} from 'lucide-react';

const AdminLiveChatPage = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('active'); // 'active', 'pending', 'closed', 'analytics'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  
  // Real data for chat sessions
  const [chatSessions, setChatSessions] = useState([]);
  const [onlineAgents, setOnlineAgents] = useState([]);
  // Real analytics data
  const [analytics, setAnalytics] = useState({
    today: {
      totalChats: 0,
      activeChats: 0,
      pendingChats: 0,
      closedChats: 0,
      averageWaitTime: 0,
      averageResponseTime: 0,
      customerSatisfaction: 0,
      agentsOnline: 0
    },
    thisWeek: {
      totalChats: 0,
      averageWaitTime: 0,
      averageResponseTime: 0,
      customerSatisfaction: 0,
      resolutionRate: 0
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    return type === 'store' ? <User className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />;
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  // API Functions
  const fetchChatSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (dateFilter !== 'all') params.append('period', dateFilter);

      const response = await axios.get(`/api/chat/sessions?${params.toString()}`);

      if (response.data.success) {
        setChatSessions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      setError('Failed to load chat sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const [todayResponse, weekResponse] = await Promise.all([
        axios.get('/api/chat/analytics?period=today'),
        axios.get('/api/chat/analytics?period=week')
      ]);

      if (todayResponse.data.success && weekResponse.data.success) {
        setAnalytics({
          today: todayResponse.data.data,
          thisWeek: weekResponse.data.data
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchOnlineAgents = async () => {
    try {
      const response = await axios.get('/api/chat/agents/online');
      if (response.data.success) {
        setOnlineAgents(response.data.data);
        setAnalytics(prev => ({
          ...prev,
          today: {
            ...prev.today,
            agentsOnline: response.data.count
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching online agents:', error);
    }
  };

  const assignAgent = async (sessionId, agentId) => {
    try {
      const response = await axios.put(`/api/chat/sessions/${sessionId}/assign`, {
        agentId
      });

      if (response.data.success) {
        // Update local state
        setChatSessions(prev => prev.map(session =>
          session._id === sessionId
            ? { ...session, ...response.data.data }
            : session
        ));

        // Emit socket event for real-time updates
        if (socket) {
          const agent = onlineAgents.find(a => a._id === agentId);
          socket.emit('assign-agent', {
            sessionId,
            agentId,
            agentInfo: agent
          });
        }
      }
    } catch (error) {
      console.error('Error assigning agent:', error);
      setError('Failed to assign agent');
    }
  };

  // Socket.IO initialization and event handlers
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Join admin dashboard room
    newSocket.emit('join-admin-dashboard');

    // Listen for real-time chat updates
    newSocket.on('chat-message-received', (data) => {
      setChatSessions(prev => prev.map(session =>
        session._id === data.sessionId
          ? {
              ...session,
              lastActivity: new Date(),
              messageCount: session.messageCount + 1
            }
          : session
      ));
    });

    newSocket.on('chat-session-updated', (data) => {
      setChatSessions(prev => prev.map(session =>
        session._id === data.sessionId
          ? { ...session, ...data }
          : session
      ));
    });

    newSocket.on('agent-status-changed', (data) => {
      setOnlineAgents(prev => {
        if (data.status === 'online') {
          return prev.some(agent => agent._id === data.agentId)
            ? prev
            : [...prev, { _id: data.agentId, status: 'online' }];
        } else {
          return prev.filter(agent => agent._id !== data.agentId);
        }
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchChatSessions();
    fetchAnalytics();
    fetchOnlineAgents();
  }, [statusFilter, searchQuery, dateFilter]);

  const formatDuration = (startTime, endTime = new Date()) => {
    const duration = Math.floor((endTime - startTime) / (1000 * 60)); // minutes
    if (duration < 60) {
      return `${duration}m`;
    }
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  const filteredSessions = chatSessions.filter(session => {
    const matchesTab = activeTab === 'all' || session.status === activeTab;
    const matchesSearch = session.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.sessionId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;

    return matchesTab && matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <AdminLayout
        title="Live Chat Management"
        subtitle="Manage customer support conversations and chat analytics"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout
        title="Live Chat Management"
        subtitle="Manage customer support conversations and chat analytics"
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  fetchChatSessions();
                }}
                className="mt-2 text-sm text-red-600 hover:text-red-500"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Live Chat Management"
      subtitle="Manage customer support conversations and chat analytics"
    >
      <div className="space-y-6">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Active Chats</p>
                <p className="text-2xl font-bold text-green-600">{analytics.today.activeChats}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+12% from yesterday</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Pending Chats</p>
                <p className="text-2xl font-bold text-yellow-600">{analytics.today.pendingChats}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <AlertTriangle className="w-4 h-4 mr-1" />
              <span>Avg wait: {analytics.today.averageWaitTime}m</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Today's Chats</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.today.totalChats}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span>{analytics.today.closedChats} resolved</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.today.customerSatisfaction}/5</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <Users className="w-4 h-4 mr-1" />
              <span>{analytics.today.agentsOnline} agents online</span>
            </div>
          </div>
        </div>

        {/* Tabs and Filters */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <div className="flex items-center justify-between p-6">
              <div className="flex space-x-8">
                {[
                  { key: 'active', label: 'Active Chats', count: analytics.today.activeChats },
                  { key: 'pending', label: 'Pending', count: analytics.today.pendingChats },
                  { key: 'closed', label: 'Closed', count: analytics.today.closedChats },
                  { key: 'analytics', label: 'Analytics', count: null }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 pb-4 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.key
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== null && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        activeTab === tab.key ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {activeTab !== 'analytics' && (
                <div className="flex items-center gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search chats..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="closed">Closed</option>
                  </select>

                  {/* Date Filter */}
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Chat Sessions Table */}
          {activeTab !== 'analytics' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chat Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent & Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration & Messages
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded ${session.type === 'store' ? 'bg-blue-100' : 'bg-green-100'}`}>
                              {getTypeIcon(session.type)}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{session.id}</div>
                              <div className="text-sm text-gray-500">{session.subject}</div>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(session.priority)}`}>
                              {session.priority}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                              {session.status}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-left">
                          <div className="text-sm font-medium text-gray-900">{session.customer.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {session.customer.email}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {session.customer.mobile}
                          </div>
                          {session.customer.storeId && (
                            <div className="text-xs text-blue-600 mt-1">
                              Store: {session.customer.storeId}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-left">
                          {session.agent?.agentName ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">{session.agent.agentName}</div>
                              <div className="text-sm text-gray-500">
                                Assigned: {session.agent.assignedAt ? formatTime(new Date(session.agent.assignedAt)) : 'N/A'}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-yellow-600 font-medium">Waiting for agent</div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            Wait time: {session.waitTime || 0}m
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-left">
                          <div className="text-sm text-gray-900">
                            {formatDuration(session.startTime, session.endTime)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {session.messageCount} messages
                          </div>
                          <div className="text-xs text-gray-500">
                            Started: {formatTime(session.startTime)}
                          </div>
                          {session.rating && (
                            <div className="text-xs text-yellow-600 mt-1">
                              ⭐ {session.rating}/5
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/admin/live-chat/${session._id}`)}
                            className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50"
                            title="View Chat"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {session.status === 'pending' && onlineAgents.length > 0 && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  assignAgent(session._id, e.target.value);
                                }
                              }}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                              defaultValue=""
                            >
                              <option value="">Assign Agent</option>
                              {onlineAgents.map(agent => (
                                <option key={agent._id} value={agent._id}>
                                  {agent.name}
                                </option>
                              ))}
                            </select>
                          )}
                          {session.status === 'active' && (
                            <button
                              onClick={() => navigate(`/admin/live-chat/${session._id}`)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title="Join Chat"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredSessions.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No chat sessions found</h3>
                  <p className="text-gray-500">
                    {searchQuery ? 'Try adjusting your search criteria' : 'No chat sessions match the current filters'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Analytics Section */}
          {activeTab === 'analytics' && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Response Time Chart */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 text-left">Response Time Trends</h4>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                      <p>Chart visualization would go here</p>
                      <p className="text-sm">Average response time: {analytics.today.averageResponseTime}m</p>
                    </div>
                  </div>
                </div>

                {/* Customer Satisfaction */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 text-left">Customer Satisfaction</h4>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Zap className="w-12 h-12 mx-auto mb-2" />
                      <p>Satisfaction chart would go here</p>
                      <p className="text-sm">Current rating: {analytics.today.customerSatisfaction}/5</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 text-left">Weekly Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{analytics.thisWeek.totalChats}</div>
                    <div className="text-sm text-gray-600">Total Chats</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{analytics.thisWeek.averageWaitTime}m</div>
                    <div className="text-sm text-gray-600">Avg Wait Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{analytics.thisWeek.averageResponseTime}m</div>
                    <div className="text-sm text-gray-600">Avg Response</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{analytics.thisWeek.customerSatisfaction}/5</div>
                    <div className="text-sm text-gray-600">Satisfaction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{analytics.thisWeek.resolutionRate}%</div>
                    <div className="text-sm text-gray-600">Resolution Rate</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminLiveChatPage;

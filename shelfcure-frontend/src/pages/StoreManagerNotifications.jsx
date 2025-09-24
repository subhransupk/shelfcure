import React, { useState, useEffect } from 'react';
import {
  Bell,
  MessageSquare,
  Mail,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Calendar,
  Users,
  Settings,
  Send,
  Globe,
  Filter,
  Search,
  Eye,
  MoreVertical,
  ExternalLink,
  Trash2,
  Wifi,
  WifiOff
} from 'lucide-react';
import StoreManagerLayout from '../components/store-manager/StoreManagerLayout';
import webSocketClient from '../utils/WebSocketClient';

const StoreManagerNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'whatsapp', 'settings', 'compose'
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  // WebSocket connection state
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState('');

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      lowStock: true,
      expiryAlerts: true,
      customerMessages: true,
      systemUpdates: false,
      paymentReminders: true
    },
    whatsapp: {
      lowStock: false,
      expiryAlerts: true,
      customerMessages: true,
      systemUpdates: false,
      paymentReminders: false
    },

    push: {
      lowStock: true,
      expiryAlerts: true,
      customerMessages: true,
      systemUpdates: true,
      paymentReminders: true
    },
    preferences: {
      quietHours: {
        enabled: true,
        startTime: '22:00',
        endTime: '08:00'
      },
      frequency: 'immediate', // immediate, hourly, daily
      priority: 'medium' // low, medium, high
    }
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // WhatsApp Integration State
  const [whatsappMethod, setWhatsappMethod] = useState('click-to-chat'); // 'click-to-chat', 'web-api', 'business-api'
  const [whatsappSettings, setWhatsappSettings] = useState({
    phoneNumber: '',
    businessApiToken: '',
    webApiSession: false
  });

  // WhatsApp Templates State
  const [whatsappTemplates, setWhatsappTemplates] = useState({
    lowStock: {
      name: 'Low Stock Alert',
      message: "Hi! We noticed you recently purchased [Medicine Name]. We're running low on stock. Would you like to place an order?"
    },
    paymentReminder: {
      name: 'Payment Reminder',
      message: "Hello! This is a friendly reminder about your pending payment of ₹[Amount] for invoice #[Number]. Please let us know if you need any assistance."
    },
    orderReady: {
      name: 'Order Ready',
      message: "Good news! Your order #[OrderNumber] is ready for pickup. Our store is open from 9 AM to 9 PM. Thank you for choosing us!"
    },
    medicineReminder: {
      name: 'Medicine Reminder',
      message: "Hi! Time for your medication reminder. Don't forget to take your [Medicine Name] as prescribed. Stay healthy!"
    }
  });
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Compose Message State
  const [composeData, setComposeData] = useState({
    type: 'whatsapp',
    recipients: [],
    message: '',
    scheduled: false,
    scheduledTime: ''
  });

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeWebSocket = () => {
      try {
        setWsError('');

        // Connect to WebSocket
        const socket = webSocketClient.connect('http://localhost:5000');

        if (socket) {
          // Listen for connection status
          webSocketClient.on('connection-status', (status) => {
            setWsConnected(status.connected);
            if (!status.connected) {
              setWsError(status.reason || 'Connection lost');
            } else {
              setWsError(''); // Clear error when connected
            }
          });

          // Listen for connection errors
          webSocketClient.on('connection-error', (data) => {
            setWsError(`Connection failed (attempt ${data.attempts})`);
            setWsConnected(false);
          });

          // Listen for reconnection
          webSocketClient.on('reconnected', () => {
            setWsError('');
            setWsConnected(true);
            // Rejoin store room after reconnection
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const token = localStorage.getItem('token');
            if (user && token) {
              // Try to get store info from token or make a quick API call
              setTimeout(() => {
                webSocketClient.joinStore('default-store'); // Fallback for now
              }, 1000);
            }
          });

          // Listen for new notifications
          webSocketClient.on('new-notification', (notification) => {
            setNotifications(prev => [notification, ...prev]);
          });

          // Join store room for notifications
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const token = localStorage.getItem('token');

          if (user && token) {
            // Get store ID from user or make API call to get it
            if (user.storeId) {
              webSocketClient.joinStore(user.storeId);
            } else {
              // Make API call to get store info
              fetch('/api/store-manager/profile', {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              })
              .then(response => response.json())
              .then(data => {
                if (data.success && data.data.storeId) {
                  webSocketClient.joinStore(data.data.storeId);
                }
              })
              .catch(error => {
                console.error('Error getting store info:', error);
                // Fallback - try to join with a default store
                webSocketClient.joinStore('default-store');
              });
            }
          }
        }
      } catch (error) {
        console.error('WebSocket initialization error:', error);
        setWsError('Failed to initialize WebSocket connection');
        setWsConnected(false);
      }
    };

    initializeWebSocket();
    fetchNotifications();
    loadNotificationSettings();

    // Cleanup on unmount
    return () => {
      webSocketClient.off('connection-status');
      webSocketClient.off('connection-error');
      webSocketClient.off('reconnected');
      webSocketClient.off('new-notification');
      webSocketClient.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [filterType, searchTerm]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        ...(filterType && { type: filterType }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/store-manager/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setNotifications(data.data || []);
    } catch (error) {
      console.error('Notifications fetch error:', error);
      setError(error.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Load notification settings
  const loadNotificationSettings = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) return;

      const response = await fetch('/api/store-manager/notification-settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotificationSettings(data.data);
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  // Notification settings functions
  const handleSettingChange = (category, setting, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const handlePreferenceChange = (preference, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [preference]: value
      }
    }));
  };

  const handleQuietHoursChange = (field, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        quietHours: {
          ...prev.preferences.quietHours,
          [field]: value
        }
      }
    }));
  };

  const saveNotificationSettings = async () => {
    try {
      setSettingsLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/store-manager/notification-settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationSettings)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      setError('Failed to save notification settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'low_stock': Package,
      'expiry_alert': AlertTriangle,
      'payment_reminder': Clock,
      'customer_message': Users,
      'system': Settings,
      'whatsapp': MessageSquare,
      'email': Mail,

    };
    const IconComponent = icons[type] || Bell;
    return <IconComponent className="h-5 w-5" />;
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'high') return 'text-red-600 bg-red-100';
    if (priority === 'medium') return 'text-yellow-600 bg-yellow-100';
    
    const colors = {
      'low_stock': 'text-orange-600 bg-orange-100',
      'expiry_alert': 'text-red-600 bg-red-100',
      'payment_reminder': 'text-blue-600 bg-blue-100',
      'customer_message': 'text-green-600 bg-green-100',
      'system': 'text-purple-600 bg-purple-100',
      'whatsapp': 'text-green-600 bg-green-100',
      'email': 'text-blue-600 bg-blue-100',

    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  };

  const markAsRead = async (notificationIds) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/store-manager/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationIds })
      });

      if (response.ok) {
        // Update local state immediately for better UX
        setNotifications(prev =>
          prev.map(notification =>
            notificationIds.includes(notification._id)
              ? { ...notification, isRead: true }
              : notification
          )
        );
        setSelectedNotifications([]);
        console.log('✅ Notifications marked as read');
      } else {
        console.error('Failed to mark notifications as read');
        // Fallback to refetch
        fetchNotifications();
      }
    } catch (error) {
      console.error('Mark as read error:', error);
      // Fallback to refetch
      fetchNotifications();
    }
  };

  // Handle notification action (navigate to action URL)
  const handleNotificationAction = (notification) => {
    if (notification.actionUrl) {
      // Mark as read first if not already read
      if (!notification.isRead) {
        markAsRead([notification._id]);
      }

      // Navigate to action URL
      window.location.href = notification.actionUrl;
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedNotifications.length === 0) {
      alert('Please select notifications first');
      return;
    }

    switch (action) {
      case 'mark-read':
        await markAsRead(selectedNotifications);
        break;
      case 'delete':
        await deleteNotifications(selectedNotifications);
        break;
      default:
        console.log('Unknown bulk action:', action);
    }
  };

  // Delete notifications (placeholder - would need backend route)
  const deleteNotifications = async (notificationIds) => {
    try {
      // For now, just remove from local state
      setNotifications(prev =>
        prev.filter(notification => !notificationIds.includes(notification._id))
      );
      setSelectedNotifications([]);
      console.log('✅ Notifications removed from view');
    } catch (error) {
      console.error('Delete notifications error:', error);
    }
  };

  // Generate test notifications
  const generateTestNotifications = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/store-manager/notifications/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ Notification generation triggered');
        // Refresh notifications after a short delay
        setTimeout(() => {
          fetchNotifications();
        }, 2000);
      } else {
        console.error('Failed to generate notifications');
      }
    } catch (error) {
      console.error('Generate notifications error:', error);
    }
  };

  // WhatsApp Template Functions
  const handleTemplateEdit = (templateKey) => {
    setEditingTemplate(templateKey);
  };

  const handleTemplateSave = (templateKey) => {
    setEditingTemplate(null);
    // Here you could save to backend
    console.log('✅ Template saved:', templateKey, whatsappTemplates[templateKey]);
  };

  const handleTemplateCancel = () => {
    setEditingTemplate(null);
  };

  const handleTemplateChange = (templateKey, field, value) => {
    setWhatsappTemplates(prev => ({
      ...prev,
      [templateKey]: {
        ...prev[templateKey],
        [field]: value
      }
    }));
  };

  const handleUseTemplate = (templateKey) => {
    const template = whatsappTemplates[templateKey];
    // Copy template message to compose tab
    setComposeData(prev => ({
      ...prev,
      message: template.message,
      type: 'whatsapp'
    }));
    // Switch to compose tab
    setActiveTab('compose');
  };

  // Compose Message Functions
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!composeData.message.trim()) {
      alert('Please enter a message');
      return;
    }

    if (composeData.recipients.length === 0) {
      alert('Please select recipients');
      return;
    }

    try {
      if (composeData.type === 'whatsapp') {
        await handleSendWhatsAppMessage();
      } else if (composeData.type === 'email') {
        await handleSendEmailMessage();
      }
    } catch (error) {
      console.error('Send message error:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleSendWhatsAppMessage = async () => {
    // For WhatsApp, we'll generate click-to-chat links
    const phoneNumber = whatsappSettings.phoneNumber.replace(/[^0-9]/g, '');

    if (!phoneNumber) {
      alert('Please configure your WhatsApp phone number in the WhatsApp Integration tab first.');
      return;
    }

    // Generate WhatsApp links for each recipient
    const whatsappLinks = composeData.recipients.map(recipient => {
      const encodedMessage = encodeURIComponent(composeData.message);
      return {
        recipient,
        link: `https://wa.me/${phoneNumber}?text=${encodedMessage}`,
        message: composeData.message
      };
    });

    // For now, we'll show the links to the user
    // In a real implementation, you might want to save these or integrate with a WhatsApp API
    console.log('WhatsApp Links Generated:', whatsappLinks);

    // Show success message with links
    const linksList = whatsappLinks.map(item =>
      `${item.recipient}: ${item.link}`
    ).join('\n\n');

    alert(`WhatsApp links generated successfully!\n\n${linksList}\n\nClick these links to send messages via WhatsApp.`);

    // Reset form
    setComposeData({
      type: 'whatsapp',
      recipients: [],
      message: '',
      scheduled: false,
      scheduledTime: ''
    });
  };

  const handleSendEmailMessage = async () => {
    // Email sending logic would go here
    console.log('Sending email:', composeData);
    alert('Email functionality would be implemented here with your email service provider.');

    // Reset form
    setComposeData({
      type: 'email',
      recipients: [],
      message: '',
      scheduled: false,
      scheduledTime: ''
    });
  };

  const handleSaveDraft = () => {
    // Save draft logic
    console.log('Saving draft:', composeData);
    alert('Draft saved successfully!');
  };

  const sendWhatsAppMessage = async (phoneNumber, message) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/store-manager/whatsapp/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          method: whatsappMethod,
          phoneNumber,
          message
        })
      });

      if (response.ok) {
        // Success feedback
        setComposeData({ type: 'whatsapp', recipients: [], message: '', scheduled: false, scheduledTime: '' });
      }
    } catch (error) {
      console.error('WhatsApp send error:', error);
    }
  };

  const renderNotificationsList = () => (
    <div>
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-semibold text-gray-900 text-left">Notifications & Alerts</h1>
            {/* WebSocket Connection Status */}
            <div className="flex items-center space-x-2">
              {wsConnected ? (
                <div className="flex items-center text-green-600">
                  <Wifi className="h-4 w-4" />
                  <span className="text-xs ml-1">Connected</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-xs ml-1">Disconnected</span>
                </div>
              )}
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-700 text-left">
            Manage system notifications, alerts, and communication preferences.
          </p>
          {wsError && (
            <p className="mt-1 text-xs text-red-600">
              WebSocket: {wsError}
            </p>
          )}
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setActiveTab('compose')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Send className="h-4 w-4 mr-2" />
            Compose Message
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unread Alerts</p>
              <p className="text-2xl font-bold text-red-600">5</p>
              <p className="text-xs text-red-600">Requires attention</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">WhatsApp Messages</p>
              <p className="text-2xl font-bold text-green-600">23</p>
              <p className="text-xs text-green-600">Today</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-orange-600">8</p>
              <p className="text-xs text-orange-600">Need reorder</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full">
              <Package className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-yellow-600">12</p>
              <p className="text-xs text-yellow-600">Next 30 days</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
          >
            <MessageSquare className="h-5 w-5" />
            <span>WhatsApp Integration</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
          >
            <Settings className="h-5 w-5" />
            <span>Notification Settings</span>
          </button>
          <button
            onClick={generateTestNotifications}
            className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"
          >
            <Bell className="h-5 w-5" />
            <span>Generate Alerts</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Types</option>
              <option value="low_stock">Low Stock</option>
              <option value="expiry_alert">Expiry Alerts</option>
              <option value="payment_reminder">Payment Reminders</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="system">System</option>
            </select>
          </div>

          <div>
            <button
              onClick={() => handleBulkAction('mark-read')}
              disabled={selectedNotifications.length === 0}
              className="w-full px-4 py-2 border border-green-600 rounded-md text-sm font-medium text-green-600 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              Mark as Read ({selectedNotifications.length})
            </button>
          </div>

          <div>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('');
                setSelectedNotifications([]);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="divide-y divide-gray-200">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div key={notification._id} className={`p-6 hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedNotifications([...selectedNotifications, notification._id]);
                        } else {
                          setSelectedNotifications(selectedNotifications.filter(id => id !== notification._id));
                        }
                      }}
                      className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <div className={`flex-shrink-0 p-2 rounded-full ${getNotificationColor(notification.type, notification.priority)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 text-left">
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {!notification.isRead && (
                            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 text-left">
                        {notification.message}
                      </p>
                      {notification.actionRequired && (
                        <div className="mt-2 flex items-center space-x-2">
                          <button
                            onClick={() => handleNotificationAction(notification)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                          >
                            Take Action
                          </button>
                          {notification.type === 'whatsapp' && (
                            <button className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Open WhatsApp
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead([notification._id])}
                        className="text-gray-400 hover:text-green-600"
                        title="Mark as read"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      className="text-gray-400 hover:text-gray-600"
                      title="More options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No notifications found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderWhatsAppTab = () => (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 text-left">WhatsApp Integration</h1>
          <p className="mt-2 text-sm text-gray-700 text-left">
            Configure WhatsApp messaging options for customer communication.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setActiveTab('all')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Notifications
          </button>
        </div>
      </div>

      {/* WhatsApp Method */}
      <div className="mb-6">
        {/* Click-to-Chat */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-500">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900">Click-to-Chat</h3>
              <p className="text-sm text-green-600">Simple & Effective</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            No setup required. Generate WhatsApp links that open customer's WhatsApp with pre-filled messages.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center text-xs text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              No API setup required
            </div>
            <div className="flex items-center text-xs text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Works immediately
            </div>
            <div className="flex items-center text-xs text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Cross-platform compatible
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Configuration */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Configuration</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Store Phone Number</label>
            <input
              type="tel"
              placeholder="+91 9876543210"
              value={whatsappSettings.phoneNumber}
              onChange={(e) => setWhatsappSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Include country code (e.g., +91 for India)
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-800 mb-2">Preview WhatsApp Link:</h4>
            <code className="text-xs text-green-700 bg-white p-2 rounded border block">
              https://wa.me/{whatsappSettings.phoneNumber.replace(/[^0-9]/g, '')}?text=Hello%20from%20ShelfCure%20Store
            </code>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
            Save Configuration
          </button>
        </div>
      </div>

      {/* WhatsApp Templates */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 text-left">Message Templates</h3>
          <p className="text-sm text-gray-500">Click Edit to customize templates</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(whatsappTemplates).map(([templateKey, template]) => (
            <div key={templateKey} className="border border-gray-200 rounded-lg p-4">
              {editingTemplate === templateKey ? (
                // Edit Mode
                <div className="space-y-3">
                  <input
                    type="text"
                    value={template.name}
                    onChange={(e) => handleTemplateChange(templateKey, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <textarea
                    value={template.message}
                    onChange={(e) => handleTemplateChange(templateKey, 'message', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter your template message..."
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTemplateSave(templateKey)}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleTemplateCancel}
                      className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
                  <p className="text-sm text-gray-600 mb-3 min-h-[60px]">
                    "{template.message}"
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUseTemplate(templateKey)}
                      className="text-green-600 text-sm hover:text-green-700 font-medium"
                    >
                      Use Template
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => handleTemplateEdit(templateKey)}
                      className="text-blue-600 text-sm hover:text-blue-700"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Template Variables:</strong> Use [Medicine Name], [Amount], [OrderNumber], [Customer Name] etc. in your templates.
            These will be automatically replaced with actual values when sending messages.
          </p>
        </div>
      </div>
    </div>
  );

  const renderComposeTab = () => (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 text-left">Compose Message</h1>
          <p className="mt-2 text-sm text-gray-700 text-left">
            Send messages to customers via WhatsApp or email.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setActiveTab('all')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Notifications
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSendMessage} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Message Type</label>
              <select
                value={composeData.type}
                onChange={(e) => setComposeData(prev => ({ ...prev, type: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="whatsapp">WhatsApp</option>

                <option value="email">Email</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Recipients</label>
              <select
                multiple
                value={composeData.recipients}
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                  setComposeData(prev => ({ ...prev, recipients: selectedOptions }));
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="all_customers">All Customers</option>
                <option value="recent_customers">Recent Customers</option>
                <option value="credit_customers">Credit Customers</option>
                <option value="vip_customers">VIP Customers</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Hold Ctrl/Cmd to select multiple. Selected: {composeData.recipients.length}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              rows={6}
              value={composeData.message}
              onChange={(e) => setComposeData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Type your message here..."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
            <p className="mt-1 text-xs text-gray-500">{composeData.message.length} characters</p>

            {composeData.type === 'whatsapp' && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <MessageSquare className="h-4 w-4 text-green-600 mt-0.5 mr-2" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium">WhatsApp Click-to-Chat</p>
                    <p className="mt-1">
                      This will generate WhatsApp links that open the customer's WhatsApp with your message pre-filled.
                      {!whatsappSettings.phoneNumber && (
                        <span className="text-red-600 font-medium"> Please configure your phone number in WhatsApp Integration first.</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={composeData.scheduled}
              onChange={(e) => setComposeData(prev => ({ ...prev, scheduled: e.target.checked }))}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Schedule for later</label>
          </div>

          {composeData.scheduled && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Schedule Time</label>
              <input
                type="datetime-local"
                value={composeData.scheduledTime}
                onChange={(e) => setComposeData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              {composeData.scheduled ? 'Schedule Message' : (composeData.type === 'whatsapp' ? 'Generate WhatsApp Links' : 'Send Message')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading && notifications.length === 0) {
    return (
      <StoreManagerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </StoreManagerLayout>
    );
  }

  return (
    <StoreManagerLayout>
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('all')}
                className={`${
                  activeTab === 'all'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                All Notifications
              </button>
              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`${
                  activeTab === 'whatsapp'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                WhatsApp Integration
              </button>
              <button
                onClick={() => setActiveTab('compose')}
                className={`${
                  activeTab === 'compose'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Compose Message
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`${
                  activeTab === 'settings'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                Settings
              </button>
            </nav>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'all' && renderNotificationsList()}
          {activeTab === 'whatsapp' && renderWhatsAppTab()}
          {activeTab === 'compose' && renderComposeTab()}
          {activeTab === 'settings' && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-gray-900">Notification Settings</h2>
                <button
                  onClick={saveNotificationSettings}
                  disabled={settingsLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {settingsLoading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>

              <div className="space-y-8">
                {/* Email Notifications */}
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center">
                    <Mail className="h-5 w-5 mr-2 text-blue-500" />
                    Email Notifications
                  </h3>
                  <div className="space-y-3">
                    {Object.entries({
                      lowStock: 'Low Stock Alerts',
                      expiryAlerts: 'Medicine Expiry Alerts',
                      customerMessages: 'Customer Messages',
                      systemUpdates: 'System Updates',
                      paymentReminders: 'Payment Reminders'
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{label}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notificationSettings.email[key]}
                            onChange={(e) => handleSettingChange('email', key, e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* WhatsApp Notifications */}
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-green-500" />
                    WhatsApp Notifications
                  </h3>
                  <div className="space-y-3">
                    {Object.entries({
                      lowStock: 'Low Stock Alerts',
                      expiryAlerts: 'Medicine Expiry Alerts',
                      customerMessages: 'Customer Messages',
                      systemUpdates: 'System Updates',
                      paymentReminders: 'Payment Reminders'
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{label}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notificationSettings.whatsapp[key]}
                            onChange={(e) => handleSettingChange('whatsapp', key, e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>



                {/* Push Notifications */}
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center">
                    <Bell className="h-5 w-5 mr-2 text-orange-500" />
                    Push Notifications
                  </h3>
                  <div className="space-y-3">
                    {Object.entries({
                      lowStock: 'Low Stock Alerts',
                      expiryAlerts: 'Medicine Expiry Alerts',
                      customerMessages: 'Customer Messages',
                      systemUpdates: 'System Updates',
                      paymentReminders: 'Payment Reminders'
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{label}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notificationSettings.push[key]}
                            onChange={(e) => handleSettingChange('push', key, e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className="border-t pt-6">
                  <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-gray-500" />
                    Notification Preferences
                  </h3>

                  <div className="space-y-6">
                    {/* Quiet Hours */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Quiet Hours</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notificationSettings.preferences.quietHours.enabled}
                            onChange={(e) => handleQuietHoursChange('enabled', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                      {notificationSettings.preferences.quietHours.enabled && (
                        <div className="flex space-x-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">From</label>
                            <input
                              type="time"
                              value={notificationSettings.preferences.quietHours.startTime}
                              onChange={(e) => handleQuietHoursChange('startTime', e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">To</label>
                            <input
                              type="time"
                              value={notificationSettings.preferences.quietHours.endTime}
                              onChange={(e) => handleQuietHoursChange('endTime', e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notification Frequency */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notification Frequency</label>
                      <select
                        value={notificationSettings.preferences.frequency}
                        onChange={(e) => handlePreferenceChange('frequency', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      >
                        <option value="immediate">Immediate</option>
                        <option value="hourly">Hourly Summary</option>
                        <option value="daily">Daily Summary</option>
                      </select>
                    </div>

                    {/* Priority Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Priority Level</label>
                      <select
                        value={notificationSettings.preferences.priority}
                        onChange={(e) => handlePreferenceChange('priority', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      >
                        <option value="low">All Notifications (Low, Medium, High)</option>
                        <option value="medium">Medium and High Priority Only</option>
                        <option value="high">High Priority Only</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </StoreManagerLayout>
  );
};

export default StoreManagerNotifications;

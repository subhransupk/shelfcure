import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  RotateCcw,
  TrendingUp
} from 'lucide-react';

const ReturnNotifications = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReturnNotifications();
  }, []);

  const fetchReturnNotifications = async () => {
    try {
      setLoading(true);
      
      // Fetch recent returns that need attention
      const response = await fetch('/api/store-manager/returns?status=pending&limit=5', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const returnNotifications = data.data.map(returnRecord => ({
          id: returnRecord._id,
          type: 'return_pending',
          title: 'Return Pending Processing',
          message: `Return #${returnRecord.returnNumber} requires attention`,
          timestamp: returnRecord.createdAt,
          priority: 'medium',
          data: returnRecord
        }));

        // Fetch return analytics for high return rate alerts
        const analyticsResponse = await fetch('/api/store-manager/returns/analytics?period=7', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        let analyticsNotifications = [];
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          if (analyticsData.success && analyticsData.data.summary.returnRate > 10) {
            analyticsNotifications.push({
              id: 'high_return_rate',
              type: 'high_return_rate',
              title: 'High Return Rate Alert',
              message: `Return rate is ${analyticsData.data.summary.returnRate}% (above 10% threshold)`,
              timestamp: new Date().toISOString(),
              priority: 'high',
              data: analyticsData.data.summary
            });
          }
        }

        setNotifications([...returnNotifications, ...analyticsNotifications]);
      }
    } catch (error) {
      console.error('Failed to fetch return notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'return_pending':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'return_completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'high_return_rate':
        return <TrendingUp className="h-5 w-5 text-red-500" />;
      case 'inventory_restored':
        return <RotateCcw className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-orange-500 bg-orange-50';
      case 'low':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const dismissNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-center text-gray-500 mt-2">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Return Notifications</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No return notifications</p>
              <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} hover:bg-gray-50 transition-colors`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setNotifications([])}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear all notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnNotifications;

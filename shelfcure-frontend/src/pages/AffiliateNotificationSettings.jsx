import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AffiliatePanelLayout from '../components/AffiliatePanelLayout';
import api from '../utils/api';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Save,
  Volume2,
  VolumeX,
  Clock,
  DollarSign,
  Users,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const AffiliateNotificationSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [settings, setSettings] = useState({
    channels: {
      email: true,
      whatsapp: true,
      sms: false,
      push: true
    },
    notifications: {
      newSale: {
        enabled: true,
        channels: ['email', 'whatsapp']
      },
      commissionCredited: {
        enabled: true,
        channels: ['email', 'whatsapp', 'push']
      },
      payoutReleased: {
        enabled: true,
        channels: ['email', 'whatsapp', 'sms']
      },
      promotionalUpdate: {
        enabled: true,
        channels: ['email']
      },
      offerAlert: {
        enabled: true,
        channels: ['email', 'whatsapp']
      },
      renewalReminder: {
        enabled: true,
        channels: ['email', 'whatsapp']
      },
      systemUpdate: {
        enabled: true,
        channels: ['email', 'push']
      }
    },
    preferences: {
      frequency: 'immediate', // immediate, daily, weekly
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      language: 'english',
      timezone: 'Asia/Kolkata'
    }
  });

  const notificationTypes = [
    {
      id: 'newSale',
      name: 'New Sale Notification',
      description: 'Get notified when a customer makes a purchase using your affiliate link',
      icon: DollarSign,
      category: 'Sales'
    },
    {
      id: 'commissionCredited',
      name: 'Commission Credited',
      description: 'Alerts when a commission has been added to your wallet/earnings',
      icon: CheckCircle,
      category: 'Earnings'
    },
    {
      id: 'payoutReleased',
      name: 'Payout Released',
      description: 'Confirmation when payment is transferred with transaction details',
      icon: DollarSign,
      category: 'Payments'
    },
    {
      id: 'promotionalUpdate',
      name: 'Promotional Material Update',
      description: 'Get notified when ShelfCure uploads new marketing materials',
      icon: Bell,
      category: 'Marketing'
    },
    {
      id: 'offerAlert',
      name: 'Offer/Bonus Alerts',
      description: 'For limited-time campaigns and bonus commission opportunities',
      icon: AlertCircle,
      category: 'Promotions'
    },
    {
      id: 'renewalReminder',
      name: 'Renewal Reminders',
      description: 'Alerts when your referred pharmacies are due for renewal',
      icon: RefreshCw,
      category: 'Renewals'
    },
    {
      id: 'systemUpdate',
      name: 'System Updates',
      description: 'Important system announcements and feature updates',
      icon: Bell,
      category: 'System'
    }
  ];

  const channels = [
    { id: 'email', name: 'Email', icon: Mail, description: 'Receive notifications via email' },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, description: 'Get instant WhatsApp messages' },
    { id: 'sms', name: 'SMS', icon: Smartphone, description: 'Text message notifications' },
    { id: 'push', name: 'Push Notifications', icon: Bell, description: 'Browser/app push notifications' }
  ];

  useEffect(() => {
    // Check if user is authenticated as affiliate
    const affiliateToken = localStorage.getItem('affiliateToken');
    const affiliateData = localStorage.getItem('affiliateData');

    if (!affiliateToken || !affiliateData) {
      console.log('No affiliate authentication found, redirecting to login');
      navigate('/affiliate-login');
      return;
    }

    fetchNotificationSettings();
  }, [navigate]);

  const fetchNotificationSettings = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors

      // Check if user is authenticated
      const affiliateToken = localStorage.getItem('affiliateToken');
      if (!affiliateToken) {
        console.log('No affiliate authentication found, redirecting to login');
        navigate('/affiliate-login');
        return;
      }

      const response = await api.get('/api/affiliate-panel/notification-settings');

      if (response.data.success) {
        setSettings({ ...settings, ...response.data.data });
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      if (error.response?.status === 401) {
        navigate('/affiliate-login');
      } else {
        setError(`Failed to load notification settings: ${error.response?.data?.message || error.message}`);
        // Keep default settings when API fails - they're already initialized in state
        console.log('Using default notification settings due to API error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      console.log('Saving notification settings...', settings);

      const response = await api.put('/api/affiliate-panel/notification-settings', settings);

      if (response.data.success) {
        setSuccess('Notification settings saved successfully');
        // Optionally refresh settings from server
        setTimeout(() => setSuccess(''), 3000); // Clear success message after 3 seconds
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      if (error.response?.status === 401) {
        navigate('/affiliate-login');
      } else {
        setError(error.response?.data?.message || 'Failed to save notification settings. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleChannel = (channelId) => {
    setSettings(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channelId]: !prev.channels[channelId]
      }
    }));
  };

  const toggleNotification = (notificationId) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [notificationId]: {
          ...prev.notifications[notificationId],
          enabled: !prev.notifications[notificationId].enabled
        }
      }
    }));
  };

  const toggleNotificationChannel = (notificationId, channelId) => {
    setSettings(prev => {
      const currentChannels = prev.notifications[notificationId].channels;
      const newChannels = currentChannels.includes(channelId)
        ? currentChannels.filter(c => c !== channelId)
        : [...currentChannels, channelId];
      
      return {
        ...prev,
        notifications: {
          ...prev.notifications,
          [notificationId]: {
            ...prev.notifications[notificationId],
            channels: newChannels
          }
        }
      };
    });
  };

  const updatePreference = (key, value) => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      setSettings(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [parent]: {
            ...prev.preferences[parent],
            [child]: value
          }
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [key]: value
        }
      }));
    }
  };

  if (loading) {
    return (
      <AffiliatePanelLayout title="Notification Settings" subtitle="Manage your notification preferences">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      </AffiliatePanelLayout>
    );
  }

  return (
    <AffiliatePanelLayout title="Notification Settings" subtitle="Manage your notification preferences">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading notification settings</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  {error.includes('404') && (
                    <div className="mt-2">
                      <p>This could be due to:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Backend server is not running</li>
                        <li>API endpoint is not available</li>
                        <li>Authentication token has expired</li>
                      </ul>
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 text-xs">
                        <strong>Note:</strong> Default settings are being used. You can still modify and save your preferences.
                      </div>
                      <div className="mt-3">
                        <button
                          onClick={() => navigate('/affiliate-login')}
                          className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md mr-2"
                        >
                          Re-login
                        </button>
                        <button
                          onClick={fetchNotificationSettings}
                          className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        <div className="space-y-8">
          {/* Notification Channels */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Channels</h3>
            <p className="text-sm text-gray-600 mb-6">
              Choose how you want to receive notifications. You can enable multiple channels.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {channels.map((channel) => {
                const Icon = channel.icon;
                return (
                  <div
                    key={channel.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      settings.channels[channel.id]
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleChannel(channel.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${
                          settings.channels[channel.id] ? 'text-green-600' : 'text-gray-400'
                        }`} />
                        <div>
                          <h4 className="font-medium text-gray-900">{channel.name}</h4>
                          <p className="text-sm text-gray-600">{channel.description}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.channels[channel.id]}
                        onChange={() => toggleChannel(channel.id)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notification Types */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Types</h3>
            <p className="text-sm text-gray-600 mb-6">
              Configure which notifications you want to receive and through which channels.
            </p>

            <div className="space-y-6">
              {notificationTypes.map((notification) => {
                const Icon = notification.icon;
                const isEnabled = settings.notifications[notification.id]?.enabled;
                
                return (
                  <div key={notification.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 ${
                          isEnabled ? 'text-green-600' : 'text-gray-400'
                        }`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{notification.name}</h4>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {notification.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
                        </div>
                      </div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => toggleNotification(notification.id)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                      </label>
                    </div>

                    {isEnabled && (
                      <div className="ml-8 pl-4 border-l-2 border-gray-100">
                        <p className="text-sm font-medium text-gray-700 mb-2">Delivery channels:</p>
                        <div className="flex flex-wrap gap-2">
                          {channels.map((channel) => {
                            if (!settings.channels[channel.id]) return null;
                            
                            const isChannelEnabled = settings.notifications[notification.id]?.channels?.includes(channel.id);
                            const ChannelIcon = channel.icon;
                            
                            return (
                              <button
                                key={channel.id}
                                onClick={() => toggleNotificationChannel(notification.id, channel.id)}
                                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${
                                  isChannelEnabled
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                                }`}
                              >
                                <ChannelIcon className="w-3 h-3" />
                                {channel.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Preferences</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Frequency
                </label>
                <select
                  value={settings.preferences.frequency}
                  onChange={(e) => updatePreference('frequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="immediate">Immediate</option>
                  <option value="daily">Daily Digest</option>
                  <option value="weekly">Weekly Summary</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Quiet Hours</h4>
                    <p className="text-sm text-gray-600">Pause notifications during specific hours</p>
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.preferences.quietHours.enabled}
                      onChange={(e) => updatePreference('quietHours.enabled', e.target.checked)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                  </label>
                </div>

                {settings.preferences.quietHours.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={settings.preferences.quietHours.start}
                        onChange={(e) => updatePreference('quietHours.start', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={settings.preferences.quietHours.end}
                        onChange={(e) => updatePreference('quietHours.end', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={settings.preferences.language}
                    onChange={(e) => updatePreference('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                    <option value="regional">Regional Language</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={settings.preferences.timezone}
                    onChange={(e) => updatePreference('timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="Asia/Kolkata">India Standard Time (IST)</option>
                    <option value="Asia/Dubai">Gulf Standard Time (GST)</option>
                    <option value="UTC">Coordinated Universal Time (UTC)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </AffiliatePanelLayout>
  );
};

export default AffiliateNotificationSettings;

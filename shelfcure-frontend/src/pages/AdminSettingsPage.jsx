import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import SettingsService from '../services/settingsService';
import {
  Settings, Save, Shield, Mail, Bell, Store, Server,
  CheckCircle, AlertCircle, Download, RefreshCw, Trash2
} from 'lucide-react';

const AdminSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [activeTab, setActiveTab] = useState('general');

  const [settings, setSettings] = useState(SettingsService.getDefaultSettings());

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await SettingsService.getSystemSettings();

      if (response.success) {
        const formattedSettings = SettingsService.formatSettingsForDisplay(response.data);
        // Merge with defaults to ensure all fields have values
        const defaultSettings = SettingsService.getDefaultSettings();
        const mergedSettings = {
          general: { ...defaultSettings.general, ...formattedSettings.general },
          security: { ...defaultSettings.security, ...formattedSettings.security },
          email: { ...defaultSettings.email, ...formattedSettings.email },
          notifications: { ...defaultSettings.notifications, ...formattedSettings.notifications },
          business: { ...defaultSettings.business, ...formattedSettings.business },
          system: { ...defaultSettings.system, ...formattedSettings.system }
        };
        setSettings(mergedSettings);
      } else {
        setError('Failed to load system settings');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load system settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setValidationErrors({});

      // Validate settings
      const validation = SettingsService.validateSettings(settings);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setError('Please fix the validation errors before saving.');
        return;
      }

      // Format settings for API
      const formattedSettings = SettingsService.formatSettingsForAPI(settings);

      // Save settings
      const response = await SettingsService.updateSystemSettings(formattedSettings);

      if (response.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);

        // Update local settings with response data
        const updatedSettings = SettingsService.formatSettingsForDisplay(response.data);
        setSettings(updatedSettings);
      } else {
        setError(response.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  // Helper function to safely get setting values with defaults
  const getSettingValue = (category, key, defaultValue = '') => {
    const value = settings?.[category]?.[key];
    if (value === undefined || value === null) {
      return defaultValue;
    }
    return value;
  };

  // Helper function for number inputs
  const getNumberValue = (category, key, defaultValue = 0) => {
    const value = settings?.[category]?.[key];
    if (value === undefined || value === null || isNaN(value)) {
      return defaultValue;
    }
    return value;
  };

  // Helper function for boolean inputs
  const getBooleanValue = (category, key, defaultValue = false) => {
    const value = settings?.[category]?.[key];
    if (value === undefined || value === null) {
      return defaultValue;
    }
    return Boolean(value);
  };

  const ToggleSwitch = ({ enabled, onChange }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-primary-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'business', label: 'Business', icon: Store },
    { id: 'system', label: 'System', icon: Server }
  ];

  // Show loading state
  if (loading) {
    return (
      <AdminLayout title="System Settings" subtitle="Configure platform settings and preferences">
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-lg">Loading system settings...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="System Settings"
      subtitle="Configure platform settings and preferences"
      rightHeaderContent={
        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Settings saved!</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Error occurred</span>
            </div>
          )}
          <button
            onClick={loadSettings}
            disabled={loading || saving}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">General Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Site Name</label>
                      <input
                        type="text"
                        value={getSettingValue('general', 'siteName', 'ShelfCure')}
                        onChange={(e) => handleSettingChange('general', 'siteName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          validationErrors.siteName ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {validationErrors.siteName && (
                        <p className="text-red-600 text-sm mt-1">{validationErrors.siteName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Admin Email</label>
                      <input
                        type="email"
                        value={getSettingValue('general', 'adminEmail', 'admin@shelfcure.com')}
                        onChange={(e) => handleSettingChange('general', 'adminEmail', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          validationErrors.adminEmail ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {validationErrors.adminEmail && (
                        <p className="text-red-600 text-sm mt-1">{validationErrors.adminEmail}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Support Email</label>
                      <input
                        type="email"
                        value={getSettingValue('general', 'supportEmail', 'support@shelfcure.com')}
                        onChange={(e) => handleSettingChange('general', 'supportEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Timezone</label>
                      <select
                        value={getSettingValue('general', 'timezone', 'Asia/Kolkata')}
                        onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Currency</label>
                      <select
                        value={getSettingValue('general', 'currency', 'INR')}
                        onChange={(e) => handleSettingChange('general', 'currency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="INR">Indian Rupee (₹)</option>
                        <option value="USD">US Dollar ($)</option>
                        <option value="EUR">Euro (€)</option>
                        <option value="GBP">British Pound (£)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Date Format</label>
                      <select
                        value={settings.general.dateFormat}
                        onChange={(e) => handleSettingChange('general', 'dateFormat', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Site Description</label>
                    <textarea
                      value={getSettingValue('general', 'siteDescription', 'Comprehensive Medicine Store Management System')}
                      onChange={(e) => handleSettingChange('general', 'siteDescription', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 text-left">Maintenance Mode</h4>
                        <p className="text-sm text-gray-500 text-left">Enable to temporarily disable access to the platform</p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.general.maintenanceMode}
                        onChange={(value) => handleSettingChange('general', 'maintenanceMode', value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Security Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Session Timeout (minutes)</label>
                      <input
                        type="number"
                        value={getNumberValue('security', 'sessionTimeout', 30)}
                        onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Max Login Attempts</label>
                      <input
                        type="number"
                        value={settings.security.maxLoginAttempts}
                        onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Minimum Password Length</label>
                      <input
                        type="number"
                        value={settings.security.passwordMinLength}
                        onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-left">IP Whitelist</label>
                      <input
                        type="text"
                        value={settings.security.ipWhitelist}
                        onChange={(e) => handleSettingChange('security', 'ipWhitelist', e.target.value)}
                        placeholder="192.168.1.1, 10.0.0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 text-left">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-500 text-left">Require 2FA for admin accounts</p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.security.enableTwoFactor}
                        onChange={(value) => handleSettingChange('security', 'enableTwoFactor', value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 text-left">Audit Logging</h4>
                        <p className="text-sm text-gray-500 text-left">Log all admin actions and system events</p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.security.enableAuditLog}
                        onChange={(value) => handleSettingChange('security', 'enableAuditLog', value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 text-left">CAPTCHA Protection</h4>
                        <p className="text-sm text-gray-500 text-left">Enable CAPTCHA for login forms</p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.security.enableCaptcha}
                        onChange={(value) => handleSettingChange('security', 'enableCaptcha', value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 text-left">Force Password Change</h4>
                        <p className="text-sm text-gray-500 text-left">Require users to change passwords periodically</p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.security.requirePasswordChange}
                        onChange={(value) => handleSettingChange('security', 'requirePasswordChange', value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Email Settings */}
            {activeTab === 'email' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Email Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-left">SMTP Host</label>
                      <input
                        type="text"
                        value={getSettingValue('email', 'smtpHost', 'smtp.gmail.com')}
                        onChange={(e) => handleSettingChange('email', 'smtpHost', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-left">SMTP Port</label>
                      <input
                        type="number"
                        value={getNumberValue('email', 'smtpPort', 587)}
                        onChange={(e) => handleSettingChange('email', 'smtpPort', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-left">SMTP Username</label>
                      <input
                        type="text"
                        value={settings.email.smtpUsername}
                        onChange={(e) => handleSettingChange('email', 'smtpUsername', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-left">SMTP Password</label>
                      <input
                        type="password"
                        value={settings.email.smtpPassword}
                        onChange={(e) => handleSettingChange('email', 'smtpPassword', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-left">From Email</label>
                      <input
                        type="email"
                        value={settings.email.fromEmail}
                        onChange={(e) => handleSettingChange('email', 'fromEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-left">From Name</label>
                      <input
                        type="text"
                        value={settings.email.fromName}
                        onChange={(e) => handleSettingChange('email', 'fromName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 text-left">Enable SSL/TLS</h4>
                        <p className="text-sm text-gray-500 text-left">Use secure connection for email sending</p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.email.enableSSL}
                        onChange={(value) => handleSettingChange('email', 'enableSSL', value)}
                      />
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 text-left">Email Test</h4>
                        <p className="text-sm text-blue-700 text-left">Send a test email to verify your configuration</p>
                        <button className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                          Send Test Email
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Notification Configuration</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 text-left">Email Notifications</h4>
                        <p className="text-sm text-gray-500 text-left">Send notifications via email</p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.notifications.enableEmailNotifications}
                        onChange={(value) => handleSettingChange('notifications', 'enableEmailNotifications', value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 text-left">SMS Notifications</h4>
                        <p className="text-sm text-gray-500 text-left">Send notifications via SMS</p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.notifications.enableSMSNotifications}
                        onChange={(value) => handleSettingChange('notifications', 'enableSMSNotifications', value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 text-left">Push Notifications</h4>
                        <p className="text-sm text-gray-500 text-left">Send browser push notifications</p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.notifications.enablePushNotifications}
                        onChange={(value) => handleSettingChange('notifications', 'enablePushNotifications', value)}
                      />
                    </div>

                    <hr className="my-6" />

                    <h4 className="text-sm font-medium text-gray-900 mb-4 text-left">Alert Types</h4>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 text-left">Low Stock Alerts</h4>
                        <p className="text-sm text-gray-500 text-left">Notify when inventory is running low</p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.notifications.lowStockAlerts}
                        onChange={(value) => handleSettingChange('notifications', 'lowStockAlerts', value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 text-left">Expiry Alerts</h4>
                        <p className="text-sm text-gray-500 text-left">Notify when medicines are about to expire</p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.notifications.expiryAlerts}
                        onChange={(value) => handleSettingChange('notifications', 'expiryAlerts', value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 text-left">Subscription Alerts</h4>
                        <p className="text-sm text-gray-500 text-left">Notify about subscription changes and renewals</p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.notifications.subscriptionAlerts}
                        onChange={(value) => handleSettingChange('notifications', 'subscriptionAlerts', value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 text-left">System Alerts</h4>
                        <p className="text-sm text-gray-500 text-left">Notify about system events and errors</p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.notifications.systemAlerts}
                        onChange={(value) => handleSettingChange('notifications', 'systemAlerts', value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Business Settings */}
            {activeTab === 'business' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">Business Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Max Stores per Subscription</label>
                      <input
                        type="number"
                        value={settings.business.maxStoresPerSubscription}
                        onChange={(e) => handleSettingChange('business', 'maxStoresPerSubscription', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Default Subscription Plan</label>
                      <select
                        value={settings.business.defaultSubscriptionPlan}
                        onChange={(e) => handleSettingChange('business', 'defaultSubscriptionPlan', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="basic">Basic</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Trial Duration (days)</label>
                      <input
                        type="number"
                        value={settings.business.trialDurationDays}
                        onChange={(e) => handleSettingChange('business', 'trialDurationDays', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Default Commission Rate (%)</label>
                      <input
                        type="number"
                        value={settings.business.defaultCommissionRate}
                        onChange={(e) => handleSettingChange('business', 'defaultCommissionRate', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Minimum Payout Amount (₹)</label>
                      <input
                        type="number"
                        value={settings.business.minimumPayoutAmount}
                        onChange={(e) => handleSettingChange('business', 'minimumPayoutAmount', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 text-left">Enable Trial Period</h4>
                        <p className="text-sm text-gray-500 text-left">Allow new users to try the platform for free</p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.business.enableTrialPeriod}
                        onChange={(value) => handleSettingChange('business', 'enableTrialPeriod', value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 text-left">Enable Affiliate Program</h4>
                        <p className="text-sm text-gray-500 text-left">Allow users to earn commissions by referring others</p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.business.enableAffiliateProgram}
                        onChange={(value) => handleSettingChange('business', 'enableAffiliateProgram', value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Settings */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 text-left">System Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Backup Frequency</label>
                      <select
                        value={settings.system.backupFrequency}
                        onChange={(e) => handleSettingChange('system', 'backupFrequency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Cache Timeout (seconds)</label>
                      <input
                        type="number"
                        value={settings.system.cacheTimeout}
                        onChange={(e) => handleSettingChange('system', 'cacheTimeout', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-left">Rate Limit (requests/hour)</label>
                      <input
                        type="number"
                        value={settings.system.rateLimitRequests}
                        onChange={(e) => handleSettingChange('system', 'rateLimitRequests', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 text-left">Enable Analytics</h4>
                        <p className="text-sm text-gray-500 text-left">Collect usage analytics and performance metrics</p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.system.enableAnalytics}
                        onChange={(value) => handleSettingChange('system', 'enableAnalytics', value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 text-left">Enable Backups</h4>
                        <p className="text-sm text-gray-500 text-left">Automatically backup system data</p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.system.enableBackups}
                        onChange={(value) => handleSettingChange('system', 'enableBackups', value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 text-left">Enable Caching</h4>
                        <p className="text-sm text-gray-500 text-left">Cache frequently accessed data for better performance</p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.system.enableCaching}
                        onChange={(value) => handleSettingChange('system', 'enableCaching', value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 text-left">Enable Rate Limiting</h4>
                        <p className="text-sm text-gray-500 text-left">Limit API requests to prevent abuse</p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.system.enableRateLimiting}
                        onChange={(value) => handleSettingChange('system', 'enableRateLimiting', value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 text-left">Debug Mode</h4>
                        <p className="text-sm text-gray-500 text-left">Enable detailed logging for troubleshooting</p>
                      </div>
                      <ToggleSwitch
                        enabled={settings.system.enableDebugMode}
                        onChange={(value) => handleSettingChange('system', 'enableDebugMode', value)}
                      />
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Download className="w-4 h-4" />
                      Backup Now
                    </button>
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      <RefreshCw className="w-4 h-4" />
                      Clear Cache
                    </button>
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                      <Trash2 className="w-4 h-4" />
                      Clear Logs
                    </button>
                  </div>

                  <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-900 text-left">System Information</h4>
                        <div className="mt-2 text-sm text-yellow-800 space-y-1">
                          <p className="text-left">Server Version: ShelfCure v2.1.0</p>
                          <p className="text-left">Database Version: MongoDB 6.0</p>
                          <p className="text-left">Last Backup: 2 hours ago</p>
                          <p className="text-left">System Uptime: 15 days, 8 hours</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;

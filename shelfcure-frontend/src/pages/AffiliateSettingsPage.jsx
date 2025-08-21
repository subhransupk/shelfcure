import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import AffiliateSettingsService from '../services/affiliateSettingsService';
import {
  Settings, Save, ToggleLeft, ToggleRight, DollarSign, 
  Calendar, CreditCard, Mail, FileText, AlertCircle,
  CheckCircle, Clock, Building, Smartphone, Globe,
  Users, Percent, Banknote, Bell, Shield
} from 'lucide-react';

const AffiliateSettingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  const [settings, setSettings] = useState(AffiliateSettingsService.getDefaultSettings());

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setInitialLoading(true);
      setError(null);

      const response = await AffiliateSettingsService.getSettings();

      if (response.success) {
        const formattedSettings = AffiliateSettingsService.formatSettingsForDisplay(response.data);
        setSettings(formattedSettings);
      } else {
        setError(response.message || 'Failed to load affiliate settings');
      }
    } catch (error) {
      console.error('Error loading affiliate settings:', error);
      setError('Failed to load affiliate settings. Please try again.');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleToggle = (section, field) => {
    if (section) {
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: !prev[section][field]
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [field]: !prev[field]
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setSaved(false);
      setError(null);
      setValidationErrors([]);

      // Validate settings
      const validation = AffiliateSettingsService.validateSettings(settings);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setLoading(false);
        return;
      }

      // Prepare settings for submission
      const settingsToSubmit = AffiliateSettingsService.prepareSettingsForSubmission(settings);

      const response = await AffiliateSettingsService.updateSettings(settingsToSubmit);

      if (response.success) {
        const formattedSettings = AffiliateSettingsService.formatSettingsForDisplay(response.data);
        setSettings(formattedSettings);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(response.message || 'Failed to save affiliate settings');
      }
    } catch (error) {
      console.error('Error saving affiliate settings:', error);
      setError('Failed to save affiliate settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ToggleSwitch = ({ enabled, onToggle, label, description }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="text-left">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {description && (
          <div className="text-xs text-gray-500 mt-1">{description}</div>
        )}
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-primary-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  // Show loading state
  if (initialLoading) {
    return (
      <AdminLayout title="Affiliate Settings" subtitle="Configure affiliate program settings and policies">
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-lg">Loading affiliate settings...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Affiliate Settings"
      subtitle="Configure affiliate program settings and policies"
      rightHeaderContent={
        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Settings saved!</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={loading || initialLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Error Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800 font-medium">Validation Errors</span>
            </div>
            <ul className="text-yellow-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm">• {error}</li>
              ))}
            </ul>
          </div>
        )}
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 text-left">General Settings</h3>
          </div>

          <div className="space-y-4">
            <ToggleSwitch
              enabled={settings.enableAffiliateProgram}
              onToggle={() => handleToggle(null, 'enableAffiliateProgram')}
              label="Enable Affiliate Program"
              description="When disabled, new affiliate registrations will be blocked"
            />

            <ToggleSwitch
              enabled={settings.autoApproveAffiliates}
              onToggle={() => handleToggle(null, 'autoApproveAffiliates')}
              label="Auto-approve new affiliates"
              description="Automatically approve affiliate applications without manual review"
            />

            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-900 mb-2 text-left">
                Cookie Duration (days)
              </label>
              <input
                type="number"
                value={settings.cookieDuration}
                onChange={(e) => handleInputChange('cookieDuration', parseInt(e.target.value))}
                min="1"
                max="365"
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1 text-left">
                How long referral tracking lasts after a user clicks an affiliate link
              </p>
            </div>
          </div>
        </div>

        {/* Commission Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 text-left">Commission Settings</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                Default Commission Type
              </label>
              <select
                value={settings.defaultCommissionType}
                onChange={(e) => handleInputChange('defaultCommissionType', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                Default Commission Rate
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={settings.defaultCommissionRate}
                  onChange={(e) => handleInputChange('defaultCommissionRate', parseFloat(e.target.value))}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-left">
                Default commission rate for new affiliates
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                Minimum Payout Amount (₹)
              </label>
              <input
                type="number"
                value={settings.minimumPayoutAmount}
                onChange={(e) => handleInputChange('minimumPayoutAmount', parseInt(e.target.value))}
                min="100"
                step="100"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1 text-left">
                Minimum amount required before affiliates can request a payout
              </p>
            </div>
          </div>
        </div>

        {/* Payout Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 text-left">Payout Settings</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                Payout Schedule
              </label>
              <select
                value={settings.payoutSchedule}
                onChange={(e) => handleInputChange('payoutSchedule', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4 text-left">
                Available Payment Methods
              </label>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">Bank Transfer</div>
                      <div className="text-xs text-gray-500">Direct bank account transfers</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('paymentMethods', 'bankTransfer')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.paymentMethods.bankTransfer ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.paymentMethods.bankTransfer ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-purple-600" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">UPI</div>
                      <div className="text-xs text-gray-500">Unified Payments Interface</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('paymentMethods', 'upi')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.paymentMethods.upi ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.paymentMethods.upi ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-orange-600" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">PayPal</div>
                      <div className="text-xs text-gray-500">International PayPal payments</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle('paymentMethods', 'paypal')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.paymentMethods.paypal ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.paymentMethods.paypal ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email Notifications */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Mail className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 text-left">Email Notifications</h3>
          </div>

          <div className="space-y-4">
            <ToggleSwitch
              enabled={settings.emailNotifications.welcomeEmail}
              onToggle={() => handleToggle('emailNotifications', 'welcomeEmail')}
              label="Send welcome email to new affiliates"
              description="Automatically send welcome email when new affiliates register"
            />

            <ToggleSwitch
              enabled={settings.emailNotifications.approvalEmail}
              onToggle={() => handleToggle('emailNotifications', 'approvalEmail')}
              label="Send email when affiliate is approved"
              description="Notify affiliates when their application is approved"
            />

            <ToggleSwitch
              enabled={settings.emailNotifications.commissionEmail}
              onToggle={() => handleToggle('emailNotifications', 'commissionEmail')}
              label="Send email when commission is earned"
              description="Notify affiliates when they earn new commissions"
            />

            <ToggleSwitch
              enabled={settings.emailNotifications.payoutEmail}
              onToggle={() => handleToggle('emailNotifications', 'payoutEmail')}
              label="Send email when payout is processed"
              description="Notify affiliates when their payouts are processed"
            />
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 text-left">Terms & Conditions</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
              Affiliate Terms & Conditions
            </label>
            <textarea
              value={settings.affiliateTerms}
              onChange={(e) => handleInputChange('affiliateTerms', e.target.value)}
              rows={12}
              placeholder="Enter the terms and conditions for your affiliate program..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-2 text-left">
              These terms will be displayed to affiliates during registration and in their dashboard.
            </p>
          </div>
        </div>

        {/* Settings Summary */}
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-primary-900 text-left">Settings Summary</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/50 rounded-lg p-4">
              <div className="text-sm font-medium text-primary-900 text-left">Program Status</div>
              <div className={`text-lg font-bold ${settings.enableAffiliateProgram ? 'text-green-600' : 'text-red-600'}`}>
                {settings.enableAffiliateProgram ? 'Active' : 'Disabled'}
              </div>
            </div>

            <div className="bg-white/50 rounded-lg p-4">
              <div className="text-sm font-medium text-primary-900 text-left">Default Commission</div>
              <div className="text-lg font-bold text-primary-600">
                {settings.defaultCommissionRate}%
              </div>
            </div>

            <div className="bg-white/50 rounded-lg p-4">
              <div className="text-sm font-medium text-primary-900 text-left">Minimum Payout</div>
              <div className="text-lg font-bold text-primary-600">
                ₹{settings.minimumPayoutAmount}
              </div>
            </div>

            <div className="bg-white/50 rounded-lg p-4">
              <div className="text-sm font-medium text-primary-900 text-left">Payout Schedule</div>
              <div className="text-lg font-bold text-primary-600 capitalize">
                {settings.payoutSchedule}
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-left">
                <h4 className="text-sm font-medium text-blue-900">Important Notes</h4>
                <ul className="mt-1 text-xs text-blue-800 space-y-1">
                  <li>• Changes to commission settings will only affect new affiliates</li>
                  <li>• Existing affiliates will retain their current commission rates</li>
                  <li>• Email notification changes take effect immediately</li>
                  <li>• Payment method changes require affiliate account updates</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AffiliateSettingsPage;

import { API_ENDPOINTS } from '../config/api';

class SettingsService {
  /**
   * Get system settings
   */
  static async getSystemSettings() {
    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_SETTINGS, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch system settings');
      }

      return data;
    } catch (error) {
      console.error('Error fetching system settings:', error);
      throw error;
    }
  }

  /**
   * Update system settings
   */
  static async updateSystemSettings(settings) {
    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_SETTINGS, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update system settings');
      }

      return data;
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }

  /**
   * Validate settings before saving
   */
  static validateSettings(settings) {
    const errors = {};

    // Validate general settings
    if (settings.general) {
      if (!settings.general.siteName || settings.general.siteName.trim().length === 0) {
        errors.siteName = 'Site name is required';
      }

      if (!settings.general.adminEmail || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(settings.general.adminEmail)) {
        errors.adminEmail = 'Valid admin email is required';
      }

      if (!settings.general.supportEmail || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(settings.general.supportEmail)) {
        errors.supportEmail = 'Valid support email is required';
      }

      if (!settings.general.currency || settings.general.currency.length !== 3) {
        errors.currency = 'Currency code must be 3 characters';
      }
    }

    // Validate security settings
    if (settings.security) {
      if (settings.security.sessionTimeout && (settings.security.sessionTimeout < 5 || settings.security.sessionTimeout > 480)) {
        errors.sessionTimeout = 'Session timeout must be between 5 and 480 minutes';
      }

      if (settings.security.maxLoginAttempts && (settings.security.maxLoginAttempts < 3 || settings.security.maxLoginAttempts > 10)) {
        errors.maxLoginAttempts = 'Max login attempts must be between 3 and 10';
      }

      if (settings.security.passwordMinLength && (settings.security.passwordMinLength < 6 || settings.security.passwordMinLength > 50)) {
        errors.passwordMinLength = 'Password minimum length must be between 6 and 50 characters';
      }

      if (settings.security.passwordChangeInterval && settings.security.passwordChangeInterval < 30) {
        errors.passwordChangeInterval = 'Password change interval must be at least 30 days';
      }
    }

    // Validate email settings
    if (settings.email) {
      if (settings.email.smtpPort && (settings.email.smtpPort < 1 || settings.email.smtpPort > 65535)) {
        errors.smtpPort = 'SMTP port must be between 1 and 65535';
      }

      if (settings.email.fromEmail && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(settings.email.fromEmail)) {
        errors.fromEmail = 'Valid from email is required';
      }
    }

    // Validate business settings
    if (settings.business) {
      if (settings.business.maxStoresPerSubscription && (settings.business.maxStoresPerSubscription < 1 || settings.business.maxStoresPerSubscription > 100)) {
        errors.maxStoresPerSubscription = 'Max stores per subscription must be between 1 and 100';
      }

      if (settings.business.trialDurationDays && (settings.business.trialDurationDays < 1 || settings.business.trialDurationDays > 90)) {
        errors.trialDurationDays = 'Trial duration must be between 1 and 90 days';
      }

      if (settings.business.defaultCommissionRate && (settings.business.defaultCommissionRate < 0 || settings.business.defaultCommissionRate > 50)) {
        errors.defaultCommissionRate = 'Commission rate must be between 0 and 50%';
      }

      if (settings.business.minimumPayoutAmount && settings.business.minimumPayoutAmount < 100) {
        errors.minimumPayoutAmount = 'Minimum payout amount must be at least 100';
      }
    }

    // Validate system settings
    if (settings.system) {
      if (settings.system.cacheTimeout && settings.system.cacheTimeout < 60) {
        errors.cacheTimeout = 'Cache timeout must be at least 60 seconds';
      }

      if (settings.system.rateLimitRequests && settings.system.rateLimitRequests < 100) {
        errors.rateLimitRequests = 'Rate limit requests must be at least 100';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Get default settings structure
   */
  static getDefaultSettings() {
    return {
      general: {
        siteName: 'ShelfCure',
        siteDescription: 'Comprehensive Medicine Store Management System',
        adminEmail: 'admin@shelfcure.com',
        supportEmail: 'support@shelfcure.com',
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        currency: 'INR',
        currencySymbol: '₹',
        language: 'en',
        maintenanceMode: false,
        maintenanceMessage: 'System is under maintenance. Please try again later.'
      },
      security: {
        enableTwoFactor: false,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        requirePasswordChange: false,
        passwordChangeInterval: 90,
        enableAuditLog: true,
        ipWhitelist: [],
        enableCaptcha: true
      },
      email: {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUsername: '',
        enableSSL: true,
        fromEmail: 'noreply@shelfcure.com',
        fromName: 'ShelfCure'
      },
      notifications: {
        enableEmailNotifications: true,
        enableSMSNotifications: false,
        enablePushNotifications: true,
        lowStockAlerts: true,
        expiryAlerts: true,
        subscriptionAlerts: true,
        systemAlerts: true,
        alertEmails: []
      },
      business: {
        maxStoresPerSubscription: 5,
        defaultSubscriptionPlan: 'basic',
        enableTrialPeriod: true,
        trialDurationDays: 14,
        enableAffiliateProgram: true,
        defaultCommissionRate: 10,
        minimumPayoutAmount: 1000,
        enableMultiStore: true,
        enableWhatsAppIntegration: true,
        enableBillOCR: true
      },
      system: {
        enableAnalytics: true,
        enableBackups: true,
        backupFrequency: 'daily',
        enableCaching: true,
        cacheTimeout: 3600,
        enableRateLimiting: true,
        rateLimitRequests: 1000,
        enableDebugMode: false,
        logLevel: 'info',
        enableHealthChecks: true
      }
    };
  }

  /**
   * Format settings for display
   */
  static formatSettingsForDisplay(settings) {
    // Create a deep copy to avoid mutating original
    const formatted = JSON.parse(JSON.stringify(settings));

    // Format IP whitelist array to string
    if (formatted.security && formatted.security.ipWhitelist) {
      formatted.security.ipWhitelist = formatted.security.ipWhitelist.join('\n');
    }

    // Format alert emails array to string
    if (formatted.notifications && formatted.notifications.alertEmails) {
      formatted.notifications.alertEmails = formatted.notifications.alertEmails.join('\n');
    }

    return formatted;
  }

  /**
   * Format settings for API submission
   */
  static formatSettingsForAPI(settings) {
    // Create a deep copy to avoid mutating original
    const formatted = JSON.parse(JSON.stringify(settings));

    // Convert IP whitelist string to array
    if (formatted.security && formatted.security.ipWhitelist) {
      formatted.security.ipWhitelist = formatted.security.ipWhitelist
        .split('\n')
        .map(ip => ip.trim())
        .filter(ip => ip.length > 0);
    }

    // Convert alert emails string to array
    if (formatted.notifications && formatted.notifications.alertEmails) {
      formatted.notifications.alertEmails = formatted.notifications.alertEmails
        .split('\n')
        .map(email => email.trim())
        .filter(email => email.length > 0);
    }

    return formatted;
  }

  /**
   * Get available options for dropdowns
   */
  static getSettingsOptions() {
    return {
      timezones: [
        'Asia/Kolkata',
        'Asia/Mumbai',
        'Asia/Delhi',
        'Asia/Bangalore',
        'Asia/Chennai',
        'UTC',
        'America/New_York',
        'Europe/London'
      ],
      dateFormats: [
        'DD/MM/YYYY',
        'MM/DD/YYYY',
        'YYYY-MM-DD'
      ],
      currencies: [
        { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
        { code: 'USD', symbol: '$', name: 'US Dollar' },
        { code: 'EUR', symbol: '€', name: 'Euro' },
        { code: 'GBP', symbol: '£', name: 'British Pound' }
      ],
      languages: [
        { code: 'en', name: 'English' },
        { code: 'hi', name: 'Hindi' },
        { code: 'bn', name: 'Bengali' },
        { code: 'te', name: 'Telugu' },
        { code: 'ta', name: 'Tamil' },
        { code: 'mr', name: 'Marathi' },
        { code: 'gu', name: 'Gujarati' }
      ],
      subscriptionPlans: [
        'basic',
        'standard',
        'premium',
        'enterprise'
      ],
      backupFrequencies: [
        'hourly',
        'daily',
        'weekly',
        'monthly'
      ],
      logLevels: [
        'error',
        'warn',
        'info',
        'debug'
      ]
    };
  }
}

export default SettingsService;

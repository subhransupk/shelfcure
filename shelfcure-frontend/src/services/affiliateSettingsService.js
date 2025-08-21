import { API_ENDPOINTS } from '../config/api';

class AffiliateSettingsService {
  /**
   * Get affiliate settings
   */
  static async getSettings() {
    try {
      const response = await fetch(`${API_ENDPOINTS.ADMIN_AFFILIATES}/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching affiliate settings:', error);
      throw error;
    }
  }

  /**
   * Update affiliate settings
   */
  static async updateSettings(settings) {
    try {
      const response = await fetch(`${API_ENDPOINTS.ADMIN_AFFILIATES}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating affiliate settings:', error);
      throw error;
    }
  }

  /**
   * Validate settings before sending to server
   */
  static validateSettings(settings) {
    const errors = [];

    // Validate cookie duration
    if (!settings.cookieDuration || settings.cookieDuration < 1 || settings.cookieDuration > 365) {
      errors.push('Cookie duration must be between 1 and 365 days');
    }

    // Validate commission rate
    if (!settings.defaultCommissionRate || settings.defaultCommissionRate < 0) {
      errors.push('Commission rate must be a positive number');
    }

    if (settings.defaultCommissionType === 'percentage' && settings.defaultCommissionRate > 100) {
      errors.push('Percentage commission rate cannot exceed 100%');
    }

    // Validate minimum payout amount
    if (!settings.minimumPayoutAmount || settings.minimumPayoutAmount < 100) {
      errors.push('Minimum payout amount must be at least ₹100');
    }

    // Validate payment methods
    const hasEnabledPaymentMethod = settings.paymentMethods?.bankTransfer || 
                                   settings.paymentMethods?.upi || 
                                   settings.paymentMethods?.paypal;
    if (!hasEnabledPaymentMethod) {
      errors.push('At least one payment method must be enabled');
    }

    // Validate affiliate terms
    if (!settings.affiliateTerms || settings.affiliateTerms.trim().length < 50) {
      errors.push('Affiliate terms must be at least 50 characters long');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get default settings structure
   */
  static getDefaultSettings() {
    return {
      // General Settings
      enableAffiliateProgram: true,
      autoApproveAffiliates: false,
      cookieDuration: 30,

      // Commission Settings
      defaultCommissionType: 'percentage',
      defaultCommissionRate: 10,
      minimumPayoutAmount: 1000,

      // Payout Settings
      payoutSchedule: 'monthly',
      paymentMethods: {
        bankTransfer: true,
        upi: true,
        paypal: false
      },

      // Email Notifications
      emailNotifications: {
        welcomeEmail: true,
        approvalEmail: true,
        commissionEmail: true,
        payoutEmail: true
      },

      // Terms & Conditions
      affiliateTerms: `Welcome to the ShelfCure Affiliate Program!

By joining our affiliate program, you agree to the following terms and conditions:

1. AFFILIATE RESPONSIBILITIES
- Promote ShelfCure services ethically and professionally
- Comply with all applicable laws and regulations
- Maintain accurate contact and payment information

2. COMMISSION STRUCTURE
- Commissions are calculated based on successful referrals
- Payments are processed monthly on the 1st of each month
- Minimum payout threshold must be met for payment processing

3. PROHIBITED ACTIVITIES
- Spam marketing or unsolicited communications
- False or misleading advertising claims
- Trademark or copyright infringement

4. PAYMENT TERMS
- Commissions are paid within 30 days of the end of each month
- Affiliates are responsible for any applicable taxes
- ShelfCure reserves the right to withhold payments for policy violations

5. TERMINATION
- Either party may terminate this agreement at any time
- Outstanding commissions will be paid according to normal schedule
- Terminated affiliates lose access to promotional materials

For questions about these terms, please contact our affiliate support team.`
    };
  }

  /**
   * Format settings for display
   */
  static formatSettingsForDisplay(settings) {
    return {
      ...settings,
      defaultCommissionRate: parseFloat(settings.defaultCommissionRate),
      minimumPayoutAmount: parseInt(settings.minimumPayoutAmount),
      cookieDuration: parseInt(settings.cookieDuration)
    };
  }

  /**
   * Prepare settings for API submission
   */
  static prepareSettingsForSubmission(settings) {
    return {
      enableAffiliateProgram: Boolean(settings.enableAffiliateProgram),
      autoApproveAffiliates: Boolean(settings.autoApproveAffiliates),
      cookieDuration: parseInt(settings.cookieDuration),
      defaultCommissionType: settings.defaultCommissionType,
      defaultCommissionRate: parseFloat(settings.defaultCommissionRate),
      minimumPayoutAmount: parseInt(settings.minimumPayoutAmount),
      payoutSchedule: settings.payoutSchedule,
      paymentMethods: {
        bankTransfer: Boolean(settings.paymentMethods?.bankTransfer),
        upi: Boolean(settings.paymentMethods?.upi),
        paypal: Boolean(settings.paymentMethods?.paypal)
      },
      emailNotifications: {
        welcomeEmail: Boolean(settings.emailNotifications?.welcomeEmail),
        approvalEmail: Boolean(settings.emailNotifications?.approvalEmail),
        commissionEmail: Boolean(settings.emailNotifications?.commissionEmail),
        payoutEmail: Boolean(settings.emailNotifications?.payoutEmail)
      },
      affiliateTerms: settings.affiliateTerms?.trim()
    };
  }
}

export default AffiliateSettingsService;

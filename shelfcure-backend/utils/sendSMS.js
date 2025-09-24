// SMS utility for sending SMS messages
// This is a placeholder implementation. In production, you would integrate with
// services like Twilio, AWS SNS, or Indian SMS providers like TextLocal, MSG91, etc.

const sendSMS = async (phoneNumber, message) => {
  try {
    console.log(`SMS would be sent to ${phoneNumber}: ${message}`);
    
    // For development, we'll just log the SMS
    if (process.env.NODE_ENV !== 'production') {
      console.log('=== SMS SIMULATION ===');
      console.log(`To: ${phoneNumber}`);
      console.log(`Message: ${message}`);
      console.log('=====================');
      
      return {
        success: true,
        messageId: `sim_${Date.now()}`,
        message: 'SMS simulated successfully (development mode)'
      };
    }

    // Production SMS implementation would go here
    // Example with Twilio:
    /*
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    
    return {
      success: true,
      messageId: result.sid,
      message: 'SMS sent successfully'
    };
    */

    // Example with MSG91 (Indian SMS provider):
    /*
    const axios = require('axios');
    
    const response = await axios.post('https://api.msg91.com/api/v5/flow/', {
      template_id: process.env.MSG91_TEMPLATE_ID,
      short_url: "0",
      recipients: [
        {
          mobiles: phoneNumber,
          message: message
        }
      ]
    }, {
      headers: {
        'authkey': process.env.MSG91_AUTH_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    return {
      success: true,
      messageId: response.data.request_id,
      message: 'SMS sent successfully'
    };
    */

    // Placeholder return for production without SMS service configured
    return {
      success: false,
      error: 'SMS service not configured'
    };

  } catch (error) {
    console.error('SMS sending error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Template for affiliate phone verification SMS
const sendAffiliatePhoneVerificationSMS = async (phoneNumber, otp) => {
  const message = `Your ShelfCure affiliate phone verification OTP is: ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`;
  return await sendSMS(phoneNumber, message);
};

// Template for affiliate welcome SMS
const sendAffiliateWelcomeSMS = async (phoneNumber, affiliateName) => {
  const message = `Welcome to ShelfCure Affiliate Program, ${affiliateName}! Your application is under review. You'll receive updates via email. For support: affiliate-support@shelfcure.com`;
  return await sendSMS(phoneNumber, message);
};

// Template for affiliate approval SMS
const sendAffiliateApprovalSMS = async (phoneNumber, affiliateName, affiliateCode) => {
  const message = `Congratulations ${affiliateName}! Your ShelfCure affiliate application is approved. Your code: ${affiliateCode}. Login at: ${process.env.FRONTEND_URL}/affiliate-login`;
  return await sendSMS(phoneNumber, message);
};

// Template for commission notification SMS
const sendCommissionNotificationSMS = async (phoneNumber, affiliateName, amount) => {
  const message = `Hi ${affiliateName}, you've earned ₹${amount} commission! Check your ShelfCure affiliate dashboard for details.`;
  return await sendSMS(phoneNumber, message);
};

// Template for payout notification SMS
const sendPayoutNotificationSMS = async (phoneNumber, affiliateName, amount, transactionId) => {
  const message = `Hi ${affiliateName}, your payout of ₹${amount} has been processed. Transaction ID: ${transactionId}. Amount will reflect in 1-3 business days.`;
  return await sendSMS(phoneNumber, message);
};

// Template for renewal reminder SMS
const sendRenewalReminderSMS = async (phoneNumber, pharmacyName, daysLeft) => {
  const message = `Reminder: ${pharmacyName}'s ShelfCure subscription expires in ${daysLeft} days. Contact them for renewal to continue earning commissions.`;
  return await sendSMS(phoneNumber, message);
};

module.exports = {
  sendSMS,
  sendAffiliatePhoneVerificationSMS,
  sendAffiliateWelcomeSMS,
  sendAffiliateApprovalSMS,
  sendCommissionNotificationSMS,
  sendPayoutNotificationSMS,
  sendRenewalReminderSMS
};

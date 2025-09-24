const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // For development, you can use a service like Gmail or a testing service like Ethereal
  // For production, use a proper email service like SendGrid, AWS SES, etc.
  
  if (process.env.NODE_ENV === 'production') {
    // Production email configuration
    return nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Development configuration - using Ethereal for testing
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    });
  }
};

const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@shelfcure.com',
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || options.message
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Template for affiliate welcome email
const sendAffiliateWelcomeEmail = async (affiliate) => {
  const subject = 'Welcome to ShelfCure Affiliate Program!';
  const message = `
    Dear ${affiliate.name},

    Welcome to the ShelfCure Affiliate Program!

    Your application has been received and is currently under review. Here are your details:

    Name: ${affiliate.name}
    Email: ${affiliate.email}
    Phone: ${affiliate.phone}
    Affiliate Code: ${affiliate.affiliateCode}

    What happens next?
    1. Our team will review your application and documents
    2. You'll receive an email notification about the approval status
    3. Once approved, you can access your affiliate dashboard
    4. Start earning commissions by referring new pharmacy partners

    If you have any questions, please contact our affiliate support team at affiliate-support@shelfcure.com

    Best regards,
    ShelfCure Team
  `;

  return await sendEmail({
    email: affiliate.email,
    subject,
    message
  });
};

// Template for affiliate approval email
const sendAffiliateApprovalEmail = async (affiliate) => {
  const subject = 'Congratulations! Your ShelfCure Affiliate Application is Approved';
  const message = `
    Dear ${affiliate.name},

    Congratulations! Your ShelfCure Affiliate Program application has been approved.

    You can now access your affiliate dashboard and start earning commissions:

    🔗 Login to your dashboard: ${process.env.FRONTEND_URL}/affiliate-login
    🆔 Your Affiliate Code: ${affiliate.affiliateCode}
    💰 Commission Rate: ${affiliate.commission.rate}%

    Your unique referral link: ${affiliate.referralLink}

    Getting Started:
    1. Log in to your affiliate dashboard
    2. Access marketing materials and resources
    3. Share your referral link with potential pharmacy partners
    4. Track your referrals and earnings in real-time

    For support and questions, contact us at affiliate-support@shelfcure.com

    Welcome aboard!
    ShelfCure Team
  `;

  return await sendEmail({
    email: affiliate.email,
    subject,
    message
  });
};

// Template for affiliate rejection email
const sendAffiliateRejectionEmail = async (affiliate, reason) => {
  const subject = 'ShelfCure Affiliate Application Update';
  const message = `
    Dear ${affiliate.name},

    Thank you for your interest in the ShelfCure Affiliate Program.

    After careful review, we are unable to approve your application at this time.

    ${reason ? `Reason: ${reason}` : ''}

    You may reapply after addressing any issues mentioned above. If you have questions about this decision, please contact our support team at affiliate-support@shelfcure.com

    Thank you for your understanding.
    ShelfCure Team
  `;

  return await sendEmail({
    email: affiliate.email,
    subject,
    message
  });
};

// Template for commission notification email
const sendCommissionNotificationEmail = async (affiliate, commission) => {
  const subject = 'New Commission Earned - ShelfCure Affiliate';
  const message = `
    Dear ${affiliate.name},

    Great news! You've earned a new commission.

    Commission Details:
    Amount: ₹${commission.commissionAmount}
    Type: ${commission.type}
    Store: ${commission.store?.name || 'N/A'}
    Date: ${new Date(commission.createdAt).toLocaleDateString()}
    Status: ${commission.status}

    This commission will be included in your next payout cycle.

    View your complete earnings history in your affiliate dashboard:
    ${process.env.FRONTEND_URL}/affiliate-panel/dashboard

    Keep up the great work!
    ShelfCure Team
  `;

  return await sendEmail({
    email: affiliate.email,
    subject,
    message
  });
};

// Template for payout notification email
const sendPayoutNotificationEmail = async (affiliate, payout) => {
  const subject = 'Payout Processed - ShelfCure Affiliate';
  const message = `
    Dear ${affiliate.name},

    Your affiliate payout has been processed successfully!

    Payout Details:
    Amount: ₹${payout.amount}
    Method: ${payout.method}
    Transaction ID: ${payout.transactionId}
    Date: ${new Date(payout.processedDate).toLocaleDateString()}

    The payment should reflect in your account within 1-3 business days.

    If you have any questions about this payout, please contact us at affiliate-support@shelfcure.com

    Thank you for being a valued affiliate partner!
    ShelfCure Team
  `;

  return await sendEmail({
    email: affiliate.email,
    subject,
    message
  });
};

module.exports = {
  sendEmail,
  sendAffiliateWelcomeEmail,
  sendAffiliateApprovalEmail,
  sendAffiliateRejectionEmail,
  sendCommissionNotificationEmail,
  sendPayoutNotificationEmail
};

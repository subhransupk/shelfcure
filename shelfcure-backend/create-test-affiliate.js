const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Affiliate = require('./models/Affiliate');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shelfcure');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const createTestAffiliate = async () => {
  try {
    await connectDB();

    // Check if test affiliate already exists
    const existingAffiliate = await Affiliate.findOne({ email: 'test.affiliate@shelfcure.com' });
    
    if (existingAffiliate) {
      console.log('✅ Test affiliate already exists!');
      console.log('📧 Email: test.affiliate@shelfcure.com');
      console.log('🔑 Password: testpass123');
      console.log('🆔 Affiliate Code:', existingAffiliate.affiliateCode);
      console.log('📊 Status:', existingAffiliate.status);
      console.log('🔗 Login URL: http://localhost:3000/affiliate-login');
      
      // Update to active status if not already
      if (existingAffiliate.status !== 'active') {
        existingAffiliate.status = 'active';
        existingAffiliate.kycStatus = 'approved';
        existingAffiliate.verification.email.verified = true;
        existingAffiliate.verification.phone.verified = true;
        existingAffiliate.approvedAt = new Date();
        await existingAffiliate.save();
        console.log('✅ Updated affiliate status to active');
      }
      
      process.exit(0);
    }

    // Create test affiliate data
    const testAffiliateData = {
      firstName: 'John',
      lastName: 'Doe',
      name: 'John Doe',
      email: 'test.affiliate@shelfcure.com',
      phone: '+91-9876543210',
      password: 'testpass123', // Will be hashed by pre-save middleware
      dateOfBirth: new Date('1990-01-15'),
      gender: 'male',
      affiliateCode: 'TEST001', // Manually set for test account
      
      // Government ID
      governmentId: {
        type: 'aadhaar',
        number: '1234-5678-9012',
        document: {
          filename: 'test-aadhaar.pdf',
          originalName: 'aadhaar-card.pdf',
          mimetype: 'application/pdf',
          size: 1024000,
          url: '/uploads/affiliates/test-aadhaar.pdf',
          verified: true,
          verifiedAt: new Date()
        }
      },
      
      // Verification status
      verification: {
        email: {
          verified: true,
          verifiedAt: new Date()
        },
        phone: {
          verified: true,
          verifiedAt: new Date()
        }
      },
      
      // Business information
      businessName: 'John Doe Marketing',
      businessType: 'individual',
      
      // Address
      address: {
        street: '123 Test Street, Test Area',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        pincode: '400001'
      },
      
      // Referral link
      referralLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=TEST001`,

      // Commission structure
      commission: {
        type: 'percentage',
        rate: 10,
        recurringCommission: {
          enabled: true,
          months: 12
        }
      },
      
      // Payment details
      paymentDetails: {
        preferredMethod: 'bank_transfer',
        bankDetails: {
          accountHolderName: 'John Doe',
          accountNumber: '1234567890123456',
          ifscCode: 'HDFC0000123',
          bankName: 'HDFC Bank'
        }
      },
      
      // Tax information
      taxInfo: {
        panNumber: 'ABCDE1234F',
        tdsApplicable: true
      },
      
      // Status
      status: 'active',
      kycStatus: 'approved',
      isActive: true,
      approvedAt: new Date(),
      kycCompletedAt: new Date(),
      kycReviewedAt: new Date(),
      
      // Notification preferences
      notificationPreferences: {
        email: {
          newSale: true,
          commissionCredited: true,
          payoutReleased: true,
          promotionalMaterial: true,
          offerAlerts: true
        },
        whatsapp: {
          newSale: false,
          commissionCredited: true,
          payoutReleased: true,
          promotionalMaterial: false,
          offerAlerts: true
        },
        sms: {
          newSale: false,
          commissionCredited: false,
          payoutReleased: true,
          promotionalMaterial: false,
          offerAlerts: false
        },
        digestFrequency: 'immediate'
      }
    };

    // Create the affiliate
    const testAffiliate = await Affiliate.create(testAffiliateData);

    console.log('🎉 Test affiliate account created successfully!');
    console.log('');
    console.log('📋 LOGIN CREDENTIALS:');
    console.log('📧 Email: test.affiliate@shelfcure.com');
    console.log('🔑 Password: testpass123');
    console.log('');
    console.log('📊 ACCOUNT DETAILS:');
    console.log('🆔 Affiliate Code:', testAffiliate.affiliateCode);
    console.log('📱 Phone:', testAffiliate.phone);
    console.log('📍 Location: Mumbai, Maharashtra');
    console.log('💰 Commission Rate: 10%');
    console.log('✅ Status: Active (Approved)');
    console.log('✅ Email Verified: Yes');
    console.log('✅ Phone Verified: Yes');
    console.log('✅ KYC Status: Approved');
    console.log('');
    console.log('🔗 LOGIN URL:');
    console.log('http://localhost:3000/affiliate-login');
    console.log('');
    console.log('🎯 REFERRAL LINK:');
    console.log(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${testAffiliate.affiliateCode}`);
    console.log('');
    console.log('💡 You can now login with these credentials and access the affiliate dashboard!');

  } catch (error) {
    console.error('❌ Error creating test affiliate:', error);
    
    if (error.code === 11000) {
      console.log('');
      console.log('ℹ️  It looks like a test affiliate might already exist.');
      console.log('Try logging in with: test.affiliate@shelfcure.com / testpass123');
    }
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
createTestAffiliate();

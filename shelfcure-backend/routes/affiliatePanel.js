const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const Affiliate = require('../models/Affiliate');
const AffiliateCommission = require('../models/AffiliateCommission');
const AffiliateReferralInvitation = require('../models/AffiliateReferralInvitation');
const PharmacySubmission = require('../models/PharmacySubmission');
const RenewalReminder = require('../models/RenewalReminder');
const Store = require('../models/Store');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { sendEmail } = require('../utils/sendEmail');
const { sendSMS } = require('../utils/sendSMS');
const axios = require('axios');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/affiliates');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'governmentIdDocument') {
      // Allow PDF, JPG, PNG for government ID
      if (file.mimetype === 'application/pdf' || 
          file.mimetype === 'image/jpeg' || 
          file.mimetype === 'image/png') {
        cb(null, true);
      } else {
        cb(new Error('Government ID must be PDF, JPG, or PNG format'));
      }
    } else if (file.fieldname === 'profilePhoto') {
      // Allow only images for profile photo
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Profile photo must be an image'));
      }
    } else {
      cb(new Error('Unexpected field'));
    }
  }
});

// Middleware to protect affiliate routes
const affiliateAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.affiliateToken) {
      token = req.cookies.affiliateToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');

    if (decoded.role !== 'affiliate') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized as affiliate'
      });
    }

    // Check if database is available
    if (!global.isDatabaseConnected) {
      console.log('Database not available for affiliate auth, using mock affiliate data');

      // Create mock affiliate data based on token
      req.affiliate = {
        _id: decoded.id,
        name: 'Test Affiliate',
        email: 'test@affiliate.com',
        affiliateCode: decoded.affiliateCode || 'TEST001',
        status: 'active',
        kycStatus: 'approved',
        isActive: true,
        commission: {
          type: 'percentage',
          rate: 10
        },
        stats: {
          totalEarnings: 15000,
          totalReferrals: 25,
          successfulReferrals: 20,
          pendingEarnings: 5000,
          paidEarnings: 10000
        },
        createdAt: new Date('2024-01-01')
      };

      return next();
    }

    const affiliate = await Affiliate.findById(decoded.id).select('-password');

    if (!affiliate) {
      return res.status(401).json({
        success: false,
        message: 'Affiliate not found'
      });
    }

    if (!affiliate.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Affiliate account is deactivated'
      });
    }

    req.affiliate = affiliate;
    next();
  } catch (error) {
    console.error('Affiliate auth error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// @desc    Check for duplicate email/phone during registration
// @route   POST /api/affiliate-panel/check-duplicate
// @access  Public
router.post('/check-duplicate', async (req, res) => {
  try {
    const { field, value } = req.body;

    if (!field || !value) {
      return res.status(400).json({
        success: false,
        message: 'Field and value are required'
      });
    }

    if (!['email', 'phone'].includes(field)) {
      return res.status(400).json({
        success: false,
        message: 'Field must be either email or phone'
      });
    }

    // Check if database is available
    if (!global.isDatabaseConnected) {
      // For demo purposes, return available for any value
      return res.status(200).json({
        success: true,
        available: true,
        message: `${field} is available`
      });
    }

    // Check in Affiliate collection
    const query = {};
    query[field] = value;

    const existingAffiliate = await Affiliate.findOne(query);

    if (existingAffiliate) {
      return res.status(200).json({
        success: true,
        available: false,
        message: `This ${field} is already registered`
      });
    }

    // Also check in User collection (store owners) to prevent conflicts
    const existingUser = await User.findOne(query);

    if (existingUser) {
      return res.status(200).json({
        success: true,
        available: false,
        message: `This ${field} is already registered in the system`
      });
    }

    res.status(200).json({
      success: true,
      available: true,
      message: `${field} is available`
    });

  } catch (error) {
    console.error('Duplicate check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during duplicate check',
      error: error.message
    });
  }
});

// @desc    Register new affiliate (Public)
// @route   POST /api/affiliate-panel/register
// @access  Public
router.post('/register', upload.fields([
  { name: 'governmentIdDocument', maxCount: 1 },
  { name: 'profilePhoto', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      dateOfBirth,
      gender,
      governmentIdType,
      governmentIdNumber,
      businessName,
      businessType,
      street,
      city,
      state,
      country,
      pincode,
      referralCode, // New field for affiliate referral
      recaptchaToken
    } = req.body;

    // Verify reCAPTCHA token
    if (recaptchaToken) {
      try {
        const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'; // Test secret
        const recaptchaResponse = await axios.post(
          `https://www.google.com/recaptcha/api/siteverify`,
          null,
          {
            params: {
              secret: recaptchaSecret,
              response: recaptchaToken,
              remoteip: req.ip
            }
          }
        );

        if (!recaptchaResponse.data.success) {
          return res.status(400).json({
            success: false,
            message: 'reCAPTCHA verification failed. Please try again.'
          });
        }
      } catch (error) {
        console.error('reCAPTCHA verification error:', error);
        return res.status(400).json({
          success: false,
          message: 'reCAPTCHA verification failed. Please try again.'
        });
      }
    }

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password || !dateOfBirth || 
        !governmentIdType || !governmentIdNumber || !street || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Check if affiliate already exists
    const existingAffiliate = await Affiliate.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingAffiliate) {
      return res.status(400).json({
        success: false,
        message: 'Affiliate with this email or phone already exists'
      });
    }

    // Validate age (18+)
    const age = Math.floor((new Date() - new Date(dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) {
      return res.status(400).json({
        success: false,
        message: 'Applicant must be 18 years or older'
      });
    }

    // Check if government ID document was uploaded
    if (!req.files || !req.files.governmentIdDocument) {
      return res.status(400).json({
        success: false,
        message: 'Government ID document is required'
      });
    }

    const govIdFile = req.files.governmentIdDocument[0];
    const profilePhotoFile = req.files.profilePhoto ? req.files.profilePhoto[0] : null;

    // Validate and process referral code if provided
    let referrerAffiliate = null;
    let referralLevel = 0;

    if (referralCode) {
      const referralValidation = await Affiliate.validateReferralCode(referralCode);
      if (!referralValidation.valid) {
        return res.status(400).json({
          success: false,
          message: referralValidation.message
        });
      }

      referrerAffiliate = referralValidation.referrer;
      referralLevel = referralValidation.newLevel;
    }

    // Create affiliate data
    const affiliateData = {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email,
      phone,
      password,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      // Referral information
      referredBy: referrerAffiliate ? referrerAffiliate._id : null,
      referralCode: referralCode || null,
      referralLevel,
      governmentId: {
        type: governmentIdType,
        number: governmentIdNumber,
        document: {
          filename: govIdFile.filename,
          originalName: govIdFile.originalname,
          mimetype: govIdFile.mimetype,
          size: govIdFile.size,
          url: `/uploads/affiliates/${govIdFile.filename}`
        }
      },
      businessName,
      businessType: businessType || 'individual',
      address: {
        street,
        city,
        state,
        country: country || 'India',
        pincode
      },
      commission: {
        type: 'percentage',
        rate: 10, // Default commission rate
        recurringCommission: {
          enabled: true,
          months: 12
        },
        referralCommission: {
          enabled: true,
          oneTimeRate: 5 // 5% one-time commission for referring other affiliates
        }
      },
      status: 'pending_approval',
      kycStatus: 'pending'
    };

    // Add profile photo if uploaded
    if (profilePhotoFile) {
      affiliateData.profilePhoto = {
        filename: profilePhotoFile.filename,
        originalName: profilePhotoFile.originalname,
        mimetype: profilePhotoFile.mimetype,
        size: profilePhotoFile.size,
        url: `/uploads/affiliates/${profilePhotoFile.filename}`
      };
    }

    const affiliate = await Affiliate.create(affiliateData);

    // Update referrer stats if this affiliate was referred
    if (referrerAffiliate) {
      referrerAffiliate.stats.totalAffiliateReferrals += 1;
      await referrerAffiliate.save();
    }

    // Generate OTPs for email and phone verification
    const emailOTP = affiliate.generateOTP('email');
    const phoneOTP = affiliate.generateOTP('phone');

    await affiliate.save();

    // Send verification emails/SMS (implement these functions)
    try {
      await sendEmail({
        email: affiliate.email,
        subject: 'ShelfCure Affiliate - Email Verification',
        message: `Your email verification OTP is: ${emailOTP}. This OTP will expire in 10 minutes.`
      });

      await sendSMS(affiliate.phone, `Your ShelfCure affiliate phone verification OTP is: ${phoneOTP}. Valid for 10 minutes.`);
    } catch (error) {
      console.error('Error sending verification messages:', error);
      // Continue with registration even if messages fail
    }

    res.status(201).json({
      success: true,
      message: 'Affiliate registration successful. Please verify your email and phone number.',
      data: {
        id: affiliate._id,
        name: affiliate.name,
        email: affiliate.email,
        phone: affiliate.phone,
        status: affiliate.status,
        kycStatus: affiliate.kycStatus,
        emailVerified: affiliate.verification.email.verified,
        phoneVerified: affiliate.verification.phone.verified
      }
    });
  } catch (error) {
    console.error('Affiliate registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
});

// @desc    Verify email OTP
// @route   POST /api/affiliate-panel/verify-email
// @access  Public
router.post('/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const affiliate = await Affiliate.findOne({ email });
    
    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate not found'
      });
    }

    const result = affiliate.verifyOTP(otp, 'email');
    
    if (!result.success) {
      await affiliate.save(); // Save updated attempt count
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    await affiliate.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification',
      error: error.message
    });
  }
});

// @desc    Verify phone OTP
// @route   POST /api/affiliate-panel/verify-phone
// @access  Public
router.post('/verify-phone', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone and OTP are required'
      });
    }

    const affiliate = await Affiliate.findOne({ phone });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate not found'
      });
    }

    const result = affiliate.verifyOTP(otp, 'phone');

    if (!result.success) {
      await affiliate.save(); // Save updated attempt count
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    await affiliate.save();

    res.status(200).json({
      success: true,
      message: 'Phone verified successfully'
    });
  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during phone verification',
      error: error.message
    });
  }
});

// @desc    Resend OTP
// @route   POST /api/affiliate-panel/resend-otp
// @access  Public
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, phone, type } = req.body;

    if (!type || !['email', 'phone'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Valid type (email or phone) is required'
      });
    }

    const query = type === 'email' ? { email } : { phone };
    const affiliate = await Affiliate.findOne(query);

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: 'Affiliate not found'
      });
    }

    // Check if already verified
    if (affiliate.verification[type].verified) {
      return res.status(400).json({
        success: false,
        message: `${type} is already verified`
      });
    }

    const otp = affiliate.generateOTP(type);
    await affiliate.save();

    // Send OTP
    try {
      if (type === 'email') {
        await sendEmail({
          email: affiliate.email,
          subject: 'ShelfCure Affiliate - Email Verification',
          message: `Your email verification OTP is: ${otp}. This OTP will expire in 10 minutes.`
        });
      } else {
        await sendSMS(affiliate.phone, `Your ShelfCure affiliate phone verification OTP is: ${otp}. Valid for 10 minutes.`);
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP'
      });
    }

    res.status(200).json({
      success: true,
      message: `OTP sent to your ${type}`
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP resend',
      error: error.message
    });
  }
});

// @desc    Affiliate login
// @route   POST /api/affiliate-panel/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find affiliate with password field
    const affiliate = await Affiliate.findOne({ email }).select('+password');

    if (!affiliate) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await affiliate.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!affiliate.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Generate JWT token
    const token = affiliate.getSignedJwtToken();

    // Remove password from response
    affiliate.password = undefined;

    // Set cookie
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    res.status(200)
      .cookie('affiliateToken', token, cookieOptions)
      .json({
        success: true,
        message: 'Login successful',
        token,
        data: {
          id: affiliate._id,
          name: affiliate.name,
          email: affiliate.email,
          phone: affiliate.phone,
          affiliateCode: affiliate.affiliateCode,
          status: affiliate.status,
          kycStatus: affiliate.kycStatus,
          emailVerified: affiliate.verification.email.verified,
          phoneVerified: affiliate.verification.phone.verified
        }
      });
  } catch (error) {
    console.error('Affiliate login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
});

// @desc    Get affiliate dashboard data
// @route   GET /api/affiliate-panel/dashboard
// @access  Private/Affiliate
router.get('/dashboard', affiliateAuth, async (req, res) => {
  try {
    const affiliate = req.affiliate;

    // Get commission statistics
    const commissionStats = await AffiliateCommission.aggregate([
      { $match: { affiliate: affiliate._id } },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$commissionAmount' },
          pendingEarnings: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$commissionAmount', 0]
            }
          },
          approvedEarnings: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, '$commissionAmount', 0]
            }
          },
          paidEarnings: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$commissionAmount', 0]
            }
          },
          totalCommissions: { $sum: 1 }
        }
      }
    ]);

    // Get referral statistics
    const referralStats = await Store.aggregate([
      { $match: { 'affiliate.affiliateId': affiliate._id } },
      {
        $group: {
          _id: null,
          totalReferrals: { $sum: 1 },
          activeStores: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get recent commissions
    const recentCommissions = await AffiliateCommission.find({ affiliate: affiliate._id })
      .populate('store', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get pharmacy submission statistics
    const pharmacySubmissionStats = await PharmacySubmission.getStatusCounts(affiliate._id);
    const recentSubmissions = await PharmacySubmission.getRecentSubmissions(affiliate._id, 3);

    // Get last 7 days performance
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last7DaysCommissions = await AffiliateCommission.aggregate([
      {
        $match: {
          affiliate: affiliate._id,
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          earnings: { $sum: '$commissionAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get last 7 days pharmacy submissions
    const last7DaysSubmissions = await PharmacySubmission.countDocuments({
      affiliate: affiliate._id,
      submittedDate: { $gte: sevenDaysAgo }
    });

    const stats = commissionStats[0] || {
      totalEarnings: 0,
      pendingEarnings: 0,
      approvedEarnings: 0,
      paidEarnings: 0,
      totalCommissions: 0
    };

    const referrals = referralStats[0] || {
      totalReferrals: 0,
      activeStores: 0
    };

    const last7Days = last7DaysCommissions[0] || {
      earnings: 0,
      count: 0
    };

    res.status(200).json({
      success: true,
      data: {
        affiliate: {
          id: affiliate._id,
          name: affiliate.name,
          email: affiliate.email,
          affiliateCode: affiliate.affiliateCode,
          status: affiliate.status,
          kycStatus: affiliate.kycStatus,
          joinedDate: affiliate.createdAt
        },
        metrics: {
          commissionRate: affiliate.commission.rate,
          lifetimeEarnings: stats.totalEarnings,
          lifetimeReferrals: referrals.totalReferrals,
          last7DaysPerformance: {
            earnings: last7Days.earnings,
            conversions: last7Days.count,
            pharmacySubmissions: last7DaysSubmissions
          }
        },
        earnings: {
          total: stats.totalEarnings,
          pending: stats.pendingEarnings,
          approved: stats.approvedEarnings,
          paid: stats.paidEarnings
        },
        referrals: {
          total: referrals.totalReferrals,
          active: referrals.activeStores,
          conversionRate: referrals.totalReferrals > 0 ?
            ((referrals.activeStores / referrals.totalReferrals) * 100).toFixed(2) : 0
        },
        pharmacySubmissions: {
          total: pharmacySubmissionStats.total,
          pending: pharmacySubmissionStats.pending,
          underReview: pharmacySubmissionStats.under_review,
          approved: pharmacySubmissionStats.approved,
          activated: pharmacySubmissionStats.activated,
          rejected: pharmacySubmissionStats.rejected,
          recent: recentSubmissions.map(submission => ({
            id: submission.submissionId,
            pharmacyName: submission.pharmacyName,
            status: submission.status,
            submittedDate: submission.submittedDate
          }))
        },
        recentActivity: recentCommissions.map(commission => ({
          id: commission._id,
          type: commission.type,
          amount: commission.commissionAmount,
          status: commission.status,
          store: commission.store?.name || 'Unknown Store',
          date: commission.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard data',
      error: error.message
    });
  }
});

// @desc    Get affiliate referrals
// @route   GET /api/affiliate-panel/referrals
// @access  Private/Affiliate
router.get('/referrals', affiliateAuth, async (req, res) => {
  try {
    const affiliate = req.affiliate;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get referred stores
    const referrals = await Store.find({ 'affiliate.affiliateId': affiliate._id })
      .populate('owner', 'name email phone')
      .populate('subscription.plan', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Store.countDocuments({ 'affiliate.affiliateId': affiliate._id });

    // Get commission data for each referral
    const referralsWithCommissions = await Promise.all(
      referrals.map(async (store) => {
        const commissions = await AffiliateCommission.find({
          affiliate: affiliate._id,
          store: store._id
        });

        const totalEarned = commissions.reduce((sum, comm) => sum + comm.commissionAmount, 0);
        const pendingEarnings = commissions
          .filter(comm => comm.status === 'pending')
          .reduce((sum, comm) => sum + comm.commissionAmount, 0);

        return {
          id: store._id,
          name: store.name,
          owner: store.owner,
          status: store.status,
          subscriptionPlan: store.subscription?.plan?.name || 'N/A',
          subscriptionStatus: store.subscription?.status || 'inactive',
          joinedDate: store.createdAt,
          totalEarned,
          pendingEarnings,
          lastCommissionDate: commissions.length > 0 ?
            Math.max(...commissions.map(c => new Date(c.createdAt))) : null
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        referrals: referralsWithCommissions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching referrals',
      error: error.message
    });
  }
});

// @desc    Get affiliate commission history
// @route   GET /api/affiliate-panel/commissions
// @access  Private/Affiliate
router.get('/commissions', affiliateAuth, async (req, res) => {
  try {
    const affiliate = req.affiliate;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { affiliate: affiliate._id };

    // Add filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.type) {
      query.type = req.query.type;
    }
    if (req.query.dateFrom || req.query.dateTo) {
      query.createdAt = {};
      if (req.query.dateFrom) query.createdAt.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) query.createdAt.$lte = new Date(req.query.dateTo);
    }

    const commissions = await AffiliateCommission.find(query)
      .populate('store', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AffiliateCommission.countDocuments(query);

    // Get summary statistics
    const summary = await AffiliateCommission.aggregate([
      { $match: { affiliate: affiliate._id } },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$commissionAmount' },
          pendingEarnings: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$commissionAmount', 0]
            }
          },
          approvedEarnings: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, '$commissionAmount', 0]
            }
          },
          paidEarnings: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$commissionAmount', 0]
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        commissions: commissions.map(commission => ({
          id: commission._id,
          type: commission.type,
          amount: commission.commissionAmount,
          status: commission.status,
          paymentStatus: commission.paymentStatus,
          store: commission.store?.name || 'Unknown Store',
          earnedDate: commission.createdAt,
          dueDate: commission.dueDate,
          paidDate: commission.paidDate,
          description: commission.notes || `${commission.type} commission`
        })),
        summary: summary[0] || {
          totalEarnings: 0,
          pendingEarnings: 0,
          approvedEarnings: 0,
          paidEarnings: 0
        },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    console.error('Get commissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching commissions',
      error: error.message
    });
  }
});

// @desc    Get affiliate profile
// @route   GET /api/affiliate-panel/profile
// @access  Private/Affiliate
router.get('/profile', affiliateAuth, async (req, res) => {
  try {
    const affiliate = req.affiliate;

    res.status(200).json({
      success: true,
      data: {
        id: affiliate._id,
        firstName: affiliate.firstName,
        lastName: affiliate.lastName,
        name: affiliate.name,
        email: affiliate.email,
        phone: affiliate.phone,
        dateOfBirth: affiliate.dateOfBirth,
        gender: affiliate.gender,
        businessName: affiliate.businessName,
        businessType: affiliate.businessType,
        address: affiliate.address,
        affiliateCode: affiliate.affiliateCode,
        referralLink: affiliate.referralLink,
        status: affiliate.status,
        kycStatus: affiliate.kycStatus,
        commission: affiliate.commission,
        paymentDetails: affiliate.paymentDetails,
        taxInfo: affiliate.taxInfo,
        notificationPreferences: affiliate.notificationPreferences,
        joinedDate: affiliate.createdAt,
        emailVerified: affiliate.verification.email.verified,
        phoneVerified: affiliate.verification.phone.verified
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile',
      error: error.message
    });
  }
});

// @desc    Update affiliate profile
// @route   PUT /api/affiliate-panel/profile
// @access  Private/Affiliate
router.put('/profile', affiliateAuth, async (req, res) => {
  try {
    const affiliate = req.affiliate;
    const {
      firstName,
      lastName,
      phone,
      businessName,
      businessType,
      address,
      notificationPreferences
    } = req.body;

    // Update allowed fields
    if (firstName) affiliate.firstName = firstName;
    if (lastName) affiliate.lastName = lastName;
    if (firstName || lastName) affiliate.name = `${affiliate.firstName} ${affiliate.lastName}`;
    if (phone) affiliate.phone = phone;
    if (businessName) affiliate.businessName = businessName;
    if (businessType) affiliate.businessType = businessType;
    if (address) {
      affiliate.address = {
        ...affiliate.address,
        ...address
      };
    }
    if (notificationPreferences) {
      affiliate.notificationPreferences = {
        ...affiliate.notificationPreferences,
        ...notificationPreferences
      };
    }

    await affiliate.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: affiliate._id,
        firstName: affiliate.firstName,
        lastName: affiliate.lastName,
        name: affiliate.name,
        phone: affiliate.phone,
        businessName: affiliate.businessName,
        businessType: affiliate.businessType,
        address: affiliate.address,
        notificationPreferences: affiliate.notificationPreferences
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile',
      error: error.message
    });
  }
});

// @desc    Get commission chart data
// @route   GET /api/affiliate-panel/commissions/chart
// @access  Private/Affiliate
router.get('/commissions/chart', affiliateAuth, async (req, res) => {
  try {
    const affiliate = req.affiliate;
    const { period = '6months' } = req.query;

    // Calculate date range based on period
    let startDate = new Date();
    switch (period) {
      case '1month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 6);
    }

    // Get monthly commission data
    const chartData = await AffiliateCommission.aggregate([
      {
        $match: {
          affiliate: affiliate._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalAmount: { $sum: '$commissionAmount' },
          count: { $sum: 1 },
          pendingAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$commissionAmount', 0]
            }
          },
          approvedAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, '$commissionAmount', 0]
            }
          },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$commissionAmount', 0]
            }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Format data for chart
    const formattedData = chartData.map(item => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      totalAmount: item.totalAmount,
      count: item.count,
      pendingAmount: item.pendingAmount,
      approvedAmount: item.approvedAmount,
      paidAmount: item.paidAmount
    }));

    res.status(200).json({
      success: true,
      data: {
        chartData: formattedData,
        period,
        totalDataPoints: formattedData.length
      }
    });
  } catch (error) {
    console.error('Get chart data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching chart data',
      error: error.message
    });
  }
});

// @desc    Get affiliate payment methods
// @route   GET /api/affiliate-panel/payment-methods
// @access  Private/Affiliate
router.get('/payment-methods', affiliateAuth, async (req, res) => {
  try {
    const affiliate = req.affiliate;

    // Convert affiliate payment details to array format expected by frontend
    const paymentMethods = [];

    // Add bank transfer method if configured
    if (affiliate.paymentDetails?.bankDetails?.accountNumber) {
      paymentMethods.push({
        id: 'bank_transfer',
        type: 'bank',
        isDefault: affiliate.paymentDetails.preferredMethod === 'bank_transfer',
        accountHolderName: affiliate.paymentDetails.bankDetails.accountHolderName || '',
        accountNumber: affiliate.paymentDetails.bankDetails.accountNumber || '',
        ifscCode: affiliate.paymentDetails.bankDetails.ifscCode || '',
        bankName: affiliate.paymentDetails.bankDetails.bankName || ''
      });
    }

    // Add UPI method if configured
    if (affiliate.paymentDetails?.upiId) {
      paymentMethods.push({
        id: 'upi',
        type: 'upi',
        isDefault: affiliate.paymentDetails.preferredMethod === 'upi',
        upiId: affiliate.paymentDetails.upiId
      });
    }

    // Add PayPal method if configured
    if (affiliate.paymentDetails?.paypalEmail) {
      paymentMethods.push({
        id: 'paypal',
        type: 'paypal',
        isDefault: affiliate.paymentDetails.preferredMethod === 'paypal',
        paypalEmail: affiliate.paymentDetails.paypalEmail
      });
    }

    res.status(200).json({
      success: true,
      data: paymentMethods
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching payment methods',
      error: error.message
    });
  }
});

// @desc    Add new payment method
// @route   POST /api/affiliate-panel/payment-methods
// @access  Private/Affiliate
router.post('/payment-methods', affiliateAuth, async (req, res) => {
  try {
    const affiliate = req.affiliate;
    const { type, accountHolderName, accountNumber, ifscCode, upiId, paypalEmail, isDefault } = req.body;

    // Initialize paymentDetails if it doesn't exist
    if (!affiliate.paymentDetails) {
      affiliate.paymentDetails = {};
    }

    // Add payment method based on type
    if (type === 'bank') {
      affiliate.paymentDetails.bankDetails = {
        accountHolderName: accountHolderName || '',
        accountNumber: accountNumber || '',
        ifscCode: ifscCode || '',
        bankName: '' // Can be added later if needed
      };
      if (isDefault) {
        affiliate.paymentDetails.preferredMethod = 'bank_transfer';
      }
    } else if (type === 'upi') {
      affiliate.paymentDetails.upiId = upiId || '';
      if (isDefault) {
        affiliate.paymentDetails.preferredMethod = 'upi';
      }
    } else if (type === 'paypal') {
      affiliate.paymentDetails.paypalEmail = paypalEmail || '';
      if (isDefault) {
        affiliate.paymentDetails.preferredMethod = 'paypal';
      }
    }

    await affiliate.save();

    // Return the added payment method in the expected format
    let addedMethod = {};
    if (type === 'bank') {
      addedMethod = {
        id: 'bank_transfer',
        type: 'bank',
        isDefault: affiliate.paymentDetails.preferredMethod === 'bank_transfer',
        accountHolderName: accountHolderName || '',
        accountNumber: accountNumber || '',
        ifscCode: ifscCode || '',
        bankName: ''
      };
    } else if (type === 'upi') {
      addedMethod = {
        id: 'upi',
        type: 'upi',
        isDefault: affiliate.paymentDetails.preferredMethod === 'upi',
        upiId: upiId || ''
      };
    } else if (type === 'paypal') {
      addedMethod = {
        id: 'paypal',
        type: 'paypal',
        isDefault: affiliate.paymentDetails.preferredMethod === 'paypal',
        paypalEmail: paypalEmail || ''
      };
    }

    res.status(201).json({
      success: true,
      message: 'Payment method added successfully',
      data: addedMethod
    });
  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding payment method',
      error: error.message
    });
  }
});

// @desc    Update payment method
// @route   PUT /api/affiliate-panel/payment-methods/:id
// @access  Private/Affiliate
router.put('/payment-methods/:id', affiliateAuth, async (req, res) => {
  try {
    const affiliate = req.affiliate;
    const { id } = req.params;
    const { accountHolderName, accountNumber, ifscCode, upiId, paypalEmail, isDefault } = req.body;

    // Initialize paymentDetails if it doesn't exist
    if (!affiliate.paymentDetails) {
      affiliate.paymentDetails = {};
    }

    // Update payment method based on ID
    if (id === 'bank_transfer' || id === 'bank') {
      if (!affiliate.paymentDetails.bankDetails) {
        affiliate.paymentDetails.bankDetails = {};
      }
      if (accountHolderName !== undefined) affiliate.paymentDetails.bankDetails.accountHolderName = accountHolderName;
      if (accountNumber !== undefined) affiliate.paymentDetails.bankDetails.accountNumber = accountNumber;
      if (ifscCode !== undefined) affiliate.paymentDetails.bankDetails.ifscCode = ifscCode;

      if (isDefault) {
        affiliate.paymentDetails.preferredMethod = 'bank_transfer';
      }
    } else if (id === 'upi') {
      if (upiId !== undefined) affiliate.paymentDetails.upiId = upiId;
      if (isDefault) {
        affiliate.paymentDetails.preferredMethod = 'upi';
      }
    } else if (id === 'paypal') {
      if (paypalEmail !== undefined) affiliate.paymentDetails.paypalEmail = paypalEmail;
      if (isDefault) {
        affiliate.paymentDetails.preferredMethod = 'paypal';
      }
    }

    await affiliate.save();

    // Return updated payment method
    let updatedMethod = {};
    if (id === 'bank_transfer' || id === 'bank') {
      updatedMethod = {
        id: 'bank_transfer',
        type: 'bank',
        isDefault: affiliate.paymentDetails.preferredMethod === 'bank_transfer',
        accountHolderName: affiliate.paymentDetails.bankDetails?.accountHolderName || '',
        accountNumber: affiliate.paymentDetails.bankDetails?.accountNumber || '',
        ifscCode: affiliate.paymentDetails.bankDetails?.ifscCode || '',
        bankName: affiliate.paymentDetails.bankDetails?.bankName || ''
      };
    } else if (id === 'upi') {
      updatedMethod = {
        id: 'upi',
        type: 'upi',
        isDefault: affiliate.paymentDetails.preferredMethod === 'upi',
        upiId: affiliate.paymentDetails.upiId || ''
      };
    } else if (id === 'paypal') {
      updatedMethod = {
        id: 'paypal',
        type: 'paypal',
        isDefault: affiliate.paymentDetails.preferredMethod === 'paypal',
        paypalEmail: affiliate.paymentDetails.paypalEmail || ''
      };
    }

    res.status(200).json({
      success: true,
      message: 'Payment method updated successfully',
      data: updatedMethod
    });
  } catch (error) {
    console.error('Update payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating payment method',
      error: error.message
    });
  }
});

// @desc    Delete payment method
// @route   DELETE /api/affiliate-panel/payment-methods/:id
// @access  Private/Affiliate
router.delete('/payment-methods/:id', affiliateAuth, async (req, res) => {
  try {
    const affiliate = req.affiliate;
    const { id } = req.params;

    // Initialize paymentDetails if it doesn't exist
    if (!affiliate.paymentDetails) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    // Remove payment method based on ID
    if (id === 'bank_transfer' || id === 'bank') {
      affiliate.paymentDetails.bankDetails = undefined;
      if (affiliate.paymentDetails.preferredMethod === 'bank_transfer') {
        affiliate.paymentDetails.preferredMethod = undefined;
      }
    } else if (id === 'upi') {
      affiliate.paymentDetails.upiId = undefined;
      if (affiliate.paymentDetails.preferredMethod === 'upi') {
        affiliate.paymentDetails.preferredMethod = undefined;
      }
    } else if (id === 'paypal') {
      affiliate.paymentDetails.paypalEmail = undefined;
      if (affiliate.paymentDetails.preferredMethod === 'paypal') {
        affiliate.paymentDetails.preferredMethod = undefined;
      }
    } else {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    await affiliate.save();

    res.status(200).json({
      success: true,
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting payment method',
      error: error.message
    });
  }
});

// @desc    Get affiliate payout history
// @route   GET /api/affiliate-panel/payout-history
// @access  Private/Affiliate
router.get('/payout-history', affiliateAuth, async (req, res) => {
  try {
    const affiliate = req.affiliate;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get paid commissions as payout history
    const payouts = await AffiliateCommission.find({
      affiliate: affiliate._id,
      paymentStatus: 'paid'
    })
    .populate('store', 'name code')
    .sort({ paidDate: -1 })
    .skip(skip)
    .limit(limit);

    const total = await AffiliateCommission.countDocuments({
      affiliate: affiliate._id,
      paymentStatus: 'paid'
    });

    // Format payout data to match frontend expectations
    const formattedPayouts = payouts.map(commission => ({
      id: commission._id,
      date: commission.paidDate || commission.payment?.paidDate || commission.createdAt,
      amount: commission.commissionAmount,
      method: commission.payment?.method || 'bank_transfer',
      transactionId: commission.payment?.transactionId || '',
      status: 'completed',
      store: commission.store?.name || 'Unknown Store',
      type: commission.type,
      processingFee: commission.payment?.processingFee || 0,
      netAmount: commission.payment?.netAmount || commission.commissionAmount,
      notes: commission.payment?.notes || ''
    }));

    res.status(200).json({
      success: true,
      data: formattedPayouts // Return array directly, not nested in payouts object
    });
  } catch (error) {
    console.error('Get payout history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching payout history',
      error: error.message
    });
  }
});

// @desc    Get affiliate tax information
// @route   GET /api/affiliate-panel/tax-info
// @access  Private/Affiliate
router.get('/tax-info', affiliateAuth, async (req, res) => {
  try {
    const affiliate = req.affiliate;

    // Get tax info from affiliate profile based on actual model structure
    const taxInfo = {
      panNumber: affiliate.taxInfo?.panNumber || '',
      gstNumber: affiliate.taxInfo?.gstNumber || '',
      taxStatus: affiliate.businessType || 'individual', // Use businessType from model
      tdsApplicable: affiliate.taxInfo?.tdsApplicable !== undefined ? affiliate.taxInfo.tdsApplicable : true,
      tdsRate: 10, // Fixed rate as per Indian tax law
      exemptionCertificate: null // Not in current model, can be added later
    };

    res.status(200).json({
      success: true,
      data: taxInfo
    });
  } catch (error) {
    console.error('Get tax info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching tax information',
      error: error.message
    });
  }
});

// @desc    Update affiliate tax information
// @route   PUT /api/affiliate-panel/tax-info
// @access  Private/Affiliate
router.put('/tax-info', affiliateAuth, async (req, res) => {
  try {
    const affiliate = req.affiliate;
    const { panNumber, gstNumber, taxStatus, tdsApplicable } = req.body;

    // Initialize taxInfo if it doesn't exist
    if (!affiliate.taxInfo) {
      affiliate.taxInfo = {};
    }

    // Update tax info based on actual model structure
    if (panNumber !== undefined) {
      affiliate.taxInfo.panNumber = panNumber;
    }
    if (gstNumber !== undefined) {
      affiliate.taxInfo.gstNumber = gstNumber;
    }
    if (taxStatus !== undefined) {
      affiliate.businessType = taxStatus; // Update businessType in model
    }
    if (tdsApplicable !== undefined) {
      affiliate.taxInfo.tdsApplicable = tdsApplicable;
    }

    await affiliate.save();

    // Return formatted response
    const responseData = {
      panNumber: affiliate.taxInfo.panNumber || '',
      gstNumber: affiliate.taxInfo.gstNumber || '',
      taxStatus: affiliate.businessType || 'individual',
      tdsApplicable: affiliate.taxInfo.tdsApplicable !== undefined ? affiliate.taxInfo.tdsApplicable : true,
      tdsRate: 10,
      exemptionCertificate: null
    };

    res.status(200).json({
      success: true,
      message: 'Tax information updated successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Update tax info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating tax information',
      error: error.message
    });
  }
});

// @desc    Get marketing resources
// @route   GET /api/affiliate-panel/marketing-resources
// @access  Private/Affiliate
router.get('/marketing-resources', affiliateAuth, async (req, res) => {
  try {
    // Sample marketing resources data
    // In a real application, this would come from a database
    const marketingResources = [
      {
        id: 'logo-1',
        title: 'ShelfCure Primary Logo',
        description: 'High-resolution ShelfCure logo for use in marketing materials',
        type: 'image',
        category: 'logos',
        thumbnailUrl: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=ShelfCure+Logo',
        previewUrl: 'https://via.placeholder.com/800x600/10B981/FFFFFF?text=ShelfCure+Primary+Logo',
        filename: 'shelfcure-logo-primary.png',
        fileSize: '2.5 MB',
        format: 'PNG',
        usageGuidelines: 'Use this logo on light backgrounds. Maintain minimum clear space of 2x the logo height.'
      },
      {
        id: 'logo-2',
        title: 'ShelfCure Logo - White Version',
        description: 'White version of ShelfCure logo for dark backgrounds',
        type: 'image',
        category: 'logos',
        thumbnailUrl: 'https://via.placeholder.com/400x300/000000/FFFFFF?text=ShelfCure+Logo+White',
        previewUrl: 'https://via.placeholder.com/800x600/000000/FFFFFF?text=ShelfCure+White+Logo',
        filename: 'shelfcure-logo-white.png',
        fileSize: '2.3 MB',
        format: 'PNG',
        usageGuidelines: 'Use this logo on dark backgrounds. Maintain minimum clear space of 2x the logo height.'
      },
      {
        id: 'flyer-1',
        title: 'ShelfCure Features Flyer',
        description: 'Comprehensive flyer highlighting key features and benefits',
        type: 'pdf',
        category: 'flyers',
        thumbnailUrl: 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Features+Flyer',
        previewUrl: 'https://via.placeholder.com/800x1000/3B82F6/FFFFFF?text=ShelfCure+Features+PDF',
        filename: 'shelfcure-features-flyer.pdf',
        fileSize: '5.2 MB',
        format: 'PDF',
        usageGuidelines: 'Print in high quality (300 DPI) for best results. Can be used for trade shows and client meetings.'
      },
      {
        id: 'social-1',
        title: 'Instagram Post Template',
        description: 'Ready-to-use Instagram post template with ShelfCure branding',
        type: 'image',
        category: 'social',
        thumbnailUrl: 'https://via.placeholder.com/400x400/E91E63/FFFFFF?text=Instagram+Template',
        previewUrl: 'https://via.placeholder.com/1080x1080/E91E63/FFFFFF?text=Instagram+Post+Template',
        filename: 'instagram-post-template.jpg',
        fileSize: '1.8 MB',
        format: 'JPG',
        usageGuidelines: 'Customize with your own content while maintaining brand colors and fonts.'
      },
      {
        id: 'whatsapp-1',
        title: 'Welcome Message Template',
        description: 'Professional welcome message for new pharmacy clients',
        type: 'text',
        category: 'whatsapp',
        content: '🏥 Welcome to ShelfCure! \n\nWe\'re excited to help you modernize your pharmacy management. \n\n✅ Inventory Management\n✅ Sales Tracking\n✅ Customer Management\n✅ Analytics & Reports\n\nReady to get started? Let\'s schedule a demo: [Your Contact]',
        usageGuidelines: 'Personalize with your contact information and adjust tone as needed for your audience.'
      },
      {
        id: 'whatsapp-2',
        title: 'Feature Highlight Template',
        description: 'Template to highlight specific ShelfCure features',
        type: 'text',
        category: 'whatsapp',
        content: '💊 Did you know ShelfCure can help you:\n\n📊 Track inventory in real-time\n💰 Reduce medicine wastage by 40%\n⚡ Process sales 3x faster\n📱 Manage everything from your phone\n\nInterested in learning more? Reply "DEMO" for a free consultation!',
        usageGuidelines: 'Use this template to educate prospects about specific benefits. Customize statistics based on your experience.'
      },
      {
        id: 'video-1',
        title: 'ShelfCure Demo Video',
        description: '2-minute overview of ShelfCure features and benefits',
        type: 'video',
        category: 'videos',
        thumbnailUrl: 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Demo+Video',
        previewUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        filename: 'shelfcure-demo-video.mp4',
        fileSize: '45.2 MB',
        format: 'MP4',
        usageGuidelines: 'Perfect for social media sharing and client presentations. Can be embedded in emails and websites.'
      },
      {
        id: 'catalog-1',
        title: 'ShelfCure Product Catalog',
        description: 'Complete catalog of ShelfCure features, pricing, and plans',
        type: 'pdf',
        category: 'catalogs',
        thumbnailUrl: 'https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=Product+Catalog',
        previewUrl: 'https://via.placeholder.com/800x1000/8B5CF6/FFFFFF?text=ShelfCure+Catalog+PDF',
        filename: 'shelfcure-product-catalog.pdf',
        fileSize: '8.7 MB',
        format: 'PDF',
        usageGuidelines: 'Use for detailed client discussions and proposal presentations. Keep updated with latest pricing.'
      },
      {
        id: 'social-2',
        title: 'Facebook Cover Template',
        description: 'Facebook cover photo template with ShelfCure branding',
        type: 'image',
        category: 'social',
        thumbnailUrl: 'https://via.placeholder.com/400x200/1877F2/FFFFFF?text=Facebook+Cover',
        previewUrl: 'https://via.placeholder.com/1200x630/1877F2/FFFFFF?text=Facebook+Cover+Template',
        filename: 'facebook-cover-template.jpg',
        fileSize: '2.1 MB',
        format: 'JPG',
        usageGuidelines: 'Use as your Facebook page cover. Ensure text is readable on mobile devices.'
      },
      {
        id: 'flyer-2',
        title: 'Pricing Comparison Sheet',
        description: 'Visual comparison of ShelfCure plans and competitor pricing',
        type: 'pdf',
        category: 'flyers',
        thumbnailUrl: 'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Pricing+Comparison',
        previewUrl: 'https://via.placeholder.com/800x1000/F59E0B/FFFFFF?text=Pricing+Sheet+PDF',
        filename: 'pricing-comparison-sheet.pdf',
        fileSize: '3.4 MB',
        format: 'PDF',
        usageGuidelines: 'Use during sales conversations to demonstrate value proposition. Update quarterly with current pricing.'
      }
    ];

    res.status(200).json({
      success: true,
      data: marketingResources
    });
  } catch (error) {
    console.error('Get marketing resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching marketing resources',
      error: error.message
    });
  }
});

// @desc    Download marketing resource
// @route   GET /api/affiliate-panel/marketing-resources/:id/download
// @access  Private/Affiliate
router.get('/marketing-resources/:id/download', affiliateAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // In a real application, you would:
    // 1. Validate the resource ID exists
    // 2. Get the file path from database
    // 3. Stream the actual file from storage (AWS S3, local filesystem, etc.)

    // For demo purposes, we'll return a placeholder response
    // This would normally stream the actual file content

    const resourceMap = {
      'logo-1': { filename: 'shelfcure-logo-primary.png', contentType: 'image/png' },
      'logo-2': { filename: 'shelfcure-logo-white.png', contentType: 'image/png' },
      'flyer-1': { filename: 'shelfcure-features-flyer.pdf', contentType: 'application/pdf' },
      'social-1': { filename: 'instagram-post-template.jpg', contentType: 'image/jpeg' },
      'video-1': { filename: 'shelfcure-demo-video.mp4', contentType: 'video/mp4' },
      'catalog-1': { filename: 'shelfcure-product-catalog.pdf', contentType: 'application/pdf' },
      'social-2': { filename: 'facebook-cover-template.jpg', contentType: 'image/jpeg' },
      'flyer-2': { filename: 'pricing-comparison-sheet.pdf', contentType: 'application/pdf' }
    };

    const resource = resourceMap[id];

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Marketing resource not found'
      });
    }

    // Set appropriate headers for file download
    res.setHeader('Content-Type', resource.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${resource.filename}"`);

    // In a real implementation, you would stream the actual file here
    // For demo purposes, return a placeholder message
    const placeholderContent = `This is a placeholder for ${resource.filename}. In a real implementation, this would be the actual file content.`;

    res.send(Buffer.from(placeholderContent));

  } catch (error) {
    console.error('Download marketing resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error downloading resource',
      error: error.message
    });
  }
});

// @desc    Get affiliate custom links
// @route   GET /api/affiliate-panel/custom-links
// @access  Private/Affiliate
router.get('/custom-links', affiliateAuth, async (req, res) => {
  try {
    const affiliate = req.affiliate;

    // In a real application, custom links would be stored in database
    // For demo purposes, we'll return sample data based on affiliate
    const customLinks = [
      {
        id: 'custom-1',
        name: 'My Special Offer',
        description: 'Custom landing page with special discount for my clients',
        targetUrl: 'https://shelfcure.com/special-offer',
        campaign: 'special-discount',
        clicks: 45,
        conversions: 8,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      },
      {
        id: 'custom-2',
        name: 'Pharmacy Demo Link',
        description: 'Direct link to schedule a demo for interested pharmacies',
        targetUrl: 'https://shelfcure.com/demo',
        campaign: 'demo-request',
        clicks: 23,
        conversions: 12,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days ago
      },
      {
        id: 'custom-3',
        name: 'WhatsApp Campaign',
        description: 'Link optimized for WhatsApp sharing',
        targetUrl: 'https://shelfcure.com/whatsapp-signup',
        campaign: 'whatsapp-promo',
        clicks: 67,
        conversions: 15,
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString() // 21 days ago
      }
    ];

    res.status(200).json({
      success: true,
      data: customLinks
    });
  } catch (error) {
    console.error('Get custom links error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching custom links',
      error: error.message
    });
  }
});

// @desc    Create new custom link
// @route   POST /api/affiliate-panel/custom-links
// @access  Private/Affiliate
router.post('/custom-links', affiliateAuth, async (req, res) => {
  try {
    const affiliate = req.affiliate;
    const { name, targetUrl, description, campaign } = req.body;

    // Validate required fields
    if (!name || !targetUrl) {
      return res.status(400).json({
        success: false,
        message: 'Name and target URL are required'
      });
    }

    // In a real application, you would save this to database
    // For demo purposes, we'll return a mock created link
    const newCustomLink = {
      id: `custom-${Date.now()}`, // Generate unique ID
      name: name,
      description: description || '',
      targetUrl: targetUrl,
      campaign: campaign || '',
      clicks: 0,
      conversions: 0,
      createdAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Custom link created successfully',
      data: newCustomLink
    });
  } catch (error) {
    console.error('Create custom link error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating custom link',
      error: error.message
    });
  }
});

// @desc    Delete custom link
// @route   DELETE /api/affiliate-panel/custom-links/:id
// @access  Private/Affiliate
router.delete('/custom-links/:id', affiliateAuth, async (req, res) => {
  try {
    const affiliate = req.affiliate;
    const { id } = req.params;

    // In a real application, you would:
    // 1. Verify the link belongs to this affiliate
    // 2. Delete from database
    // 3. Handle any related analytics data

    // For demo purposes, we'll just return success
    res.status(200).json({
      success: true,
      message: 'Custom link deleted successfully'
    });
  } catch (error) {
    console.error('Delete custom link error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting custom link',
      error: error.message
    });
  }
});

// @desc    Generate QR code for affiliate link
// @route   POST /api/affiliate-panel/generate-qr
// @access  Private/Affiliate
router.post('/generate-qr', affiliateAuth, async (req, res) => {
  try {
    const { url, name } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required for QR code generation'
      });
    }

    // In a real application, you would:
    // 1. Use a QR code generation library (like 'qrcode')
    // 2. Generate the actual QR code image
    // 3. Return the image as blob/buffer

    // For demo purposes, we'll return a placeholder response
    const qrCodeData = `QR Code for: ${name || 'Affiliate Link'}\nURL: ${url}\nGenerated: ${new Date().toISOString()}`;

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="qr-${name || 'affiliate-link'}.png"`);

    // Return placeholder QR code data
    res.send(Buffer.from(qrCodeData));

  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating QR code',
      error: error.message
    });
  }
});

// @desc    Get pharmacy submissions
// @route   GET /api/affiliate-panel/pharmacy-submissions
// @access  Private/Affiliate
router.get('/pharmacy-submissions', affiliateAuth, async (req, res) => {
  try {
    console.log('Pharmacy submissions endpoint called');
    console.log('Affiliate:', req.affiliate ? req.affiliate.name : 'None');

    const affiliate = req.affiliate;

    // For demo purposes, return sample pharmacy submissions data
    // In a real application, this would query actual submissions from database
    const sampleSubmissions = [
      {
        id: 'PS001',
        pharmacyName: 'MediCare Pharmacy',
        ownerName: 'Dr. Rajesh Kumar',
        contactNumber: '+91-9876543210',
        email: 'rajesh@medicare.com',
        address: {
          street: '123 Main Street, Medical Complex',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        },
        subscriptionPlan: 'Premium',
        startDate: '2024-02-01',
        status: 'approved',
        submittedDate: '2024-01-15',
        approvedDate: '2024-01-20',
        remarks: 'All documents verified successfully'
      },
      {
        id: 'PS002',
        pharmacyName: 'HealthPlus Pharmacy',
        ownerName: 'Dr. Priya Sharma',
        contactNumber: '+91-9876543211',
        email: 'priya@healthplus.com',
        address: {
          street: '456 Health Avenue',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001'
        },
        subscriptionPlan: 'Standard',
        startDate: '2024-02-15',
        status: 'pending',
        submittedDate: '2024-01-25',
        remarks: 'Under review - awaiting GST certificate verification'
      }
    ];

    res.status(200).json({
      success: true,
      data: sampleSubmissions,
      total: sampleSubmissions.length
    });
  } catch (error) {
    console.error('Get pharmacy submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching pharmacy submissions',
      error: error.message
    });
  }
});

// @desc    Submit pharmacy onboarding
// @route   POST /api/affiliate-panel/pharmacy-submissions
// @access  Private/Affiliate
router.post('/pharmacy-submissions', affiliateAuth, upload.fields([
  { name: 'pharmacyLicense', maxCount: 1 },
  { name: 'gstCertificate', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Pharmacy submission endpoint called');
    console.log('Affiliate:', req.affiliate ? req.affiliate.name : 'None');
    console.log('Form data:', req.body);
    console.log('Files:', req.files);

    const affiliate = req.affiliate;
    const {
      pharmacyName,
      ownerName,
      contactNumber,
      email,
      address,
      subscriptionPlan,
      startDate,
      remarks
    } = req.body;

    // Validate required fields
    if (!pharmacyName || !ownerName || !contactNumber || !email || !subscriptionPlan || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Parse address if it's a string
    let parsedAddress = address;
    if (typeof address === 'string') {
      try {
        parsedAddress = JSON.parse(address);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid address format'
        });
      }
    }

    // Validate address fields
    if (!parsedAddress || !parsedAddress.street || !parsedAddress.city || !parsedAddress.state || !parsedAddress.pincode) {
      return res.status(400).json({
        success: false,
        message: 'Complete address information is required'
      });
    }

    // Check for duplicate email or phone
    const existingSubmission = await PharmacySubmission.findOne({
      $or: [
        { email: email.toLowerCase() },
        { contactNumber }
      ]
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'A pharmacy with this email or contact number has already been submitted'
      });
    }

    // Prepare document data
    const documents = {};
    if (req.files?.pharmacyLicense?.[0]) {
      const licenseFile = req.files.pharmacyLicense[0];
      documents.pharmacyLicense = {
        filename: licenseFile.filename,
        originalName: licenseFile.originalname,
        mimetype: licenseFile.mimetype,
        size: licenseFile.size,
        url: `/uploads/affiliates/${licenseFile.filename}`
      };
    }

    if (req.files?.gstCertificate?.[0]) {
      const gstFile = req.files.gstCertificate[0];
      documents.gstCertificate = {
        filename: gstFile.filename,
        originalName: gstFile.originalname,
        mimetype: gstFile.mimetype,
        size: gstFile.size,
        url: `/uploads/affiliates/${gstFile.filename}`
      };
    }

    // Create pharmacy submission
    const submissionData = {
      affiliate: affiliate._id,
      affiliateCode: affiliate.affiliateCode,
      pharmacyName: pharmacyName.trim(),
      ownerName: ownerName.trim(),
      contactNumber,
      email: email.toLowerCase(),
      address: parsedAddress,
      subscriptionPlan,
      startDate: new Date(startDate),
      remarks: remarks?.trim() || '',
      documents,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      createdBy: affiliate._id
    };

    const pharmacySubmission = await PharmacySubmission.create(submissionData);

    console.log('Pharmacy submission created:', pharmacySubmission.submissionId);

    // Send notification email to admin (optional)
    try {
      await sendEmail({
        email: process.env.ADMIN_EMAIL || 'admin@shelfcure.com',
        subject: 'New Pharmacy Onboarding Submission',
        message: `A new pharmacy onboarding has been submitted by affiliate ${affiliate.name} (${affiliate.affiliateCode}).

Pharmacy Details:
- Name: ${pharmacyName}
- Owner: ${ownerName}
- Email: ${email}
- Phone: ${contactNumber}
- Plan: ${subscriptionPlan}
- Submission ID: ${pharmacySubmission.submissionId}

Please review and approve in the admin panel.`
      });
    } catch (emailError) {
      console.error('Error sending admin notification email:', emailError);
      // Continue with success response even if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Pharmacy onboarding submitted successfully',
      data: {
        submissionId: pharmacySubmission.submissionId,
        status: pharmacySubmission.status,
        submittedDate: pharmacySubmission.submittedDate,
        pharmacyName: pharmacySubmission.pharmacyName,
        ownerName: pharmacySubmission.ownerName
      }
    });
  } catch (error) {
    console.error('Submit pharmacy error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error submitting pharmacy onboarding',
      error: error.message
    });
  }
});

// @desc    Get pharmacy submissions for tracking
// @route   GET /api/affiliate-panel/pharmacy-submissions
// @access  Private/Affiliate
router.get('/pharmacy-submissions', affiliateAuth, async (req, res) => {
  try {
    console.log('Get pharmacy submissions endpoint called');
    console.log('Affiliate:', req.affiliate ? req.affiliate.name : 'None');

    const affiliate = req.affiliate;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    // Build query
    const query = { affiliate: affiliate._id };
    if (status && status !== 'all') {
      query.status = status;
    }

    // Get submissions with pagination
    const submissions = await PharmacySubmission.find(query)
      .sort({ submittedDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('reviewedBy approvedBy rejectedBy', 'name')
      .select('-documents.pharmacyLicense.filename -documents.gstCertificate.filename -ipAddress -userAgent');

    const total = await PharmacySubmission.countDocuments(query);

    // Get status counts for the affiliate
    const statusCounts = await PharmacySubmission.getStatusCounts(affiliate._id);

    res.status(200).json({
      success: true,
      data: submissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      statusCounts
    });
  } catch (error) {
    console.error('Get pharmacy submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching pharmacy submissions',
      error: error.message
    });
  }
});

// @desc    Get single pharmacy submission details
// @route   GET /api/affiliate-panel/pharmacy-submissions/:id
// @access  Private/Affiliate
router.get('/pharmacy-submissions/:id', affiliateAuth, async (req, res) => {
  try {
    const affiliate = req.affiliate;
    const { id } = req.params;

    const submission = await PharmacySubmission.findOne({
      $or: [
        { _id: id },
        { submissionId: id }
      ],
      affiliate: affiliate._id
    }).populate('reviewedBy approvedBy rejectedBy generatedStoreOwner generatedStore', 'name email');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy submission not found'
      });
    }

    res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Get pharmacy submission details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching pharmacy submission details',
      error: error.message
    });
  }
});

// @desc    Get affiliate renewals
// @route   GET /api/affiliate-panel/renewals
// @access  Private/Affiliate
router.get('/renewals', affiliateAuth, async (req, res) => {
  try {
    console.log('Renewals endpoint called');
    console.log('Affiliate:', req.affiliate ? req.affiliate.name : 'None');
    console.log('Query params:', req.query);

    const affiliate = req.affiliate;
    const { status: filterStatus, daysFilter } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get all stores referred by this affiliate with their subscriptions
    const storeQuery = { 'affiliate.affiliateId': affiliate._id };

    const stores = await Store.find(storeQuery)
      .populate('owner', 'name email phone')
      .populate({
        path: 'owner',
        populate: {
          path: 'subscription',
          model: 'Subscription'
        }
      })
      .sort({ createdAt: -1 });

    // Process renewal data
    const renewalData = [];
    const now = new Date();

    for (const store of stores) {
      if (!store.owner) continue;

      // Find the subscription for this store owner
      const subscription = await Subscription.findOne({ storeOwner: store.owner._id });

      if (!subscription) continue;

      const daysUntilExpiry = Math.ceil((subscription.endDate - now) / (1000 * 60 * 60 * 24));

      // Determine status based on days until expiry
      let status = 'active';
      if (daysUntilExpiry < 0) {
        status = 'expired';
      } else if (daysUntilExpiry <= 7) {
        status = 'critical';
      } else if (daysUntilExpiry <= 30) {
        status = 'upcoming';
      }

      // Get reminder count and last reminder for this store
      const reminderStats = await RenewalReminder.aggregate([
        {
          $match: {
            affiliate: affiliate._id,
            store: store._id
          }
        },
        {
          $group: {
            _id: null,
            reminderCount: { $sum: 1 },
            lastReminderSent: { $max: '$reminderDate' },
            totalCommissionEarned: { $sum: '$renewalOutcome.commissionEarned' }
          }
        }
      ]);

      const stats = reminderStats[0] || {
        reminderCount: 0,
        lastReminderSent: null,
        totalCommissionEarned: 0
      };

      // Calculate renewal value based on current plan
      const planConfig = Subscription.getPlanFeatures(subscription.plan);
      const renewalValue = planConfig.pricing.amount;

      const renewalItem = {
        id: store._id,
        storeId: store._id,
        subscriptionId: subscription._id,
        pharmacyName: store.name,
        ownerName: store.owner.name,
        contactNumber: store.owner.phone,
        email: store.owner.email,
        currentPlan: subscription.plan,
        billingDuration: subscription.billingDuration,
        startDate: subscription.startDate,
        expiryDate: subscription.endDate,
        daysUntilExpiry,
        status,
        lastReminderSent: stats.lastReminderSent,
        reminderCount: stats.reminderCount,
        totalEarnings: stats.totalCommissionEarned,
        renewalValue,
        address: store.address,
        subscriptionHistory: [{
          date: subscription.startDate,
          plan: subscription.plan,
          amount: renewalValue,
          status: subscription.status
        }]
      };

      renewalData.push(renewalItem);
    }

    // Apply filters
    let filteredRenewals = renewalData;

    if (filterStatus && filterStatus !== 'all') {
      filteredRenewals = filteredRenewals.filter(renewal => renewal.status === filterStatus);
    }

    if (daysFilter && daysFilter !== 'all') {
      switch (daysFilter) {
        case '7':
          filteredRenewals = filteredRenewals.filter(renewal => renewal.daysUntilExpiry <= 7);
          break;
        case '30':
          filteredRenewals = filteredRenewals.filter(renewal => renewal.daysUntilExpiry <= 30);
          break;
        case '60':
          filteredRenewals = filteredRenewals.filter(renewal => renewal.daysUntilExpiry <= 60);
          break;
      }
    }

    // Apply pagination
    const paginatedRenewals = filteredRenewals.slice(skip, skip + limit);

    console.log(`Returning ${paginatedRenewals.length} renewals after filtering and pagination`);

    res.status(200).json({
      success: true,
      data: paginatedRenewals,
      pagination: {
        page,
        limit,
        total: filteredRenewals.length,
        pages: Math.ceil(filteredRenewals.length / limit)
      },
      summary: {
        totalRenewals: renewalData.length,
        upcomingRenewals: renewalData.filter(r => r.status === 'upcoming').length,
        criticalRenewals: renewalData.filter(r => r.status === 'critical').length,
        expiredRenewals: renewalData.filter(r => r.status === 'expired').length,
        activeRenewals: renewalData.filter(r => r.status === 'active').length,
        totalRenewalValue: renewalData.reduce((sum, r) => sum + (r.renewalValue || 0), 0),
        totalEarnings: renewalData.reduce((sum, r) => sum + (r.totalEarnings || 0), 0)
      }
    });
  } catch (error) {
    console.error('Get renewals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching renewals',
      error: error.message
    });
  }
});

// @desc    Send renewal reminder
// @route   POST /api/affiliate-panel/renewals/:id/reminder
// @access  Private/Affiliate
router.post('/renewals/:id/reminder', affiliateAuth, async (req, res) => {
  try {
    console.log('Send reminder endpoint called');
    console.log('Affiliate:', req.affiliate ? req.affiliate.name : 'None');
    console.log('Renewal ID:', req.params.id);
    console.log('Reminder type:', req.body.type);

    const affiliate = req.affiliate;
    const { id } = req.params;
    const { type = 'email', customMessage } = req.body;

    // Find the store and subscription
    const store = await Store.findOne({
      _id: id,
      'affiliate.affiliateId': affiliate._id
    }).populate('owner', 'name email phone');

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found or not associated with your affiliate account'
      });
    }

    const subscription = await Subscription.findOne({ storeOwner: store.owner._id });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found for this store'
      });
    }

    const daysUntilExpiry = Math.ceil((subscription.endDate - new Date()) / (1000 * 60 * 60 * 24));
    const planConfig = Subscription.getPlanFeatures(subscription.plan);
    const renewalValue = planConfig.pricing.amount;

    // Create reminder record
    const reminderData = {
      affiliate: affiliate._id,
      storeOwner: store.owner._id,
      store: store._id,
      subscription: subscription._id,
      reminderType: type,
      subscriptionDetails: {
        plan: subscription.plan,
        expiryDate: subscription.endDate,
        daysUntilExpiry,
        renewalValue
      },
      customMessage: customMessage || '',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      createdBy: affiliate._id
    };

    // Send the actual reminder
    let reminderSent = false;
    let failureReason = '';

    try {
      if (type === 'email') {
        const subject = `Subscription Renewal Reminder - ${store.name}`;
        const message = customMessage || `Dear ${store.owner.name},

This is a friendly reminder that your ShelfCure subscription for ${store.name} is expiring soon.

Subscription Details:
- Current Plan: ${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
- Expiry Date: ${subscription.endDate.toDateString()}
- Days Remaining: ${daysUntilExpiry} days
- Renewal Amount: ₹${renewalValue}

To ensure uninterrupted service, please renew your subscription before the expiry date.

For any assistance, please contact your affiliate representative ${affiliate.name} or our support team.

Best regards,
ShelfCure Team`;

        await sendEmail({
          email: store.owner.email,
          subject,
          message
        });

        reminderData.subject = subject;
        reminderData.message = message;
        reminderSent = true;

      } else if (type === 'sms') {
        const smsMessage = customMessage || `ShelfCure Reminder: Your subscription for ${store.name} expires in ${daysUntilExpiry} days. Renew now to continue service. Contact ${affiliate.name} for assistance.`;

        await sendSMS(store.owner.phone, smsMessage);
        reminderData.message = smsMessage;
        reminderSent = true;

      } else if (type === 'whatsapp') {
        // For WhatsApp, we'll use SMS for now (can be enhanced with WhatsApp API)
        const whatsappMessage = customMessage || `🏥 *ShelfCure Renewal Reminder*

Dear ${store.owner.name},

Your subscription for *${store.name}* expires in *${daysUntilExpiry} days*.

📅 Expiry: ${subscription.endDate.toDateString()}
💰 Renewal: ₹${renewalValue}

Please renew to continue enjoying ShelfCure services.

Contact: ${affiliate.name}`;

        await sendSMS(store.owner.phone, whatsappMessage);
        reminderData.message = whatsappMessage;
        reminderSent = true;
      }

      if (reminderSent) {
        reminderData.status = 'sent';
        reminderData.deliveryInfo = {
          provider: type === 'email' ? 'email_service' : 'sms_service',
          deliveredAt: new Date()
        };
      }

    } catch (error) {
      console.error(`Error sending ${type} reminder:`, error);
      reminderData.status = 'failed';
      reminderData.deliveryInfo = {
        failureReason: error.message
      };
      failureReason = error.message;
    }

    // Save reminder record
    const reminder = await RenewalReminder.create(reminderData);

    if (reminderSent) {
      res.status(200).json({
        success: true,
        message: `Reminder sent successfully via ${type}`,
        data: {
          reminderId: reminder._id,
          renewalId: id,
          reminderType: type,
          sentAt: reminder.reminderDate,
          sentBy: affiliate.name,
          daysUntilExpiry,
          renewalValue
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Failed to send reminder via ${type}`,
        error: failureReason
      });
    }
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending reminder',
      error: error.message
    });
  }
});

// @desc    Export renewals data
// @route   GET /api/affiliate-panel/renewals/export
// @access  Private/Affiliate
router.get('/renewals/export', affiliateAuth, async (req, res) => {
  try {
    console.log('Export renewals endpoint called');
    console.log('Affiliate:', req.affiliate ? req.affiliate.name : 'None');

    const affiliate = req.affiliate;
    const { status: filterStatus, daysFilter } = req.query;

    // In a real application, this would generate actual CSV data
    // For demo purposes, return sample CSV content
    const csvContent = `Pharmacy Name,Owner Name,Contact,Email,Current Plan,Expiry Date,Days Until Expiry,Status,Total Earnings,Renewal Value
MediCare Pharmacy,Dr. Rajesh Kumar,+91-9876543210,rajesh@medicare.com,Premium,2024-03-15,25,upcoming,15000,25000
HealthPlus Pharmacy,Dr. Priya Sharma,+91-9876543211,priya@healthplus.com,Standard,2024-02-28,8,critical,8000,15000
WellCare Pharmacy,Dr. Amit Patel,+91-9876543212,amit@wellcare.com,Basic,2024-04-10,51,upcoming,5000,10000
CityMed Pharmacy,Dr. Sunita Reddy,+91-9876543213,sunita@citymed.com,Premium,2024-02-20,0,expired,20000,25000`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=renewals.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export renewals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error exporting renewals',
      error: error.message
    });
  }
});

// @desc    Get affiliate notification settings
// @route   GET /api/affiliate-panel/notification-settings
// @access  Private/Affiliate
router.get('/notification-settings', affiliateAuth, async (req, res) => {
  try {
    console.log('Notification settings endpoint called');
    console.log('Affiliate:', req.affiliate ? req.affiliate.name : 'None');

    const affiliate = req.affiliate;

    // Get notification preferences from affiliate model or return defaults
    const notificationSettings = {
      channels: {
        email: true,
        whatsapp: true,
        sms: false,
        push: true
      },
      notifications: {
        newSale: {
          enabled: affiliate.notificationPreferences?.email?.newSale !== undefined ?
            affiliate.notificationPreferences.email.newSale : true,
          channels: ['email', 'whatsapp']
        },
        commissionCredited: {
          enabled: affiliate.notificationPreferences?.email?.commissionCredited !== undefined ?
            affiliate.notificationPreferences.email.commissionCredited : true,
          channels: ['email', 'whatsapp', 'push']
        },
        payoutReleased: {
          enabled: affiliate.notificationPreferences?.email?.payoutReleased !== undefined ?
            affiliate.notificationPreferences.email.payoutReleased : true,
          channels: ['email', 'whatsapp', 'sms']
        },
        promotionalUpdate: {
          enabled: affiliate.notificationPreferences?.email?.promotionalMaterial !== undefined ?
            affiliate.notificationPreferences.email.promotionalMaterial : true,
          channels: ['email']
        },
        offerAlert: {
          enabled: affiliate.notificationPreferences?.email?.offerAlerts !== undefined ?
            affiliate.notificationPreferences.email.offerAlerts : true,
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
        digestFrequency: affiliate.notificationPreferences?.digestFrequency || 'immediate',
        quietHours: {
          enabled: true,
          startTime: '22:00',
          endTime: '08:00'
        },
        timezone: 'Asia/Kolkata'
      }
    };

    console.log('Returning notification settings for affiliate:', affiliate._id);

    res.status(200).json({
      success: true,
      data: notificationSettings
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching notification settings',
      error: error.message
    });
  }
});

// @desc    Update affiliate notification settings
// @route   PUT /api/affiliate-panel/notification-settings
// @access  Private/Affiliate
router.put('/notification-settings', affiliateAuth, async (req, res) => {
  try {
    console.log('Update notification settings endpoint called');
    console.log('Affiliate:', req.affiliate ? req.affiliate.name : 'None');
    console.log('Settings data:', JSON.stringify(req.body, null, 2));

    const affiliate = req.affiliate;
    const { channels, notifications, preferences } = req.body;

    // Validate the settings structure
    if (!channels || !notifications) {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings structure. Channels and notifications are required.'
      });
    }

    // Update affiliate notification preferences
    const updatedPreferences = {
      email: {
        newSale: notifications.newSale?.enabled || false,
        commissionCredited: notifications.commissionCredited?.enabled || false,
        payoutReleased: notifications.payoutReleased?.enabled || false,
        promotionalMaterial: notifications.promotionalUpdate?.enabled || false,
        offerAlerts: notifications.offerAlert?.enabled || false
      },
      whatsapp: {
        newSale: notifications.newSale?.channels?.includes('whatsapp') || false,
        commissionCredited: notifications.commissionCredited?.channels?.includes('whatsapp') || false,
        payoutReleased: notifications.payoutReleased?.channels?.includes('whatsapp') || false,
        promotionalMaterial: notifications.promotionalUpdate?.channels?.includes('whatsapp') || false,
        offerAlerts: notifications.offerAlert?.channels?.includes('whatsapp') || false
      },
      sms: {
        newSale: notifications.newSale?.channels?.includes('sms') || false,
        commissionCredited: notifications.commissionCredited?.channels?.includes('sms') || false,
        payoutReleased: notifications.payoutReleased?.channels?.includes('sms') || false,
        promotionalMaterial: notifications.promotionalUpdate?.channels?.includes('sms') || false,
        offerAlerts: notifications.offerAlert?.channels?.includes('sms') || false
      },
      digestFrequency: preferences?.digestFrequency || 'immediate'
    };

    // In a real application, you would update the affiliate record in the database
    // For demo purposes, we'll just return success
    console.log('Updated notification preferences:', JSON.stringify(updatedPreferences, null, 2));

    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully',
      data: {
        channels,
        notifications,
        preferences,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating notification settings',
      error: error.message
    });
  }
});

// @desc    Get affiliate training progress
// @route   GET /api/affiliate-panel/training-progress
// @access  Private/Affiliate
router.get('/training-progress', affiliateAuth, async (req, res) => {
  try {
    console.log('Training progress endpoint called');
    console.log('Affiliate:', req.affiliate ? req.affiliate.name : 'None');

    const affiliate = req.affiliate;

    // Sample training progress data
    const trainingProgress = {
      completedModules: [
        'getting-started-1',
        'getting-started-2',
        'marketing-basics-1'
      ],
      progress: {
        totalModules: 24,
        completedModules: 3,
        certificatesEarned: 0
      },
      categories: {
        'getting-started': {
          completed: 2,
          total: 4,
          percentage: 50
        },
        'marketing-basics': {
          completed: 1,
          total: 6,
          percentage: 17
        },
        'advanced-strategies': {
          completed: 0,
          total: 8,
          percentage: 0
        },
        'tools-resources': {
          completed: 0,
          total: 6,
          percentage: 0
        }
      }
    };

    console.log('Returning training progress for affiliate:', affiliate._id);

    res.status(200).json({
      success: true,
      data: trainingProgress
    });
  } catch (error) {
    console.error('Get training progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching training progress',
      error: error.message
    });
  }
});

// @desc    Mark training module as complete
// @route   POST /api/affiliate-panel/training-progress/:moduleId/complete
// @access  Private/Affiliate
router.post('/training-progress/:moduleId/complete', affiliateAuth, async (req, res) => {
  try {
    console.log('Mark module complete endpoint called');
    console.log('Affiliate:', req.affiliate ? req.affiliate.name : 'None');
    console.log('Module ID:', req.params.moduleId);

    const affiliate = req.affiliate;
    const { moduleId } = req.params;

    // In a real application, this would update the database
    // For demo purposes, just return success
    res.status(200).json({
      success: true,
      message: 'Module marked as complete',
      data: {
        moduleId,
        completedAt: new Date(),
        affiliate: affiliate._id
      }
    });
  } catch (error) {
    console.error('Mark module complete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking module complete',
      error: error.message
    });
  }
});

// @desc    Get affiliate support tickets
// @route   GET /api/affiliate-panel/support-tickets
// @access  Private/Affiliate
router.get('/support-tickets', affiliateAuth, async (req, res) => {
  try {
    console.log('Support tickets endpoint called');
    console.log('Affiliate:', req.affiliate ? req.affiliate.name : 'None');

    const affiliate = req.affiliate;

    // Sample support tickets data
    const supportTickets = [
      {
        id: 'TKT001',
        subject: 'Commission calculation query',
        status: 'open',
        priority: 'medium',
        category: 'billing',
        createdAt: '2024-02-15T10:30:00Z',
        updatedAt: '2024-02-16T14:20:00Z',
        messages: [
          {
            id: 'MSG001',
            sender: 'affiliate',
            message: 'I have a question about how my commission is calculated for recurring subscriptions.',
            timestamp: '2024-02-15T10:30:00Z'
          },
          {
            id: 'MSG002',
            sender: 'support',
            message: 'Thank you for reaching out. I\'ll be happy to explain our commission structure for recurring subscriptions.',
            timestamp: '2024-02-16T14:20:00Z'
          }
        ]
      },
      {
        id: 'TKT002',
        subject: 'Marketing materials request',
        status: 'resolved',
        priority: 'low',
        category: 'marketing',
        createdAt: '2024-02-10T09:15:00Z',
        updatedAt: '2024-02-12T16:45:00Z',
        messages: [
          {
            id: 'MSG003',
            sender: 'affiliate',
            message: 'Could you provide updated marketing banners for the new pharmacy management features?',
            timestamp: '2024-02-10T09:15:00Z'
          },
          {
            id: 'MSG004',
            sender: 'support',
            message: 'I\'ve uploaded the new marketing materials to your resources section. You can download them from the Marketing Resources page.',
            timestamp: '2024-02-12T16:45:00Z'
          }
        ]
      }
    ];

    console.log(`Returning ${supportTickets.length} support tickets for affiliate:`, affiliate._id);

    res.status(200).json({
      success: true,
      data: supportTickets,
      total: supportTickets.length
    });
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching support tickets',
      error: error.message
    });
  }
});

// @desc    Create new support ticket
// @route   POST /api/affiliate-panel/support-tickets
// @access  Private/Affiliate
router.post('/support-tickets', affiliateAuth, async (req, res) => {
  try {
    console.log('Create support ticket endpoint called');
    console.log('Affiliate:', req.affiliate ? req.affiliate.name : 'None');
    console.log('Ticket data:', req.body);

    const affiliate = req.affiliate;
    const { subject, category, priority, message } = req.body;

    // Validate required fields
    if (!subject || !category || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject, category, and message are required'
      });
    }

    // In a real application, this would create a ticket in the database
    const newTicket = {
      id: 'TKT' + Date.now().toString().slice(-6),
      subject,
      category,
      priority: priority || 'medium',
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
      affiliate: affiliate._id,
      messages: [
        {
          id: 'MSG' + Date.now().toString().slice(-6),
          sender: 'affiliate',
          message,
          timestamp: new Date()
        }
      ]
    };

    console.log('Support ticket created:', newTicket.id);

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: newTicket
    });
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating support ticket',
      error: error.message
    });
  }
});

// @desc    Get affiliate custom links
// @route   GET /api/affiliate-panel/custom-links
// @access  Private/Affiliate
router.get('/custom-links', affiliateAuth, async (req, res) => {
  try {
    console.log('Custom links endpoint called');
    console.log('Affiliate:', req.affiliate ? req.affiliate.name : 'None');

    const affiliate = req.affiliate;

    // Sample custom links data
    const customLinks = [
      {
        id: 'LINK001',
        name: 'Pharmacy Sign-Up Special',
        url: `https://shelfcure.com/register?ref=${affiliate.affiliateCode}&campaign=signup-special`,
        description: 'Special promotion for new pharmacy registrations',
        clicks: 145,
        conversions: 12,
        conversionRate: 8.3,
        earnings: 15000,
        isActive: true,
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'LINK002',
        name: 'Premium Plan Promotion',
        url: `https://shelfcure.com/plans/premium?ref=${affiliate.affiliateCode}&campaign=premium-promo`,
        description: 'Promote premium subscription plans',
        clicks: 89,
        conversions: 7,
        conversionRate: 7.9,
        earnings: 8750,
        isActive: true,
        createdAt: '2024-01-20T14:30:00Z'
      },
      {
        id: 'LINK003',
        name: 'Free Trial Campaign',
        url: `https://shelfcure.com/trial?ref=${affiliate.affiliateCode}&campaign=free-trial`,
        description: '30-day free trial promotion',
        clicks: 234,
        conversions: 18,
        conversionRate: 7.7,
        earnings: 0, // Free trial, earnings come later
        isActive: false,
        createdAt: '2024-01-10T09:15:00Z'
      }
    ];

    console.log(`Returning ${customLinks.length} custom links for affiliate:`, affiliate._id);

    res.status(200).json({
      success: true,
      data: customLinks,
      total: customLinks.length
    });
  } catch (error) {
    console.error('Get custom links error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching custom links',
      error: error.message
    });
  }
});

// @desc    Create new custom link
// @route   POST /api/affiliate-panel/custom-links
// @access  Private/Affiliate
router.post('/custom-links', affiliateAuth, async (req, res) => {
  try {
    console.log('Create custom link endpoint called');
    console.log('Affiliate:', req.affiliate ? req.affiliate.name : 'None');
    console.log('Link data:', req.body);

    const affiliate = req.affiliate;
    const { name, campaign, description } = req.body;

    // Validate required fields
    if (!name || !campaign) {
      return res.status(400).json({
        success: false,
        message: 'Name and campaign are required'
      });
    }

    // In a real application, this would create a link in the database
    const newLink = {
      id: 'LINK' + Date.now().toString().slice(-6),
      name,
      url: `https://shelfcure.com/register?ref=${affiliate.affiliateCode}&campaign=${campaign}`,
      description: description || '',
      clicks: 0,
      conversions: 0,
      conversionRate: 0,
      earnings: 0,
      isActive: true,
      createdAt: new Date()
    };

    console.log('Custom link created:', newLink.id);

    res.status(201).json({
      success: true,
      message: 'Custom link created successfully',
      data: newLink
    });
  } catch (error) {
    console.error('Create custom link error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating custom link',
      error: error.message
    });
  }
});

// @desc    Get affiliate analytics data
// @route   GET /api/affiliate-panel/analytics
// @access  Private/Affiliate
router.get('/analytics', affiliateAuth, async (req, res) => {
  try {
    console.log('Analytics endpoint called');
    console.log('Affiliate:', req.affiliate ? req.affiliate.name : 'None');
    console.log('Database connected:', global.isDatabaseConnected);

    const affiliate = req.affiliate;
    const { days = '30' } = req.query;
    const daysNum = parseInt(days);

    console.log('Days requested:', daysNum);

    // In a real application, this would query actual analytics data from database
    // For demo purposes, we'll return realistic sample data

    // Generate sample earnings data for the chart
    const earningsData = [];
    const referralsData = [];
    const conversionsData = [];

    for (let i = daysNum - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      earningsData.push({
        date: date.toISOString().split('T')[0],
        value: Math.floor(Math.random() * 500) + 100 // Random earnings between 100-600
      });

      referralsData.push({
        date: date.toISOString().split('T')[0],
        value: Math.floor(Math.random() * 10) + 2 // Random referrals between 2-12
      });

      conversionsData.push({
        date: date.toISOString().split('T')[0],
        value: Math.floor(Math.random() * 5) + 1 // Random conversions between 1-6
      });
    }

    // Calculate totals
    const totalEarnings = earningsData.reduce((sum, item) => sum + item.value, 0);
    const totalReferrals = referralsData.reduce((sum, item) => sum + item.value, 0);
    const totalConversions = conversionsData.reduce((sum, item) => sum + item.value, 0);

    const analyticsData = {
      overview: {
        totalEarnings: totalEarnings,
        totalReferrals: totalReferrals,
        conversionRate: totalReferrals > 0 ? (totalConversions / totalReferrals) * 100 : 0,
        avgOrderValue: totalConversions > 0 ? totalEarnings / totalConversions : 0,
        clickThroughRate: 3.2, // Sample CTR
        topPerformingLink: 'Pharmacy Sign-Up'
      },
      trends: {
        earningsData: earningsData,
        referralsData: referralsData,
        conversionsData: conversionsData
      },
      performance: {
        bySource: [
          { name: 'Direct Links', referrals: Math.floor(totalReferrals * 0.4), earnings: Math.floor(totalEarnings * 0.45) },
          { name: 'WhatsApp', referrals: Math.floor(totalReferrals * 0.3), earnings: Math.floor(totalEarnings * 0.25) },
          { name: 'Social Media', referrals: Math.floor(totalReferrals * 0.2), earnings: Math.floor(totalEarnings * 0.20) },
          { name: 'Email', referrals: Math.floor(totalReferrals * 0.1), earnings: Math.floor(totalEarnings * 0.10) }
        ],
        byTimeOfDay: [
          { hour: '9 AM', referrals: 5, earnings: 250 },
          { hour: '12 PM', referrals: 8, earnings: 400 },
          { hour: '3 PM', referrals: 12, earnings: 600 },
          { hour: '6 PM', referrals: 15, earnings: 750 },
          { hour: '9 PM', referrals: 10, earnings: 500 }
        ],
        byDayOfWeek: [
          { day: 'Monday', referrals: Math.floor(totalReferrals * 0.18), earnings: Math.floor(totalEarnings * 0.20) },
          { day: 'Tuesday', referrals: Math.floor(totalReferrals * 0.16), earnings: Math.floor(totalEarnings * 0.15) },
          { day: 'Wednesday', referrals: Math.floor(totalReferrals * 0.14), earnings: Math.floor(totalEarnings * 0.12) },
          { day: 'Thursday', referrals: Math.floor(totalReferrals * 0.15), earnings: Math.floor(totalEarnings * 0.18) },
          { day: 'Friday', referrals: Math.floor(totalReferrals * 0.12), earnings: Math.floor(totalEarnings * 0.10) },
          { day: 'Saturday', referrals: Math.floor(totalReferrals * 0.13), earnings: Math.floor(totalEarnings * 0.13) },
          { day: 'Sunday', referrals: Math.floor(totalReferrals * 0.12), earnings: Math.floor(totalEarnings * 0.12) }
        ],
        topLinks: [
          { name: 'Pharmacy Sign-Up', clicks: 245, conversions: 28, earnings: Math.floor(totalEarnings * 0.35) },
          { name: 'Homepage', clicks: 189, conversions: 15, earnings: Math.floor(totalEarnings * 0.25) },
          { name: 'Subscription Plans', clicks: 156, conversions: 12, earnings: Math.floor(totalEarnings * 0.20) },
          { name: 'Demo Request', clicks: 98, conversions: 8, earnings: Math.floor(totalEarnings * 0.15) },
          { name: 'Special Offer', clicks: 67, conversions: 5, earnings: Math.floor(totalEarnings * 0.05) }
        ]
      },
      goals: {
        monthlyTarget: 10000, // ₹10,000 monthly target
        currentProgress: Math.min(totalEarnings, 10000),
        daysRemaining: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()
      }
    };

    console.log('Analytics data prepared successfully');

    res.status(200).json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error fetching analytics data',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @desc    Get marketing resources
// @route   GET /api/affiliate-panel/marketing-resources
// @access  Private/Affiliate
router.get('/marketing-resources', affiliateAuth, async (req, res) => {
  try {
    console.log('Get marketing resources endpoint called');
    console.log('Affiliate:', req.affiliate ? req.affiliate.name : 'None');

    // Sample marketing resources data
    const marketingResources = [
      {
        id: 'MR001',
        title: 'ShelfCure Logo Pack',
        description: 'Official ShelfCure logos in various formats and sizes',
        category: 'logos',
        type: 'image',
        format: 'ZIP',
        size: '2.5 MB',
        downloads: 145,
        filename: 'shelfcure-logo-pack.zip',
        thumbnailUrl: '/api/marketing-resources/thumbnails/logo-pack.jpg',
        shareUrl: 'https://shelfcure.com/resources/logo-pack',
        usageGuidelines: 'Use only for promotional purposes. Do not modify the logo.',
        createdAt: new Date('2024-01-15')
      },
      {
        id: 'MR002',
        title: 'Pharmacy Benefits Flyer',
        description: 'Highlight key benefits of ShelfCure for pharmacy owners',
        category: 'flyers',
        type: 'pdf',
        format: 'PDF',
        size: '1.8 MB',
        downloads: 89,
        filename: 'pharmacy-benefits-flyer.pdf',
        thumbnailUrl: '/api/marketing-resources/thumbnails/benefits-flyer.jpg',
        shareUrl: 'https://shelfcure.com/resources/benefits-flyer',
        usageGuidelines: 'Print in high quality for best results.',
        createdAt: new Date('2024-01-20')
      },
      {
        id: 'MR003',
        title: 'WhatsApp Welcome Message',
        description: 'Professional welcome message template for new pharmacy contacts',
        category: 'whatsapp',
        type: 'text',
        format: 'TEXT',
        size: '1 KB',
        downloads: 234,
        filename: 'whatsapp-welcome.txt',
        content: `🏥 Welcome to ShelfCure!

I'm [Your Name], your dedicated Medical Representative.

ShelfCure offers:
✅ Complete pharmacy management
✅ Inventory tracking
✅ Sales analytics
✅ Customer management
✅ 24/7 support

Ready to transform your pharmacy? Let's schedule a demo!

Contact: [Your Phone]
Email: [Your Email]`,
        shareUrl: 'https://shelfcure.com/resources/whatsapp-welcome',
        usageGuidelines: 'Personalize with your name and contact details.',
        createdAt: new Date('2024-01-25')
      },
      {
        id: 'MR004',
        title: 'Product Demo Video',
        description: '5-minute overview of ShelfCure features and benefits',
        category: 'videos',
        type: 'video',
        format: 'MP4',
        size: '45 MB',
        downloads: 67,
        filename: 'shelfcure-demo.mp4',
        thumbnailUrl: '/api/marketing-resources/thumbnails/demo-video.jpg',
        shareUrl: 'https://shelfcure.com/resources/demo-video',
        usageGuidelines: 'Share via WhatsApp or email. Do not re-upload to other platforms.',
        createdAt: new Date('2024-02-01')
      },
      {
        id: 'MR005',
        title: 'Social Media Post Templates',
        description: 'Ready-to-use social media posts for Facebook and Instagram',
        category: 'social',
        type: 'image',
        format: 'ZIP',
        size: '8.2 MB',
        downloads: 156,
        filename: 'social-media-templates.zip',
        thumbnailUrl: '/api/marketing-resources/thumbnails/social-templates.jpg',
        shareUrl: 'https://shelfcure.com/resources/social-templates',
        usageGuidelines: 'Customize with your contact information before posting.',
        createdAt: new Date('2024-02-05')
      }
    ];

    res.status(200).json({
      success: true,
      data: marketingResources,
      total: marketingResources.length
    });

  } catch (error) {
    console.error('Get marketing resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching marketing resources',
      error: error.message
    });
  }
});

// @desc    Download marketing resource
// @route   GET /api/affiliate-panel/marketing-resources/:id/download
// @access  Private/Affiliate
router.get('/marketing-resources/:id/download', affiliateAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // In a real application, this would:
    // 1. Find the resource in the database
    // 2. Check affiliate permissions
    // 3. Stream the actual file
    // 4. Update download count

    // For demo purposes, return a sample file
    res.setHeader('Content-Disposition', `attachment; filename="resource-${id}.txt"`);
    res.setHeader('Content-Type', 'text/plain');
    res.send(`Sample marketing resource content for ID: ${id}\n\nThis would be the actual file content in a real implementation.`);

  } catch (error) {
    console.error('Download marketing resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error downloading resource',
      error: error.message
    });
  }
});

// @desc    Get QR codes
// @route   GET /api/affiliate-panel/qr-codes
// @access  Private/Affiliate
router.get('/qr-codes', affiliateAuth, async (req, res) => {
  try {
    console.log('Get QR codes endpoint called');
    console.log('Affiliate:', req.affiliate ? req.affiliate.name : 'None');

    const affiliate = req.affiliate;

    // Sample QR codes data
    const qrCodes = [
      {
        id: 'QR001',
        title: 'Affiliate Link QR',
        description: 'QR code for your main affiliate registration link',
        type: 'affiliate_link',
        url: `https://shelfcure.com/register?ref=${affiliate.affiliateCode}`,
        imageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://shelfcure.com/register?ref=${affiliate.affiliateCode}`)}`,
        scans: 45,
        createdAt: new Date('2024-01-10')
      },
      {
        id: 'QR002',
        title: 'Demo Request QR',
        description: 'QR code for demo request page',
        type: 'demo_request',
        url: `https://shelfcure.com/demo?ref=${affiliate.affiliateCode}`,
        imageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://shelfcure.com/demo?ref=${affiliate.affiliateCode}`)}`,
        scans: 23,
        createdAt: new Date('2024-01-15')
      }
    ];

    res.status(200).json({
      success: true,
      data: qrCodes,
      total: qrCodes.length
    });

  } catch (error) {
    console.error('Get QR codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching QR codes',
      error: error.message
    });
  }
});

// @desc    Generate new QR code
// @route   POST /api/affiliate-panel/qr-codes/generate
// @access  Private/Affiliate
router.post('/qr-codes/generate', affiliateAuth, async (req, res) => {
  try {
    console.log('Generate QR code endpoint called');
    console.log('Affiliate:', req.affiliate ? req.affiliate.name : 'None');

    const affiliate = req.affiliate;
    const { type, data, title, description } = req.body;

    // Generate URL based on type
    let url;
    switch (type) {
      case 'affiliate_link':
        url = `https://shelfcure.com/register?ref=${affiliate.affiliateCode}`;
        break;
      case 'demo_request':
        url = `https://shelfcure.com/demo?ref=${affiliate.affiliateCode}`;
        break;
      case 'custom_link':
        url = data.url || `https://shelfcure.com?ref=${affiliate.affiliateCode}`;
        break;
      default:
        url = `https://shelfcure.com?ref=${affiliate.affiliateCode}`;
    }

    // Generate QR code using external service (in production, you might want to use a library)
    const imageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

    const newQrCode = {
      id: 'QR' + Date.now().toString().slice(-6),
      title: title || `${type.replace('_', ' ')} QR Code`,
      description: description || `QR code for ${type.replace('_', ' ')}`,
      type,
      url,
      imageUrl,
      scans: 0,
      createdAt: new Date()
    };

    // In a real application, this would be saved to the database
    res.status(201).json({
      success: true,
      data: newQrCode,
      message: 'QR code generated successfully'
    });

  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating QR code',
      error: error.message
    });
  }
});

// @desc    Download QR code
// @route   GET /api/affiliate-panel/qr-codes/:id/download
// @access  Private/Affiliate
router.get('/qr-codes/:id/download', affiliateAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // In a real application, this would:
    // 1. Find the QR code in the database
    // 2. Generate or retrieve the actual image file
    // 3. Stream the image file

    // For demo purposes, redirect to the QR code service
    const affiliate = req.affiliate;
    const url = `https://shelfcure.com/register?ref=${affiliate.affiliateCode}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}`;

    // Fetch the image and return it
    const response = await axios.get(qrImageUrl, { responseType: 'stream' });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="qr-code-${id}.png"`);

    response.data.pipe(res);

  } catch (error) {
    console.error('Download QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error downloading QR code',
      error: error.message
    });
  }
});

// ==================== REFERRAL MANAGEMENT ROUTES ====================

// @desc    Get affiliate's referral dashboard data
// @route   GET /api/affiliate-panel/referrals/dashboard
// @access  Private/Affiliate
router.get('/referrals/dashboard', affiliateAuth, async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.affiliate.id);

    // Check if affiliate can refer others (Level 2 cannot refer)
    const canRefer = affiliate.referralLevel < 2;

    // Get referral invitation statistics
    const invitationStats = await AffiliateReferralInvitation.getInvitationStats(affiliate._id);

    // Get direct referrals (affiliates referred by this affiliate)
    const directReferrals = await affiliate.getDirectReferrals();

    // Get referral commissions earned
    const referralCommissions = await AffiliateCommission.find({
      affiliate: affiliate._id,
      type: 'referral_onetime'
    }).populate('sellingAffiliate', 'name email affiliateCode')
      .sort({ earnedDate: -1 })
      .limit(10);

    // Calculate referral earnings
    const referralEarnings = await AffiliateCommission.aggregate([
      {
        $match: {
          affiliate: affiliate._id,
          type: 'referral_onetime'
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$commissionAmount' },
          pendingEarnings: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$commissionAmount', 0]
            }
          },
          paidEarnings: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$commissionAmount', 0]
            }
          }
        }
      }
    ]);

    const earnings = referralEarnings[0] || {
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0
    };

    res.json({
      success: true,
      data: {
        affiliate: {
          id: affiliate._id,
          name: affiliate.name,
          affiliateCode: affiliate.affiliateCode,
          referralLevel: affiliate.referralLevel,
          canRefer,
          referralLink: affiliate.referralLink
        },
        invitationStats,
        directReferrals: directReferrals.map(ref => ({
          id: ref._id,
          name: ref.name,
          email: ref.email,
          affiliateCode: ref.affiliateCode,
          status: ref.status,
          createdAt: ref.createdAt,
          totalEarnings: ref.stats.totalEarnings || 0,
          totalReferrals: ref.stats.totalReferrals || 0
        })),
        recentCommissions: referralCommissions.map(comm => ({
          id: comm._id,
          amount: comm.commissionAmount,
          status: comm.status,
          paymentStatus: comm.paymentStatus,
          earnedDate: comm.earnedDate,
          sellingAffiliate: comm.sellingAffiliate
        })),
        earnings
      }
    });
  } catch (error) {
    console.error('Get referral dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting referral dashboard',
      error: error.message
    });
  }
});

// @desc    Send referral invitation
// @route   POST /api/affiliate-panel/referrals/invite
// @access  Private/Affiliate
router.post('/referrals/invite', affiliateAuth, async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.affiliate.id);

    // Check if affiliate can refer others
    if (affiliate.referralLevel >= 2) {
      return res.status(400).json({
        success: false,
        message: 'You have reached the maximum referral level and cannot refer new affiliates.'
      });
    }

    const { inviteeEmail, inviteeName, inviteePhone, personalMessage, referralSource } = req.body;

    // Validate required fields
    if (!inviteeEmail || !inviteeName) {
      return res.status(400).json({
        success: false,
        message: 'Invitee email and name are required'
      });
    }

    // Check if invitation already exists for this email
    const existingInvitation = await AffiliateReferralInvitation.findOne({
      referrer: affiliate._id,
      inviteeEmail: inviteeEmail.toLowerCase(),
      status: { $in: ['sent', 'opened', 'registered', 'verified', 'active'] }
    });

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: 'An active invitation already exists for this email address'
      });
    }

    // Check if email is already registered as an affiliate
    const existingAffiliate = await Affiliate.findOne({ email: inviteeEmail.toLowerCase() });
    if (existingAffiliate) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered as an affiliate'
      });
    }

    // Generate invitation token and link
    const invitationToken = AffiliateReferralInvitation.generateInvitationToken();
    const invitationLink = `${process.env.FRONTEND_URL}/affiliate-panel/register?ref=${affiliate.affiliateCode}&token=${invitationToken}`;

    // Create invitation record
    const invitation = await AffiliateReferralInvitation.create({
      referrer: affiliate._id,
      inviteeEmail: inviteeEmail.toLowerCase(),
      inviteeName,
      inviteePhone,
      personalMessage,
      referralSource: referralSource || 'email',
      invitationToken,
      invitationLink,
      createdBy: affiliate._id
    });

    // Send invitation email
    const emailContent = `
      <h2>You're Invited to Join ShelfCure Affiliate Program!</h2>
      <p>Hi ${inviteeName},</p>
      <p>${affiliate.name} has invited you to join the ShelfCure Affiliate Program.</p>
      ${personalMessage ? `<p><strong>Personal Message:</strong> ${personalMessage}</p>` : ''}
      <p>As a ShelfCure affiliate, you can earn commissions by referring pharmacy stores to our platform.</p>
      <p><a href="${invitationLink}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Accept Invitation</a></p>
      <p>This invitation will expire in 30 days.</p>
      <p>Best regards,<br>ShelfCure Team</p>
    `;

    try {
      await sendEmail({
        email: inviteeEmail,
        subject: `${affiliate.name} invited you to join ShelfCure Affiliate Program`,
        html: emailContent
      });
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      // Continue even if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Referral invitation sent successfully',
      data: {
        id: invitation._id,
        inviteeEmail: invitation.inviteeEmail,
        inviteeName: invitation.inviteeName,
        status: invitation.status,
        invitationLink: invitation.invitationLink,
        sentDate: invitation.sentDate
      }
    });
  } catch (error) {
    console.error('Send referral invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending referral invitation',
      error: error.message
    });
  }
});

// @desc    Get all referral invitations
// @route   GET /api/affiliate-panel/referrals/invitations
// @access  Private/Affiliate
router.get('/referrals/invitations', affiliateAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const affiliate = await Affiliate.findById(req.affiliate.id);

    // Build query
    const query = { referrer: affiliate._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { inviteeName: { $regex: search, $options: 'i' } },
        { inviteeEmail: { $regex: search, $options: 'i' } }
      ];
    }

    // Get invitations with pagination
    const invitations = await AffiliateReferralInvitation.find(query)
      .populate('registeredAffiliate', 'name email affiliateCode status')
      .sort({ sentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AffiliateReferralInvitation.countDocuments(query);

    res.json({
      success: true,
      data: {
        invitations: invitations.map(inv => ({
          id: inv._id,
          inviteeName: inv.inviteeName,
          inviteeEmail: inv.inviteeEmail,
          inviteePhone: inv.inviteePhone,
          status: inv.status,
          sentDate: inv.sentDate,
          openedDate: inv.openedDate,
          registeredDate: inv.registeredDate,
          activatedDate: inv.activatedDate,
          expiryDate: inv.expiryDate,
          isExpired: inv.isExpired,
          hasConverted: inv.hasConverted,
          emailsSent: inv.emailsSent,
          remindersSent: inv.remindersSent,
          conversionValue: inv.conversionValue,
          registeredAffiliate: inv.registeredAffiliate,
          personalMessage: inv.personalMessage,
          referralSource: inv.referralSource
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get referral invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting referral invitations',
      error: error.message
    });
  }
});

// @desc    Resend referral invitation
// @route   POST /api/affiliate-panel/referrals/invitations/:id/resend
// @access  Private/Affiliate
router.post('/referrals/invitations/:id/resend', affiliateAuth, async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.affiliate.id);
    const invitation = await AffiliateReferralInvitation.findOne({
      _id: req.params.id,
      referrer: affiliate._id
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    // Check if invitation can be resent
    if (!['sent', 'opened'].includes(invitation.status)) {
      return res.status(400).json({
        success: false,
        message: 'This invitation cannot be resent'
      });
    }

    // Check if invitation is expired
    if (invitation.isExpired) {
      return res.status(400).json({
        success: false,
        message: 'This invitation has expired'
      });
    }

    // Send reminder email
    const emailContent = `
      <h2>Reminder: You're Invited to Join ShelfCure Affiliate Program!</h2>
      <p>Hi ${invitation.inviteeName},</p>
      <p>This is a friendly reminder that ${affiliate.name} has invited you to join the ShelfCure Affiliate Program.</p>
      ${invitation.personalMessage ? `<p><strong>Personal Message:</strong> ${invitation.personalMessage}</p>` : ''}
      <p>Don't miss this opportunity to earn commissions by referring pharmacy stores to our platform.</p>
      <p><a href="${invitation.invitationLink}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Accept Invitation</a></p>
      <p>This invitation will expire on ${invitation.expiryDate.toLocaleDateString()}.</p>
      <p>Best regards,<br>ShelfCure Team</p>
    `;

    try {
      await sendEmail({
        email: invitation.inviteeEmail,
        subject: `Reminder: ${affiliate.name} invited you to join ShelfCure Affiliate Program`,
        html: emailContent
      });

      // Update invitation record
      await invitation.sendReminder();

      res.json({
        success: true,
        message: 'Reminder sent successfully',
        data: {
          emailsSent: invitation.emailsSent,
          remindersSent: invitation.remindersSent,
          lastEmailSent: invitation.lastEmailSent
        }
      });
    } catch (emailError) {
      console.error('Error sending reminder email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send reminder email'
      });
    }
  } catch (error) {
    console.error('Resend invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resending invitation',
      error: error.message
    });
  }
});

// @desc    Get referral commission details
// @route   GET /api/affiliate-panel/referrals/commissions
// @access  Private/Affiliate
router.get('/referrals/commissions', affiliateAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, dateFrom, dateTo, affiliateId } = req.query;
    const affiliate = await Affiliate.findById(req.affiliate.id);

    // Build query for referral commissions
    const query = {
      affiliate: affiliate._id,
      type: 'referral_onetime'
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (affiliateId) {
      query.sellingAffiliate = affiliateId;
    }

    if (dateFrom || dateTo) {
      query.earnedDate = {};
      if (dateFrom) query.earnedDate.$gte = new Date(dateFrom);
      if (dateTo) query.earnedDate.$lte = new Date(dateTo);
    }

    // Get commissions with pagination
    const commissions = await AffiliateCommission.find(query)
      .populate('sellingAffiliate', 'name email affiliateCode')
      .populate('store', 'name code')
      .sort({ earnedDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AffiliateCommission.countDocuments(query);

    // Get commission summary
    const summary = await AffiliateCommission.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$commissionAmount' },
          pendingAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, '$commissionAmount', 0]
            }
          },
          approvedAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, '$commissionAmount', 0]
            }
          },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$commissionAmount', 0]
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const summaryData = summary[0] || {
      totalAmount: 0,
      pendingAmount: 0,
      approvedAmount: 0,
      paidAmount: 0,
      count: 0
    };

    res.json({
      success: true,
      data: {
        commissions: commissions.map(comm => ({
          id: comm._id,
          amount: comm.commissionAmount,
          baseAmount: comm.baseAmount,
          commissionRate: comm.commissionRate,
          status: comm.status,
          paymentStatus: comm.paymentStatus,
          earnedDate: comm.earnedDate,
          dueDate: comm.dueDate,
          approvedDate: comm.approvedDate,
          paidDate: comm.paidDate,
          sellingAffiliate: comm.sellingAffiliate,
          store: comm.store,
          period: comm.period,
          notes: comm.notes
        })),
        summary: summaryData,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get referral commissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting referral commissions',
      error: error.message
    });
  }
});

// @desc    Get referral analytics
// @route   GET /api/affiliate-panel/referrals/analytics
// @access  Private/Affiliate
router.get('/referrals/analytics', affiliateAuth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const affiliate = await Affiliate.findById(req.affiliate.id);

    // Calculate date range
    let dateFrom;
    switch (period) {
      case '7d':
        dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        dateFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        dateFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get invitation analytics
    const invitationAnalytics = await AffiliateReferralInvitation.aggregate([
      {
        $match: {
          referrer: affiliate._id,
          sentDate: { $gte: dateFrom }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$sentDate" }
          },
          invitationsSent: { $sum: 1 },
          invitationsOpened: {
            $sum: { $cond: [{ $ne: ['$openedDate', null] }, 1, 0] }
          },
          invitationsConverted: {
            $sum: { $cond: [{ $in: ['$status', ['registered', 'verified', 'active']] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get commission analytics
    const commissionAnalytics = await AffiliateCommission.aggregate([
      {
        $match: {
          affiliate: affiliate._id,
          type: 'referral_onetime',
          earnedDate: { $gte: dateFrom }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$earnedDate" }
          },
          commissionsEarned: { $sum: 1 },
          totalAmount: { $sum: '$commissionAmount' },
          avgAmount: { $avg: '$commissionAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get performance comparison (referral vs direct)
    const performanceComparison = await AffiliateCommission.aggregate([
      {
        $match: {
          affiliate: affiliate._id,
          earnedDate: { $gte: dateFrom }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$commissionAmount' },
          avgAmount: { $avg: '$commissionAmount' }
        }
      }
    ]);

    // Get top performing referrals
    const topReferrals = await AffiliateCommission.aggregate([
      {
        $match: {
          affiliate: affiliate._id,
          type: 'referral_onetime',
          earnedDate: { $gte: dateFrom }
        }
      },
      {
        $group: {
          _id: '$sellingAffiliate',
          commissionsCount: { $sum: 1 },
          totalEarnings: { $sum: '$commissionAmount' }
        }
      },
      {
        $lookup: {
          from: 'affiliates',
          localField: '_id',
          foreignField: '_id',
          as: 'affiliate'
        }
      },
      { $unwind: '$affiliate' },
      { $sort: { totalEarnings: -1 } },
      { $limit: 5 }
    ]);

    // Calculate conversion funnel
    const totalInvitations = await AffiliateReferralInvitation.countDocuments({
      referrer: affiliate._id,
      sentDate: { $gte: dateFrom }
    });

    const openedInvitations = await AffiliateReferralInvitation.countDocuments({
      referrer: affiliate._id,
      sentDate: { $gte: dateFrom },
      openedDate: { $ne: null }
    });

    const registeredInvitations = await AffiliateReferralInvitation.countDocuments({
      referrer: affiliate._id,
      sentDate: { $gte: dateFrom },
      status: { $in: ['registered', 'verified', 'active'] }
    });

    const activeAffiliates = await AffiliateReferralInvitation.countDocuments({
      referrer: affiliate._id,
      sentDate: { $gte: dateFrom },
      status: 'active'
    });

    const conversionFunnel = {
      invitationsSent: totalInvitations,
      invitationsOpened: openedInvitations,
      affiliatesRegistered: registeredInvitations,
      affiliatesActive: activeAffiliates,
      openRate: totalInvitations > 0 ? Math.round((openedInvitations / totalInvitations) * 100) : 0,
      conversionRate: totalInvitations > 0 ? Math.round((registeredInvitations / totalInvitations) * 100) : 0,
      activationRate: registeredInvitations > 0 ? Math.round((activeAffiliates / registeredInvitations) * 100) : 0
    };

    res.json({
      success: true,
      data: {
        period,
        dateRange: {
          from: dateFrom,
          to: new Date()
        },
        invitationAnalytics,
        commissionAnalytics,
        performanceComparison: performanceComparison.reduce((acc, item) => {
          acc[item._id] = {
            count: item.count,
            totalAmount: item.totalAmount,
            avgAmount: item.avgAmount
          };
          return acc;
        }, {}),
        topReferrals: topReferrals.map(ref => ({
          affiliate: {
            id: ref.affiliate._id,
            name: ref.affiliate.name,
            email: ref.affiliate.email,
            affiliateCode: ref.affiliate.affiliateCode
          },
          commissionsCount: ref.commissionsCount,
          totalEarnings: ref.totalEarnings
        })),
        conversionFunnel
      }
    });
  } catch (error) {
    console.error('Get referral analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting referral analytics',
      error: error.message
    });
  }
});

// @desc    Generate referral materials (QR code, promotional content)
// @route   POST /api/affiliate-panel/referrals/materials
// @access  Private/Affiliate
router.post('/referrals/materials', affiliateAuth, async (req, res) => {
  try {
    const { type, customMessage, campaign } = req.body;
    const affiliate = await Affiliate.findById(req.affiliate.id);

    // Check if affiliate can refer others
    if (affiliate.referralLevel >= 2) {
      return res.status(400).json({
        success: false,
        message: 'You have reached the maximum referral level and cannot create referral materials.'
      });
    }

    const baseUrl = process.env.FRONTEND_URL;
    const referralLink = `${baseUrl}/affiliate-panel/register?ref=${affiliate.affiliateCode}${campaign ? `&campaign=${campaign}` : ''}`;

    let materials = {};

    switch (type) {
      case 'qr_code':
        // Generate QR code (you would use a QR code library here)
        materials.qrCode = {
          url: referralLink,
          imageUrl: `${baseUrl}/api/affiliate-panel/qr-codes/generate?data=${encodeURIComponent(referralLink)}`,
          downloadUrl: `${baseUrl}/api/affiliate-panel/qr-codes/download?data=${encodeURIComponent(referralLink)}`
        };
        break;

      case 'email_template':
        materials.emailTemplate = {
          subject: `Join ShelfCure Affiliate Program - Invitation from ${affiliate.name}`,
          html: `
            <h2>You're Invited to Join ShelfCure Affiliate Program!</h2>
            <p>Hi there,</p>
            <p>${affiliate.name} has invited you to join the ShelfCure Affiliate Program.</p>
            ${customMessage ? `<p><strong>Personal Message:</strong> ${customMessage}</p>` : ''}
            <p>As a ShelfCure affiliate, you can earn commissions by referring pharmacy stores to our platform.</p>
            <p><a href="${referralLink}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Join Now</a></p>
            <p>Best regards,<br>ShelfCure Team</p>
          `,
          text: `You're invited to join ShelfCure Affiliate Program by ${affiliate.name}. ${customMessage || ''} Join now: ${referralLink}`
        };
        break;

      case 'social_media':
        materials.socialMedia = {
          facebook: `🚀 Exciting opportunity! Join the ShelfCure Affiliate Program and start earning commissions by helping pharmacy stores grow their business. ${customMessage || ''} Join me: ${referralLink} #ShelfCure #AffiliateProgram #PharmacyTech`,
          twitter: `💊 Join ShelfCure Affiliate Program and earn by referring pharmacy stores! ${customMessage || ''} ${referralLink} #ShelfCure #Affiliate`,
          linkedin: `I'm excited to invite you to join the ShelfCure Affiliate Program. As a leading pharmacy management platform, ShelfCure offers great commission opportunities for referring new stores. ${customMessage || ''} Join here: ${referralLink}`,
          whatsapp: `Hi! I'd like to invite you to join the ShelfCure Affiliate Program. You can earn commissions by referring pharmacy stores to our platform. ${customMessage || ''} Join here: ${referralLink}`
        };
        break;

      default:
        materials.referralLink = referralLink;
    }

    res.json({
      success: true,
      data: {
        type,
        referralLink,
        affiliate: {
          name: affiliate.name,
          affiliateCode: affiliate.affiliateCode
        },
        materials
      }
    });
  } catch (error) {
    console.error('Generate referral materials error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating referral materials',
      error: error.message
    });
  }
});

// @desc    Get referral leaderboard
// @route   GET /api/affiliate-panel/referrals/leaderboard
// @access  Private/Affiliate
router.get('/referrals/leaderboard', affiliateAuth, async (req, res) => {
  try {
    const { period = '30d', limit = 10 } = req.query;
    const affiliate = await Affiliate.findById(req.affiliate.id);

    // Calculate date range
    let dateFrom;
    switch (period) {
      case '7d':
        dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        dateFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        dateFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get top affiliates by referral commissions
    const leaderboard = await AffiliateCommission.aggregate([
      {
        $match: {
          type: 'referral_onetime',
          earnedDate: { $gte: dateFrom },
          status: { $in: ['approved', 'paid'] }
        }
      },
      {
        $group: {
          _id: '$affiliate',
          totalEarnings: { $sum: '$commissionAmount' },
          commissionsCount: { $sum: 1 },
          avgCommission: { $avg: '$commissionAmount' }
        }
      },
      {
        $lookup: {
          from: 'affiliates',
          localField: '_id',
          foreignField: '_id',
          as: 'affiliate'
        }
      },
      { $unwind: '$affiliate' },
      {
        $lookup: {
          from: 'affiliatereferralinvitations',
          let: { affiliateId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$referrer', '$$affiliateId'] },
                sentDate: { $gte: dateFrom }
              }
            },
            {
              $group: {
                _id: null,
                totalInvitations: { $sum: 1 },
                successfulReferrals: {
                  $sum: {
                    $cond: [
                      { $in: ['$status', ['registered', 'verified', 'active']] },
                      1,
                      0
                    ]
                  }
                }
              }
            }
          ],
          as: 'invitationStats'
        }
      },
      {
        $addFields: {
          invitationStats: {
            $ifNull: [
              { $arrayElemAt: ['$invitationStats', 0] },
              { totalInvitations: 0, successfulReferrals: 0 }
            ]
          }
        }
      },
      {
        $project: {
          affiliate: {
            id: '$affiliate._id',
            name: '$affiliate.name',
            affiliateCode: '$affiliate.affiliateCode',
            joinedDate: '$affiliate.createdAt'
          },
          totalEarnings: 1,
          commissionsCount: 1,
          avgCommission: { $round: ['$avgCommission', 2] },
          totalInvitations: '$invitationStats.totalInvitations',
          successfulReferrals: '$invitationStats.successfulReferrals',
          conversionRate: {
            $cond: [
              { $gt: ['$invitationStats.totalInvitations', 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          '$invitationStats.successfulReferrals',
                          '$invitationStats.totalInvitations'
                        ]
                      },
                      100
                    ]
                  },
                  1
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { totalEarnings: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Find current affiliate's rank
    const allAffiliates = await AffiliateCommission.aggregate([
      {
        $match: {
          type: 'referral_onetime',
          earnedDate: { $gte: dateFrom },
          status: { $in: ['approved', 'paid'] }
        }
      },
      {
        $group: {
          _id: '$affiliate',
          totalEarnings: { $sum: '$commissionAmount' }
        }
      },
      { $sort: { totalEarnings: -1 } }
    ]);

    const currentAffiliateRank = allAffiliates.findIndex(
      item => item._id.toString() === affiliate._id.toString()
    ) + 1;

    // Get current affiliate's stats
    const currentAffiliateStats = await AffiliateCommission.aggregate([
      {
        $match: {
          affiliate: affiliate._id,
          type: 'referral_onetime',
          earnedDate: { $gte: dateFrom },
          status: { $in: ['approved', 'paid'] }
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$commissionAmount' },
          commissionsCount: { $sum: 1 }
        }
      }
    ]);

    const currentStats = currentAffiliateStats[0] || {
      totalEarnings: 0,
      commissionsCount: 0
    };

    res.json({
      success: true,
      data: {
        period,
        dateRange: {
          from: dateFrom,
          to: new Date()
        },
        leaderboard: leaderboard.map((item, index) => ({
          rank: index + 1,
          ...item
        })),
        currentAffiliate: {
          rank: currentAffiliateRank || 'Unranked',
          totalEarnings: currentStats.totalEarnings,
          commissionsCount: currentStats.commissionsCount,
          affiliate: {
            id: affiliate._id,
            name: affiliate.name,
            affiliateCode: affiliate.affiliateCode
          }
        },
        totalParticipants: allAffiliates.length
      }
    });
  } catch (error) {
    console.error('Get referral leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting referral leaderboard',
      error: error.message
    });
  }
});

// @desc    Generate QR code for referral link
// @route   GET /api/affiliate-panel/qr-codes/generate
// @access  Private/Affiliate
router.get('/qr-codes/generate', affiliateAuth, async (req, res) => {
  try {
    const { data } = req.query;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'Data parameter is required'
      });
    }

    // Here you would use a QR code library like 'qrcode' to generate the QR code
    // For now, we'll return a placeholder response
    const QRCode = require('qrcode');

    const qrCodeDataURL = await QRCode.toDataURL(data, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Convert data URL to buffer for image response
    const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating QR code',
      error: error.message
    });
  }
});

// @desc    Download QR code for referral link
// @route   GET /api/affiliate-panel/qr-codes/download
// @access  Private/Affiliate
router.get('/qr-codes/download', affiliateAuth, async (req, res) => {
  try {
    const { data } = req.query;
    const affiliate = await Affiliate.findById(req.affiliate.id);

    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'Data parameter is required'
      });
    }

    const QRCode = require('qrcode');

    const qrCodeDataURL = await QRCode.toDataURL(data, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="referral-qr-${affiliate.affiliateCode}.png"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    console.error('Download QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error downloading QR code',
      error: error.message
    });
  }
});

module.exports = router;

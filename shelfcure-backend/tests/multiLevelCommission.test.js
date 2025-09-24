const mongoose = require('mongoose');
const Affiliate = require('../models/Affiliate');
const AffiliateCommission = require('../models/AffiliateCommission');
const CommissionService = require('../services/commissionService');

describe('Multi-Level Affiliate Commission System', () => {
  let affiliateA, affiliateB, affiliateC;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/shelfcure_test');
    }
  });

  beforeEach(async () => {
    // Clean up test data
    await Affiliate.deleteMany({});
    await AffiliateCommission.deleteMany({});

    // Create test affiliates
    // Affiliate A (Level 0 - Top level)
    affiliateA = await Affiliate.create({
      firstName: 'John',
      lastName: 'Doe',
      name: 'John Doe',
      email: 'john@test.com',
      phone: '+1234567890',
      password: 'password123',
      dateOfBirth: new Date('1990-01-01'),
      governmentId: {
        type: 'passport',
        number: 'P123456789'
      },
      address: {
        street: '123 Main St',
        city: 'Test City',
        state: 'Test State',
        pincode: '12345'
      },
      commission: {
        type: 'percentage',
        rate: 10,
        recurringCommission: { enabled: true, months: 12 },
        referralCommission: { enabled: true, oneTimeRate: 5 }
      },
      status: 'active',
      referralLevel: 0
    });

    // Affiliate B (Level 1 - Referred by A)
    affiliateB = await Affiliate.create({
      firstName: 'Jane',
      lastName: 'Smith',
      name: 'Jane Smith',
      email: 'jane@test.com',
      phone: '+1234567891',
      password: 'password123',
      dateOfBirth: new Date('1992-01-01'),
      referredBy: affiliateA._id,
      referralCode: affiliateA.affiliateCode,
      referralLevel: 1,
      governmentId: {
        type: 'passport',
        number: 'P123456790'
      },
      address: {
        street: '456 Oak St',
        city: 'Test City',
        state: 'Test State',
        pincode: '12345'
      },
      commission: {
        type: 'percentage',
        rate: 10,
        recurringCommission: { enabled: true, months: 12 },
        referralCommission: { enabled: true, oneTimeRate: 5 }
      },
      status: 'active'
    });

    // Affiliate C (Level 2 - Referred by B, max level)
    affiliateC = await Affiliate.create({
      firstName: 'Bob',
      lastName: 'Johnson',
      name: 'Bob Johnson',
      email: 'bob@test.com',
      phone: '+1234567892',
      password: 'password123',
      dateOfBirth: new Date('1988-01-01'),
      referredBy: affiliateB._id,
      referralCode: affiliateB.affiliateCode,
      referralLevel: 2,
      governmentId: {
        type: 'passport',
        number: 'P123456791'
      },
      address: {
        street: '789 Pine St',
        city: 'Test City',
        state: 'Test State',
        pincode: '12345'
      },
      commission: {
        type: 'percentage',
        rate: 10,
        recurringCommission: { enabled: true, months: 12 },
        referralCommission: { enabled: true, oneTimeRate: 5 }
      },
      status: 'active'
    });
  });

  afterAll(async () => {
    // Clean up and close connection
    await Affiliate.deleteMany({});
    await AffiliateCommission.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Referral Hierarchy', () => {
    test('should correctly establish referral relationships', async () => {
      expect(affiliateA.referralLevel).toBe(0);
      expect(affiliateA.referredBy).toBeNull();

      expect(affiliateB.referralLevel).toBe(1);
      expect(affiliateB.referredBy.toString()).toBe(affiliateA._id.toString());

      expect(affiliateC.referralLevel).toBe(2);
      expect(affiliateC.referredBy.toString()).toBe(affiliateB._id.toString());
    });

    test('should get correct referral hierarchy', async () => {
      const hierarchyC = await affiliateC.getReferralHierarchy();
      expect(hierarchyC).toHaveLength(2);
      expect(hierarchyC[0].level).toBe(1);
      expect(hierarchyC[0].affiliate.affiliateCode).toBe(affiliateB.affiliateCode);
      expect(hierarchyC[1].level).toBe(2);
      expect(hierarchyC[1].affiliate.affiliateCode).toBe(affiliateA.affiliateCode);
    });

    test('should get direct referrals', async () => {
      const directReferralsA = await affiliateA.getDirectReferrals();
      expect(directReferralsA).toHaveLength(1);
      expect(directReferralsA[0].affiliateCode).toBe(affiliateB.affiliateCode);

      const directReferralsB = await affiliateB.getDirectReferrals();
      expect(directReferralsB).toHaveLength(1);
      expect(directReferralsB[0].affiliateCode).toBe(affiliateC.affiliateCode);
    });
  });

  describe('Commission Validation', () => {
    test('should validate referral codes correctly', async () => {
      const validationA = await Affiliate.validateReferralCode(affiliateA.affiliateCode);
      expect(validationA.valid).toBe(true);
      expect(validationA.newLevel).toBe(1);

      const validationB = await Affiliate.validateReferralCode(affiliateB.affiliateCode);
      expect(validationB.valid).toBe(true);
      expect(validationB.newLevel).toBe(2);

      const validationC = await Affiliate.validateReferralCode(affiliateC.affiliateCode);
      expect(validationC.valid).toBe(false);
      expect(validationC.message).toContain('maximum referral depth');
    });

    test('should reject invalid referral codes', async () => {
      const validation = await Affiliate.validateReferralCode('INVALID123');
      expect(validation.valid).toBe(false);
      expect(validation.message).toContain('Invalid or inactive');
    });
  });

  describe('Multi-Level Commission Creation', () => {
    test('should create correct commissions when Affiliate B makes a sale', async () => {
      const saleData = {
        affiliateCode: affiliateB.affiliateCode,
        storeId: new mongoose.Types.ObjectId(),
        invoiceId: new mongoose.Types.ObjectId(),
        amount: 1000,
        subscription: {
          planName: 'Basic Plan',
          planType: 'monthly',
          isRenewal: false
        }
      };

      const commissions = await AffiliateCommission.createMultiLevelCommissions(saleData);
      
      // Should create 2 commissions:
      // 1. Recurring commission for Affiliate B (seller)
      // 2. One-time commission for Affiliate A (direct referrer)
      expect(commissions).toHaveLength(2);

      const recurringCommission = commissions.find(c => c.type === 'recurring');
      const oneTimeCommission = commissions.find(c => c.type === 'referral_onetime');

      expect(recurringCommission).toBeDefined();
      expect(recurringCommission.affiliate.toString()).toBe(affiliateB._id.toString());
      expect(recurringCommission.commissionLevel).toBe(0);
      expect(recurringCommission.commissionAmount).toBe(100); // 10% of 1000

      expect(oneTimeCommission).toBeDefined();
      expect(oneTimeCommission.affiliate.toString()).toBe(affiliateA._id.toString());
      expect(oneTimeCommission.commissionLevel).toBe(1);
      expect(oneTimeCommission.commissionAmount).toBe(50); // 5% of 1000
      expect(oneTimeCommission.sellingAffiliate.toString()).toBe(affiliateB._id.toString());
    });

    test('should create correct commissions when Affiliate C makes a sale', async () => {
      const saleData = {
        affiliateCode: affiliateC.affiliateCode,
        storeId: new mongoose.Types.ObjectId(),
        invoiceId: new mongoose.Types.ObjectId(),
        amount: 2000,
        subscription: {
          planName: 'Premium Plan',
          planType: 'monthly',
          isRenewal: false
        }
      };

      const commissions = await AffiliateCommission.createMultiLevelCommissions(saleData);
      
      // Should create 2 commissions:
      // 1. Recurring commission for Affiliate C (seller)
      // 2. One-time commission for Affiliate B (direct referrer)
      // Note: Affiliate A gets NO commission (system limited to 2 levels)
      expect(commissions).toHaveLength(2);

      const recurringCommission = commissions.find(c => c.type === 'recurring');
      const oneTimeCommission = commissions.find(c => c.type === 'referral_onetime');

      expect(recurringCommission.affiliate.toString()).toBe(affiliateC._id.toString());
      expect(recurringCommission.commissionAmount).toBe(200); // 10% of 2000

      expect(oneTimeCommission.affiliate.toString()).toBe(affiliateB._id.toString());
      expect(oneTimeCommission.commissionAmount).toBe(100); // 5% of 2000
      expect(oneTimeCommission.sellingAffiliate.toString()).toBe(affiliateC._id.toString());

      // Verify Affiliate A gets no commission
      const affiliateACommissions = commissions.filter(c => 
        c.affiliate.toString() === affiliateA._id.toString()
      );
      expect(affiliateACommissions).toHaveLength(0);
    });

    test('should create only recurring commission for top-level affiliate', async () => {
      const saleData = {
        affiliateCode: affiliateA.affiliateCode,
        storeId: new mongoose.Types.ObjectId(),
        invoiceId: new mongoose.Types.ObjectId(),
        amount: 1500,
        subscription: {
          planName: 'Standard Plan',
          planType: 'monthly',
          isRenewal: false
        }
      };

      const commissions = await AffiliateCommission.createMultiLevelCommissions(saleData);
      
      // Should create only 1 commission (recurring for seller)
      // No referrer to pay one-time commission to
      expect(commissions).toHaveLength(1);

      const commission = commissions[0];
      expect(commission.type).toBe('recurring');
      expect(commission.affiliate.toString()).toBe(affiliateA._id.toString());
      expect(commission.commissionLevel).toBe(0);
      expect(commission.commissionAmount).toBe(150); // 10% of 1500
    });
  });
});

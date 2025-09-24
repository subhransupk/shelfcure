const request = require('supertest');
const app = require('../app');
const Affiliate = require('../models/Affiliate');
const AffiliateReferralInvitation = require('../models/AffiliateReferralInvitation');
const AffiliateCommission = require('../models/AffiliateCommission');
const User = require('../models/User');
const { connectDB, closeDB, clearDB } = require('./setup');

describe('Affiliate Referral Management System', () => {
  let affiliateToken;
  let affiliateId;
  let level1AffiliateId;
  let level2AffiliateId;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    await clearDB();
    
    // Create test affiliate (Level 0)
    const affiliate = new Affiliate({
      name: 'Test Affiliate',
      email: 'test@example.com',
      phone: '+1234567890',
      password: 'password123',
      affiliateCode: 'AFF001',
      referralLevel: 0,
      status: 'active',
      isVerified: true
    });
    await affiliate.save();
    affiliateId = affiliate._id;

    // Generate token
    affiliateToken = affiliate.generateAuthToken();
  });

  describe('Referral Dashboard', () => {
    test('should get referral dashboard data', async () => {
      const response = await request(app)
        .get('/api/affiliate-panel/referrals/dashboard')
        .set('Authorization', `Bearer ${affiliateToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('affiliate');
      expect(response.body.data).toHaveProperty('invitationStats');
      expect(response.body.data).toHaveProperty('directReferrals');
      expect(response.body.data).toHaveProperty('recentCommissions');
      expect(response.body.data).toHaveProperty('earnings');
    });

    test('should show correct referral level restrictions', async () => {
      // Update affiliate to level 2 (max level)
      await Affiliate.findByIdAndUpdate(affiliateId, { referralLevel: 2 });

      const response = await request(app)
        .get('/api/affiliate-panel/referrals/dashboard')
        .set('Authorization', `Bearer ${affiliateToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.affiliate.canRefer).toBe(false);
      expect(response.body.data.affiliate.referralLevel).toBe(2);
    });
  });

  describe('Referral Invitations', () => {
    test('should send referral invitation successfully', async () => {
      const invitationData = {
        inviteeName: 'John Doe',
        inviteeEmail: 'john@example.com',
        inviteePhone: '+1234567891',
        personalMessage: 'Join our affiliate program!',
        referralSource: 'email'
      };

      const response = await request(app)
        .post('/api/affiliate-panel/referrals/invite')
        .set('Authorization', `Bearer ${affiliateToken}`)
        .send(invitationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('invitationId');
      expect(response.body.data).toHaveProperty('invitationLink');
      expect(response.body.data.inviteeEmail).toBe(invitationData.inviteeEmail);

      // Verify invitation was created in database
      const invitation = await AffiliateReferralInvitation.findById(response.body.data.invitationId);
      expect(invitation).toBeTruthy();
      expect(invitation.referrer.toString()).toBe(affiliateId.toString());
      expect(invitation.status).toBe('sent');
    });

    test('should prevent level 2 affiliates from sending invitations', async () => {
      // Update affiliate to level 2
      await Affiliate.findByIdAndUpdate(affiliateId, { referralLevel: 2 });

      const invitationData = {
        inviteeName: 'John Doe',
        inviteeEmail: 'john@example.com',
        personalMessage: 'Join our affiliate program!'
      };

      const response = await request(app)
        .post('/api/affiliate-panel/referrals/invite')
        .set('Authorization', `Bearer ${affiliateToken}`)
        .send(invitationData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('maximum referral level');
    });

    test('should get list of referral invitations', async () => {
      // Create test invitation
      const invitation = new AffiliateReferralInvitation({
        referrer: affiliateId,
        inviteeName: 'John Doe',
        inviteeEmail: 'john@example.com',
        status: 'sent',
        invitationToken: 'test-token-123',
        invitationLink: 'https://example.com/register?token=test-token-123'
      });
      await invitation.save();

      const response = await request(app)
        .get('/api/affiliate-panel/referrals/invitations')
        .set('Authorization', `Bearer ${affiliateToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.invitations).toHaveLength(1);
      expect(response.body.data.invitations[0].inviteeName).toBe('John Doe');
      expect(response.body.data.pagination).toHaveProperty('totalItems');
    });

    test('should resend invitation successfully', async () => {
      // Create test invitation
      const invitation = new AffiliateReferralInvitation({
        referrer: affiliateId,
        inviteeName: 'John Doe',
        inviteeEmail: 'john@example.com',
        status: 'sent',
        invitationToken: 'test-token-123',
        invitationLink: 'https://example.com/register?token=test-token-123',
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      });
      await invitation.save();

      const response = await request(app)
        .post(`/api/affiliate-panel/referrals/invitations/${invitation._id}/resend`)
        .set('Authorization', `Bearer ${affiliateToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.remindersSent).toBe(1);

      // Verify invitation was updated
      const updatedInvitation = await AffiliateReferralInvitation.findById(invitation._id);
      expect(updatedInvitation.remindersSent).toBe(1);
    });
  });

  describe('Referral Commission Tracking', () => {
    beforeEach(async () => {
      // Create Level 1 affiliate (referred by Level 0)
      const level1Affiliate = new Affiliate({
        name: 'Level 1 Affiliate',
        email: 'level1@example.com',
        phone: '+1234567892',
        password: 'password123',
        affiliateCode: 'AFF002',
        referralLevel: 1,
        referredBy: affiliateId,
        status: 'active',
        isVerified: true
      });
      await level1Affiliate.save();
      level1AffiliateId = level1Affiliate._id;

      // Create Level 2 affiliate (referred by Level 1)
      const level2Affiliate = new Affiliate({
        name: 'Level 2 Affiliate',
        email: 'level2@example.com',
        phone: '+1234567893',
        password: 'password123',
        affiliateCode: 'AFF003',
        referralLevel: 2,
        referredBy: level1AffiliateId,
        status: 'active',
        isVerified: true
      });
      await level2Affiliate.save();
      level2AffiliateId = level2Affiliate._id;
    });

    test('should get referral commission details', async () => {
      // Create test commission
      const commission = new AffiliateCommission({
        affiliate: affiliateId,
        sellingAffiliate: level1AffiliateId,
        type: 'referral_onetime',
        baseAmount: 1000,
        commissionRate: 5,
        commissionAmount: 50,
        status: 'approved',
        earnedDate: new Date()
      });
      await commission.save();

      const response = await request(app)
        .get('/api/affiliate-panel/referrals/commissions')
        .set('Authorization', `Bearer ${affiliateToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.commissions).toHaveLength(1);
      expect(response.body.data.commissions[0].amount).toBe(50);
      expect(response.body.data.summary.totalAmount).toBe(50);
    });

    test('should filter commissions by status', async () => {
      // Create commissions with different statuses
      await AffiliateCommission.create([
        {
          affiliate: affiliateId,
          sellingAffiliate: level1AffiliateId,
          type: 'referral_onetime',
          baseAmount: 1000,
          commissionRate: 5,
          commissionAmount: 50,
          status: 'pending',
          earnedDate: new Date()
        },
        {
          affiliate: affiliateId,
          sellingAffiliate: level1AffiliateId,
          type: 'referral_onetime',
          baseAmount: 2000,
          commissionRate: 5,
          commissionAmount: 100,
          status: 'approved',
          earnedDate: new Date()
        }
      ]);

      const response = await request(app)
        .get('/api/affiliate-panel/referrals/commissions?status=approved')
        .set('Authorization', `Bearer ${affiliateToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.commissions).toHaveLength(1);
      expect(response.body.data.commissions[0].status).toBe('approved');
    });
  });

  describe('Referral Analytics', () => {
    test('should get referral analytics data', async () => {
      const response = await request(app)
        .get('/api/affiliate-panel/referrals/analytics?period=30d')
        .set('Authorization', `Bearer ${affiliateToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('period', '30d');
      expect(response.body.data).toHaveProperty('invitationAnalytics');
      expect(response.body.data).toHaveProperty('commissionAnalytics');
      expect(response.body.data).toHaveProperty('performanceComparison');
      expect(response.body.data).toHaveProperty('topReferrals');
      expect(response.body.data).toHaveProperty('conversionFunnel');
    });

    test('should calculate conversion funnel correctly', async () => {
      // Create test invitations with different statuses
      await AffiliateReferralInvitation.create([
        {
          referrer: affiliateId,
          inviteeName: 'John Doe',
          inviteeEmail: 'john@example.com',
          status: 'sent',
          invitationToken: 'token1',
          invitationLink: 'https://example.com/register?token=token1'
        },
        {
          referrer: affiliateId,
          inviteeName: 'Jane Smith',
          inviteeEmail: 'jane@example.com',
          status: 'opened',
          invitationToken: 'token2',
          invitationLink: 'https://example.com/register?token=token2',
          openedDate: new Date()
        },
        {
          referrer: affiliateId,
          inviteeName: 'Bob Johnson',
          inviteeEmail: 'bob@example.com',
          status: 'registered',
          invitationToken: 'token3',
          invitationLink: 'https://example.com/register?token=token3',
          openedDate: new Date(),
          registeredDate: new Date()
        }
      ]);

      const response = await request(app)
        .get('/api/affiliate-panel/referrals/analytics?period=30d')
        .set('Authorization', `Bearer ${affiliateToken}`);

      expect(response.status).toBe(200);
      const funnel = response.body.data.conversionFunnel;
      expect(funnel.invitationsSent).toBe(3);
      expect(funnel.invitationsOpened).toBe(2);
      expect(funnel.affiliatesRegistered).toBe(1);
      expect(funnel.openRate).toBe(67); // 2/3 * 100 rounded
      expect(funnel.conversionRate).toBe(33); // 1/3 * 100 rounded
    });
  });

  describe('Referral Materials Generation', () => {
    test('should generate referral link materials', async () => {
      const response = await request(app)
        .post('/api/affiliate-panel/referrals/materials')
        .set('Authorization', `Bearer ${affiliateToken}`)
        .send({
          type: 'links',
          customMessage: 'Join our amazing program!',
          campaign: 'summer2024'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('referralLink');
      expect(response.body.data.referralLink).toContain('ref=AFF001');
      expect(response.body.data.referralLink).toContain('campaign=summer2024');
    });

    test('should generate email template materials', async () => {
      const response = await request(app)
        .post('/api/affiliate-panel/referrals/materials')
        .set('Authorization', `Bearer ${affiliateToken}`)
        .send({
          type: 'email_template',
          customMessage: 'This is a great opportunity!'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.materials).toHaveProperty('emailTemplate');
      expect(response.body.data.materials.emailTemplate).toHaveProperty('subject');
      expect(response.body.data.materials.emailTemplate).toHaveProperty('html');
      expect(response.body.data.materials.emailTemplate).toHaveProperty('text');
      expect(response.body.data.materials.emailTemplate.html).toContain('This is a great opportunity!');
    });

    test('should generate social media materials', async () => {
      const response = await request(app)
        .post('/api/affiliate-panel/referrals/materials')
        .set('Authorization', `Bearer ${affiliateToken}`)
        .send({
          type: 'social_media',
          customMessage: 'Check this out!'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.materials).toHaveProperty('socialMedia');
      expect(response.body.data.materials.socialMedia).toHaveProperty('facebook');
      expect(response.body.data.materials.socialMedia).toHaveProperty('twitter');
      expect(response.body.data.materials.socialMedia).toHaveProperty('linkedin');
      expect(response.body.data.materials.socialMedia).toHaveProperty('whatsapp');
    });

    test('should prevent level 2 affiliates from generating materials', async () => {
      // Update affiliate to level 2
      await Affiliate.findByIdAndUpdate(affiliateId, { referralLevel: 2 });

      const response = await request(app)
        .post('/api/affiliate-panel/referrals/materials')
        .set('Authorization', `Bearer ${affiliateToken}`)
        .send({ type: 'links' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('maximum referral level');
    });
  });

  describe('Referral Leaderboard', () => {
    beforeEach(async () => {
      // Create additional affiliates and commissions for leaderboard testing
      const affiliate2 = new Affiliate({
        name: 'Top Performer',
        email: 'top@example.com',
        phone: '+1234567894',
        password: 'password123',
        affiliateCode: 'AFF004',
        referralLevel: 0,
        status: 'active',
        isVerified: true
      });
      await affiliate2.save();

      // Create commissions for leaderboard
      await AffiliateCommission.create([
        {
          affiliate: affiliateId,
          type: 'referral_onetime',
          baseAmount: 1000,
          commissionRate: 5,
          commissionAmount: 50,
          status: 'approved',
          earnedDate: new Date()
        },
        {
          affiliate: affiliate2._id,
          type: 'referral_onetime',
          baseAmount: 2000,
          commissionRate: 5,
          commissionAmount: 100,
          status: 'approved',
          earnedDate: new Date()
        }
      ]);
    });

    test('should get referral leaderboard', async () => {
      const response = await request(app)
        .get('/api/affiliate-panel/referrals/leaderboard?period=30d&limit=10')
        .set('Authorization', `Bearer ${affiliateToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('leaderboard');
      expect(response.body.data).toHaveProperty('currentAffiliate');
      expect(response.body.data).toHaveProperty('totalParticipants');
      
      // Check leaderboard is sorted by earnings
      const leaderboard = response.body.data.leaderboard;
      if (leaderboard.length > 1) {
        expect(leaderboard[0].totalEarnings).toBeGreaterThanOrEqual(leaderboard[1].totalEarnings);
      }
    });

    test('should show current affiliate rank', async () => {
      const response = await request(app)
        .get('/api/affiliate-panel/referrals/leaderboard')
        .set('Authorization', `Bearer ${affiliateToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.currentAffiliate).toHaveProperty('rank');
      expect(response.body.data.currentAffiliate.affiliate.id).toBe(affiliateId.toString());
    });
  });
});

const mongoose = require('mongoose');
const AffiliateCommission = require('../models/AffiliateCommission');
const Affiliate = require('../models/Affiliate');
const Store = require('../models/Store');
require('dotenv').config({ path: '.env' });

const seedCommissions = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get existing affiliates and stores
    const affiliates = await Affiliate.find().limit(2);
    const stores = await Store.find().limit(3);

    if (affiliates.length === 0 || stores.length === 0) {
      console.log('No affiliates or stores found. Please create some first.');
      return;
    }

    // Clear existing commissions
    await AffiliateCommission.deleteMany({});
    console.log('Cleared existing commissions');

    // Create sample commissions
    const sampleCommissions = [
      {
        affiliate: affiliates[0]._id,
        store: stores[0]._id,
        type: 'initial',
        period: { month: 8, year: 2024 },
        baseAmount: 2999,
        commissionRate: 15,
        commissionAmount: 449.85,
        status: 'pending',
        paymentStatus: 'unpaid',
        earnedDate: new Date('2024-08-01'),
        dueDate: new Date('2024-09-01'),
        notes: 'Initial commission for new store signup'
      },
      {
        affiliate: affiliates[0]._id,
        store: stores[0]._id,
        type: 'recurring',
        period: { month: 8, year: 2024 },
        baseAmount: 2999,
        commissionRate: 10,
        commissionAmount: 299.90,
        status: 'approved',
        paymentStatus: 'unpaid',
        earnedDate: new Date('2024-08-15'),
        dueDate: new Date('2024-09-15'),
        notes: 'Monthly recurring commission'
      },
      {
        affiliate: affiliates[1]._id,
        store: stores[1]._id,
        type: 'initial',
        period: { month: 7, year: 2024 },
        baseAmount: 1999,
        commissionRate: 15,
        commissionAmount: 299.85,
        status: 'approved',
        paymentStatus: 'paid',
        earnedDate: new Date('2024-07-10'),
        dueDate: new Date('2024-08-10'),
        paidDate: new Date('2024-08-05'),
        payment: {
          method: 'bank_transfer',
          transactionId: 'TXN-20240805-001',
          paidDate: new Date('2024-08-05'),
          paidAmount: 299.85,
          processingFee: 5.00,
          netAmount: 294.85,
          notes: 'Commission payment processed successfully'
        },
        notes: 'Initial commission - paid'
      },
      {
        affiliate: affiliates[1]._id,
        store: stores[1]._id,
        type: 'recurring',
        period: { month: 8, year: 2024 },
        baseAmount: 1999,
        commissionRate: 10,
        commissionAmount: 199.90,
        status: 'approved',
        paymentStatus: 'unpaid',
        earnedDate: new Date('2024-08-10'),
        dueDate: new Date('2024-09-10'),
        notes: 'Monthly recurring commission'
      },
      {
        affiliate: affiliates[0]._id,
        store: stores[2]._id,
        type: 'bonus',
        period: { month: 8, year: 2024 },
        baseAmount: 500,
        commissionRate: 0,
        commissionAmount: 500,
        status: 'approved',
        paymentStatus: 'unpaid',
        earnedDate: new Date('2024-08-20'),
        dueDate: new Date('2024-09-20'),
        notes: 'Bonus commission for exceptional performance'
      }
    ];

    // Insert sample commissions
    const createdCommissions = await AffiliateCommission.insertMany(sampleCommissions);
    console.log(`Created ${createdCommissions.length} sample commissions`);

    // Update affiliate stats
    for (const affiliate of affiliates) {
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
            paidEarnings: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$commissionAmount', 0]
              }
            }
          }
        }
      ]);

      const stats = commissionStats[0] || {};
      affiliate.stats = {
        ...affiliate.stats,
        totalEarnings: stats.totalEarnings || 0,
        pendingEarnings: stats.pendingEarnings || 0,
        paidEarnings: stats.paidEarnings || 0
      };

      await affiliate.save();
      console.log(`Updated stats for affiliate: ${affiliate.name}`);
    }

    console.log('Commission seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding commissions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seeding function
seedCommissions();

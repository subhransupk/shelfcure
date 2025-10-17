const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
const Sale = require('./models/Sale');
const DoctorStatsService = require('./services/doctorStatsService');

// Load environment variables
require('dotenv').config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

async function populateHistoricalCommissions() {
  console.log('🔄 Starting Historical Commission Population...\n');
  
  try {
    // Find all doctors who have sales with prescriptions
    const doctorsWithSales = await Sale.aggregate([
      {
        $match: {
          'prescription.doctor': { $exists: true, $ne: null },
          status: { $in: ['completed'] }
        }
      },
      {
        $group: {
          _id: '$prescription.doctor',
          salesCount: { $sum: 1 },
          totalSalesValue: { $sum: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      {
        $unwind: '$doctor'
      },
      {
        $project: {
          doctorId: '$_id',
          doctorName: '$doctor.name',
          storeName: '$doctor.store',
          salesCount: 1,
          totalSalesValue: 1,
          commissionRate: '$doctor.commissionRate'
        }
      }
    ]);

    console.log(`📊 Found ${doctorsWithSales.length} doctors with prescription sales`);

    let totalProcessed = 0;
    let totalCommissionsCreated = 0;

    for (const doctorData of doctorsWithSales) {
      try {
        console.log(`\n👨‍⚕️ Processing: ${doctorData.doctorName}`);
        console.log(`   - Sales Count: ${doctorData.salesCount}`);
        console.log(`   - Total Sales Value: ₹${doctorData.totalSalesValue.toLocaleString()}`);
        console.log(`   - Commission Rate: ${doctorData.commissionRate || 0}%`);

        // Create historical commissions for this doctor
        const commissions = await DoctorStatsService.createHistoricalCommissions(
          doctorData.doctorId
        );

        console.log(`   ✅ Created/Updated ${commissions.length} commission records`);
        
        // Update doctor stats
        await DoctorStatsService.updateDoctorStats(doctorData.doctorId);
        console.log(`   ✅ Updated doctor statistics`);

        totalProcessed++;
        totalCommissionsCreated += commissions.length;

      } catch (error) {
        console.error(`   ❌ Error processing doctor ${doctorData.doctorName}:`, error.message);
      }
    }

    console.log('\n📈 Population Summary:');
    console.log(`✅ Doctors Processed: ${totalProcessed}`);
    console.log(`✅ Commission Records Created/Updated: ${totalCommissionsCreated}`);
    console.log('\n🎉 Historical commission population completed!');

  } catch (error) {
    console.error('❌ Error during historical commission population:', error);
  }
}

async function main() {
  await connectDB();
  await populateHistoricalCommissions();
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  });
}

module.exports = { populateHistoricalCommissions };

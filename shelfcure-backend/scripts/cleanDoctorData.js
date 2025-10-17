const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Doctor = require('../models/Doctor');
const Commission = require('../models/Commission');

async function cleanDoctorData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🗄️  Connected to MongoDB');

    // Get counts before deletion
    const doctorCount = await Doctor.countDocuments();
    const commissionCount = await Commission.countDocuments();

    console.log(`📊 Current data:`);
    console.log(`   - Doctors: ${doctorCount}`);
    console.log(`   - Commissions: ${commissionCount}`);

    if (doctorCount === 0 && commissionCount === 0) {
      console.log('✅ No doctor or commission data to clean');
      return;
    }

    // Confirm deletion
    console.log('\n⚠️  This will DELETE ALL doctors and commission records');
    console.log('   Other data (stores, sales, medicines, etc.) will be preserved');
    
    // Delete all commission records first (to avoid foreign key issues)
    console.log('\n🗑️  Deleting commission records...');
    const deletedCommissions = await Commission.deleteMany({});
    console.log(`✅ Deleted ${deletedCommissions.deletedCount} commission records`);

    // Delete all doctors
    console.log('🗑️  Deleting doctors...');
    const deletedDoctors = await Doctor.deleteMany({});
    console.log(`✅ Deleted ${deletedDoctors.deletedCount} doctors`);

    // Verify deletion
    const remainingDoctors = await Doctor.countDocuments();
    const remainingCommissions = await Commission.countDocuments();

    console.log('\n📊 Final counts:');
    console.log(`   - Doctors: ${remainingDoctors}`);
    console.log(`   - Commissions: ${remainingCommissions}`);

    if (remainingDoctors === 0 && remainingCommissions === 0) {
      console.log('✅ Successfully cleaned all doctor and commission data');
    } else {
      console.log('⚠️  Some records may not have been deleted');
    }

  } catch (error) {
    console.error('❌ Error cleaning doctor data:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the cleanup
cleanDoctorData();

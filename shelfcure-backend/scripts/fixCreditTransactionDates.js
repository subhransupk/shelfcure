const mongoose = require('mongoose');
const CreditTransaction = require('../models/CreditTransaction');

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shelfcure', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const fixCreditTransactionDates = async () => {
  try {
    console.log('🔍 Checking for credit transactions with missing transactionDate...');
    
    // Find transactions with missing or null transactionDate
    const transactionsWithoutDate = await CreditTransaction.find({
      $or: [
        { transactionDate: { $exists: false } },
        { transactionDate: null },
        { transactionDate: undefined }
      ]
    });

    console.log(`Found ${transactionsWithoutDate.length} transactions with missing transactionDate`);

    if (transactionsWithoutDate.length > 0) {
      console.log('🔧 Fixing transactions...');
      
      for (const transaction of transactionsWithoutDate) {
        // Use createdAt if available, otherwise use current date
        const dateToUse = transaction.createdAt || new Date();
        
        await CreditTransaction.findByIdAndUpdate(transaction._id, {
          transactionDate: dateToUse
        });
        
        console.log(`✅ Fixed transaction ${transaction._id} - set transactionDate to ${dateToUse}`);
      }
      
      console.log(`🎉 Successfully fixed ${transactionsWithoutDate.length} transactions`);
    } else {
      console.log('✅ All transactions already have transactionDate set');
    }

    // Verify the fix
    const stillMissing = await CreditTransaction.find({
      $or: [
        { transactionDate: { $exists: false } },
        { transactionDate: null },
        { transactionDate: undefined }
      ]
    });

    if (stillMissing.length === 0) {
      console.log('✅ Verification passed: All transactions now have transactionDate');
    } else {
      console.log(`❌ Verification failed: ${stillMissing.length} transactions still missing transactionDate`);
    }

  } catch (error) {
    console.error('❌ Error fixing credit transaction dates:', error);
  }
};

const main = async () => {
  await connectDB();
  await fixCreditTransactionDates();
  await mongoose.connection.close();
  console.log('🔚 Script completed');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});

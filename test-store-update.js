const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Test Store model update
async function testStoreUpdate() {
  try {
    await connectDB();
    
    const Store = require('./models/Store');
    
    // Find a store to test with
    console.log('Looking for a test store...');
    const store = await Store.findOne().limit(1);
    
    if (!store) {
      console.log('❌ No stores found in database');
      return;
    }
    
    console.log('✅ Found test store:', store.name, 'ID:', store._id);
    
    // Test the same update operation that the business settings endpoint does
    const updateData = {
      'settings.gstEnabled': true,
      'settings.defaultGstRate': 18,
      'settings.gstNumber': '',
      'settings.includeTaxInPrice': true,
      'settings.allowDiscounts': true,
      'settings.maxDiscountPercent': 50,
      'settings.maxDiscountAmountPerBill': 0,
      'settings.requireManagerApproval': true,
      'settings.discountOnMRP': true,
      'settings.autoApplyDiscounts': false,
      'settings.autoDiscountRules': [],
      'settings.allowNegativeStock': false,
      'settings.requirePrescription': true,
      'settings.printReceiptByDefault': true,
      'settings.currency': 'INR',
      'settings.currencySymbol': '₹',
      'settings.decimalPlaces': 2,
      'settings.discountTypes': [],
      'settings.taxTypes': []
    };
    
    // Also update business.gstNumber
    updateData['business.gstNumber'] = '';
    
    console.log('Testing store update with data:', Object.keys(updateData));
    
    // Test with runValidators: false (like our fix)
    const updatedStore = await Store.findByIdAndUpdate(
      store._id,
      { $set: updateData },
      { new: true, runValidators: false }
    );
    
    if (updatedStore) {
      console.log('✅ Store update successful!');
      console.log('Updated GST settings:', {
        businessGST: updatedStore.business?.gstNumber,
        settingsGST: updatedStore.settings?.gstNumber,
        gstEnabled: updatedStore.settings?.gstEnabled
      });
    } else {
      console.log('❌ Store update failed - no updated store returned');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
    console.error('Error details:', error.message);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', Object.values(error.errors).map(err => err.message));
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testStoreUpdate();

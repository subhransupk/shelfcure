const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
};

const testAnalyticsAPI = async () => {
  const User = require('./models/User');
  const Store = require('./models/Store');
  const jwt = require('jsonwebtoken');

  try {
    // Find a store manager
    const storeManager = await User.findOne({ 
      email: 'mota@gmail.com',
      role: 'store_manager' 
    });

    if (!storeManager) {
      console.log('❌ Store manager not found');
      return;
    }

    console.log('✅ Found store manager:', storeManager.email);

    // Find their store
    const store = await Store.findOne({
      $or: [
        { 'staff.user': storeManager._id },
        { managers: storeManager._id },
        { _id: { $in: storeManager.stores || [] } }
      ],
      isActive: true
    }).populate('owner');

    if (!store) {
      console.log('❌ Store not found for manager');
      return;
    }

    console.log('✅ Found store:', store.name, '(', store.code, ')');
    console.log('Store owner:', store.owner?.name);

    // Generate JWT token
    const token = jwt.sign(
      { id: storeManager._id },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '1h' }
    );

    console.log('✅ Generated token');

    // Test the API call
    const { default: fetch } = await import('node-fetch');
    
    const response = await fetch('http://localhost:5000/api/store-manager/analytics?period=30d', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 API Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Analytics data received:');
      console.log('- Success:', data.success);
      console.log('- Period:', data.data?.period);
      console.log('- Total Revenue:', data.data?.summary?.totalRevenue);
      console.log('- Total Sales:', data.data?.summary?.totalSales);
      console.log('- Daily Sales Count:', data.data?.dailySales?.length);
      console.log('- Top Medicines Count:', data.data?.topMedicines?.length);
    } else {
      const errorData = await response.text();
      console.log('❌ API Error:', errorData);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

connectDB().then(testAnalyticsAPI).catch(console.error);

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
};

const testEnhancedAnalytics = async () => {
  const User = require('./models/User');
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

    // Generate JWT token
    const token = jwt.sign(
      { id: storeManager._id },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '1h' }
    );

    // Test the enhanced API call
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
      console.log('✅ Enhanced Analytics data received:');
      console.log('\n📊 SUMMARY:');
      console.log('- Success:', data.success);
      console.log('- Period:', data.data?.period);
      console.log('- Total Revenue:', data.data?.summary?.totalRevenue);
      console.log('- Total Sales:', data.data?.summary?.totalSales);
      console.log('- Revenue Growth:', data.data?.summary?.revenueGrowth + '%');
      console.log('- Sales Growth:', data.data?.summary?.salesGrowth + '%');
      
      console.log('\n📈 DAILY SALES:');
      console.log('- Daily Sales Count:', data.data?.dailySales?.length);
      console.log('- Sample Day:', data.data?.dailySales?.[0]);
      
      console.log('\n💊 TOP MEDICINES:');
      console.log('- Top Medicines Count:', data.data?.topMedicines?.length);
      console.log('- Top Medicine:', data.data?.topMedicines?.[0]);
      
      console.log('\n📦 INVENTORY:');
      console.log('- Total Medicines:', data.data?.inventory?.totalMedicines);
      console.log('- Low Stock:', data.data?.inventory?.lowStockMedicines);
      console.log('- Out of Stock:', data.data?.inventory?.outOfStockMedicines);
      console.log('- Stock Health:', data.data?.inventory?.stockHealthPercentage + '%');
      
      console.log('\n👥 CUSTOMERS:');
      console.log('- Total Customers:', data.data?.customers?.totalCustomers);
      console.log('- New Customers:', data.data?.customers?.newCustomers);
      console.log('- Customer Growth:', data.data?.customers?.customerGrowth + '%');
      
      console.log('\n⚙️ OPERATIONS:');
      console.log('- Hourly Pattern Length:', data.data?.operations?.hourlyPattern?.length);
      console.log('- Peak Hour Transactions:', Math.max(...(data.data?.operations?.hourlyPattern || [])));
      console.log('- Category Distribution:', data.data?.operations?.categoryDistribution?.length, 'categories');
      console.log('- Top Category:', data.data?.operations?.categoryDistribution?.[0]);
      
      console.log('\n🎯 DATA STRUCTURE VALIDATION:');
      console.log('✅ Summary data:', !!data.data?.summary);
      console.log('✅ Daily sales data:', !!data.data?.dailySales);
      console.log('✅ Top medicines data:', !!data.data?.topMedicines);
      console.log('✅ Inventory data:', !!data.data?.inventory);
      console.log('✅ Customer data:', !!data.data?.customers);
      console.log('✅ Operations data:', !!data.data?.operations);

      console.log('\n📋 DATATABLE DATA VALIDATION:');
      console.log('✅ Low stock medicines data:', !!data.data?.inventory?.lowStockMedicinesData, `(${data.data?.inventory?.lowStockMedicinesData?.length || 0} items)`);
      console.log('✅ Top customers data:', !!data.data?.customers?.topCustomers, `(${data.data?.customers?.topCustomers?.length || 0} items)`);

      if (data.data?.inventory?.lowStockMedicinesData?.length > 0) {
        console.log('📦 Sample low stock medicine:', data.data.inventory.lowStockMedicinesData[0]);
      }

      if (data.data?.customers?.topCustomers?.length > 0) {
        console.log('👥 Sample top customer:', data.data.customers.topCustomers[0]);
      }
      
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

connectDB().then(testEnhancedAnalytics).catch(console.error);

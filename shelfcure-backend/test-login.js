const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
};

const testLogin = async () => {
  try {
    const { default: fetch } = await import('node-fetch');
    
    // Test login with store manager credentials
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'mota@gmail.com',
        password: 'password123' // You might need to check what the actual password is
      })
    });

    console.log('Login Response Status:', loginResponse.status);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful!');
      console.log('- User:', loginData.user?.name, '(', loginData.user?.email, ')');
      console.log('- Role:', loginData.user?.role);
      console.log('- Token:', loginData.token ? 'Present' : 'Missing');
      
      if (loginData.token) {
        console.log('\n🧪 Testing Analytics API with real token...');
        
        const analyticsResponse = await fetch('http://localhost:5000/api/store-manager/analytics?period=30d', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Analytics Response Status:', analyticsResponse.status);
        
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          console.log('✅ Analytics data received:');
          console.log('- Success:', analyticsData.success);
          console.log('- Period:', analyticsData.data?.period);
          console.log('- Total Revenue:', analyticsData.data?.summary?.totalRevenue);
          console.log('- Total Sales:', analyticsData.data?.summary?.totalSales);
          console.log('- Daily Sales Count:', analyticsData.data?.dailySales?.length);
          console.log('- Top Medicines Count:', analyticsData.data?.topMedicines?.length);
          
          console.log('\n📋 Copy this token to localStorage in browser:');
          console.log(`localStorage.setItem('token', '${loginData.token}');`);
          console.log(`localStorage.setItem('user', '${JSON.stringify(loginData.user)}');`);
        } else {
          const errorData = await analyticsResponse.text();
          console.log('❌ Analytics API Error:', errorData);
        }
      }
    } else {
      const errorData = await loginResponse.text();
      console.log('❌ Login failed:', errorData);
      
      // Let's check what passwords are available for this user
      const User = require('./models/User');
      const user = await User.findOne({ email: 'mota@gmail.com' });
      if (user) {
        console.log('\n🔍 User found in database');
        console.log('- Name:', user.name);
        console.log('- Email:', user.email);
        console.log('- Role:', user.role);
        console.log('- Active:', user.isActive);
        console.log('- Has password:', !!user.password);
        
        // Try common passwords
        const commonPasswords = ['password', 'password123', '123456', 'admin', 'mota123'];
        for (const pwd of commonPasswords) {
          const isMatch = await user.matchPassword(pwd);
          if (isMatch) {
            console.log(`✅ Password found: ${pwd}`);
            break;
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

connectDB().then(testLogin).catch(console.error);

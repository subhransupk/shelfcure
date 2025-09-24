const axios = require('axios');

const testAffiliateAuth = async () => {
  try {
    console.log('🧪 Testing Affiliate Authentication...');
    
    // Step 1: Login as affiliate
    console.log('1. Logging in as test affiliate...');
    const loginResponse = await axios.post('http://localhost:5000/api/affiliate-panel/login', {
      email: 'test.affiliate@shelfcure.com',
      password: 'testpass123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful!');
      console.log('Token received:', loginResponse.data.token ? 'Yes' : 'No');
      
      const token = loginResponse.data.token;
      
      // Step 2: Test analytics endpoint
      console.log('2. Testing analytics endpoint...');
      const analyticsResponse = await axios.get('http://localhost:5000/api/affiliate-panel/analytics?days=30', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (analyticsResponse.data.success) {
        console.log('✅ Analytics endpoint working!');
        console.log('Data received:', Object.keys(analyticsResponse.data.data));
        console.log('Total earnings:', analyticsResponse.data.data.overview?.totalEarnings);
      } else {
        console.log('❌ Analytics endpoint failed:', analyticsResponse.data.message);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);
  }
};

testAffiliateAuth();

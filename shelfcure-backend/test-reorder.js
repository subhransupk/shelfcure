const axios = require('axios');

const testReorderEndpoint = async () => {
  try {
    console.log('🧪 Testing Reorder Suggestions Endpoint...\n');

    // Step 1: Login as store manager
    console.log('Step 1: Store manager login');
    const managerResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'mota@gmail.com',
      password: 'password123'
    });

    if (managerResponse.data.success) {
      console.log('✅ Store manager login successful');
      const managerToken = managerResponse.data.token;
      console.log('👤 User:', managerResponse.data.user.name);
      console.log('🏪 Current Store:', managerResponse.data.user.currentStore?.name || 'No store assigned');

      // Step 2: Test reorder suggestions endpoint
      console.log('\nStep 2: Testing reorder suggestions endpoint...');
      try {
        const reorderResponse = await axios.get('http://localhost:5000/api/store-manager/purchases/reorder-suggestions', {
          headers: {
            'Authorization': `Bearer ${managerToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Reorder suggestions endpoint successful');
        console.log('📊 Suggestions count:', reorderResponse.data.count);
        console.log('📋 Sample data:', JSON.stringify(reorderResponse.data.data.slice(0, 2), null, 2));
      } catch (error) {
        console.log('❌ Reorder suggestions failed:', error.response?.data?.message || error.message);
        console.log('Status:', error.response?.status);
        if (error.response?.data) {
          console.log('Error details:', JSON.stringify(error.response.data, null, 2));
        }
      }

      // Step 3: Test regular purchases endpoint
      console.log('\nStep 3: Testing regular purchases endpoint...');
      try {
        const purchasesResponse = await axios.get('http://localhost:5000/api/store-manager/purchases?page=1&limit=20', {
          headers: {
            'Authorization': `Bearer ${managerToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Purchases endpoint successful');
        console.log('📊 Purchases count:', purchasesResponse.data.data.length);
      } catch (error) {
        console.log('❌ Purchases failed:', error.response?.data?.message || error.message);
        console.log('Status:', error.response?.status);
      }
    }
  } catch (error) {
    console.log('❌ Store manager login failed:', error.response?.data?.message || error.message);
    if (error.response?.status) {
      console.log('Status:', error.response.status);
    }
  }
};

testReorderEndpoint();

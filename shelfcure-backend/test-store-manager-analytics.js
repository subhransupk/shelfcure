const axios = require('axios');

const testStoreManagerAnalytics = async () => {
  try {
    console.log('🧪 Testing Store Manager Analytics API...\n');

    // First, let's try to login as admin and create a store manager if needed
    console.log('Step 1: Admin login');
    const adminResponse = await axios.post('http://localhost:5000/api/auth/admin-login', {
      email: 'admin@shelfcure.com',
      password: 'admin123'
    });

    if (!adminResponse.data.success) {
      throw new Error('Admin login failed');
    }

    console.log('✅ Admin login successful');
    const adminToken = adminResponse.data.token;

    // Try to find existing store managers
    console.log('\nStep 2: Looking for existing store managers...');
    try {
      const usersResponse = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const storeManagers = usersResponse.data.data?.users?.filter(user => user.role === 'store_manager') || [];
      console.log(`Found ${storeManagers.length} store managers`);

      if (storeManagers.length > 0) {
        const manager = storeManagers[0];
        console.log(`Using existing store manager: ${manager.name} (${manager.email})`);
        
        // Try to login as this store manager
        console.log('\nStep 3: Store manager login...');
        try {
          const managerResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: manager.email,
            password: 'manager123' // Default password
          });

          if (managerResponse.data.success) {
            console.log('✅ Store manager login successful');
            const managerToken = managerResponse.data.token;

            // Test analytics endpoint
            console.log('\nStep 4: Testing analytics endpoint...');
            const analyticsResponse = await axios.get('http://localhost:5000/api/store-manager/analytics?period=30d', {
              headers: { 'Authorization': `Bearer ${managerToken}` }
            });

            if (analyticsResponse.data.success) {
              console.log('✅ Analytics endpoint working!');
              console.log('📊 Analytics data:', JSON.stringify(analyticsResponse.data.data, null, 2));
            } else {
              console.log('❌ Analytics endpoint failed:', analyticsResponse.data.message);
            }
          } else {
            console.log('❌ Store manager login failed - trying default password');
          }
        } catch (loginError) {
          console.log('❌ Store manager login failed:', loginError.response?.data?.message || loginError.message);
          console.log('💡 This is expected if the store manager password is different');
        }
      } else {
        console.log('❌ No store managers found in the system');
        console.log('💡 You may need to create a store manager user first');
      }
    } catch (error) {
      console.log('❌ Failed to fetch users:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Test completed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('📝 Response:', error.response.data);
    }
  }
};

// Run the test
testStoreManagerAnalytics();

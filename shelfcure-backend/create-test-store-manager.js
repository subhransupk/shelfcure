const axios = require('axios');

const createTestStoreManager = async () => {
  try {
    console.log('🧪 Creating Test Store Manager...\n');

    // Step 1: Admin login
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

    // Step 2: Create a test store manager
    console.log('\nStep 2: Creating test store manager...');
    const testManagerData = {
      name: 'Test Store Manager',
      email: 'testmanager@shelfcure.com',
      password: 'manager123',
      role: 'store_manager',
      phone: '+1234567890',
      address: '123 Test Street, Test City',
      isActive: true
    };

    try {
      const createResponse = await axios.post('http://localhost:5000/api/admin/users', testManagerData, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (createResponse.data.success) {
        console.log('✅ Test store manager created successfully');
        console.log('📧 Email:', testManagerData.email);
        console.log('🔑 Password:', testManagerData.password);
        console.log('👤 Name:', testManagerData.name);
        
        // Step 3: Test login with the new store manager
        console.log('\nStep 3: Testing store manager login...');
        const managerResponse = await axios.post('http://localhost:5000/api/auth/login', {
          email: testManagerData.email,
          password: testManagerData.password
        });

        if (managerResponse.data.success) {
          console.log('✅ Store manager login successful');
          const managerToken = managerResponse.data.token;

          // Step 4: Test analytics endpoint
          console.log('\nStep 4: Testing analytics endpoint...');
          try {
            const analyticsResponse = await axios.get('http://localhost:5000/api/store-manager/analytics?period=30d', {
              headers: { 'Authorization': `Bearer ${managerToken}` }
            });

            if (analyticsResponse.data.success) {
              console.log('✅ Analytics endpoint working!');
              console.log('📊 Analytics data received');
              console.log('📈 Summary:', JSON.stringify(analyticsResponse.data.data.summary, null, 2));
            } else {
              console.log('❌ Analytics endpoint failed:', analyticsResponse.data.message);
            }
          } catch (analyticsError) {
            console.log('❌ Analytics endpoint error:', analyticsError.response?.data?.message || analyticsError.message);
            console.log('💡 This might be due to missing store assignment or permissions');
          }
        } else {
          console.log('❌ Store manager login failed:', managerResponse.data.message);
        }
      } else {
        console.log('❌ Failed to create store manager:', createResponse.data.message);
      }
    } catch (createError) {
      if (createError.response?.status === 400 && createError.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ Test store manager already exists, trying to login...');
        
        // Try to login with existing user
        const managerResponse = await axios.post('http://localhost:5000/api/auth/login', {
          email: testManagerData.email,
          password: testManagerData.password
        });

        if (managerResponse.data.success) {
          console.log('✅ Existing store manager login successful');
          const managerToken = managerResponse.data.token;

          // Test analytics endpoint
          console.log('\nTesting analytics endpoint with existing manager...');
          try {
            const analyticsResponse = await axios.get('http://localhost:5000/api/store-manager/analytics?period=30d', {
              headers: { 'Authorization': `Bearer ${managerToken}` }
            });

            if (analyticsResponse.data.success) {
              console.log('✅ Analytics endpoint working!');
              console.log('📊 Analytics data received');
              console.log('📈 Summary:', JSON.stringify(analyticsResponse.data.data.summary, null, 2));
            } else {
              console.log('❌ Analytics endpoint failed:', analyticsResponse.data.message);
            }
          } catch (analyticsError) {
            console.log('❌ Analytics endpoint error:', analyticsError.response?.data?.message || analyticsError.message);
          }
        } else {
          console.log('❌ Existing store manager login failed');
        }
      } else {
        console.log('❌ Error creating store manager:', createError.response?.data?.message || createError.message);
      }
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
createTestStoreManager();

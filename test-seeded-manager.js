const axios = require('axios');

const testSeededManager = async () => {
  try {
    console.log('🧪 Testing Seeded Store Manager...\n');

    // Test the seeded store manager credentials
    console.log('Step 1: Testing seeded store manager login');
    const managerResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'manager@shelfcure.com',
      password: 'manager123'
    });

    if (managerResponse.data.success) {
      console.log('✅ Seeded store manager login successful');
      console.log('👤 User:', managerResponse.data.user.name);
      console.log('🏪 Current Store:', managerResponse.data.user.currentStore?.name || 'No store assigned');
      
      const managerToken = managerResponse.data.token;
      
      // Test the API endpoints that were failing
      console.log('\nStep 2: Testing API endpoints...');
      
      // Test getRacks
      try {
        const racksResponse = await axios.get('http://localhost:5000/api/store-manager/racks?page=1&limit=12', {
          headers: { 'Authorization': `Bearer ${managerToken}` }
        });
        
        if (racksResponse.data.success) {
          console.log('✅ getRacks endpoint working! Found', racksResponse.data.count || 0, 'racks');
        } else {
          console.log('❌ getRacks failed:', racksResponse.data.message);
        }
      } catch (error) {
        console.log('❌ getRacks error:', error.response?.status, error.response?.data?.message);
      }
      
      // Test getUnassignedMedicines
      try {
        const medicinesResponse = await axios.get('http://localhost:5000/api/store-manager/medicine-locations/unassigned', {
          headers: { 'Authorization': `Bearer ${managerToken}` }
        });
        
        if (medicinesResponse.data.success) {
          console.log('✅ getUnassignedMedicines endpoint working! Found', medicinesResponse.data.count || 0, 'medicines');
        } else {
          console.log('❌ getUnassignedMedicines failed:', medicinesResponse.data.message);
        }
      } catch (error) {
        console.log('❌ getUnassignedMedicines error:', error.response?.status, error.response?.data?.message);
      }
      
      // Test other endpoints
      const endpoints = [
        { name: 'Analytics', url: '/api/store-manager/analytics?period=30d' },
        { name: 'Dashboard Stats', url: '/api/store-manager/dashboard-stats' },
        { name: 'Medicines', url: '/api/store-manager/medicines?page=1&limit=10' }
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`http://localhost:5000${endpoint.url}`, {
            headers: { 'Authorization': `Bearer ${managerToken}` }
          });
          
          if (response.data.success) {
            console.log(`✅ ${endpoint.name} endpoint working`);
          } else {
            console.log(`❌ ${endpoint.name} failed:`, response.data.message);
          }
        } catch (error) {
          console.log(`❌ ${endpoint.name} error:`, error.response?.status, error.response?.data?.message);
        }
      }
      
      console.log('\n🎉 API endpoints testing completed!');
      console.log('\n📋 Working Credentials:');
      console.log('Store Manager: manager@shelfcure.com / manager123');
      console.log('Admin: admin@shelfcure.com / admin123');
      
    } else {
      console.log('❌ Seeded store manager login failed:', managerResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
};

// Run the test
testSeededManager();

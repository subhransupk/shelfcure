const axios = require('axios');

const testAPIEndpoints = async () => {
  try {
    console.log('🧪 Testing API Endpoints that were causing 500 errors...\n');

    // Step 1: Try admin login first
    console.log('Step 1: Admin login');
    let adminToken = null;
    try {
      const adminResponse = await axios.post('http://localhost:5000/api/auth/admin-login', {
        email: 'admin@shelfcure.com',
        password: 'admin123'
      });

      if (adminResponse.data.success) {
        console.log('✅ Admin login successful');
        adminToken = adminResponse.data.token;
      }
    } catch (error) {
      console.log('❌ Admin login failed:', error.response?.data?.message || error.message);
    }

    // Step 2: Try to login as store manager
    console.log('\nStep 2: Store manager login');
    let managerToken = null;
    try {
      const managerResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'testmanager@shelfcure.com',
        password: 'manager123'
      });

      if (managerResponse.data.success) {
        console.log('✅ Store manager login successful');
        managerToken = managerResponse.data.token;
        console.log('👤 User:', managerResponse.data.user.name);
        console.log('🏪 Current Store:', managerResponse.data.user.currentStore?.name || 'No store assigned');
      }
    } catch (error) {
      console.log('❌ Store manager login failed:', error.response?.data?.message || error.message);
    }

    // Step 3: Test the problematic API endpoints
    if (managerToken) {
      console.log('\nStep 3: Testing problematic API endpoints...');
      
      // Test getRacks endpoint
      console.log('\n3a. Testing getRacks endpoint...');
      try {
        const racksResponse = await axios.get('http://localhost:5000/api/store-manager/racks?page=1&limit=12', {
          headers: { 'Authorization': `Bearer ${managerToken}` }
        });
        
        if (racksResponse.data.success) {
          console.log('✅ getRacks endpoint working');
          console.log('📦 Racks found:', racksResponse.data.count || 0);
        } else {
          console.log('❌ getRacks failed:', racksResponse.data.message);
        }
      } catch (error) {
        console.log('❌ getRacks error:', error.response?.status, error.response?.data?.message || error.message);
      }

      // Test getUnassignedMedicines endpoint
      console.log('\n3b. Testing getUnassignedMedicines endpoint...');
      try {
        const medicinesResponse = await axios.get('http://localhost:5000/api/store-manager/medicine-locations/unassigned', {
          headers: { 'Authorization': `Bearer ${managerToken}` }
        });
        
        if (medicinesResponse.data.success) {
          console.log('✅ getUnassignedMedicines endpoint working');
          console.log('💊 Unassigned medicines found:', medicinesResponse.data.count || 0);
        } else {
          console.log('❌ getUnassignedMedicines failed:', medicinesResponse.data.message);
        }
      } catch (error) {
        console.log('❌ getUnassignedMedicines error:', error.response?.status, error.response?.data?.message || error.message);
      }

      // Test other endpoints that might be failing
      console.log('\n3c. Testing other store manager endpoints...');
      
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
          console.log(`❌ ${endpoint.name} error:`, error.response?.status, error.response?.data?.message || error.message);
        }
      }
    } else {
      console.log('\n❌ Cannot test API endpoints - no valid manager token');
    }

    // Step 4: If we have admin token, try to create a proper test setup
    if (adminToken && !managerToken) {
      console.log('\nStep 4: Attempting to create proper test setup...');
      
      // Try to create a test store owner with subscription
      try {
        console.log('Creating test store owner...');
        const storeOwnerData = {
          name: 'Test Store Owner',
          email: 'testowner2@shelfcure.com',
          password: 'owner123',
          role: 'store_owner',
          phone: '+1234567892',
          address: '456 Test Street, Test City',
          isActive: true
        };

        const createOwnerResponse = await axios.post('http://localhost:5000/api/admin/users', storeOwnerData, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (createOwnerResponse.data.success) {
          console.log('✅ Test store owner created');
          
          // Login as store owner
          const ownerLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: storeOwnerData.email,
            password: storeOwnerData.password
          });

          if (ownerLoginResponse.data.success) {
            console.log('✅ Store owner login successful');
            const ownerToken = ownerLoginResponse.data.token;
            
            // Create a test store
            const storeData = {
              name: 'Test Pharmacy Store',
              address: '123 Pharmacy Street, Test City',
              phone: '+1234567893',
              email: 'teststore@shelfcure.com'
            };

            const createStoreResponse = await axios.post('http://localhost:5000/api/store-owner/stores', storeData, {
              headers: { 'Authorization': `Bearer ${ownerToken}` }
            });

            if (createStoreResponse.data.success) {
              console.log('✅ Test store created');
              console.log('🏪 Store:', createStoreResponse.data.data.name);
            }
          }
        }
      } catch (error) {
        console.log('❌ Test setup failed:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n🎉 API endpoint testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testAPIEndpoints();

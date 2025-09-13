const axios = require('axios');

const setupCompleteTestEnvironment = async () => {
  try {
    console.log('🧪 Setting up Complete Test Environment for Store Manager Analytics...\n');

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

    // Step 2: Create test store owner with subscription
    console.log('\nStep 2: Creating test store owner with subscription...');
    const storeOwnerData = {
      name: 'Test Store Owner',
      email: 'testowner@shelfcure.com',
      password: 'owner123',
      role: 'store_owner',
      phone: '+1234567891',
      address: '456 Owner Street, Owner City',
      subscriptionPlan: 'standard', // Standard plan includes analytics
      maxStores: 3,
      billingDuration: 'monthly',
      assignImmediately: true,
      startWithTrial: false,
      isActive: true
    };

    let storeOwner = null;
    try {
      const createOwnerResponse = await axios.post('http://localhost:5000/api/auth/admin/users', storeOwnerData, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (createOwnerResponse.data.success) {
        console.log('✅ Test store owner created successfully');
        storeOwner = createOwnerResponse.data.data;
      }
    } catch (createError) {
      if (createError.response?.status === 400 && createError.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ Test store owner already exists, fetching existing user...');
        
        // Get existing user
        const usersResponse = await axios.get('http://localhost:5000/api/admin/users', {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const existingOwner = usersResponse.data.data?.users?.find(user => user.email === storeOwnerData.email);
        if (existingOwner) {
          storeOwner = existingOwner;
          console.log('✅ Found existing store owner');
        }
      } else {
        throw createError;
      }
    }

    if (!storeOwner) {
      throw new Error('Failed to create or find store owner');
    }

    console.log('📧 Store Owner Email:', storeOwnerData.email);
    console.log('🔑 Store Owner Password:', storeOwnerData.password);

    // Step 3: Login as store owner to create a store
    console.log('\nStep 3: Logging in as store owner to create store...');
    const ownerLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: storeOwnerData.email,
      password: storeOwnerData.password
    });

    if (!ownerLoginResponse.data.success) {
      throw new Error('Store owner login failed');
    }

    console.log('✅ Store owner login successful');
    const ownerToken = ownerLoginResponse.data.token;

    // Step 4: Create a test store
    console.log('\nStep 4: Creating test store...');
    const storeData = {
      name: 'Test Pharmacy Store',
      address: '789 Pharmacy Lane, Med City',
      phone: '+1234567892',
      email: 'teststore@shelfcure.com',
      licenseNumber: 'TEST-LIC-001',
      gstNumber: 'TEST-GST-001'
    };

    let store = null;
    try {
      const createStoreResponse = await axios.post('http://localhost:5000/api/store-owner/stores', storeData, {
        headers: { 'Authorization': `Bearer ${ownerToken}` }
      });

      if (createStoreResponse.data.success) {
        console.log('✅ Test store created successfully');
        store = createStoreResponse.data.data;
        console.log('🏪 Store Name:', store.name);
        console.log('🏪 Store Code:', store.code);
      }
    } catch (storeError) {
      console.log('ℹ️ Store creation failed, might already exist. Fetching existing stores...');
      
      // Get existing stores
      const storesResponse = await axios.get('http://localhost:5000/api/store-owner/stores', {
        headers: { 'Authorization': `Bearer ${ownerToken}` }
      });
      
      if (storesResponse.data.success && storesResponse.data.data?.length > 0) {
        store = storesResponse.data.data[0];
        console.log('✅ Using existing store:', store.name);
      }
    }

    if (!store) {
      throw new Error('Failed to create or find store');
    }

    // Step 5: Create/update store manager and assign to store
    console.log('\nStep 5: Creating store manager and assigning to store...');
    const managerData = {
      name: 'Test Store Manager',
      email: 'testmanager@shelfcure.com',
      password: 'manager123',
      role: 'store_manager',
      phone: '+1234567890',
      address: '123 Manager Street, Manager City',
      stores: [store._id],
      isActive: true
    };

    // Create store manager via admin endpoint
    try {
      const createManagerResponse = await axios.post('http://localhost:5000/api/admin/users', managerData, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (createManagerResponse.data.success) {
        console.log('✅ Store manager created and assigned to store');
      }
    } catch (managerError) {
      if (managerError.response?.status === 400 && managerError.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ Store manager already exists');
      } else {
        console.log('⚠️ Store manager creation failed:', managerError.response?.data?.message);
      }
    }

    // Step 6: Test store manager login and analytics
    console.log('\nStep 6: Testing store manager login and analytics...');
    const managerLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: managerData.email,
      password: managerData.password
    });

    if (managerLoginResponse.data.success) {
      console.log('✅ Store manager login successful');
      const managerToken = managerLoginResponse.data.token;

      // Test analytics endpoint
      console.log('\nStep 7: Testing analytics endpoint...');
      try {
        const analyticsResponse = await axios.get('http://localhost:5000/api/store-manager/analytics?period=30d', {
          headers: { 'Authorization': `Bearer ${managerToken}` }
        });

        if (analyticsResponse.data.success) {
          console.log('🎉 SUCCESS! Analytics endpoint is working!');
          console.log('📊 Analytics data received');
          console.log('📈 Summary:', JSON.stringify(analyticsResponse.data.data.summary, null, 2));
          
          console.log('\n' + '='.repeat(60));
          console.log('🎯 SOLUTION SUMMARY');
          console.log('='.repeat(60));
          console.log('✅ Store Manager Analytics is now working!');
          console.log('✅ Test credentials created:');
          console.log('   📧 Store Manager: testmanager@shelfcure.com');
          console.log('   🔑 Password: manager123');
          console.log('   🏪 Assigned Store:', store.name);
          console.log('✅ Frontend should now work with proper authentication');
          console.log('='.repeat(60));
        } else {
          console.log('❌ Analytics endpoint failed:', analyticsResponse.data.message);
        }
      } catch (analyticsError) {
        console.log('❌ Analytics endpoint error:', analyticsError.response?.data?.message || analyticsError.message);
        console.log('📝 Full error response:', JSON.stringify(analyticsError.response?.data, null, 2));
      }
    } else {
      console.log('❌ Store manager login failed:', managerLoginResponse.data.message);
    }

    console.log('\n🎉 Setup completed!\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    if (error.response) {
      console.error('📝 Response:', error.response.data);
    }
  }
};

// Run the setup
setupCompleteTestEnvironment();

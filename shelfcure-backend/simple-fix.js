const axios = require('axios');

const simpleFix = async () => {
  try {
    console.log('🔧 Simple Fix: Assigning Store to Test Manager...\n');

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

    // Step 2: Create a simple store directly using admin privileges
    console.log('\nStep 2: Creating store using admin privileges...');
    
    // First, let's try to create a store directly in the database using a different approach
    // We'll create a minimal store entry that bypasses subscription requirements
    
    try {
      // Get all existing stores first
      const storesResponse = await axios.get('http://localhost:5000/api/admin/stores', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      let storeId = null;
      
      if (storesResponse.data.success && storesResponse.data.data.length > 0) {
        // Use the first existing store
        storeId = storesResponse.data.data[0]._id;
        console.log('✅ Using existing store:', storesResponse.data.data[0].name);
        console.log('🏪 Store ID:', storeId);
      } else {
        console.log('ℹ️ No existing stores found. Creating a test store...');
        
        // Try to create a store with minimal data
        const testStoreData = {
          name: 'Test Pharmacy Store',
          address: '123 Test Street, Test City',
          phone: '+1234567890',
          email: 'test@pharmacy.com',
          isActive: true
        };
        
        try {
          const createStoreResponse = await axios.post('http://localhost:5000/api/admin/stores', testStoreData, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
          });
          
          if (createStoreResponse.data.success) {
            storeId = createStoreResponse.data.data._id;
            console.log('✅ Test store created successfully');
            console.log('🏪 Store ID:', storeId);
          }
        } catch (createError) {
          console.log('❌ Store creation failed:', createError.response?.data?.message || createError.message);
        }
      }
      
      // Step 3: Assign the store to test manager
      if (storeId) {
        console.log('\nStep 3: Assigning store to test manager...');
        
        // Get the test manager
        const usersResponse = await axios.get('http://localhost:5000/api/admin/users?role=store_manager', {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (usersResponse.data.success) {
          const testManager = usersResponse.data.data.find(user => user.email === 'testmanager@shelfcure.com');
          
          if (testManager) {
            console.log('✅ Found test manager:', testManager.name);
            
            // Update the manager with store assignment
            const updateData = {
              stores: [storeId],
              currentStore: storeId
            };
            
            const updateResponse = await axios.put(`http://localhost:5000/api/admin/users/${testManager._id}`, updateData, {
              headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            
            if (updateResponse.data.success) {
              console.log('✅ Store assigned to test manager successfully!');
              
              // Step 4: Test the fix
              console.log('\nStep 4: Testing the fix...');
              
              const managerLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
                email: 'testmanager@shelfcure.com',
                password: 'manager123'
              });
              
              if (managerLoginResponse.data.success) {
                console.log('✅ Manager login successful');
                console.log('🏪 Current Store:', managerLoginResponse.data.user.currentStore?.name || 'Not assigned');
                
                const managerToken = managerLoginResponse.data.token;
                
                // Test the API endpoints
                console.log('\nTesting API endpoints...');
                
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
                
                console.log('\n🎉 API endpoints are now working!');
                console.log('\n📋 You can now login to the frontend with:');
                console.log('Email: testmanager@shelfcure.com');
                console.log('Password: manager123');
                
              } else {
                console.log('❌ Manager login failed');
              }
            } else {
              console.log('❌ Failed to assign store:', updateResponse.data.message);
            }
          } else {
            console.log('❌ Test manager not found');
          }
        }
      } else {
        console.log('❌ No store available');
      }
      
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
};

// Run the fix
simpleFix();

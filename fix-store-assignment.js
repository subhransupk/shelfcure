const axios = require('axios');

const fixStoreAssignment = async () => {
  try {
    console.log('🔧 Fixing Store Assignment for Test Store Manager...\n');

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

    // Step 2: Create or find a store owner
    console.log('\nStep 2: Creating/finding store owner...');
    let storeOwnerToken = null;
    let storeOwnerId = null;

    try {
      // Try to create a new store owner
      const storeOwnerData = {
        name: 'Test Store Owner',
        email: 'owner@teststore.com',
        password: 'owner123',
        role: 'store_owner',
        phone: '+1234567890',
        address: '123 Owner Street, Test City',
        isActive: true
      };

      const createOwnerResponse = await axios.post('http://localhost:5000/api/admin/users', storeOwnerData, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (createOwnerResponse.data.success) {
        console.log('✅ New store owner created');
        storeOwnerId = createOwnerResponse.data.data._id;
      }
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ Store owner already exists, finding existing one...');
        
        // Get existing users to find the store owner
        try {
          const usersResponse = await axios.get('http://localhost:5000/api/admin/users?role=store_owner', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
          });
          
          if (usersResponse.data.success && usersResponse.data.data.length > 0) {
            const existingOwner = usersResponse.data.data.find(user => user.email === 'owner@teststore.com');
            if (existingOwner) {
              storeOwnerId = existingOwner._id;
              console.log('✅ Found existing store owner');
            }
          }
        } catch (getUsersError) {
          console.log('❌ Could not find existing store owner');
        }
      }
    }

    // Login as store owner
    if (storeOwnerId) {
      try {
        const ownerLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
          email: 'owner@teststore.com',
          password: 'owner123'
        });

        if (ownerLoginResponse.data.success) {
          console.log('✅ Store owner login successful');
          storeOwnerToken = ownerLoginResponse.data.token;
        }
      } catch (loginError) {
        console.log('❌ Store owner login failed:', loginError.response?.data?.message);
      }
    }

    // Step 3: Create a test store
    console.log('\nStep 3: Creating test store...');
    let storeId = null;

    if (storeOwnerToken) {
      try {
        const storeData = {
          name: 'Test Pharmacy',
          address: '123 Test Street, Test City, TC 12345',
          phone: '+1234567891',
          email: 'testpharmacy@example.com',
          licenseNumber: 'TEST-LIC-001',
          gstNumber: 'TEST-GST-001'
        };

        const createStoreResponse = await axios.post('http://localhost:5000/api/store-owner/stores', storeData, {
          headers: { 'Authorization': `Bearer ${storeOwnerToken}` }
        });

        if (createStoreResponse.data.success) {
          console.log('✅ Test store created successfully');
          storeId = createStoreResponse.data.data._id;
          console.log('🏪 Store ID:', storeId);
          console.log('🏪 Store Name:', createStoreResponse.data.data.name);
        }
      } catch (storeError) {
        if (storeError.response?.status === 400 && storeError.response?.data?.message?.includes('already exists')) {
          console.log('ℹ️ Store might already exist, trying to get existing stores...');
          
          try {
            const storesResponse = await axios.get('http://localhost:5000/api/store-owner/stores', {
              headers: { 'Authorization': `Bearer ${storeOwnerToken}` }
            });
            
            if (storesResponse.data.success && storesResponse.data.data.length > 0) {
              storeId = storesResponse.data.data[0]._id;
              console.log('✅ Using existing store');
              console.log('🏪 Store ID:', storeId);
              console.log('🏪 Store Name:', storesResponse.data.data[0].name);
            }
          } catch (getStoresError) {
            console.log('❌ Could not get existing stores');
          }
        } else {
          console.log('❌ Store creation failed:', storeError.response?.data?.message || storeError.message);
        }
      }
    }

    // Step 4: Assign store to the test store manager
    console.log('\nStep 4: Assigning store to test store manager...');
    
    if (storeId) {
      try {
        // First, get the store manager user ID
        const usersResponse = await axios.get('http://localhost:5000/api/admin/users?role=store_manager', {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (usersResponse.data.success) {
          const testManager = usersResponse.data.data.find(user => user.email === 'testmanager@shelfcure.com');
          
          if (testManager) {
            console.log('✅ Found test store manager');
            console.log('👤 Manager ID:', testManager._id);
            
            // Update the store manager to assign the store
            const updateData = {
              stores: [storeId],
              currentStore: storeId
            };
            
            const updateResponse = await axios.put(`http://localhost:5000/api/admin/users/${testManager._id}`, updateData, {
              headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            
            if (updateResponse.data.success) {
              console.log('✅ Store assigned to test store manager successfully!');
              
              // Step 5: Test the fixed setup
              console.log('\nStep 5: Testing the fixed setup...');
              
              const managerLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
                email: 'testmanager@shelfcure.com',
                password: 'manager123'
              });
              
              if (managerLoginResponse.data.success) {
                console.log('✅ Store manager login successful');
                console.log('🏪 Current Store:', managerLoginResponse.data.user.currentStore?.name);
                const managerToken = managerLoginResponse.data.token;
                
                // Test the problematic endpoints
                console.log('\nTesting previously failing endpoints...');
                
                try {
                  const racksResponse = await axios.get('http://localhost:5000/api/store-manager/racks?page=1&limit=12', {
                    headers: { 'Authorization': `Bearer ${managerToken}` }
                  });
                  console.log('✅ getRacks endpoint now working! Found', racksResponse.data.count || 0, 'racks');
                } catch (error) {
                  console.log('❌ getRacks still failing:', error.response?.data?.message);
                }
                
                try {
                  const medicinesResponse = await axios.get('http://localhost:5000/api/store-manager/medicine-locations/unassigned', {
                    headers: { 'Authorization': `Bearer ${managerToken}` }
                  });
                  console.log('✅ getUnassignedMedicines endpoint now working! Found', medicinesResponse.data.count || 0, 'medicines');
                } catch (error) {
                  console.log('❌ getUnassignedMedicines still failing:', error.response?.data?.message);
                }
              }
            } else {
              console.log('❌ Failed to assign store to manager:', updateResponse.data.message);
            }
          } else {
            console.log('❌ Test store manager not found');
          }
        }
      } catch (error) {
        console.log('❌ Store assignment failed:', error.response?.data?.message || error.message);
      }
    } else {
      console.log('❌ No store available to assign');
    }

    console.log('\n🎉 Store assignment fix completed!');
    console.log('\n📋 Test Credentials:');
    console.log('Store Manager: testmanager@shelfcure.com / manager123');
    console.log('Store Owner: owner@teststore.com / owner123');
    console.log('Admin: admin@shelfcure.com / admin123');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
};

// Run the fix
fixStoreAssignment();

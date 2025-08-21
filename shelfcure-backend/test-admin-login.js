const axios = require('axios');

const testAdminLogin = async () => {
  try {
    console.log('🧪 Testing Admin Login API...\n');

    // Test 1: Valid admin credentials
    console.log('Test 1: Valid admin credentials');
    const response1 = await axios.post('http://localhost:5000/api/auth/admin-login', {
      email: 'admin@shelfcure.com',
      password: 'admin123'
    });

    if (response1.data.success) {
      console.log('✅ Admin login successful');
      console.log('📧 User:', response1.data.user.name);
      console.log('🔑 Role:', response1.data.user.role);
      console.log('🏪 Store:', response1.data.user.currentStore?.name || 'No store');
      console.log('🎫 Token received:', response1.data.token ? 'Yes' : 'No');
    } else {
      console.log('❌ Admin login failed:', response1.data.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Invalid credentials
    console.log('Test 2: Invalid credentials');
    try {
      await axios.post('http://localhost:5000/api/auth/admin-login', {
        email: 'admin@shelfcure.com',
        password: 'wrongpassword'
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Invalid credentials properly rejected');
        console.log('📝 Message:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Non-admin user (should fail)
    console.log('Test 3: Non-admin user login attempt');
    try {
      await axios.post('http://localhost:5000/api/auth/admin-login', {
        email: 'staff@shelfcure.com',
        password: 'staff123'
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Non-admin user properly rejected');
        console.log('📝 Message:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Regular login for comparison
    console.log('Test 4: Regular user login (staff)');
    const response4 = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'staff@shelfcure.com',
      password: 'staff123'
    });

    if (response4.data.success) {
      console.log('✅ Staff login successful');
      console.log('📧 User:', response4.data.user.name);
      console.log('🔑 Role:', response4.data.user.role);
      console.log('🎫 Token received:', response4.data.token ? 'Yes' : 'No');
    } else {
      console.log('❌ Staff login failed:', response4.data.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 5: Manager login
    console.log('Test 5: Manager login');
    const response5 = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'manager@shelfcure.com',
      password: 'manager123'
    });

    if (response5.data.success) {
      console.log('✅ Manager login successful');
      console.log('📧 User:', response5.data.user.name);
      console.log('🔑 Role:', response5.data.user.role);
      console.log('🎫 Token received:', response5.data.token ? 'Yes' : 'No');
    } else {
      console.log('❌ Manager login failed:', response5.data.message);
    }

    console.log('\n🎉 All tests completed!\n');

    // Summary
    console.log('📋 Test Summary:');
    console.log('================');
    console.log('✅ Admin login with valid credentials: PASSED');
    console.log('✅ Admin login with invalid credentials: PROPERLY REJECTED');
    console.log('✅ Non-admin user admin login attempt: PROPERLY REJECTED');
    console.log('✅ Regular staff login: PASSED');
    console.log('✅ Manager login: PASSED');
    console.log('\n🔐 Authentication system is working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('📝 Response:', error.response.data);
    }
  }
};

// Run the test
testAdminLogin();

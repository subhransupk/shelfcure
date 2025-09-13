#!/usr/bin/env node

const axios = require('axios');

const testOptionalFields = async () => {
  try {
    console.log('🧪 Testing Optional Fields (GST, PAN, Address)\n');

    // Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'manager@test.com',
      password: 'password123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Test with empty optional fields
    console.log('2. Testing with empty GST, PAN, and address fields...');
    try {
      const response = await axios.post('http://localhost:5000/api/store-manager/suppliers', {
        name: 'Supplier Without Optional',
        contactPerson: 'Jane Doe',
        phone: '9876543210',
        gstNumber: '',
        panNumber: '',
        address: {
          street: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India'
        }
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ SUCCESS: Supplier created with empty optional fields!');
      console.log(`   - Name: ${response.data.data.name}`);
      console.log(`   - GST: "${response.data.data.gstNumber}" (empty)`);
      console.log(`   - PAN: "${response.data.data.panNumber}" (empty)`);
      console.log(`   - Address: "${response.data.data.address.street}" (empty)`);

    } catch (error) {
      console.log('❌ FAILED: Optional fields validation error:');
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          console.log(`   - ${err.msg || err.message} (field: ${err.path || err.param})`);
        });
      } else {
        console.log(`   - ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n3. Testing with missing optional fields entirely...');
    try {
      const response2 = await axios.post('http://localhost:5000/api/store-manager/suppliers', {
        name: 'Supplier Missing Optional',
        contactPerson: 'Bob Smith',
        phone: '8765432109'
        // No gstNumber, panNumber, or address fields at all
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ SUCCESS: Supplier created without optional fields!');
      console.log(`   - Name: ${response2.data.data.name}`);
      console.log(`   - GST: "${response2.data.data.gstNumber}" (undefined)`);
      console.log(`   - PAN: "${response2.data.data.panNumber}" (undefined)`);

    } catch (error) {
      console.log('❌ FAILED: Missing optional fields error:');
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          console.log(`   - ${err.msg || err.message} (field: ${err.path || err.param})`);
        });
      } else {
        console.log(`   - ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n🎉 Optional fields test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testOptionalFields();

// Test script to verify assignment APIs are working
const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testAPIs() {
  try {
    console.log('🧪 Testing Assignment APIs...');
    
    // First, login to get token
    const loginData = JSON.stringify({
      email: 'manager@subh.com',
      password: 'manager123'
    });
    
    const loginOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };
    
    const loginResponse = await makeRequest(loginOptions, loginData);
    
    if (!loginResponse.success) {
      console.log('❌ Login failed:', loginResponse.message);
      return;
    }
    
    const token = loginResponse.token;
    console.log('✅ Login successful');
    
    // Test getRacks
    console.log('\n📦 Testing getRacks...');
    const racksOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/store-manager/racks',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const racksResponse = await makeRequest(racksOptions);
    console.log('Racks response success:', racksResponse.success);
    console.log('Racks count:', racksResponse.count);
    console.log('Racks data length:', racksResponse.data?.length || 0);
    
    if (racksResponse.data && racksResponse.data.length > 0) {
      console.log('First rack:', {
        _id: racksResponse.data[0]._id,
        rackNumber: racksResponse.data[0].rackNumber,
        name: racksResponse.data[0].name,
        category: racksResponse.data[0].category
      });
    }
    
    // Test getUnassignedMedicines
    console.log('\n💊 Testing getUnassignedMedicines...');
    const medicinesOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/store-manager/medicine-locations/unassigned',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const medicinesResponse = await makeRequest(medicinesOptions);
    console.log('Medicines response success:', medicinesResponse.success);
    console.log('Medicines count:', medicinesResponse.count);
    console.log('Medicines data length:', medicinesResponse.data?.length || 0);
    
    if (medicinesResponse.data && medicinesResponse.data.length > 0) {
      console.log('First medicine:', {
        _id: medicinesResponse.data[0]._id,
        name: medicinesResponse.data[0].name,
        manufacturer: medicinesResponse.data[0].manufacturer
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPIs();

// Quick test script to verify unassigned medicines API
const https = require('https');
const http = require('http');

async function testUnassignedMedicines() {
  try {
    console.log('🧪 Testing unassigned medicines API...');
    
    // First, let's try to get a token by logging in
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'manager@subh.com',
      password: 'manager123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Test unassigned medicines endpoint
    const medicinesResponse = await axios.get('http://localhost:5000/api/store-manager/medicine-locations/unassigned', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('📊 Unassigned medicines response:');
    console.log('Success:', medicinesResponse.data.success);
    console.log('Count:', medicinesResponse.data.count);
    console.log('Data length:', medicinesResponse.data.data?.length || 0);
    
    if (medicinesResponse.data.data && medicinesResponse.data.data.length > 0) {
      console.log('First medicine:', {
        _id: medicinesResponse.data.data[0]._id,
        name: medicinesResponse.data.data[0].name,
        manufacturer: medicinesResponse.data.data[0].manufacturer
      });
    }
    
    // Test search functionality
    console.log('\n🔍 Testing search functionality...');
    const searchResponse = await axios.get('http://localhost:5000/api/store-manager/medicine-locations/search?query=para', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Search response:');
    console.log('Success:', searchResponse.data.success);
    console.log('Count:', searchResponse.data.count);
    console.log('Data length:', searchResponse.data.data?.length || 0);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.status, error.response?.data?.message || error.message);
  }
}

testUnassignedMedicines();

const { default: fetch } = require('node-fetch');

async function testMotaLogin() {
  try {
    console.log('Testing mota login API...');
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'mota@gmail.com',
        password: 'mota123',
        loginType: 'store'
      }),
    });

    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Login successful!');
      console.log('User role:', data.user?.role);
      console.log('User name:', data.user?.name);
      console.log('Token received:', !!data.token);
      console.log('Current store:', data.user?.currentStore?.name);
    } else {
      console.log('❌ Login failed:', data.message);
    }
    
  } catch (error) {
    console.error('Error testing login API:', error);
  }
}

testMotaLogin();

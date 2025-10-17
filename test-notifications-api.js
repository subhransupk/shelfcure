const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testNotificationsAPI() {
  try {
    console.log('🔐 Testing Store Manager Login...');
    
    // Step 1: Login as store manager
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'manager@shelfcure.com',
      password: 'manager123'
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    
    console.log('✅ Login successful!');
    console.log('User:', user.name, '(' + user.email + ')');
    console.log('Role:', user.role);
    console.log('Current Store:', user.currentStore);
    console.log('Token:', token.substring(0, 20) + '...');

    // Step 2: Test notifications API
    console.log('\n📢 Testing Notifications API...');
    
    const notificationsResponse = await axios.get(`${BASE_URL}/store-manager/notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Notifications API Response:');
    console.log('Success:', notificationsResponse.data.success);
    console.log('Notifications Count:', notificationsResponse.data.data?.length || 0);
    
    if (notificationsResponse.data.data && notificationsResponse.data.data.length > 0) {
      console.log('Sample Notification:', JSON.stringify(notificationsResponse.data.data[0], null, 2));
    } else {
      console.log('No notifications found');
    }

    // Step 3: Test notification generation
    console.log('\n🔄 Testing Notification Generation...');
    
    const generateResponse = await axios.post(`${BASE_URL}/store-manager/notifications/generate`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Generation Response:');
    console.log('Success:', generateResponse.data.success);
    console.log('Message:', generateResponse.data.message);

    // Step 4: Check notifications again after generation
    console.log('\n📢 Checking Notifications After Generation...');
    
    // Wait a bit for notifications to be created
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const notificationsAfterResponse = await axios.get(`${BASE_URL}/store-manager/notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Notifications After Generation:');
    console.log('Success:', notificationsAfterResponse.data.success);
    console.log('Notifications Count:', notificationsAfterResponse.data.data?.length || 0);
    
    if (notificationsAfterResponse.data.data && notificationsAfterResponse.data.data.length > 0) {
      console.log('\nFirst 3 Notifications:');
      notificationsAfterResponse.data.data.slice(0, 3).forEach((notification, index) => {
        console.log(`${index + 1}. ${notification.title} - ${notification.message}`);
        console.log(`   Type: ${notification.type}, Priority: ${notification.priority}, Read: ${notification.isRead}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testNotificationsAPI();

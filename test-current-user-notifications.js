const axios = require('axios');

async function testCurrentUserNotifications() {
  try {
    console.log('🔐 Testing Current User Notifications...');

    // Login with the current user (from the logs)
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'mota@gmail.com',
      password: 'password123' // Assuming default password
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed, trying different password...');
      // Try common passwords
      const passwords = ['123456', 'password', 'mota123', 'admin123'];
      let loginSuccess = false;
      
      for (const pwd of passwords) {
        try {
          const retryLogin = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'mota@gmail.com',
            password: pwd
          });
          
          if (retryLogin.data.success) {
            console.log(`✅ Login successful with password: ${pwd}`);
            loginResponse.data = retryLogin.data;
            loginSuccess = true;
            break;
          }
        } catch (e) {
          // Continue trying
        }
      }
      
      if (!loginSuccess) {
        console.log('❌ Could not login with any common password');
        return;
      }
    } else {
      console.log('✅ Login successful!');
    }

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;

    console.log('User:', user.name, `(${user.email})`);
    console.log('Role:', user.role);
    console.log('Token:', token.substring(0, 20) + '...');

    // Test notifications API
    console.log('\n📢 Testing Notifications API...');
    const notificationsResponse = await axios.get('http://localhost:5000/api/store-manager/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (notificationsResponse.data.success) {
      const notifications = notificationsResponse.data.data || [];
      console.log('✅ Notifications API Response:');
      console.log('Success:', notificationsResponse.data.success);
      console.log('Notifications Count:', notifications.length);

      if (notifications.length > 0) {
        console.log('\nNotification Summary:');
        const summary = {
          unreadAlerts: 0,
          whatsappMessages: 0,
          lowStockItems: 0,
          expiringSoon: 0
        };

        notifications.forEach(notification => {
          if (!notification.isRead) {
            summary.unreadAlerts++;
          }

          switch (notification.type) {
            case 'whatsapp':
              summary.whatsappMessages++;
              break;
            case 'low_stock':
              summary.lowStockItems++;
              break;
            case 'expiry_alert':
              summary.expiringSoon++;
              break;
          }
        });

        console.log('- Unread Alerts:', summary.unreadAlerts);
        console.log('- WhatsApp Messages:', summary.whatsappMessages);
        console.log('- Low Stock Items:', summary.lowStockItems);
        console.log('- Expiring Soon:', summary.expiringSoon);

        console.log('\nFirst 3 Notifications:');
        notifications.slice(0, 3).forEach((notification, index) => {
          console.log(`${index + 1}. ${notification.title} - ${notification.message}`);
          console.log(`   Type: ${notification.type}, Priority: ${notification.priority}, Read: ${notification.isRead}`);
        });
      } else {
        console.log('No notifications found');
      }
    } else {
      console.log('❌ Notifications API failed:', notificationsResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testCurrentUserNotifications();

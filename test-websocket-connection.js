const { io } = require('socket.io-client');

async function testWebSocketConnection() {
  console.log('🔌 Testing WebSocket Connection...');

  try {
    // Test connection to the backend WebSocket server
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      forceNew: true,
      autoConnect: true
    });

    // Set up event listeners
    socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully!');
      console.log('Socket ID:', socket.id);

      // Test joining a store room
      const testStoreId = '68ec9f46a1597adc370d916f';
      console.log(`🏪 Joining store room: ${testStoreId}`);
      socket.emit('join-store', testStoreId);

      // Test creating a notification to see if it's emitted
      setTimeout(async () => {
        console.log('📢 Testing notification emission...');
        
        try {
          const axios = require('axios');
          
          // Login first to get token
          const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'manager@shelfcure.com',
            password: 'manager123'
          });

          if (loginResponse.data.success) {
            const token = loginResponse.data.token;
            
            // Generate a test notification
            const notificationResponse = await axios.post('http://localhost:5000/api/store-manager/notifications/generate', {}, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (notificationResponse.data.success) {
              console.log('✅ Test notification generation triggered');
            } else {
              console.log('❌ Failed to generate test notification');
            }
          }
        } catch (error) {
          console.error('❌ Error testing notification emission:', error.message);
        }
      }, 2000);

      // Disconnect after testing
      setTimeout(() => {
        console.log('🔌 Disconnecting...');
        socket.disconnect();
        process.exit(0);
      }, 10000);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      process.exit(1);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
    });

    // Listen for new notifications
    socket.on('new-notification', (notification) => {
      console.log('📢 Received new notification via WebSocket:');
      console.log('  Title:', notification.title);
      console.log('  Message:', notification.message);
      console.log('  Type:', notification.type);
      console.log('  Priority:', notification.priority);
    });

    // Listen for other events
    socket.on('inventory-updated', (data) => {
      console.log('📦 Received inventory update:', data);
    });

    socket.on('sale-notification', (data) => {
      console.log('💰 Received sale notification:', data);
    });

  } catch (error) {
    console.error('❌ WebSocket test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testWebSocketConnection();

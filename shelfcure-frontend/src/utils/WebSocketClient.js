import { io } from 'socket.io-client';

class WebSocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
  }

  connect(url = 'http://localhost:5000') {
    try {
      if (this.socket) {
        this.disconnect();
      }

      console.log('🔌 Attempting to connect to WebSocket:', url);

      this.socket = io(url, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        forceNew: true,
        autoConnect: true
      });

      this.setupEventListeners();

      return this.socket;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      return null;
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Emit custom event for UI to handle
      if (this.listeners.has('connection-status')) {
        this.listeners.get('connection-status').forEach(callback => {
          callback({ connected: true, socketId: this.socket.id });
        });
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.isConnected = false;

      // Emit custom event for UI to handle
      if (this.listeners.has('connection-status')) {
        this.listeners.get('connection-status').forEach(callback => {
          callback({ connected: false, reason });
        });
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔴 WebSocket connection error:', error.message || error);
      this.isConnected = false;
      this.reconnectAttempts++;

      // Emit custom event for UI to handle
      if (this.listeners.has('connection-error')) {
        this.listeners.get('connection-error').forEach(callback => {
          callback({ error: error.message || error, attempts: this.reconnectAttempts });
        });
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Emit custom event for UI to handle
      if (this.listeners.has('reconnected')) {
        this.listeners.get('reconnected').forEach(callback => {
          callback({ attempts: attemptNumber });
        });
      }
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('🔴 WebSocket reconnection error:', error);
      this.emit('reconnect-error', { error, attempts: this.reconnectAttempts });
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ WebSocket reconnection failed after', this.maxReconnectAttempts, 'attempts');
      this.emit('reconnect-failed', { maxAttempts: this.maxReconnectAttempts });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 WebSocket disconnected manually');
    }
  }

  // Join a room (for store-specific notifications)
  joinStore(storeId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-store', storeId);
      console.log('🏪 Joined store room:', storeId);
    }
  }

  // Leave a room
  leaveStore(storeId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-store', storeId);
      console.log('🚪 Left store room:', storeId);
    }
  }

  // Generic event listener
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
    
    // Store listener for reconnection
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
    
    // Remove from stored listeners
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit event
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️ Cannot emit event - WebSocket not connected:', event);
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // Reestablish listeners after reconnection
  reestablishListeners() {
    if (!this.socket) return;
    
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket.on(event, callback);
      });
    });
  }
}

// Create singleton instance
const webSocketClient = new WebSocketClient();

export default webSocketClient;

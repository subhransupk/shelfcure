class AppConstants {
  // ============================================================================
  // API CONFIGURATION - LOCAL BACKEND SETUP
  // ============================================================================
  //
  // IMPORTANT: Configure the API base URL based on your testing environment:
  //
  // 1. FOR ANDROID EMULATOR (running on Windows/Mac/Linux):
  //    Use: 'http://10.0.2.2:5000'
  //    This special IP allows the emulator to access your host machine's localhost
  //
  // 2. FOR PHYSICAL ANDROID DEVICE (on same WiFi as backend):
  //    Use: 'http://192.168.x.x:5000' (replace x.x with your machine's IP)
  //    Find your IP:
  //      - Windows: Open Command Prompt, type 'ipconfig', look for IPv4 Address
  //      - Mac/Linux: Open Terminal, type 'ifconfig' or 'hostname -I'
  //
  // 3. FOR iOS SIMULATOR (on Mac):
  //    Use: 'http://localhost:5000'
  //
  // 4. FOR LIVE BACKEND:
  //    Use: 'https://your-production-url.com'
  //
  // BACKEND SETUP:
  // - Ensure your Node.js backend is running: npm start
  // - Backend should be listening on port 5000
  // - Check backend is accessible: curl http://localhost:5000/api/health
  //
  // ============================================================================

  // Choose your configuration:
  // static const String apiBaseUrl = 'http://10.0.2.2:5000'; // Android Emulator
  // static const String apiBaseUrl = 'http://192.168.1.100:5000'; // Physical Device (update IP)
  static const String apiBaseUrl =
      'http://localhost:5000'; // Web/Chrome testing

  static const String apiVersion = '/api';

  // API Endpoints
  static const String loginEndpoint = '$apiVersion/auth/login';
  static const String dashboardEndpoint = '$apiVersion/store-manager/dashboard';
  static const String salesEndpoint = '$apiVersion/store-manager/sales';
  static const String analyticsEndpoint = '$apiVersion/store-manager/analytics';
  static const String customersEndpoint = '$apiVersion/store-manager/customers';

  // Storage Keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String storeIdKey = 'store_id';

  // App Configuration
  static const String appName = 'ShelfCure Mobile';
  static const String appVersion = '1.0.0';

  // Timeouts (in milliseconds)
  static const int connectionTimeout = 30000; // 30 seconds
  static const int receiveTimeout = 30000; // 30 seconds
}

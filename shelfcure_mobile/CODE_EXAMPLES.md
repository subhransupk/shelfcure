# Code Examples - Dynamic Dashboard

## 1. API Service Methods

### Fetch Dashboard Data
```dart
Future<Map<String, dynamic>> getDashboardData() async {
  try {
    final response = await _getRequest(
      '${AppConstants.apiBaseUrl}${AppConstants.dashboardEndpoint}',
    );
    if (response['success']) {
      _logger.i('Dashboard data fetched successfully');
    }
    return response;
  } catch (e) {
    _logger.e('Error fetching dashboard data: $e');
    return {'success': false, 'message': 'Failed to fetch dashboard data'};
  }
}
```

### Fetch Expiry Alerts
```dart
Future<Map<String, dynamic>> getExpiryAlertsSummary() async {
  try {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final random = Random().nextInt(10000);
    final response = await _getRequest(
      '${AppConstants.apiBaseUrl}${AppConstants.expiryAlertsEndpoint}?t=$timestamp&r=$random',
    );
    return response;
  } catch (e) {
    _logger.e('Error fetching expiry alerts: $e');
    return {'success': false, 'message': 'Failed to fetch expiry alerts'};
  }
}
```

## 2. Dashboard Provider

### Fetch Data with Error Handling
```dart
Future<void> fetchDashboardData() async {
  _isLoading = true;
  _error = null;
  notifyListeners();

  try {
    final response = await _apiService.getDashboardData();

    if (response['success']) {
      final data = response['data'];
      if (data is Map<String, dynamic>) {
        _dashboardData = DashboardData.fromJson(data);
        _error = null;
      } else {
        _error = 'Invalid response format';
      }
    } else {
      _error = response['message'] ?? 'Failed to fetch dashboard data';
      _dashboardData = _generateMockDashboardData();
    }
  } catch (e) {
    _error = 'An error occurred: $e';
    _dashboardData = _generateMockDashboardData();
  } finally {
    _isLoading = false;
    notifyListeners();
  }
}
```

### Retry with Exponential Backoff
```dart
Future<void> retryFetchDashboardData({int maxRetries = 3}) async {
  int retryCount = 0;
  int delayMs = 1000;

  while (retryCount < maxRetries) {
    try {
      await fetchDashboardData();
      if (_error == null && _dashboardData != null) {
        return;
      }
    } catch (e) {
      retryCount++;
      if (retryCount < maxRetries) {
        await Future.delayed(Duration(milliseconds: delayMs));
        delayMs *= 2;
      }
    }
  }

  _error = 'Failed to fetch dashboard data after $maxRetries attempts';
  _isLoading = false;
  notifyListeners();
}
```

## 3. Dashboard Model Parsing

### Type Conversion Helpers
```dart
static double _toDouble(dynamic value) {
  if (value == null) return 0.0;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0.0;
  return 0.0;
}

static int _toInt(dynamic value) {
  if (value == null) return 0;
  if (value is int) return value;
  if (value is double) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}
```

### Parse JSON Response
```dart
factory DashboardData.fromJson(Map<String, dynamic> json) {
  final metrics = json['metrics'] ?? {};
  final alerts = json['alerts'] ?? {};

  return DashboardData(
    todayRevenue: _toDouble(metrics['todayRevenue']),
    monthRevenue: _toDouble(metrics['monthRevenue']),
    totalProfit: _toDouble(metrics['totalProfit']),
    totalMedicines: _toInt(metrics['totalMedicines']),
    inStockMedicines: _toInt(metrics['inStockMedicines']),
    lowStockMedicines: _toInt(metrics['lowStockMedicines']),
    stockValue: _toDouble(metrics['stockValue']),
    pendingCredit: _toDouble(metrics['pendingCredit']),
    creditCustomers: _toInt(metrics['creditCustomers']),
    // ... more fields
    lowStockAlert: alerts['lowStock'] ?? false,
    expiringAlert: alerts['expiringSoon'] ?? false,
  );
}
```

## 4. Dashboard Screen Usage

### Consumer Pattern
```dart
Consumer<DashboardProvider>(
  builder: (context, dashboardProvider, child) {
    if (dashboardProvider.isLoading) {
      return const Center(
        child: CircularProgressIndicator(
          color: Color(0xFF2E7D32),
        ),
      );
    }

    if (dashboardProvider.error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64),
            SizedBox(height: 16),
            Text(dashboardProvider.error!),
            SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                dashboardProvider.fetchDashboardData();
              },
              icon: Icon(Icons.refresh),
              label: Text('Retry'),
            ),
          ],
        ),
      );
    }

    final data = dashboardProvider.dashboardData;
    if (data == null) {
      return const Center(child: Text('No data available'));
    }

    return RefreshIndicator(
      onRefresh: () => dashboardProvider.refreshDashboardData(),
      child: SingleChildScrollView(
        child: Column(
          children: [
            // Display metrics
          ],
        ),
      ),
    );
  },
)
```

## 5. Displaying Metrics

### Financial Metrics Card
```dart
Card(
  child: Padding(
    padding: EdgeInsets.all(16),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Today\'s Sales', style: TextStyle(fontSize: 14)),
        SizedBox(height: 8),
        Text(
          '₹${data.todayRevenue.toStringAsFixed(2)}',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
      ],
    ),
  ),
)
```

### Inventory Metrics Grid
```dart
GridView.count(
  crossAxisCount: 2,
  children: [
    MetricCard(
      title: 'Total Medicines',
      value: data.totalMedicines.toString(),
      icon: Icons.medication,
    ),
    MetricCard(
      title: 'Stock Value',
      value: '₹${data.stockValue.toStringAsFixed(2)}',
      icon: Icons.inventory,
    ),
    MetricCard(
      title: 'Low Stock',
      value: data.lowStockMedicines.toString(),
      icon: Icons.warning,
    ),
    MetricCard(
      title: 'Out of Stock',
      value: data.outOfStock.toString(),
      icon: Icons.block,
    ),
  ],
)
```

## 6. Error Handling Example

### Try-Catch Pattern
```dart
try {
  final response = await apiService.getDashboardData();
  
  if (response['success']) {
    final data = response['data'];
    dashboardData = DashboardData.fromJson(data);
  } else {
    error = response['message'] ?? 'Unknown error';
  }
} on SocketException {
  error = 'Network error. Please check your connection.';
} on TimeoutException {
  error = 'Request timeout. Please try again.';
} catch (e) {
  error = 'An unexpected error occurred: $e';
}
```

## 7. Configuration Example

### Constants Setup
```dart
class AppConstants {
  static const String apiBaseUrl = 'http://localhost:5000';
  static const String apiVersion = '/api';
  
  static const String dashboardEndpoint = 
    '$apiVersion/store-manager/dashboard';
  static const String expiryAlertsEndpoint = 
    '$apiVersion/store-manager/expiry-alerts/summary';
  static const String doctorStatsEndpoint = 
    '$apiVersion/store-manager/doctors/stats';
  
  static const int connectionTimeout = 30;
  static const int receiveTimeout = 30;
}
```

## 8. Testing Example

### Unit Test
```dart
test('DashboardData parses JSON correctly', () {
  final json = {
    'metrics': {
      'todayRevenue': 15250.50,
      'totalMedicines': 450,
    },
    'alerts': {
      'lowStock': true,
    }
  };
  
  final data = DashboardData.fromJson(json);
  
  expect(data.todayRevenue, 15250.50);
  expect(data.totalMedicines, 450);
  expect(data.lowStockAlert, true);
});
```

### Widget Test
```dart
testWidgets('Dashboard displays metrics', (WidgetTester tester) async {
  await tester.pumpWidget(
    ChangeNotifierProvider(
      create: (_) => DashboardProvider(),
      child: MaterialApp(home: DashboardScreen()),
    ),
  );
  
  expect(find.byType(CircularProgressIndicator), findsOneWidget);
  
  await tester.pumpAndSettle();
  
  expect(find.text('Today\'s Sales'), findsOneWidget);
});
```

---

For more examples and detailed documentation, see:
- `DYNAMIC_DASHBOARD_IMPLEMENTATION.md`
- `TESTING_GUIDE_DYNAMIC_DASHBOARD.md`
- `ARCHITECTURE_DIAGRAM.md`


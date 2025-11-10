# Flutter Mobile App Dashboard - Dynamic Implementation

## Overview
The Flutter mobile app dashboard has been successfully updated to fetch real-time data from the ShelfCure backend APIs instead of using hardcoded mock data. The dashboard now displays actual store metrics, sales data, inventory statistics, and expiry alerts.

## Implementation Summary

### 1. API Service Enhancements (`lib/services/api_service.dart`)
Added three new methods to fetch real data:

- **`getDashboardData()`** - Fetches comprehensive dashboard metrics
  - Endpoint: `/api/store-manager/dashboard`
  - Returns: Financial, inventory, customer, and waste metrics

- **`getExpiryAlertsSummary()`** - Fetches expiry alerts summary
  - Endpoint: `/api/store-manager/expiry-alerts/summary`
  - Includes cache-busting parameters for fresh data

- **`getDoctorStats()`** - Fetches doctor commission statistics
  - Endpoint: `/api/store-manager/doctors/stats`
  - Returns: Total commissions, active doctors, pending commissions

### 2. Dashboard Model Updates (`lib/models/dashboard.dart`)
Enhanced `DashboardData.fromJson()` factory method:

- Robust type conversion with helper methods `_toDouble()` and `_toInt()`
- Proper error handling for malformed API responses
- Graceful fallback to default values (0) for missing fields
- Correct parsing of nested metrics and alerts objects
- Support for recent sales and expiring medicines lists

### 3. Dashboard Provider Refactoring (`lib/providers/dashboard_provider.dart`)
Completely rewrote data fetching logic:

- **Real API Integration**: Replaced mock data generation with actual API calls
- **Error Handling**: Comprehensive try-catch with fallback to mock data
- **Retry Logic**: `retryFetchDashboardData()` with exponential backoff (max 3 retries)
- **Refresh Support**: `refreshDashboardData()` for pull-to-refresh functionality
- **State Management**: Proper loading, error, and data states

### 4. Dashboard Screen Improvements (`lib/screens/dashboard/dashboard_screen.dart`)
Enhanced UI with better error handling:

- Dual retry buttons: "Retry" (single attempt) and "Retry (3x)" (with backoff)
- Pull-to-refresh support for manual data refresh
- Improved error messages and user feedback
- Loading states with spinner animation

## Data Flow

```
Dashboard Screen
    ↓
Dashboard Provider (fetchDashboardData)
    ↓
API Service (getDashboardData)
    ↓
Backend API (/api/store-manager/dashboard)
    ↓
Database (Real Store Data)
    ↓
Response → DashboardData.fromJson() → UI Display
```

## API Response Structure

The backend returns data in this structure:
```json
{
  "success": true,
  "data": {
    "metrics": {
      "todayRevenue": 15250.50,
      "monthRevenue": 425000.00,
      "totalProfit": 125000.00,
      "totalMedicines": 450,
      "inStockMedicines": 420,
      "lowStockMedicines": 25,
      "stockValue": 850000.00,
      "pendingCredit": 35000.00,
      "creditCustomers": 120,
      "todayReturns": 1200.00,
      "wasteImpact": 5000.00,
      "expiredMedicines": 12,
      "expiring30Days": 35,
      "critical7Days": 8,
      "totalDoctorCommissions": 8500.00
    },
    "recentSales": [...],
    "expiringMedicines": [...],
    "alerts": {
      "lowStock": true,
      "expiringSoon": true,
      "criticalExpiry": false,
      "outOfStock": false
    }
  }
}
```

## Key Features

✅ **Real-Time Data**: Fetches actual store data from backend
✅ **Error Handling**: Graceful fallback with retry mechanisms
✅ **Type Safety**: Robust type conversion and validation
✅ **Performance**: Efficient API calls with proper timeout handling
✅ **User Experience**: Loading states, error messages, retry options
✅ **Offline Support**: Falls back to mock data if API fails
✅ **Pull-to-Refresh**: Manual refresh capability
✅ **Exponential Backoff**: Smart retry logic with increasing delays

## Configuration

Update API base URL in `lib/config/constants.dart`:
```dart
static const String apiBaseUrl = 'http://your-backend-url:5000';
```

## Testing

1. Ensure backend is running and accessible
2. Configure correct API base URL
3. Login with valid credentials
4. Dashboard will automatically fetch real data on load
5. Use pull-to-refresh to manually refresh data
6. Test error handling by temporarily disabling backend

## Metrics Displayed

**Financial**: Today's Sales, Month Sales, Total Profit, Today Profit, Pending Credit, Today Credit
**Inventory**: Total Medicines, Stock Value, Low Stock, Out of Stock
**Expiry**: Expiring Soon, Critical (7 Days), Expired Medicines
**Waste**: Waste Impact, Preventable Waste
**Customer**: Total Customers, New This Month, Today Returns
**Doctor**: Total Commissions, Active Doctors, Pending Commissions


# Analytics Screen Testing Guide

## Pre-Testing Setup

1. **Configure Backend URL**
   - Open `lib/config/constants.dart`
   - Update `apiBaseUrl` to your backend server
   - Example: `http://192.168.1.100:5000`

2. **Ensure Backend is Running**
   - Backend should have `/api/store-manager/analytics` endpoint
   - Endpoint accepts `period` parameter: '7d', '30d', '90d'

## Testing Checklist

### ✅ Basic Functionality
- [ ] App launches without errors
- [ ] Analytics screen loads
- [ ] Data displays in Overview tab
- [ ] All 5 tabs are visible and clickable

### ✅ Period Filters
- [ ] Click "Last 7 Days" - data updates
- [ ] Click "Last 30 Days" - data updates
- [ ] Click "Last 90 Days" - data updates
- [ ] Charts update with new data

### ✅ Tab Navigation
- [ ] Overview tab shows summary metrics
- [ ] Sales tab shows revenue and top medicines
- [ ] Inventory tab shows stock levels
- [ ] Customers tab shows customer analytics
- [ ] Operations tab shows transaction patterns

### ✅ Operations Tab Specific
- [ ] Displays 6 key metrics
- [ ] Hourly pattern chart shows 24-hour data
- [ ] Weekly performance shows 7 days
- [ ] Category distribution displays correctly

### ✅ Error Handling
- [ ] Disconnect network - error message appears
- [ ] Click "Retry" button - retries once
- [ ] Click "Retry (3x)" button - retries 3 times
- [ ] Mock data displays on persistent errors

### ✅ Pull-to-Refresh
- [ ] Swipe down on screen
- [ ] Loading indicator appears
- [ ] Data refreshes
- [ ] Indicator disappears

### ✅ Data Accuracy
- [ ] Revenue matches backend data
- [ ] Sales count matches backend
- [ ] Customer numbers are correct
- [ ] Inventory levels are accurate

## Expected API Response Format

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 425000,
      "totalSales": 1250,
      "averageOrderValue": 340,
      "revenueGrowth": 12.5,
      "salesGrowth": 8.3,
      "dailyAverageSales": 14166.67
    },
    "dailySales": [...],
    "topMedicines": [...],
    "inventory": {...},
    "customers": {...},
    "operations": {...}
  }
}
```

## Troubleshooting

**Issue**: Data not loading
- Check backend URL in constants.dart
- Verify backend is running
- Check network connectivity
- Review backend logs

**Issue**: Charts not displaying
- Ensure data has valid numbers
- Check for null values in response
- Verify fl_chart package is installed

**Issue**: Operations tab missing
- Rebuild app: `flutter clean && flutter pub get`
- Restart app

**Issue**: Retry buttons not working
- Check internet connection
- Verify backend endpoint
- Check API response format

## Performance Metrics

- Initial load: < 2 seconds
- Period filter change: < 1 second
- Pull-to-refresh: < 2 seconds
- Retry with backoff: 1s, 2s, 4s delays

## Success Criteria

✅ All 5 tabs load and display data
✅ Period filters work correctly
✅ Error handling shows appropriate messages
✅ Retry logic functions properly
✅ Operations tab displays all metrics
✅ Charts render without errors
✅ Pull-to-refresh works smoothly


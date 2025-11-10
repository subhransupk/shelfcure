# Web vs Mobile Dashboard - Data Source Comparison

## Overview
Both the React web dashboard and Flutter mobile dashboard now fetch data from the same backend APIs, ensuring data consistency across platforms.

## Shared API Endpoints

### 1. Main Dashboard Endpoint
**Endpoint:** `GET /api/store-manager/dashboard`
**Used By:** Both web and mobile
**Data Returned:**
- Financial metrics (today's revenue, month revenue, profit, etc.)
- Inventory metrics (total medicines, stock value, low stock, etc.)
- Customer metrics (total customers, new customers, pending credit, etc.)
- Returns & waste metrics
- Expiry tracking data
- Recent sales list
- Expiring medicines list
- Alert flags

### 2. Expiry Alerts Summary
**Endpoint:** `GET /api/store-manager/expiry-alerts/summary`
**Used By:** Both web and mobile
**Data Returned:**
- Expired medicines count and value
- Critical (≤7 days) count and value
- Warning (8-30 days) count and value
- Upcoming (31-90 days) count
- Total value at risk

### 3. Doctor Statistics
**Endpoint:** `GET /api/store-manager/doctors/stats`
**Used By:** Both web and mobile
**Data Returned:**
- Total commission earned
- Active doctors count
- Pending commissions amount

## Data Consistency

### Metrics Displayed on Both Platforms

| Metric | Web Dashboard | Mobile Dashboard | API Source |
|--------|---------------|------------------|-----------|
| Today's Sales | ✅ | ✅ | /dashboard |
| Month Sales | ✅ | ✅ | /dashboard |
| Total Profit | ✅ | ✅ | /dashboard |
| Today Profit | ✅ | ✅ | /dashboard |
| Pending Credit | ✅ | ✅ | /dashboard |
| Today Credit | ✅ | ✅ | /dashboard |
| Total Medicines | ✅ | ✅ | /dashboard |
| Stock Value | ✅ | ✅ | /dashboard |
| Low Stock Items | ✅ | ✅ | /dashboard |
| Out of Stock | ✅ | ✅ | /dashboard |
| Waste Impact | ✅ | ✅ | /dashboard |
| Preventable Waste | ✅ | ✅ | /dashboard |
| Expiry Alerts | ✅ | ✅ | /expiry-alerts/summary |
| Doctor Commissions | ✅ | ✅ | /doctors/stats |
| Recent Sales | ✅ | ✅ | /dashboard |
| Expiring Medicines | ✅ | ✅ | /dashboard |

## Implementation Differences

### Web Dashboard (React)
- **Framework:** React with Hooks
- **State Management:** useState
- **API Calls:** Fetch API with Bearer token
- **Refresh:** Manual button or auto-refresh (5s for expiry alerts)
- **Error Handling:** Try-catch with default values
- **UI:** Tailwind CSS with responsive grid layout

### Mobile Dashboard (Flutter)
- **Framework:** Flutter with Provider
- **State Management:** ChangeNotifier + Provider
- **API Calls:** http package with ApiService singleton
- **Refresh:** Pull-to-refresh gesture + retry buttons
- **Error Handling:** Try-catch with exponential backoff retry
- **UI:** Material Design with responsive grid layout

## Data Flow Comparison

### Web Dashboard Flow
```
React Component
    ↓
useState (dashboardData, loading, error)
    ↓
useEffect → fetchDashboardData()
    ↓
fetch('/api/store-manager/dashboard')
    ↓
Backend API
    ↓
Response → setDashboardData()
    ↓
Render with Tailwind CSS
```

### Mobile Dashboard Flow
```
Flutter Widget
    ↓
DashboardProvider (ChangeNotifier)
    ↓
fetchDashboardData()
    ↓
ApiService.getDashboardData()
    ↓
http.get('/api/store-manager/dashboard')
    ↓
Backend API
    ↓
Response → DashboardData.fromJson()
    ↓
notifyListeners()
    ↓
Consumer rebuilds UI
```

## API Response Handling

### Web Dashboard
- Receives JSON response
- Extracts `data.metrics` object
- Uses optional chaining for safety
- Displays with default values if missing

### Mobile Dashboard
- Receives JSON response
- Parses through `DashboardData.fromJson()`
- Uses helper methods `_toDouble()` and `_toInt()`
- Validates and converts all types
- Handles null values gracefully

## Refresh Mechanisms

### Web Dashboard
- Manual refresh via button
- Auto-refresh for expiry alerts (5 seconds)
- Cache-busting parameters in URL

### Mobile Dashboard
- Pull-to-refresh gesture
- Manual retry button
- Retry with exponential backoff (3 attempts)
- Cache-busting parameters in URL

## Error Handling

### Web Dashboard
- Catches errors and sets error state
- Displays error message to user
- Provides retry button
- Falls back to default values

### Mobile Dashboard
- Catches errors and sets error state
- Displays error message with two retry options
- Single retry or 3x retry with backoff
- Falls back to mock data if available
- Exponential backoff: 1s, 2s, 4s delays

## Performance Characteristics

### Web Dashboard
- Initial load: ~2-3 seconds
- Expiry alerts refresh: ~1 second (every 5s)
- Network requests: 3 parallel (dashboard, expiry, doctors)

### Mobile Dashboard
- Initial load: ~2-3 seconds
- Pull-to-refresh: ~1-2 seconds
- Network requests: 1 sequential (dashboard only)
- Retry attempts: Up to 3 with delays

## Future Enhancements

### Potential Improvements
1. **Caching:** Implement local caching to reduce API calls
2. **Real-time Updates:** WebSocket for live data updates
3. **Offline Mode:** Store last known data for offline access
4. **Analytics:** Track which metrics users view most
5. **Customization:** Allow users to choose which metrics to display
6. **Notifications:** Push notifications for critical alerts
7. **Comparison:** Show period-over-period comparisons
8. **Forecasting:** Predict trends based on historical data

## Maintenance Notes

### When Updating Backend API
1. Update both web and mobile implementations
2. Ensure response structure remains consistent
3. Add new fields to both DashboardData models
4. Update parsing logic in both platforms
5. Test on both web and mobile
6. Update documentation

### When Adding New Metrics
1. Add to backend response
2. Add to DashboardData model (web and mobile)
3. Add parsing logic
4. Add UI components
5. Test data accuracy
6. Update this comparison document


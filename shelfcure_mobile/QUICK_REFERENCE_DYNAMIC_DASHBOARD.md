# Quick Reference - Dynamic Dashboard

## 🚀 Quick Start

### 1. Configure API URL
Edit `lib/config/constants.dart`:
```dart
static const String apiBaseUrl = 'http://localhost:5000';
```

### 2. Run the App
```bash
flutter pub get
flutter run
```

### 3. Login
Use your store manager credentials to access the dashboard.

## 📊 What's New

✅ **Real Data**: Dashboard now fetches actual store metrics from backend
✅ **Smart Retry**: Automatic retry with exponential backoff
✅ **Pull-to-Refresh**: Swipe down to refresh data
✅ **Error Handling**: User-friendly error messages with recovery options

## 🔄 Data Flow

```
App Launch
    ↓
Dashboard Screen
    ↓
DashboardProvider.fetchDashboardData()
    ↓
ApiService.getDashboardData()
    ↓
Backend: GET /api/store-manager/dashboard
    ↓
Parse Response → DashboardData.fromJson()
    ↓
Display Real Metrics
```

## 📱 User Actions

| Action | Result |
|--------|--------|
| Pull down on dashboard | Refreshes data |
| Click "Retry" button | Single retry attempt |
| Click "Retry (3x)" button | 3 retries with delays |
| Logout | Clears session |

## 🔧 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/store-manager/dashboard` | GET | Main metrics |
| `/api/store-manager/expiry-alerts/summary` | GET | Expiry data |
| `/api/store-manager/doctors/stats` | GET | Doctor stats |

## 📈 Metrics Displayed

**Financial**: Revenue, Profit, Credit, Returns, Loss
**Inventory**: Medicines, Stock Value, Low Stock, Out of Stock
**Expiry**: Expired, Critical, Warning, Upcoming
**Waste**: Impact, Preventable, Percentage
**Customer**: Total, New, Returns
**Doctor**: Commissions, Active, Pending

## 🛠️ Key Files Modified

1. `lib/services/api_service.dart` - API methods
2. `lib/models/dashboard.dart` - Data parsing
3. `lib/providers/dashboard_provider.dart` - State management
4. `lib/screens/dashboard/dashboard_screen.dart` - UI updates

## ⚙️ Configuration

### Timeouts
- Connection: 30 seconds
- Receive: 30 seconds

### Retry Logic
- Max retries: 3
- Backoff delays: 1s, 2s, 4s
- Exponential multiplier: 2x

### Cache Busting
- Timestamp parameter added
- Random parameter added
- Force refresh flag set

## 🐛 Troubleshooting

**Dashboard shows error?**
- Check backend is running
- Verify API URL configuration
- Check network connectivity
- Try "Retry (3x)" button

**Data not updating?**
- Pull down to refresh
- Check backend logs
- Verify authentication token
- Check API response

**Slow performance?**
- Check network latency
- Monitor backend response time
- Check device memory
- Reduce data volume

## 📝 Response Format

```json
{
  "success": true,
  "data": {
    "metrics": {
      "todayRevenue": 15250.50,
      "monthRevenue": 425000.00,
      "totalProfit": 125000.00,
      ...
    },
    "recentSales": [...],
    "expiringMedicines": [...],
    "alerts": {
      "lowStock": true,
      "expiringSoon": true,
      ...
    }
  }
}
```

## 🔐 Authentication

- Token stored in SharedPreferences
- Sent in Authorization header
- Auto-logout on 401 response
- Refresh on app restart

## 📊 Data Accuracy

All metrics are calculated from:
- Real sales transactions
- Actual inventory records
- Current customer data
- Live expiry dates
- Actual doctor commissions

## 🎯 Performance Targets

- Initial load: < 3 seconds
- Refresh: < 2 seconds
- Retry (3x): < 5 seconds
- Memory: < 50MB
- Network: Minimal data transfer

## 📚 Documentation

- `DYNAMIC_DASHBOARD_IMPLEMENTATION.md` - Full details
- `TESTING_GUIDE_DYNAMIC_DASHBOARD.md` - Testing scenarios
- `WEB_MOBILE_DASHBOARD_COMPARISON.md` - Web vs Mobile
- `DYNAMIC_DASHBOARD_FINAL_SUMMARY.md` - Complete summary

## ✅ Verification Checklist

- [ ] Backend running
- [ ] API URL configured
- [ ] Test user created
- [ ] Dashboard loads
- [ ] Metrics show real data
- [ ] Pull-to-refresh works
- [ ] Error handling works
- [ ] Retry logic works
- [ ] Performance acceptable

## 🚀 Deployment

1. Update API URL for production
2. Test with real backend
3. Verify all metrics accuracy
4. Monitor performance
5. Gather user feedback
6. Deploy to app stores

## 📞 Support

For issues or questions:
1. Check troubleshooting section
2. Review documentation
3. Check backend logs
4. Verify configuration
5. Test with mock data fallback

---

**Status**: ✅ Ready for Production
**Last Updated**: 2024
**Version**: 1.0 - Dynamic Dashboard


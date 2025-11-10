# ShelfCure Mobile - Quick Start Guide

## 5-Minute Setup

### Step 1: Prerequisites Check
Ensure you have:
- Flutter 3.35.6+ installed
- Android SDK configured
- A code editor (VS Code or Android Studio)

### Step 2: Navigate to Project
```bash
cd shelfcure_mobile
```

### Step 3: Get Dependencies
```bash
flutter pub get
```

### Step 4: Configure Backend URL
Edit `lib/config/constants.dart`:
```dart
static const String apiBaseUrl = 'http://192.168.x.x:5000'; // Your backend URL
```

### Step 5: Run the App
```bash
flutter run
```

## Login Credentials
Use your ShelfCure store manager credentials to login.

## App Navigation

### Bottom Navigation Tabs
1. **Dashboard** - View store metrics and recent sales
2. **Sales** - Browse all sales transactions
3. **Analytics** - View detailed analytics and reports

## Key Features

### Dashboard Tab
- Total sales amount
- Today's sales
- Transaction count
- Customer count
- Sales trend chart
- Recent sales list

### Sales Tab
- Complete sales history
- Pull to refresh
- Infinite scroll pagination
- Click any sale to view details
- Sale details include:
  - Invoice number
  - Customer name
  - Date and time
  - Payment method
  - Itemized list
  - Total amount

### Analytics Tab
- Monthly/Yearly toggle
- Revenue metrics
- Daily sales chart
- Category-wise breakdown
- Customer segments
- Growth rates

## Common Tasks

### View Dashboard
1. Open app
2. Login with credentials
3. Dashboard loads automatically

### Check Sales
1. Tap "Sales" tab
2. Scroll to see all sales
3. Pull down to refresh
4. Tap any sale for details

### View Analytics
1. Tap "Analytics" tab
2. Toggle between Monthly/Yearly
3. View charts and metrics
4. Pull down to refresh

### Logout
1. Go to Dashboard
2. Tap logout icon (top right)
3. Redirected to login screen

## Troubleshooting

### App Won't Start
- Check Flutter installation: `flutter doctor`
- Clear cache: `flutter clean`
- Get dependencies again: `flutter pub get`

### Can't Login
- Verify backend URL in constants.dart
- Check internet connection
- Verify credentials are correct
- Ensure backend server is running

### No Data Showing
- Check internet connection
- Pull to refresh
- Verify backend is responding
- Check backend logs

### Charts Not Displaying
- Ensure data is available
- Check for API errors
- Try refreshing the screen

## Development Tips

### Hot Reload
Press `r` in terminal to hot reload during development

### Hot Restart
Press `R` in terminal for full restart

### Debug Mode
Run with: `flutter run -v` for verbose output

### Build Release APK
```bash
flutter build apk --release
```

## File Structure Quick Reference

```
lib/
├── config/constants.dart       ← Update API URL here
├── models/                     ← Data models
├── services/api_service.dart   ← API calls
├── providers/                  ← State management
├── screens/                    ← UI screens
├── widgets/                    ← Reusable components
└── main.dart                   ← App entry point
```

## API Endpoints Used

- `POST /api/auth/login` - Login
- `GET /api/store-manager/dashboard` - Dashboard data
- `GET /api/store-manager/sales` - Sales list
- `GET /api/store-manager/analytics` - Analytics data

## Performance Tips

- App uses pagination for sales (20 items per page)
- Charts are optimized for smooth rendering
- State management prevents unnecessary rebuilds
- Local storage caches authentication tokens

## Next Steps

1. Test all three modules
2. Verify data is loading correctly
3. Test on actual Android device
4. Build release APK when ready
5. Deploy to Play Store

## Support

For issues:
1. Check SETUP_GUIDE.md for detailed setup
2. Review IMPLEMENTATION_SUMMARY.md for architecture
3. Check backend logs for API errors
4. Verify network connectivity

## Version Info
- Flutter: 3.35.6
- Dart: 3.9.2
- App Version: 1.0.0


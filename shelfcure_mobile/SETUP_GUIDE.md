# ShelfCure Mobile App - Setup Guide

## Overview
ShelfCure Mobile is a Flutter-based Android application for store managers to manage their pharmacy store operations. The app provides three main features:
- **Dashboard**: Overview of store metrics and recent sales
- **Sales**: View and manage sales transactions
- **Analytics**: Detailed analytics and reporting

## Prerequisites
- Flutter 3.35.6 or higher
- Dart 3.9.2 or higher
- Android SDK (for Android development)
- An IDE (VS Code, Android Studio, or IntelliJ)

## Installation

### 1. Clone the Repository
```bash
cd shelfcure_mobile
```

### 2. Install Dependencies
```bash
flutter pub get
```

### 3. Configure API Base URL
Edit `lib/config/constants.dart` and update the `apiBaseUrl`:
```dart
static const String apiBaseUrl = 'http://your-backend-url:5000';
```

### 4. Run the App
```bash
flutter run
```

## Project Structure

```
lib/
├── config/
│   └── constants.dart          # App configuration and constants
├── models/
│   ├── user.dart              # User model
│   ├── sale.dart              # Sale and SaleItem models
│   ├── dashboard.dart         # Dashboard data models
│   └── analytics.dart         # Analytics data models
├── services/
│   └── api_service.dart       # API communication service
├── providers/
│   ├── auth_provider.dart     # Authentication state management
│   ├── dashboard_provider.dart # Dashboard state management
│   ├── sales_provider.dart    # Sales state management
│   └── analytics_provider.dart # Analytics state management
├── screens/
│   ├── auth/
│   │   └── login_screen.dart  # Login screen
│   ├── dashboard/
│   │   └── dashboard_screen.dart # Dashboard screen
│   ├── sales/
│   │   ├── sales_screen.dart  # Sales list screen
│   │   └── sale_detail_screen.dart # Sale details screen
│   ├── analytics/
│   │   └── analytics_screen.dart # Analytics screen
│   └── home_screen.dart       # Main home screen with navigation
├── widgets/
│   ├── dashboard_card.dart    # Reusable dashboard card widget
│   ├── sales_chart.dart       # Sales trend chart
│   └── analytics_chart.dart   # Analytics bar chart
└── main.dart                  # App entry point
```

## Features

### Dashboard
- Display key metrics (Total Sales, Today's Sales, Transactions, Customers)
- Sales trend chart showing sales over time
- Recent sales list with quick access to details

### Sales
- View all sales transactions with pagination
- Pull-to-refresh functionality
- Click on any sale to view detailed information
- Sale details include items, amounts, and payment information

### Analytics
- Toggle between monthly and yearly views
- Display revenue metrics and growth rates
- Daily sales bar chart
- Sales breakdown by category
- Customer segment analysis

## API Integration

The app communicates with the ShelfCure backend API. Required endpoints:

### Authentication
- `POST /api/auth/login` - User login

### Dashboard
- `GET /api/store-manager/dashboard` - Get dashboard data

### Sales
- `GET /api/store-manager/sales` - Get sales list (paginated)
- `POST /api/store-manager/sales` - Create new sale

### Analytics
- `GET /api/store-manager/analytics` - Get analytics data

## State Management

The app uses the `provider` package for state management:

- **AuthProvider**: Manages user authentication and login state
- **DashboardProvider**: Manages dashboard data fetching
- **SalesProvider**: Manages sales list and pagination
- **AnalyticsProvider**: Manages analytics data and period selection

## Dependencies

Key dependencies used:
- `provider`: State management
- `http`: HTTP requests
- `shared_preferences`: Local storage
- `fl_chart`: Charts and graphs
- `intl`: Internationalization
- `logger`: Logging

## Building for Release

### Android APK
```bash
flutter build apk --release
```

### Android App Bundle
```bash
flutter build appbundle --release
```

## Troubleshooting

### API Connection Issues
1. Ensure the backend server is running
2. Check the API base URL in `constants.dart`
3. Verify network connectivity
4. Check firewall settings

### Login Issues
1. Verify credentials are correct
2. Check if the user account exists in the backend
3. Ensure the backend is responding to login requests

### Data Not Loading
1. Check internet connection
2. Verify API endpoints are correct
3. Check backend logs for errors
4. Try pulling to refresh

## Future Enhancements

- Create new sales functionality
- Customer management
- Inventory management
- Offline mode support
- Push notifications
- Multi-language support
- Dark mode theme

## Support

For issues or questions, please contact the development team or check the backend documentation.


# ShelfCure Mobile App - Backend Setup & Testing Guide

## Overview
This guide explains how to set up and test the ShelfCure Flutter mobile app with a local backend server.

## Prerequisites
- Node.js backend running locally (see Backend Setup section)
- Flutter SDK installed
- Android Studio with Android SDK (for emulator) or physical Android device
- Same WiFi network for physical device testing

---

## 1. Backend Setup

### Start the Backend Server
```bash
cd shelfcure-backend
npm install
npm start
```

The backend should start on `http://localhost:5000`

### Verify Backend is Running
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "ShelfCure API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

---

## 2. Configure Mobile App for Local Backend

### Find Your Machine's IP Address

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your network adapter (e.g., `192.168.1.100`)

**Mac/Linux:**
```bash
ifconfig
# or
hostname -I
```

### Update Constants File

Edit `lib/config/constants.dart`:

```dart
// For Android Emulator:
static const String apiBaseUrl = 'http://10.0.2.2:5000';

// For Physical Device (replace with your IP):
static const String apiBaseUrl = 'http://192.168.1.100:5000';

// For iOS Simulator:
static const String apiBaseUrl = 'http://localhost:5000';
```

---

## 3. Testing on Android Emulator

### Start Emulator
```bash
flutter emulators --launch <emulator_name>
```

### Run App
```bash
cd shelfcure_mobile
flutter run
```

### Use Emulator IP
The emulator can access your host machine via `10.0.2.2`, so use:
```dart
static const String apiBaseUrl = 'http://10.0.2.2:5000';
```

---

## 4. Testing on Physical Device

### Prerequisites
- Device on same WiFi as backend
- USB debugging enabled
- Device connected via USB

### Find Your Machine IP
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

### Update Constants
```dart
static const String apiBaseUrl = 'http://192.168.1.100:5000'; // Your IP
```

### Run App
```bash
flutter run
```

---

## 5. Login Testing

### Test Credentials
Use any user account created in your backend database.

Example:
- Email: `manager@example.com`
- Password: `password123`

### Expected Flow
1. App connects to backend at configured URL
2. Sends email & password to `/api/auth/login`
3. Backend validates credentials
4. Backend returns JWT token & user data
5. App stores token in SharedPreferences
6. App navigates to Dashboard

### Troubleshooting Login Issues

**"Connection error"**
- Check backend is running: `curl http://localhost:5000/api/health`
- Verify correct IP in constants.dart
- Check firewall allows port 5000

**"Invalid email or password"**
- Verify user exists in backend database
- Check credentials are correct
- Ensure user account is active

**"Server error"**
- Check backend logs for errors
- Verify database connection
- Check JWT_SECRET is set in .env

---

## 6. Verify Token Storage

After successful login, verify token is stored:

```dart
// In Flutter app, check SharedPreferences:
final prefs = await SharedPreferences.getInstance();
final token = prefs.getString('auth_token');
print('Stored token: $token');
```

---

## 7. Verify Authenticated Requests

All subsequent API calls include the token:

```
Authorization: Bearer <token>
```

Check backend logs to confirm token is received and validated.

---

## 8. Build APK for Testing

```bash
flutter build apk --release
```

APK location: `build/app/outputs/flutter-apk/app-release.apk`

Install on device:
```bash
adb install build/app/outputs/flutter-apk/app-release.apk
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| App can't connect to backend | Verify IP in constants.dart, check firewall |
| Login fails with valid credentials | Check backend database has user, verify JWT_SECRET |
| Token not persisting | Check SharedPreferences permissions on device |
| Emulator can't reach backend | Use `10.0.2.2` instead of `localhost` |
| Physical device can't reach backend | Ensure device on same WiFi, use correct machine IP |

---

## Next Steps

Once login is working:
1. Test Dashboard data fetching
2. Test Sales creation
3. Test Analytics
4. Test all authenticated endpoints

For issues, check:
- Backend logs: `npm start` output
- App logs: `flutter logs`
- Network requests: Use Postman to test API directly


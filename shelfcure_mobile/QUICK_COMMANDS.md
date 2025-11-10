# ShelfCure Mobile - Quick Commands Reference

## Backend Setup

```bash
# Navigate to backend
cd shelfcure-backend

# Install dependencies
npm install

# Start backend server
npm start

# Check if backend is running
curl http://localhost:5000/api/health
```

## Find Your Machine IP

### Windows
```cmd
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.100)

### Mac/Linux
```bash
ifconfig
# or
hostname -I
```

## Mobile App Setup

```bash
# Navigate to mobile app
cd shelfcure_mobile

# Get dependencies
flutter pub get

# Run on emulator
flutter run

# Run on physical device
flutter run

# Build APK
flutter build apk --release

# View logs
flutter logs

# Clean build
flutter clean
flutter pub get
flutter run
```

## Android Emulator

```bash
# List available emulators
flutter emulators

# Launch emulator
flutter emulators --launch <emulator_name>

# Example
flutter emulators --launch Pixel_4_API_30
```

## Install APK on Device

```bash
# Build APK
flutter build apk --release

# Install on connected device
adb install build/app/outputs/flutter-apk/app-release.apk

# Uninstall app
adb uninstall com.example.shelfcure_mobile
```

## Test Login API Directly

```bash
# Test with curl
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@example.com",
    "password": "password123"
  }'

# Expected response
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Store Manager",
    "email": "manager@example.com",
    ...
  }
}
```

## Configuration Changes

### For Android Emulator
Edit `lib/config/constants.dart`:
```dart
static const String apiBaseUrl = 'http://10.0.2.2:5000';
```

### For Physical Device
Edit `lib/config/constants.dart`:
```dart
static const String apiBaseUrl = 'http://192.168.1.100:5000'; // Replace with your IP
```

### For iOS Simulator
Edit `lib/config/constants.dart`:
```dart
static const String apiBaseUrl = 'http://localhost:5000';
```

## Debugging

```bash
# View app logs
flutter logs

# View only errors
flutter logs --grep "ERROR"

# View specific package logs
flutter logs --grep "ApiService"

# Clear logs
flutter logs --clear
```

## Database Testing

```bash
# Connect to MongoDB (if using local MongoDB)
mongo

# Check users collection
use shelfcure
db.users.find()

# Find specific user
db.users.findOne({email: "manager@example.com"})
```

## Common Issues

### Backend not accessible
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Check if port 5000 is in use
# Windows
netstat -ano | findstr :5000

# Mac/Linux
lsof -i :5000
```

### App can't connect
```bash
# Verify correct IP in constants.dart
# For emulator: 10.0.2.2
# For device: your machine IP

# Restart emulator/app
flutter run
```

### Token not persisting
```bash
# Check SharedPreferences
# Add debug code to app:
final prefs = await SharedPreferences.getInstance();
print('Token: ${prefs.getString("auth_token")}');
```

## Build & Deploy

```bash
# Build APK for release
flutter build apk --release

# Build App Bundle for Play Store
flutter build appbundle --release

# APK location
build/app/outputs/flutter-apk/app-release.apk

# App Bundle location
build/app/outputs/bundle/release/app-release.aab
```

## Useful Links

- Flutter Docs: https://flutter.dev/docs
- Dart Docs: https://dart.dev/guides
- Provider Package: https://pub.dev/packages/provider
- HTTP Package: https://pub.dev/packages/http
- SharedPreferences: https://pub.dev/packages/shared_preferences

## Documentation Files

- `BACKEND_SETUP_GUIDE.md` - Complete setup guide
- `LOGIN_IMPLEMENTATION_NOTES.md` - Technical details
- `LOGIN_SETUP_SUMMARY.md` - Quick summary
- `QUICK_COMMANDS.md` - This file


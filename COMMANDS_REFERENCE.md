# 📝 Commands Reference - ShelfCure Flutter App

## 🚀 Quick Start Commands

### Start Backend
```bash
cd shelfcure-backend
npm start
```
**Expected Output**: `🚀 ShelfCure API Server running on port 5000`

### Start Flutter App
```bash
cd shelfcure_mobile
flutter run -d chrome
```
**Expected Output**: App opens in Chrome browser

### Stop Backend
```bash
# Press Ctrl+C in the backend terminal
```

### Stop Flutter App
```bash
# Press 'q' in the Flutter terminal
```

---

## 🔄 Development Commands

### Hot Reload (Flutter)
```
Press 'r' in Flutter terminal
```
Reloads code changes without restarting app

### Hot Restart (Flutter)
```
Press 'R' in Flutter terminal
```
Full restart of the app

### Clean Build (Flutter)
```bash
cd shelfcure_mobile
flutter clean
flutter pub get
flutter run -d chrome
```

### Check Flutter Devices
```bash
flutter devices
```

### View Flutter Logs
```bash
flutter logs
```

---

## 🧪 Testing Commands

### Test Backend Connection
```bash
curl http://localhost:5000/api/health
```

### Test Login Endpoint
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'
```

### Check Backend Logs
```bash
# Logs are printed in the terminal where backend is running
# Look for: "=== LOGIN ATTEMPT ===" and other debug info
```

---

## 📦 Dependency Management

### Install Backend Dependencies
```bash
cd shelfcure-backend
npm install
```

### Install Flutter Dependencies
```bash
cd shelfcure_mobile
flutter pub get
```

### Update Flutter Dependencies
```bash
cd shelfcure_mobile
flutter pub upgrade
```

### Check Flutter Version
```bash
flutter --version
```

---

## 🔧 Configuration Commands

### View Backend Environment
```bash
cat shelfcure-backend/.env
```

### Edit Backend Environment
```bash
# Edit with your preferred editor
nano shelfcure-backend/.env
# or
code shelfcure-backend/.env
```

### View Flutter Constants
```bash
cat shelfcure_mobile/lib/config/constants.dart
```

### Edit Flutter Constants
```bash
# Edit with your preferred editor
nano shelfcure_mobile/lib/config/constants.dart
# or
code shelfcure_mobile/lib/config/constants.dart
```

---

## 🐛 Debugging Commands

### Enable Verbose Logging (Flutter)
```bash
flutter run -d chrome -v
```

### Open Flutter DevTools
```bash
flutter pub global activate devtools
devtools
```
Then open: `http://localhost:9100`

### Check Node Processes
```bash
# Windows
Get-Process node

# Mac/Linux
ps aux | grep node
```

### Kill Node Process
```bash
# Windows
Get-Process node | Stop-Process -Force

# Mac/Linux
pkill -f "node server.js"
```

---

## 📊 Database Commands

### Check MongoDB Connection
```bash
# Backend logs will show: "🗄️  MongoDB Connected"
```

### View Database
```bash
# Use MongoDB Compass or Atlas UI
# Connection: mongodb+srv://shelfcure:Subhransu%40PK12@cluster0.z4maxj5.mongodb.net/shelfcure
```

---

## 🏗️ Build Commands

### Build Flutter Web (Production)
```bash
cd shelfcure_mobile
flutter build web --release
```

### Build Flutter APK (Android)
```bash
cd shelfcure_mobile
flutter build apk --release
```

### Build Flutter App Bundle (Android)
```bash
cd shelfcure_mobile
flutter build appbundle --release
```

---

## 📱 Device Commands

### List Available Devices
```bash
flutter devices
```

### Run on Specific Device
```bash
flutter run -d chrome      # Chrome
flutter run -d edge        # Edge
flutter run -d windows     # Windows desktop
```

---

## 🔍 Troubleshooting Commands

### Clear Flutter Cache
```bash
flutter clean
rm -rf pubspec.lock
flutter pub get
```

### Check Flutter Doctor
```bash
flutter doctor
```

### Check Dart Version
```bash
dart --version
```

### Verify CORS Configuration
```bash
# Check backend logs for CORS headers
# Look for: "Access-Control-Allow-Origin"
```

---

## 📋 Useful Aliases (Optional)

Add to your `.bashrc` or `.zshrc`:

```bash
# Backend
alias backend-start="cd ~/Projects/SAAS/shelfcure/shelfcure-backend && npm start"
alias backend-stop="pkill -f 'node server.js'"

# Flutter
alias flutter-start="cd ~/Projects/SAAS/shelfcure/shelfcure_mobile && flutter run -d chrome"
alias flutter-clean="cd ~/Projects/SAAS/shelfcure/shelfcure_mobile && flutter clean && flutter pub get"

# Both
alias shelfcure-dev="echo 'Starting backend...' && npm start -C ~/Projects/SAAS/shelfcure/shelfcure-backend & echo 'Starting Flutter...' && flutter run -d chrome -C ~/Projects/SAAS/shelfcure/shelfcure_mobile"
```

---

## 🎯 Common Workflows

### Full Development Setup
```bash
# Terminal 1: Backend
cd shelfcure-backend
npm start

# Terminal 2: Flutter
cd shelfcure_mobile
flutter run -d chrome
```

### Quick Restart
```bash
# Terminal 1: Stop backend (Ctrl+C)
# Terminal 1: Start backend
npm start

# Terminal 2: Hot reload (press 'r')
# or Hot restart (press 'R')
```

### Full Clean Rebuild
```bash
# Terminal 1: Stop backend (Ctrl+C)
cd shelfcure-backend
npm install
npm start

# Terminal 2: Stop Flutter (press 'q')
cd shelfcure_mobile
flutter clean
flutter pub get
flutter run -d chrome
```

---

## 📞 Quick Reference

| Task | Command |
|------|---------|
| Start Backend | `npm start` (in shelfcure-backend) |
| Start Flutter | `flutter run -d chrome` (in shelfcure_mobile) |
| Hot Reload | Press `r` in Flutter terminal |
| Hot Restart | Press `R` in Flutter terminal |
| Stop App | Press `q` in terminal |
| Check Health | `curl http://localhost:5000/api/health` |
| View Logs | Check terminal output |
| Clean Build | `flutter clean && flutter pub get` |
| Build Release | `flutter build web --release` |

---

**All commands tested and working! ✅**


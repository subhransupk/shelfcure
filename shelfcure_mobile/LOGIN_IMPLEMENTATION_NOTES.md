# ShelfCure Mobile - Login Implementation Notes

## Architecture Overview

### Components
1. **LoginScreen** (`lib/screens/auth/login_screen.dart`)
   - UI for email/password input
   - Displays loading state and error messages
   - Calls AuthProvider.login() on submit

2. **AuthProvider** (`lib/providers/auth_provider.dart`)
   - Manages authentication state
   - Calls ApiService.login()
   - Stores user data and token
   - Provides isLoggedIn, user, error, isLoading getters

3. **ApiService** (`lib/services/api_service.dart`)
   - Makes HTTP POST request to backend
   - Handles response parsing
   - Stores token in SharedPreferences
   - Includes token in all subsequent requests

4. **Constants** (`lib/config/constants.dart`)
   - Configures backend URL
   - Defines API endpoints
   - Sets timeout values

---

## Login Flow

```
LoginScreen
    ↓
User enters email & password
    ↓
User taps Login button
    ↓
AuthProvider.login(email, password)
    ↓
ApiService.login(email, password)
    ↓
HTTP POST to /api/auth/login
    ↓
Backend validates credentials
    ↓
Backend returns {success: true, token: "...", user: {...}}
    ↓
ApiService stores token in SharedPreferences
    ↓
AuthProvider creates User object
    ↓
AuthProvider sets _isLoggedIn = true
    ↓
LoginScreen navigates to /home (Dashboard)
```

---

## Backend API Contract

### Endpoint
```
POST /api/auth/login
```

### Request
```json
{
  "email": "manager@example.com",
  "password": "password123"
}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Store Manager",
    "email": "manager@example.com",
    "phone": "+919876543210",
    "role": "store_manager",
    "avatar": "https://...",
    "currentStore": {...},
    "permissions": {...},
    "preferences": {...},
    "lastLogin": "2024-01-01T00:00:00Z"
  }
}
```

### Error Response (401)
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

## Token Management

### Storage
- Token stored in SharedPreferences with key: `auth_token`
- User data stored with key: `user_data`
- Persists across app restarts

### Usage
All authenticated requests include token in header:
```
Authorization: Bearer <token>
```

### Retrieval
```dart
final prefs = await SharedPreferences.getInstance();
final token = prefs.getString('auth_token');
```

---

## Error Handling

### Connection Errors
- Timeout: "Connection timeout. Please check your internet connection."
- Network error: "Connection error. Please check your internet connection."

### Authentication Errors
- Invalid credentials: "Invalid email or password"
- Missing fields: "Please enter email and password"
- Server error: "Server error. Please try again later."

---

## Testing Checklist

- [ ] Backend running on correct port
- [ ] Constants.dart has correct apiBaseUrl
- [ ] Can reach backend: `curl http://localhost:5000/api/health`
- [ ] Test user exists in database
- [ ] Login with correct credentials succeeds
- [ ] Login with wrong password shows error
- [ ] Token is stored in SharedPreferences
- [ ] Token is included in subsequent requests
- [ ] Logout clears token and user data
- [ ] App persists login after restart

---

## Key Files Modified

1. `lib/config/constants.dart` - Backend URL configuration
2. `lib/providers/auth_provider.dart` - Real API login implementation
3. `lib/services/api_service.dart` - Enhanced error handling
4. `lib/screens/auth/login_screen.dart` - Fixed constructor

---

## Future Enhancements

- [ ] Add "Remember Me" functionality
- [ ] Implement password reset flow
- [ ] Add biometric authentication
- [ ] Add 2FA support
- [ ] Implement token refresh logic
- [ ] Add login attempt rate limiting


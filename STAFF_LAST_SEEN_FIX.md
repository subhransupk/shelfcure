# Staff "Last Seen" Status Fix - Implementation Guide

## 🎯 Problem Statement

The Staff List table in the Store Panel's Staff Management section was displaying "Last seen: Never" for all staff members because:

1. The `Staff` model didn't have a `lastSeen` field
2. There was no tracking mechanism for staff login/activity
3. No link between `Staff` records and `User` accounts for staff with system access

## ✅ Solution Overview

Implemented a comprehensive staff activity tracking system that:

1. **Added activity tracking fields** to the Staff model
2. **Created User account linking** for staff with system access
3. **Automatic lastSeen updates** when staff members log in
4. **Real-time sync** between User login data and Staff records
5. **User-friendly relative time display** (e.g., "2 hours ago", "Yesterday")

---

## 📝 Changes Made

### 1. Backend - Database Model Updates

#### **File: `shelfcure-backend/models/Staff.js`**

**Added new fields:**
```javascript
// User Account Reference (for staff with system access)
userAccount: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  default: null
},

// Activity Tracking
lastSeen: {
  type: Date,
  default: null
},
lastActivity: {
  type: Date,
  default: null
}
```

**Added index for performance:**
```javascript
staffSchema.index({ userAccount: 1 }); // For linking to User accounts
```

---

### 2. Backend - Staff Controller Updates

#### **File: `shelfcure-backend/controllers/storeManagerStaffController.js`**

**Updated `getStaff` function:**
- Added `.populate('userAccount', 'lastLogin lastActivity')` to fetch User data
- Added logic to sync `lastSeen` from User's `lastLogin` or `lastActivity`
- Returns staff with up-to-date lastSeen information

**Updated `getStaffMember` function:**
- Added same population and sync logic for single staff member retrieval

**Updated `createStaff` function:**
- Automatically creates User account when `hasSystemAccess: true`
- Links the User account to the Staff record via `userAccount` field
- Uses default password 'ShelfCure@123' if not provided
- Handles existing User accounts by linking instead of creating duplicates

**Updated `ensureStoreManagerInStaff` function:**
- Automatically links User account when creating store manager staff record

---

### 3. Backend - Authentication Updates

#### **File: `shelfcure-backend/routes/auth.js`**

**Updated login route (`POST /api/auth/login`):**
- Updates `user.lastActivity` on successful login
- Finds linked Staff record by `userAccount` reference
- Updates `staff.lastSeen` and `staff.lastActivity` on login
- Logs activity for debugging

**Updated admin login route (`POST /api/auth/admin-login`):**
- Same updates as regular login for admin users

---

### 4. Frontend - Display Updates

#### **File: `shelfcure-frontend/src/pages/StoreManagerStaff.jsx`**

**Added `getRelativeTime` utility function:**
```javascript
const getRelativeTime = (date) => {
  if (!date) return 'Never';
  
  const now = new Date();
  const lastSeen = new Date(date);
  const diffMs = now - lastSeen;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Active now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
};
```

**Updated Status column display:**
```javascript
<div className="text-xs text-gray-500 mt-1">
  Last seen: {getRelativeTime(member.lastSeen)}
</div>
```

---

### 5. Migration Script

#### **File: `shelfcure-backend/scripts/linkStaffToUserAccounts.js`**

Created a migration script to:
- Link existing Staff records with `hasSystemAccess: true` to their User accounts
- Sync `lastSeen` from User's `lastLogin` or `lastActivity`
- Provide detailed migration summary

**To run the migration:**
```bash
cd shelfcure-backend
node scripts/linkStaffToUserAccounts.js
```

---

## 🚀 How It Works

### For Staff WITH System Access:

1. **Staff Creation:**
   - When creating staff with `hasSystemAccess: true`, a User account is automatically created
   - The User account is linked to the Staff record via `userAccount` field
   - Default password is 'ShelfCure@123' (can be changed later)

2. **Login Tracking:**
   - When staff member logs in, their User's `lastLogin` and `lastActivity` are updated
   - The linked Staff record's `lastSeen` and `lastActivity` are also updated
   - This happens automatically in the authentication middleware

3. **Display:**
   - When fetching staff list, the API populates the linked User account
   - If User's `lastLogin` is more recent than Staff's `lastSeen`, it syncs automatically
   - Frontend displays relative time (e.g., "2 hours ago", "Yesterday")

### For Staff WITHOUT System Access:

- Staff members without system access will show "Never" for last seen
- This is expected behavior as they don't have login credentials
- Their `lastSeen` can be manually updated if needed (e.g., via attendance tracking)

---

## 📊 Expected Results

### Before Fix:
```
Status: Active
Last seen: Never
```

### After Fix (for staff with system access who have logged in):
```
Status: Active
Last seen: 2 hours ago
```

```
Status: Active
Last seen: Yesterday
```

```
Status: Active
Last seen: 3 days ago
```

### After Fix (for staff without system access):
```
Status: Active
Last seen: Never
```

---

## 🧪 Testing Checklist

- [ ] Run migration script to link existing staff to user accounts
- [ ] Create new staff member with system access enabled
- [ ] Verify User account is created automatically
- [ ] Log in as the staff member
- [ ] Check Staff List - should show "Active now" or recent time
- [ ] Wait a few minutes and refresh - should show "X minutes ago"
- [ ] Create staff member WITHOUT system access
- [ ] Verify they show "Never" for last seen (expected)
- [ ] Check that store managers show their last login time

---

## 🔧 Maintenance Notes

### Automatic Updates:
- `lastSeen` is automatically updated on every login
- No manual intervention required for staff with system access

### Manual Updates:
- For staff without system access, `lastSeen` can be updated via:
  - Attendance marking
  - Manual API calls
  - Future mobile app check-ins

### Performance:
- Added database index on `userAccount` field for fast lookups
- Uses `.lean()` for better query performance
- Population is efficient with field selection

---

## 🐛 Troubleshooting

### Issue: Staff still showing "Never"
**Solution:** 
1. Check if staff has `hasSystemAccess: true`
2. Check if `userAccount` is linked (run migration script)
3. Have the staff member log in once to update lastSeen

### Issue: Time not updating
**Solution:**
1. Check server logs for authentication updates
2. Verify Staff record has `userAccount` field populated
3. Check User model has `lastLogin` and `lastActivity` fields

### Issue: Migration script fails
**Solution:**
1. Ensure MongoDB connection string is correct in `.env`
2. Check that both Staff and User collections exist
3. Verify email addresses match between Staff and User records

---

## 📚 Related Files

- `shelfcure-backend/models/Staff.js` - Staff model with new fields
- `shelfcure-backend/models/User.js` - User model with login tracking
- `shelfcure-backend/controllers/storeManagerStaffController.js` - Staff CRUD operations
- `shelfcure-backend/routes/auth.js` - Authentication with lastSeen updates
- `shelfcure-frontend/src/pages/StoreManagerStaff.jsx` - Staff list UI
- `shelfcure-backend/scripts/linkStaffToUserAccounts.js` - Migration script

---

## ✨ Future Enhancements

1. **Real-time Updates:** Use WebSockets to show "Active now" in real-time
2. **Activity Dashboard:** Show detailed activity logs for each staff member
3. **Mobile App Integration:** Update lastSeen from mobile app usage
4. **Attendance Integration:** Sync lastSeen with attendance check-in/out
5. **Offline Detection:** Show "Offline" status after certain inactivity period


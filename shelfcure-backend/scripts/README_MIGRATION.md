# Staff-to-User Account Linking Migration

## 📋 Overview

This migration script links existing Staff records with system access to their corresponding User accounts and syncs the `lastSeen` field.

## 🚀 How to Run

### Prerequisites
1. Ensure MongoDB is running
2. Ensure `.env` file has correct `MONGO_URI`
3. Backup your database (recommended)

### Steps

1. **Navigate to backend directory:**
   ```bash
   cd shelfcure-backend
   ```

2. **Run the migration script:**
   ```bash
   node scripts/linkStaffToUserAccounts.js
   ```

3. **Review the output:**
   The script will show:
   - Number of staff members found with system access
   - Successfully linked accounts
   - Staff members without matching User accounts
   - Any errors encountered

### Expected Output

```
🔄 Starting Staff-to-User account linking migration...

✅ Connected to MongoDB

📊 Found 5 staff members with system access but no linked user account

✅ Linked: John Doe (john@example.com) -> User ID: 507f1f77bcf86cd799439011
   Last seen synced: 2025-01-15T10:30:00.000Z
✅ Linked: Jane Smith (jane@example.com) -> User ID: 507f1f77bcf86cd799439012
   Last seen synced: 2025-01-14T15:45:00.000Z
⚠️  No User account found for: Bob Wilson (bob@example.com)

============================================================
📊 Migration Summary:
============================================================
✅ Successfully linked: 2
⚠️  No User account found: 1
❌ Errors: 0
============================================================

🔄 Syncing lastSeen for all staff with linked user accounts...

✅ Synced lastSeen for: John Doe -> 2025-01-15T10:30:00.000Z
✅ Synced lastSeen for: Jane Smith -> 2025-01-14T15:45:00.000Z

✅ Synced lastSeen for 2 staff members

✅ Migration completed successfully!
```

## 🔍 What the Script Does

1. **Finds unlinked staff:**
   - Searches for Staff records with `hasSystemAccess: true`
   - Filters those without a linked `userAccount`

2. **Links User accounts:**
   - Matches Staff records to User accounts by email
   - Updates the `userAccount` field in Staff records

3. **Syncs lastSeen:**
   - Copies `lastLogin` or `lastActivity` from User to Staff's `lastSeen`
   - Updates `lastActivity` field as well

4. **Updates all linked staff:**
   - Syncs lastSeen for all staff that already have linked accounts
   - Ensures data is up-to-date

## ⚠️ Important Notes

### Staff Without User Accounts

If the script shows "No User account found" for a staff member:

**Option 1: Create User Account Manually**
```javascript
// In MongoDB shell or via API
db.users.insertOne({
  name: "Bob Wilson",
  email: "bob@example.com",
  phone: "+1234567890",
  password: "$2a$12$...", // Hashed password
  role: "staff",
  stores: [ObjectId("...")],
  currentStore: ObjectId("..."),
  isActive: true,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

**Option 2: Update Staff Record**
```javascript
// Set hasSystemAccess to false if they don't need login
db.staff.updateOne(
  { email: "bob@example.com" },
  { $set: { hasSystemAccess: false } }
);
```

### Re-running the Script

The script is **idempotent** - you can run it multiple times safely:
- Already linked accounts will be skipped
- Only unlinked staff will be processed
- lastSeen will be updated to the latest value

## 🐛 Troubleshooting

### Error: "Cannot connect to MongoDB"
**Solution:** Check your `MONGO_URI` in `.env` file

### Error: "Staff model not found"
**Solution:** Ensure you're running from the `shelfcure-backend` directory

### Warning: "No User account found"
**Solution:** This is expected for staff who don't have login credentials. Either:
1. Create a User account for them
2. Set their `hasSystemAccess` to `false`

### Script hangs or doesn't exit
**Solution:** 
1. Press Ctrl+C to stop
2. Check MongoDB connection
3. Check for any console errors

## 📊 Verification

After running the migration, verify the results:

### Check in MongoDB:
```javascript
// Find staff with linked user accounts
db.staff.find({ 
  hasSystemAccess: true, 
  userAccount: { $exists: true, $ne: null } 
}).pretty();

// Check lastSeen is populated
db.staff.find({ 
  hasSystemAccess: true, 
  lastSeen: { $ne: null } 
}).pretty();
```

### Check in the Application:
1. Log in to Store Panel
2. Navigate to Staff Management
3. Check the "Last seen" column
4. Should show relative times (e.g., "2 hours ago") instead of "Never"

## 🔄 Rollback (if needed)

If you need to undo the migration:

```javascript
// Remove userAccount links
db.staff.updateMany(
  { hasSystemAccess: true },
  { 
    $unset: { 
      userAccount: "",
      lastSeen: "",
      lastActivity: ""
    } 
  }
);
```

## 📞 Support

If you encounter issues:
1. Check the console output for specific error messages
2. Verify database connection and credentials
3. Ensure all models are properly defined
4. Check that email addresses match between Staff and User collections


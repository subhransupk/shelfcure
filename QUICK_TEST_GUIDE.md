# Quick Test Guide - ShelfCure Flutter Mobile App

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Backend running on `http://localhost:5000`
- Flutter app running on Chrome

### Step 1: Verify Backend is Running
```bash
# In a terminal, check if backend is running
curl http://localhost:5000/api/health
```
Expected response: `{"status":"ok"}`

### Step 2: Check Flutter App
- Open the URL shown in Flutter terminal
- You should see the **ShelfCure Mobile Login Screen**

### Step 3: Login
Use your store manager credentials:
- **Email**: Your store manager email
- **Password**: Your password

---

## 🧪 Testing Checklist

### Login Screen
- [ ] Email input field visible
- [ ] Password input field visible
- [ ] Password visibility toggle works
- [ ] Login button is clickable
- [ ] Error messages display properly

### After Successful Login
- [ ] Redirected to Dashboard
- [ ] Bottom navigation shows 3 tabs: Dashboard, Sales, Analytics
- [ ] Dashboard data loads

### Dashboard Tab
- [ ] Total Sales card displays
- [ ] Today's Sales card displays
- [ ] Transactions card displays
- [ ] Customers card displays
- [ ] Sales trend chart renders
- [ ] Recent sales list shows data
- [ ] Pull-to-refresh works
- [ ] Logout button in app bar works

### Sales Tab
- [ ] Sales list displays with pagination
- [ ] Each sale shows: Invoice #, Customer, Date, Amount, Status
- [ ] Clicking a sale shows details
- [ ] Pull-to-refresh works
- [ ] Infinite scroll loads more sales

### Sale Details Screen
- [ ] Invoice header with number and status
- [ ] Customer information displays
- [ ] Items list shows medicines
- [ ] Summary shows subtotal, discount, total
- [ ] Back button returns to sales list

### Analytics Tab
- [ ] Period selector (Monthly/Yearly) visible
- [ ] Key metrics cards display
- [ ] Daily sales bar chart renders
- [ ] Category sales list shows data
- [ ] Period change updates charts

---

## 🔍 Common Issues & Solutions

### Issue: CORS Error
```
Access to fetch at 'http://localhost:5000/api/auth/login' 
from origin 'http://localhost:XXXX' has been blocked by CORS policy
```
**Solution**: 
- Restart backend: `npm start` in `shelfcure-backend`
- Ensure `NODE_ENV=development` in `.env`

### Issue: Login Fails
**Solution**:
- Check backend logs for errors
- Verify user exists in database
- Check email/password are correct

### Issue: Data Not Loading
**Solution**:
- Check backend is running
- Check database connection
- Restart Flutter app: Press `R` in terminal

### Issue: Charts Not Rendering
**Solution**:
- Ensure data exists in database
- Check browser console for errors
- Try hot reload: Press `r` in terminal

---

## 📊 Test Data

### Create Test Store Manager
```bash
cd shelfcure-backend
node scripts/createStoreManager.js
```

### Create Test Sales Data
```bash
node scripts/seedDemoSalesData.js
```

---

## 🎯 Success Criteria

✅ App compiles without errors
✅ CORS errors resolved
✅ Login works with valid credentials
✅ Dashboard loads with real data
✅ Sales list displays with pagination
✅ Analytics charts render
✅ Navigation between tabs works
✅ Pull-to-refresh works
✅ All data loads from backend

---

## 📱 Browser DevTools

### Open DevTools
- Press `F12` in Chrome
- Go to **Console** tab
- Check for any JavaScript errors

### Network Tab
- Check API requests to `http://localhost:5000`
- Verify response status is 200/201
- Check response headers include CORS headers

### Flutter DevTools
- Available at: `http://127.0.0.1:9102`
- Use for debugging Dart code
- Check widget tree and performance

---

## ✅ All Systems Go!

Your app is ready for testing. Start with the login screen and work through each module.

**Report any issues and we'll fix them!**


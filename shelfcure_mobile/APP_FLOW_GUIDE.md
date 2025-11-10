# ShelfCure Mobile App - User Flow Guide

## 🔄 Complete App Flow

### 1. Application Startup
```
App Launch
    ↓
Check Authentication Status
    ↓
├─ If Logged In → Go to Dashboard
└─ If Not Logged In → Go to Login Screen
```

## 🔐 Authentication Flow

### Login Screen
```
User Opens App
    ↓
Login Screen Displayed
    ↓
User Enters Email & Password
    ↓
User Taps "Login" Button
    ↓
API Call: POST /api/auth/login
    ↓
├─ Success → Token Saved → Dashboard
└─ Failure → Error Message → Retry
```

### Session Management
```
Token Stored in SharedPreferences
    ↓
Token Automatically Injected in Headers
    ↓
All API Requests Include Token
    ↓
If Token Expires → Logout & Redirect to Login
```

## 📊 Dashboard Flow

### Initial Load
```
Dashboard Screen Opens
    ↓
Fetch Dashboard Data
    ↓
API Call: GET /api/store-manager/dashboard
    ↓
Parse Response into DashboardData Model
    ↓
Display Metrics & Charts
    ↓
Show Recent Sales List
```

### User Interactions
```
Dashboard Screen
    ├─ Pull Down → Refresh Data
    ├─ Tap Logout → Clear Session → Login Screen
    ├─ Tap Sales Tab → Sales Screen
    └─ Tap Analytics Tab → Analytics Screen
```

### Data Display
```
Dashboard Metrics (4 Cards)
├─ Total Sales (₹ amount)
├─ Today's Sales (₹ amount)
├─ Transactions (count)
└─ Customers (count)
    ↓
Sales Trend Chart
├─ Line chart showing sales over time
├─ Interactive data points
└─ Responsive to data changes
    ↓
Recent Sales List
├─ Invoice number
├─ Customer name
├─ Date & time
├─ Amount
└─ Status badge
```

## 💳 Sales Flow

### Sales List
```
Sales Screen Opens
    ↓
Fetch Sales Data (Page 1)
    ↓
API Call: GET /api/store-manager/sales?page=1&limit=20
    ↓
Display Sales List
    ↓
User Interactions:
├─ Pull Down → Refresh (Reset to Page 1)
├─ Scroll Down → Load More (Next Page)
├─ Tap Sale → View Details
└─ Tap FAB → Create Sale (Coming Soon)
```

### Sale Details
```
User Taps on Sale
    ↓
Sale Detail Screen Opens
    ↓
Display Sale Information:
├─ Invoice Header
│  ├─ Invoice Number
│  ├─ Status Badge
│  ├─ Date
│  └─ Payment Method
├─ Customer Info
│  └─ Customer Name
├─ Items List
│  ├─ Medicine Name
│  ├─ Quantity
│  ├─ Unit Price
│  └─ Total Price
└─ Summary
   ├─ Subtotal
   ├─ Discount
   └─ Final Total
```

### Pagination
```
Initial Load: 20 Items
    ↓
User Scrolls to Bottom
    ↓
Load More Triggered
    ↓
Fetch Next 20 Items
    ↓
Append to List
    ↓
Continue Until No More Items
```

## 📈 Analytics Flow

### Analytics Screen
```
Analytics Screen Opens
    ↓
Fetch Analytics Data (Default: Monthly)
    ↓
API Call: GET /api/store-manager/analytics?period=monthly
    ↓
Display Metrics & Charts
```

### Period Selection
```
User Sees Period Selector
├─ Monthly (Default)
└─ Yearly
    ↓
User Taps Different Period
    ↓
Fetch New Data with Selected Period
    ↓
Update All Charts & Metrics
```

### Analytics Display
```
Key Metrics (4 Cards)
├─ Total Revenue (₹ amount)
├─ Monthly Revenue (₹ amount)
├─ Total Sales (count)
└─ Average Order Value (₹ amount)
    ↓
Daily Sales Chart
├─ Bar chart showing daily sales
├─ X-axis: Dates
├─ Y-axis: Amount
└─ Interactive tooltips
    ↓
Category Breakdown
├─ Category Name
├─ Amount
├─ Percentage
└─ Progress Bar
    ↓
Customer Segments
├─ Segment Name
├─ Customer Count
└─ Total Spending
```

## 🧭 Navigation Flow

### Bottom Navigation
```
Home Screen
    ├─ Tab 1: Dashboard
    │  └─ Dashboard Screen
    ├─ Tab 2: Sales
    │  ├─ Sales Screen
    │  └─ Sale Detail Screen (on tap)
    └─ Tab 3: Analytics
       └─ Analytics Screen
```

### Tab Switching
```
User Taps Tab
    ↓
Current Screen Replaced
    ↓
New Screen Displayed
    ↓
Data Loaded if First Time
    ↓
Cached if Already Loaded
```

## 🔄 Data Refresh Flow

### Pull-to-Refresh
```
User Pulls Down on Screen
    ↓
Refresh Indicator Shows
    ↓
Fetch Fresh Data from API
    ↓
Update State
    ↓
Refresh Indicator Hides
    ↓
Display Updated Data
```

### Error Handling
```
API Request Made
    ↓
├─ Success (200/201)
│  └─ Parse & Display Data
├─ Unauthorized (401)
│  └─ Clear Token → Logout → Login Screen
├─ Server Error (500)
│  └─ Show Error Message → Retry Button
└─ Network Error
   └─ Show Connection Error → Retry Button
```

## 🔐 Logout Flow

```
User Taps Logout (Dashboard)
    ↓
Clear Authentication Token
    ↓
Clear User Data
    ↓
Clear All Cached Data
    ↓
Redirect to Login Screen
    ↓
User Can Login Again
```

## 📱 Screen Transitions

### Navigation Map
```
Login Screen
    ↓ (Successful Login)
    ↓
Home Screen (Dashboard Tab Active)
    ├─ Tap Sales Tab → Sales Screen
    │  └─ Tap Sale → Sale Detail Screen
    │     └─ Back → Sales Screen
    ├─ Tap Analytics Tab → Analytics Screen
    │  └─ Change Period → Refresh Analytics
    └─ Tap Logout → Login Screen
```

## ⚡ Performance Optimization

### Data Caching
```
First Load: Fetch from API
    ↓
Store in Provider State
    ↓
Subsequent Loads: Use Cached Data
    ↓
Pull-to-Refresh: Fetch Fresh Data
```

### Pagination
```
Load 20 Items at a Time
    ↓
Append New Items on Scroll
    ↓
Prevent Loading Duplicate Pages
    ↓
Stop When No More Items
```

### Chart Rendering
```
Data Received
    ↓
Parse into Chart Format
    ↓
Render Chart with fl_chart
    ↓
Smooth Animation
    ↓
Interactive Tooltips
```

## 🎯 User Journey Examples

### Example 1: Check Today's Sales
```
1. Open App
2. Login with credentials
3. Dashboard loads automatically
4. View "Today's Sales" card
5. See recent sales list
6. Tap on any sale for details
7. View itemized breakdown
8. Go back to dashboard
```

### Example 2: Analyze Monthly Performance
```
1. Open App
2. Login
3. Tap "Analytics" tab
4. View monthly metrics
5. Check daily sales chart
6. Review category breakdown
7. Analyze customer segments
8. Pull down to refresh
```

### Example 3: Browse Sales History
```
1. Open App
2. Login
3. Tap "Sales" tab
4. View sales list
5. Scroll down to load more
6. Tap on specific sale
7. View complete details
8. Go back to list
9. Continue browsing
```

## 🔄 State Management Flow

### Provider Updates
```
User Action
    ↓
Provider Method Called
    ↓
API Service Makes Request
    ↓
Response Received
    ↓
Provider Updates State
    ↓
notifyListeners() Called
    ↓
UI Rebuilds with New Data
```

### Error State
```
API Error Occurs
    ↓
Provider Sets Error Message
    ↓
notifyListeners() Called
    ↓
UI Shows Error Message
    ↓
User Taps Retry
    ↓
Provider Retries Request
```

## 📊 Data Flow Diagram

```
User Input
    ↓
Screen/Widget
    ↓
Provider Method
    ↓
API Service
    ↓
HTTP Request
    ↓
Backend API
    ↓
Response
    ↓
Parse to Model
    ↓
Provider State Update
    ↓
UI Rebuild
    ↓
Display to User
```

---

This flow guide provides a complete understanding of how users interact with the ShelfCure Mobile app and how data flows through the system.


# Dynamic Dashboard Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Flutter Mobile App                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Dashboard Screen (UI Layer)                  │   │
│  │  - Displays metrics in grid layout                   │   │
│  │  - Shows loading states                             │   │
│  │  - Handles user interactions                        │   │
│  │  - Pull-to-refresh gesture                          │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                           │
│  ┌────────────────▼─────────────────────────────────────┐   │
│  │    Dashboard Provider (State Management)             │   │
│  │  - Manages dashboard state                           │   │
│  │  - Handles data fetching logic                       │   │
│  │  - Implements retry with exponential backoff         │   │
│  │  - Error handling and fallback                       │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                           │
│  ┌────────────────▼─────────────────────────────────────┐   │
│  │      API Service (Network Layer)                     │   │
│  │  - getDashboardData()                                │   │
│  │  - getExpiryAlertsSummary()                          │   │
│  │  - getDoctorStats()                                 │   │
│  │  - HTTP client with auth headers                    │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                           │
│  ┌────────────────▼─────────────────────────────────────┐   │
│  │    Dashboard Model (Data Layer)                      │   │
│  │  - DashboardData class                               │   │
│  │  - fromJson() factory method                         │   │
│  │  - Type conversion helpers                           │   │
│  │  - Null safety and validation                        │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                           │
└───────────────────┼───────────────────────────────────────────┘
                    │
                    │ HTTP Requests
                    │ (Bearer Token Auth)
                    │
┌───────────────────▼───────────────────────────────────────────┐
│              ShelfCure Backend API                             │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  GET /api/store-manager/dashboard                    │    │
│  │  Returns: Metrics, Recent Sales, Expiring Medicines  │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  GET /api/store-manager/expiry-alerts/summary        │    │
│  │  Returns: Expiry counts and values                   │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  GET /api/store-manager/doctors/stats                │    │
│  │  Returns: Commission data                            │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                 │
└───────────────────┬───────────────────────────────────────────┘
                    │
                    │ Database Queries
                    │
┌───────────────────▼───────────────────────────────────────────┐
│                  MongoDB Database                              │
├───────────────────────────────────────────────────────────────┤
│  - Sales Collection                                             │
│  - Medicines Collection                                         │
│  - Customers Collection                                         │
│  - Doctors Collection                                           │
│  - Stores Collection                                            │
│  - Returns Collection                                           │
│  - Waste Records Collection                                     │
└───────────────────────────────────────────────────────────────┘
```

## Data Flow Sequence

```
1. App Launch
   └─> Dashboard Screen loads
       └─> DashboardProvider.fetchDashboardData()
           └─> ApiService.getDashboardData()
               └─> HTTP GET /api/store-manager/dashboard
                   └─> Backend processes request
                       └─> Queries MongoDB
                           └─> Returns JSON response
                               └─> DashboardData.fromJson()
                                   └─> UI renders metrics

2. User Pull-to-Refresh
   └─> RefreshIndicator triggered
       └─> DashboardProvider.refreshDashboardData()
           └─> Same flow as above

3. Error Scenario
   └─> API call fails
       └─> Error caught in try-catch
           └─> Error state set
               └─> UI shows error message
                   └─> User clicks "Retry"
                       └─> Single retry attempt
                       OR
                       └─> User clicks "Retry (3x)"
                           └─> Exponential backoff retry
                               └─> 1s delay, 2s delay, 4s delay
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────┐
│                  Dashboard Screen                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Consumer<DashboardProvider>                       │  │
│  │  - Listens to provider changes                    │  │
│  │  - Rebuilds on state updates                      │  │
│  │  - Displays loading/error/data states             │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ Reads from
                     │
┌────────────────────▼────────────────────────────────────┐
│            Dashboard Provider                            │
│  ┌───────────────────────────────────────────────────┐  │
│  │ State Variables:                                  │  │
│  │  - _dashboardData: DashboardData?                 │  │
│  │  - _isLoading: bool                               │  │
│  │  - _error: String?                                │  │
│  │  - _apiService: ApiService                        │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Methods:                                          │  │
│  │  - fetchDashboardData()                           │  │
│  │  - refreshDashboardData()                         │  │
│  │  - retryFetchDashboardData()                      │  │
│  │  - clearError()                                   │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ Uses
                     │
┌────────────────────▼────────────────────────────────────┐
│              API Service                                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Singleton Instance                                │  │
│  │  - Manages HTTP client                            │  │
│  │  - Handles authentication                         │  │
│  │  - Implements timeout logic                       │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Methods:                                          │  │
│  │  - getDashboardData()                             │  │
│  │  - getExpiryAlertsSummary()                       │  │
│  │  - getDoctorStats()                               │  │
│  │  - _getRequest()                                  │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ Parses into
                     │
┌────────────────────▼────────────────────────────────────┐
│            Dashboard Model                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │ DashboardData Class                               │  │
│  │  - 50+ metric fields                              │  │
│  │  - fromJson() factory                             │  │
│  │  - Type conversion helpers                        │  │
│  │  - Null safety                                    │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
API Call
    │
    ├─ Success (200)
    │   └─> Parse response
    │       └─> DashboardData.fromJson()
    │           └─> Update UI
    │
    ├─ Network Error
    │   └─> Catch exception
    │       └─> Set error state
    │           └─> Show error UI
    │               └─> User clicks retry
    │                   ├─> Single retry
    │                   │   └─> One attempt
    │                   │
    │                   └─> 3x retry
    │                       ├─> Attempt 1 (immediate)
    │                       ├─> Wait 1s
    │                       ├─> Attempt 2
    │                       ├─> Wait 2s
    │                       ├─> Attempt 3
    │                       └─> Final result
    │
    └─ Server Error (5xx)
        └─> Catch exception
            └─> Set error state
                └─> Show error UI
                    └─> Fallback to mock data
```

## State Management Flow

```
Initial State
├─ isLoading: false
├─ error: null
└─ dashboardData: null

Fetching State
├─ isLoading: true
├─ error: null
└─ dashboardData: null

Success State
├─ isLoading: false
├─ error: null
└─ dashboardData: DashboardData(...)

Error State
├─ isLoading: false
├─ error: "Error message"
└─ dashboardData: null (or previous data)

Retry State
├─ isLoading: true
├─ error: null
└─ dashboardData: null (or previous data)
```

## Performance Optimization

```
┌─────────────────────────────────────────┐
│      Optimization Strategies             │
├─────────────────────────────────────────┤
│                                          │
│ 1. Efficient API Calls                   │
│    - Single endpoint for main data       │
│    - Parallel requests possible          │
│    - Proper timeout handling             │
│                                          │
│ 2. Smart Caching                         │
│    - Cache-busting parameters            │
│    - Timestamp-based invalidation        │
│    - Random parameter for freshness      │
│                                          │
│ 3. Memory Management                     │
│    - Proper resource cleanup             │
│    - No memory leaks                     │
│    - Efficient data structures           │
│                                          │
│ 4. Network Optimization                  │
│    - Minimal data transfer               │
│    - Compression support                 │
│    - Connection pooling                  │
│                                          │
│ 5. UI Rendering                          │
│    - Efficient rebuilds                  │
│    - Consumer pattern usage              │
│    - Minimal widget tree updates         │
│                                          │
└─────────────────────────────────────────┘
```

## Deployment Architecture

```
Development
├─ Local Backend (localhost:5000)
├─ Test Data
└─ Debug Logging

Staging
├─ Staging Backend
├─ Test Data
└─ Debug Logging

Production
├─ Production Backend
├─ Real Data
└─ Error Logging Only
```


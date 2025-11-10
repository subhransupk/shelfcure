# Code Structure: Two-Tab Interface

## Class Hierarchy

```
SalesScreen (StatefulWidget)
  └── _SalesScreenState (State with SingleTickerProviderStateMixin)
      ├── TabController _tabController
      ├── ScrollController _scrollController
      └── Methods:
          ├── initState()
          ├── dispose()
          ├── build()
          ├── _buildTabBar()
          ├── _buildPOSTab()
          ├── _buildHistoryTab()
          ├── _buildModernAppBar()
          ├── _buildErrorState()
          ├── _buildEmptyState()
          ├── _buildSaleCard()
          └── _onScroll()
```

## Widget Tree

```
Scaffold
├── AppBar (Sales & POS)
└── Body: Column
    ├── TabBar (POS | History)
    └── TabBarView
        ├── POS Tab
        │   └── Column
        │       ├── Customer Selection Section
        │       ├── Doctor Selection Section
        │       ├── Medicine Search Section
        │       ├── Shopping Cart Section
        │       └── Order Summary Section
        │
        └── History Tab
            └── Consumer<SalesProvider>
                ├── Loading State
                ├── Error State
                ├── Empty State
                └── ListView (Sales List)
                    └── SaleCard (repeating)

```

## State Management

### TabController
- Controls tab switching
- Provides `index` property (0 = POS, 1 = History)

### SalesProvider (via Consumer)
- Manages sales data
- Handles loading states
- Provides error handling
- Supports infinite scroll

## Key Methods

### _buildTabBar()
- Creates TabBar with 2 tabs
- Green styling (#2E7D32)
- Active/inactive label styles

### _buildPOSTab()
- Customer selection interface
- Doctor selection interface
- Medicine search and selection
- Shopping cart display
- Order summary with discount/tax

### _buildHistoryTab()
- Wraps existing sales list logic
- Preserves all functionality
- Pull-to-refresh support
- Infinite scroll support

## Styling Constants

- Primary Color: #2E7D32 (Green)
- Background: #F9FAFB (Light Gray)
- Text Primary: #111827 (Dark)
- Text Secondary: #6B7280 (Gray)
- Border: #E5E7EB (Light Gray)

## Navigation Flow

```
POS Tab
  ├── Customer Selection → Search/Select Customer
  ├── Doctor Selection → Search/Select Doctor
  ├── Medicine Search → Add to Cart
  ├── Shopping Cart → Modify/Remove Items
  └── Order Summary → View Totals

History Tab
  ├── Sale Card → SaleDetailScreen
  └── Pull to Refresh → Reload data
```

## Performance Considerations

- TabController properly disposed
- ScrollController properly disposed
- Efficient ListView with builder
- Lazy loading with infinite scroll
- Provider pattern for state management


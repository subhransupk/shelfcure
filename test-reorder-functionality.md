# Test Plan: Reorder Quantity Bug Fix

## Test Scenarios

### Scenario 1: Direct Reorder from Low Stock Page
1. **Navigate to Low Stock Page**: Go to `/store-panel/low-stock`
2. **Find a Low Stock Medicine**: Look for medicines with "Low Stock" status
3. **Click Reorder Button**: Click the "Reorder" button for a specific medicine
4. **Verify Navigation**: Should navigate to `/store-panel/purchases` with "New Purchase" tab active
5. **Check Pre-populated Data**: 
   - Medicine should be pre-selected in the form
   - Quantity should be calculated based on reorder levels (not default to 5)
   - Unit type should be appropriate (strip/individual)
   - Unit price should be pre-filled if available

### Scenario 2: Reorder Interface within Purchase Page
1. **Navigate to Purchase Page**: Go to `/store-panel/purchases`
2. **Switch to Reorder Tab**: Click on "Reorder" tab
3. **View Reorder Suggestions**: Check medicines that need reordering
4. **Modify Quantities**: Change quantities for specific medicines
5. **Select Items**: Check the checkbox to select items for reorder
6. **Create Purchase Order**: Click "Create Purchase Orders" button
7. **Verify Quantities**: Check that the modified quantities are preserved in the PO form

### Scenario 3: Multiple Medicine Reorder
1. **Go to Reorder Tab**: In purchases page
2. **Select Multiple Medicines**: Check multiple medicines with different quantities
3. **Modify Some Quantities**: Change quantities for some medicines
4. **Create Purchase Orders**: Generate POs
5. **Verify All Quantities**: Ensure all custom quantities are preserved

## Expected Results

### Before Fix:
- Quantities would default to "5" regardless of selection
- Manual quantity changes would be lost
- Reorder suggestions would not be preserved

### After Fix:
- Quantities should be calculated based on reorder levels and stock
- Manual quantity overrides should be preserved
- Navigation from low stock page should pre-populate correct quantities
- Reorder interface should maintain selected quantities when creating POs

## Implementation Details

### Changes Made:

1. **Added Navigation State Handling**:
   - Imported `useLocation` and `useNavigate` from React Router
   - Added useEffect to handle `location.state.preselectedMedicine`
   - Pre-populates purchase form with calculated quantities

2. **Quantity Calculation Logic**:
   - For strips: `Math.max((reorderLevel * 2) - currentStock, minStock, 5)`
   - For individual: `Math.max((reorderLevel * 2) - currentStock, minStock, 50)`
   - Fallback to reasonable defaults if data is missing

3. **State Management**:
   - Preserves medicine search state for pre-selected items
   - Clears navigation state after processing to prevent re-processing
   - Maintains existing `getEffectiveQuantity` function for manual overrides

4. **Integration Points**:
   - Low stock page: `handleReorder` function passes medicine data
   - Purchase page: New useEffect handles preselected medicine
   - Reorder interface: Existing quantity preservation logic maintained

## Test Results

### Manual Testing Required:
- [ ] Test direct reorder from low stock page
- [ ] Test quantity preservation in reorder interface
- [ ] Test multiple medicine selection
- [ ] Test edge cases (no stock data, missing prices)
- [ ] Verify console logs show correct processing
- [ ] Check that quantities are not defaulting to "5"

### Console Logs to Watch:
- `🎯 Handling preselected medicine from reorder:`
- `✅ Pre-populated purchase form with [medicine], quantity: [quantity]`
- `🔧 Processing item [index]:`
- `🏗️ Creating single PO with supplier group:`

## Potential Issues to Monitor:
1. Navigation state not clearing properly
2. Quantity calculations returning NaN or invalid values
3. Medicine search state conflicts
4. Supplier pre-selection issues
5. Form validation errors with pre-populated data

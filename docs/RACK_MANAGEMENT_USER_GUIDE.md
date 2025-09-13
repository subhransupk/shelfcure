# Rack Management System - User Guide

## Overview

The Rack Management System helps pharmacy stores organize their medicine inventory using a structured rack-shelf-position system. This guide covers how to use the system effectively for different user roles.

## Getting Started

### Accessing Rack Management

1. **Store Managers**: Navigate to "Rack Management" in the store panel sidebar
2. **Staff/Employees**: Use "Medicine Location Search" for finding medicine locations

### System Structure

The system uses a hierarchical structure:
- **Rack** → **Shelf** → **Position**
- Example: `R001-2-05` means Rack R001, Shelf 2, Position 05

---

## For Store Managers

### 1. Creating Racks

**Step 1: Navigate to Rack Management**
- Click "Rack Management" in the sidebar
- Click "Add Rack" button

**Step 2: Fill Basic Information**
- **Rack Number**: Unique identifier (e.g., R001, A1, COLD-01)
- **Rack Name**: Descriptive name (e.g., "Main Storage Rack A")
- **Description**: Brief description of the rack's purpose
- **Category**: Select appropriate category:
  - General: Standard medicines
  - Refrigerated: Cold storage medicines
  - Controlled Substances: Secure medicines
  - OTC: Over-the-counter medicines
  - Prescription: Prescription medicines
  - Emergency: Emergency medicines

**Step 3: Set Location**
- **Zone**: Physical area (e.g., "Front Counter", "Back Room")
- **Floor**: Floor level (e.g., "Ground", "First")
- **Coordinates**: Optional X,Y coordinates for mapping

**Step 4: Configure Shelves and Positions**
- Add shelves with unique numbers (1, 2, 3, etc.)
- Add positions within each shelf (01, 02, 03, etc.)
- Set physical dimensions if needed

**Step 5: Save**
- Review all information
- Click "Create Rack"

### 2. Managing Rack Layout

**Viewing Rack Layout:**
1. Go to Rack Management
2. Click the "View" (eye) icon on any rack
3. See visual representation of all positions
4. Color coding shows stock status:
   - Gray: Empty position
   - Green: Good stock
   - Yellow: Low stock
   - Red: Empty/Critical

**Assigning Medicines to Positions:**
1. In rack layout view, click on an empty position
2. Click "Assign Medicine"
3. Select medicine from dropdown
4. Enter quantities:
   - Strip Quantity: Number of strips/packs
   - Individual Quantity: Number of individual units
5. Set priority (Primary/Secondary/Overflow)
6. Add notes if needed
7. Click "Assign"

**Moving Medicines:**
1. Click on an occupied position
2. Click "Edit" in the popup
3. Select "Move to Different Location"
4. Choose new rack, shelf, and position
5. Provide reason for move
6. Confirm move

### 3. Inventory Integration

**Viewing Locations in Inventory:**
- The inventory page now shows rack locations for each medicine
- Multiple locations are displayed with quantities
- Click on location to view details

**Managing Unassigned Medicines:**
1. Go to Rack Management
2. Click "Medicine Location Search" tab
3. View "Unassigned Medicines" section
4. Assign locations to medicines without rack positions

### 4. Analytics and Reports

**Rack Occupancy:**
- View overall occupancy statistics
- See which racks are full or have available space
- Identify optimization opportunities

**Stock Distribution:**
- See how medicines are distributed across racks
- Identify medicines with multiple locations
- Track stock levels by location

---

## For Staff and Employees

### 1. Finding Medicine Locations

**Quick Search:**
1. Navigate to "Medicine Location Search"
2. Type medicine name, generic name, or barcode
3. View all locations where the medicine is stored
4. Note quantities at each location

**Search Tips:**
- Use partial names (e.g., "para" for "Paracetamol")
- Search by manufacturer name
- Use barcode scanner for quick lookup
- Search is case-insensitive

**Understanding Results:**
- Each medicine shows all its storage locations
- Locations are sorted by priority (Primary first)
- Stock status indicators:
  - ✅ Good Stock (Green)
  - ⏰ Low Stock (Yellow)
  - ❌ Empty/Critical (Red)

### 2. Reading Location Information

**Location Format:** `R001-2-05`
- R001: Rack number
- 2: Shelf number
- 05: Position number

**Stock Information:**
- **Strips**: Number of strips/packs available
- **Individual**: Number of individual units available
- **Priority**: Primary (main location) or Secondary (backup)

### 3. During Sales/Dispensing

**Finding Medicines Quickly:**
1. Search for the medicine
2. Go to the primary location first
3. If insufficient stock, check secondary locations
4. Note the exact quantities available

**Reporting Stock Issues:**
- If medicine is not found where indicated
- If quantities don't match the system
- If medicine appears to be expired or damaged
- Report to store manager for investigation

---

## Best Practices

### For Store Managers

**Rack Organization:**
1. **Group by Category**: Keep similar medicines together
2. **Frequency-Based**: Place frequently used medicines in easily accessible locations
3. **Temperature Requirements**: Use appropriate racks for temperature-sensitive medicines
4. **Security**: Store controlled substances in secure, restricted-access racks

**Location Assignment:**
1. **Primary Locations**: Assign one primary location per medicine
2. **Overflow Storage**: Use secondary locations for excess stock
3. **Regular Updates**: Keep quantities updated after purchases and sales
4. **Clear Labeling**: Use consistent naming conventions

**Maintenance:**
1. **Regular Audits**: Periodically verify physical stock matches system records
2. **Reorganization**: Reorganize racks based on usage patterns
3. **Capacity Planning**: Monitor occupancy levels and plan for expansion
4. **Staff Training**: Ensure all staff understand the location system

### For Staff

**Efficient Searching:**
1. **Learn Common Locations**: Memorize locations of frequently dispensed medicines
2. **Use Full Names**: Search using complete medicine names for better results
3. **Check Multiple Locations**: Always check if medicine has multiple storage locations
4. **Report Discrepancies**: Immediately report any location or quantity mismatches

**Stock Management:**
1. **FIFO Principle**: Use First In, First Out for medicines with expiry dates
2. **Quantity Awareness**: Be aware of remaining quantities when dispensing
3. **Low Stock Alerts**: Report when medicines are running low
4. **Proper Handling**: Follow proper procedures for different medicine categories

---

## Troubleshooting

### Common Issues

**Medicine Not Found in Search:**
- Check spelling of medicine name
- Try searching by generic name or manufacturer
- Verify the medicine exists in inventory
- Contact store manager if medicine should be available

**Location Shows Medicine But Physical Location is Empty:**
- Check nearby positions (might be misplaced)
- Verify you're looking at the correct rack/shelf/position
- Report discrepancy to store manager
- Check if medicine was recently moved

**Cannot Access Certain Racks:**
- Some racks have restricted access (Manager Only)
- Contact store manager for access to controlled substances
- Verify your user role permissions

**System Shows Wrong Quantities:**
- Physical count doesn't match system
- Report to store manager for stock adjustment
- May need inventory reconciliation

### Getting Help

**For Technical Issues:**
- Contact system administrator
- Check user permissions
- Verify internet connection
- Try refreshing the page

**For Operational Issues:**
- Consult store manager
- Review this user guide
- Check with experienced staff members
- Follow store's standard operating procedures

---

## Quick Reference

### Keyboard Shortcuts
- **Ctrl + F**: Quick search in medicine location search
- **Enter**: Submit search query
- **Esc**: Close modals/popups

### Color Codes
- **Green**: Good stock levels
- **Yellow**: Low stock warning
- **Red**: Empty or critical stock
- **Gray**: Empty position
- **Blue**: General information

### Priority Levels
- **Primary**: Main storage location (check first)
- **Secondary**: Alternative location (backup)
- **Overflow**: Temporary excess storage

### Access Levels
- **Public**: All staff can access
- **Restricted**: Limited staff access
- **Manager Only**: Store manager access only

---

## Support

For additional support or questions about the Rack Management System:

1. **User Guide**: Refer to this document
2. **Store Manager**: Contact your store manager
3. **Technical Support**: Contact system administrator
4. **Training**: Request additional training if needed

Remember: The Rack Management System is designed to improve efficiency and accuracy in medicine dispensing. Proper use of the system benefits both staff productivity and customer service.

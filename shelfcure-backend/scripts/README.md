# ShelfCure Demo Data Scripts

This directory contains scripts to populate the ShelfCure database with demo data for testing and demonstration purposes.

## Available Scripts

### 1. Main Database Seeding
```bash
npm run seed
```
**File:** `seedDatabase.js`
**Description:** Creates the complete initial database structure including:
- Admin user
- Subscription plans
- Sample stores with owners and managers
- Basic medicines
- Discount rules

### 2. Suppliers and Purchases Demo Data
```bash
npm run seed-suppliers
```
**File:** `seedSuppliersAndPurchases.js`
**Description:** Adds comprehensive supplier and purchase order demo data:
- 5 realistic suppliers with complete business information
- 5 purchase orders with different statuses (draft, shipped, completed, overdue)
- Various payment scenarios (paid, pending, partial, overdue)
- Realistic pricing, discounts, and tax calculations

### 3. Sales Demo Data
```bash
npm run seed-sales
```
**File:** `seedDemoSalesData.js`
**Description:** Creates demo sales data including:
- Customer records
- Doctor records
- Sales transactions with various scenarios
- Different payment methods and statuses

### 4. Clear All Demo Data
```bash
npm run clear-seed
```
**File:** `clearSeedData.js`
**Description:** Removes all seeded demo data from the database

## Demo Data Details

### Suppliers Created
1. **MediCorp Pharmaceuticals** (Mumbai)
   - Contact: Rajesh Kumar (+91-9876543210)
   - Payment Terms: 30 days
   - Credit Limit: ₹5,00,000
   - Primary supplier for general medicines

2. **HealthPlus Distributors** (Delhi)
   - Contact: Priya Sharma (+91-9876543211)
   - Payment Terms: 45 days
   - Credit Limit: ₹3,00,000
   - Specialized in cardiac and diabetic medicines

3. **Global Pharma Solutions** (Ahmedabad)
   - Contact: Amit Patel (+91-9876543212)
   - Payment Terms: 60 days
   - Credit Limit: ₹7,50,000
   - International brands and specialty medicines

4. **QuickMed Supplies** (Pune)
   - Contact: Sunita Joshi (+91-9876543213)
   - Payment Terms: 15 days
   - Credit Limit: ₹2,00,000
   - Fast delivery, emergency supplies

5. **BioMed Enterprises** (Bangalore)
   - Contact: Vikram Singh (+91-9876543214)
   - Payment Terms: 30 days
   - Credit Limit: ₹4,00,000
   - Biotechnology and advanced medicines

### Purchase Orders Created
1. **PO-2024-001** - ₹2,385.96 (Completed, Paid)
   - Supplier: MediCorp Pharmaceuticals
   - Status: Completed, inventory updated
   - Payment: Fully paid

2. **PO-2024-002** - ₹1,156.40 (Shipped, Pending Payment)
   - Supplier: HealthPlus Distributors
   - Status: Shipped, awaiting delivery
   - Payment: Pending

3. **PO-2024-003** - ₹4,655.10 (Draft)
   - Supplier: Global Pharma Solutions
   - Status: Draft, not yet ordered
   - Payment: Pending

4. **PO-2024-004** - ₹737.50 (Received, Partial Payment)
   - Supplier: QuickMed Supplies
   - Status: Received, inventory updated
   - Payment: ₹400 paid, ₹337.50 balance

5. **PO-2024-005** - ₹955.80 (Completed, Overdue)
   - Supplier: BioMed Enterprises
   - Status: Completed, inventory updated
   - Payment: Overdue by 5 days

## Login Credentials

### Store Manager Access
- **Email:** manager@some-pharmacy.com
- **Password:** manager123
- **Store:** Some (ST9508)

### Admin Access
- **Email:** admin@shelfcure.com
- **Password:** admin123

## Usage Instructions

1. **First Time Setup:**
   ```bash
   # Run the main seed script first
   npm run seed
   
   # Then add suppliers and purchases
   npm run seed-suppliers
   
   # Optionally add sales data
   npm run seed-sales
   ```

2. **Testing Supplier Requirements:**
   - Login as store manager
   - Navigate to Purchases → Create New Purchase Order
   - Try to create a purchase order without selecting a supplier (should show validation error)
   - Select a supplier from the dropdown and create the order successfully

3. **Testing Different Scenarios:**
   - View purchase orders with different statuses
   - Test payment tracking with various payment statuses
   - Explore supplier management features
   - Test purchase order workflows

## Important Notes

- **Prerequisites:** The main seed script (`npm run seed`) must be run first to create the basic database structure
- **Data Consistency:** All demo data is created for the "Some (ST9508)" store
- **Realistic Data:** All suppliers, purchase orders, and financial data use realistic Indian business scenarios
- **Testing Ready:** Data is designed to test all purchase order features including validation, workflows, and reporting

## Troubleshooting

### Common Issues

1. **"Demo store not found" Error:**
   - Run `npm run seed` first to create the basic database structure

2. **"Store manager not found" Error:**
   - Ensure the main seed script completed successfully
   - Check that the store manager was created properly

3. **Database Connection Issues:**
   - Verify your `.env` file has the correct `MONGODB_URI`
   - Ensure MongoDB is running

### Cleaning Up

To start fresh:
```bash
npm run clear-seed  # Remove all demo data
npm run seed        # Recreate basic structure
npm run seed-suppliers  # Add suppliers and purchases
```

## File Structure

```
scripts/
├── README.md                    # This file
├── seedDatabase.js             # Main database seeding
├── seedSuppliersAndPurchases.js # Suppliers and purchases demo data
├── seedDemoSalesData.js        # Sales demo data
├── clearSeedData.js            # Clean up script
└── seedRackData.js             # Rack management demo data
```

This demo data provides a comprehensive testing environment for the ShelfCure purchase management system with realistic business scenarios and proper validation testing.

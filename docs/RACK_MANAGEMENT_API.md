# Rack Management System API Documentation

## Overview

The Rack Management System provides comprehensive APIs for managing pharmacy rack layouts, medicine locations, and inventory organization. This system supports multi-location storage, visual rack layouts, and role-based access control.

## Authentication

All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Base URLs

- Store Manager APIs: `/api/store-manager`
- Staff APIs: `/api/medicine-locations`

## Role-Based Access

- **Store Manager**: Full access to all rack management features
- **Staff/Cashier**: Read-only access to medicine location search

---

## Rack Management APIs

### 1. Get All Racks

**GET** `/api/store-manager/racks`

Retrieve all racks for the authenticated store.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search by rack number, name, or description
- `category` (optional): Filter by rack category

**Response:**
```json
{
  "success": true,
  "count": 5,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  },
  "data": [
    {
      "_id": "rack_id",
      "rackNumber": "R001",
      "name": "Main Storage Rack",
      "description": "Primary storage for general medicines",
      "category": "general",
      "totalPositions": 30,
      "occupiedPositions": 15,
      "occupancyPercentage": 50,
      "location": {
        "zone": "Front Area",
        "floor": "Ground"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 2. Get Single Rack

**GET** `/api/store-manager/racks/:id`

Get detailed information about a specific rack.

**Response:**
```json
{
  "success": true,
  "data": {
    "rack": {
      "_id": "rack_id",
      "rackNumber": "R001",
      "name": "Main Storage Rack",
      "shelves": [
        {
          "shelfNumber": "1",
          "positions": [
            {
              "positionNumber": "01",
              "isOccupied": true,
              "width": 15,
              "height": 20
            }
          ]
        }
      ]
    },
    "locations": [
      {
        "_id": "location_id",
        "medicine": {
          "name": "Paracetamol",
          "manufacturer": "ABC Pharma"
        },
        "shelf": "1",
        "position": "01",
        "stripQuantity": 50,
        "individualQuantity": 200
      }
    ]
  }
}
```

### 3. Create Rack

**POST** `/api/store-manager/racks`

Create a new rack.

**Request Body:**
```json
{
  "rackNumber": "R002",
  "name": "Cold Storage Rack",
  "description": "Temperature controlled storage",
  "category": "refrigerated",
  "location": {
    "zone": "Cold Room",
    "floor": "Ground",
    "coordinates": { "x": 10, "y": 5 }
  },
  "specifications": {
    "material": "steel",
    "maxCapacity": 60,
    "specialConditions": ["refrigerated", "temperature_controlled"]
  },
  "accessLevel": "restricted",
  "shelves": [
    {
      "shelfNumber": "1",
      "positions": [
        {
          "positionNumber": "01",
          "width": 12,
          "height": 15,
          "maxWeight": 3
        }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Rack created successfully",
  "data": {
    "_id": "new_rack_id",
    "rackNumber": "R002",
    "name": "Cold Storage Rack"
  }
}
```

### 4. Update Rack

**PUT** `/api/store-manager/racks/:id`

Update an existing rack.

**Request Body:** Same as create rack (partial updates allowed)

### 5. Delete Rack

**DELETE** `/api/store-manager/racks/:id`

Soft delete a rack (sets isActive to false).

**Response:**
```json
{
  "success": true,
  "message": "Rack deleted successfully"
}
```

---

## Rack Layout APIs

### 1. Get Rack Layout

**GET** `/api/store-manager/rack-layout/:rackId`

Get visual layout of a rack with medicine assignments.

**Response:**
```json
{
  "success": true,
  "data": {
    "rack": {
      "id": "rack_id",
      "rackNumber": "R001",
      "name": "Main Storage Rack",
      "totalPositions": 30,
      "occupiedPositions": 15,
      "occupancyPercentage": 50
    },
    "layout": [
      {
        "shelfNumber": "1",
        "positions": [
          {
            "positionNumber": "01",
            "isOccupied": true,
            "medicine": {
              "id": "medicine_id",
              "name": "Paracetamol",
              "stripQuantity": 50,
              "individualQuantity": 200,
              "stockStatus": {
                "status": "good",
                "label": "Good Stock",
                "color": "green"
              },
              "priority": "primary"
            }
          }
        ]
      }
    ]
  }
}
```

### 2. Get Rack Occupancy Summary

**GET** `/api/store-manager/rack-occupancy`

Get occupancy statistics for all racks.

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRacks": 5,
      "totalPositions": 150,
      "occupiedPositions": 75,
      "availablePositions": 75,
      "overallOccupancy": 50
    },
    "racks": [
      {
        "rack": {
          "id": "rack_id",
          "rackNumber": "R001",
          "name": "Main Storage Rack"
        },
        "occupancy": {
          "totalPositions": 30,
          "occupiedPositions": 15,
          "occupancyPercentage": 50
        },
        "medicines": [
          {
            "id": "medicine_id",
            "name": "Paracetamol",
            "location": "1-01",
            "quantity": { "strips": 50, "individual": 200 }
          }
        ]
      }
    ]
  }
}
```

---

## Medicine Location Management APIs

### 1. Assign Medicine to Location

**POST** `/api/store-manager/rack-locations`

Assign a medicine to a specific rack location.

**Request Body:**
```json
{
  "medicineId": "medicine_id",
  "rackId": "rack_id",
  "shelf": "1",
  "position": "01",
  "stripQuantity": 50,
  "individualQuantity": 200,
  "priority": "primary",
  "notes": "Primary storage location"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Medicine assigned to rack location successfully",
  "data": {
    "_id": "location_id",
    "medicine": {
      "name": "Paracetamol"
    },
    "rack": {
      "rackNumber": "R001"
    },
    "shelf": "1",
    "position": "01",
    "stripQuantity": 50,
    "individualQuantity": 200,
    "stockStatus": {
      "status": "good",
      "label": "Good Stock"
    }
  }
}
```

### 2. Update Location Quantity

**PUT** `/api/store-manager/rack-locations/:id`

Update medicine quantity at a specific location.

**Request Body:**
```json
{
  "stripQuantity": 75,
  "individualQuantity": 300,
  "reason": "Stock replenishment",
  "notes": "Updated after purchase"
}
```

### 3. Move Medicine Location

**PUT** `/api/store-manager/rack-locations/:id/move`

Move medicine from one location to another.

**Request Body:**
```json
{
  "newRackId": "new_rack_id",
  "newShelf": "2",
  "newPosition": "05",
  "reason": "Reorganization"
}
```

### 4. Remove Medicine from Location

**DELETE** `/api/store-manager/rack-locations/:id`

Remove medicine from a rack location.

**Request Body:**
```json
{
  "reason": "Medicine discontinued"
}
```

---

## Medicine Location Search APIs

### 1. Search Medicine Locations

**GET** `/api/store-manager/medicine-locations/search` (Store Manager)
**GET** `/api/medicine-locations/search` (Staff)

Search for medicines and their rack locations.

**Query Parameters:**
- `query` (required): Search term (medicine name, generic name, manufacturer, barcode)
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "medicine": {
        "id": "medicine_id",
        "name": "Paracetamol",
        "genericName": "Acetaminophen",
        "manufacturer": "ABC Pharma",
        "category": "Tablet",
        "barcode": "1234567890",
        "totalStock": { "strips": 100, "individual": 500 }
      },
      "locations": [
        {
          "id": "location_id",
          "rack": {
            "id": "rack_id",
            "rackNumber": "R001",
            "name": "Main Storage Rack",
            "category": "general"
          },
          "shelf": "1",
          "position": "01",
          "locationString": "R001-1-01",
          "quantity": { "strips": 50, "individual": 200 },
          "stockStatus": {
            "status": "good",
            "label": "Good Stock",
            "color": "green"
          },
          "priority": "primary"
        }
      ],
      "totalLocations": 1,
      "totalRackStock": { "strips": 50, "individual": 200 }
    }
  ]
}
```

### 2. Get Medicine Locations

**GET** `/api/store-manager/medicine-locations/:medicineId`

Get all rack locations for a specific medicine.

**Response:**
```json
{
  "success": true,
  "data": {
    "medicine": {
      "id": "medicine_id",
      "name": "Paracetamol",
      "totalStock": { "strips": 100, "individual": 500 }
    },
    "locations": [
      {
        "id": "location_id",
        "rack": {
          "rackNumber": "R001",
          "name": "Main Storage Rack"
        },
        "locationString": "R001-1-01",
        "quantity": { "strips": 50, "individual": 200 },
        "stockStatus": { "status": "good", "label": "Good Stock" },
        "assignedDate": "2024-01-01T00:00:00.000Z"
      }
    ],
    "summary": {
      "totalLocations": 1,
      "totalRackStock": { "strips": 50, "individual": 200 },
      "primaryLocation": {
        "locationString": "R001-1-01"
      },
      "stockDiscrepancy": { "strips": 50, "individual": 300 }
    }
  }
}
```

### 3. Get Unassigned Medicines

**GET** `/api/store-manager/medicine-locations/unassigned`

Get medicines that don't have any rack locations assigned.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `category` (optional): Filter by medicine category

---

## Error Responses

All APIs return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"] // Optional
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## Data Models

### Rack Categories
- `general`: General purpose storage
- `refrigerated`: Temperature controlled storage
- `controlled_substances`: Secure storage for controlled medicines
- `otc`: Over-the-counter medicines
- `prescription`: Prescription medicines
- `surgical`: Surgical supplies
- `emergency`: Emergency medicines
- `expired`: Expired medicines
- `quarantine`: Quarantined medicines

### Access Levels
- `public`: Accessible to all staff
- `restricted`: Limited access
- `manager_only`: Store manager only

### Priority Levels
- `primary`: Main storage location
- `secondary`: Alternative location
- `overflow`: Overflow storage

### Stock Status
- `good`: Adequate stock
- `low`: Low stock warning
- `empty`: Out of stock

---

## Migration and Setup

### 1. Database Migration

Run the migration script to convert legacy storage locations:

```bash
node scripts/migrateRackSystem.js migrate
```

### 2. Seed Sample Data

Create sample racks and assignments for testing:

```bash
# Create sample racks
node scripts/seedRackData.js racks

# Create sample medicine assignments
node scripts/seedRackData.js assignments

# Create both racks and assignments
node scripts/seedRackData.js all
```

### 3. Cleanup

Remove seeded data:

```bash
node scripts/seedRackData.js cleanup
```

---

## Integration Examples

### Frontend Integration

```javascript
import { searchMedicineLocations } from '../services/rackService';

// Search for medicine locations
const searchResults = await searchMedicineLocations({
  query: 'paracetamol',
  limit: 10
});

// Display locations
searchResults.data.forEach(medicine => {
  console.log(`${medicine.medicine.name}:`);
  medicine.locations.forEach(location => {
    console.log(`  - ${location.locationString}: ${location.quantity.strips} strips`);
  });
});
```

### Inventory Integration

```javascript
// Show rack locations in inventory display
<MedicineLocationDisplay
  medicineId={medicine._id}
  compact={true}
  showQuantities={true}
  maxLocations={3}
/>
```

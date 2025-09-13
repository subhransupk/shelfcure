const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Rack = require('../models/Rack');
const RackLocation = require('../models/RackLocation');
const Medicine = require('../models/Medicine');
const Store = require('../models/Store');
const User = require('../models/User');

// Test database setup
const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/shelfcure_test';

describe('Rack Management System', () => {
  let storeManagerToken;
  let staffToken;
  let testStore;
  let testRack;
  let testMedicine;
  let storeManager;
  let staffUser;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create test store
    testStore = await Store.create({
      name: 'Test Pharmacy',
      code: 'TEST001',
      address: 'Test Address',
      phone: '1234567890',
      email: 'test@pharmacy.com',
      isActive: true
    });

    // Create test store manager
    storeManager = await User.create({
      name: 'Test Store Manager',
      email: 'manager@test.com',
      password: 'password123',
      role: 'store_manager',
      stores: [testStore._id],
      isActive: true
    });

    // Create test staff user
    staffUser = await User.create({
      name: 'Test Staff',
      email: 'staff@test.com',
      password: 'password123',
      role: 'staff',
      stores: [testStore._id],
      isActive: true
    });

    // Login to get tokens
    const managerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'manager@test.com',
        password: 'password123'
      });
    storeManagerToken = managerLogin.body.token;

    const staffLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'staff@test.com',
        password: 'password123'
      });
    staffToken = staffLogin.body.token;

    // Create test medicine
    testMedicine = await Medicine.create({
      name: 'Test Medicine',
      genericName: 'Test Generic',
      manufacturer: 'Test Manufacturer',
      category: 'Tablet',
      store: testStore._id,
      stripInfo: { stock: 100, price: 10 },
      individualInfo: { stock: 500, price: 2 },
      isActive: true
    });
  });

  afterAll(async () => {
    // Clean up test data
    await Rack.deleteMany({});
    await RackLocation.deleteMany({});
    await Medicine.deleteMany({});
    await User.deleteMany({});
    await Store.deleteMany({});
    
    // Close database connection
    await mongoose.connection.close();
  });

  describe('Rack CRUD Operations', () => {
    test('Store manager should be able to create a rack', async () => {
      const rackData = {
        rackNumber: 'R001',
        name: 'Test Rack',
        description: 'Test rack for unit testing',
        category: 'general',
        location: {
          zone: 'Test Zone',
          floor: 'Ground'
        },
        shelves: [
          {
            shelfNumber: '1',
            positions: [
              { positionNumber: '1' },
              { positionNumber: '2' }
            ]
          }
        ]
      };

      const response = await request(app)
        .post('/api/store-manager/racks')
        .set('Authorization', `Bearer ${storeManagerToken}`)
        .send(rackData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.rackNumber).toBe('R001');
      expect(response.body.data.name).toBe('Test Rack');

      testRack = response.body.data;
    });

    test('Staff should not be able to create a rack', async () => {
      const rackData = {
        rackNumber: 'R002',
        name: 'Unauthorized Rack',
        category: 'general'
      };

      const response = await request(app)
        .post('/api/store-manager/racks')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(rackData);

      expect(response.status).toBe(403);
    });

    test('Should get all racks for store manager', async () => {
      const response = await request(app)
        .get('/api/store-manager/racks')
        .set('Authorization', `Bearer ${storeManagerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].rackNumber).toBe('R001');
    });

    test('Should get single rack details', async () => {
      const response = await request(app)
        .get(`/api/store-manager/racks/${testRack._id}`)
        .set('Authorization', `Bearer ${storeManagerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.rack.rackNumber).toBe('R001');
    });

    test('Should update rack', async () => {
      const updateData = {
        name: 'Updated Test Rack',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/store-manager/racks/${testRack._id}`)
        .set('Authorization', `Bearer ${storeManagerToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Test Rack');
    });
  });

  describe('Medicine Location Management', () => {
    test('Should assign medicine to rack location', async () => {
      const locationData = {
        medicineId: testMedicine._id,
        rackId: testRack._id,
        shelf: '1',
        position: '1',
        stripQuantity: 50,
        individualQuantity: 200,
        priority: 'primary',
        notes: 'Test assignment'
      };

      const response = await request(app)
        .post('/api/store-manager/rack-locations')
        .set('Authorization', `Bearer ${storeManagerToken}`)
        .send(locationData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stripQuantity).toBe(50);
      expect(response.body.data.individualQuantity).toBe(200);
    });

    test('Should not allow duplicate medicine assignment to same position', async () => {
      const locationData = {
        medicineId: testMedicine._id,
        rackId: testRack._id,
        shelf: '1',
        position: '1',
        stripQuantity: 25,
        individualQuantity: 100
      };

      const response = await request(app)
        .post('/api/store-manager/rack-locations')
        .set('Authorization', `Bearer ${storeManagerToken}`)
        .send(locationData);

      expect(response.status).toBe(200); // Should update existing location
      expect(response.body.data.stripQuantity).toBe(25);
    });

    test('Should get rack layout', async () => {
      const response = await request(app)
        .get(`/api/store-manager/rack-layout/${testRack._id}`)
        .set('Authorization', `Bearer ${storeManagerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.rack.rackNumber).toBe('R001');
      expect(response.body.data.layout).toHaveLength(1);
      expect(response.body.data.layout[0].positions[0].isOccupied).toBe(true);
    });
  });

  describe('Medicine Location Search', () => {
    test('Store manager should be able to search medicine locations', async () => {
      const response = await request(app)
        .get('/api/store-manager/medicine-locations/search')
        .query({ query: 'Test Medicine' })
        .set('Authorization', `Bearer ${storeManagerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].medicine.name).toBe('Test Medicine');
      expect(response.body.data[0].locations).toHaveLength(1);
    });

    test('Staff should be able to search medicine locations (read-only)', async () => {
      const response = await request(app)
        .get('/api/medicine-locations/search')
        .query({ query: 'Test Medicine' })
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    test('Should get specific medicine locations', async () => {
      const response = await request(app)
        .get(`/api/store-manager/medicine-locations/${testMedicine._id}`)
        .set('Authorization', `Bearer ${storeManagerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.medicine.name).toBe('Test Medicine');
      expect(response.body.data.locations).toHaveLength(1);
    });
  });

  describe('Rack Occupancy and Analytics', () => {
    test('Should get rack occupancy summary', async () => {
      const response = await request(app)
        .get('/api/store-manager/rack-occupancy')
        .set('Authorization', `Bearer ${storeManagerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.totalRacks).toBe(1);
      expect(response.body.data.summary.occupiedPositions).toBe(1);
      expect(response.body.data.racks).toHaveLength(1);
    });

    test('Should get unassigned medicines', async () => {
      // Create another medicine without location
      const unassignedMedicine = await Medicine.create({
        name: 'Unassigned Medicine',
        genericName: 'Unassigned Generic',
        manufacturer: 'Test Manufacturer',
        category: 'Tablet',
        store: testStore._id,
        stripInfo: { stock: 50, price: 5 },
        isActive: true
      });

      const response = await request(app)
        .get('/api/store-manager/medicine-locations/unassigned')
        .set('Authorization', `Bearer ${storeManagerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Clean up
      await Medicine.findByIdAndDelete(unassignedMedicine._id);
    });
  });

  describe('Error Handling', () => {
    test('Should handle invalid rack ID', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/store-manager/racks/${invalidId}`)
        .set('Authorization', `Bearer ${storeManagerToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('Should handle invalid medicine assignment', async () => {
      const invalidMedicineId = new mongoose.Types.ObjectId();
      
      const locationData = {
        medicineId: invalidMedicineId,
        rackId: testRack._id,
        shelf: '1',
        position: '2',
        stripQuantity: 10,
        individualQuantity: 50
      };

      const response = await request(app)
        .post('/api/store-manager/rack-locations')
        .set('Authorization', `Bearer ${storeManagerToken}`)
        .send(locationData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Medicine not found');
    });

    test('Should handle unauthorized access', async () => {
      const response = await request(app)
        .get('/api/store-manager/racks')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
    });
  });

  describe('Data Validation', () => {
    test('Should validate required fields when creating rack', async () => {
      const invalidRackData = {
        // Missing required fields
        description: 'Invalid rack'
      };

      const response = await request(app)
        .post('/api/store-manager/racks')
        .set('Authorization', `Bearer ${storeManagerToken}`)
        .send(invalidRackData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Should prevent duplicate rack numbers', async () => {
      const duplicateRackData = {
        rackNumber: 'R001', // Same as existing rack
        name: 'Duplicate Rack',
        category: 'general',
        shelves: [
          {
            shelfNumber: '1',
            positions: [{ positionNumber: '1' }]
          }
        ]
      };

      const response = await request(app)
        .post('/api/store-manager/racks')
        .set('Authorization', `Bearer ${storeManagerToken}`)
        .send(duplicateRackData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });
});

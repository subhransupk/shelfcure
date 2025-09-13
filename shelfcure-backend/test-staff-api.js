require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Store = require('./models/Store');
const Staff = require('./models/Staff');

// Import the controller function
const { getStaff } = require('./controllers/storeManagerStaffController');

const testStaffAPI = async () => {
  try {
    console.log('🧪 Testing Staff API...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Find the store manager
    const storeManager = await User.findOne({ role: 'store_manager' }).populate('currentStore');
    if (!storeManager) {
      console.log('❌ No store manager found');
      return;
    }
    
    console.log(`👤 Found store manager: ${storeManager.name} (${storeManager.email})`);
    console.log(`🏪 Assigned to store: ${storeManager.currentStore?.name || 'No store'}\n`);
    
    // Mock request and response objects
    const mockReq = {
      user: storeManager,
      store: storeManager.currentStore,
      query: {
        page: 1,
        limit: 20
      }
    };
    
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`📡 API Response (${code}):`, JSON.stringify(data, null, 2));
          return data;
        }
      })
    };
    
    // Test the getStaff function
    console.log('🔍 Testing getStaff API function...');
    
    // Manually call the staff query logic
    const storeId = storeManager.currentStore._id;
    const query = { store: storeId };
    
    console.log('🔍 Query used:', JSON.stringify(query));
    
    const staff = await Staff.find(query)
      .sort({ name: 1 })
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');
    
    const total = await Staff.countDocuments(query);
    
    console.log(`📊 Direct query results:`);
    console.log(`  - Total staff found: ${total}`);
    console.log(`  - Staff returned: ${staff.length}`);
    
    staff.forEach(member => {
      console.log(`  - ${member.name} (${member.role}) - Status: ${member.status} - Email: ${member.email}`);
    });
    
    // Test the actual API function
    console.log('\n🎯 Testing actual API function...');
    try {
      await getStaff(mockReq, mockRes);
    } catch (error) {
      console.error('❌ API function error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📴 Disconnected from MongoDB');
  }
};

testStaffAPI();

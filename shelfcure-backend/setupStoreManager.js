const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Store = require('./models/Store');

async function setupStoreManager() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find the store manager
    const storeManager = await User.findOne({ email: 'manager@shelfcure.com' });
    if (!storeManager) {
      console.log('Store manager not found');
      return;
    }
    
    console.log('Found store manager:', storeManager.name, storeManager.email);
    
    // Find an active store to associate with
    const store = await Store.findOne({ isActive: true }).populate('owner', 'name email');
    if (!store) {
      console.log('No active store found');
      return;
    }
    
    console.log('Found store:', store.name, 'Owner:', store.owner?.name);
    
    // Update store manager with store association
    storeManager.stores = [store._id];
    storeManager.currentStore = store._id;
    await storeManager.save();
    
    // Add store manager to store's staff array if not already there
    const existingStaff = store.staff.find(s => s.user.toString() === storeManager._id.toString());
    if (!existingStaff) {
      store.staff.push({
        user: storeManager._id,
        role: 'store_manager',
        joinDate: new Date(),
        isActive: true
      });
      await store.save();
      console.log('Added store manager to store staff');
    } else {
      console.log('Store manager already in store staff');
    }
    
    console.log('Store manager setup complete');
    console.log('Manager stores:', storeManager.stores);
    console.log('Current store:', storeManager.currentStore);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setupStoreManager();

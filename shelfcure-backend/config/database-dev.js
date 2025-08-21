const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

const connectDB = async () => {
  try {
    // Check if we should use MongoDB Atlas or local memory server
    if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('mongodb+srv')) {
      // Try MongoDB Atlas first
      try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
        return;
      } catch (atlasError) {
        console.log('⚠️ MongoDB Atlas connection failed, falling back to in-memory database...');
        console.log('Atlas Error:', atlasError.message);
      }
    }

    // Fallback to MongoDB Memory Server for development
    console.log('🚀 Starting MongoDB Memory Server...');
    mongod = await MongoMemoryServer.create({
      instance: {
        dbName: 'shelfcure-dev'
      },
      binary: {
        downloadDir: './mongodb-binaries',
        version: '6.0.4'
      }
    });

    const uri = mongod.getUri();
    console.log(`📍 Memory Server URI: ${uri}`);

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Memory Server Connected: ${conn.connection.host}`);
    console.log(`🗄️ Database: ${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      if (mongod) {
        await mongod.stop();
        console.log('📴 MongoDB Memory Server stopped');
      }
      console.log('📴 MongoDB connection closed through app termination');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await mongoose.connection.close();
      if (mongod) {
        await mongod.stop();
        console.log('📴 MongoDB Memory Server stopped');
      }
      console.log('📴 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

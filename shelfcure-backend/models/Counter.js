const mongoose = require('mongoose');

/**
 * Counter Schema for generating unique sequential numbers
 * Used for return numbers, invoice numbers, etc.
 */
const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  sequence: {
    type: Number,
    default: 0,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update the updatedAt field on save
counterSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get next sequence number
counterSchema.statics.getNextSequence = async function(counterId, description = '') {
  try {
    const counter = await this.findOneAndUpdate(
      { _id: counterId },
      { 
        $inc: { sequence: 1 },
        $set: { 
          description: description,
          updatedAt: new Date()
        }
      },
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true
      }
    );
    
    return counter.sequence;
  } catch (error) {
    console.error('Error getting next sequence:', error);
    throw error;
  }
};

// Static method to reset counter
counterSchema.statics.resetCounter = async function(counterId) {
  try {
    await this.findOneAndUpdate(
      { _id: counterId },
      { 
        $set: { 
          sequence: 0,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    return true;
  } catch (error) {
    console.error('Error resetting counter:', error);
    throw error;
  }
};

// Static method to get current sequence without incrementing
counterSchema.statics.getCurrentSequence = async function(counterId) {
  try {
    const counter = await this.findById(counterId);
    return counter ? counter.sequence : 0;
  } catch (error) {
    console.error('Error getting current sequence:', error);
    return 0;
  }
};

module.exports = mongoose.model('Counter', counterSchema);

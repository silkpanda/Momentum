const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  familyId: {
    type: Schema.Types.ObjectId,
    ref: 'family' 
  },
  // --- NEW: Add User Role ---
  role: {
    type: String,
    enum: ['Parent', 'Child'], // Defines the possible roles
    default: 'Child'          // Default new users to 'Child'
  },
  // --- END NEW ---
  points: {
    type: Number,
    default: 0
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  lastCompletedDate: {
    type: Date
  },
  level: {
    type: Number,
    default: 1
  },
  xp: {
    type: Number,
    default: 0
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('user', UserSchema);

module.exports = {
    User
};
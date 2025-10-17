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
  // --- NEW: Add a secure password field ---
  password: {
    type: String,
    required: true
  },
  // Gamification fields remain unchanged
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
  // Add a timestamp for when the user is created
  date: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('user', UserSchema);

// The getTestUser function is now obsolete and has been removed.

module.exports = {
    User
};
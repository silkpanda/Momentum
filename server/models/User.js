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
  // --- NEW FIELD ---
  // This links the user to their family group.
  familyId: {
    type: Schema.Types.ObjectId,
    ref: 'family',
    default: null // Will be set during registration
  },

  // Gamification fields remain
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
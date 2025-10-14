// server/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // We will add more fields like name and email later
  points: {
    type: Number,
    default: 0
  },
  streak: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
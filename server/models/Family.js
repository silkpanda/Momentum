const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// This is the foundational model for grouping users.
const FamilySchema = new Schema({
  name: {
    type: String,
    // A family name is not required on creation,
    // but can be added later (e.g., "The Smith Family")
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Family = mongoose.model('family', FamilySchema);

module.exports = {
    Family
};
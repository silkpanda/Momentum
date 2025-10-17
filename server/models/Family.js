const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FamilySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: 'user',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Family = mongoose.model('family', FamilySchema);

module.exports = {
  Family,
};
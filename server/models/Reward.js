const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RewardSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  pointCost: {
    type: Number,
    required: true,
    min: 0
  },
  familyId: {
    type: Schema.Types.ObjectId,
    ref: 'family',
    required: true
  },
  // Tracks who created the reward (Parent role required)
  createdBy: {
     type: Schema.Types.ObjectId,
     ref: 'user',
     required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Reward = mongoose.model('reward', RewardSchema);

module.exports = {
    Reward
};
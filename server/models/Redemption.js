const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RedemptionSchema = new Schema({
  userId: { // User who redeemed the reward
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  rewardId: { // ID of the reward redeemed
    type: Schema.Types.ObjectId,
    ref: 'reward',
    required: true
  },
  rewardName: { // Name of the reward at the time of redemption
    type: String,
    required: true
  },
  pointCost: { // Point cost at the time of redemption
    type: Number,
    required: true
  },
  familyId: {
    type: Schema.Types.ObjectId,
    ref: 'family',
    required: true
  },
  timestamp: { // When the redemption occurred
    type: Date,
    default: Date.now
  }
});

const Redemption = mongoose.model('redemption', RedemptionSchema);

module.exports = {
    Redemption
};
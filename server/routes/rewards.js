const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); 
const isParent = require('../middleware/isParent');
const { Reward } = require('../models/Reward');
const { User } = require('../models/User');

// @route   POST api/rewards
// @desc    Create a new reward (Parent Only)
// @access  Private (Parent)
router.post('/', [auth, isParent], async (req, res) => {
  const { name, pointCost } = req.body;

  if (!name || pointCost === undefined) {
    return res.status(400).json({ msg: 'Please provide a name and point cost' });
  }
  
  if (isNaN(pointCost) || Number(pointCost) < 0) {
     return res.status(400).json({ msg: 'Point cost must be a positive number' });
  }

  try {
    const newReward = new Reward({
      name,
      pointCost: Number(pointCost),
      familyId: req.user.familyId,
      createdBy: req.user.id
    });

    const reward = await newReward.save();
    res.json(reward);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/rewards
// @desc    Get all rewards for the family
// @access  Private (Auth)
router.get('/', auth, async (req, res) => {
  try {
    const rewards = await Reward.find({ familyId: req.user.familyId }).sort({ pointCost: 1 });
    res.json(rewards);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/rewards/:id
// @desc    Update a reward (Parent Only)
// @access  Private (Parent)
router.put('/:id', [auth, isParent], async (req, res) => {
  const { name, pointCost } = req.body;

  try {
    let reward = await Reward.findOne({ _id: req.params.id, familyId: req.user.familyId });
    if (!reward) return res.status(404).json({ msg: 'Reward not found' });

    if (name) reward.name = name;
    if (pointCost !== undefined) {
       if (isNaN(pointCost) || Number(pointCost) < 0) {
         return res.status(400).json({ msg: 'Point cost must be a positive number' });
       }
       reward.pointCost = Number(pointCost);
    }
    
    await reward.save();
    res.json(reward);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/rewards/:id
// @desc    Delete a reward (Parent Only)
// @access  Private (Parent)
router.delete('/:id', [auth, isParent], async (req, res) => {
  try {
    const reward = await Reward.findOne({ _id: req.params.id, familyId: req.user.familyId });
    if (!reward) return res.status(404).json({ msg: 'Reward not found' });

    await reward.deleteOne();
    res.json({ msg: 'Reward removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/rewards/:id/redeem
// @desc    Redeem a reward (Auth)
// @access  Private (Auth)
router.post('/:id/redeem', auth, async (req, res) => {
  try {
    // Find the reward
    const reward = await Reward.findOne({ _id: req.params.id, familyId: req.user.familyId });
    if (!reward) return res.status(404).json({ msg: 'Reward not found' });

    // Find the user who is redeeming
    // We use req.user (from auth middleware) to get the user document
    const user = req.user; 
    
    // Check if user has enough points
    if (user.points < reward.pointCost) {
      return res.status(400).json({ msg: 'You do not have enough points to redeem this reward' });
    }

    // Subtract points
    user.points -= reward.pointCost;
    await user.save();

    // We can add a "Redemption" record here in the future if needed
    res.json({ msg: `Reward '${reward.name}' redeemed! ${reward.pointCost} points deducted.`, userPoints: user.points });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
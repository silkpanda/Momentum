const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isParent = require('../middleware/isParent');
const { Reward } = require('../models/Reward');
const { User } = require('../models/User');

// POST /api/rewards (Create Reward - Parent Only) - No changes
router.post('/', [auth, isParent], async (req, res) => {
  // ... existing code ...
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

// GET /api/rewards (Get all rewards for family) - No changes
router.get('/', auth, async (req, res) => {
  // ... existing code ...
  try {
    const rewards = await Reward.find({ familyId: req.user.familyId }).sort({ pointCost: 1 });
    res.json(rewards);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT /api/rewards/:id (Update Reward - Parent Only) - No changes
router.put('/:id', [auth, isParent], async (req, res) => {
  // ... existing code ...
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

// DELETE /api/rewards/:id (Delete Reward - Parent Only) - No changes
router.delete('/:id', [auth, isParent], async (req, res) => {
  // ... existing code ...
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

// --- MODIFIED ENDPOINT ---
// @route   POST api/rewards/:id/redeem
// @desc    Redeem a reward (Auth - uses userId from body)
// @access  Private (Auth)
router.post('/:id/redeem', auth, async (req, res) => {
  try {
    // --- Get userId from request body ---
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ msg: 'User ID is required for redemption' });
    }

    // Find the reward (ensure it belongs to the parent's family)
    const reward = await Reward.findOne({ _id: req.params.id, familyId: req.user.familyId });
    if (!reward) return res.status(404).json({ msg: 'Reward not found' });

    // --- Find the user specified in the body ---
    const userToRedeem = await User.findById(userId);
    if (!userToRedeem) {
        return res.status(404).json({ msg: 'User specified for redemption not found' });
    }

    // --- Ensure the specified user is in the same family as the authenticated user ---
    if (!userToRedeem.familyId || !userToRedeem.familyId.equals(req.user.familyId)) {
        return res.status(403).json({ msg: 'User is not in the correct family' });
    }

    // --- Check points of the specified user ---
    if (userToRedeem.points < reward.pointCost) {
      return res.status(400).json({ msg: 'You do not have enough points to redeem this reward' });
    }

    // --- Subtract points from the specified user ---
    userToRedeem.points -= reward.pointCost;
    await userToRedeem.save();

    res.json({ msg: `Reward '${reward.name}' redeemed! ${reward.pointCost} points deducted.`, userPoints: userToRedeem.points });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
// --- END MODIFICATION ---

module.exports = router;
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isParent = require('../middleware/isParent');
const { Redemption } = require('../models/Redemption');
const { User } = require('../models/User'); // Needed to populate user names

// @route   GET api/redemptions
// @desc    Get all redemptions for the family (Parent Only)
// @access  Private (Parent)
router.get('/', [auth, isParent], async (req, res) => {
  try {
    const redemptions = await Redemption.find({ familyId: req.user.familyId })
      .populate('userId', 'name') // Fetch the 'name' field from the referenced User document
      .sort({ timestamp: -1 }); // Sort by newest first

    res.json(redemptions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
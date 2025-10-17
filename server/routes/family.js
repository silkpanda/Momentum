const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { User } = require('../models/User');

// @route   POST api/family/invite
// @desc    Invite a user (by email) to your family
// @access  Private
router.post('/invite', auth, async (req, res) => {
  const { email } = req.body;
  const invitingUserFamilyId = req.user.familyId;

  if (!email) {
    return res.status(400).json({ msg: 'Please provide an email address' });
  }
  
  if (!invitingUserFamilyId) {
     return res.status(400).json({ msg: 'Inviting user does not have a family' });
  }

  try {
    // Find the user to invite
    const targetUser = await User.findOne({ email });
    if (!targetUser) {
      return res.status(404).json({ msg: 'User not found with that email' });
    }

    // Check if the user is already in a family
    if (targetUser.familyId) {
       if (targetUser.familyId.equals(invitingUserFamilyId)) {
           return res.status(400).json({ msg: 'User is already in your family' });
       } else {
           return res.status(400).json({ msg: 'User is already in another family' });
       }
    }

    // Add user to the family
    targetUser.familyId = invitingUserFamilyId;
    await targetUser.save();

    res.json({ msg: `${targetUser.name} has been added to your family.` });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
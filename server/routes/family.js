const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const isParent = require('../middleware/isParent');
const { User } = require('../models/User');

// --- NEW ENDPOINT ---
// @route   GET api/family/members
// @desc    Get all users in the logged-in user's family
// @access  Private (Auth)
router.get('/members', auth, async (req, res) => {
  try {
    if (!req.user.familyId) {
      return res.status(400).json({ msg: 'User is not part of a family' });
    }
    // Find all users with the same familyId, select only public-safe fields
    const members = await User.find({ familyId: req.user.familyId })
                              .select('-password')
                              .sort({ role: 1, name: 1 }); // Parents first, then by name
    res.json(members);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
// --- END NEW ENDPOINT ---

// @route   POST api/family/invite
// @desc    Invite an existing user (by email) to your family
// @access  Private (Parent-only)
router.post('/invite', [auth, isParent], async (req, res) => {
  const { email } = req.body;
  const invitingUserFamilyId = req.user.familyId;

  if (!email) {
    return res.status(400).json({ msg: 'Please provide an email address' });
  }
  if (!invitingUserFamilyId) {
     return res.status(400).json({ msg: 'Inviting user does not have a family' });
  }

  try {
    const targetUser = await User.findOne({ email });
    if (!targetUser) {
      return res.status(404).json({ msg: 'User not found with that email' });
    }
    if (targetUser.familyId) {
       if (targetUser.familyId.equals(invitingUserFamilyId)) {
           return res.status(400).json({ msg: 'User is already in your family' });
       } else {
           return res.status(400).json({ msg: 'User is already in another family' });
       }
    }
    targetUser.familyId = invitingUserFamilyId;
    await targetUser.save();
    res.json({ msg: `${targetUser.name} has been added to your family.` });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/family/add-child
// @desc    Create a new 'Child' user within the parent's family
// @access  Private (Parent-only)
router.post('/add-child', [auth, isParent], async (req, res) => {
  const { name, password } = req.body;
  const parentFamilyId = req.user.familyId;

  if (!name || !password) {
    return res.status(400).json({ msg: 'Please provide a name and password' });
  }

  try {
    const internalEmail = `${name.toLowerCase().replace(/\s+/g, '-')}.${parentFamilyId}@momentum.internal`;

    let user = await User.findOne({ email: internalEmail });
    if (user) {
      return res.status(400).json({ msg: 'A user with this name already exists in the family' });
    }

    user = new User({
      name,
      email: internalEmail,
      password,
      familyId: parentFamilyId,
      role: 'Child'
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    res.json({ msg: `${name} has been added to the family as a 'Child'.` });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
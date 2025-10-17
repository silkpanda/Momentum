const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const dotenv = require('dotenv'); // REMOVE THIS
const auth = require('../middleware/auth');
const { User } = require('../models/User');
const { Family } = require('../models/Family');

// dotenv.config(); // REMOVE THIS

// @route   POST api/users/register
router.post('/register', async (req, res) => {
  // ... (Registration logic remains unchanged) ...
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) return res.status(400).json({ msg: 'Please enter all fields' });
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });
    user = new User({ name, email, password });
    const newFamily = new Family({ name: `${name}'s Family`, members: [user._id] });
    user.familyId = newFamily._id;
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await Promise.all([ user.save(), newFamily.save() ]);
    const payload = { user: { id: user.id } };
    jwt.sign( payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('Error in user registration:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/users/login
router.post('/login', async (req, res) => {
  // ... (Login logic remains unchanged) ...
  const { email, password } = req.body;
  try {
    if (!email || !password) return res.status(400).json({ msg: 'Please enter all fields' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
    const payload = { user: { id: user.id } };
    jwt.sign( payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('Error in user login:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/me
router.get('/me', auth, async (req, res) => {
  // ... (GET /me logic remains unchanged) ...
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
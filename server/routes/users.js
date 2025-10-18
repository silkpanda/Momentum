console.log('[AXIOM_LOG] Loading server/routes/users.js...');

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const auth = require('../middleware/auth');
const { default: mongoose } = require('mongoose');

// --- Diagnostic Logging for Model Imports ---
console.log('[AXIOM_LOG] Importing User model...');
let User;
try {
  User = require('../models/User').User;
  console.log('[AXIOM_LOG] SUCCESS: User model imported.');
} catch (e) {
  console.error('[AXIOM_FATAL] FAILED to import User model:', e);
}

console.log('[AXIOM_LOG] Importing Family model...');
let Family;
try {
  Family = require('../models/Family').Family;
  console.log('[AXIOM_LOG] SUCCESS: Family model imported.');
} catch (e) {
  console.error('[AXIOM_FATAL] FAILED to import Family model:', e);
}
// --- End Diagnostic Logging ---

dotenv.config();

// @route   POST api/users/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  console.log('[AXIOM_LOG] Endpoint HIT: POST /api/users/register');
  const { name, email, password } = req.body;
  console.log(`[AXIOM_LOG] Registration attempt for email: ${email}`);

  if (!Family) {
    console.error('[AXIOM_ERROR] CRITICAL: Family model is not loaded. Cannot proceed.');
    return res.status(500).send('Server configuration error.');
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  console.log('[AXIOM_LOG] Transaction started.');
  
  try {
    let user = await User.findOne({ email }).session(session);
    if (user) {
      console.log('[AXIOM_LOG] User already exists.');
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: 'User already exists' });
    }

    console.log('[AXIOM_LOG] 1. Creating new Family...');
    const newFamily = new Family();
    const family = await newFamily.save({ session });

    console.log('[AXIOM_LOG] 2. Creating new User...');
    user = new User({
      name,
      email,
      password,
      familyId: family._id, 
      role: 'Parent'        
    });

    console.log('[AXIOM_LOG] 3. Hashing password...');
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    console.log('[AXIOM_LOG] 4. Saving User...');
    await user.save({ session });
    
    console.log('[AXIOM_LOG] 5. Committing transaction...');
    await session.commitTransaction();
    session.endSession();
    console.log('[AXIOM_LOG] SUCCESS: Registration complete.');

    const payload = { user: { id: user.id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('[AXIOM_ERROR] Crash in /register endpoint:', err.message);
    console.error(err); // Log the full stack trace
    await session.abortTransaction();
    session.endSession();
    res.status(500).send('Server error');
  }
});

// @route   POST api/users/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  console.log('[AXIOM_LOG] Endpoint HIT: POST /api/users/login');
  const { email, password } = req.body;
  console.log(`[AXIOM_LOG] Login attempt for email: ${email}`);
  
  try {
    let user = await User.findOne({ email });
    if (!user) {
      console.log('[AXIOM_LOG] Login failed: User not found.');
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('[AXIOM_LOG] Login failed: Password mismatch.');
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }
    
    console.log('[AXIOM_LOG] SUCCESS: Login successful.');
    const payload = { user: { id: user.id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('[AXIOM_ERROR] Crash in /login endpoint:', err.message);
    console.error(err);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/me
// @desc    Get user data
// @access  Private
router.get('/me', auth, async (req, res) => {
  console.log('[AXIOM_LOG] Endpoint HIT: GET /api/users/me');
  try {
    res.json(req.user);
  } catch (err) {
    console.error('[AXIOM_ERROR] Crash in /me endpoint:', err.message);
    res.status(500).send('Server Error');
  }
});

console.log('[AXIOM_LOG] server/routes/users.js loaded and routes defined.');
module.exports = router;
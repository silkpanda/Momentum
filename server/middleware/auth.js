const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { User } = require('../models/User'); // Import User model

dotenv.config();

module.exports = async function (req, res, next) {
  // Get token from the header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // --- MODIFICATION ---
    // The token payload only has the user ID.
    // We must fetch the user from the DB to get their familyId.
    const user = await User.findById(decoded.user.id).select('-password');

    if (!user) {
      return res.status(401).json({ msg: 'User not found, authorization denied' });
    }

    // Attach the full user object (including familyId) to the request
    req.user = user; 
    // --- END MODIFICATION ---

    next(); // Proceed to the protected route
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
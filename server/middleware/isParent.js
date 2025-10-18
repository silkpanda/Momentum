// This middleware checks if the authenticated user has the 'Parent' role.
// It should be placed *after* the 'auth' middleware in the route definition.
module.exports = function (req, res, next) {
  // req.user is populated by the 'auth' middleware
  if (!req.user || req.user.role !== 'Parent') {
    return res.status(403).json({ msg: 'Access denied. Parent role required.' });
  }
  next();
};
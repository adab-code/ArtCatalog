// Authentication / authorization middleware used to protect routes.
// req.isAuthenticated() and req.user are populated by passport-session when
// the request carries a valid session cookie.

/**
 * Allows the request only if a user is logged in.
 * Returns 401 otherwise.
 */
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized: you must be logged in' });
}

/**
 * Allows the request only for the resource owner or an admin.
 * Returns 401 if not logged in and 403 if the user is another regular user.
 */
function isOwnerOrAdmin(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized: you must be logged in' });
  }
  if (req.user.role === 'admin') {
    return next();
  }
  // The :id route parameter must match the id of the logged-in user.
  if (String(req.user._id) === req.params.id) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: you do not have permission' });
}

/**
 * Allows the request only for users with the admin role.
 * Returns 401 if not logged in and 403 otherwise.
 */
function isAdmin(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized: you must be logged in' });
  }
  if (req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: admin access required' });
}

module.exports = { isAuthenticated, isOwnerOrAdmin, isAdmin };
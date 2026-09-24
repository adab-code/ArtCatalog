// Authentication controller.
// Handles the responses produced by the passport GitHub flow, logout, and the
// current authentication status. req.user is populated by passport-session.

/** Called after a successful GitHub OAuth, returns the logged-in user. */
function authSuccess(req, res) {
  res.status(200).json({ message: 'Authentication successful', user: req.user });
}

/** Called when GitHub OAuth fails. */
function authFailure(req, res) {
  res.status(401).json({ message: 'Authentication failed' });
}

/** Ends the session and clears the session cookie. */
function logout(req, res, next) {
  // passport removes the user from the session.
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        return next(destroyErr);
      }
      res.clearCookie('connect.sid');
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });
}

/** Reports whether there is a logged-in user and returns it when present. */
function status(req, res) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.status(200).json({ authenticated: true, user: req.user });
  }
  res.status(200).json({ authenticated: false, user: null });
}

module.exports = { authSuccess, authFailure, logout, status };
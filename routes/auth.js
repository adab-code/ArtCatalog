// Authentication routes (GitHub OAuth2 + session helpers).
// /github starts the OAuth flow, /github/callback receives the redirect from
// GitHub, and /me is used by a frontend to read the login state.

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const passport = require('passport');

// Start the GitHub OAuth flow (redirects the user to GitHub).
router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email'] })
);
// GitHub redirects here after a successful (or failed) login.
router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: '/api/auth/login/failed' }),
  authController.authSuccess
);
// Handles the failure case after OAuth.
router.get('/login/failed', authController.authFailure);
// Development-only login helper (until GitHub OAuth is configured in .env).
// Mounted only in development so it never exists in production.
if (process.env.NODE_ENV === 'development') {
  router.get('/dev-login', authController.devLogin);
}
// Ends the current session.
router.get('/logout', authController.logout);
// "Who am I": 200 with the user if logged in, 401 otherwise.
router.get('/me', authController.me);

module.exports = router;
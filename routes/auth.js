// Authentication routes (GitHub OAuth2 + session status).
// /github starts the OAuth flow, /github/callback receives the redirect from
// GitHub, and the remaining routes handle failure, logout, and status.

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
// Ends the current session.
router.get('/logout', authController.logout);
// Reports the current authentication status.
router.get('/status', authController.status);

module.exports = router;
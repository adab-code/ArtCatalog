// Authentication routes (session helpers).
// The actual OAuth flow (/login, /github/callback, /logout) lives in
// routes/index.js because the GitHub OAuth App callback URL is fixed to
// http://localhost:3000/github/callback.

const express = require('express');
const router = express.Router();

// "Who am I": 200 with the user if logged in, 401 otherwise.
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// Handles the failure case after OAuth (referenced by the callback redirect).
router.get('/login/failed', (req, res) => {
  res.status(401).json({ message: 'GitHub login failed' });
});

module.exports = router;
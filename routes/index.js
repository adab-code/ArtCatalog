// Central router.

const express = require('express');
const router = express.Router();
const passport = require('passport');

// Swagger UI at /api-docs.
router.use('/api-docs', require('./swagger'));

// Root endpoint.
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the ArtCatalog API',
    docs: `${process.env.BASE_URL ||
      'http://localhost:' + (process.env.PORT || 3000)
      }/api-docs`,
  });
});

// ---- GitHub OAuth routes at ROOT level ----
// These must be at the root because the GitHub OAuth App callback URL is
// fixed to http://localhost:3000/github/callback (cannot be changed).

// Start the OAuth flow.
router.get(
  '/login',
  passport.authenticate('github', { scope: ['user:email'] })
);

// GitHub redirects here after login (matches the OAuth App callback URL).
router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: '/api/auth/login/failed' }),
  (req, res) => {
    // Passport already stored the user _id in the session.
    res.redirect('/api-docs');
  }
);

// Logout (kept at root for convenience).
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

// ---- API routes under /api ----
router.use('/api/auth', require('./auth'));
router.use('/api/artists', require('./artists'));
router.use('/api/artworks', require('./artworks'));
router.use('/api/keywords', require('./keywords'));
router.use('/api/artworkKeywords', require('./artworkKeywords'));
router.use('/api/users', require('./users'));

module.exports = router;
// Central router.
// Mounts the Swagger UI and every API resource under the appropriate URL
// prefix. This file is also the entry point scanned by swagger-autogen.

const express = require('express');
const router = express.Router();

// Swagger UI at /api-docs.
router.use('/api-docs', require('./swagger'));

// Simple root endpoint announcing the API and the docs location.
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the ArtCatalog API',
    docs: `http://localhost:${process.env.PORT || 3000}/api-docs`,
  });
});

// Mount the per-entity routers under /api.
router.use('/api/auth', require('./auth'));
router.use('/api/artists', require('./artists'));
router.use('/api/artworks', require('./artworks'));
router.use('/api/keywords', require('./keywords'));
router.use('/api/artworkKeywords', require('./artworkKeywords'));
router.use('/api/users', require('./users'));

module.exports = router;
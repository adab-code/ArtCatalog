// Route definitions for the artworkKeywords resource (links between artworks
// and keywords). GETs are public; POST/PUT require authentication; DELETE
// requires admin. All write routes run the shared validation middleware.

const express = require('express');
const router = express.Router();
const artworkKeywordsController = require('../controllers/artworkKeywords');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const {
  artworkKeywordRules,
  validate,
  isValidObjectId,
} = require('../middleware/validation');

// Public: list all artwork-keyword links.
router.get('/', artworkKeywordsController.getAllArtworkKeywords);
// Public: get a single link.
router.get('/:id', isValidObjectId, artworkKeywordsController.getArtworkKeywordById);
// Protected: create a link.
router.post(
  '/',
  isAuthenticated,
  artworkKeywordRules(),
  validate,
  artworkKeywordsController.createArtworkKeyword
);
// Protected: update a link.
router.put(
  '/:id',
  isAuthenticated,
  isValidObjectId,
  artworkKeywordRules(),
  validate,
  artworkKeywordsController.updateArtworkKeyword
);
// Admin only: delete a link.
router.delete(
  '/:id',
  isAuthenticated,
  isAdmin,
  isValidObjectId,
  artworkKeywordsController.deleteArtworkKeyword
);

module.exports = router;
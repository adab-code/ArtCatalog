// Route definitions for the artwork_keywords resource (links between artworks
// and keywords). GETs are public. POST requires login. PUT/DELETE require the
// user who created the link (addedBy) or an admin.

const express = require('express');
const router = express.Router();
const artworkKeywordsController = require('../controllers/artworkKeywords');
const { isAuthenticated, isOwnerOrAdmin } = require('../middleware/auth');
const {
  artworkKeywordRules,
  validate,
  isValidObjectId,
} = require('../middleware/validation');

// Public: list all links (optional ?artworkId=, ?keywordId= filters).
router.get('/', artworkKeywordsController.getAllArtworkKeywords);
// Public: get a single link.
router.get('/:id', isValidObjectId, artworkKeywordsController.getArtworkKeywordById);
// Protected: create a link (checks that artwork/keyword exist; 409 on duplicate).
router.post(
  '/',
  isAuthenticated,
  artworkKeywordRules(),
  validate,
  artworkKeywordsController.createArtworkKeyword
);
// Owner or admin: update a link.
router.put(
  '/:id',
  isValidObjectId,
  isOwnerOrAdmin('artwork_keywords'),
  artworkKeywordRules(),
  validate,
  artworkKeywordsController.updateArtworkKeyword
);
// Owner or admin: delete a link.
router.delete(
  '/:id',
  isValidObjectId,
  isOwnerOrAdmin('artwork_keywords'),
  artworkKeywordsController.deleteArtworkKeyword
);

module.exports = router;
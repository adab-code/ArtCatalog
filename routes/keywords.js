// Route definitions for the keywords resource.
// GETs are public (including GET /:id/artworks, which lists the artworks
// tagged with a keyword). POST requires login. PUT/DELETE require the user
// who created the keyword (createdBy) or an admin.

const express = require('express');
const router = express.Router();
const keywordsController = require('../controllers/keywords');
const { isAuthenticated, isOwnerOrAdmin } = require('../middleware/auth');
const { keywordRules, validate, isValidObjectId } = require('../middleware/validation');

// Public: list all keywords.
router.get('/', keywordsController.getAllKeywords);
// Public: get a single keyword.
router.get('/:id', isValidObjectId, keywordsController.getKeywordById);
// Public: all artworks tagged with this keyword (stretch endpoint).
router.get('/:id/artworks', isValidObjectId, keywordsController.getKeywordArtworks);
// Protected: create a keyword (body validated, stored lowercase).
router.post('/', isAuthenticated, keywordRules(), validate, keywordsController.createKeyword);
// Owner or admin: update a keyword.
router.put(
  '/:id',
  isValidObjectId,
  isOwnerOrAdmin('keywords'),
  keywordRules(),
  validate,
  keywordsController.updateKeyword
);
// Owner or admin: delete a keyword and its links.
router.delete('/:id', isValidObjectId, isOwnerOrAdmin('keywords'), keywordsController.deleteKeyword);

module.exports = router;
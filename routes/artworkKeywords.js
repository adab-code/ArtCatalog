// Route definitions for the artwork_keywords resource.

const express = require('express');
const router = express.Router();
const artworkKeywordsController = require('../controllers/artworkKeywords');
const { isAuthenticated, isOwnerOrAdmin } = require('../middleware/auth');
const {
  artworkKeywordRules,
  validate,
  isValidObjectId,
} = require('../middleware/validation');

router.get('/', artworkKeywordsController.getAllArtworkKeywords);
router.get('/:id', isValidObjectId, artworkKeywordsController.getArtworkKeywordById);
router.post(
  '/',
  isAuthenticated,
  artworkKeywordRules(),
  validate,
  artworkKeywordsController.createArtworkKeyword
);
router.put(
  '/:id',
  /* #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
          artworkId: "6ab7527a48f485276c4cea89",
          keywordId: "6ab754b548f485276c4cea9a"
      }
  } */
  isValidObjectId,
  isAuthenticated,
  isOwnerOrAdmin('artwork_keywords'),
  artworkKeywordRules(),
  validate,
  artworkKeywordsController.updateArtworkKeyword
);
router.delete(
  '/:id',
  isValidObjectId,
  isAuthenticated,
  isOwnerOrAdmin('artwork_keywords'),
  artworkKeywordsController.deleteArtworkKeyword
);

module.exports = router;
// Route definitions for the keywords resource.

const express = require('express');
const router = express.Router();
const keywordsController = require('../controllers/keywords');
const { isAuthenticated, isOwnerOrAdmin } = require('../middleware/auth');
const {
  keywordRules,
  validate,
  isValidObjectId,
} = require('../middleware/validation');

router.get('/', keywordsController.getAllKeywords);
router.get('/:id', isValidObjectId, keywordsController.getKeywordById);
router.get('/:id/artworks', isValidObjectId, keywordsController.getKeywordArtworks);
router.post(
  '/',
  isAuthenticated,
  keywordRules(),
  validate,
  keywordsController.createKeyword
);
router.put(
  '/:id',
  /* #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
          keyword: "still-life"
      }
  } */
  isValidObjectId,
  isAuthenticated,
  isOwnerOrAdmin('keywords'),
  keywordRules(),
  validate,
  keywordsController.updateKeyword
);
router.delete(
  '/:id',
  isValidObjectId,
  isAuthenticated,
  isOwnerOrAdmin('keywords'),
  keywordsController.deleteKeyword
);

module.exports = router;
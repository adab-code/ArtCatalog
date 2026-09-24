// Route definitions for the keywords resource.
// GETs are public; POST/PUT require authentication; DELETE requires admin.
// All write routes run the shared ObjectId / body validation middleware.

const express = require('express');
const router = express.Router();
const keywordsController = require('../controllers/keywords');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { keywordRules, validate, isValidObjectId } = require('../middleware/validation');

// Public: list all keywords.
router.get('/', keywordsController.getAllKeywords);
// Public: get a single keyword (the :id param must be a valid ObjectId).
router.get('/:id', isValidObjectId, keywordsController.getKeywordById);
// Protected: create a keyword (body validated).
router.post('/', isAuthenticated, keywordRules(), validate, keywordsController.createKeyword);
// Protected: update a keyword.
router.put(
  '/:id',
  isAuthenticated,
  isValidObjectId,
  keywordRules(),
  validate,
  keywordsController.updateKeyword
);
// Admin only: delete a keyword.
router.delete('/:id', isAuthenticated, isAdmin, isValidObjectId, keywordsController.deleteKeyword);

module.exports = router;
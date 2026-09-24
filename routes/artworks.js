// Route definitions for the artworks resource.
// GETs are public; POST/PUT require authentication; DELETE requires admin.
// All write routes run the shared ObjectId / body validation middleware.

const express = require('express');
const router = express.Router();
const artworksController = require('../controllers/artworks');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { artworkRules, validate, isValidObjectId } = require('../middleware/validation');

// Public: list all artworks.
router.get('/', artworksController.getAllArtworks);
// Public: get a single artwork (the :id param must be a valid ObjectId).
router.get('/:id', isValidObjectId, artworksController.getArtworkById);
// Protected: create an artwork (body validated).
router.post('/', isAuthenticated, artworkRules(), validate, artworksController.createArtwork);
// Protected: update an artwork.
router.put(
  '/:id',
  isAuthenticated,
  isValidObjectId,
  artworkRules(),
  validate,
  artworksController.updateArtwork
);
// Admin only: delete an artwork.
router.delete('/:id', isAuthenticated, isAdmin, isValidObjectId, artworksController.deleteArtwork);

module.exports = router;
// Route definitions for the artworks resource.
// GETs are public. POST requires login. PUT/DELETE require the user who
// created the artwork (createdBy) or an admin.

const express = require('express');
const router = express.Router();
const artworksController = require('../controllers/artworks');
const { isAuthenticated, isOwnerOrAdmin } = require('../middleware/auth');
const { artworkRules, validate, isValidObjectId } = require('../middleware/validation');

// Public: list all artworks (optional ?period=, ?type=, ?year=, ?artistId= filters).
router.get('/', artworksController.getAllArtworks);
// Public: get a single artwork.
router.get('/:id', isValidObjectId, artworksController.getArtworkById);
// Protected: create an artwork (body validated).
router.post('/', isAuthenticated, artworkRules(), validate, artworksController.createArtwork);
// Owner or admin: update an artwork.
router.put(
  '/:id',
  isValidObjectId,
  isOwnerOrAdmin('artworks'),
  artworkRules(),
  validate,
  artworksController.updateArtwork
);
// Owner or admin: delete an artwork and its keyword links.
router.delete('/:id', isValidObjectId, isOwnerOrAdmin('artworks'), artworksController.deleteArtwork);

module.exports = router;
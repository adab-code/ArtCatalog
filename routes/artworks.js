// Route definitions for the artworks resource.

const express = require('express');
const router = express.Router();
const artworksController = require('../controllers/artworks');
const { isAuthenticated, isOwnerOrAdmin } = require('../middleware/auth');
const {
  artworkRules,
  validate,
  isValidObjectId,
} = require('../middleware/validation');

// Public: list all artworks.
router.get('/', artworksController.getAllArtworks);
// Public: advanced search (MUST stay before '/:id').
router.get('/search', artworksController.searchArtworks);
// Public: get a single artwork.
router.get('/:id', isValidObjectId, artworksController.getArtworkById);
// Public: keywords tagged on this artwork.
router.get('/:id/keywords', isValidObjectId, artworksController.getArtworkKeywords);
// Protected: create an artwork.
router.post(
  '/',
  isAuthenticated,
  artworkRules(),
  validate,
  artworksController.createArtwork
);
// Owner or admin: update an artwork.
router.put(
  '/:id',
  /* #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
          title: "Sunflowers",
          year: 1888,
          period: "Post-impressionism",
          type: "Painting",
          medium: "Oil",
          dimensions: "92 cm x 73 cm",
          description: "One of a series of sunflower still lifes.",
          file: "sunflowers.jpg",
          artistId: "6ab73b2548f485276c4cea63"
      }
  } */
  isValidObjectId,
  isAuthenticated,
  isOwnerOrAdmin('artworks'),
  artworkRules(),
  validate,
  artworksController.updateArtwork
);
// Owner or admin: delete an artwork.
router.delete(
  '/:id',
  isValidObjectId,
  isAuthenticated,
  isOwnerOrAdmin('artworks'),
  artworksController.deleteArtwork
);

module.exports = router;
// Route definitions for the artists resource.
// GETs are public; POST/PUT require authentication; DELETE requires admin.
// All write routes run the shared ObjectId / body validation middleware.

const express = require('express');
const router = express.Router();
const artistsController = require('../controllers/artists');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { artistRules, validate, isValidObjectId } = require('../middleware/validation');

// Public: list all artists.
router.get('/', artistsController.getAllArtists);
// Public: get a single artist (the :id param must be a valid ObjectId).
router.get('/:id', isValidObjectId, artistsController.getArtistById);
// Protected: create an artist (body validated).
router.post('/', isAuthenticated, artistRules(), validate, artistsController.createArtist);
// Protected: update an artist.
router.put(
  '/:id',
  isAuthenticated,
  isValidObjectId,
  artistRules(),
  validate,
  artistsController.updateArtist
);
// Admin only: delete an artist.
router.delete('/:id', isAuthenticated, isAdmin, isValidObjectId, artistsController.deleteArtist);

module.exports = router;
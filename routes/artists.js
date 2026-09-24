// Route definitions for the artists resource.
// GETs are public. POST requires login. PUT/DELETE require the user who
// created the artist (createdBy) or an admin.

const express = require('express');
const router = express.Router();
const artistsController = require('../controllers/artists');
const { isAuthenticated, isOwnerOrAdmin } = require('../middleware/auth');
const { artistRules, validate, isValidObjectId } = require('../middleware/validation');

// Public: list all artists (optional ?country= filter).
router.get('/', artistsController.getAllArtists);
// Public: get a single artist.
router.get('/:id', isValidObjectId, artistsController.getArtistById);
// Protected: create an artist (body validated).
router.post('/', isAuthenticated, artistRules(), validate, artistsController.createArtist);
// Owner or admin: update an artist.
router.put(
  '/:id',
  isValidObjectId,
  isOwnerOrAdmin('artists'),
  artistRules(),
  validate,
  artistsController.updateArtist
);
// Owner or admin: delete an artist (409 if the artist still has artworks).
router.delete('/:id', isValidObjectId, isOwnerOrAdmin('artists'), artistsController.deleteArtist);

module.exports = router;
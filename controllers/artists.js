// Controller for the "artists" collection.
// All handlers access the database through getDatabase() (see data/database.js)
// and delegate any thrown error to the central error handler via next(err).
// Documents store "createdBy" (id of the user that created them) so routes
// can check ownership.

const { ObjectId } = require('mongodb');
const { getDatabase } = require('../data/database');

const COLLECTION = 'artists';
// Fields a client may update (whitelist to avoid mass assignment).
const ALLOWED_FIELDS = [
  'firstName',
  'middleName',
  'lastName',
  'birthDate',
  'deathDate',
  'country',
  'locality',
];

/**
 * Returns all artworks by one artist (stretch endpoint).
 * 404 if the artist does not exist, otherwise the list of artworks.
 */
async function getArtistArtworks(req, res, next) {
  try {
    const db = getDatabase();
    const id = new ObjectId(req.params.id);
    const artist = await db.collection('artists').findOne({ _id: id });
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }
    const artworks = await db.collection('artworks').find({ artistId: id }).toArray();
    res.status(200).json(artworks);
  } catch (err) {
    next(err);
  }
}

/** Returns every artist; supports the optional ?country= filter. */
async function getAllArtists(req, res, next) {
  try {
    const db = getDatabase();
    const query = {};
    if (req.query.country) {
      query.country = req.query.country;
    }
    const artists = await db.collection(COLLECTION).find(query).toArray();
    res.status(200).json(artists);
  } catch (err) {
    next(err);
  }
}

/** Returns a single artist by id, or 404 when there is no match. */
async function getArtistById(req, res, next) {
  try {
    const db = getDatabase();
    const artist = await db.collection(COLLECTION).findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }
    res.status(200).json(artist);
  } catch (err) {
    next(err);
  }
}

/** Creates a new artist and returns it with status 201. */
async function createArtist(req, res, next) {
  try {
    const db = getDatabase();
    const artist = {
      firstName: req.body.firstName,
      middleName: req.body.middleName || null,
      lastName: req.body.lastName,
      birthDate: new Date(req.body.birthDate),
      deathDate: req.body.deathDate ? new Date(req.body.deathDate) : null,
      country: req.body.country,
      locality: req.body.locality || null,
      createdBy: req.user._id,
      createdAt: new Date(),
    };
    const result = await db.collection(COLLECTION).insertOne(artist);
    const created = await db.collection(COLLECTION).findOne({ _id: result.insertedId });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

/** Partially updates an artist (only whitelisted fields) and returns it. */
async function updateArtist(req, res, next) {
  try {
    const db = getDatabase();
    const updatedFields = {};
    ALLOWED_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        // Date fields must be converted back into Date objects for the DB.
        updatedFields[field] =
          (field === 'birthDate' || field === 'deathDate') && req.body[field]
            ? new Date(req.body[field])
            : req.body[field];
      }
    });
    const result = await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedFields }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Artist not found' });
    }
    const updated = await db.collection(COLLECTION).findOne({
      _id: new ObjectId(req.params.id),
    });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * Deletes an artist by id.
 * Returns 409 if the artist still has artworks (to avoid orphan records).
 * 204 on success and 404 when there is no match.
 */
async function deleteArtist(req, res, next) {
  try {
    const db = getDatabase();
    const id = new ObjectId(req.params.id);
    const artworkCount = await db.collection('artworks').countDocuments({ artistId: id });
    if (artworkCount > 0) {
      return res
        .status(409)
        .json({ message: 'Cannot delete an artist that still has artworks' });
    }
    const result = await db.collection(COLLECTION).deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Artist not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllArtists,
  getArtistById,
  createArtist,
  updateArtist,
  deleteArtist,
  getArtistArtworks,
};
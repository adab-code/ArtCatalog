// Controller for the "artworks" collection.
// All handlers access the database through getDatabase() (see data/database.js)
// and delegate any thrown error to the central error handler via next(err).

const { ObjectId } = require('mongodb');
const { getDatabase } = require('../data/database');

const COLLECTION = 'artworks';
// Fields a client may update (whitelist to avoid mass assignment).
const ALLOWED_FIELDS = ['title', 'description', 'artistId', 'year', 'medium', 'imageUrl'];

/** Returns every artwork in the collection. */
async function getAllArtworks(req, res, next) {
  try {
    const db = getDatabase();
    const artworks = await db.collection(COLLECTION).find().toArray();
    res.status(200).json(artworks);
  } catch (err) {
    next(err);
  }
}

/** Returns a single artwork by id, or 404 when there is no match. */
async function getArtworkById(req, res, next) {
  try {
    const db = getDatabase();
    const artwork = await db.collection(COLLECTION).findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }
    res.status(200).json(artwork);
  } catch (err) {
    next(err);
  }
}

/** Creates a new artwork (artistId is stored as an ObjectId) and returns it. */
async function createArtwork(req, res, next) {
  try {
    const db = getDatabase();
    const artwork = {
      title: req.body.title,
      description: req.body.description || null,
      artistId: new ObjectId(req.body.artistId),
      year: req.body.year || null,
      medium: req.body.medium || null,
      imageUrl: req.body.imageUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db.collection(COLLECTION).insertOne(artwork);
    const created = await db.collection(COLLECTION).findOne({ _id: result.insertedId });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

/** Partially updates an artwork (only whitelisted fields) and returns it. */
async function updateArtwork(req, res, next) {
  try {
    const db = getDatabase();
    const updatedFields = { updatedAt: new Date() };
    ALLOWED_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        // artistId must be converted back into an ObjectId for the DB.
        updatedFields[field] =
          field === 'artistId' ? new ObjectId(req.body[field]) : req.body[field];
      }
    });
    const result = await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedFields }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Artwork not found' });
    }
    const updated = await db.collection(COLLECTION).findOne({
      _id: new ObjectId(req.params.id),
    });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

/** Deletes an artwork by id; 204 on success and 404 when there is no match. */
async function deleteArtwork(req, res, next) {
  try {
    const db = getDatabase();
    const result = await db.collection(COLLECTION).deleteOne({
      _id: new ObjectId(req.params.id),
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Artwork not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllArtworks,
  getArtworkById,
  createArtwork,
  updateArtwork,
  deleteArtwork,
};
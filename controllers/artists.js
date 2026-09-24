// Controller for the "artists" collection.
// All handlers access the database through getDatabase() (see data/database.js)
// and delegate any thrown error to the central error handler via next(err).

const { ObjectId } = require('mongodb');
const { getDatabase } = require('../data/database');

const COLLECTION = 'artists';
// Fields a client may update (whitelist to avoid mass assignment).
const ALLOWED_FIELDS = ['name', 'bio', 'nationality', 'birthYear', 'deathYear'];

/** Returns every artist in the collection. */
async function getAllArtists(req, res, next) {
  try {
    const db = getDatabase();
    const artists = await db.collection(COLLECTION).find().toArray();
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
      name: req.body.name,
      bio: req.body.bio || null,
      nationality: req.body.nationality || null,
      birthYear: req.body.birthYear || null,
      deathYear: req.body.deathYear || null,
      createdAt: new Date(),
      updatedAt: new Date(),
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
    const updatedFields = { updatedAt: new Date() };
    ALLOWED_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        updatedFields[field] = req.body[field];
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

/** Deletes an artist by id; 204 on success and 404 when there is no match. */
async function deleteArtist(req, res, next) {
  try {
    const db = getDatabase();
    const result = await db.collection(COLLECTION).deleteOne({
      _id: new ObjectId(req.params.id),
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Artist not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllArtists, getArtistById, createArtist, updateArtist, deleteArtist };
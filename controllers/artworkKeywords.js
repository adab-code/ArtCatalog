// Controller for the "artworkKeywords" collection (many-to-many links between
// artworks and keywords). Each document references an artworkId and keywordId.
// All handlers delegate any thrown error to the central error handler.

const { ObjectId } = require('mongodb');
const { getDatabase } = require('../data/database');

const COLLECTION = 'artworkKeywords';
// Fields a client may update (whitelist to avoid mass assignment).
const ALLOWED_FIELDS = ['artworkId', 'keywordId'];

/** Returns every artwork-keyword link in the collection. */
async function getAllArtworkKeywords(req, res, next) {
  try {
    const db = getDatabase();
    const links = await db.collection(COLLECTION).find().toArray();
    res.status(200).json(links);
  } catch (err) {
    next(err);
  }
}

/** Returns a single link by id, or 404 when there is no match. */
async function getArtworkKeywordById(req, res, next) {
  try {
    const db = getDatabase();
    const link = await db.collection(COLLECTION).findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!link) {
      return res.status(404).json({ message: 'ArtworkKeyword link not found' });
    }
    res.status(200).json(link);
  } catch (err) {
    next(err);
  }
}

/** Creates a new link and returns it with status 201. */
async function createArtworkKeyword(req, res, next) {
  try {
    const db = getDatabase();
    const link = {
      artworkId: new ObjectId(req.body.artworkId),
      keywordId: new ObjectId(req.body.keywordId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db.collection(COLLECTION).insertOne(link);
    const created = await db.collection(COLLECTION).findOne({ _id: result.insertedId });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

/** Partially updates a link (only whitelisted fields) and returns it. */
async function updateArtworkKeyword(req, res, next) {
  try {
    const db = getDatabase();
    const updatedFields = { updatedAt: new Date() };
    ALLOWED_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        // Reference ids must be converted back into ObjectIds for the DB.
        updatedFields[field] = new ObjectId(req.body[field]);
      }
    });
    const result = await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedFields }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'ArtworkKeyword link not found' });
    }
    const updated = await db.collection(COLLECTION).findOne({
      _id: new ObjectId(req.params.id),
    });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

/** Deletes a link by id; 204 on success and 404 when there is no match. */
async function deleteArtworkKeyword(req, res, next) {
  try {
    const db = getDatabase();
    const result = await db.collection(COLLECTION).deleteOne({
      _id: new ObjectId(req.params.id),
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'ArtworkKeyword link not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllArtworkKeywords,
  getArtworkKeywordById,
  createArtworkKeyword,
  updateArtworkKeyword,
  deleteArtworkKeyword,
};
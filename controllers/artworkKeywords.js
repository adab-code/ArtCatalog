// Controller for the "artwork_keywords" collection (many-to-many links between
// artworks and keywords). Each document references an artworkId and keywordId.
// All handlers delegate any thrown error to the central error handler.

const { ObjectId } = require('mongodb');
const { getDatabase } = require('../data/database');

const COLLECTION = 'artwork_keywords';
// Fields a client may update (whitelist to avoid mass assignment).
const ALLOWED_FIELDS = ['artworkId', 'keywordId'];

/** Returns every link; supports ?artworkId= and ?keywordId= filters. */
async function getAllArtworkKeywords(req, res, next) {
  try {
    const db = getDatabase();
    const query = {};
    if (req.query.artworkId) query.artworkId = new ObjectId(req.query.artworkId);
    if (req.query.keywordId) query.keywordId = new ObjectId(req.query.keywordId);
    const links = await db.collection(COLLECTION).find(query).toArray();
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

/**
 * Creates a new link.
 * Returns 400 if the artwork or keyword does not exist, and 409 if the
 * link already exists (duplicate).
 */
async function createArtworkKeyword(req, res, next) {
  try {
    const db = getDatabase();
    const artworkId = new ObjectId(req.body.artworkId);
    const keywordId = new ObjectId(req.body.keywordId);

    const artwork = await db.collection('artworks').findOne({ _id: artworkId });
    if (!artwork) {
      return res
        .status(400)
        .json({ message: 'artworkId does not reference an existing artwork' });
    }
    const keyword = await db.collection('keywords').findOne({ _id: keywordId });
    if (!keyword) {
      return res
        .status(400)
        .json({ message: 'keywordId does not reference an existing keyword' });
    }
    const existing = await db.collection(COLLECTION).findOne({ artworkId, keywordId });
    if (existing) {
      return res
        .status(409)
        .json({ message: 'This artwork is already linked to that keyword' });
    }

    const link = {
      artworkId,
      keywordId,
      addedBy: req.user._id,
      addedAt: new Date(),
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
    const updatedFields = {};
    ALLOWED_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        // Reference ids must be converted back into ObjectIds for the DB.
        updatedFields[field] = new ObjectId(req.body[field]);
      }
    });
    // Keep the same invariants as createArtworkKeyword: artworkId/keywordId
    // must reference existing documents.
    if (updatedFields.artworkId !== undefined) {
      const artwork = await db.collection('artworks').findOne({ _id: updatedFields.artworkId });
      if (!artwork) {
        return res
          .status(400)
          .json({ message: 'artworkId does not reference an existing artwork' });
      }
    }
    if (updatedFields.keywordId !== undefined) {
      const keyword = await db.collection('keywords').findOne({ _id: updatedFields.keywordId });
      if (!keyword) {
        return res
          .status(400)
          .json({ message: 'keywordId does not reference an existing keyword' });
      }
    }
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
    // MongoDB duplicate key error (unique index on artworkId + keywordId).
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: 'This artwork is already linked to that keyword' });
    }
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
// Controller for the "keywords" collection.
// All handlers access the database through getDatabase() (see data/database.js)
// and delegate any thrown error to the central error handler via next(err).
// Keywords are stored in lowercase so they are easy to search and compare.

const { ObjectId } = require('mongodb');
const { getDatabase } = require('../data/database');

const COLLECTION = 'keywords';
// Fields a client may update (whitelist to avoid mass assignment).
const ALLOWED_FIELDS = ['keyword'];

/** Returns every keyword in the collection. */
async function getAllKeywords(req, res, next) {
  try {
    const db = getDatabase();
    const keywords = await db.collection(COLLECTION).find().toArray();
    res.status(200).json(keywords);
  } catch (err) {
    next(err);
  }
}

/** Returns a single keyword by id, or 404 when there is no match. */
async function getKeywordById(req, res, next) {
  try {
    const db = getDatabase();
    const keyword = await db.collection(COLLECTION).findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!keyword) {
      return res.status(404).json({ message: 'Keyword not found' });
    }
    res.status(200).json(keyword);
  } catch (err) {
    next(err);
  }
}

/**
 * Creates a new keyword (stored in lowercase).
 * Returns 409 if that keyword already exists (unique).
 */
async function createKeyword(req, res, next) {
  try {
    const db = getDatabase();
    const keyword = {
      keyword: req.body.keyword.trim().toLowerCase(),
      createdBy: req.user._id,
      createdAt: new Date(),
    };
    const result = await db.collection(COLLECTION).insertOne(keyword);
    const created = await db.collection(COLLECTION).findOne({ _id: result.insertedId });
    res.status(201).json(created);
  } catch (err) {
    // MongoDB duplicate key error (unique index on "keyword").
    if (err.code === 11000) {
      return res.status(409).json({ message: 'That keyword already exists' });
    }
    next(err);
  }
}

/** Partially updates a keyword (only whitelisted fields) and returns it. */
async function updateKeyword(req, res, next) {
  try {
    const db = getDatabase();
    const updatedFields = {};
    ALLOWED_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        updatedFields[field] = req.body[field].trim().toLowerCase();
      }
    });
    const result = await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedFields }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Keyword not found' });
    }
    const updated = await db.collection(COLLECTION).findOne({
      _id: new ObjectId(req.params.id),
    });
    res.status(200).json(updated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'That keyword already exists' });
    }
    next(err);
  }
}

/**
 * Deletes a keyword and its links (cascade).
 * 204 on success and 404 when there is no match.
 */
async function deleteKeyword(req, res, next) {
  try {
    const db = getDatabase();
    const id = new ObjectId(req.params.id);
    const result = await db.collection(COLLECTION).deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Keyword not found' });
    }
    // Remove the links so no database record points to a deleted keyword.
    await db.collection('artwork_keywords').deleteMany({ keywordId: id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * Returns all artworks tagged with one keyword (stretch endpoint).
 * Resolves the artwork_keywords links and returns the artwork documents.
 * 404 if the keyword does not exist.
 */
async function getKeywordArtworks(req, res, next) {
  try {
    const db = getDatabase();
    const id = new ObjectId(req.params.id);
    const keyword = await db.collection('keywords').findOne({ _id: id });
    if (!keyword) {
      return res.status(404).json({ message: 'Keyword not found' });
    }
    const links = await db.collection('artwork_keywords').find({ keywordId: id }).toArray();
    const artworkIds = links.map((link) => link.artworkId);
    if (artworkIds.length === 0) {
      return res.status(200).json([]);
    }
    const artworks = await db
      .collection('artworks')
      .find({ _id: { $in: artworkIds } })
      .toArray();
    res.status(200).json(artworks);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllKeywords,
  getKeywordById,
  createKeyword,
  updateKeyword,
  deleteKeyword,
  getKeywordArtworks,
};
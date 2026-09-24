// Controller for the "keywords" collection.
// All handlers access the database through getDatabase() (see data/database.js)
// and delegate any thrown error to the central error handler via next(err).

const { ObjectId } = require('mongodb');
const { getDatabase } = require('../data/database');

const COLLECTION = 'keywords';
// Fields a client may update (whitelist to avoid mass assignment).
const ALLOWED_FIELDS = ['name', 'description'];

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

/** Creates a new keyword and returns it with status 201. */
async function createKeyword(req, res, next) {
  try {
    const db = getDatabase();
    const keyword = {
      name: req.body.name,
      description: req.body.description || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db.collection(COLLECTION).insertOne(keyword);
    const created = await db.collection(COLLECTION).findOne({ _id: result.insertedId });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

/** Partially updates a keyword (only whitelisted fields) and returns it. */
async function updateKeyword(req, res, next) {
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
      return res.status(404).json({ message: 'Keyword not found' });
    }
    const updated = await db.collection(COLLECTION).findOne({
      _id: new ObjectId(req.params.id),
    });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

/** Deletes a keyword by id; 204 on success and 404 when there is no match. */
async function deleteKeyword(req, res, next) {
  try {
    const db = getDatabase();
    const result = await db.collection(COLLECTION).deleteOne({
      _id: new ObjectId(req.params.id),
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Keyword not found' });
    }
    res.status(204).send();
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
};
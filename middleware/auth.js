// Authentication / authorization middleware used to protect routes.
// req.isAuthenticated() and req.user are populated by passport-session when
// the request carries a valid session cookie.

const { ObjectId } = require('mongodb');
const { getDatabase } = require('../data/database');

/**
 * Allows the request only if a user is logged in.
 * Returns 401 otherwise.
 */
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized: you must be logged in' });
}

/**
 * Returns a middleware that allows a request only for the user who created
 * the document (createdBy / addedBy field) or for an admin.
 *
 * collection: name of the MongoDB collection where the document lives.
 * Returns 401 if not logged in, 404 if the document does not exist,
 * and 403 if the user is neither the owner nor an admin.
 */
function isOwnerOrAdmin(collection) {
  return async (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized: you must be logged in' });
    }
    if (req.user.role === 'admin') {
      return next();
    }
    try {
      const db = getDatabase();
      const doc = await db
        .collection(collection)
        .findOne({ _id: new ObjectId(req.params.id) });
      if (!doc) {
        return res.status(404).json({ message: 'Document not found' });
      }
      const ownerId = doc.createdBy || doc.addedBy;
      if (ownerId && ownerId.toString() === req.user._id.toString()) {
        return next();
      }
      return res.status(403).json({ message: 'Forbidden: you do not have permission' });
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Allows the request only for users with the admin role.
 * Returns 401 if not logged in and 403 otherwise.
 */
function isAdmin(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized: you must be logged in' });
  }
  if (req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: admin access required' });
}

module.exports = { isAuthenticated, isOwnerOrAdmin, isAdmin };
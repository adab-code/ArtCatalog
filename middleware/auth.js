// Authentication / authorization middleware.

const { ObjectId } = require('mongodb');
const { getDatabase } = require('../data/database');

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized: you must be logged in' });
}

function isOwnerOrAdmin(collection) {
  return async (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: you must be logged in' });
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

      // Safe comparison (evita el error toString)
      if (
        ownerId &&
        req.user._id &&
        ownerId.toString() === req.user._id.toString()
      ) {
        return next();
      }
      return res
        .status(403)
        .json({ message: 'Forbidden: you do not have permission' });
    } catch (err) {
      next(err);
    }
  };
}

function isAdmin(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res
      .status(401)
      .json({ message: 'Unauthorized: you must be logged in' });
  }
  if (req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: admin access required' });
}

module.exports = { isAuthenticated, isOwnerOrAdmin, isAdmin };
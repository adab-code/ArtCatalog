// Controller for the "users" collection (admin only).
// Users are created automatically by the GitHub login flow (see config/passport.js).
// Admins can list users, view one, change the role, or delete a user.
// Responses use projections so no internal fields are exposed.

const { ObjectId } = require('mongodb');
const { getDatabase } = require('../data/database');

const COLLECTION = 'users';
// Only the role can be edited by an admin (whitelist to avoid mass assignment).
const ALLOWED_FIELDS = ['role'];
// Fields returned to clients.
const PROJECTION = {
  _id: 1,
  oauthProvider: 1,
  oauthId: 1,
  displayName: 1,
  email: 1,
  role: 1,
};

/** Returns every user (public projection only). */
async function getAllUsers(req, res, next) {
  try {
    const db = getDatabase();
    const users = await db.collection(COLLECTION).find().project(PROJECTION).toArray();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
}

/** Returns a single user by id (public projection only), or 404. */
async function getUserById(req, res, next) {
  try {
    const db = getDatabase();
    const user = await db.collection(COLLECTION).findOne(
      { _id: new ObjectId(req.params.id) },
      { projection: PROJECTION }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

/** Changes a user's role (e.g. promote someone to admin). */
async function updateUser(req, res, next) {
  try {
    const db = getDatabase();
    const updatedFields = {};
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
      return res.status(404).json({ message: 'User not found' });
    }
    const updated = await db.collection(COLLECTION).findOne(
      { _id: new ObjectId(req.params.id) },
      { projection: PROJECTION }
    );
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

/** Deletes a user by id; 204 on success and 404 when there is no match. */
async function deleteUser(req, res, next) {
  try {
    const db = getDatabase();
    const result = await db.collection(COLLECTION).deleteOne({
      _id: new ObjectId(req.params.id),
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
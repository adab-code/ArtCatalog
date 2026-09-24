// Route definitions for the users resource.
// All routes require authentication; PUT/DELETE are limited to the resource
// owner or an admin (isOwnerOrAdmin).

const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users');
const { isAuthenticated, isOwnerOrAdmin } = require('../middleware/auth');
const { userRules, validate, isValidObjectId } = require('../middleware/validation');

// Requires login: list all users.
router.get('/', isAuthenticated, usersController.getAllUsers);
// Requires login: get a single user.
router.get('/:id', isAuthenticated, isValidObjectId, usersController.getUserById);
// Owner or admin: update a user profile.
router.put(
  '/:id',
  isAuthenticated,
  isValidObjectId,
  isOwnerOrAdmin,
  userRules(),
  validate,
  usersController.updateUser
);
// Owner or admin: delete a user.
router.delete(
  '/:id',
  isAuthenticated,
  isValidObjectId,
  isOwnerOrAdmin,
  usersController.deleteUser
);

module.exports = router;
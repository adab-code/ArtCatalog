// Request validation middleware.
// Provides express-validator rule sets per entity and helpers to check
// MongoDB ObjectId formats.

const { validationResult } = require('express-validator');
const { body } = require('express-validator');
const { ObjectId } = require('mongodb');

/**
 * Validator callback for express-validator.
 * Throws if the value is not a valid MongoDB ObjectId.
 */
function isValidObjectIdValue(value) {
  if (!ObjectId.isValid(value)) {
    throw new Error('Invalid ObjectId format');
  }
  return true;
}

/**
 * Route-level middleware that validates the :id param is a proper ObjectId.
 * Returns 400 and aborts the request otherwise.
 */
function isValidObjectId(req, res, next) {
  const { id } = req.params;
  if (!id || !ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid ObjectId format' });
  }
  next();
}

/**
 * Middleware that runs after the express-validator rules and responds with
 * 400 + the list of error messages if validation failed.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((error) => error.msg);
    return res.status(400).json({ message: 'Validation failed', errors: messages });
  }
  next();
}

// ---- Per-entity validation rule sets ----

/** Rules for creating/updating an artist. */
function artistRules() {
  return [body('name').trim().notEmpty().withMessage('name is required')];
}

/** Rules for creating/updating an artwork. */
function artworkRules() {
  return [
    body('title').trim().notEmpty().withMessage('title is required'),
    body('artistId')
      .trim()
      .notEmpty()
      .withMessage('artistId is required')
      .bail() // stop checking this field if it is missing/empty
      .custom(isValidObjectIdValue)
      .withMessage('artistId must be a valid ObjectId'),
  ];
}

/** Rules for creating/updating a keyword. */
function keywordRules() {
  return [body('name').trim().notEmpty().withMessage('name is required')];
}

/** Rules for linking an artwork with a keyword. */
function artworkKeywordRules() {
  return [
    body('artworkId')
      .trim()
      .notEmpty()
      .withMessage('artworkId is required')
      .bail()
      .custom(isValidObjectIdValue)
      .withMessage('artworkId must be a valid ObjectId'),
    body('keywordId')
      .trim()
      .notEmpty()
      .withMessage('keywordId is required')
      .bail()
      .custom(isValidObjectIdValue)
      .withMessage('keywordId must be a valid ObjectId'),
  ];
}

/** Rules for updating a user profile. */
function userRules() {
  return [
    body('name').trim().notEmpty().withMessage('name is required'),
    body('email').isEmail().withMessage('a valid email is required'),
  ];
}

module.exports = {
  artistRules,
  artworkRules,
  keywordRules,
  artworkKeywordRules,
  userRules,
  isValidObjectId,
  validate,
};
// MongoDB connection manager.
// Provides initDb to establish the connection and getDatabase to return the
// active database handle to controllers.

const { MongoClient } = require('mongodb');

let _db; // active database handle
let _client; // underlying MongoClient (kept to allow a clean shutdown)

/**
 * Connects to MongoDB using the provided connection string.
 * Stores the resolved database so it can be reused app-wide.
 * Ignores subsequent calls if already initialized.
 */
async function initDb(connectionString) {
  if (_db) {
    console.warn('Trying to init DB again!');
    return _db;
  }
  _client = new MongoClient(connectionString);
  await _client.connect();
  _db = _client.db();
  console.log('Connected to MongoDB');
  return _db;
}

/**
 * Returns the active database handle.
 * Throws if initDb has not been called yet.
 */
function getDatabase() {
  if (!_db) {
    throw new Error('Database not initialized!');
  }
  return _db;
}

/** Closes the MongoDB connection (used in tests / shutdown). */
async function closeDb() {
  if (_client) {
    await _client.close();
    _db = null;
    _client = null;
  }
}

module.exports = { initDb, getDatabase, closeDb };
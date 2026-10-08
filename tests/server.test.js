// Jest + Supertest integration tests for every GET and GetAll route.
// The database module is mocked so the tests run without a live MongoDB.
// The API is exported from server.js as an Express app (no port is opened).

// Making the tests deterministic: the app imports dotenv before anything else,
// so each test file can set NODE_ENV before requiring the app. In test mode
// server.js skips sessions/passport and installs a small auth shim driven by
// the x-test-auth header ('admin' | 'user' | absent) so protected routes can
// be exercised without a real OAuth flow.

process.env.NODE_ENV = 'test';

// Replace data/database with an in-memory fake before the app is loaded.
// This lets the integration tests run without a live MongoDB cluster while
// still exercising the real Express routing and controller logic.
jest.mock('../data/database', () => {
  const { ObjectId } = require('mongodb');

  // Small in-memory fixtures returned by the mocked collection.
  // Keys match the collection names used by the controllers.
  const data = {
    artists: [
      { _id: new ObjectId(), firstName: 'Test', lastName: 'Artist', country: 'Spain' },
    ],
    artworks: [
      { _id: new ObjectId(), title: 'Test Artwork', period: 'Baroque', type: 'Painting' },
    ],
    keywords: [{ _id: new ObjectId(), keyword: 'landscape' }],
    artwork_keywords: [
      { _id: new ObjectId(), artworkId: new ObjectId(), keywordId: new ObjectId() },
    ],
    users: [
      {
        _id: new ObjectId(),
        oauthProvider: 'github',
        oauthId: '12345',
        displayName: 'Test Admin',
        email: 'admin@example.com',
        role: 'admin',
      },
    ],
  };

  const isObjectId = (value) =>
    value instanceof ObjectId || (value && value._bsontype === 'ObjectId');

  // Minimal Mongo-like matcher: ObjectId equality, $regex, $in and plain
  // equality. Enough for the queries built by the controllers.
  function matchDocs(docs, query) {
    return docs.filter((doc) =>
      Object.entries(query || {}).every(([key, value]) => {
        const docValue = doc[key];
        if (isObjectId(value)) {
          return docValue != null && docValue.toString() === value.toString();
        }
        if (value && typeof value === 'object' && value.$regex !== undefined) {
          return (
            typeof docValue === 'string' &&
            new RegExp(value.$regex, value.$options || '').test(docValue)
          );
        }
        if (value && typeof value === 'object' && Array.isArray(value.$in)) {
          return value.$in.some((item) => String(item) === String(docValue));
        }
        return docValue === value;
      })
    );
  }

  // Mocked module surface. initDb resolves because server.js calls it inside a
  // try/catch when a real connection is attempted; here it just resolves.
  // __fixtures is exposed so tests can build real ids from the seed data.
  return {
    initDb: jest.fn().mockResolvedValue({}),
    closeDb: jest.fn(),
    __fixtures: data,
    getDatabase: jest.fn(() => ({
      collection: (name) => ({
        // Supports the "find().toArray()" pattern used by the controllers.
        find: (query) => ({
          toArray: async () => matchDocs(data[name] || [], query),
          // Supports the "find().project(...).toArray()" pattern (users).
          project: () => ({
            toArray: async () => matchDocs(data[name] || [], query),
          }),
        }),
        // Supports the "findOne(...)" pattern used by the controllers.
        findOne: async (query) => matchDocs(data[name] || [], query)[0] || null,
      }),
    })),
  };
});

const request = require('supertest');
const app = require('../server');
const { __fixtures } = require('../data/database');

// Real ids from the mocked fixtures (used by the GET /:id tests).
const artistId = __fixtures.artists[0]._id.toString();
const artworkId = __fixtures.artworks[0]._id.toString();
const keywordId = __fixtures.keywords[0]._id.toString();
const linkId = __fixtures.artwork_keywords[0]._id.toString();
const userId = __fixtures.users[0]._id.toString();
// A valid ObjectId format that is NOT present in any fixture (404 cases).
const missingId = '6528a1b2c3d4e5f6a7b8c9d9';
// A completely invalid id (400 cases).
const badId = 'not-a-valid-id';

describe('GET routes', () => {
  test('GET / returns 200 with a welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });

  test('GET /api-docs/ returns 200 (swagger UI)', async () => {
    const res = await request(app).get('/api-docs/');
    expect(res.status).toBe(200);
  });

  // ---- GetAll routes (one per collection) ----

  test('GET /api/artists (GetAll) returns 200 with an array', async () => {
    const res = await request(app).get('/api/artists');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /api/artists?country=Spain returns 200 with an array', async () => {
    const res = await request(app).get('/api/artists?country=Spain');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/artworks (GetAll) returns 200 with an array', async () => {
    const res = await request(app).get('/api/artworks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /api/keywords (GetAll) returns 200 with an array', async () => {
    const res = await request(app).get('/api/keywords');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /api/artworkKeywords (GetAll) returns 200 with an array', async () => {
    const res = await request(app).get('/api/artworkKeywords');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /api/users (GetAll, admin) returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  test('GET /api/users (GetAll, admin) returns 403 for a non-admin user', async () => {
    const res = await request(app).get('/api/users').set('x-test-auth', 'user');
    expect(res.status).toBe(403);
  });

  test('GET /api/users (GetAll, admin) returns 200 with an array for an admin', async () => {
    const res = await request(app).get('/api/users').set('x-test-auth', 'admin');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  // ---- Auth helper GET routes ----

  test('GET /api/auth/me returns 401 with authenticated false by default', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.authenticated).toBe(false);
  });

  test('GET /api/auth/me returns 200 with the user when authenticated', async () => {
    const res = await request(app).get('/api/auth/me').set('x-test-auth', 'admin');
    expect(res.status).toBe(200);
    expect(res.body.displayName).toBe('Test User');
  });

  test('GET /api/auth/login/failed returns 401', async () => {
    const res = await request(app).get('/api/auth/login/failed');
    expect(res.status).toBe(401);
  });

  // ---- Get by id: artists ----

  test('GET /api/artists/:id with invalid ObjectId returns 400', async () => {
    const res = await request(app).get(`/api/artists/${badId}`);
    expect(res.status).toBe(400);
  });

  test('GET /api/artists/:id with a valid id returns 200', async () => {
    const res = await request(app).get(`/api/artists/${artistId}`);
    expect(res.status).toBe(200);
    expect(res.body.lastName).toBe('Artist');
  });

  test('GET /api/artists/:id with a missing id returns 404', async () => {
    const res = await request(app).get(`/api/artists/${missingId}`);
    expect(res.status).toBe(404);
  });

  test('GET /api/artists/:id/artworks returns 200 with an array', async () => {
    const res = await request(app).get(`/api/artists/${artistId}/artworks`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ---- Get by id: artworks ----

  test('GET /api/artworks/:id with invalid ObjectId returns 400', async () => {
    const res = await request(app).get(`/api/artworks/${badId}`);
    expect(res.status).toBe(400);
  });

  test('GET /api/artworks/:id with a valid id returns 200', async () => {
    const res = await request(app).get(`/api/artworks/${artworkId}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Test Artwork');
  });

  test('GET /api/artworks/:id with a missing id returns 404', async () => {
    const res = await request(app).get(`/api/artworks/${missingId}`);
    expect(res.status).toBe(404);
  });

  test('GET /api/artworks/:id/keywords returns 200 with an array', async () => {
    const res = await request(app).get(`/api/artworks/${artworkId}/keywords`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ---- Get by id: keywords ----

  test('GET /api/keywords/:id with invalid ObjectId returns 400', async () => {
    const res = await request(app).get(`/api/keywords/${badId}`);
    expect(res.status).toBe(400);
  });

  test('GET /api/keywords/:id with a valid id returns 200', async () => {
    const res = await request(app).get(`/api/keywords/${keywordId}`);
    expect(res.status).toBe(200);
    expect(res.body.keyword).toBe('landscape');
  });

  test('GET /api/keywords/:id with a missing id returns 404', async () => {
    const res = await request(app).get(`/api/keywords/${missingId}`);
    expect(res.status).toBe(404);
  });

  test('GET /api/keywords/:id/artworks returns 200 with an array', async () => {
    const res = await request(app).get(`/api/keywords/${keywordId}/artworks`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ---- Get by id: artwork_keywords ----

  test('GET /api/artworkKeywords/:id with invalid ObjectId returns 400', async () => {
    const res = await request(app).get(`/api/artworkKeywords/${badId}`);
    expect(res.status).toBe(400);
  });

  test('GET /api/artworkKeywords/:id with a valid id returns 200', async () => {
    const res = await request(app).get(`/api/artworkKeywords/${linkId}`);
    expect(res.status).toBe(200);
    expect(res.body.artworkId).toBeDefined();
  });

  test('GET /api/artworkKeywords/:id with a missing id returns 404', async () => {
    const res = await request(app).get(`/api/artworkKeywords/${missingId}`);
    expect(res.status).toBe(404);
  });

  // ---- Get by id: users (admin) ----

  test('GET /api/users/:id returns 401 when not authenticated', async () => {
    const res = await request(app).get(`/api/users/${userId}`);
    expect(res.status).toBe(401);
  });

  test('GET /api/users/:id (admin) returns 200 with the user', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set('x-test-auth', 'admin');
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('admin');
  });

  test('GET /api/users/:id (admin) with invalid ObjectId returns 400', async () => {
    const res = await request(app)
      .get(`/api/users/${badId}`)
      .set('x-test-auth', 'admin');
    expect(res.status).toBe(400);
  });

  test('GET /api/users/:id (admin) with a missing id returns 404', async () => {
    const res = await request(app)
      .get(`/api/users/${missingId}`)
      .set('x-test-auth', 'admin');
    expect(res.status).toBe(404);
  });

  // ---- Search (GET with query params) ----

  test('GET /api/artworks/search returns 200 with an array', async () => {
    const res = await request(app).get('/api/artworks/search');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/artworks/search?q=... returns 200 with an array', async () => {
    const res = await request(app).get('/api/artworks/search?q=landscape');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/artworks/search with filters returns 200 with an array', async () => {
    const res = await request(app).get(
      '/api/artworks/search?q=test&period=Baroque&type=Painting&artistId=6528a1b2c3d4e5f6a7b8c9d0'
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/artworks/search with an invalid year returns 400', async () => {
    const res = await request(app).get('/api/artworks/search?year=abc');
    expect(res.status).toBe(400);
  });

  test('GET /api/artworks/search with an invalid artistId returns 400', async () => {
    const res = await request(app).get('/api/artworks/search?artistId=not-an-id');
    expect(res.status).toBe(400);
  });
});

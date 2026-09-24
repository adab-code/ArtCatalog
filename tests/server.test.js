// Jest + Supertest integration tests for the GET routes.
// The database module is mocked so the tests run without a live MongoDB.
// The API is exported from server.js as an Express app (no port is opened).

// Making the tests deterministic: the app imports dotenv before anything else,
// so each test file can set NODE_ENV before requiring the app. In test mode
// server.js skips sessions/passport, which keeps these tests free of OAuth.
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
  };

  // Mocked module surface. initDb resolves because server.js calls it inside a
  // try/catch when a real connection is attempted; here it just resolves.
  return {
    initDb: jest.fn().mockResolvedValue({}),
    closeDb: jest.fn(),
    getDatabase: jest.fn(() => ({
      collection: (name) => ({
        // Supports the "find().toArray()" pattern used by the controllers.
        find: () => ({ toArray: async () => data[name] || [] }),
        // Supports the "findOne(...)" pattern used by the controllers.
        findOne: async () => (data[name] && data[name][0]) || null,
      }),
    })),
  };
});

const request = require('supertest');
const app = require('../server');

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

  test('GET /api/artists returns 200 with an array', async () => {
    const res = await request(app).get('/api/artists');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/artists?country=Spain returns 200 with an array', async () => {
    const res = await request(app).get('/api/artists?country=Spain');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/artworks returns 200 with an array', async () => {
    const res = await request(app).get('/api/artworks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/keywords returns 200 with an array', async () => {
    const res = await request(app).get('/api/keywords');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/artworkKeywords returns 200 with an array', async () => {
    const res = await request(app).get('/api/artworkKeywords');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/users returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me returns 401 with authenticated false by default', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.authenticated).toBe(false);
  });

  test('GET /api/artists/:id with invalid ObjectId returns 400', async () => {
    const res = await request(app).get('/api/artists/not-a-valid-id');
    expect(res.status).toBe(400);
  });

  test('GET /api/artists/:id with valid ObjectId returns 200', async () => {
    const res = await request(app).get('/api/artists/6528a1b2c3d4e5f6a7b8c9d0');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });

  test('GET /api/artists/:id/artworks returns 200 with an array', async () => {
    const res = await request(app).get('/api/artists/6528a1b2c3d4e5f6a7b8c9d0/artworks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/artworks/:id/keywords returns 200 with an array', async () => {
    const res = await request(app).get('/api/artworks/6528a1b2c3d4e5f6a7b8c9d1/keywords');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/keywords/:id/artworks returns 200 with an array', async () => {
    const res = await request(app).get('/api/keywords/6528a1b2c3d4e5f6a7b8c9d2/artworks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

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
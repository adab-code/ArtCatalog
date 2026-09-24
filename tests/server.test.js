// Jest + Supertest integration tests for the GET routes.
// The database module is mocked so the tests run without a live MongoDB.
// The API is exported from server.js as an Express app (no port is opened).

process.env.NODE_ENV = 'test';

// Replace data/database with an in-memory fake before the app is loaded.
jest.mock('../data/database', () => {
  const { ObjectId } = require('mongodb');

  // Small in-memory fixtures returned by the mocked collection.
  const data = {
    artists: [{ _id: new ObjectId(), name: 'Test Artist' }],
    artworks: [{ _id: new ObjectId(), title: 'Test Artwork' }],
    keywords: [{ _id: new ObjectId(), name: 'Test Keyword' }],
    artworkKeywords: [
      { _id: new ObjectId(), artworkId: new ObjectId(), keywordId: new ObjectId() },
    ],
  };

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

  test('GET /api/auth/status returns authenticated false by default', async () => {
    const res = await request(app).get('/api/auth/status');
    expect(res.status).toBe(200);
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
});
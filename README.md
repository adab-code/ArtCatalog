# ArtCatalog

CSE 341 Final project

Art catalog REST API built with **Express + MongoDB**. It provides CRUD for
artists, artworks, keywords and their relationships (artwork-keywords),
GitHub OAuth2 login, rate limiting, and auto-generated Swagger documentation.

## Project Structure

```
├── server.js              # app setup, middleware, sessions, DB init, listen
├── swagger.js             # generates swagger.json (swagger-autogen)
├── swagger.json           # documentation served at /api-docs (generated)
├── routes.rest             # REST Client test requests
├── DATABASE.md            # step-by-step MongoDB Atlas setup (create this DB)
├── .env.example           # example configuration (committed)
├── .env                   # secrets and configuration (git-ignored)
├── routes/                # route definitions per entity
│   ├── index.js           # central router: mounts /api-docs and /api/*
│   ├── artists.js
│   ├── artworks.js
│   ├── keywords.js
│   ├── artworkKeywords.js
│   ├── users.js
│   ├── auth.js
│   └── swagger.js
├── controllers/           # logic per entity; uses getDatabase()
│   ├── artists.js
│   ├── artworks.js
│   ├── keywords.js
│   ├── artworkKeywords.js
│   ├── users.js
│   └── auth.js
├── middleware/
│   ├── auth.js            # isAuthenticated, isOwnerOrAdmin, isAdmin
│   ├── validation.js      # validation rules and ObjectId checks
│   └── errorHandler.js    # central JSON error handler
├── config/
│   └── passport.js        # GitHub strategy, serialize/deserialize user
├── data/
│   └── database.js        # MongoClient connection: initDb, getDatabase
├── tests/                 # Jest + Supertest tests for all GET routes
├── .gitignore
└── package.json
```

## Main Packages

- [express](https://www.npmjs.com/package/express)
- [mongodb](https://www.npmjs.com/package/mongodb)
- [dotenv](https://www.npmjs.com/package/dotenv)
- [passport](https://www.npmjs.com/package/passport) / [passport-github2](https://www.npmjs.com/package/passport-github2)
- [express-session](https://www.npmjs.com/package/express-session) / [connect-mongo](https://www.npmjs.com/package/connect-mongo)
- [helmet](https://www.npmjs.com/package/helmet), [cors](https://www.npmjs.com/package/cors), [express-mongo-sanitize](https://www.npmjs.com/package/express-mongo-sanitize), [express-rate-limit](https://www.npmjs.com/package/express-rate-limit)
- [express-validator](https://www.npmjs.com/package/express-validator)
- [swagger-autogen](https://www.npmjs.com/package/swagger-autogen), [swagger-ui-express](https://www.npmjs.com/package/swagger-ui-express)
- Dev: [jest](https://www.npmjs.com/package/jest), [supertest](https://www.npmjs.com/package/supertest), [nodemon](https://www.npmjs.com/package/nodemon)

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A MongoDB database (Atlas or local), database name recommended: `ArtCatalog`
- (Optional, for GitHub login) a GitHub OAuth app: GitHub → Settings → Developer
  settings → OAuth Apps. Until it is configured you can test locally with the
  dev-login route described below.

### Configuration

Copy `.env.example` to `.env` and fill in your real values:

```env
PORT=3000
SESSION_SECRET=change_this_session_secret
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ArtCatalog
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
ADMIN_GITHUB_IDS=your_github_user_id_here
```

Step-by-step instructions for creating the MongoDB Atlas database (cluster,
database user, indexes) are in **`DATABASE.md`**.

### Install and run

```bash
npm install
npm start          # run the server
npm run dev        # run with nodemon (auto-restart on changes)
npm run genSwagger # regenerate swagger.json from the routes
npm test           # run the Jest tests
```

The API is served at `http://localhost:3000` and the Swagger docs at
`http://localhost:3000/api-docs`.

## Database collections

On startup the API **auto-creates** the 5 collections plus the unique indexes
(`keywords.keyword` and `artwork_keywords.(artworkId, keywordId)`) — you should
see `Database schema ready (collections and unique indexes)` in the console.
No manual setup is required (details in `DATABASE.md`).

| Collection | Description |
|---|---|
| `artists` | `firstName`, `middleName`, `lastName`, `birthDate`, `deathDate`, `country`, `locality`, `createdBy`, `createdAt` |
| `artworks` | `title`, `year`, `period`, `type`, `medium`, `dimensions`, `description`, `file`, `artistId`, `createdBy`, `createdAt` |
| `keywords` | `keyword` (lowercase, unique), `createdBy`, `createdAt` |
| `artwork_keywords` | links an `artworkId` with a `keywordId` (`addedBy`, `addedAt`); unique on `(artworkId, keywordId)` |
| `users` | created automatically on GitHub login: `oauthProvider`, `oauthId`, `displayName`, `email`, `role`, `createdAt`, `lastLoginAt` |

### Data integrity rules

- References are checked before saving: an artwork requires an existing
  `artistId`; a link requires an existing `artworkId` and `keywordId`
  (`400` otherwise).
- Deleting an artist that still has artworks returns `409`.
- Deleting an artwork or a keyword also deletes its `artwork_keywords` links
  (no orphan records).
- `keywords.keyword` is stored lowercase and must be unique (`409` on
  duplicate).
- `artwork_keywords` is unique on `(artworkId, keywordId)` so the same
  keyword can only be applied once to an artwork (`409` on duplicate).

### HTTP status codes

| Code | Meaning |
|---|---|
| 200 | OK (list / single result) |
| 201 | Created (POST) |
| 204 | Deleted (no body) |
| 400 | Invalid ObjectId or failed validation / bad reference |
| 401 | Not logged in |
| 403 | Logged in but not the owner and not an admin |
| 404 | Resource not found |
| 409 | Conflict (duplicate or delete prevented by data rules) |
| 500 | Server error (logged, never leaks details) |

## API Endpoints

All endpoints (except swagger) live under `/api`. Protected routes require a
valid session. Until GitHub OAuth is configured, log in locally with
`GET /api/auth/dev-login` (see "Local development" below); once configured,
login via `/api/auth/github`.

### Access rules

| Route type | Who can call it |
|---|---|
| GET on `artists`, `artworks`, `keywords`, `artworkKeywords` | Public (no login needed) |
| POST on those collections | Any logged-in user (`401` if no session) |
| PUT and DELETE on those collections | The user who created the document (`createdBy` / `addedBy`) or an admin (`401` if no session, `403` if not owner/admin) |
| All `/users` routes | Admin only (`401` / `403`) |
| `/auth/*` routes | Public (`/auth/me` returns `401` if there is no session) |

List routes accept simple query filters (`?country=`, `?period=`, `?type=`,
`?year=`, `?artistId=`, `?artworkId=`, `?keywordId=`).

### Artists

| Method | Route | Description |
|---|---|---|
| GET | `/api/artists` | List all (optional `?country=`) |
| GET | `/api/artists/:id` | Get one |
| POST | `/api/artists` | Create (login required) |
| PUT | `/api/artists/:id` | Update (owner or admin) |
| DELETE | `/api/artists/:id` | Delete (owner or admin; `409` if the artist still has artworks) |

### Artworks

| Method | Route | Description |
|---|---|---|
| GET | `/api/artworks` | List all (`?period=`, `?type=`, `?year=`, `?artistId=`) |
| GET | `/api/artworks/:id` | Get one |
| POST | `/api/artworks` | Create (login required) |
| PUT | `/api/artworks/:id` | Update (owner or admin) |
| DELETE | `/api/artworks/:id` | Delete + its keyword links (owner or admin) |

### Keywords

| Method | Route | Description |
|---|---|---|
| GET | `/api/keywords` | List all |
| GET | `/api/keywords/:id` | Get one |
| POST | `/api/keywords` | Create (login required) |
| PUT | `/api/keywords/:id` | Update (owner or admin) |
| DELETE | `/api/keywords/:id` | Delete + its links (owner or admin) |

### Artwork-Keywords (links)

| Method | Route | Description |
|---|---|---|
| GET | `/api/artworkKeywords` | List all (`?artworkId=`, `?keywordId=`) |
| GET | `/api/artworkKeywords/:id` | Get one |
| POST | `/api/artworkKeywords` | Create (login required; `400` if artwork/keyword missing, `409` on duplicate) |
| PUT | `/api/artworkKeywords/:id` | Update (owner or admin) |
| DELETE | `/api/artworkKeywords/:id` | Delete (owner or admin) |

### Users (admin only)

| Method | Route | Description |
|---|---|---|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get one user |
| PUT | `/api/users/:id` | Change a user's role (`"user"` / `"admin"`) |
| DELETE | `/api/users/:id` | Delete a user |

### Auth

| Method | Route | Description |
|---|---|---|
| GET | `/api/auth/github` | Start GitHub OAuth2 login |
| GET | `/api/auth/github/callback` | OAuth2 callback (redirect from GitHub) |
| GET | `/api/auth/login/failed` | Failed login response (401) |
| GET | `/api/auth/me` | "Who am I": 200 with the user, or 401 if logged out |
| GET | `/api/auth/logout` | End the session |
| GET | `/api/auth/dev-login` | **Development only** (`NODE_ENV=development`): logs you in as an admin without GitHub |

### Local development (before GitHub OAuth is configured)

While `NODE_ENV=development`, the route `GET /api/auth/dev-login` starts a
session as an admin user ("Dev Admin"), so every protected endpoint
(POST/PUT/DELETE and `/api/users`) can be exercised locally. Run it in the
browser or with curl (it sets the `connect.sid` cookie):

```bash
curl -c cookies.txt http://localhost:3000/api/auth/dev-login
```

The route only exists when `NODE_ENV=development` and is filtered out of the
generated Swagger doc. Once GitHub is set up in `.env`, you can remove it.

## Testing

`npm test` runs the Jest + Supertest suite. The tests mock the database module
(`data/database.js`) so they run without a live MongoDB instance and cover all
public GET routes plus the auth guard behavior.

## REST Client

Every endpoint has a sample request in `routes.rest` (open it with the
[REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
VS Code extension and click "Send Request").

## Status & suggested improvements

The core requirements are implemented and working. Ideas to improve or extend
the project (ordered by value):

- Advanced search: `GET /artworks/search?period=...&keyword=...&yearFrom=...`
- Nested/joined responses with MongoDB `$lookup` (e.g. artist + their artworks,
  artwork + its keywords)
- Pagination and sorting on list routes (`?page=&limit=&sort=`)
- A seed script that loads sample artists, artworks and keywords for demos
- Unit tests for POST/PUT/DELETE routes (currently only GET routes are tested)
- CI with GitHub Actions to run `npm test` on every pull request
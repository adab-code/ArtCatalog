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
- A GitHub OAuth app (GitHub → Settings → Developer settings → OAuth Apps) for login

### Configuration

Copy `.env.example` to `.env` and fill in your real values:

```env
PORT=3000
SESSION_SECRET=change_this_session_secret
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ArtCatalog
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
```

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

| Collection | Description |
|---|---|
| `artists` | `name`, `bio`, `nationality`, `birthYear`, `deathYear` |
| `artworks` | `title`, `description`, `artistId`, `year`, `medium`, `imageUrl` |
| `keywords` | `name`, `description` |
| `artworkKeywords` | links an `artworkId` with a `keywordId` |
| `users` | created automatically when a user logs in via GitHub |

## API Endpoints

All endpoints (except swagger) live under `/api`. Protected routes require a
valid session (login with GitHub via `/api/auth/github`).

### Artists

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/artists` | public | List all artists |
| GET | `/api/artists/:id` | public | Get one artist |
| POST | `/api/artists` | login required | Create an artist |
| PUT | `/api/artists/:id` | login required | Update an artist |
| DELETE | `/api/artists/:id` | admin required | Delete an artist |

### Artworks

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/artworks` | public | List all artworks |
| GET | `/api/artworks/:id` | public | Get one artwork |
| POST | `/api/artworks` | login required | Create an artwork |
| PUT | `/api/artworks/:id` | login required | Update an artwork |
| DELETE | `/api/artworks/:id` | admin required | Delete an artwork |

### Keywords

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/keywords` | public | List all keywords |
| GET | `/api/keywords/:id` | public | Get one keyword |
| POST | `/api/keywords` | login required | Create a keyword |
| PUT | `/api/keywords/:id` | login required | Update a keyword |
| DELETE | `/api/keywords/:id` | admin required | Delete a keyword |

### Artwork-Keywords (links)

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/artworkKeywords` | public | List all links |
| GET | `/api/artworkKeywords/:id` | public | Get one link |
| POST | `/api/artworkKeywords` | login required | Create a link |
| PUT | `/api/artworkKeywords/:id` | login required | Update a link |
| DELETE | `/api/artworkKeywords/:id` | admin required | Delete a link |

### Users

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/users` | login required | List all users |
| GET | `/api/users/:id` | login required | Get one user |
| PUT | `/api/users/:id` | owner or admin | Update a user profile |
| DELETE | `/api/users/:id` | owner or admin | Delete a user |

### Auth

| Method | Route | Description |
|---|---|---|
| GET | `/api/auth/github` | Start GitHub OAuth2 login |
| GET | `/api/auth/github/callback` | OAuth2 callback (redirect from GitHub) |
| GET | `/api/auth/login/failed` | Failed login response (401) |
| GET | `/api/auth/logout` | End the session |
| GET | `/api/auth/status` | Current authentication status |

## Testing

`npm test` runs the Jest + Supertest suite. The tests mock the database module
(`data/database.js`) so they run without a live MongoDB instance and cover all
public GET routes plus the auth guard behavior.

## REST Client

Every endpoint has a sample request in `routes.rest` (open it with the
[REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
VS Code extension and click "Send Request").
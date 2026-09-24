# ArtCatalog

CSE 341 Final project

## Project Structure

```
├── server.js               # app setup, middleware, sessions, DB init, listen
├── swagger.js              # generates swagger.json (swagger-autogen)
├── swagger.json            # documentation served at /api-docs
├── routes.rest             # REST Client test requests
├── .env                    # secrets and configuration (git-ignored)
├── routes/                 # route definitions per entity
│   ├── artists.js
│   ├── artworks.js
│   ├── keywords.js
│   ├── artworkKeywords.js
│   ├── auth.js
│   └── swagger.js
├── controllers/            # logic per entity; uses getDatabase()
│   ├── artists.js
│   ├── artworks.js
│   ├── keywords.js
│   ├── artworkKeywords.js
│   └── auth.js
├── middleware/             # validate, isAuthenticated, isAdmin, errorHandler
│   ├── auth.js
│   ├── validation.js
│   └── errorHandler.js
├── data/
│   └── database.js         # MongoClient connection: initDb, getDatabase
├── .gitignore
└── package.json
```

## Main Packages

- express
- mongodb
- dotenv
- passport / passport-github2
- express-session / connect-mongo
- helmet, cors, express-mongo-sanitize, express-rate-limit
- swagger-autogen, swagger-ui-express
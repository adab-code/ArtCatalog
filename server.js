// Main application entry point.
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const sanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const bodyParser = require('body-parser');

const { initDb } = require('./data/database');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Register the GitHub OAuth strategy and user (de)serialization.
// NO definas la estrategia aquí; solo impórtala.
require('./config/passport');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// ---- Security and request parsing middleware ----
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(sanitize());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message: { message: 'Too many requests, please try again later.' },
  })
);

// ---- Sessions and passport ----
if (process.env.NODE_ENV !== 'test' && process.env.SESSION_SECRET) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
      cookie: { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 1000 },
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());
}

// --- CORS headers ---
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Z-Key, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );
  next();
});
app.use(cors({ methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'] }));
app.use(cors({ origin: '*' }));

// ---- Routes ----
app.use('/', require('./routes'));

// --- ROOT ROUTE (login status) ---
app.get('/', (req, res) => {
  if (req.user) {
    const name = req.user.displayName || req.user.username || 'Usuario';
    res.send(`Logged in as ${name} (Role: ${req.user.role})`);
  } else {
    res.send('Logged Out');
  }
});

// ---- Error handling ----
process.on('uncaughtException', (err, origin) => {
  console.log(
    process.stderr.fd,
    `Caught exception: ${err}\n` + `Exception origin: ${origin}`
  );
});

app.use(notFound);
app.use(errorHandler);

async function startServer() {
  try {
    await initDb(process.env.MONGODB_URI);
    app.listen(PORT, () => {
      console.log(`ArtCatalog API running on http://localhost:${PORT}`);
      console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error('Failed to initialize the database:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
// Passport configuration for GitHub OAuth2.
// Defines serialize/deserialize so the logged-in user can be stored in and
// restored from the session, and registers the GitHub strategy that creates
// (or finds) the user document in the "users" collection.

const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const { ObjectId } = require('mongodb');
const { getDatabase } = require('../data/database');

// Store only the user id in the session.
passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

// On each request, load the full user document from the DB using the id
// saved in the session.
passport.deserializeUser(async (id, done) => {
  try {
    const user = await getDatabase().collection('users').findOne({ _id: new ObjectId(id) });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Register the GitHub strategy only when all required env vars are present.
if (
  process.env.GITHUB_CLIENT_ID &&
  process.env.GITHUB_CLIENT_SECRET &&
  process.env.GITHUB_CALLBACK_URL
) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL,
      },
      // Verified callback: find the user by GitHub id or create a new one.
      async (accessToken, refreshToken, profile, done) => {
        try {
          const db = getDatabase();
          let user = await db.collection('users').findOne({ githubId: String(profile.id) });

          if (!user) {
            // First-time sign in: build the user document from the GitHub profile.
            const newUser = {
              githubId: String(profile.id),
              username: profile.username,
              name: profile.displayName || profile.username,
              email:
                profile.emails && profile.emails[0] ? profile.emails[0].value : null,
              avatar:
                profile.photos && profile.photos[0] ? profile.photos[0].value : null,
              role: 'user',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            const result = await db.collection('users').insertOne(newUser);
            user = { _id: result.insertedId, ...newUser };
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

module.exports = passport;
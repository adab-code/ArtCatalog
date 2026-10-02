// Passport configuration for GitHub OAuth2.

const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const { ObjectId } = require('mongodb');
const { getDatabase } = require('../data/database');

const adminGithubIds = (process.env.ADMIN_GITHUB_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await getDatabase()
      .collection('users')
      .findOne({ _id: new ObjectId(id) });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

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
      async (accessToken, refreshToken, profile, done) => {
        try {
          const db = getDatabase();
          const oauthId = String(profile.id);
          let user = await db
            .collection('users')
            .findOne({ oauthProvider: 'github', oauthId });

          if (!user) {
            const newUser = {
              oauthProvider: 'github',
              oauthId,
              displayName: profile.displayName || profile.username || 'Usuario',
              email: profile.emails?.[0]?.value || null,
              role: adminGithubIds.includes(oauthId) ? 'admin' : 'user',
              createdAt: new Date(),
              lastLoginAt: new Date(),
            };
            const result = await db.collection('users').insertOne(newUser);
            user = { _id: result.insertedId, ...newUser };
          } else {
            await db
              .collection('users')
              .updateOne(
                { _id: user._id },
                { $set: { lastLoginAt: new Date() } }
              );
            user.lastLoginAt = new Date();
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
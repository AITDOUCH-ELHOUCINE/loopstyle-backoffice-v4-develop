/**
 * Module dependencies.
 */
const passport = require('passport');
const mongoose = require('mongoose');

const { model } = mongoose;
const LocalStrategy = require('passport-local').Strategy;

const User = model('User');
const Admin = model('Admin');

module.exports = () => {
  // Use User local strategy
  passport.use(
    'user',
    new LocalStrategy(
      {
        usernameField: 'username',
        passwordField: 'password',
      },
      async (username, password, done) => {
        try {
          let connectedU = null;

          /**
           * Get user
           */
          connectedU = await User.findOne({
            $or: [
              {
                username: username.toLowerCase(),
              },
              {
                email: username.toLowerCase(),
              },
            ],
          });

          if (connectedU && connectedU.authenticate(password)) {
            return done(null, connectedU);
          }

          return done(null, false);
        } catch (err) {
          return done(err);
        }
      },
    ),
  );

  // Use Bo local strategy
  passport.use(
    'bo',
    new LocalStrategy(
      {
        usernameField: 'username',
        passwordField: 'password',
      },
      async (username, password, done) => {
        try {
          let connectedU = null;

          /**
           * Get user
           */
          connectedU = await Admin.findOne({
            $or: [
              {
                username: username.toLowerCase(),
              },
              {
                email: username.toLowerCase(),
              },
            ],
          });

          if (connectedU && connectedU.authenticate(password)) {
            return done(null, connectedU);
          }

          return done(null, false);
        } catch (err) {
          return done(err);
        }
      },
    ),
  );
};

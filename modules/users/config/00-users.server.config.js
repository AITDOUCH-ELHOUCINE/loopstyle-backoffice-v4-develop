/* eslint-disable import/no-dynamic-require,global-require */

/**
 * Module dependencies.
 */
const passport = require('passport');
const mongoose = require('mongoose');

const { model } = mongoose;
const { resolve, join } = require('path');

const User = model('User');
const Admin = model('Admin');
const config = require('@config/index');

/**
 * Module init function.
 */
module.exports = (app) => {
  // Serialize sessions
  passport.serializeUser((user, done) => {

    if (user.is_admin === true) {
      done(null, {
        id: user.id,
        type: 'admin',
      });
    }else if (user.is_user === true) {
      done(null, {
        id: user.id,
        type: 'user',
      });
    } else {
      done(null, {
        id: user.id,
        type: 'guest',
      });
    }
  });

  // Deserialize sessions
  passport.deserializeUser(async (data, done) => {
    try {
      let connectedU = null;
      switch (data.type) {
        case 'admin':
          connectedU = await Admin.findOne({
            _id: data.id,
            accountEnabled: true,
            roles: 'admin',
          }).select(config.app.profile.private_attrs.map((attr) => `-${attr}`).join(' '));

          break;
        default:
          connectedU = await User.findOne({
            _id: data.id,
            accountEnabled: true,
            roles: 'user',
          }).select(config.app.profile.private_attrs.map((attr) => `-${attr}`).join(' '));

          break;

      }
      if (connectedU) {
        connectedU.lastUsageDate = Date.now();
        connectedU.save();
      }
      done(null, connectedU);
    } catch (err) {
      done(err);
    }
  });

  // Initialize strategies
  config.utils.getGlobbedPaths(join(__dirname, './strategies/**/*.js')).forEach((strategy) => {
    require(resolve(strategy))(config);
  });

  // Add passport's middleware
  app.use(passport.initialize());
  app.use(passport.session());
};

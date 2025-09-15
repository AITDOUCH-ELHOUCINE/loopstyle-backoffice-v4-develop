/**
 * Module dependencies.
 */
const mongoose = require('mongoose');
const passport = require('passport');


const User = mongoose.model('User');
const config = require('@config/index');
const jwt = require('jsonwebtoken');
const validationsHelper = require('@config/validations');
const errorHandler = require('@modules/core/controllers/errors.server.controller');
// const config = require('@config/index');

// URLs for which user can't be redirected on signin
const noReturnUrls = ['/authentication/signin', '/authentication/signup'];

/**
 * Signup
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.signup = async function signup(req, res, next) {

  // For security measurement we sanitize the user object
  const b = User.sanitize(req.body);

  // Init Variables
  const user = new User({
    ...b,
  });

  const { hooks } = validationsHelper;

  await hooks.onInit(user);

  // Add missing user fields
  user.provider = 'local';

  try {
    // await user.save();
    // disable email validation (28-06-2022)
    // hooks.onSignup(user, req);

    // validate user at signup
    await hooks.validateAccount(user);

    await user.save();

  } catch (err) {


    switch (true) {
      case err.code === 11000:
        return res.status(400).json({
          message: req.t('USER_ALREADY_EXISTS'),
        });
      case err.name === 'ValidationError':
        return res.status(400).json({
          message: err.message,
        });
      default:
        return next(err);
    }
  }

  req.user = user;


  /**
  * Login user directly    
  */
  return req.login(user, (err_) => {
    if (err_) {
      return next(err_);
    }
    return next();
  });
};

/**
 * Succes UseSignup
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.successSignup = async function me(req, res) {
  const { user } = req;

  const result={...user.toJSON({})};


  if (config.jwt.enabled) {
    const { key, alg, expiresIn } = config.jwt;
    result.token = jwt.sign({ u: user._id }, key.private, {
      algorithm: alg,
      expiresIn,
    });
  }

  return res.json(result);

};
/**
 * Signin after passport authentication
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.signin = async function signin(req, res, next) {
  passport.authenticate('user', (err, user /* , info */) => {
    if (err || !user) {
      return res.status(401).json({
        ok: false,
        message: req.t('WRONG_CREDENTIALS'),
      });
    }

    const { utils, hooks } = validationsHelper;

    try {
      utils.isValidated(user);
    } catch (err_) {
      return res.status(401).json({
        message: req.t(err_.code, err_.data),
        ok: false,
      });
    }

    if (!user.accountEnabled) {
      return res.status(401).json({
        message: 'Votre compte n\'est pas encore activé',
        ok: false,
      });
    }

    return req.login(user, async (err_) => {
      if (err_) {
        return res.status(400).send(err_);
      }


      await hooks.destroyOldProfileSession(user, req);

      await hooks.setNewProfileSession(user, req);

      await user.save();

      return next(null);
    });
  })(req, res, next);
};

/**
 * Signout
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.signout = async function signout(req, res) {
  req.logout();

  req.session.destroy();
  
  // res.redirect(config.app.pages.login || '/');
  res.status(200).json({
    ok: true,
  });
};

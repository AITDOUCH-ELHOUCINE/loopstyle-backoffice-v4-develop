/**
 * Module dependencies.
 */
const { resolve } = require('path');
const mongoose = require('mongoose');

const _ = require('lodash');
const jwt = require('jsonwebtoken');
const rest = require('@packages/rest');
const config = require('@config/index');
const validationModule = require('@config/validations');
const { ok } = require('assert');

const { modules } = config.files.server.modules;

// eslint-disable-next-line import/no-dynamic-require
const errorHandler = require(resolve('./modules/core/controllers/errors.server.controller'));

const User = mongoose.model('User');

/**
 * Sanitize the query
 * @controller Sanitize Query
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.sanitizeQuery = async function sanitizeQuery(req, res, next) {
  try {
    return await rest.sanitizeQuery('User', { roles: 'user' })(req, res, next);
  } catch (e) {
    return next(e);
  }
};


/**
 * Update Onesignal tags
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.updateOnesignalTags = async function updateOnesignalTags(req, res, next) {

  const {user} = req;
  try {
    await user.update_onesignal_device();
    return next();
  } catch (e) {
    console.error(e.message || e);
    return next();
  }
};

/**
 * Sanitize the bpdy
 * @controller Sanitize Query
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.sanitizeBody = async function sanitizeBody(req, res, next) {
  try {
    const protected_attrs = config.app.profile.protected_attrs || [];

    return await rest.sanitizeBody(protected_attrs)(req, res, next);
  } catch (e) {
    return next(e);
  }
};

/**
 * Update user details
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.update = async function update(req, res) {
  try {


    // Init Variables
    let { user } = req;
    console.log('Update profile', user && user.email);

    // Guard: ensure body is an object
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ ok: false, message: 'Invalid payload' });
    }

    const body = req.body || {};

    // For security measurement we sanitize the user object
    const b = User.sanitize(body) || {};

    // Safely handle nested name updates
    if (b.name && typeof b.name === 'object') {
      if (!user.name) {
        user.name = {};
      }
      if (Object.prototype.hasOwnProperty.call(b.name, 'first')) {
        user.name.first = b.name.first;
      }
      if (Object.prototype.hasOwnProperty.call(b.name, 'last')) {
        user.name.last = b.name.last;
      }
      if (typeof user.markModified === 'function') {
        user.markModified('name');
      }
      delete b.name;
    }

    // Merge existing user with remaining fields
    if (b && Object.keys(b).length > 0) {
      user.set(b);
    }

    try {
      user = await user.save();
    } catch (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err),
      });
    }

    return res.json(
      user.toJSON({
        virtuals: true,
      }),
    );

  } catch (e) {
    console.error(e && (e.stack || e.message) || e);
    return res.status(400).json({ok: false, message: e && e.message ? e.message : 'Update failed'});
  };
};

/**
 * Get profile picture
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.getProfilePicture = async function getProfilePicture(req, res) {
  res.redirect(req.user.profileImageUrl);
};

/**
 * Update profile picture
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.uploadProfilePicture = async function uploadProfilePicture(req, res, next) {
  const Grid = mongoose.model('Grid');
  const { file, user } = req;
  const { file: f } = file;
  const { _id: userId } = user;
  const { _id: fId } = f;

  try {
    let gridFile = await Grid.findOne({
      _id: fId,
    });
    gridFile.set('metadata', {
      owner: userId,
      type: 'profile',
    });
    gridFile = await gridFile.save();

    req.user.set('picture', gridFile);
    req.user = await req.user.save();
  } catch (e) {
    return next(e);
  }

  return res.json({
    ok: true,
  });
};

/**
 * Filter the profile picture mimeTypes
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.profilePictFilter = async function profilePictFilter(req, file, cb) {
  if (config.app.profile.image.accept.lastIndexOf(file.mimetype) < 0) {
    return cb(new Error(req.t('USER_PROFILE_PIC_INVALID')));
  }

  return cb(null, true);
};

/**
 * Send User
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.me = async function me(req, res) {
  let { $expand } = req.query;
  const { $select, $jwt } = req.query;
  const { iams = [] ,user} = req;


  let result = req.user ? req.user.json() : null;

  if (!result) {
    return res.json(result);
  }

  const { _id: id } = result;

  if ($expand) {
    $expand = $expand.split(',').map((attr) => attr.trim());

    // if ($expand.includes('iams')) {
    //   result.iams = iams.map((iam) => {
    //     const { resource, permission, ...toSend } = iam;
    //     return toSend;
    //   });
    // }
  }

  // if (!result.iams) {
  //   result.iams = iams.map((iam) => iam.iam);
  // }

  if ($select) {
    result = _.pick(result, $select.split(','), 'id');
  }

  if (config.jwt.enabled) {
    const { key, alg, expiresIn } = config.jwt;
    result.token = jwt.sign({ u: id }, key.private, {
      algorithm: alg,
      expiresIn,
    });
  }

  return res.json(result);
};
/**
 * Confirmation
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.confirm = async function confirm(req, res) {
  let user;
  const { query } = req;

  if (!query.uid) {
    return res.status(404).send({
      message: req.t('USER_NOT_FOUND'),
    });
  }

  try {
    user = await User.findById(query.uid);
  } catch (e) {
    return res.status(404).send({
      message: req.t('USER_NOT_FOUND'),
    });
  }

  if (!user) {
    return res.status(404).send({
      message: req.t('USER_NOT_FOUND'),
    });
  }

  const { utils } = validationModule;

  try {
    await utils.tryValidate(user, query.type, query.code);
  } catch (e) {
    if (e.code === 'VALIDATIONS!INVALID_CODE') {
      await user.save();
    }

    return res.status(400).send({
      message: req.t(e.code, e.data),
    });
  }

  const baseURL = `${req.protocol}://${req.get('host')}`;

  user = await user.save();

  return res.format({
    'text/html': () => {
      res.render(`${modules}/users/views/email-confirmed`, {
        app: {
          name: config.app.title,
          url: baseURL,
        },
        user,
      });
    },
    'application/json': () => {
      res.json({
        ok: true,
      });
    },
    default() {
      res.send('Email confirmed');
    },
  });
};

/**
 * Resend the confirmation code
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.resend = async function resend(req, res) {
  let user;
  const { query } = req;

  if (!query.uid) {
    return res.status(404).send({
      message: req.t('USER_NOT_FOUND'),
    });
  }

  try {
    user = await User.findById(query.uid);
  } catch (e) {
    return res.status(404).send({
      message: req.t('USER_NOT_FOUND'),
    });
  }

  const { utils } = validationModule;

  try {
    await utils.tryNotify(user, query.type, req);
  } catch (e) {
    return res.status(400).send({
      message: req.t(e.code, {
        type: query.type,
      }),
    });
  }

  user = await user.save();

  return res.json({
    ok: true,
  });
};

/**
 * send delete account request
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.sendDeleteAccountRequest = async function sendDeleteAccountRequest(req, res, next) {
  try {
    const { user } = req;
    
    const AdminModel = mongoose.model('Admin');
    await AdminModel.notifyAdmins('deleteAccount', user, {}, req);

    user.DeleteRequestedAt = new Date();
    await user.save();
    
    return res.json({
      ok: true,
      message: req.t('ACCOUNT_DELETE_REQUEST_SENT'),
    });
  } catch (e) {
    return next(e);
  }
};
const mongoose = require('mongoose');
const config = require('@config/index');
const svc = require('../services/user.server.service');

const Notification = mongoose.model('Notification');

/**
 * Check if the module "Notification" is up and running
 * @controller Check "Notification" module
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 */
exports.ping = async function ok(req, res) {
  res.status(200).json({
    ok: true,
    message: req.t('NOTIFICATION_PING_SUCCESS'),
  });
};

/**
 * Sanitize the query
 * @controller Sanitize Query
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.sanitizeQuery = async function sanitizeQuery(req, res, next) {
  try {
    const { user } = req;
    return await svc.sanitizeQuery('Notification', {
      isDeleted: false,
      $or: [
        { type: 'broadcast_notification' },
        {users: user._id},
      ],
    })(req, res, next);
  } catch (e) {
    return next(e);
  }
};

/**
 * Sanitize the Body
 * @controller Sanitize Body
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.sanitizeBody = async function sanitizeBody(req, res, next) {
  try {
    const protected_attrs = config.app.NOTIFICATION.protected_attrs || [];

    return await svc.sanitizeBody(protected_attrs)(req, res, next);
  } catch (e) {
    return next(e);
  }
};

/**
 * Notifications List
 * @controller  "Notification"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.listNotification = async function listNotification(req, res, next) {
  try {
    return await svc.list(req, res, next);
  } catch (e) {
    return next(e);
  }
};



/**
 * Find NOTIFICATION by id
 * @controller Check "Notification" module
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 */
exports.getById = async function getById(req, res, next, id) {
  try {
    return await svc.getById('Notification')(req, res, next, id);
  } catch (e) {
    return next(e);
  }
};


/**
 * CREATE Notification
 * @controller  "Notification"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 * @param {body} body to create NOTIFICATION
 */
exports.createNotification = async function createNotification(req, res) {
  const { body } = req;
  await new Notification(body).save();
  const { title } = body;
  return res.status(200).json({
    ok: true,
    message: req.t('NOTIFICATION_CREATE_SUCCESS', {
      title,
    }),
  });
};

/**
 * Notifications List
 * @controller  "Notification"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.listNotification = async function listNotification(req, res, next) {
  try {
    return await svc.list(req, res, next);
  } catch (e) {
    return next(e);
  }
};

/**
 * Update  Notification
 * @controller  "NOTIFICATION"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.oneNotification = async function oneNotification(req, res) {
  const { entity } = req;
  return res.status(200).json(entity);
};

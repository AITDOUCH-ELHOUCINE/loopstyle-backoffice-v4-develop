const mongoose = require('mongoose');
const config = require('@config/index');
const notifHelper = require('@helpers/notifications');
const { getDocId } = require('@helpers/utils/index');
const svc = require('../services/bo.server.service');

const Notification = mongoose.model('Notification');
const User = mongoose.model('User');
const node_env=process.env.NODE_ENV;
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
 * Find notification by id
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
 * @param {body} body to create notification
 */
exports.createNotification = async function createNotification(req, res, next) {
  try {
    const { user, body } = req;
    const creatorModel = user.constructor.modelName;
    req.body = { ...body, createdBy: user, creatorModel };
    return await svc.create('Notification',true)(req, res, next);
  } catch (e) {
    return next(e);
  }
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
    return await svc.sanitizeQuery('Notification')(req, res, next);
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
    const protected_attrs = config.app.notification.admin_protected_attrs || [];

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
 * Delete one Notification
 * @controller  "notification"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.deleteNotification = async function deleteNotification(req, res) {
  const { entity } = req;

  await Notification.deleteOne({ _id: entity.id });

  return res.status(200).json({
    ok: true,
    message: req.t('NOTIFICATION_DELETE_SUCCESS', {
      title: entity.title,
    }),
  });
};

/**
 * Update  Notification
 * @controller  "notification"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.updateNotification = async function updateNotification(req, res, next) {
  try {
    return await svc.updateOne(req, res, next);
  } catch (e) {
    return next(e);
  }
};

/**
 * Update  Notification
 * @controller  "notification"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.oneNotification = async function oneNotification(req, res) {
  const { entity } = req;

  return res.status(200).json(entity);
};
/**
 * CREATE Notification
 * @controller  "Notification"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 * @param {body} body to create notification
 */
exports.sendBoNotification = async function sendBoNotification(req, res, next) {
  const {
    entity: notification,
  } = req;
  try {
    let external_user_ids = [];
    let filters = [];

    
    // 1- build notification message
    if (notification.type === 'broadcast_notification') {
      filters = [
        { field: 'tag', key: 'mode', relation: '=', value: String(node_env) },
      ];
    }else if (notification.type === 'admin_notification') {
      external_user_ids = await User.find({
        _id: { $in : notification.users},
      }).distinct('_id');

    }

    // filter by external_user_id
    const  msg = await notifHelper.clientMessage(
      {
        include_external_user_ids: external_user_ids,
        notif_type:'admin_notification',
        headings_labels:[notification.title],
        content_labels:[notification.content],
        custom_data: {
          notif_type: 'admin_notification',
          product: notification.product,
          offer: notification.offer,
        },
        filters,
      },
    );
           

    // 2- send notification
    const notifResult =  await notifHelper.sendClientNotification(msg);
    console.info(notifResult);

    // 3- save response
    notification.oneSignalResponse = notifResult;
    await notification.save();

    return res.json(notification);
  } catch (e) {
    console.error(e);
    return next(e);
  }
};
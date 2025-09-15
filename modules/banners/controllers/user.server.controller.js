const mongoose = require('mongoose');
const config = require('@config/index');
const svc = require('../services/user.server.service');

const Banner = mongoose.model('Banner');

/**
 * Check if the module "Banner" is up and running
 * @controller Check "Banner" module
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 */
exports.ping = async function ok(req, res) {
  res.status(200).json({
    ok: true,
    message: req.t('BANNER_PING_SUCCESS'),
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

    const customQry = {isDeleted:false,isEnabled:true};
    return await svc.sanitizeQuery('Banner',customQry)(req, res, next);
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
    const protected_attrs = config.app.banner.protected_attrs || [];

    return await svc.sanitizeBody(protected_attrs)(req, res, next);
  } catch (e) {
    return next(e);
  }
};

/**
 * Banners List
 * @controller  "Banner"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.listBanner = async function listBanner(req, res, next) {
  try {
    return await svc.list(req, res, next);
  } catch (e) {
    return next(e);
  }
};


/**
 * Find banner by id
 * @controller Check "Banner" module
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 */
exports.getById = async function getById(req, res, next, id) {
  try {
    return await svc.getById('Banner')(req, res, next, id);
  } catch (e) {
    return next(e);
  }
};

/**
 * Check if Banner is duplicated
 * @controller Check "banner" name
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 * @param {body} body from front
 */
exports.checkBannerExist = async function checkBannerExist(req, res, next) {
  const { body } = req;
  const { name } = body;
  const result = await Banner.find({ name });

  if (result.length > 0) {
    return res.status(400).json({
      ok: false,
      message: req.t('BANNER_ALREADY_EXISTS', {
        name,
      }),
    });
  }
  return next();
};
/**
 * CREATE Banner
 * @controller  "Banner"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 * @param {body} body to create banner
 */
exports.createBanner = async function createBanner(req, res) {
  const { body } = req;
  await new Banner(body).save();
  const { name } = body;
  return res.status(200).json({
    ok: true,
    message: req.t('BANNER_CREATE_SUCCESS', {
      name,
    }),
  });
};

/**
 * Banners List
 * @controller  "Banner"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.listBanner = async function listBanner(req, res, next) {
  try {
    return await svc.list(req, res, next);
  } catch (e) {
    return next(e);
  }
};

/**
 * Update  Banner
 * @controller  "banner"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.oneBanner = async function oneBanner(req, res) {
  const { entity } = req;
  return res.status(200).json(entity);
};

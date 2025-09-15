/* eslint-disable import/no-dynamic-require */

/**
 * Module dependencies.
 */
const mongoose = require('mongoose');

const svr = require('@modules/products/services/user.server.service');

const Favorite = mongoose.model('Favorite');
/**
 * Sanitize the query for products loved by current user
 * @controller Sanitize Query
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.sanitizeFavoritesQuery = async function sanitizeFavoritesQuery(req, res, next) {
  try {
    // list products that are in my favorites
    const favorites = await Favorite.find({ user: req.user.id });
    const favoritesIds = favorites.map((f) => f.product);
    return await svr.sanitizeQuery('Product', { _id: { $in: favoritesIds } })(req, res, next);
  } catch (e) {
    return next(e);
  }
};

/**
 * Favorite Products List
 * @controller  "FAvorites"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.listFavorite = async function listFavorite(req, res, next) {
  try {
    return await svr.list(req, res, next, true);
  } catch (e) {
    return next(e);
  }
};

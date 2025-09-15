const mongoose = require('mongoose');
const config = require('@config/index');
const svr = require('../services/bo.server.service');



/**
 * Sanitize the query for specific product favorites
 * @controller Sanitize Query
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.sanitizeFavoriteQuery = async function sanitizeFavoriteQuery(req, res, next) {
  try {

    console.log('sanitize favorite Query');
    const { user } = req;
    // only not deleted and not selled products to show.
    return await svr.sanitizeQuery('Favorite', { user })(req, res, next);
  } catch (e) {
    return next(e);
  }
};

/**
 * Favorite List
 * @controller  "FAvorites"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.listFavorite = async function listFavorite(req, res, next) {
  try {
    return await svr.list(req, res, next);
  } catch (e) {
    return next(e);
  }
};

exports.canAdd = async function canAdd(req, res, next) {
  try {

    const { user, entity } = req;

    console.log('canAdd');

    if (entity.isMine(user) || entity.is_deleted || entity.is_selled)
    {
      console.log('canAdd produit vendu');
      return res.status(400).json({
        ok: false,
        message: req.t('your are not allowed to add products to favorites'),
      });
    }

    return next();

  


  } catch (e) {
    console.error('canAdd error');
    console.error(e);
    return next(e);
  }
};
/**
 * add Product to current user favorite products
 * @controller  add Product to current user favorite products
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.addToFavorites = async function addToFavorites(req, res, next) {
  try {
    const { entity, user } = req;
    const FavoriteModel = mongoose.model('Favorite');
    const doILoveit = await entity.doILoveIt(user);
    if (!doILoveit) {
      try {
        await entity.loveIT(user);
        const fav_count = await FavoriteModel.count({ product: entity._id });
        return res.status(200).json({...entity.toJSON(),is_favorite:true,fav_count});
      } catch (e) {
        return next(e);
      }
    } else {
      
      return res.status(400).json({
        ok: false,
        message: req.t('PRODUCT_ALREADY_IN_FAVORITES'),
      });
    }
  } catch (e) {
    console.error('addToFavorites error');
    console.error(e);
    return next(e);
  }
};
/**
 * removes Product from current user favorite products
 * @controller  removes Product from current user favorite products
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.removeFromFavorites = async function removeFromFavorites(req, res, next) {
  const { entity, user } = req;
  const FavoriteModel = mongoose.model('Favorite');
  const doILoveit = await entity.doILoveIt(user);
  if (doILoveit) {
    try {
      await entity.unloveIt(user);
      const fav_count = await FavoriteModel.count({ product: entity._id });
      return res.status(200).json({...entity.toJSON(),is_favorite:false,fav_count});
    } catch (e) {
      return next(e);
    }
  } else {
    return res.status(400).json({
      ok: false,
      message: req.t('PRODUCT_NOT_IN_YOUR_FAVORITES'),
    });
  }
};

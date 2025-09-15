const mongoose = require('mongoose');
const config = require('@config/index');
const utils = require('@helpers/utils');
const svc = require('../services/bo.server.service');

const { getDocId } = utils;
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
  const { name } = req.body;

  const result = await Banner.find({ name, isDeleted: false });

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
 * CREATE Banner with image upload
 * @controller  "Banner"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 * @param {body} body to create banner
 */
exports.createBanner = async function createBanner(req, res, next) {
  try {
    const { user, body } = req;

    console.log('=== BANNER CREATION DEBUG START ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('Original req.body:', JSON.stringify(body, null, 2));
    console.log('User:', user ? user._id : 'No user');

    let bannerData = { ...body, createdBy: getDocId(user) };

    console.log('Final bannerData:', JSON.stringify(bannerData, null, 2));
    console.log('Image field type:', typeof bannerData.image);
    console.log('Image field value:', bannerData.image);

    // Check if image is a valid ObjectId
    if (bannerData.image) {
      const mongoose = require('mongoose');
      console.log('Is image a valid ObjectId?', mongoose.Types.ObjectId.isValid(bannerData.image));
    }

    console.log('=== CALLING svc.create ===');
    req.body = bannerData;

    const result = await svc.create('Banner')(req, res, next);
    console.log('=== BANNER CREATION RESULT ===');
    console.log('Result:', result);
    console.log('=== BANNER CREATION DEBUG END ===');

    return result;
  } catch (e) {
    console.error('=== ERROR in createBanner ===');
    console.error('Error details:', e);
    console.error('Error stack:', e.stack);
    console.error('=== END ERROR ===');
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
    const customQry = { isDeleted: false };

    return await svc.sanitizeQuery('Banner', customQry)(req, res, next);
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
    const protected_attrs = config.app.banner.admin_protected_attrs || [];

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
 * Delete one Banner
 * @controller  "banner"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.deleteBanner = async function deleteBanner(req, res) {
  const { entity } = req;

  await Banner.updateOne({ _id: entity.id }, { isDeleted: true });

  return res.status(200).json({
    ok: true,
    message: req.t('BANNER_DELETE_SUCCESS', {
      name: entity.name,
    }),
  });
};


/**
 * Update  Banner
 * @controller  "banner"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
// exports.updateBanner = async function updateBanner(req, res, next) {
//   try {
//     return await svc.updateOne(req, res, next);
//   } catch (e) {
//     return next(e);
//   }
// };

// Middleware pour mettre à jour un banner
exports.updateBanner = async function updateBanner(req, res, next) {
  try {
    console.log("Données de la requête :", req.body);
    console.log("ID du banner :", req.params.id);

    // Vérifiez que l'entité existe dans req
    if (!req.entity) {
      return res.status(404).json({
        message: "Banner not found"
      });
    }

    // Appelez la fonction updateOne du service de base
    return await svc.updateOne(req, res, next);
  } catch (e) {
    console.error("Erreur lors de la mise à jour du banner:", e);
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


/**
 * Delete many Banner
 * @controller  "banner"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */

exports.deleteManyBanners = async function deleteManyBanners(req, res) {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        ok: false,
        message: req.t('CATEGORY_IDS_REQUIRED'),
      });
    }

    const result = await Banner.deleteMany({ _id: { $in: ids }, isDeleted: false });

    return res.status(200).json({
      ok: true,
      message: req.t('BANNER_DELETE_MANY_SUCCESS', { count: result.deletedCount }),
    });
  } catch (e) {
    console.error('=== ERROR in deleteManyBanners ===');
    console.error('Error details:', e);
    console.error('Error stack:', e.stack);
    console.error('=== END ERROR ===');
    return res.status(500).json({
      ok: false,
      message: req.t('BANNER_DELETE_MANY_ERROR', { error: e.message }),
    });
  }
}
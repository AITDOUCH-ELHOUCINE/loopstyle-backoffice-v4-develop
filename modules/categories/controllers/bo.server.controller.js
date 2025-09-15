const mongoose = require('mongoose');
const config = require('@config/index');
const utils = require('@helpers/utils');
const svc = require('../services/bo.server.service');

const { getDocId } = utils;
const Category = mongoose.model('Category');

/**
 * Check if the module "Category" is up and running
 * @controller Check "Category" module
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 */
exports.ping = async function ok(req, res) {
  res.status(200).json({
    ok: true,
    message: req.t('CATEGORY_PING_SUCCESS'),
  });
};

/**
 * Find category by id
 * @controller Check "Category" module
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 */
exports.getById = async function getById(req, res, next, id) {
  try {
    return await svc.getById('Category')(req, res, next, id);
  } catch (e) {
    return next(e);
  }
};
/**
 * Check if Category is duplicated
 * @controller Check "category" name
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 * @param {body} body from front
 */
exports.checkCategoryExist = async function checkCategoryExist(req, res, next) {
  const { name } = req.body;

  const result = await Category.find({ name, isDeleted: false });

  if (result.length > 0) {
    return res.status(400).json({
      ok: false,
      message: req.t('CATEGORY_ALREADY_EXISTS', {
        name,
      }),
    });
  }
  return next();
};
/**
 * CREATE Category
 * @controller  "Category"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 * @param {body} body to create category
 */
exports.createCategory = async function createCategory(req, res, next) {
  try {
    const { user, body } = req;

    req.body = { ...body, createdBy: getDocId(user) };
    return await svc.create('Category')(req, res, next);
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
    const customQry = { isDeleted: false };

    return await svc.sanitizeQuery('Category', customQry)(req, res, next);
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
    const protected_attrs = config.app.category.admin_protected_attrs || [];

    return await svc.sanitizeBody(protected_attrs)(req, res, next);
  } catch (e) {
    return next(e);
  }
};

/**
 * Categories List
 * @controller  "Category"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.listCategory = async function listCategory(req, res, next) {
  try {
    return await svc.list(req, res, next);
  } catch (e) {
    return next(e);
  }
};

/**
 * Delete one Category
 * @controller  "category"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.deleteCategory = async function deleteCategory(req, res) {
  const { entity } = req;

  await Category.deleteOne({ _id: entity.id });

  return res.status(200).json({
    ok: true,
    message: req.t('CATEGORY_DELETE_SUCCESS', {
      name: entity.name,
    }),
  });
};

/**
 * Update  Category
 * @controller  "category"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */

/**
 * Update Category
 * @controller  "category"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.updateCategory = async function updateCategory(req, res, next) {
  try {
    console.log('=== DEBUT UPDATE CATEGORY ===');
    console.log('ID de la catégorie:', req.params.id);
    console.log('Données reçues du frontend:', JSON.stringify(req.body, null, 2));
    console.log('Entity présente:', !!req.entity);

    if (req.entity) {
      console.log('Entity ID:', req.entity._id);
      console.log('Entity actuelle avant modification:');
      console.log(JSON.stringify(req.entity.toObject ? req.entity.toObject() : req.entity, null, 2));
    }

    // Pas de nettoyage supplémentaire ici car le frontend s'en charge déjà
    // On fait juste confiance aux données transformées du frontend
    console.log('Données qui vont être sauvegardées:', JSON.stringify(req.body, null, 2));

    // Utilisation directe du service de base
    const result = await svc.updateOne(req, res, next);

    console.log('=== UPDATE CATEGORY TERMINÉ AVEC SUCCÈS ===');
    return result;

  } catch (e) {
    console.error('=== ERREUR DANS UPDATE CATEGORY ===');
    console.error('Message d\'erreur:', e.message);
    console.error('Stack trace:', e.stack);

    // Si c'est une erreur de validation Mongoose
    if (e.name === 'ValidationError') {
      console.error('Erreurs de validation:', e.errors);
      return res.status(400).json({
        ok: false,
        message: 'Erreur de validation',
        errors: Object.keys(e.errors).map(key => ({
          field: key,
          message: e.errors[key].message
        }))
      });
    }

    return next(e);
  }
};

/**
 * Update  Category
 * @controller  "category"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
// exports.oneCategory = async function oneCategory(req, res) {
//   const { entity } = req;

//   return res.status(200).json(entity);
// };

exports.oneCategory = async function oneCategory(req, res) {
  const { entity } = req;

  try {
    console.log('Récupération de la catégorie:', entity._id);
    return res.status(200).json(entity);
  } catch (e) {
    console.error('Erreur dans oneCategory:', e);
    return res.status(500).json({
      ok: false,
      message: 'Erreur lors de la récupération de la catégorie',
    });
  }
};

/**
 * delete many Categories
 * @controller 
 * @param {Express.Request} req 
 * @param
 * */
exports.deleteManyCategories = async function deleteManyCategories(req, res) {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        ok: false,
        message: req.t('CATEGORY_IDS_REQUIRED'),
      });
    }

    const result = await Category.deleteMany({ _id: { $in: ids }, isDeleted: false });

    return res.status(200).json({
      ok: true,
      message: req.t('CATEGORY_DELETE_MANY_SUCCESS', { count: result.deletedCount }),
    });
  } catch (e) {
    console.error('Erreur dans deleteManyCategories:', e);
    return res.status(500).json({
      ok: false,
      message: 'Erreur lors de la suppression des catégories',
    });
  }
};


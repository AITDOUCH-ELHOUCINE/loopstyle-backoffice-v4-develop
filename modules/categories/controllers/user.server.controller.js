const mongoose = require('mongoose');
const config = require('@config/index');
const svc = require('../services/user.server.service');

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
 * Sanitize the query
 * @controller Sanitize Query
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.sanitizeQuery = async function sanitizeQuery(req, res, next) {
  try {

    const customQry = {isDeleted:false,isEnabled:true};
    return await svc.sanitizeQuery('Category',customQry)(req, res, next);
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
    const protected_attrs = config.app.category.protected_attrs || [];

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
  const { body } = req;
  const { name } = body;
  const result = await Category.find({ name });

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
exports.createCategory = async function createCategory(req, res) {
  const { body } = req;
  await new Category(body).save();
  const { name } = body;
  return res.status(200).json({
    ok: true,
    message: req.t('CATEGORY_CREATE_SUCCESS', {
      name,
    }),
  });
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
 * Update  Category
 * @controller  "category"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.oneCategory = async function oneCategory(req, res) {
  const { entity } = req;
  return res.status(200).json(entity);
};


// /**
//  * delete many Categories
//  * @controller 
//  * @param {Express.Request} req The request
//  * @param
//  * */
// exports.deleteManyCategories = async function deleteManyCategories(req, res) {
//   try {
//     console.log('Test route accessed for category ID:', req.params.categoryId);
//     return res.status(200).json({
//       ok: true,
//       message: 'Test route successful',
//       categoryId: req.params.categoryId
//     });
//   } catch (e) {
//     console.error('Error in testRoute:', e);
//     return res.status(500).json({
//       ok: false,
//       message: 'Error in testRoute',
//     });
//   }
// };


const mongoose = require('mongoose');
const config = require('@config/index');
const utils = require('@helpers/utils');
const svc = require('../services/bo.server.service');

const { getDocId } = utils;
const Product = mongoose.model('Product');

/**
 * Check if the module "Product" is up and running
 * @controller Check "Product" module
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 */
exports.ping = async function ok(req, res) {
  res.status(200).json({
    ok: true,
    message: req.t('PRODUCT_PING_SUCCESS'),
  });
};

/**
 * Find product by id
 * @controller Check "Product" module
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 */
exports.getById = async function getById(req, res, next, id) {
  try {
    return await svc.getById('Product')(req, res, next, id);
  } catch (e) {
    return next(e);
  }
};

/**
 * Check if Product is duplicated
 * @controller Check "product" name
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 * @param {body} body from front
 */
exports.checkProductExist = async function checkProductExist(req, res, next) {
  const { name } = req.body;

  const result = await Product.find({ name });

  if (result.length > 0) {
    return res.status(400).json({
      ok: false,
      message: req.t('PRODUCT_ALREADY_EXISTS', {
        name,
      }),
    });
  }
  return next();
};

/**
 * CREATE Product
 * @controller  "Product"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 * @param {body} body to create product
 */
exports.createProduct = async function createProduct(req, res, next) {
  try {
    const { user, body } = req;

    // Set createdBy field in the request body
    req.body = {
      ...body,
      createdBy: getDocId(user),
    };

    // Call the create function of the 'svc' service passing the 'Product' as the controller
    return await svc.create('Product', true)(req, res, next);
  } catch (e) {
    return next(e);
  }
};

/**
 * Creation Done
 * @controller  "Product"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 * @param {body} body to create product
 */
exports.creationDone = async function creationDone(req, res, next) {
  try {
    const { entity: product } = req;

    return res.status(200).json({
      ok: true,
      message: req.t('PRODUCT_CREATE_SUCCESS', { name: product.name }),
      result: product,
    });
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
    return await svc.sanitizeQuery('Product')(req, res, next);
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
    const protected_attrs = config.app.product.admin_protected_attrs || [];

    return await svc.sanitizeBody(protected_attrs)(req, res, next);
  } catch (e) {
    return next(e);
  }
};

/**
 * Products List
 * @controller  "Product"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.listProduct = async function listProduct(req, res, next) {
  try {
    return await svc.list(req, res, next);
  } catch (e) {
    return next(e);
  }
};

/**
 * Delete one Product
 * @controller  "product"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.deleteProduct = async function deleteProduct(req, res, next) {
  try {
    const { entity } = req;

    await Product.deleteOne({ _id: entity.id });

    return res.status(200).json({
      ok: true,
      message: req.t('PRODUCT_DELETE_SUCCESS', {
        name: entity.name,
      }),
    });
  } catch (e) {
    return next(e);
  }
};

/**
 * Debug Request - Add this temporarily to see what's happening
 * @controller Debug
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next The next
 */
exports.debugRequest = function debugRequest(req, res, next) {
  console.log('=== BO CONTROLLER DEBUG ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Entity exists:', !!req.entity);
  console.log('Entity ID:', req.entity ? req.entity._id : 'No entity');
  console.log('User exists:', !!req.user);
  console.log('========================');
  next();
};

/**
 * Update Product - Original version with service
 * @controller  "product"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.updateProduct = async function updateProduct(req, res, next) {
  try {
    console.log('BO updateProduct - Starting');
    console.log('BO updateProduct - Body:', req.body);
    console.log('BO updateProduct - Entity:', req.entity ? 'exists' : 'missing');
    
    const result = await svc.updateOne(req, res, next);
    console.log('BO updateProduct - Service result completed');
    return result;
  } catch (e) {
    console.error('BO updateProduct - Error:', e);
    return next(e);
  }
};

/**
 * Update Product - Direct version (bypassing service)
 * Use this if the service is causing issues
 * @controller  "product"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next The next
 */
exports.updateProductDirect = async function updateProductDirect(req, res, next) {
  try {
    const { entity, body, user } = req;
    
    console.log('BO updateProductDirect - Starting');
    console.log('BO updateProductDirect - Body:', body);
    console.log('BO updateProductDirect - Entity exists:', !!entity);

    if (!entity) {
      return res.status(404).json({
        ok: false,
        message: 'Product not found',
      });
    }

    // Add metadata
    if (user) {
      body.updatedBy = getDocId(user);
    }
    body.updated_at = new Date();

    // Update entity with body data
    Object.keys(body).forEach(key => {
      if (body[key] !== undefined && body[key] !== null) {
        entity[key] = body[key];
      }
    });

    console.log('BO updateProductDirect - About to save entity');

    // Save the updated entity
    const updatedProduct = await entity.save();
    
    console.log('BO updateProductDirect - Save successful');

    return res.status(200).json({
      ok: true,
      message: req.t('PRODUCT_UPDATE_SUCCESS') || 'Product updated successfully',
      data: updatedProduct,
    });

  } catch (e) {
    console.error('BO updateProductDirect - Error:', e);
    
    // Handle validation errors
    if (e.name === 'ValidationError') {
      return res.status(400).json({
        ok: false,
        message: 'Validation error',
        errors: Object.values(e.errors).map(err => err.message),
      });
    }

    return res.status(500).json({
      ok: false,
      message: e.message || 'Internal server error',
    });
  }
};

/**
 * Update Product - Minimal version for testing
 * @controller  "product"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next The next
 */
exports.updateProductMinimal = async function updateProductMinimal(req, res, next) {
  try {
    const { entity, body } = req;
    
    console.log('BO updateProductMinimal - Starting');
    console.log('BO updateProductMinimal - Body keys:', Object.keys(body));
    console.log('BO updateProductMinimal - Entity exists:', !!entity);

    if (!entity) {
      return res.status(404).json({
        ok: false,
        message: 'Product not found',
      });
    }

    // Only update specific safe fields
    const allowedFields = ['name', 'price', 'description', 'color', 'status'];
    let hasUpdates = false;

    allowedFields.forEach(field => {
      if (body[field] !== undefined && body[field] !== null) {
        entity[field] = body[field];
        hasUpdates = true;
        console.log(`Updated ${field}:`, body[field]);
      }
    });

    if (!hasUpdates) {
      return res.status(400).json({
        ok: false,
        message: 'No valid fields to update',
      });
    }

    console.log('BO updateProductMinimal - Saving...');
    const result = await entity.save();
    
    console.log('BO updateProductMinimal - Success');

    return res.status(200).json({
      ok: true,
      message: 'Product updated successfully',
      data: result,
    });

  } catch (e) {
    console.error('BO updateProductMinimal - Error:', e);
    return res.status(500).json({
      ok: false,
      message: e.message,
      error: e.stack,
    });
  }
};

/**
 * Get one Product
 * @controller  "product"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 */
exports.oneProduct = async function oneProduct(req, res) {
  const { entity } = req;

  return res.status(200).json(entity);
};
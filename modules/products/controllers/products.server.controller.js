const mongoose = require('mongoose');

const { model } = mongoose;
const config = require('@config/index');
const utils = require('@helpers/utils');
const obvyHelper=require('@helpers/obvy');
const svc = require('../services/user.server.service');

const { getDocId } = utils;
const Product = mongoose.model('Product');
const Category = mongoose.model('Category');
const Rating = mongoose.model('Rating');

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
 * Validate and CREATE Product
 * @controller "Product"
 * @param {Express.Request} req The request
 * @param {OutgoingMessage} res The response
 * @param {Function} next The next middleware function
 */
// Fixed validateProduct function
exports.validateProduct = async function validateProduct(req, res, next) {
  try {
    const { body } = req;
    console.log('=== VALIDATE PRODUCT - BODY ===');
    console.log(JSON.stringify(body, null, 2));

    const requiredFields = ['name', 'price', 'category', 'categoryInfo', 'color'];

    for (const field of requiredFields) {
      if (!body[field]) {
        return res.status(400).json({
          ok: false,
          field,
          message: req.t(`PRODUCT_${field.toUpperCase()}_REQUIRED`) || `Field ${field} is required`,
        });
      }
    }

    // Validate category id format
    if (typeof body.category !== 'string' || body.category.length !== 24) {
      return res.status(400).json({
        ok: false,
        field: 'category',
        message: 'Invalid category id format',
      });
    }

    const categoryValid = await Category.findById(body.category).lean();
    // Fixed logic: category should exist, not be deleted, and be enabled
    if (!categoryValid) {
      return res.status(400).json({
        ok: false,
        field: 'category',
        message: 'CATEGORY_NOT_FOUND',
      });
    }
    if (categoryValid.isDeleted) {
      return res.status(400).json({
        ok: false,
        field: 'category',
        message: 'CATEGORY_IS_DELETED',
      });
    }
    if (!categoryValid.isEnabled) {
      return res.status(400).json({
        ok: false,
        field: 'category',
        message: 'CATEGORY_IS_DISABLED',
      });
    }

    return next();
  } catch (e) {
    console.error('validateProduct error:', e);
    return next(e);
  }
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
      user,
      userInfo:await user.getInfo(),
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
 * Sanitize created by me query
 * @controller Sanitize Query
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.sanitizeCreatedByMeQuery = async function sanitizeCreatedByMeQuery(req, res, next) {
  try {
    const { user } = req;
    const customQry = { user };

    return await svc.sanitizeQuery('Product', customQry)(req, res, next);
  } catch (e) {
    return next(e);
  }
};

/**
 * get Favorites Products
 * @controller Sanitize Query
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.getFavoritesProductsIds = async function getFavoritesProducts(req, res, next) {
  try {
    const { user, query } = req;
    const { $favorites_only = false } = query;

    let favorite_ids = [];

    if ($favorites_only) {
      const FavoriteModel = model('Favorite');
      favorite_ids = await FavoriteModel.find({
        user,
      }).distinct('product');

      req.favorite_ids = favorite_ids;
    }

    return next();
  } catch (e) {
    return next(e);
  }
};
/**
 * Sanitize created by others query
 * @controller Sanitize Query
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.sanitizeCreatedByOthersQuery = async function sanitizeCreatedByOthersQuery(req, res, next) {
  try {
    const { user, favorite_ids } = req;
    let customQry = { user: { $ne: user } };

    if (favorite_ids) {
      customQry = {
        _id: { $in: favorite_ids },
        ...customQry,
      };
    }


    return await svc.sanitizeQuery('Product', customQry)(req, res, next);
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
    const customQry = {};

    return await svc.sanitizeQuery('Product', customQry)(req, res, next);
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
    const { query } = req;

    const { $favorite_flag = false } = query;
    return await svc.list(req, res, next,$favorite_flag);
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
    const { entity, body } = req;

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
 * Update  Product
 * @controller  "product"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
// Enhanced updateProduct function to handle images
exports.updateProduct = async function updateProduct(req, res, next) {
  try {
    console.log('=== UPDATE PRODUCT REQUEST ===');
    
      const { body, user, files } = req;
  const productId = req.params.productId || req.params.id;
  
  // LOG DES INFORMATIONS REÇUES
    console.log('Product ID from params:', productId);
    console.log('Request body keys:', Object.keys(body));
    console.log('Files received:', files ? Object.keys(files) : 'None');
    console.log('Body content:', body);
    
    // VALIDATION DE L'ID
    if (!productId || productId === 'undefined') {
      console.error('❌ Product ID manquant ou invalide');
      return res.status(400).json({
        ok: false,
        message: 'Product ID is required and must be valid',
      });
    }
    
    // Handle user info
    if (user?.getInfo) {
      body.userInfo = await user.getInfo();
      console.log('✓ User info added');
    }

    // === TRAITEMENT DES IMAGES ===
    
    // Handle multiple images upload
    if (files && files.images) {
      console.log('Processing multiple images...');
      const imageUrls = [];
      
      const imagesToProcess = Array.isArray(files.images) ? files.images : [files.images];
      
      for (let i = 0; i < imagesToProcess.length; i++) {
        const file = imagesToProcess[i];
        console.log(`Processing image ${i + 1}:`, file.originalname || file.name);
        
        try {
          // Upload to your storage service
          const imageUrl = await uploadImageToStorage(file);
          imageUrls.push(imageUrl);
          console.log(`✓ Image ${i + 1} uploaded:`, imageUrl);
        } catch (error) {
          console.error(`❌ Error uploading image ${i + 1}:`, error);
          throw error;
        }
      }
      
      // Combine with existing images if any
      const existingImages = body.existingImages ? JSON.parse(body.existingImages) : [];
      body.images = [...existingImages, ...imageUrls];
      
      console.log('✓ Final images array:', body.images);
      
      // Clean up form data
      delete body.existingImages;
    } else if (body.existingImages) {
      // Only existing images, no new uploads
      try {
        body.images = JSON.parse(body.existingImages);
        delete body.existingImages;
        console.log('✓ Existing images preserved:', body.images);
      } catch (error) {
        console.error('❌ Error parsing existing images:', error);
        body.images = [];
      }
    }

    // Handle single main image
    if (files && files.image) {
      console.log('Processing main image:', files.image.originalname || files.image.name);
      try {
        const imageUrl = await uploadImageToStorage(files.image);
        body.image = imageUrl;
        console.log('✓ Main image uploaded:', imageUrl);
      } catch (error) {
        console.error('❌ Error uploading main image:', error);
        throw error;
      }
    } else if (body.existingImage) {
      // Keep existing main image
      body.image = body.existingImage;
      delete body.existingImage;
      console.log('✓ Main image preserved:', body.image);
    }

    // === VALIDATION MÉTIER ===
    
    // Client validation
    if (body.allClients === 'false' || body.allClients === false) {
      const clients = body.clients ? JSON.parse(body.clients) : [];
      if (!clients || clients.length === 0) {
        console.error('❌ No clients specified');
        return res.status(400).json({
          ok: false,
          message: req.t ? req.t('CREATE_NO_CLIENT_ERROR') : 'At least one client must be specified',
        });
      }
      body.clients = clients;
    }

    // Parse JSON fields that come as strings from FormData
    const jsonFields = ['clients', 'categories', 'tags', 'specifications'];
    jsonFields.forEach(field => {
      if (body[field] && typeof body[field] === 'string') {
        try {
          body[field] = JSON.parse(body[field]);
        } catch (error) {
          console.warn(`Warning: Could not parse ${field} as JSON:`, error);
        }
      }
    });

    // LOG FINAL DATA
    console.log('=== FINAL UPDATE DATA ===');
    console.log('Product ID:', productId);
    console.log('Data to update:', {
      ...body,
      images: body.images ? `[${body.images.length} images]` : 'none',
      image: body.image ? '[main image set]' : 'none'
    });

    // Call the service to update
    console.log('Calling service updateOne...');
    return await svc.updateOne(req, res, next);
    
  } catch (error) {
    console.error('❌ UPDATE PRODUCT ERROR:', error);
    console.error('Stack trace:', error.stack);
    
    return res.status(500).json({
      ok: false,
      message: error.message || 'Internal server error during product update',
    });
  }
};

// Helper function for image upload (you'll need to implement this based on your storage solution)
async function uploadImageToStorage(file) {  
  console.log('Uploading file:', file.originalname || file.name, 'Size:', file.size);
    
  // Placeholder return - replace with actual upload logic
  throw new Error('uploadImageToStorage function must be implemented');
}

/**
 * canDelete
 * @controller  "product"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.deleteProductUser = async function deleteProductUser(req, res, next) {
  try {
    const { body, entity } = req;
    if (entity.is_deleted || !entity.isMine(req.user)) {
      return res.status(400).json({
        ok: false,
        message: req.t('NOT_ALLOWED_TO_DELETE_PRODUCT'),
      });
    }
    entity.set(body);
    entity.is_deleted = true;
    const result = await entity.save({ new: true });

    return res.json(result);
  } catch (e) {
    return next(e);
  }
};

/**
 * Update  Product
 * @controller  "product"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.oneProduct = async function oneProduct(req, res) {
  const { entity } = req;

  return res.status(200).json(entity);
};


/**
 * checkProductAvailability
 * @controller  "product"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.checkProductAvailability = async function checkProductAvailability(req, res, next) {
  try {

    const { product } = req;
    const {status} = product;

    if(status!=='available'){
      return  res.status(400).json({
        ok: false,
        message: req.t('Produit non encore disponible ou vendu.'),
      });
    }

    return next();
  } catch (e) {
    console.error(e);
    return next(e);
  }
 
};

/**
 * getAcceptedOffer
 * @controller  "product"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.getAcceptedOffer = async function getAcceptedOffer(req, res, next) {
  try {
    const { entity:product,user } = req;
    const isSeller=product.isMine(user);

    if(isSeller){
      return  res.status(400).json({
        ok: false,
        message: req.t('Vous ne pouvez pas accepter cette offre.'),
      });
    }

    const ProductOfferModel = model('ProductOffer');
    const acceptedOffer= await ProductOfferModel.findOne({
      product: product._id,
      buyer: user,
      status: 'accepted',
    }).sort({updated_at: -1});


    if(acceptedOffer){
      req.acceptedOffer=acceptedOffer;
    }


    // create accepted offer if not exist
    if(!acceptedOffer){
      const newAcceptedOffer= new ProductOfferModel({
        product,
        price: product.price,
        seller: product.user,
        sender: user,
        last_updated_by: 'buyer',
        buyer: user,
        status: 'accepted',
      });

      req.acceptedOffer=await newAcceptedOffer.save();
      
    }

    return next();
  } catch (e) {
    console.error(e);
    return next(e);
  }
 
};




/**
 * setAcceptedOffer
 * @controller  "product"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.setAcceptedOffer = async function setAcceptedOffer(req, res,next) {
  try {
    const { entity:product,acceptedOffer } = req;

    if(acceptedOffer && acceptedOffer.price){
      product.accepted_offer=acceptedOffer._id;
      product.accepted_offer_info={
        offer:acceptedOffer._id,
        price:acceptedOffer.price,
        buyer:acceptedOffer.buyer,
        status:acceptedOffer.status,
      };
 
      req.entity=await product.save({new:true});
    }

    return next();
 
  } catch (e) {

    return next(e);
  }

};




/**
 * createObvyPostalDelivery
 * @controller  "product"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.createObvyPostalDelivery = async function createObvyPostalDelivery(req, res, next) {
  try {
    const { entity:product,user:buyer } = req;


    await obvyHelper.createObvyPostalDelivery({
      product,
      buyer,
    });
    
    return  next();
  } catch (e) {
    return next(e);
  }
};

/**
 * buyProduct
 * @controller  "product"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.buyProductResult = async function buyProduct(req, res) {
  const { entity } = req;

  const product=await Product.findById({
    _id:entity._id,
  }).lean();

  return res.status(200).json(product);

};



/**
 * checkCanExitTransaction
 * @controller  "product"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.checkCanExitTransaction = async function checkCanExitTransaction(req, res, next) {
  try {

    const { product,user } = req;
    const {status,accepted_offer_info} = product;

    const isSeller=product.isMine(user);
    const isBuyer=getDocId(accepted_offer_info.buyer)===getDocId(user);


    if(!isBuyer||isSeller ||status!=='transaction_started'){
      return  res.status(400).json({
        ok: false,
        message: req.t('Vous ne pouvez pas annuler cette transaction.'),
      });
    }

    return next();
  } catch (e) {
    console.error(e);
    return next(e);
  }
 
};


/**
 * exitProductTransaction
 * @controller  "product"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.exitProductTransaction = async function exitProductTransaction(req, res, next) {

  try {
    const { product } = req;
    product.status='available';
    const result = await product.save({new:true});

    return res.status(200).json(result);
  } catch (e) {

    return next(e);
  }   
};


/**
 * conformProduct
 * @controller  "product"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.conformProduct = async function conformProduct(req, res, next) {

  try {
    const { product,user } = req;
    const  {status}=product;
    const isSeller=product.isMine(user);

    if(isSeller){
      return  res.status(400).json({
        ok: false,
        message: req.t('Vous ne pouvez pas mettre en conform ce produit.'),
      });
    }

    if(status!=='transaction_completed'){
      return  res.status(400).json({
        ok: false,
        message: 'Transaction non encore terminée.',
      });
    }

    product.status='conform';
    const result = await product.save({new:true});

    return res.status(200).json(result);
  } catch (e) {

    return next(e);
  }   
};

/**
 * conformProduct
 * @controller  "product"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.nonConformProduct = async function nonConformProduct(req, res, next) {

  try {
    const { product,user,body } = req;
    const  {status}=product;
    const {image}=body;


    const isSeller=product.isMine(user);


    if(isSeller){
      return  res.status(400).json({
        ok: false,
        message: req.t('Vous ne pouvez pas mettre en non-conform ce produit.'),
      });
    }

    if(status!=='transaction_completed'){
      return  res.status(400).json({
        ok: false,
        message: 'Transaction non encore terminée.',
      });
    }

    product.non_conform_image=image;
    product.status='non_conform';
    const result = await product.save({new:true});

    return res.status(200).json(result);
  } catch (e) {

    return next(e);
  }   
};



/**
 * checkCanRate
 * @controller  "product"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.checkCanRate = async function checkCanRate(req, res, next) {

  try {
    const { product,user } = req;
    const  {status,accepted_offer_info,rating}=product;

    if(rating && rating.note){
      console.log('Deja noté');
      return  res.status(400).json({
        ok: false,
        message: 'Vous ne pouvez pas ajouter un avis.',
      });
    }

    if(!accepted_offer_info || !accepted_offer_info.buyer){
      console.log('Buyer not found');
      return  res.status(400).json({
        ok: false,
        message: 'Vous ne pouvez pas ajouter un avis.',
      });
    }
    const isBuyer=getDocId(accepted_offer_info.buyer)===getDocId(user);

    if(!isBuyer){
      console.log('Not Buyer');
      return  res.status(400).json({
        ok: false,
        message: 'Vous ne pouvez pas ajouter un avis.',
      });
    }

    if(status!=='conform' && status!=='non_conform'){
      console.log('Status not conform');
      return  res.status(400).json({
        ok: false,
        message: 'Vous ne pouvez pas ajouter un avis.',
      });
    }

    return  next();

  } catch (e) {

    return next(e);
  }   
};



/**
 * rateProductSeller
 * @controller  "product"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.rateProductSeller = async function rateProductSeller(req, res, next) {

  try {
    const { product,user ,body} = req;
    const  {user:seller}=product;
    const  {note,comment}=body;

    if (!note) {
      return  res.status(400).json({
        ok: false,
        message: 'Note obligatoire.',
      });
    }

    product.rating={
      note,
      comment,
    };
    req.entity = await product.save({new:true});

    // Create a new rating
    const newRating = new Rating({
      buyer:getDocId(user),
      seller:getDocId(seller),
      note,
      comment,
      product:product._id,
    });
    await newRating.save();
   
    return next();

  } catch (e) {

    return next(e);
  }   
};


/**
 * sanitize Ratings Query
 * @controller Sanitize Query
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports. sanitizeRatingsQuery = async function sanitizeRatingsQuery(req, res, next) {
  try {
    const { product } = req;
    const customQry = { seller: getDocId(product.user), product: getDocId(product) };

    return await svc.sanitizeQuery('Rating', customQry)(req, res, next);
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
exports.getRatingsList = async function getRatingsList(req, res, next) {
  try {
    return await svc.list(req, res, next);
  } catch (e) {
    return next(e);
  }
};
const mongoose = require('mongoose');

const { model } = mongoose;
const config = require('@config/index');
const utils = require('@helpers/utils');
const svc = require('../services/user.server.service');

const { getDocId } = utils;
const ProductOffer = model('ProductOffer');



/**
 * Check if the module "Offer" is up and running
 * @controller Check "Offer" module
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
 * Find offer by id
 * @controller Check "Offer" module
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 */
exports.getOfferById = async function getOfferById(req, res, next, id) {
  try {
    return await svc.getById('ProductOffer')(req, res, next, id);
  } catch (e) {
    return next(e);
  }
};




/**
 * CREATE Offer
 * @controller  "Offer"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 * @param {body} body to create offer
 */
exports.createOffer = async function createOffer(req, res, next) {
  try {
    const {entity:product ,user, body } = req;

    
    const {price} = body;

    const isSeller=product.isMine(user);

    const offerBody= { 
      product ,price,seller:product.user,sender:user,
      last_updated_by: isSeller?'seller':'buyer'};


    if(!isSeller){
      offerBody.buyer=user;
    }


    // Set createdBy field in the request body
    req.body = offerBody;

    // Call the create function of the 'svc' service passing the 'Offer' as the controller
    return await svc.create('ProductOffer', true)(req, res, next);
  } catch (e) {
    return next(e);
  }
};




/**
 * CREATE Offer result
 * @controller  "Offer"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 * @param {body} body to create offer
 */
exports.createOfferResult = async function createOffer(req, res, next) {
  try {
    const {entity:offer ,user} = req;


    const isMine = await ProductOffer.isMine({user, offer});

    return res.json({...offer.toJSON(), isMine});

  } catch (e) {
    return next(e);
  }
};





/**
 * Chat List
 * @controller  "Chat"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.listOfferChannels = async function listOfferChannels(req, res, next) {
  try {

    console.log('listOfferChannels');
    return await svc.list(req, res, next);
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

    return await svc.sanitizeQuery('ProductOffer', customQry)(req, res, next);
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
    const protected_attrs = config.app.offer.admin_protected_attrs || [];

    return await svc.sanitizeBody(protected_attrs)(req, res, next);
  } catch (e) {
    return next(e);
  }
};

/**
 * Offers List
 * @controller  "Offer"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.listOffer = async function listOffer(req, res, next) {
  try {
    const { query } = req;
    const { $favorite_flag = false } = query;
    return await svc.list(req, res, next,$favorite_flag);
  } catch (e) {
    return next(e);
  }
};

/**
 * Update  Offer
 * @controller  "offer"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.updateOffer = async function updateOffer(req, res, next) {
  try {

    const { product,user } = req;
    const isSeller=product.isMine(user);

    req.body = {
      ...req.body,
      product,
      last_updated_by: isSeller?'seller':'buyer',
    };

    // if(!isSeller){
    //   return  res.status(401).json({
    //     ok: false,
    //     message: req.t('you are not allowed to update this offer'),
    //   });
    // }

    return await svc.updateOne(req, res, next);
  } catch (e) {
    return next(e);
  }
};


/**
 * Update  Offer
 * @controller  "offer"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.oneOffer = async function oneOffer(req, res) {
  const { entity } = req;

  return res.status(200).json(entity);
};




/**
 * List offers of a chatChannel
 * @controller List Offers
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.offersList = async function offersList(req, res, next) {
  const {  entity:product,query, user} = req;

  const isSeller=product.isMine(user);

  const offersQry={
    product,
    seller:product.user,
  };

  if (!isSeller) {
    offersQry.buyer=user;
  }


  const { $top: top = 10, $skip: skip = 0 } = query;
  try {
    const list = await ProductOffer.find(offersQry)
      .populate({
        path: 'seller',
        select: 'name email phone image',
      })
      .populate({
        path: 'sender',
        select: 'name email phone image',
      })
      .populate({
        path: 'buyer',
        select: 'name email phone image',
      })
      .sort({
        created_at: -1,
      })
      .paginate({ top, skip });



    
    const { value:offers} = list;

    const list$= offers.map(async (ofr) => {
      const isMine = await ProductOffer.isMine({user, offer: ofr});


      return {...ofr.toJSON(), isMine};
    });


    list.value = await Promise.all(list$);
    return res.json(list);
  } catch (e) {
    return next(e);
  }
};
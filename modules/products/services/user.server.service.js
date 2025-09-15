const { model, Types } = require('mongoose');
const _ = require('lodash');
const { getDocId } = require('@helpers/utils/index');

const Favorite = model('Favorite');

exports.sanitizeQuery = (modelName, customFilter = {}, private_attrs = [], textSearch = false) => {
  const Model = model(modelName);

  /**
   * Sanitize the query
   * @controller Sanitize Query
   * @param {Express.Request} req The request
   * @param {OutcommingMessage} res The response
   * @param {Function} next Go to the next middleware
   */
  return async function sanitizeQuery(req, res, next) {
    try {
      const { $expand = '', $select = '', $q = '' } = req.query;

      let { $filter, $sort } = req.query;

      if (typeof $filter === 'string') {
        try {
          $filter = JSON.parse($filter);
        } catch (e) {
          $filter = {};
        }
      } else if (!$filter || typeof $filter !== 'object') {
        $filter = {};
      }

      $filter = { ...$filter, ...customFilter };

      /**
       * Check if query contain array
       */
      if (!_.isEmpty($filter)) {
        $filter = Object.fromEntries(
          Object.entries($filter).map((arr) => {
            if ((arr && Array.isArray(arr) && arr[1], Array.isArray(arr[1]))) {
              return [arr[0], { $in: arr[1] }];
            }
            return arr;
          }),
        );
      }

      // Text Search
      if ($q && $q.length) {
        // fuzzy search
        if (textSearch) {
          // text search
          $filter.$text = { $search: $q };
          req.$query = Model.find($filter, { score: { $meta: 'textScore' } }).select(
            $select
              .split(',')
              .map((attr) => attr.trim())
              .filter(Boolean)
              .join(' '),
          );
        } else {
          const stringQ = [];
          Object.entries(Model.schema.paths).forEach(([k, v]) => {
            if (v.instance === 'String' && v._index && private_attrs.indexOf(k) === -1) {
              stringQ.push({
                [k]: {
                  $regex: $q,
                  $options: 'i',
                },
              });
            }
          });

          $filter = { $and: [$filter, { $or: stringQ.length ? stringQ : [{}] }] };
          req.$query = Model.find($filter).select(
            $select
              .split(',')
              .map((attr) => attr.trim())
              .filter(Boolean)
              .join(' '),
          );
        }
      } else {
        req.$query = Model.find($filter).select(
          $select
            .split(',')
            .map((attr) => attr.trim())
            .filter(Boolean)
            .join(' '),
        );
      }

      // Sort
      if (typeof $sort === 'string') {
        try {
          $sort = JSON.parse($sort);
        } catch (e) {
          $sort = {};
        }
      } else if (!$sort || typeof $sort !== 'object') {
        $sort = {};
      }

      // sort with text score
      if ($q.length && textSearch) {
        $sort.score = { $meta: 'textScore' };
      }

      req.$query.collation({ locale: 'en' });
      req.$query.sort($sort);

      // Deep Populate
      if ($expand && $expand.length) {
        req.$query.deepPopulate($expand);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

exports.sanitizeBody = (protected_attrs = []) => {
  /**
   * Sanitize body
   * @controller Update
   * @param {IncommingMessage} req The request
   * @param {OutcommingMessage} res The response
   * @param {Function} next Go to the next middleware
   */
  return async function sanitizeBody(req, res, next) {
    try {
      const { body: obj } = req;

      const o = { ...obj };
      protected_attrs.forEach((attr) => delete o[attr]);

      req.body = o;
      return next();
    } catch (e) {
      return next(e);
    }
  };
};

/**
 * List all entities
 * @controller List
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.list = async function list(req, res, next, withFavoriteFlag = false) {
  const { query, $query, user } = req;
  const { $top: top = 10, $skip: skip = 0, $groupby = null } = query;

  try {

    const result = await $query.paginate({ top, skip });

    if ($groupby && result.value) {
      result.groupedvalue = _.groupBy(result.value, $groupby);
      result.groupedvalue = Object.entries(result.groupedvalue) // Turn object to array
        .map((arr) => ({
          title: arr[0],
          data: arr[1],
        }));
    }

    if (!user || result.value.length === 0) {
      return res.json(result);
    }

    if(withFavoriteFlag){
      const myFavoritesProductIds = await Favorite.findOne({ user: user._id }).distinct('product');

   

      if (myFavoritesProductIds && myFavoritesProductIds.length > 0) {
        result.value = await Promise.all(result.value.map(async (p) => {

          const favCount = await Favorite.count({product:getDocId(p)});
          // eslint-disable-next-line max-len
          const is_favorite= !!(p && myFavoritesProductIds.find((id) => getDocId(id) === getDocId(p)));
  
          return {
            ...p.toJSON(),
            is_favorite,
            fav_count: favCount,
            ok: true,
          };
  
        }));
      }
    }

    return res.json(result);

   
  } catch (e) {
    return next(e);
  }
};

/**
 * Create  entity
 * @controller Create
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.create = (modelName, passToNext = false) => {
  const Model = model(modelName);
  /**
   * Create new entity
   * @controller Create
   * @param {IncommingMessage} req The request
   * @param {OutcommingMessage} res The response
   * @param {Function} next Go to the next middleware
   */
  return async function create(req, res, next) {
    const { body } = req;
    const entity = new Model({
      ...body,
    });
    try {
      const result = await entity.save({ new: true });
      if (passToNext) {
        req.entity = result;
        return next();
      }
      return res.status(201).json(result);
    } catch (e) {
      return next(e);
    }
  };
};

/**
 * Get a specific entity
 * @controller Get one
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.getOne = async function getOne(req, res) {
  const { entity } = req;
  return res.json(entity);
};

/**
 * Get a specific entity
 * @controller Get one
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.removeOne = async function removeOne(req, res, next) {
  const { entity } = req;
  try {
    await entity.remove();
    return res.status(204).end();
  } catch (e) {
    return next(e);
  }
};

exports.deleteOne = (modelName, customFilter = {}) => {
  const Model = model(modelName);
  return async (req, res, next, id) => {
    try {
      await Model.deleteOne({ _id: id, ...customFilter });

      return res.status(204).end();
    } catch (e) {
      return next(e);
    }
  };
};

/**
 * Get a specific entity
 * @controller Get one
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.updateOne = async function updateOne(req, res, next) {
  const { entity, body } = req;
  try {
    entity.set(body);
    const result = await entity.save({ new: true });
    return res.json(result);
  } catch (e) {
    return next(e);
  }
};

exports.getById = (modelName) => {
  const Model = model(modelName);
  /**
   * Get entity by ID
   * @controller GetById
   * @param {IncommingMessage} req The request
   * @param {OutcommingMessage} res The response
   * @param {Function} next Go to the next middleware
   */
  return async (req, res, next, id) => {
    try {
      const { user } = req;
      const { $expand = '', $select = '',$favorite_flag = false } = req.query;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).send({
          message: req.t('PRODUCT_INVALID_ID', {
            id,
            modelName,
          }),
        });
      }

      let entity;

      try {
        req.$query = Model.findOne({
          _id: id,
        }).select(
          $select
            .split(',')
            .map((attr) => attr.trim())
            .filter(Boolean)
            .join(' '),
        );

        // Deep Populate
        if ($expand && $expand.length) {
          req.$query.deepPopulate($expand);
        }

        entity = await req.$query;
      } catch (e) {
        return next(e);
      }

      if (!entity) {
        return res.status(404).send({
          message: req.t('ENTITY_NOT_FOUND', {
            id,
            modelName,
          }),
        });
      }


      let result=entity;


      if($favorite_flag && user){
        const favProduct = await Favorite.findOne({ user: user._id,product: id});
        const favCount = await Favorite.count({product: id});

        console.log({
          action: 'getById',
          favProduct,
          favCount,
          $favorite_flag,
          user,
        });

        if (favProduct) {
          result= {...entity.toJSON(),is_favorite:true,fav_count:favCount};
          req.entity =result;
        }else{
          result= {...entity.toJSON(),is_favorite:false,fav_count:favCount};
          req.entity =result;
        }
      
      }else{
        req.entity =result;
      }

      switch (modelName) {
        case 'Product':
          req.product = result;
          break;
        case 'ProductOffer':
          req.productOffer = result;
          break;
        default:
          break;
      }




      return next();
    } catch (e) {
      return next(e);
    }
  };
};

/**
 * @decorator
 * @param {'$filter' | 'body'} type The type of the object to mutate
 * @param {object} payload The payload
 * @param {boolean} isMerge true to merge with the existing payload, false otherwise
 * @returns {Function} The middleware
 */
exports.set = (type = '$filter', payload = {}, isMerge = false) => {
  /**
   * Sets an object of the request
   * @controller Set
   * @param {Express.Request} req The request
   * @param {OutcommingMessage} res The response
   * @param {Function} next Go to the next middleware
   */
  return function set(req, res, next) {
    let { body } = req;
    let { $filter = {} } = req.query;

    switch (type) {
      case '$filter':
        if (typeof $filter === 'string') {
          try {
            $filter = JSON.parse($filter);
          } catch (e) {
            $filter = payload;
          }
        } else if (!$filter || typeof $filter !== 'object') {
          $filter = payload;
        }

        if (isMerge === true) {
          $filter = Object.assign($filter, payload);
        } else {
          $filter = payload;
        }

        break;
      case 'body':
        if (!body || typeof body !== 'object') {
          body = payload;
        }

        if (isMerge === true) {
          body = Object.assign(body, payload);
        } else {
          body = payload;
        }
        break;
      default:
        break;
    }

    return next();
  };
};

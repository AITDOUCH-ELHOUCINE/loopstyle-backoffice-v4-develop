const utils = require('@helpers/utils');
const { validate } = require('@helpers/utils');
const createProductSchema = require('../schemas/create_product.server.schema.json');
const productCtrl = require('../controllers/products.server.controller');
const favoritesController = require('../controllers/favorites.server.controller');
const chatsController = require('../controllers/chats.server.controller');
const offersController = require('../controllers/offers.server.controller');
const sendSchema = require('../schemas/channel-send.server.schema.json');
/**
 * @type { IAM.default }
 */
module.exports = {
  prefix: '/user/products',
  params: [
    {
      name: 'productId',
      middleware: productCtrl.getById,
    },
    {
      name: 'chatChannelId',
      middleware: chatsController.getChannelById,
    },
    {
      name: 'offerId',
      middleware: offersController.getOfferById,
    },
  ],
  routes: [
    {
      path: '/ping',
      methods: {
        get: {
          iam: 'products:user:ping',
          title: '1-Ping to Products Module',
          parents: ['products:user'],
          groups: [],
          description: 'Test if the module "Products" is up and running',
          middlewares: [productCtrl.ping],
        },
      },
    },
    {
      path: '/created_by_me',
      methods: {
        /**
         *
         * @params
         * [
         * {
         *   "key": "$favorite_flag",
         *   "value": "true",
         *   "description": "list with is_favorite filed for each product"
         * },
         * {
         *   "key": "$filter",
         *   "value": "{\"name\": \"nameX\"}",
         *   "description": "You can use this parameter to filter results with  specific attributes"
         * },
         * {
         *   "key": "$expand",
         *   "value": "productCount",
         *   "description": "You can use this parameter to expand related attributes"
         * },
         * {
         *   "key": "$sort",
         *   "value": "{ \"name\": \"DESC\" , \"created_at\": \"ASC\"}",
         *   "description": "You can use this parameter to sort result with specific attributes"
         * },
         *  {
         *   "key": "$select",
         *   "value": "name,created_at,updated_at",
         *   "description": "Use this parameter to select specific attributes"
         * },
         * {
         *   "key": "$q",
         *   "value": "azert",
         *   "description": "Use this parameter for fuzzy search (autocomplete)"
         * }]
         *
         */
        get: {
          iam: 'products:user:created_by_me',
          title: '2-My products',
          parents: ['products:user'],
          groups: [],
          description: 'API to fetch products list',
          middlewares: [productCtrl.sanitizeCreatedByMeQuery, productCtrl.listProduct],
        },
      },
    },
    {
      path: '/created_by_others',
      methods: {
        /**
         *
         * @params
         * [
         *  {
         *   "key": "$favorites_only",
         *   "value": "true",
         *   "description": "select only my favorites products"
         * },
         * {
         *   "key": "$favorite_flag",
         *   "value": "true",
         *   "description": "list with is_favorite filed for each product"
         * }
         * ,
         * {
         *   "key": "$filter",
         *   "value": "{\"name\": \"nameX\"}",
         *   "description": "You can use this parameter to filter results with  specific attributes"
         * },
         * {
         *   "key": "$expand",
         *   "value": "productCount",
         *   "description": "You can use this parameter to expand related attributes"
         * },
         * {
         *   "key": "$sort",
         *   "value": "{ \"name\": \"DESC\" , \"created_at\": \"ASC\"}",
         *   "description": "You can use this parameter to sort result with specific attributes"
         * },
         *  {
         *   "key": "$select",
         *   "value": "name,created_at,updated_at",
         *   "description": "Use this parameter to select specific attributes"
         * },
         * {
         *   "key": "$q",
         *   "value": "azert",
         *   "description": "Use this parameter for fuzzy search (autocomplete)"
         * }]
         *
         */
        get: {
          iam: 'products:user:created_by_others',
          title: '3-Products created by others',
          parents: ['products:user'],
          groups: [],
          description: 'API to fetch products list',
          middlewares: [
            productCtrl.getFavoritesProductsIds,
            productCtrl.sanitizeCreatedByOthersQuery,
            productCtrl.listProduct,
          ],
        },
      },
    },
    {
      path: '/',
      methods: {
        /**
         *
         * @params
         * [
         * {
         *   "key": "$favorite_flag",
         *   "value": "true",
         *   "description": "list with is_favorite filed for each product"
         * },
         * {
         *   "key": "$filter",
         *   "value": "{\"name\": \"nameX\"}",
         *   "description": "You can use this parameter to filter results with  specific attributes"
         * },
         * {
         *   "key": "$expand",
         *   "value": "productCount",
         *   "description": "You can use this parameter to expand related attributes"
         * },
         * {
         *   "key": "$sort",
         *   "value": "{ \"name\": \"DESC\" , \"created_at\": \"ASC\"}",
         *   "description": "You can use this parameter to sort result with specific attributes"
         * },
         *  {
         *   "key": "$select",
         *   "value": "name,created_at,updated_at",
         *   "description": "Use this parameter to select specific attributes"
         * },
         * {
         *   "key": "$q",
         *   "value": "azert",
         *   "description": "Use this parameter for fuzzy search (autocomplete)"
         * }]
         *
         */
        get: {
          iam: 'products:user:read_list',
          title: '4-List All products',
          parents: ['products:user', 'products:guest'],
          groups: [],
          description: 'API to fetch all products list',
          middlewares: [productCtrl.sanitizeQuery, productCtrl.listProduct],
        },
        /**
         * @body
         * {
         *    "name": "{{product_name}}",
         *    "description": "{{product_description}}",
         *    "price": 100,
         *    "category": "{{categoryId}}",
         *    "usage": "women", // ['men', 'babies', 'girls', 'boys', 'women'],
         *    "size": "xl",
         *    "brand": "zara",
         *    "color": "blue",
         *    "images": ["{{image_id_1}}", "{{image_id_2}}"],
         *    "address1": "{{product_address}}",
         *    "address2": "{{product_address2}}",
         *    "zipcode": "{{product_zipcode}}",
         *   "city": "{{product_city}}",
         *   "country": "{{product_country}}",
         *    "location": {
         *        "coordinates": [-6, 34]
         *    }
         * }
         */
        post: {
          iam: 'products:admin:create_one',
          title: '5-Create Product',
          parents: ['products:user'],
          groups: [],
          description: 'API to create new product',
          middlewares: [
            utils.validate(createProductSchema),
            productCtrl.validateProduct,
            productCtrl.createProduct,
            productCtrl.creationDone,
          ],
        },
      },
    },
    {
      path: '/:productId',
      methods: {
        /**
         *
         * @body
         * {
         *    "name":"{{product_name}}",
         *    "details":[""],
         *    "clients":["clientsid"]
         *
         * }
         *
         */
        put: {
          iam: 'products:user:update_one',
          title: '6-Update Product',
          parents: ['products:user'],
          groups: [],
          description: 'API to update one  product',
          middlewares: [productCtrl.sanitizeBody, productCtrl.updateProduct],
        },
        get: {
          iam: 'products:user:read_one',
          title: '7-Read Product by ID',
          parents: ['products:user','products:guest'],
          groups: [],
          description: 'API to read one Product by ID',
          middlewares: [productCtrl.oneProduct],
        },
        /*
         * @body
         * {
         *    "motif_delete":"{{motifDelete}}",
         *
         * }
         *
         */
        delete: {
          iam: 'products:user:delete_one',
          title: '8-delete Product',
          parents: ['products:user'],
          groups: [],
          description: 'API to update one  product',
          middlewares: [productCtrl.deleteProductUser],
        },
      },
    },
    {
      path: '/:productId/favorites',
      methods: {
        /**
         *
         * @body
         * {}
         *
         */
        post: {
          iam: 'products:user:favorites:add',
          title: '9-Add product to favories',
          parents: ['products:user'],
          groups: [],
          description: 'API add product into favorites',
          middlewares: [favoritesController.canAdd, favoritesController.addToFavorites],
        },
        delete: {
          iam: 'products:user:favorites:remove',
          title: '10-Remove product from favories',
          parents: ['products:user'],
          groups: [],
          description: 'API Remove product from favories',
          middlewares: [favoritesController.removeFromFavorites],
        },
      },
    },
    {
      path: '/:productId/chat-channels',
      methods: {
        get: {
          iam: 'products:user:chat-channels:list',
          title: '11-List  product chat channels',
          parents: ['products:user'],
          groups: [],
          description: 'API to list product chat channels',
          middlewares: [
            chatsController.sanitizeQuery,
            chatsController.createBuyerChannelIfNotExist,
            chatsController.list],
        },
      },
    },
    {
      path: '/:productId/chat-channels/:chatChannelId/messages',
      methods: {
        /**
         * @params
         * [{
         *   "key": "$top",
         *   "value": "10",
         *   "description": "Number of records to return"
         * }, {
         *   "key": "$skip",
         *   "value": "0",
         *   "description": "Number of records to skip"
         * }]
         *
         * @test
         * pm.test("Status code is 200", () => {
         *   pm.response.to.have.status(200);
         *   const json = pm.response.json().value;
         *   if(!Array.isArray(json) || json.length === 0) {
         *     return;
         *   }
         *
         *   const fId = pm.variables.get("messageId");
         *
         *   if(!fId || !json.find(one => one.id === fId)) {
         *     pm.environment.set("messageId", json[0]._id);
         *   }
         * });
         */
        get: {
          iam: 'products:user:chat-channels:messages:list',
          title: '12-List product chat channel messages',
          parents: ['products:user'],
          groups: [],
          description: 'API to list product chat channel messages',
          middlewares: [
            chatsController.messages],
        },
        /**
         * @body
         * {
         *   "type": "text",
         *   "text": "Message text",
         *   "media": "Message text",
         *   "mediaType": "image",
         *   "location": {"coordinates":[-6,34]}
         * }
         *
         * @params
         * [{
         *   "key": "$expand",
         *   "value": "sender",
         *   "description": "Expand attributes. Possible values: 'users' and 'sender'"
         * }]
         *
         * @test
         * pm.test("Status code is 200", () => {
         *   pm.response.to.have.status(200);
         *   const json = pm.response.json();
         *   pm.environment.set("messageId", json._id);
         * });
         */
        post: {
          iam: 'products:user:chat-channels:messages:send',
          title: '13-Send message to channel',
          groups: [],
          parents: ['products:user'],
          description: 'Send message to a specific channel',
          middlewares: [validate(sendSchema), chatsController.send],
        },
      },
    },
    {
      path: '/:productId/offers',
      methods: {
        get: {
          iam: 'products:user:offers:list',
          title: '14-List  product offers',
          parents: ['products:user'],
          groups: [],
          description: 'API to list product offers',
          middlewares: [
            offersController.offersList,
          ],
        },
        /**
         * @body
         * {
         *    "price": 100,
         * }
         */
        post: {
          iam: 'products:user:offers:create_one',
          title: '15-Create Offer',
          parents: ['products:user'],
          groups: [],
          description: 'API to create new product offer',
          middlewares: [
            productCtrl.checkProductAvailability,
            offersController.createOffer,
            offersController.createOfferResult,
          ],
        },
      },
    },
    {
      path: '/:productId/offers/:offerId',
      methods: {
  
        get: {
          iam: 'products:user:offers:read_one',
          title: '16-Read one Offer',
          parents: ['products:user'],
          groups: [],
          description: 'API to read one product offer',
          middlewares: [
            offersController.oneOffer,
          ],
        },
        /**
         * @body
         * {  
         * 
         *    "price": 120,
         *    "status": ["accepted","rejected","negotiated"],
         * }
         */
        put: {
          iam: 'products:user:offers:update_one',
          title: '17-Update one Offer',
          parents: ['products:user'],
          groups: [],
          description: 'API to update one product offer',
          middlewares: [
            productCtrl.checkProductAvailability,
            offersController.updateOffer,
          ],
        },
      },
    },
    {
      path: '/:productId/buy',
      methods: {
        /**
         * @body
         * {
         *    "status": ["accepted","rejected"],
         * }
         */
        put: {
          iam: 'products:user:buy_one',
          title: '18-Buy one Product',
          parents: ['products:user'],
          groups: [],
          description: 'API to update buy product offer',
          middlewares: [
            productCtrl.checkProductAvailability,
            productCtrl.getAcceptedOffer,
            productCtrl.setAcceptedOffer,
            productCtrl.createObvyPostalDelivery,
            productCtrl.buyProductResult,
          ],
        },
      },
    },
    {
      path: '/:productId/exit-transaction',
      methods: {
        /**
         * @body
         * {
         * }
         */
        put: {
          iam: 'products:user:cancel_exited',
          title: '19-Exit one transaction',
          parents: ['products:user'],
          groups: [],
          description: 'API to Exit one transaction',
          middlewares: [
            productCtrl.checkCanExitTransaction,
            productCtrl.exitProductTransaction,
          ],
        },
      },
    },
    {
      path: '/:productId/conform',
      methods: {
        /**
         * @body
         * {
         * }
         */
        post: {
          iam: 'products:user:conform_one',
          title: '20-Set Product as conformed',
          parents: ['products:user'],
          groups: [],
          description: 'API to update buy product',
          middlewares: [
            productCtrl.conformProduct,
          ],
        },
      },
    },
    {
      path: '/:productId/non-conform',
      methods: {
        /**
           * @body
           * {
           * }
           */
        post: {
          iam: 'products:user:non_conform_one',
          title: '21-Set Product as non conformed',
          parents: ['products:user'],
          groups: [],
          description: 'API to update buy product',
          middlewares: [
            productCtrl.nonConformProduct,
          ],
        },
      },
    },
    {
      path: '/:productId/rate',
      methods: {
        /**
         * @body
         * {
              "comment":"This is a comment",
              "note":4
          }
         */
        post: {
          iam: 'products:user:rate',
          title: '22-Rate product seller',
          parents: ['products:user'],
          groups: [],
          description: 'API to rate product seller',
          middlewares: [
            productCtrl.checkCanRate,
            productCtrl.rateProductSeller, 
            productCtrl.oneProduct,
          ],
        },
      },
    },
    {
      path: '/:productId/ratings',
      methods: {
        /**
         * @body
         * {
              "comment":"This is a comment",
              "note":4
          }
         */
        get: {
          iam: 'products:user:ratings',
          title: '23-Get all product seller rattings',
          parents: ['products:user'],
          groups: [],
          description: 'API to  get all product seller rattings',
          middlewares: [
            productCtrl.sanitizeRatingsQuery,
            productCtrl.getRatingsList, 
          ],
        },
      },
    },

  ],
};

const utils = require('@helpers/utils');
const ctrls = require('../controllers/bo.server.controller');
const createSchema = require('../schemas/create.server.schema.json');
const updateSchema = require('../schemas/update.server.schema.json');

/**
 * @type { IAM.default }
 */
module.exports = {
  prefix: '/bo/banners',
  params: [
    {
      name: 'bannerId',
      middleware: ctrls.getById,
    },
  ],
  routes: [
    {
      path: '/ping',
      methods: {
        get: {
          iam: 'banners:admin:ping',
          title: '1-Ping to Banners Module',
          parents: ['banners:admin'],
          groups: [],
          description: 'Test if the module "Banners" is up and running',
          middlewares: [ctrls.ping],
        },
      },
    },
    {
      path: '/',
      methods: {
        /**
         *
         * @body
         * {
         *    "name":"{{banner_name}}",
         *    "description":"",
         *    "image":"{{image}}"
         *
         * }
         *
         */
        post: {
          iam: 'banners:admin:create_one',
          title: '2-Create Banner',
          parents: ['banners:admin'],
          groups: [],
          description: 'API to create new banner',
          middlewares: [
            utils.validate(createSchema),
            ctrls.checkBannerExist,
            ctrls.createBanner,
          ],
        },
        /**
         *
         * @params
         * [
         * {
         *   "key": "$filter",
         *   "value": "{\"name\": \"nameX\"}",
         *   "description": "You can use this parameter to filter results with  specific attributes"
         * },
         * {
         *   "key": "$filter",
         *   "value": "{\"$or\": [{\"allClients\":true},{\"clients\":\"{{IDcleint}}\"}]}",
         *   "description": "You can use this parameter to filter results with  specific attributes and allClients"
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
          iam: 'banners:admin:read_list',
          title: '3-List banners',
          parents: ['banners:admin', 'banners:operator', 'banners:user'],
          groups: [],
          description: 'API to fetch banners list',
          middlewares: [ctrls.sanitizeQuery, ctrls.listBanner],
        },
      },
    }, {
      path: '/deleteMany/',
      methods: {
        delete: {
          iam: 'banners:admin:delete_many',
          title: '7-Delete Many Banners',
          parents: ['banners:admin'],
          groups: [],
          description: 'API to delete many banners by IDs',
          middlewares: [ctrls.deleteManyBanners]
        },
      },


    },
    {
      path: '/:bannerId',
      methods: {
        /**
         *
         * @body
         * {
         *    "name":"{{banner_name}}",
         *    "description":"",
         *    "image":"{{image}}"
         *
         * }
         *
         */
        put: {
          iam: 'banners:admin:update_one',
          title: '4-Update Banner',
          parents: ['banners:admin'],
          groups: [],
          description: 'API to update one  banner',
          middlewares: [
            utils.validate(updateSchema),
            ctrls.sanitizeBody,
            ctrls.updateBanner,
          ],
        },
        delete: {
          iam: 'banners:admin:delete_one',
          title: '5-Delete Banner',
          parents: ['banners:admin'],
          groups: [],
          description: 'API to delete one banner',
          middlewares: [ctrls.deleteBanner],
        },
        get: {
          iam: 'banners:admin:read_one',
          title: '6-Read Banner by ID',
          parents: ['banners:admin'],
          groups: [],
          description: 'API to read one Banner by ID',
          middlewares: [ctrls.oneBanner],
        },
      },
    }
  ],
};

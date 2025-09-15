const utils = require('@helpers/utils');
const ctrls = require('../controllers/user.server.controller');

/**
 * @type { IAM.default }
 */
module.exports = {
  prefix: '/user/banners',
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
          iam: 'banners:user:ping',
          title: '1-Ping to Banners Module',
          parents: ['banners:user'],
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
         * @params
         * [
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
          iam: 'banners:user:read_list',
          title: '2-List banners',
          parents: ['banners:user','banners:guest'],
          groups: [],
          description: 'API to fetch banners list',
          middlewares: [
            ctrls.sanitizeQuery, 
            ctrls.listBanner],
        },
      },
    },
    {
      path: '/:bannerId',
      methods: {
        get: {
          iam: 'banners:user:read_one',
          title: '3-Read Banner by ID',
          parents: ['banners:user','banners:guest'],
          groups: [],
          description: 'API to read one banner by ID',
          middlewares: [
            ctrls.oneBanner],
        },
      },
    },
  ],
};

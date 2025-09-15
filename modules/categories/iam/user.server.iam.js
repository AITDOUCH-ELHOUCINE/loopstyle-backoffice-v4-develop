const utils = require('@helpers/utils');
const ctrls = require('../controllers/user.server.controller');

/**
 * @type { IAM.default }
 */
module.exports = {
  prefix: '/user/categories',
  params: [
    {
      name: 'categoryId',
      middleware: ctrls.getById,
    },
  ],
  routes: [
    {
      path: '/ping',
      methods: {
        get: {
          iam: 'categories:user:ping',
          title: '1-Ping to Categories Module',
          parents: ['categories:user'],
          groups: [],
          description: 'Test if the module "Categories" is up and running',
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
          iam: 'categories:user:read_list',
          title: '2-List categories',
          parents: ['categories:user','categories:guest'],
          groups: [],
          description: 'API to fetch categories list',
          middlewares: [
            ctrls.sanitizeQuery, 
            ctrls.listCategory],
        },
      },
    },
    {
      path: '/:categoryId',
      methods: {
        get: {
          iam: 'categories:user:read_one',
          title: '3-Read Category by ID',
          parents: ['categories:user','categories:guest'],
          groups: [],
          description: 'API to read one category by ID',
          middlewares: [
            ctrls.oneCategory],
        },
      },
    },
  ],
};

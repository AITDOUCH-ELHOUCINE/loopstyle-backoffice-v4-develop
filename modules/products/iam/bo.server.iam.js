const utils = require('@helpers/utils');
const ctrls = require('../controllers/bo.server.controller');
const createSchema = require('../schemas/create_product.server.schema.json');
const updateSchema = require('../schemas/update.server.schema.json');

/**
 * @type { IAM.default }
 */
module.exports = {
  prefix: '/bo/products',
  params: [
    {
      name: 'productId',
      middleware: ctrls.getById,
    },
  ],
  routes: [
    {
      path: '/ping',
      methods: {
        get: {
          iam: 'products:admin:ping',
          title: '1-Ping to Products Module',
          parents: ['products:admin'],
          groups: [],
          description: 'Test if the module "Products" is up and running',
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
         *    "name":"{{name}}",
         *    "email":"{{email}}",
         *    "groupe":[""],
         *    "clients":["clientsid"]
         *    "prestataires":["prestatairesid"]
         *
         * }
         *
         */
        post: {
          iam: 'products:admin:create_one',
          title: '2-Create Product',
          parents: ['products:admin'],
          groups: [],
          description: 'API to create new product',
          middlewares: [
            utils.validate(createSchema),
            ctrls.createProduct,
            ctrls.creationDone,
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
          iam: 'products:admin:read_list',
          title: '3-List products',
          parents: ['products:admin'],
          groups: [],
          description: 'API to fetch products list',
          middlewares: [
            ctrls.sanitizeQuery,
            ctrls.listProduct,
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
          iam: 'products:admin:update_one',
          title: '4-Update Product',
          parents: ['products:admin'],
          groups: [],
          description: 'API to update one  product',
          middlewares: [
            utils.validate(updateSchema),
            ctrls.sanitizeBody,
            ctrls.updateProduct],
        },
        delete: {
          iam: 'products:admin:delete_one',
          title: '5-Delete Product',
          parents: ['products:admin'],
          groups: [],
          description: 'API to delete one product',
          middlewares: [
            ctrls.deleteProduct,
          ],
        },
        get: {
          iam: 'products:admin:read_one',
          title: '6-Read Product by ID',
          parents: ['products:admin'],
          groups: [],
          description: 'API to read one Product by ID',
          middlewares: [
            ctrls.oneProduct,
          ],
        },
      },
    },
  ],
};

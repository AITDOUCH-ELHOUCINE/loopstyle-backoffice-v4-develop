const utils = require('@helpers/utils');
const ctrls = require('../controllers/bo.server.controller');
const createSchema = require('../schemas/create.server.schema.json');
const updateSchema = require('../schemas/update.server.schema.json');

/**
 * @type { IAM.default }
 */
module.exports = {
  prefix: '/bo/categories',
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
          iam: 'categories:admin:ping',
          title: '1-Ping to Categories Module',
          parents: ['categories:admin'],
          groups: [],
          description: 'Test if the module "Categories" is up and running',
          middlewares: [ctrls.ping],
        },
      },
    },
    {
      path: '/',
      methods: {
        post: {
          iam: 'categories:admin:create_one',
          title: '2-Create Category',
          parents: ['categories:admin'],
          groups: [],
          description: 'API to create new category',
          middlewares: [
            utils.validate(createSchema),
            ctrls.checkCategoryExist,
            ctrls.createCategory,
          ],
        },
        get: {
          iam: 'categories:admin:read_list',
          title: '3-List categories',
          parents: ['categories:admin', 'categories:operator', 'categories:user'],
          groups: [],
          description: 'API to fetch categories list',
          middlewares: [ctrls.sanitizeQuery, ctrls.listCategory],
        },
      },
    },
    {
      path: '/deleteMany/',
      methods: {
        delete: {
          iam: 'categories:admin:delete_many',
          title: '7-Delete Many Categories',
          parents: ['categories:admin'],
          groups: [],
          description: 'API to delete many categories by IDs',
          middlewares: [ctrls.deleteManyCategories]
        },
      },


    },
    {
      path: '/:categoryId',
      methods: {
        put: {
          iam: 'categories:admin:update_one',
          title: '4-Update Category',
          parents: ['categories:admin'],
          groups: [],
          description: 'API to update one category',
          middlewares: [
            utils.validate(updateSchema),
            ctrls.sanitizeBody,
            ctrls.updateCategory,
          ],
        },
        delete: {
          iam: 'categories:admin:delete_one',
          title: '5-Delete Category',
          parents: ['categories:admin'],
          groups: [],
          description: 'API to delete one category',
          middlewares: [ctrls.deleteCategory],
        },
        get: {
          iam: 'categories:admin:read_one',
          title: '6-Read Category by ID',
          parents: ['categories:admin'],
          groups: [],
          description: 'API to read one Category by ID',
          middlewares: [ctrls.oneCategory],
        },
      },
    }


  ],
};

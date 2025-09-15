/**
 * Module dependencies.
 */
const utils = require('@helpers/utils');
const createUserSchema = require('../schemas/create_user.server.schema.json');
const boCtrls = require('../controllers/bo/bo.users.server.controller');

module.exports = {
  prefix: '/bo/users',
  params: [
    {
      name: 'userId',
      middleware: boCtrls.userByID,
    },
  ],
  routes: [
    {
      path: '/',
      methods: {
        /**
         * @headers
         * {
         *  "Content-Type": "application/json"
         * }
         *
         * @test
         * pm.test("The server respond with 200", () => {
         *  pm.response.to.have.status(200);
         * });
         *
         * @params
         * [
         * {
         *   "key": "$filter",
         *   "value": "{ \"email\":\"user@loopstyle.com\"}",
         *   "description": "You can use this parameter to filter results with  specific attributes"
         * },
         * {
         *   "key": "$expand",
         *   "value": "features",
         *   "description": "You can use this parameter to expand related attributes"
         * },
         * {
         *   "key": "$sort",
         *   "value": "{ \"email\": \"ASC\" , \"name\": \"DESC\"}",
         *   "description": "You can use this parameter to sort result with specific attributes"
         * },
         *  {
         *   "key": "$select",
         *   "value": "name.first,email,phone",
         *   "description": "Use this parameter to select specific attributes"
         * }]
         *
         *
         * @body
         * {
         *  "username": "{{username}}",
         *  "password": "{{password}}"
         * }
         */
        get: {
          parents: ['users:admin'],
          middlewares: [
            
            boCtrls.sanitizeQuery,
            boCtrls.clientsList,
          ],
          iam: 'users:bo:list',
          title: '1-List users',
          description: 'Gérer la liste des utilisateurs',
        },
        /**
         * @body
         * {
         *   "name": "samir",
         *   "email": "{{email}}",
         *   "role": "{{role}}"
         *
         * }
         *
         */
        post: {
          iam: 'users:bo:create',
          title: '2-Create New User',
          groups: [],
          parents: ['users:admin', 'users:operator'],
          description: 'Créer un nouvel utilisatuer',
          middlewares: [
            
            utils.validate(createUserSchema),
            boCtrls.createUser,
            boCtrls.sendWelcomeEmail,
            boCtrls.createUserSuccess,
          ],
        },
      },
    },
    {
      path: '/xls',
      methods: {
        get: {
          parents: ['users:admin', 'users:operator'],
          middlewares: [ boCtrls.usersXLS],
          iam: 'users:bo:xls',
          title: '3-Export users xls',
          description: 'Export all users  in xls file',
        },
      },
    },
    {
      path: '/:userId',
      methods: {
        get: {
          parents: ['users:admin', 'users:operator'],
          middlewares: [ boCtrls.readUser],
          iam: 'users:bo:read',
          title: '4-Get user',
          description: 'Get a specific user using his `id`',
        },
        /**
         * @body
         * {
         *   "name": "samir",
         *   "email": "{{email}}",
         *   "role": "{{role}}",
         *   "phone": "{{phone}}"
         *
         * }
         *
         */
        put: {
          parents: ['users:admin', 'users:operator'],
          middlewares: [boCtrls.sanitizeBody, boCtrls.updateUser],
          iam: 'users:bo:update',
          title: '5-Update an existing user',
          description: 'Update a specific user using his identifier',
        },
        delete: {
          parents: ['users:admin', 'users:operator'],
          middlewares: [
            
            boCtrls.checkCanDeleteUser,
            boCtrls.deleteUser,
            boCtrls.notifyDeletedUser,
          ],
          iam: 'users:bo:delete',
          title: '6-Remove an existing user',
          description: 'Remove a specific user using his identifier',
        },
      },
    },
  ],
};

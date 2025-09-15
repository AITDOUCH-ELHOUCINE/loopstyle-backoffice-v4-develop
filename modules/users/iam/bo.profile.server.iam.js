/**
 * Module dependencies.
 */
const utils = require('@helpers/utils');
const boCtrls = require('../controllers/bo.server.controller');


const updateUserSchema = require('../schemas/update_user.server.schema.json');

module.exports = {
  prefix: '/bo/me',
  params: [

  ],
  routes: [
    {
      path: '/',
      methods: {
        /**
         * @params
         * [{
         *   "key": "$expand",
         *   "value": "basketCount",
         *   "description": "You can use this parameter to expand related attributes"
         * }, {
         *   "key": "$select",
         *   "value": "name.first,email,iams",
         *   "description": "Use this parameter to select specific attributes"
         * }]
         */
        get: {
          parents: ['users:user', 'users:admin', 'users:operator'],
          middlewares: [
            boCtrls.sanitizeQuery,
            boCtrls.me
          ],
          iam: 'bo:profile:get',
          title: '1-Get current user details',
          description: 'API to fetch the current admin details',
        },
        /**
         * @body
         * {
         *   "name": {
         *     "first": "{{firstname}}",
         *     "last": "{{lastname}}"
         *   }
         * }
         */
        post: {
          parents: ['users:user', 'users:admin', 'users:operator'],
          middlewares: [
            utils.validate(updateUserSchema),
            boCtrls.update,
          ],
          iam: 'bo:profile:update',
          title: '2-Update profile',
          description: 'Update current admin details',
        },
      },
    },
  ],
};

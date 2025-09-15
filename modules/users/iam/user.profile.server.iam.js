/**
 * Module dependencies.
 */
const utils = require('@helpers/utils');

const users = require('../controllers/users.server.controller');

const updateUserSchema = require('../schemas/update_user.server.schema.json');

module.exports = {
  prefix: '/users/me',
  params: [],
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
          parents: ['users:user', 'users:user:profile'],
          middlewares: [users.sanitizeQuery, users.updateOnesignalTags, users.me],
          iam: 'users:bo:profile:read',
          title: '1-Get current user details',
          description: 'API to fetch the current user details',
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
          parents: ['users:user', 'users:admin', 'users:operator', 'users:manager'],
          middlewares: [utils.validate(updateUserSchema), users.update],
          iam: 'users:bo:profile:update',
          title: '2-Update profile',
          description: 'Update current user details',
        },
      },
    },
    {
      path: '/favorites',
      methods: {
        get: {
          parents: ['users:user'],
          middlewares: [users.sanitizeFavoritesQuery, users.listFavorite],
          iam: 'vendor:users:auth:profile:favorites:get',
          title: '4-Get current user profile picture',
          description: 'API to fetch the image of the current user',
        },
      },
    },
    {
      path: '/requestDelete',
      methods: {
        post: {
          parents: ['users:user', 'users:admin', 'users:operator', 'users:manager'],
          middlewares: [users.sendDeleteAccountRequest],
          iam: 'users:bo:profile:requestDelete',
          title: '3- Send Delete Account request',
          description: 'API to Send Delete Account request',
        },
      },
    },
  ],
};

/**
 * Module dependencies.
 */

const boCtrl = require('../controllers/bo.server.controller');



module.exports = {
  prefix: '/auth/bo',
  routes: [
    {
      path: '/signin',
      methods: {
        /**
         * @body
         * {
         *   "username": "admin1@loopstyle.com",
         *   "password": "Ab@123456"
         * }
         *
         * @params
         * [{
         *   "key": "$select",
         *   "value": "name,iams",
         *   "description": "Attributes to select"
         * }]
         *
         * @test
         * pm.test("Status code is 200", function () {
         *   pm.response.to.have.status(200);
         *   const json = pm.response.json();
         *   pm.environment.set("userId", json._id);
         * });
         */
        post: {
          parents: ['users:guest','users:user', 'users:admin', 'users:operator'],
          middlewares: [boCtrl.signin, boCtrl.me],
          iam: 'bo:auth:signin',
          title: '1-Signin',
          description: 'Sign in an existing user',
        },
      },
    },
    {
      path: '/signout',
      methods: {
        get: {
          parents: ['users:guest','users:user', 'users:admin', 'users:operator'],
          middlewares: [boCtrl.signout],
          iam: 'bo:auth:signout',
          title: '2-Signout',
          description: 'Signout the current user',
        },
      },
    },
    {
      path: '/forgot',
      methods: {
        /**
         * @body
         * {
         *  "username": "{{email}}"
         * }
         */
        post: {
          parents: ['users:guest','users:user', 'users:admin', 'users:operator'],
          middlewares: [boCtrl.generateNewPassword],
          iam: 'bo:auth:passwd:forgotten',
          title: '3-Reset the user password',
          description: 'Generate a reset password token and send it to the user',
        },
      },
    },

    {
      /**
       * @body
       * {
       *
       *  "currentPassword": "{{currentPassword}}",
       *  "newPassword": "{{newPassword}}",
       *  "verifyPassword": "{{verifyPassword}}",
       * }
       */
      path: '/password',
      methods: {
        post: {
          parents: ['users:user', 'users:admin', 'users:operator'],
          middlewares: [boCtrl.changePassword],
          iam: 'bo:passwd:change',
          title: '4-Change current user password',
          description: 'API to change the current user password',
        },
      },
    },
  ],
};

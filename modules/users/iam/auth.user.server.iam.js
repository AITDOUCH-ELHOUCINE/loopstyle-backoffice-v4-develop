/**
 * Module dependencies.
 */

const utils = require('@helpers/utils');
const users = require('../controllers/users.server.controller');
const signupSchema = require('../schemas/signup_user.server.schema.json');

module.exports = {
  prefix: '/auth/users',
  params: [],
  routes: [
    {
      path: '/signup',
      methods: {
        /**
         * @body
         * {
         *   "name": {
         *     "first": "{{firstName}}",
         *     "last": "{{lastName}}"
         *   },
         *   "email": "{{email}}",
         *   "password": "{{password}}",
         *   "phone": "{{phone}}",
         *   "countryCode": "{{countryCode}}",
         *   "birthdate": "{{birthdate}}",
         *   "address1": "{{address1}}",
         *   "address2": "{{address2}}",
         * }
         *
         * @test
         * pm.test("Status code is 200", function () {
         *   pm.response.to.have.status(200);
         *   const json = pm.response.json();
         *   pm.environment.set("userId", json._id);
         * });
         */
        post: {
          parents: [ 'users:guest'],
          middlewares: [
            utils.validate(signupSchema),
            users.signup, users.successSignup],
          iam: 'users:auth:signup',
          title: '1-Signup',
          description: 'Sign up a new user',
        },
      },
    },
    {
      path: '/signin',
      methods: {
        /**
         * @body
         * {
         *   "username": "{{email}}",
         *   "password": "{{password}}"
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
          parents: [ 'users:guest', 'users:user'],
          middlewares: [users.signin, users.me],
          iam: 'users:auth:signin',
          title: '1-Signin',
          description: 'Sign in an existing user',
        },
      },
    },
    {
      path: '/signout',
      methods: {
        get: {
          parents: [ 'users:guest','users:admin', 'users:operator', 'users:user'],
          middlewares: [users.signout],
          iam: 'users:auth:signout',
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
          parents: [ 'users:guest'],
          middlewares: [users.generateNewPassword],
          iam: 'users:auth:passwd:forgotten',
          title: '3-Reset the user password',
          description: 'Generate a reset password token and send it to the user',
        },
      },
    },
    {
  
      path: '/password',
      methods: {
        /**
       * @body
       * {
       *
       *  "currentPassword": "{{currentPassword}}",
       *  "newPassword": "{{newPassword}}",
       *  "verifyPassword": "{{verifyPassword}}"
       * }
       */
        post: {
          parents: ['users:user'],
          middlewares: [users.changePassword],
          iam: 'users:passwd:change',
          title: '4-Change current user password',
          description: 'API to change the current user password',
        },
      },
    },
  ],
};

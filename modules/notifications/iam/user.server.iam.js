const utils = require('@helpers/utils');
const ctrls = require('../controllers/user.server.controller');

/**
 * @type { IAM.default }
 */
module.exports = {
  prefix: '/user/notifications',
  params: [
    {
      name: 'notificationId',
      middleware: ctrls.getById,
    },
  ],
  routes: [
    {
      path: '/ping',
      methods: {
        get: {
          iam: 'notifications:user:ping',
          title: '1-Ping to Notifications Module',
          parents: ['notifications:user'],
          groups: [],
          description: 'Test if the module "Notifications" is up and running',
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
          iam: 'notifications:user:read_list',
          title: '2-List notifications',
          parents: ['notifications:user'],
          groups: [],
          description: 'API to fetch notifications list',
          middlewares: [ctrls.sanitizeQuery,
            ctrls.listNotification],
        },
      },
    },
    {
      path: '/:notificationId',
      methods: {
        get: {
          iam: 'notifications:user:read_one',
          title: '3-Read Notification by ID',
          parents: ['notifications:user'],
          groups: [],
          description: 'API to read one notification by ID',
          middlewares: [
            ctrls.oneNotification],
        },
      },
    },
  ],
};

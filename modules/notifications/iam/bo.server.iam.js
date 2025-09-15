const utils = require('@helpers/utils');
const ctrls = require('../controllers/bo.server.controller');
const createNotificationSchema = require('../schemas/create.server.schema.json');
const updateNotificationSchema = require('../schemas/update.server.schema.json');


/**
 * @type { IAM.default }
 */
module.exports = {
  prefix: '/bo/notifications',
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
          iam: 'notifications:admin:ping',
          title: '1-Ping to Notifications Module',
          parents: ['notifications:admin', 'notifications:operator'],
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
         * @body
         * {
         *    "name":"{{notification_name}}",
         *    "image":"{{image}}"
         * }
         *
         */
        post: {
          iam: 'notifications:admin:create_one',
          title: '2-Create Notification',
          parents: ['notifications:admin', 'notifications:operator'],
          groups: [],
          description: 'API to create new notification',
          middlewares: [
            utils.validate(createNotificationSchema),
            ctrls.createNotification,
            ctrls.sendBoNotification,
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
          iam: 'notifications:admin:read_list',
          title: '3-List notifications',
          parents: ['notifications:admin', 'notifications:operator'],
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
        /**
         *
         * @body
         * {
         *    "name":"{{notification_name}}",
         * }
         *
         */
        put: {
          iam: 'notifications:admin:update_one',
          title: '4-Update Notification',
          parents: ['notifications:admin', 'notifications:operator'],
          groups: [],
          description: 'API to update one  notification',
          middlewares: [
            utils.validate(updateNotificationSchema),
            ctrls.sanitizeBody,
            ctrls.updateNotification,
          ],
        },
        delete: {
          iam: 'notifications:admin:delete_one',
          title: '5-Delete Notification',
          parents: ['notifications:admin'],
          groups: [],
          description: 'API to delete one notification',
          middlewares: [
            ctrls.deleteNotification],
        },
        get: {
          iam: 'notifications:admin:read_one',
          title: '6-Read Notification by ID',
          parents: ['notifications:admin', 'notifications:operator'],
          groups: [],
          description: 'API to read one Notification by ID',
          middlewares: [
            ctrls.oneNotification],
        },
      },
    },
  ],
};

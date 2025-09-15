const utils = require('@helpers/utils');
const { validate } = require('@helpers/utils');
const createProductSchema = require('../schemas/create_product.server.schema.json');
const obvyController = require('../controllers/obvy.server.controller');
const sendSchema = require('../schemas/channel-send.server.schema.json');
/**
 * @type { IAM.default }
 */
module.exports = {
  prefix: '/obvy',
  params: [
  ],
  routes: [
    {
      path: '/webhooks',
      methods: {
        post: {
          iam: 'obvy:webhooks:post',
          title: '1-Obvy webhooks',
          parents: ['products:guest'],
          groups: [],
          description: 'API to handle Obvy webhooks',
          middlewares: [obvyController.handleGetObvyWebhook],
        },
        get: {
          iam: 'obvy:webhooks:get',
          title: '1-Obvy webhooks',
          parents: ['products:guest'],
          groups: [],
          description: 'API to handle Obvy webhooks',
          middlewares: [obvyController.handleGetObvyWebhook],
        },
      },
    },
    {
      path: '/payment/success',
      methods: {
        get: {
          iam: 'obvy:payments:success',
          title: '2-Obvy payment success',
          parents: ['products:guest'],
          groups: [],
          description: 'API to handle Obvy payment success',
          middlewares: [obvyController.handleObvyPaymentSuccess],
        },
      },
    },
    {
      path: '/payment/cancel',
      methods: {
        get: {
          iam: 'obvy:payments:cancel',
          title: '3-Obvy payment cancel',
          parents: ['products:guest'],
          groups: [],
          description: 'API to handle Obvy payment cancel',
          middlewares: [obvyController.handleObvyPaymentCancel],
        },
      },
    },

  ],
};

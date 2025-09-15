// eslint-disable-next-line

const ctrl = require('../controllers/main.server.controller');

module.exports = {
  prefix: '/bulk',
  params: [],
  routes: [{
    path: '/',
    methods: {
      post: {
        title: '1-Insert Bulk files',
        description: 'Upload file',
        groups: [],
        parents: ['files:admin'],
        iam: 'modules:files:bulk',
        middlewares: [
          ctrl.bulkInsert,
        ],
      },

    },
  }],
};

const utils = require('@helpers/utils');

const ctrl = require('../controllers/main.server.controller');
const metaSchema = require('../schemas/meta.server.schema');
const shareSchema = require('../schemas/share.server.schema');

module.exports = {
  prefix: '/files',
  params: [
    {
      name: 'fileID',
      middleware: ctrl.fileById,
    },
  ],
  routes: [
    {
      path: '/',
      methods: {
        /**
         * @bodyMode formdata
         *
         * @body
         * [{
         *   "key": "file",
         *   "type": "file"
         * }]
         *
         * @headers
         * {
         *   "Content-Type": "multipart/form-data"
         * }
         */
        post: {
          iam: 'files:main:upload',
          title: '1-Upload file',
          description: 'Upload file',
          parents: [
            'files:admin',
            'files:manager',
            'files:operator',
            'files:user',
            'files:guest',
          ],
          groups: [],
          middlewares: [ctrl.multer, ctrl.upload],
        },
        /**
         * @params
         * [{
         *   "key": "$top",
         *   "value": "10",
         *   "description": "Number of records to return"
         * }, {
         *   "key": "$skip",
         *   "value": "0",
         *   "description": "Number of records to skip"
         * }]
         *
         * @test
         * pm.test("Status code is 200", () => {
         *   pm.response.to.have.status(200);
         *   const json = pm.response.json().value;
         *   if(!Array.isArray(json) || json.length === 0) {
         *     return;
         *   }
         *
         *   const fId = pm.variables.get("fileID");
         *
         *   if(!fId || !json.find(one => one.id === fId)) {
         *     pm.environment.set("fileID", json[0]._id);
         *   }
         * });
         */
        get: {
          iam: 'files:main:list',
          title: '2-List files',
          description: 'List files',
          groups: [],
          parents: ['files:admin', 'files:operator'],
          middlewares: [
            ctrl.list],
        },
      },
    },
    {
      path: '/videoo',
      methods: {
        get: {
          iam: 'files:main:videostatus',
          title: '2-Static Viedo Streaming',
          description: 'Static Viedo Streaming',
          groups: [],
          parents: ['files:admin', 'files:operator'],
          middlewares: [
            ctrl.streamStaticFile],
        },
      },
    },
    {
      path: '/:fileID',
      methods: {
        get: {
          iam: 'files:main:read_meta',
          title: '3-Get file metadata',
          description: 'Get a file metadata',
          groups: [],
          parents: [
            
            'files:admin',
            'files:manager',
            'files:operator',
            'files:user',
            'files:guest',
          ],
          middlewares: [ctrl.canAccess, ctrl.one],
        },
        /**
         * @body
         * {
         *   "filename": "new name.png"
         * }
         */
        put: {
          iam: 'files:admin:edit_meta',
          title: '4-Edit file metadata',
          description: 'Edit file metadata',
          groups: [],
          parents: ['files:admin', 'files:operator'],
          middlewares: [utils.validate(metaSchema), ctrl.canEdit, ctrl.meta],
        },
        delete: {
          iam: 'files:main:delete',
          title: '5-Remove file',
          description: 'Remove a specific file',
          groups: [],
          parents: ['files:admin', 'files:operator'],
          middlewares: [ctrl.canEdit, ctrl.remove],
        },
      },
    },
    {
      path: '/:fileID/download',
      methods: {
        get: {
          iam: 'files:main:download',
          title: '6-Download file',
          description: 'Download a specific file',
          groups: [],
          parents: [
            
            'files:admin',
            'files:manager',
            'files:operator',
            'files:user',
            'files:guest',
          ],
          middlewares: [ctrl.canAccess, 
            ctrl.download(true)],
        },
      },
    },
    {
      path: '/:fileID/stream',
      methods: {
        get: {
          iam: 'files:main:stream',
          title: '6-streeam file',
          description: 'streeam a specific file',
          groups: [],
          parents: [
            
            'files:admin',
            'files:manager',
            'files:operator',
            'files:user',
            'files:guest',
          ],
          middlewares: [
            ctrl.canAccess, 
            ctrl.stream],
        },
      },
    },
    {
      path: '/:fileID/view',
      methods: {
        get: {
          iam: 'files:main:view',
          title: '7-View file',
          description: 'View a specific file',
          groups: [],
          parents: [
            
            'files:admin',
            'files:manager',
            'files:operator',
            'files:user',
            'files:guest',
          ],
          middlewares: [
            ctrl.canAccess,
            ctrl.download(false)],
        },
      },
    },
    {
      path: '/:fileID/share',
      methods: {
        /**
         * @body
         * [{
         *   "role": "guest",
         *   "canEdit": false
         * }, {
         *   "user": "{{userId}}",
         *   "canEdit": true
         * }]
         */
        post: {
          iam: 'files:main:share',
          title: '8-Share file',
          description: 'Share a specific file',
          groups: [],
          parents: ['files:admin', 'files:operator'],
          middlewares: [utils.validate(shareSchema), ctrl.canEdit, ctrl.share],
        },
      },
    },
    {
      path: '/:fileID/unshare',
      methods: {
        post: {
          iam: 'files:main:unshare',
          title: '9-Stop file sharing',
          description: 'Unshare a specific file',
          groups: [],
          parents: ['files:admin', 'files:operator'],
          middlewares: [ctrl.canEdit, ctrl.unshare],
        },
      },
    },
  ],
};

// const utils = require('@helpers/utils');

// // Controllers
// const ctrl = require('../controllers/role.server.controller');

// // validation schemas
// const createSchema = require('../schemas/create_role.server.schema.json');
// const updateSchema = require('../schemas/update_role.server.schema.json');

// module.exports = {
//   prefix: '/roles',
//   params: [
//     {
//       name: 'roleId',
//       middleware: ctrl.getById,
//     },
//   ],
//   routes: [
//     {
//       path: '/',
//       methods: {
//         get: {
//           title: 'Get available roles',
//           decription: 'Returns a list of the roles available',
//           iam: 'users:roles:list',
//           parents: ['users', 'users:roles'],
//           middlewares: [ctrl.listRoles],
//         },
//         /**
//          * @body
//          * {
//          *   "name": "{{roleName}}",
//          *   "value": "user",
//          *   "iams": [
//          *
//          *   ]
//          * }
//          */
//         post: {
//           title: 'Create new role',
//           description: 'Creates new role with the given permissions',
//           iam: 'users:roles:create',
//           parents: ['users', 'users:roles'],
//           middlewares: [
//             utils.validate(createSchema),
//             ctrl.verifyExisting,
//             ctrl.verifyIams,
//             ctrl.create,
//           ],
//         },
//       },
//     },
//     {
//       path: '/:roleId',
//       methods: {
//         get: {
//           title: 'Get a role by id',
//           description: 'returns the object of the role',
//           iam: 'users:roles:get',
//           parents: ['users', 'users:roles'],
//           middlewares: [ctrl.get],
//         },
//         put: {
//           title: 'Update a role',
//           description: 'Updates the role',
//           iam: 'users:roles:update',
//           parents: ['users', 'users:roles'],
//           middlewares: [
//             utils.validate(updateSchema),
//             ctrl.verifyIams,
//             ctrl.update],
//         },
//       },
//     },
//   ],
// };

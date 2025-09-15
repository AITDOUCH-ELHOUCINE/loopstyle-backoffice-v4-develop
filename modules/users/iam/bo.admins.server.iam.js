// /**
//  * Module dependencies.
//  */
// const adminCtrls = require('../controllers/bo.server.controller');

// module.exports = {
//   prefix: '/bo/admins',
//   params: [
//     {
//       name: 'adminId',
//       middleware: adminCtrls.adminByID,
//     },
//   ],
//   routes: [
//     {
//       path: '/',
//       methods: {
//         /**
//          * @headers
//          * {
//          *  "Content-Type": "application/json"
//          * }
//          *
//          * @test
//          * pm.test("The server respond with 200", () => {
//          *  pm.response.to.have.status(200);
//          * });
//          *
//          * @params
//          * [
//          * {
//          *   "key": "$filter",
//          *   "value": "{ \"email\":\"admin@loopstyle.com\"}",
//          *   "description": "You can use this parameter to filter results with  specific attributes"
//          * },
//          * {
//          *   "key": "$expand",
//          *   "value": "features",
//          *   "description": "You can use this parameter to expand related attributes"
//          * },
//          * {
//          *   "key": "$sort",
//          *   "value": "{ \"email\": \"ASC\" , \"name\": \"DESC\"}",
//          *   "description": "You can use this parameter to sort result with specific attributes"
//          * },
//          *  {
//          *   "key": "$select",
//          *   "value": "name.first,email,phone",
//          *   "description": "Use this parameter to select specific attributes"
//          * },
//          * {
//          *   "key": "$q",
//          *   "value": "azert",
//          *   "description": "Use this parameter for fuzzy search (autocomplete)"
//          * }]
//          *
//          *
//          * @body
//          * {
//          *  "username": "{{username}}",
//          *  "password": "{{password}}"
//          * }
//          */
//         get: {
//           parents: ['admins:admin'],
//           middlewares: [adminCtrls.sanitizeAdminQuery, adminCtrls.adminsList],
//           iam: 'admins:admin:list',
//           title: '1-List admins',
//           description: 'Gérer la liste des admins',
//         },
//         /**
//          * @body
//          * {
//          *   "name": {
//          *     "first": "{{firstname}}",
//          *     "last": "{{lastname}}"
//          *   },
//          *   "email": "{{email}}",
//          *   "role": "{{role}}",
//          *   "password": "{{password}}",
//          *   "username": "{{username}}",
//          *   "phone": "{{phone}}"
//          * }
//          *
//          */
//         post: {
//           iam: 'admins:admin:create',
//           title: '2-Create New admin',
//           groups: [],
//           parents: ['admins:admin'],
//           description: 'Créer un nouvel admin',
//           middlewares: [
//             adminCtrls.createAdmin,
//             adminCtrls.sendAdminWelcomeEmail,
//             adminCtrls.createAdminSuccess,
//           ],
//         },
//       },
//     },
//     {
//       path: '/:adminId/picture',
//       methods: {
//         get: {
//           parents: ['admins:admin'],
//           middlewares: [
//             adminCtrls.imageAdmin,
//             adminCtrls.svgAdmin({ size: 46, color: '#d35400', fill: '#ffffff' }),
//           ],
//           iam: 'admins:admin:picture',
//           title: '3-Get admin profile picture',
//           description: 'Get the profile picture of an existing admin his identifier',
//         },
//       },
//     },
//     {
//       path: '/:adminId/validate',
//       methods: {
//         post: {
//           iam: 'admin:admins:validate',
//           title: '4-Validate a Admin',
//           groups: [],
//           parents: ['admins:admin'],
//           description: 'Validate an existing admin',
//           middlewares: [adminCtrls.validateAdmin],
//         },
//       },
//     },
//     {
//       path: '/:adminId',
//       methods: {
//         get: {
//           parents: ['admins:admin'],
//           middlewares: [adminCtrls.readAdmin],
//           iam: 'admins:admin:read',
//           title: '5-Get user',
//           description: 'Get a specific admin using his `id`',
//         },
//         put: {
//           parents: ['admins:admin'],
//           middlewares: [adminCtrls.sanitizeAdminBody, adminCtrls.updateAdmin],
//           iam: 'admins:admin:update',
//           title: '6-Update an existing admin',
//           description: 'Update a specific admin using his identifier',
//         },
//         delete: {
//           parents: ['admins:admin'],
//           middlewares: [adminCtrls.deleteAdmin],
//           iam: 'admins:admin:delete',
//           title: '7-Remove an existing admin',
//           description: 'Remove a specific admin using his identifier',
//         },
//       },
//     },
//   ],
// };

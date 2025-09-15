module.exports = {
  modules: 'modules',
  server: {
    models: `modules/*/models/**/*.js`,
    routes:`modules/*/routes/**/*.js`,
    jobs: `modules/*/jobs/**/*.js`,
    config:  `modules/*/config/*.js`,
    iams: `modules/*/iams.json`,
    iam: `modules/*/iam/*.js`,
    bootstraps:`modules/*/bootstraps/*.js`,
    appConfig: `modules/*/app.config.js`,
    env: `modules/*/variables.meta.@(json|js)`,
    sockets: `modules/*/sockets/**/*.server.socket.js`,
    socketsConfig: `modules/*/sockets/**/*.server.socket.config.js`
  },
};

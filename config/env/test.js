module.exports = {
  db: {
    uri: 'mongodb+srv://loopstyle:REDb0OIAs74R8cn@cluster0.plrlmh5.mongodb.net/loopstyle-test?retryWrites=true&w=majority',
    // options: {
    //   user: '',
    //   pass: '',
    //   useNewUrlParser: true,
    // },
    // Enable mongoose debug mode
    debug: process.env.MONGODB_DEBUG || false,
    fake: true,
  },
  log: {
    // logging with Morgan - https://github.com/expressjs/morgan
    // Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
    format: 'dev',
    options: {
      // Stream defaults to process.stdout
      // Uncomment/comment to toggle the logging to a log on the file system
      stream: {
        directoryPath: process.cwd(),
        fileName: 'logs/access.log',
        rotatingLogs: {
          // for more info on rotating logs - https://github.com/holidayextras/file-stream-rotator#usage
          active: false, // activate to use rotating logs
          fileName: 'access-%DATE%.log', // if rotating logs are active, this fileName setting will be used
          frequency: 'daily',
          verbose: false,
        },
      },
    },
  },
  lib: {
    obvy: {
      apiUrl: 'http://localhost:9999/fake-obvy-api',
    },
  },
};

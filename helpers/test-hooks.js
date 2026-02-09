/* eslint-disable no-undef */
process.env.NODE_ENV = 'test';
process.env.DEBUG = '';
process.env.ADMIN_VALIDATE = false;

require('./polyfill');

const mongoose = require('../config/lib/mongoose');
const nock = require('nock');

let dataBase;

mongoose.loadModels();

suiteSetup((done) => {
  // Mock Obvy API
  nock('http://localhost:9999')
    .persist()
    .post('/fake-obvy-api/user')
    .reply(200, { id: 'fake-obvy-id', status: 'success' });

  mongoose.connect((db) => {
    dataBase = db;
    done();
  });
});

suiteTeardown((done) => {
  dataBase.dropDatabase((err) => {
    if (err) {
      console.error(err);
    } else {
      console.info('Successfully dropped db: ', dataBase.databaseName);
    }

    mongoose.disconnect((e) => {
      if (e) {
        console.info('Error disconnecting from database');
        console.info(e);
      }

      return done();
    });
  });
});

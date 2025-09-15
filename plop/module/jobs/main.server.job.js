/**
 * Module dependencies.
 */
const { model, connection } = require('mongoose');
const config = require('@config/index');


module.exports = function (agenda) {
  /**
   * Define job processor
   */
  agenda.define('{{{lowercase name}}}-job', async (job, done) => {
    try {
      console.info('{{{lowercase name}}}-job started');
      console.info('{{{lowercase name}}}-job job data');
      console.info(job.attrs.data)
      console.info('{{{lowercase name}}}-job finished');
      done();
    } catch (error) {
      console.error('{{{lowercase name}}}-job error');
      console.error(error);
      done(error);
    }
  });



  agenda.on('ready', async function () {});

  return agenda;
};

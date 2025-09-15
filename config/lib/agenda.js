const Agenda = require('agenda');
const { resolve } = require('path');
const config = require('..');

let agenda;
// Define the io property
Object.defineProperty(exports, 'agenda', {
  get: () => agenda,
});

module.exports.init = (connection) => {
  agenda = new Agenda({
    mongo:connection.db,
    db: {
      options: {
        useUnifiedTopology: true
      },
      collection: 'agendaJobs',
    },
  });

  // load all project
  config.files.server.jobs.forEach((jobPath) => {
    // eslint-disable-next-line\
    require(resolve(jobPath))(agenda);
  });

  agenda.on('start', function (job) {
    // console.info('Job %s starting', job.attrs.name);
  });
  agenda.on('complete', function (job) {
    // console.debug('Job %s finished', job.attrs.name);
  });
  agenda.on('success', function (job) {
    // console.debug('Job %s success', job.attrs.name);
  });

  agenda.on('fail', (err, job) => {
    console.error('Job %s fail', job.attrs.name);
    console.error(err);
  });

  agenda.on('ready', async function () {
    agenda.start();
  //   try {
  //     const numRemoved = await agenda.cancel({ name: 'getCodesErroneForPlanning' });
  //     console.log(`${numRemoved} instance(s) of 'getCodesErroneForPlanning' job cancelled.`);
  // } catch (error) {
  //     console.error('Error cancelling job:', error);
  // }
  });

  return agenda;
};

// /**
//  * Execute this file using the command:
//  * $ mongo --quiet --nodb ./data-retrieve.js
//  */

// eslint-disable-next-line
const conn = new Mongo();
const db = conn.getDB('app-dev');
const workflows = db.workflows
  .find({
    trackable: true,
  })
  .map((w) => w._id);

const c = db.contracts
  .find({
    workflow: {
      $in: workflows,
    },
  })
  .map((con) => con._id.valueOf());

// eslint-disable-next-line
printjson(c);

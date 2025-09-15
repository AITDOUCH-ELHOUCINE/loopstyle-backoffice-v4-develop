const utils = require('@helpers/utils');

const { getDocId } = utils;
const PREFIX = 'loopstyle';

module.exports = async (io, socket) => {
  const { user } = socket.request;

  if (user) {
    if (user.is_user) {
      const { client } = user;
      socket.join(`${PREFIX}:users:${getDocId(client)}`);


    }
  }
};

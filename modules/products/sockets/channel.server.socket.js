const PREFIX = 'chat';

module.exports = async (io, socket) => {
  const { user } = socket.request;

  if (user) {
    socket.join(`${PREFIX}:users:${user.id}`);
  }
};

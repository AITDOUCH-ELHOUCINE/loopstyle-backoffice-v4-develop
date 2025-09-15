module.exports = (config) => {
  const res = {};

  // Tag configuration
  const notification = {
    admin_protected_attrs: ['__v', 'type'],
    protected_attrs: ['__v'],
    private_attrs: ['__v', 'oneSignalResponse'],
    types: [
      'broadcast_users', // send notif to all clients of this channel.
      'to_selected_users', // send notification to a list of users.
    ],
  };

  return {
    ...config,
    ...res,
    app: {
      notification,
    },
  };
};

module.exports = (config) => {
  const res = {};

  // Category configuration
  const category = {
    mode:'local',
    admin_protected_attrs: [],
    protected_attrs: ['__v'],
    private_attrs: [],
  };

  return {
    ...config,
    ...res,
    app: {
      category,
    },
  };
};

module.exports = (config) => {
  const res = {};

  // Banner configuration
  const banner = {
    mode:'local',
    admin_protected_attrs: [],
    protected_attrs: ['__v'],
    private_attrs: [],
  };

  return {
    ...config,
    ...res,
    app: {
      banner,
    },
  };
};

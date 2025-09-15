const colorsData = require('./data/colors.json');

module.exports = (config) => {
  const res = {};

  // Product configuration
  const product = {
    mode: 'local',
    admin_protected_attrs: [],
    protected_attrs: ['__v'],
    private_attrs: [],
    sizes: ['xs', 's', 'm', 'l', 'xl', 'xxl'],
    usages: ['men', 'babies', 'girls', 'boys', 'women','baby-female','baby-male'],
    colors: colorsData.colors,
  };

  // Pain configuration
  const chatMessage = {
    admin_protected_attrs: [],
    protected_attrs: ['__v'],
    private_attrs: [],
  };

  return {
    ...config,
    ...res,
    app: {
      product,
      chatMessage,
    },
  };
};

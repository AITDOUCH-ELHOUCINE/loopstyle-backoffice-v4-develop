/**
 * Guest role
 * @type {Array}
 */
const guest = [
  // ********************** Vendor **********************
  'users:guest',

  // ********************** Modules **********************
  /**
   * Files IAMS
   */
  'files:guest',

  /**
   * products IAMs
   */
  'products:guest',

  /**
   * categories IAMs
   */
  'categories:guest',
  /**
   * banners IAMs
   */
  'banners:guest',
];

/**
 * User role
 * @type {Array}
 */
const user = [
  // ********************** Vendor **********************
  /**
   * Users IAMs
   */
  'users:user',
  // ********************** Modules **********************

  /**
   * Users IAMs
   */
  'products:user',

  /**
   * Files IAMS
   */
  'files:user',

  /**
   * categories IAMs
   */
  'categories:user',

  /**
   * notifictaions IAMs
   */
  'notifications:user',
  /**
   * banners IAMs
   */
  'banners:user',


];




/**
 * Admin role
 * @type {Array}
 */
const admin = [
  // ********************** Vendor **********************
  /**
   * Users IAMs
   */
  'users:admin',

  // ********************** Modules **********************
  /**
   * Files IAMS
   */

  'files:admin',
  /**
   * products IAMS
   */
  'products:admin',

  /**
   * categories IAMs
   */
  'categories:admin',

  /**
   * notifications IAMs
   */
  'notifications:admin',

  /**
   * banners IAMs
   */
  'banners:admin',
];

/**
 * All roles
 */
module.exports = [
  {
    name: 'guest',
    protected: true,
    title: 'Guest role',
    // eslint-disable-next-line quotes
    description: "Role given for any unauthenticated user, or users who don't have any role.",
    iams: guest,
  },
  {
    name: 'user',
    protected: true,
    iams: user,
    title: 'User role',
    description: 'The default role.',
  },
  {
    name: 'admin',
    protected: true,
    iams: admin,
    title: 'Admin role',
    description: 'Given to admins users.',
  },
];

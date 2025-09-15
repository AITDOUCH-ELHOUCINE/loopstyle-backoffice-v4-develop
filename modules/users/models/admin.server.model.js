/* eslint-disable max-len */
/* eslint-disable import/no-unresolved */
/**
 * Module dependencies.
 */
const mongoose = require('mongoose');
const moment = require('moment');
const { resolve } = require('path');

const { Schema, model } = mongoose;
const nunjucks = require('nunjucks');
const crypto = require('crypto');
const validator = require('validator');
const config = require('@config/index');
const utils = require('@helpers/utils');

const { v4: uuidv4 } = require('uuid');

const { getIO, googleMaps, getDocId, generateCode } = utils;
// const generatePassword = require('generate-password');
const owasp = require('owasp-password-strength-test');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');
const util = require('util');
const debug = require('debug')('modules:users:models:users');

moment.locale('fr');

/**
 * Medium Level
 * Rules:
 * -  must contain at least 1 alphabetical character.
 * -  must contain at least 1 numeric character.
 * -  must be 6 characters or longer.
 */
const mediumRegex = new RegExp(
  '^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})',
);

// Pass a hash of settings to the `config` method. The settings shown here are
// the defaults.
owasp.config({
  allowPassphrases: true,
  maxLength: 128,
  minLength: 8,
  minPhraseLength: 20,
  minOptionalTestsToPass: 4,
});

let smtpTransport;

if (config.mailer.options && config.mailer.options.auth && config.mailer.options.auth.pass) {
  smtpTransport = nodemailer.createTransport(config.mailer.options);
}

async function sendMail(subject, body, users = [], opts = {}) {
  const msg = {
    ...opts,
    to: users,
    from: config.mailer.from,
    subject,
    html: body,
  };

  if (!Array.isArray(users) || users.length === 0) {
    return false;
  }

  if (smtpTransport) {
    const send = util.promisify(smtpTransport.sendMail).bind(smtpTransport);
    try {
      const data = await send(msg);

      return data;
    } catch (e) {
      console.error(e);
      debug('Error while sending email', e, subject, users);
      return false;
    }
  }

  return false;
}
/**
 * A Validation function for local strategy properties
 */

const validateLocalStrategyProperty = () => true;
// return ((this.provider !== 'local' && !this.updated) || property.length);

/**
 * A Validation function for local strategy email
 */

const validateLocalStrategyEmail = (email) => validator.isEmail(email);

/**
 * A Validation function for local strategy phone
 */
const validateLocalStrategyPhone = (phone) => {
  if (!phone) {
    return true;
  }
  return (this.provider !== 'local' && !this.updated) || /^\+[1-9]{1}[0-9]{3,14}$/.test(phone);
};

/**
 * A Validation function for user roles
 */
const validateRole = async (name) => {
  const Role = mongoose.model('Role');
  try {
    const r = await Role.findOne({ name });
    return !!r;
  } catch (e) {
    return false;
  }
};

/**
 * Admin Schema
 */
const AdminSchema = new Schema(
  {
    code: {
      type: Number,
      min: 1,
    },
    uuid: {
      type: String,
      default: uuidv4,
    },
    uid: {
      type: String,
      index: true,
    },
    name: {
      first: {
        type: String,
        trim: true,
        required: 'Please fill your first name',
      },
      last: {
        type: String,
        trim: true,
        required: 'Please fill your last name',
      },
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      required: 'Please fill a valid email address',
    },
    username: {
      type: String,
      lowercase: true,
      trim: true,
    },
    accountEnabled: {
      type: Boolean,
      default: true,
    },
    notifEnabled: {
      type: Boolean,
      default: true,
    },
    phone: {
      type: String,
      lowercase: true,
      trim: true,
      validate: [validateLocalStrategyPhone, 'Please fill a valid phone number'],
    },
    countryCode: {
      type: String,
      default: '',
    },
    address1: {
      type: String,
      trim: true,
      default: '',
    },
    address2: {
      type: String,
      trim: true,
      default: '',
    },
    zipcode: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    country: {
      type: String,
      trim: true,
      default: '',
    },
    password: {
      type: String,
      default: '',
    },
    salt: {
      type: String,
    },
    data: {
      type: Object,
    },
    provider: {
      type: String,
      default: 'local',
      required: 'Provider is required',
    },
    image: {
      ref: 'FMFiles',
      type: 'ObjectId',
    },
    providerData: {},
    additionalProvidersData: {},
    roles: {
      type: [
        {
          type: String,
          lowercase: true,
          validate: [validateRole, 'The role is invalid'],
        },
      ],
      default: 'admin',
      validate: (v) => Array.isArray(v) && v.length === 1,
      // validate: [(val) => val.length !== 1, 'Must have one role'],
      required: 'Please provide at least one role',
    },
    role: {
      type: String,
      lowercase: true,
      validate: [validateRole, 'The role is invalid'],
      default: 'user',
      required: 'Please provide at least one role',
    },
    /* For reset password */
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    /* For validations */
    validations: {
      default: [],
      type: [
        {
          type: { type: String },
          validated: { type: Boolean, default: false },
          code: String,
          resends: { type: Number, default: 0 },
          created: { type: Date, default: new Date() },
          last_try: Date,
          tries: {
            type: Number,
            default: 0,
          },
        },
      ],
    },
    birthdate: {
      type: Date,
    },
    deleteRequestedAt: {
      type: Date,
    },
    lastUsageDate: {
      type: Date,
    },
  },
  {
    timestamps: config.lib.mongoose.timestamps,
    toObject: {
      transform(doc, ret) {
        const private_attrs = config.app.profile.private_attrs || [];
        // eslint-disable-next-line no-param-reassign
        private_attrs.forEach((attr) => {
          delete ret[attr];
        });
      },
      virtuals: true,
    },
    toJSON: {
      transform(doc, ret) {
        const private_attrs = config.app.profile.private_attrs || [];
        // eslint-disable-next-line no-param-reassign
        private_attrs.forEach((attr) => {
          delete ret[attr];
        });
      },
      virtuals: true,
    },
  },
);



// profileImageUrl  as Virtual field
AdminSchema.virtual('profileImageUrl').get(function get_image_url() {
  if (this.image) {
    return `${config.app.prefix}/files/${this.image}/view`;
  }

  return '/assets/img/users/m.png';
});

AdminSchema.virtual('id').get(function getId() {
  return this._id;
});

// is_user  as Virtual field
AdminSchema.virtual('is_user').get(function is_user() {
  return this.roles ? this.roles.includes('user') : false;
});

// is_admin  as Virtual field
AdminSchema.virtual('is_admin').get(function is_admin() {
  return this.roles ? this.roles.includes('admin') : false;
});

// is_manager  as Virtual field
AdminSchema.virtual('is_manager').get(function is_manager() {
  return this.roles ? this.roles.includes('manager') : false;
});

// is_operator  as Virtual field
AdminSchema.virtual('is_operator').get(function is_operator() {
  return this.roles ? this.roles.includes('operator') : false;
});
/**
 *  name.full
 */
AdminSchema.virtual('fullName').get(function getId() {
  return `${this.name.first} ${this.name.last}`;
});
/**
 *  did client requested account delete
 */
AdminSchema.virtual('hasRequestAccountDelete').get(function getId() {
  return !!this.deleteRequestedAt;
});
/**
 * Hook a pre save method to hash the password
 */

AdminSchema.pre('save', async function pre_save(next) {
  if (this.password && this.isModified('password')) {
    this.salt = crypto.randomBytes(16).toString('base64');
    this.password = this.constructor.hashPassword(this.password, this.salt);
  }
  // set code
  if (this.isNew && !this.code) {
    this.uid = generateCode('users');
  }
  // set roles
  if (this.role && this.isModified('role')) {
    this.roles = [this.role];
  }
  // set username
  if (this.email && this.isModified('email')) {
    this.username = this.email;
  }


  next();
});

/**
 * Hook a pre validate method to test the local password
 */

AdminSchema.pre('validate', function pre_validate(next) {
  if (this.provider === 'local' && this.password && this.isModified('password')) {
    // const result = owasp.test(this.password);

    // if (result.errors.length) {
    //   const error = result.errors.join(' ');
    //   this.invalidate('password', error);
    // }
    if (mediumRegex.test(this.password)) {
      next();
    } else {
      this.invalidate('password', 'Minimum 6 caractères (ex: Ab@123456)');
    }
  }

  next();
});

/**
 * Create instance method for hashing a password
 */
AdminSchema.statics.hashPassword = function hash_pwd(password, salt) {
  if (salt && password) {
    return crypto
      .pbkdf2Sync(password, Buffer.from(salt, 'base64'), 10000, 64, 'sha512')
      .toString('base64');
  }
  return password;
};

/**
 * Create instance method for authenticating user
 */
AdminSchema.methods.authenticate = function authenticate(password) {
  return this.password === this.constructor.hashPassword(password, this.salt);
};
/**
 * Create instance method for get Social Fields
 */
AdminSchema.methods.toSocialObject = function toSocialObject() {
  // eslint-disable-next-line no-param-reassign
  const obj = {};
  // eslint-disable-next-line no-return-assign
  config.app.profile.social_attrs.map((attr) => (obj[attr] = this[attr]));

  return obj;
};

/**
 * Create instance method to set location user
 */
AdminSchema.methods.setLocation = function setLocation(coordinates) {
  if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
    this.location.coordinates = coordinates;
  }
};

/**
 * Get profile info
 */
AdminSchema.methods.getInfo = async function getInfo() {
  const user = this;
  const { uuid, name, email, phone, countryCode, image } = user;

  return {
    uuid,
    name,
    email,
    phone,
    countryCode,
    image,
  };
};

/**
 * Create instance method to get  profile
 */
AdminSchema.methods.getProfile = function getProfile() {
  return {
    name: this.name,
    email: this.email,
    phone: this.phone,
    countryCode: this.countryCode,
    image: this.image,
    profileImageUrl: this.profileImageUrl || '',
    location: this.location,
    address1: this.address1,
    address2: this.address2,
    zipcode: this.zipcode,
    city: this.city,
    country: this.country,
  };
};

/**
 * Send an sms to the user
 */
AdminSchema.methods.sendSMS = function send_sms(body) {
  if (this.phone && twilioConfig) {
    return twilioConfig.messages.create({
      to: this.phone,
      from: config.twilio.from,
      body,
    });
  }

  return false;
};

/**
 * Send an email to the user
 */

AdminSchema.methods.sendMail = function send_mail(subject, body, opts = {}) {
  return sendMail(subject, body, [this.email], opts);
};

AdminSchema.statics.notifyAdminByEmail = async function notifyAdminByEmail(type, user, order, req) {
  try {
    const moduleName = order.constructor.modelName === 'ProOrder' ? 'proOrders' : 'orders';

    const { email } = user;

    const { publicAddress, prefix } = config.app;
    let receiptLink = '';

    let tpl;
    let title = '';

    switch (type) {
      case 'receipt':
        tpl = resolve('modules/users/templates/new-receipt.server.view.swig');
        title = `Votre reçu LoopStyle : ${order.code}`;
        receiptLink = `${publicAddress}${prefix}/user/orders/${order._id}/receipt`;

        break;
      case 'receiptPro':
        tpl = resolve('modules/users/templates/new-receipt-pro.server.view.swig');
        title = `Votre reçu LoopStyle Pro : ${order.code}`;
        receiptLink = `${publicAddress}${prefix}/user/proorders/${order._id}/receiptpro`;
        break;
      case 'accountDeleted':
        tpl = resolve('modules/users/templates/account-deleted-user.server.view.swig');
        title = 'Compte Supprimé';
        break;
      default:
        return true;
    }

    const body = nunjucks.render(tpl, {
      appName: config.app.title,
      name: user.name,
      email: user.email,
      phone: user.phone,
      country: user.country,
      receiptLink: `${receiptLink}`,
    });

    await sendMail(title, body, [email], {});

    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

/**
 * Send an email to a collection of users
 */
AdminSchema.query.sendMail = async function send_mail_col(subject, body, opts = {}) {
  const users = await this;
  const emails = [...users.map((u) => u.email)];
  console.info('admin notif will be sent to :');
  console.info(emails);

  return sendMail(subject, body, emails, opts);
};

/**
 * Send a notification
 */
AdminSchema.methods.notify = function notify() {
  throw new Error('Not implement yet!');
};

/**
 * Get json value of the user
 */
AdminSchema.methods.json = function json() {
  const private_attrs = config.app.profile.private_attrs || [];
  const obj = this.toJSON({
    virtuals: true,
  });

  private_attrs.forEach((attr) => delete obj[attr]);

  return obj;
};

/**
 * Sanitize user object
 */
AdminSchema.statics.sanitize = function sanitize(obj) {
  const o = { ...obj };
  const protected_attrs = config.app.profile.protected_attrs || [];

  protected_attrs.forEach((attr) => delete o[attr]);

  return o;
};

/**
 * Generates a random passphrase that passes the owasp test.
 * Returns a promise that resolves with the generated passphrase, or rejects
 * with an error if something goes wrong.
 * NOTE: Passphrases are only tested against the required owasp strength tests,
 * and not the optional tests.
 */

AdminSchema.statics.generateRandomPassphrase = function generateRandomPassphrase() {
  return new Promise((resolve, reject) => {
    try {
      const upperCharLength = 1;
      const lowerCharLength = 4;
      const numberLength = 2;
      const specialCharLength = 1;
      const lowerCharset = 'abcdefghijklmnopqrstuvwxyz';
      const upperCharset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      const specialCharset = '!#$%&()*+,-./:;<=>?@_{|}~';
      let password = '';
      for (let i = 0, n = upperCharset.length; i < upperCharLength; i += 1) {
        password += upperCharset.charAt(Math.floor(Math.random() * n));
      }
      for (let i = 0, n = lowerCharset.length; i < lowerCharLength; i += 1) {
        password += lowerCharset.charAt(Math.floor(Math.random() * n));
      }
      for (let i = 0, n = specialCharset.length; i < specialCharLength; i += 1) {
        password += specialCharset.charAt(Math.floor(Math.random() * n));
      }
      for (let i = 0, n = numbers.length; i < numberLength; i += 1) {
        password += numbers.charAt(Math.floor(Math.random() * n));
      }

      // Create a copy of the original string to be randomized ['A', 'B', ... , 'G']
      console.info('new Password= ', password);
      resolve(password);
    } catch (error) {
      reject(error);
    }
  });
};

const AdminModel = mongoose.model('Admin', AdminSchema);

AdminSchema.index({ email: 1 }, { unique: true });

AdminSchema.index({ created_at: -1 });
AdminSchema.index({ updated_at: -1 });

AdminModel.createIndexes();

module.exports = AdminModel;

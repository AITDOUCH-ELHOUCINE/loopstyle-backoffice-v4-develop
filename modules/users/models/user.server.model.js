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
const notifHelper = require('@helpers/notifications');
const { v4: uuidv4 } = require('uuid');

const { getIO, googleMaps, getDocId, generateCode } = utils;
// const generatePassword = require('generate-password');
const owasp = require('owasp-password-strength-test');
// [SMTP - commented out, switch back if needed]
// const nodemailer = require('nodemailer');
const twilio = require('twilio');
// const sgMail = require('@sendgrid/mail');
// const util = require('util');
const https = require('https');
const debug = require('debug')('modules:users:models:users');
const obvyPlugin = require('@helpers/obvy/db-plugin');

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

// [SMTP - commented out, switch back if needed]
// let smtpTransport;
// if (config.mailer.options && config.mailer.options.auth && config.mailer.options.auth.pass) {
//   smtpTransport = nodemailer.createTransport({
//     ...config.mailer.options,
//     connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10000),
//     greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10000),
//     socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 20000),
//   });
// }

// Brevo (Sendinblue) HTTP API sender — works on Render where SMTP is blocked
function sendBrevoRequest(apiKey, payload) {
  return new Promise((resolve, reject) => {
    const body = Buffer.from(JSON.stringify(payload));
    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': body.length,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve({ statusCode: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ statusCode: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function sendMail(subject, body, users = [], opts = {}) {
  if (!Array.isArray(users) || users.length === 0) {
    return false;
  }

  const apiKey = process.env.BREVO_API_KEY;
  const from = config.mailer.from || process.env.MAILER_FROM || 'Loopstyle';

  if (!apiKey) {
    console.error('[Mailer] BREVO_API_KEY not configured');
    return false;
  }

  const payload = {
    sender: { name: from, email: process.env.BREVO_SENDER_EMAIL || 'noreply@loopstyle.com' },
    to: users.map((email) => ({ email })),
    subject,
    htmlContent: body,
  };

  try {
    const result = await sendBrevoRequest(apiKey, payload);
    if (result.statusCode === 200 || result.statusCode === 201) {
      return result.body;
    }
    console.error('[Mailer] Brevo API error', result.statusCode, result.body);
    return false;
  } catch (e) {
    console.error('[Mailer] Brevo API request failed', e);
    debug('Error while sending email via Brevo API', e, subject, users);
    return false;
  }
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
 * User Schema
 */
const UserSchema = new Schema(
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
    rating: {
      count: { type: Number, default: 0 },
      note: { type: Number, default: 0 },
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
      default: 'user',
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
    gender: {
      type: String,
      enum: ['homme', 'femme', ''],
      default: '',
    },
    deleteRequestedAt: {
      type: Date,
    },
    lastUsageDate: {
      type: Date,
    },
    // Express session id
    sessionId: {
      type: String,
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
UserSchema.virtual('profileImageUrl').get(function get_image_url() {
  if (this.image) {
    return `${config.app.prefix}/files/${this.image}/view`;
  }

  return '/assets/img/users/m.png';
});

UserSchema.virtual('id').get(function getId() {
  return this._id;
});

// is_user  as Virtual field
UserSchema.virtual('is_user').get(function is_user() {
  return this.roles ? this.roles.includes('user') : false;
});

// is_admin  as Virtual field
UserSchema.virtual('is_admin').get(function is_admin() {
  return this.roles ? this.roles.includes('admin') : false;
});

// is_manager  as Virtual field
UserSchema.virtual('is_manager').get(function is_manager() {
  return this.roles ? this.roles.includes('manager') : false;
});

// is_operator  as Virtual field
UserSchema.virtual('is_operator').get(function is_operator() {
  return this.roles ? this.roles.includes('operator') : false;
});
/**
 *  name.full
 */
UserSchema.virtual('fullName').get(function getId() {
  return `${this.name.first} ${this.name.last}`;
});
/**
 *  did client requested account delete
 */
UserSchema.virtual('hasRequestAccountDelete').get(function getId() {
  return !!this.deleteRequestedAt;
});
/**
 * Hook a pre save method to hash the password
 */

UserSchema.pre('save', async function pre_save(next) {
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

UserSchema.pre('validate', function pre_validate(next) {
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
UserSchema.statics.hashPassword = function hash_pwd(password, salt) {
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
UserSchema.methods.authenticate = function authenticate(password) {
  return this.password === this.constructor.hashPassword(password, this.salt);
};
/**
 * Create instance method for get Social Fields
 */
UserSchema.methods.toSocialObject = function toSocialObject() {
  // eslint-disable-next-line no-param-reassign
  const obj = {};
  // eslint-disable-next-line no-return-assign
  config.app.profile.social_attrs.map((attr) => (obj[attr] = this[attr]));

  return obj;
};

/**
 * Create instance method to set location user
 */
UserSchema.methods.setLocation = function setLocation(coordinates) {
  if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
    this.location.coordinates = coordinates;
  }
};

/**
 * Get profile info
 */
UserSchema.methods.getInfo = async function getInfo() {
  const user = this;


  return {
    uuid: user.uuid,
    name: user.name,
    email: user.email,
    phone: user.phone,
    countryCode: user.countryCode,
    image: user.image,
    profileImageUrl: user.profileImageUrl || '',
    location: user.location,
    address1: user.address1,
    address2: user.address2,
    zipcode: user.zipcode,
    city: user.city,
    country: user.country,
  };
};


/**
 * Update OneSignal Device By User Id
 */
UserSchema.methods.update_onesignal_device = async function update_onesignal_device(
  custom_data = {},
) {
  try {
    const user = this;
    const { email } = user;


    if (typeof custom_data !== 'object') {
      // eslint-disable-next-line no-param-reassign
      custom_data = {};
    }

    // max 2 tags
    notifHelper.updateClientDeviceByUserId(`${user.id}`, {
      tags: {
        email,

      },
      ...custom_data,
    });

    return true;
  } catch (error) {
    console.error('Update Device By UserId Error');
    console.error(error);
    return false;
  }
};
/**
 * Create instance method to get  profile
 */
UserSchema.methods.getProfile = function getProfile() {
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
UserSchema.methods.sendSMS = function send_sms(body) {
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
UserSchema.methods.sendMail = function send_mail(subject, body, opts = {}) {
  return sendMail(subject, body, [this.email], opts);
};

UserSchema.statics.notifyUserByEmail = async function notifyUserByEmail(type, user, order, req) {
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
UserSchema.query.sendMail = async function send_mail_col(subject, body, opts = {}) {
  const users = await this;
  const emails = [...users.map((u) => u.email)];
  console.info('admin notif will be sent to :');
  console.info(emails);

  return sendMail(subject, body, emails, opts);
};

/**
 * Send a notification
 */
UserSchema.methods.notify = function notify() {
  throw new Error('Not implement yet!');
};



/**
 * Send push notification
 */
UserSchema.methods.send_push_notification = async function send_push_notification(
  { notif_type,
    headings_labels = [],
    content_labels = [],
    custom_data = {} },
) {
  try {
    const _this = this;

    console.log('send_push_notification');
    console.log({
      notif_type,
      headings_labels,
      content_labels,
      custom_data,
    });


    if (!_this.notifEnabled) {
      return null;
    }

    if (typeof custom_data !== 'object') {
      // eslint-disable-next-line no-param-reassign
      custom_data = {};
    }

    custom_data.notif_type = notif_type || undefined;

    // filter by external_user_id
    const msg = await notifHelper.clientMessage(
      {
        include_external_user_ids: [_this.id],
        notif_type,
        headings_labels,
        content_labels,
        custom_data,
      },
    );


    await notifHelper.sendClientNotification(msg);
    console.info(`notif type= ${notif_type} sent to client = ${_this.email}`);

    return true;

  } catch (error) {
    console.error('Send_Notification Error');
    console.error(error);
    return false;
  }
};
/**
 * Get json value of the user
 */
UserSchema.methods.json = function json() {
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
UserSchema.statics.sanitize = function sanitize(obj) {
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

UserSchema.statics.generateRandomPassphrase = function generateRandomPassphrase() {
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


/**
 * Enable obvy plugin
 */
UserSchema.plugin(obvyPlugin);

const UserModel = mongoose.model('User', UserSchema);

UserSchema.index({ email: 1 }, { unique: true, name: 'user_email_uniq' });

UserSchema.index({ created_at: -1 });
UserSchema.index({ updated_at: -1 });

UserModel.createIndexes();

module.exports = UserModel;

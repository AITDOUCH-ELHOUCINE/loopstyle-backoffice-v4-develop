/**
 * Module dependencies.
 */
const { resolve } = require('path');
const mongoose = require('mongoose');

const nunjucks = require('nunjucks');
const config = require('@config/index');
const svc = require('../../services/bo.server.service');

const User = mongoose.model('User');

const { modules } = config.files.server;

const { boUrl } = config.global;
// eslint-disable-next-line import/no-dynamic-require
const errorHandler = require(resolve(`./${modules}/core/controllers/errors.server.controller`));

/**
 * Validate an existing user
 * @controller ValidateUser
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.validateUser = async function validateUser(req, res, next) {
  const { entity } = req;

  entity.validations.set(
    'validations',
    entity.validations.map((v) => (v.type === 'admin' ? { ...v, validated: true } : v)),
  );

  try {
    await entity.save();
  } catch (e) {
    return next(e);
  }

  return res.status(204).end();
};

/**
 * Read a single Admin infos
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.readUser = async function readUser(req, res) {
  res.json(
    req.model.toJSON({
      virtuals: true,
    }),
  );
};

/**
 * Create new Admin
 * @controller Create new Admin
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.createUser = async function createUser(req, res, next) {
  const { body } = req;
  const {
    name,
    email,
    role,
    phone,
    countryCode,
    image,
  } = body;

  const password = await Admin.generateRandomPassphrase();
  req.password = password;
  console.info('newPassword= ', password);

  try {

    const b = {
      name,
      phone,
      image,
      role,
      roles: [role],
      email,
      countryCode,
      password,
      accountEnabled: true,
      validations: [
        {
          type: 'email',
          validated: true,
        },
      ],
    };

    const createdUser = new User(b);
    req.createdUser = await createdUser.save({ new: true });
    return next();
  } catch (e) {
    switch (true) {
      case e.code === 11000:
        return res.status(400).json({
          message: req.t('USER_ALREADY_EXISTS'),
        });
      case e.name === 'ValidationError':
        return res.status(400).json({
          message: e.message,
        });
      default:
        return next(e);
    }
  }
};

/**
 * Send Welcom Email
 * @controller send Welcome Email
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.sendUserWelcomeEmail = async function sendUserWelcomeEmail(req, res, next) {
  try {
    const { createdUser, password } = req;
    // Determine the template based on user's role
    let tpl;
    if (createdUser.role === 'admin') {
      tpl = resolve('modules/users/templates/new-admin.server.view.swig');
    } else if (createdUser.role === 'operator') {
      tpl = resolve('modules/users/templates/new-operator.server.view.swig');
    } else if (createdUser.role === 'user') {
      tpl = resolve('modules/users/templates/new-account.server.view.swig');
    } else {
      return res.status(400).send({
        message: `Unsupported role: ${  createdUser.role}`,
      });
    }
    const title = 'Nouveau compte LoopStyle ';

    const mail_body = nunjucks.render(tpl, {
      appName: config.app.title,
      fistName: createdUser.name,
      email: createdUser.email,
      password,
      boUrl,
    });

    await createdUser.sendMail(title, mail_body);

    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * createUserSuccess
 * @controller create user Success
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.createUserSuccess = async function createUserSuccess(req, res, next) {
  try {
    const { createdUser } = req;
    return res.status(200).json(createdUser);
  } catch (e) {
    return next(e);
  }
};
/**
 * Send the profile picture of a specific user
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.imageUser = async function picture(req, res, next) {
  try {
    const { model } = req;
    const { image: pic } = model;

    if (!pic) {
      return next();
    }

    return res.redirect(`${config.app.prefix}/files/${pic}/view`);
  } catch (error) {
    console.error(error);
    return next(error);
  }
};

/**
 * Update a Admin
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.updateUser = async function updateUser(req, res, next) {
  try {
    const user = req.model;
    const { body } = req;

    console.log('=== DEBUG UPDATE USER ===');
    console.log('req.body:', JSON.stringify(req.body, null, 2));
    console.log('User before update:', user.toJSON());

    // Gérer spécifiquement les propriétés imbriquées du nom
    if (body.name) {
      // S'assurer que user.name existe
      if (!user.name) {
        user.name = {};
      }
      
      if (body.name.first !== undefined) {
        user.name.first = body.name.first;
      }
      if (body.name.last !== undefined) {
        user.name.last = body.name.last;
      }
      
      // Marquer le champ modifié pour Mongoose
      user.markModified('name');
    }

    // Gérer les autres propriétés
    const allowedFields = [
      'gender', 'birthdate', 'country', 'city', 'address1',
      'countryCode', 'phone', 'email', 'accountEnabled', 'notifEnabled',
      'role', 'fonction', 'client', 'image'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        user[field] = body[field];
      }
    });

    // Gérer le mot de passe seulement si fourni et non vide
    // Ne pas traiter confirm_password côté serveur
    if (body.password && body.password.trim() !== '' && body.password !== 'undefined') {
      user.password = body.password;
      console.log('Password will be updated');
    }

    // Supprimer les champs qui ne doivent pas être sauvegardés
    delete body.confirm_password;

    console.log('User before save:', user.toJSON());
    
    const updatedUser = await user.save();

    console.log('User updated successfully:', updatedUser.name);

    return res.json(updatedUser.toJSON({ virtuals: true }));

  } catch (e) {
    console.error('Update error:', e);
    
    // Gestion d'erreurs plus détaillée
    if (e.name === 'ValidationError') {
      const errors = Object.keys(e.errors).map(key => ({
        field: key,
        message: e.errors[key].message
      }));
      
      return res.status(400).json({
        message: 'Erreur de validation',
        errors: errors
      });
    }
    
    switch (true) {
      case e.code === 11000:
        return res.status(400).json({
          message: req.t ? req.t('USER_ALREADY_EXISTS') : 'Utilisateur déjà existant',
        });
      case e.name === 'CastError':
        return res.status(400).json({
          message: 'Format de données invalide',
        });
      default:
        return next(e);
    }
  }
};

/**
 * Delete a Admin
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.deleteUser = async function deleteUser(req, res) {
  const user = req.model;

  user.remove((err) => {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err),
      });
    }

    return res.status(204).end();
  });
};

/**
 * Return an svg image from the Admin
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.svgUser = ({ size = 46, color = '#d35400', fill = '#ffffff' }) =>
  async function svg(req, res) {
    const { model } = req;
    const { name } = model;
    const { full } = name;
    const text = full
      .split(' ')
      .map((n) => n.charAt(0))
      .join('');

    res.set('Content-Type', 'image/svg+xml');
    return res.render(resolve(__dirname, '../views/profile-picture.server.view.swig'), {
      text,
      size,
      color,
      fill,
    });
  };





/**
 * Sanitize the bpdy
 * @controller Sanitize Query
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.sanitizeUserBody = async function sanitizeUserBody(req, res, next) {
  try {
    const protected_attrs = config.app.profile.admin_protected_attrs || [];

    return await svc.sanitizeBody(protected_attrs)(req, res, next);
  } catch (e) {
    return next(e);
  }
};

/**
 * List of Users
 */
exports.usersList = async function usersList(req, res, next) {
  try {
    return await svc.list(req, res, next);
  } catch (e) {
    return next(e);
  }
};

/**
 * Get Admin by ID
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.userById = async function userById(req, res, next, id) {
  return svc.getById('User')(req, res, next, id);
};


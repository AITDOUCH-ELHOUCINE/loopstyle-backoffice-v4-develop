/* eslint-disable quotes */
/**
 * Module dependencies.
 */
const { resolve } = require('path');
const mongoose = require('mongoose');
const nunjucks = require('nunjucks');

const moment = require('moment');
const XLSX = require('xlsx');

const config = require('@config/index');
const svc = require('../../services/bo.server.service');

const { boUrl } = config.global;
const User = mongoose.model('User');

const { modules } = config.files.server;

moment.locale('fr');

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
 * Read a single user infos
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
 * Create new user
 * @controller Create new user
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.createUser = async function createUser(req, res, next) {
  const { body } = req;
  const { name, email, role, phone, countryCode, image, client, fonction } = body;

  const password = await User.generateRandomPassphrase();
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
      fonction,
      countryCode,
      password,
      client,
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
exports.sendWelcomeEmail = async function sendWelcomeEmail(req, res, next) {
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
        message: (`Unsupported role: ${  createdUser.role}`),
      });
    }
    const title = 'Nouveau compte LoopStyle';


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
 *createUserSuccess
 * @controller send Welcome Email
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
exports.image = async function picture(req, res, next) {
  const { model } = req;
  const { image: pic } = model;

  if (!pic) {
    return next();
  }

  return res.redirect(`${config.app.prefix}/files/${pic}/view`);
};

/**
 * Update a User
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
 * check if user account is deleted
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.checkCanDeleteUser = async function checkCanDeleteUser(req, res, next) {
  try {
    const { model } = req;
    if (!model.hasRequestAccountDelete)
      return res.status(400).json({
        ok: false,
        message: req.t('USER_DID_NOT_REQUEST_ACCOUNT_DELETE'),
      });

    return next();
  } catch (e) {
    return next(e);
  }
};
/**
 * Delete a user
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.deleteUser = async function deleteUser(req, res, next) {
  try {

    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * check if user account is deleted
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.notifyDeletedUser = async function notifyDeletedUser(req, res, next) {
  try {
    const { deletedUser } = req;

    // 1- notify Deleted User
    await User.notifyUserByEmail('accountDeleted', deletedUser, {}, req);

    return res.json({
      ok: true,
      message: req.t('ACCOUNT_DELETED_SUCCSSSFULLY'),
    });
  } catch (e) {
    return next(e);
  }
};
/**
 * Return an svg image from the user
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.svg = ({ size = 46, color = '#d35400', fill = '#ffffff' }) =>
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
 * Sanitize the query
 * @controller Sanitize Query
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.sanitizeQuery = async function sanitizeQuery(req, res, next) {
  try {
    return await svc.sanitizeQuery('User', {})(req, res, next);
  } catch (e) {
    return next(e);
  }
};

/**
 * Sanitize the bpdy
 * @controller Sanitize Query
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.sanitizeBody = async function sanitizeBody(req, res, next) {
  try {
    const protected_attrs = config.app.profile.admin_protected_attrs || [];

    return await svc.sanitizeBody(protected_attrs)(req, res, next);
  } catch (e) {
    return next(e);
  }
};

/**
 * List of clients
 */
exports.clientsList = async function clientsList(req, res, next) {
  try {
    return await svc.list(req, res, next);
  } catch (e) {
    return next(e);
  }
};

/**
 * Get user by ID
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.userByID = async function userByID(req, res, next, id) {
  return svc.getById('User')(req, res, next, id);
};

/**
 * Users Excel
 * @controller  "User"
 * @param {Express.Request} req The request
 * @param {OutcommingMessage} res The response
 * @param {OutcommingMessage} next The next
 */
exports.usersXLS = async function usersXLS(req, res, next) {
  try {
    const { channel } = req;
    const users = await User.find({ channel }).lean({ virtuals: true });
    // console.log('usersXLS');
    // console.log(user);
    const users_data = users.map((u) => {
      return {
        Nom: u.name,
        Email: u.email,
        Tel: u.phone,
        // Adresse: u.address1,
        'Date de naissance': u.birthdate ? moment(u.birthdate).format('L') : '',
        "Date d'inscription": moment(u.created_at).format('L'),
        "Heure d'inscription": moment(u.created_at).format('LT'),
      };
    });

    const fileName = 'clients.xlsx';
    /* generate workbook */
    const wb = XLSX.utils.book_new();
    /* generate  1st worksheet */
    const ws1 = XLSX.utils.json_to_sheet(users_data);
    /* generate second worksheet */
    // const ws2 = XLSX.utils.json_to_sheet(users_not_adherents);
    /* append woorksheet to workbook */
    XLSX.utils.book_append_sheet(wb, ws1, 'clients');
    // XLSX.utils.book_append_sheet(wb, ws2, 'USERS_NON_ADHERENTS');
    // XLSX.writeFile(newWB, 'liste des demande.xlsx');

    /* generate buffer */
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    // var buf = fs.writeFileSync("sheetjs.xlsx");
    /* send to client */
    res.header('Content-Type', 'application/octet-stream');
    res.header('Content-Disposition', `attachement; filename=${fileName}`);
    res.header('Cache-Control', 'public, max-age=31557600');
    return res.status(200).send(buf);
  } catch (e) {
    return next(e);
  }
};

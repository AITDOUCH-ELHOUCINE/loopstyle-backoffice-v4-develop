/**
 * Module dependencies.
 */
const { resolve } = require('path');
const mongoose = require('mongoose');
const nunjucks = require('nunjucks');
const config = require('@config/index');
const svc = require('../../services/bo.server.service');

const { boUrl } = config.global;
const Admin = mongoose.model('Admin');

// eslint-disable-next-line import/no-dynamic-require
const errorHandler = require(resolve(`./${config.files.server.modules}/core/controllers/errors.server.controller`));

/**
 * Validate an existing admin
 */
exports.validateAdmin = async function validateAdmin(req, res, next) {
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
 * Read a single admin infos
 */
exports.readAdmin = async function readAdmin(req, res) {
    res.json(
        req.model.toJSON({
            virtuals: true,
        }),
    );
};

/**
 * Create new admin
 */
exports.createAdmin = async function createAdmin(req, res, next) {
    const { body } = req;
    const { name, email, role, phone, countryCode, image } = body;

    const password = await Admin.generateRandomPassphrase();
    req.password = password;

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

        const createdAdmin = new Admin(b);
        req.createdAdmin = await createdAdmin.save({ new: true });

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
 * Send Welcome Email
 */
exports.sendAdminWelcomeEmail = async function sendAdminWelcomeEmail(req, res, next) {
    try {
        const { createdAdmin, password } = req;

        const tpl = resolve('modules/users/templates/new-admin.server.view.swig');
        const title = 'Nouveau compte Admin LoopStyle';

        const mail_body = nunjucks.render(tpl, {
            appName: config.app.title,
            fistName: createdAdmin.name,
            email: createdAdmin.email,
            password,
            boUrl,
        });

        await createdAdmin.sendMail(title, mail_body);

        return next();

    } catch (e) {
        return next(e);
    }
};

/**
 * createAdminSuccess
 */
exports.createAdminSuccess = async function createAdminSuccess(req, res, next) {
    try {
        const { createdAdmin } = req;
        return res.status(200).json(createdAdmin);
    } catch (e) {
        return next(e);
    }
};

/**
 * Send the profile picture of a specific admin
 */
exports.imageAdmin = async function imageAdmin(req, res, next) {
    const { model } = req;
    const { image: pic } = model;

    if (!pic) {
        return next();
    }

    return res.redirect(`${config.app.prefix}/files/${pic}/view`);
};

/**
 * Return an svg image from the Admin
 */
exports.svgAdmin = ({ size = 46, color = '#d35400', fill = '#ffffff' }) =>
    async function svg(req, res) {
        const { model } = req;
        const { name } = model;

        let text = '';
        if (name && name.full) {
            text = name.full
                .split(' ')
                .map((n) => n.charAt(0))
                .join('');
        } else {
            text = '?';
        }

        res.set('Content-Type', 'image/svg+xml');
        return res.render(resolve(__dirname, '../views/profile-picture.server.view.swig'), {
            text,
            size,
            color,
            fill,
        });
    };

/**
 * Update an Admin
 */
exports.updateAdmin = async function updateAdmin(req, res, next) {
    try {
        const admin = req.model;
        const { body } = req;

        // Handle name nested properties
        if (body.name) {
            if (!admin.name) admin.name = {};
            if (body.name.first !== undefined) admin.name.first = body.name.first;
            if (body.name.last !== undefined) admin.name.last = body.name.last;
            admin.markModified('name');
        }

        const allowedFields = [
            'phone', 'email', 'accountEnabled', 'role', 'image', 'countryCode'
        ];

        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                admin[field] = body[field];
            }
        });

        if (body.password && body.password.trim() !== '') {
            admin.password = body.password;
        }

        const updatedAdmin = await admin.save();
        return res.json(updatedAdmin.toJSON({ virtuals: true }));

    } catch (e) {
        if (e.name === 'ValidationError') {
            return res.status(400).json({ message: e.message });
        }
        return next(e);
    }
};

/**
 * Delete an Admin
 */
exports.deleteAdmin = async function deleteAdmin(req, res) {
    const admin = req.model;

    admin.remove((err) => {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err),
            });
        }

        return res.status(204).end();
    });
};

/**
 * Sanitize the query
 */
exports.sanitizeAdminQuery = async function sanitizeAdminQuery(req, res, next) {
    try {
        return await svc.sanitizeQuery('Admin', {})(req, res, next);
    } catch (e) {
        return next(e);
    }
};

/**
 * Sanitize the body
 */
exports.sanitizeAdminBody = async function sanitizeAdminBody(req, res, next) {
    try {
        const protected_attrs = config.app.profile.admin_protected_attrs || [];
        return await svc.sanitizeBody(protected_attrs)(req, res, next);
    } catch (e) {
        return next(e);
    }
};

/**
 * List of Admins
 */
exports.adminsList = async function adminsList(req, res, next) {
    try {
        return await svc.list(req, res, next);
    } catch (e) {
        return next(e);
    }
};

/**
 * Get Admin by ID
 */
exports.adminByID = async function adminByID(req, res, next, id) {
    return svc.getById('Admin')(req, res, next, id);
};

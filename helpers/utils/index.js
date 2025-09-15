const Ajv = require('ajv');
const chalk = require('chalk');

const config = require('@config/index');
const { model, Types, Model: MongooseModel } = require('mongoose');
const debug = require('debug')('boilerplate:helpers:utils');
const { resolve } = require('path');
const { readFile } = require('fs');
const { promisify } = require('util');
const ajvErrors = require('ajv-errors');
const nunjucks = require('nunjucks');
const sockets = require('@config/lib/socket.io');
const crons = require('@config/lib/agenda');
const googleMaps = require('@config/lib/google-maps');
const pdf = require('html-pdf');
const util = require('util');
const nodemailer = require('nodemailer');

const moment = require('moment');

const roleCache = {};
let excludeCache;
const readFile$ = promisify(readFile);

let COLOR_BACKGROUND = 'FF228A8C';
let COLOR_FONT_WHITE = 'FFFFFFFF';

exports.asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Validates a payload with a given schema
 * @param {Object} schema The schema of the payload
 */
exports.validate = (schema, type = 'body') =>
  async function validateSchema(req, res, next) {
    const ajv = new Ajv({ allErrors: true, jsonPointers: true });
    ajvErrors(ajv);

    const validate = ajv.compile(schema);
    let obj;

    switch (type) {
      case 'params':
        obj = req.query;
        break;
      default:
        obj = req.body;
        break;
    }

    if (validate(obj)) {
      return next();
    }

    return res.status(400).json({
      success: false,
      result: validate.errors.map((err) => ({
        message: req.t(err.message),
        data: err.params,
        dataPath: err.dataPath,
      })),
    });
  };

/**
 * Check current user has IAM
 * @param {Object} iam the IAM to check
 */
exports.hasIAM = (iam) =>
  async function hasIAM(req, res, next) {
    const IAM = model('IAM');
    const { iams } = req;
    let count;

    // Check if the permission exist in data base.
    try {
      count = await IAM.countDocuments({ iam });
    } catch (e) {
      return next(e);
    }
    if (count <= 0) return res.status(404).json({ message: `Permission(IAM) ${iam} not found` });

    // Check if the user has the permission.
    if (iams.find((el) => el.iam === iam) === undefined) {
      return res.status(403).json({ message: `You don't have permission ${iam} to continue` });
    }

    return next();
  };

/**
 * Gets the base URL of the request
 * @param {IncomingMessage} req The request
 */
exports.getBaseURLFromRequest = (req) => {
  const protocol = req.get('x-forwarded-proto') || req.protocol;
  return `${protocol}://${req.get('host')}`;
};

/**
 * Select Attributs
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next The callback
 */
exports.select = async function selectAttributes(req, res, next) {
  const query = req.query.$select;
  if (query) {
    const selection = query
      .split(',')
      .filter((attr) => ['owner.salt', 'owner.secret_key', 'private_attrs'].indexOf(attr) < 0);
    if (selection.length > 0) {
      req.$query = req.$query.select(selection.join(' '));
    }
  }
  return next();
};

/**
 * Expand Attributs
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next The callback
 */
exports.expand = (select1, select2, sort1, sort2) =>
  async function expandAttributes(req, res, next) {
    const exp = req.query.$expand;
    if (exp) {
      const expArray = exp.split(',');
      expArray.forEach((element) => {
        if (!element.includes('.')) {
          req.$query = req.$query.populate({
            path: element,
            select: select1,
            options: { sort: sort1 },
          });
        } else {
          const expArray2 = element.split('.');
          req.$query = req.$query.populate({
            path: expArray2[0],
            populate: {
              path: expArray2[1],
              select: select2,
              options: { sort: sort2 },
            },
            select: select1,
            options: { sort: sort1 },
          });
        }
      });
    }
    return next();
  };

/**
 * Execution
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next The callback
 */
exports.exec = (withpagination = false, passTonext = false) =>
  async function executeQuery(req, res, next) {
    let result;
    if (withpagination) {
      const { query } = req;
      const { $skip: skip, $top: top } = query;
      try {
        result = await req.$query.paginate({ top, skip });
      } catch (e) {
        return next(e);
      }
    } else {
      try {
        result = await req.$query.exec();
      } catch (e) {
        return next(e);
      }
    }
    if (!passTonext) {
      return res.status(200).json(result);
    }
    req.$query = result;
    return next();
  };

/**
 * Create a new user that has a specific list of IAMs
 * @param {Object} credentials An object containing the username and the password
 * @param {Array} iams An array of IAM keys to affect to the current user
 * @param {String} name The name of the group to generate
 */
exports.createUser = async (
  credentials = {
    username: 'username',
    password: 'jsI$Aw3$0m3',
  },
  iams = ['users:auth:signin'],
  name = 'role-tests',
) => {
  const IAM = model('IAM');
  const User = model('User');
  const Role = model('Role');

  const list = await IAM.find({
    iam: {
      $in: iams,
    },
  });
  if (roleCache[name]) {
    await roleCache[name].remove();
  }
  try {
    roleCache[name] = await new Role({
      name,
      iams: list,
    }).save({ new: true });
  } catch (e) {
    debug(e);
  }

  const user = await new User({
    name: {
      first: 'Full',
      last: 'Name',
    },
    email: `${credentials.username}@example.com`,
    username: credentials.username,
    password: credentials.password,
    provider: 'local',
    role: name,
    validations: [
      {
        type: 'admin',
        validated: true,
      },
      {
        type: 'email',
        validated: true,
      },
    ],
  }).save({ new: true });

  return user;
};

/**
 * Check an IAM if it is exluded or not
 * @param {Object} iam The IAM object
 */
exports.isExcluded = async ({ iam, parents = [] }) => {
  if (!excludeCache) {
    let content = '';
    try {
      content = await readFile$(resolve('.api.exclude'), { encoding: 'utf8' });
    } catch (e) {
      // Ignore, just proceed
    }

    excludeCache = content
      .split('\n')
      .map((one) => one.trim())
      .filter((one) => Boolean(one) && !one.startsWith('#'));
  }

  let found = excludeCache.includes(iam);

  if (found) {
    return {
      found: true,
      reason: 'iam',
      data: iam,
    };
  }

  found = excludeCache.find((one) => parents.includes(one));

  if (found) {
    return {
      found: true,
      reason: 'parent',
      data: found,
    };
  }

  return {
    found: false,
  };
};

/**
 * Check an IAM if it is exluded or not
 * @param {Object} iam The IAM object
 */
exports.isExcludedIam = async ({ iam, parents = [] }) => {
  if (!excludeCache) {
    let content = '';
    try {
      content = await readFile$(resolve('.api.exclude'), { encoding: 'utf8' });
    } catch (e) {
      // Ignore, just proceed
    }

    excludeCache = content
      .split('\n')
      .map((one) => one.trim())
      .filter((one) => Boolean(one) && !one.startsWith('#'));
  }

  let excluded = excludeCache.includes(iam);

  if (excluded) {
    return {
      excluded: true,
      reason: 'iam',
      data: iam,
    };
  }

  excluded = excludeCache.find((one) => parents.includes(one));

  if (excluded) {
    return {
      excluded: true,
      reason: 'parent',
      data: excluded,
    };
  }

  return {
    excluded: false,
  };
};

/**
 * Add an IAM to roles
 * @param { String } iamName The iam name
 * @param { Array[String] } roles List of roles
 * @param { Number } tries Number of tries
 */
exports.addIamToRoles = async (iamName, roles = ['guest', 'user'], tries = 100) => {
  const Role = model('Role');
  const Iam = model('IAM');

  let iam = await Iam.findOne({ iam: iamName });
  let counter = tries;

  const interval = setInterval(async () => {
    if (iam) {
      const { _id: id } = iam;
      roles.map(async (r) => {
        try {
          await Role.findOneAndUpdate(
            {
              name: r,
            },
            {
              $addToSet: {
                iams: id,
              },
            },
          );
        } catch (e) {
          // Do nothing, just proceed
        }
      });
    }

    if (iam || counter === 0) {
      clearInterval(interval);
      return;
    }

    iam = await Iam.findOne({ iam: iamName });
    counter -= 1;
  }, 100);
};

/**
 * Get an entity by ID
 * @controller Get By ID
 * @param {IncommingMessage} req The request
 * @param {Express.Response} res The response
 * @param {Function} next Go to the next middleware
 */
exports.getById = (modelName) =>
  async function getById(req, res, next, id) {
    const Model = model(modelName);

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).send({
        message: req.t(`INVALID_${modelName.toUpperCase()}_ID`, {
          id,
        }),
      });
    }

    let f;

    try {
      f = await Model.findById(id);
    } catch (e) {
      return next(e);
    }

    if (!f) {
      return res.status(404).send({
        message: req.t(`${modelName.toUpperCase()}_NOT_FOUND`, {
          id,
        }),
      });
    }

    req.model = f;
    return next();
  };

/**
 *Get global IO instance
 */
exports.getIO = () => sockets.io;

/**
 * *Get googleMaps API Instance
 */
exports.googleMaps = googleMaps;

/**
 *Get global agendA instance
 */
exports.getAgenda = () => crons.agenda;

/**
 *  create_cron_job
 * @param {Object} nearestDriver
 * @param {String} notifType
 * @param {Object} data
 */
exports.create_cron_job = async (interval, scheduleTime, jobName, data, id) => {
  try {
    const agenda = exports.getAgenda();

    const job = agenda.create(jobName, data);

    job.unique({
      id,
    }); // guarantees uniqueness
    // skip the immediate run. The first run will occur only in configured interval.

    if (interval) {
      job.repeatEvery(interval);
    }

    if (scheduleTime) {
      job.schedule(scheduleTime);
    }

    await job.save();

    console.info(`New Job ${jobName} created & successfully saved`);

    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

/**
 * Notify User
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next The callback
 */
exports.notifyUsers = async (usersToNotify, template, data) => {
  const User = model('User');
  try {
    await User.find({ _id: { $in: usersToNotify } }).sendMail(
      data.subject,
      nunjucks.render(template, data),
    );
  } catch (e) {
    return e;
  }
  return true;
};

/**
 * Get document Id
 * @param {*} doc
 * @returns
 */
exports.getDocId = (doc) => {
  if (!doc) {
    return undefined;
  }
  if (doc instanceof MongooseModel) {
    return `${doc.id}`;
  }
  if (typeof doc === 'object' && doc._id) {
    return doc._id.toString();
  }

  return doc.toString();
};

/**
 * Round Number & set toFixed
 */
exports.roundToFixedNumber = (x, n = 2) => {
  return (Math.round(x * 100) / 100).toFixed(n);
};

/**
 * Get document Id
 * @param {*} doc
 * @returns
 */
exports.getDocumentId = (doc) => {
  if (doc && doc instanceof MongooseModel) {
    return `${doc.id}`;
  }

  if (!doc || (doc && typeof doc === 'string' && doc.length !== 24)) {
    return undefined;
  }

  return doc.toString();
};

/**
 * Get ObjectId
 */
exports.getObjectId = (val) => {
  return exports.getDocumentId(val);
};

/**
 * Set ObjectId
 */
exports.setObjectId = (val) => {
  return exports.getDocumentId(val);
};

/**
 * extract Custom Header Info
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next The callback
 */
exports.appVersionMiddleware = async function appVersionMiddleware(req, res, next) {
  try {
    const xFrom = req.headers['x-from'] || req.headers['X-From'] || '';
    req.body.xFrom = xFrom;
    req.xFrom = xFrom;

    const xAppVersion = req.headers['x-app-version'] || req.headers['X-App-Version'] || '';
    req.body.xAppVersion = xAppVersion;
    req.xAppVersion = xAppVersion;

    const xPlatform = req.headers['x-platform'] || req.headers['X-Platform'] || '';
    req.body.xPlatform = xPlatform;
    req.xPlatform = xPlatform;

    return next();
  } catch (e) {
    console.error(e.message || e);
    return next();
  }
};

/**
 * @typedef {Object} CellStyle
 * @property {Object} fill - The fill style configuration for the cell.
 * @property {string} fill.type - The type of fill. Typically 'pattern'.
 * @property {string} fill.pattern - The pattern type for the cell fill. Commonly 'solid' for a solid fill.
 * @property {Object} fill.fgColor - The foreground color for the cell fill.
 * @property {string} fill.fgColor.argb - The ARGB color value for the foreground color.
 * @property {Object} [font] - The font style configuration for the cell.
 * @property {boolean} [font.bold] - Indicates if the font should be bold.
 * @property {Object} [font.color] - The color of the font.
 * @property {string} [font.color.argb] - The ARGB color value for the font.
 */

/**
 * Default styles to be applied to Excel cells based on their purpose.
 * Each property corresponds to a predefined style, with configurations
 * for fill and font styles.
 *
 * - `header`: Style to be applied to header cells.
 * - `title`: Style to be applied to the title cell.
 * - `default`: Default style to be applied to any other cell.
 *
 * These styles can be overridden by providing a custom `styles` object
 * when calling the `fillWorksheet` function.
 *
 * @type {{
 *   header: CellStyle,
 *   title: CellStyle,
 *   default: CellStyle
 * }}
 */
const defaultStyles = {
  header: {
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLOR_BACKGROUND },
    },
    font: { bold: true, color: { argb: COLOR_FONT_WHITE } },
  },
  title: {
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLOR_BACKGROUND },
    },
    font: { bold: true, color: { argb: 'FFFFFF' } },
  },
  default: {
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLOR_BACKGROUND },
    },
    font: { color: { argb: COLOR_FONT_WHITE } },
  },
};

/**
 * Applies custom styles to a cell based on its type.
 * @param {Object} cell - The Excel cell object.
 * @param {string} type - The type of the cell (e.g., "header", "title").
 * @param {Object} [styles=defaultStyles] - Custom styles to be applied.
 */
const cellStyles = (cell, type, styles = defaultStyles) => {
  // Apply consistent default styles
  cell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Apply type-specific styles or the overall default styles
  const styleToApply = styles[type] || styles.default;
  for (const styleKey in styleToApply) {
    cell[styleKey] = styleToApply[styleKey];
  }
};

/**
 * Retrieves a nested value from an object based on a dot-separated key string.
 *
 * @param {Object} obj - The object to query.
 * @param {string} keyString - A dot-separated key string for nested access.
 * @returns {any} - The retrieved value, or an empty string if the value is undefined.
 */
function getNestedValue(obj, keyString) {
  const keys = keyString.split('.');
  let value = obj;
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) break;
  }

  return value || ''; // return empty string if undefined
}

/**
 * Handles an array of IDs by fetching associated data from a given Mongoose model.
 *
 * @async
 * @param {Object} item - The data item containing the array.
 * @param {string} header - The header/key to set in the final data object.
 * @param {Object} schemaMapping - Schema configuration object.
 * @throws {Error} Throws an error if the array or moduleName is not as expected.
 * @returns {Promise<string>} - A string containing the joined array values.
 */
async function handleArrayIds(item, header, schemaMapping) {
  const keyForArray = schemaMapping.keys;
  const arrayData = item[keyForArray];

  if (!Array.isArray(arrayData)) {
    throw new Error(`Expected an array for key ${keyForArray}, but got ${typeof arrayData}`);
  }

  const moduleName = schemaMapping.moduleName;
  if (!moduleName) {
    throw new Error(`Module name is required for header ${header}`);
  }

  try {
    const idModule = model(moduleName);
    const resolvedArray = await Promise.all(arrayData.map((id) => idModule.findById(id)));
    return resolvedArray.join(', ');
  } catch (error) {
    console.error(error);
    throw new Error(`Unable to require module: ${moduleName}`);
  }
}

/**
 * Handles an array of objects by mapping over the array and joining the values of a specified property.
 *
 * @param {Object} item - The data item containing the array.
 * @param {Object} schemaMapping - Schema configuration object.
 * @throws {Error} Throws an error if the array is not as expected.
 * @returns {string} - A string containing the joined array object properties.
 */
function handleArrayObject(item, schemaMapping) {
  const keyForArray = schemaMapping.keys;
  const arrayData = item[keyForArray]; // Use the schemaMapping.keys to get the actual data

  if (!Array.isArray(arrayData)) {
    throw new Error(`Expected an array for key ${keyForArray}, but got ${typeof arrayData}`);
  }

  const propName = schemaMapping.propName || 'name';
  return arrayData.map((obj) => `[${obj[propName]}]`).join(' ');
}

/**
 * Formats a date string into a "DD/MM/YYYY" format.
 *
 * @param {string} dateString - The date string to be formatted.
 * @returns {string} The formatted date in "DD/MM/YYYY" format.
 */
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

/**
 * Generates the Excel column name for a given column number.
 *
 * @param {number} columnNumber - The column number.
 * @return {string} The Excel column name.
 */
function getExcelColumnName(columnNumber) {
  let columnName = '';
  while (columnNumber > 0) {
    let remainder = (columnNumber - 1) % 26;
    columnName = String.fromCharCode(65 + remainder) + columnName;
    columnNumber = Math.floor((columnNumber - 1) / 26);
  }
  return columnName;
}

/**
 * Fills an Excel worksheet based on provided configuration options.
 * @async
 * @param {Object} options - Configuration for the worksheet fill.
 * @param {Worksheet} options.worksheet - The ExcelJS worksheet instance to be filled.
 * @param {Array} options.data - The dataset used to populate the worksheet.
 *
 * @param {Object[]} options.headerDefinitions - Defines the mapping and presentation of data columns in the worksheet.
 *   Each object in the array should have the following structure:
 *   - `header` {string}: Display text for the column header.
 *   - `keys` {string|string[]} Data access key(s) from the dataset. Supports nested properties with dot notation.
 *   - `type` {string}: Specifies the data type of the column, determining its format. Accepts "text", "date", "dateRange", "array-ids", "array-object", and "combined".
 *   - `width` {number} [default=20]: Optional. Defines the width of the column in Excel units.
 *   - `separator` {string} [default='-']: Optional. Defines the separator for "combined" type.
 *   - `format` {string}: Optional. Specifies the Moment.js format to be used for date/time fields.
 *   - `moduleName` {string} [required for "array-ids"]: Specifies the module from which to find objects by ID.
 *   - `propName` {string} [default="name" required for "array-object"]: Specifies the property to extract from objects in an array.
 *   Example:
 *   ```
 *   const headerDefinitions = [
 *     // Single key and date type
 *     { header: 'Date de la demande', keys: 'created_at', type: 'date', width: 20 },
 *
 *     // Single key and text type
 *     { header: 'Client', keys: 'clientInfo.name', type: 'text', width: 15 },
 *
 *     // Multiple keys and combined type with a separator
 *     { header: 'Contact Info', keys: ['clientInfo.name', 'clientInfo.phone'], type: 'combined', separator: ' / ' },
 *
 *     // Multiple keys and combined type with a format for date
 *     { header: 'Timestamps', keys: ['createdAt', 'updatedAt'], type: 'combined', format: 'DD/MM/YYYY HH:mm' },
 *
 *     // Date range type
 *     { header: 'Période', keys: 'periode', type: 'dateRange', width: 25 },
 *
 *     // Array of ids type
 *     { header: 'Tag IDs', keys: 'tags', type: 'array-ids', moduleName: 'TagModule' },
 *
 *     // Array of objects type
 *     { header: 'Features', keys: 'featureList', type: 'array-object', propName: 'title' },
 *
 *   ];
 *   ```
 *
 * @param {String} [options.title=""] - Optional title for the worksheet.
 * @param {Date} options.startDate - Start date of the date range (if applicable).
 * @param {Date} options.endDate - End date of the date range (if applicable).
 * @param {Object} [options.styles=defaultStyles] - Optional. Styles to be applied to cells.
 */
exports.fillWorksheet = async ({
  worksheet,
  data,
  headerDefinitions,
  title = '',
  startDate,
  endDate,
  styles = defaultStyles,
}) => {
  try {
    // Vérifier que headerDefinitions n'est pas vide
    if (!headerDefinitions.length) {
      throw new Error('headerDefinitions cannot be empty!');
    }

    // Calculate columnWidths based on headerDefinitions
    const columnWidths = {};
    headerDefinitions.forEach((header) => {
      // Assurez-vous que chaque entrée contient les champs requis
      if (!header.header || !header.type) {
        throw new Error(`Invalid header definition: ${JSON.stringify(header)}`);
      }

      if (!header.keys || (typeof header.keys !== 'string' && !Array.isArray(header.keys))) {
        throw new Error(`Invalid keys for header ${JSON.stringify(header)}`);
      }
      columnWidths[header.header] = header.width || 20; // Utiliser une largeur par défaut si non spécifiée
    });

    // Create headers and headerMapping based on headerDefinitions
    const headers = headerDefinitions.map((header) => header.header);
    const headerMapping = Object.fromEntries(
      headerDefinitions.map((header) => [header.header, header]),
    );

    // Create columns in the worksheet
    const columns = headers.map((header) => ({
      header,
      key: header,
      width: columnWidths[header] || 20,
    }));
    worksheet.columns = columns;

    // Construct title with optional date range
    if (startDate && endDate) {
      const startDateFormatted = formatDate(startDate);
      const endDateFormatted = formatDate(endDate);
      title += ` de ${startDateFormatted} au ${endDateFormatted}`;
    }

    // Set the title in the worksheet
    const titleRow = worksheet.getRow(1);
    titleRow.getCell(1).value = title;
    const totalColumns = columns.length;
    // Use the function to get the correct column name
    const lastColumnName = getExcelColumnName(totalColumns);

    // Merge cells for the title
    worksheet.mergeCells(`A1:${lastColumnName}1`);

    // Apply styles to the title row
    for (let i = 1; i <= totalColumns; i++) {
      cellStyles(titleRow.getCell(1), 'title', styles);
    }

    // Add headers to the worksheet
    worksheet.addRows([headers]);
    const headerRow = worksheet.getRow(2);

    // Apply styles to the header cells
    for (let i = 1; i <= headers.length; i++) {
      cellStyles(headerRow.getCell(i), 'header', styles);
    }

    // Populate worksheet with data
    for (const item of data) {
      const row = {};
      for (const header of headers) {
        const schemaMapping = headerMapping[header];
        if (!schemaMapping) {
          row[header] = '';
          return;
        }

        const keys = Array.isArray(schemaMapping.keys) ? schemaMapping.keys : [schemaMapping.keys];
        // Incorporating getNestedValue
        row[header] = keys
          .map((key) => getNestedValue(item, key))
          .join(schemaMapping.separator || ' - ');

        const type = schemaMapping.type;
        const separator = schemaMapping.separator || ' - '; // Default to '-'
        const format = schemaMapping.format || 'DD/MM/YYYY HH:mm'; // Default format for Moment

        if (
          !['text', 'date', 'dateRange', 'combined', 'array-ids', 'array-object'].includes(type)
        ) {
          throw new Error(`Invalid type ${type} for header ${header}`);
        }

        if (type === 'array-ids' && !moduleName) {
          throw new Error(`Module name is required for header ${header} with type array-ids`);
        }

        if (type === 'combined' && Array.isArray(keys)) {
          const values = keys.map((key) => {
            return getNestedValue(item, key);
          });

          const allDates = values.every((v) => moment(v, format, true).isValid());
          const someDates = values.some((v) => moment(v, format, true).isValid());

          if (allDates) {
            row[header] = values.map((v) => moment(v).format(format)).join(separator);
          } else if (someDates) {
            row[header] = values
              .map((v) => {
                if (moment(v, format, true).isValid()) {
                  return moment(v).format(format);
                }
                return v;
              })
              .join(separator);
          } else {
            row[header] = values.join(separator);
          }
        } else if (typeof keys === 'string') {
          row[header] = item[keys] || '';
        }

        // Handle array of ids
        if (type === 'array-ids') {
          row[header] = await handleArrayIds(item, header, schemaMapping);
        }

        // Handle array of objects
        if (type === 'array-object') {
          row[header] = handleArrayObject(item, schemaMapping);
        }

        // Handle date formatting
        if (type === 'date' && row[header]) {
          const formattedDate = moment(new Date(row[header])).format('DD/MM/YYYY HH:mm');
          row[header] = moment(formattedDate, 'DD/MM/YYYY HH:mm', true).isValid()
            ? formattedDate
            : row[header];
        }

        // Handle date range formatting
        if (type === 'dateRange' && row[header]) {
          const fromDate = moment(row[header].from).format('DD/MM/YYYY');
          const toDate = moment(row[header].to).format('DD/MM/YYYY');
          row[header] = `${fromDate} - ${toDate}`;
        }
      }

      const addedRow = worksheet.addRow(row);

      // Apply cell borders
      addedRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    }
  } catch (e) {
    console.error(chalk.yellow.bold('='.repeat(120)));
    console.error(
      chalk.yellow.bold('An error occurred while filling out the Excel sheet:'),
      chalk.red.bold(e.message),
    );
    console.error(chalk.yellow.bold('='.repeat(120)));
    throw e;
  }
};

exports.generatePDF = function generatePDF(htmlContent, options) {
  return new Promise((resolve, reject) => {
    pdf.create(htmlContent, options).toBuffer((err, stream) => {
      if (err) {
        reject(err);
      } else {
        resolve(stream);
      }
    });
  });
};

/**
 * Check if the given id is a valid ObjectId.
 * @param {string} id - The id to check.
 * @returns {boolean} - True if the id is a valid ObjectId, false otherwise.
 */
exports.isValidObjectId = (id) => Types.ObjectId.isValid(id);

let smtpTransport;

if (config.mailer.options && config.mailer.options.auth && config.mailer.options.auth.pass) {
  smtpTransport = nodemailer.createTransport(config.mailer.options);
}
/**
 * Sends an email with the given subject and body to the specified users.
 *
 * @param {string} subject - The subject of the email.
 * @param {string} body - The body of the email in HTML format.
 * @param {Array} users - An optional array of email addresses to send the email to. Defaults to an empty array.
 * @param {object} opts - An optional object containing additional options for sending the email. Defaults to an empty object.
 * @return {boolean|object} Returns the result of sending the email or `false` if there was an error.
 */
exports.sendMail = async function sendMail(subject, body, users = [], opts = {}) {
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
      console.info('data====Email sent====', data);
      return data;
    } catch (e) {
      console.error(e);
      debug('Error while sending email', e, subject, users);
      return false;
    }
  }

  return false;
};

/**
 * Generates a unique code for a given module.
 *
 * @param {string} moduleName - The name of the module.
 * @throws {Error} If the module code is not found.
 * @return {string} The generated unique code.
 */
exports.generateCode = (moduleName) => {
  // Predefined list of module codes
  const moduleCodes = {
    users: '1',
    products: '2',
    categories: '3',
  };

  // Get current date
  const currentDate = new Date();

  // Extract year, month, and a random number from the current date
  const [year, month, randomNum] = [
    currentDate.getFullYear() % 100, // Extract the last 2 digits of the year
    String(currentDate.getMonth() + 1).padStart(2, '0'), // Extract the month, padding with 0 if needed
    String(Math.floor(Math.random() * 10000000)).padStart(6, '0'), // Generate a random 7-digit number
  ];

  // Check if the module name exists in the predefined list
  let moduleCode = moduleCodes[moduleName];

  // Throw an error if the module code is not found
  if (!moduleCode) {
    moduleCode = '404';
  }

  // Generate the unique code by combining module code, year, month, and a random number
  const uniqueCode = `${moduleCode}${year}${month}${randomNum}`;

  return uniqueCode;
};

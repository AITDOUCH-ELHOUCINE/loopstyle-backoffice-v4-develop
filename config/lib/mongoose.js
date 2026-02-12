/* eslint-disable import/no-dynamic-require,global-require,no-restricted-globals */
/**
 * Module dependencies.
 */
const chalk = require('chalk');
const path = require('path');
const mongoose = require('mongoose');
const config = require('..');
const moongoose_deep_populate = require('./mongoose-deep-populate');

// Apply plugins
mongoose.plugin(moongoose_deep_populate(mongoose));

// Configure global Mongoose settings
mongoose.set('strictQuery', false);
mongoose.set('useFindAndModify', false);
mongoose.set('bufferCommands', true);
mongoose.set('bufferTimeoutMS', 30000);

// Improved model loading with better error handling
module.exports.loadModels = (callback) => {
  try {
    if (!mongoose) {
      throw new Error('Mongoose is not available');
    }

    config.files.server.models.forEach((modelPath) => {
      try {
        require(path.resolve(modelPath));
        console.log(`Model loaded: ${modelPath}`);
      } catch (err) {
        console.error(chalk.red(`Error loading model ${modelPath}:`), err);
        throw err;
      }
    });

    callback?.();
  } catch (err) {
    console.error(chalk.red('Failed to load models:'), err);
    throw err;
  }
};

// Enhanced MongoDB connection with retry logic
module.exports.connect = async (callback) => {
  const connectionOptions = {
    ...config.db.options,
    autoIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    retryWrites: true,
    retryReads: true
  };

  try {
    // Setup event listeners before connecting
    mongoose.connection.on('connecting', () => 
      console.log(chalk.blue('Connecting to MongoDB...')));
    mongoose.connection.on('connected', () => 
      console.log(chalk.green('MongoDB connected successfully')));
    mongoose.connection.on('disconnected', () => 
      console.log(chalk.yellow('MongoDB disconnected')));
    mongoose.connection.on('error', (err) => 
      console.error(chalk.red('MongoDB connection error:'), err));

    // Establish connection
    await mongoose.connect(config.db.uri, connectionOptions);

    // Enable debug mode if configured
    if (config.db.debug) {
      mongoose.set('debug', (collectionName, method, query, doc) => {
        console.log(chalk.magenta(`Mongoose: ${collectionName}.${method}`), {
          query,
          doc
        });
      });
    }

    return callback?.(mongoose.connection.db);
  } catch (err) {
    console.error(chalk.red('Could not connect to MongoDB:'), err);
    throw err;
  }
};

// Improved disconnect handler
module.exports.disconnect = async () => {
  try {
    await mongoose.connection.close();
    console.log(chalk.yellow('Disconnected from MongoDB.'));
  } catch (err) {
    console.error(chalk.red('Error disconnecting from MongoDB:'), err);
    throw err;
  }
};

// Enhanced error handling
process.on('uncaughtException', (err) => {
  console.error(chalk.red('Uncaught Exception:'), err);
  if (err.name !== 'MongoError' || err.codeName !== 'DuplicateKey') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, 'reason:', reason);
});

// Utility function for input validation
const validateAndCoerceNumber = (num, defaultValue) => {
  const parsed = parseInt(num, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Enhanced pagination methods with better error handling
 */

// Query pagination
mongoose.Query.prototype.paginate = async function({ top = 10, skip = 0 }) {
  const t = validateAndCoerceNumber(top, 10);
  const s = validateAndCoerceNumber(skip, 0);

  this.limit(t).skip(s);

  try {
    const [data, count] = await Promise.all([
      this.exec(),
      this.model.countDocuments(this.getQuery())
    ]);

    return { top: t, skip: s, count, value: data };
  } catch (err) {
    console.error(chalk.red('Pagination error:'), err);
    throw err;
  }
};

// Lean pagination
mongoose.Query.prototype.paginateLean = async function({ top = 10, skip = 0 }) {
  const t = validateAndCoerceNumber(top, 10);
  const s = validateAndCoerceNumber(skip, 0);

  this.limit(t).skip(s).lean();

  try {
    const [data, count] = await Promise.all([
      this.exec(),
      this.model.countDocuments(this.getQuery())
    ]);

    return { top: t, skip: s, count, value: data };
  } catch (err) {
    console.error(chalk.red('Lean pagination error:'), err);
    throw err;
  }
};

// Aggregate pagination
mongoose.Aggregate.prototype.paginate = async function({ top = 10, skip = 0 }) {
  const t = validateAndCoerceNumber(top, 10);
  const s = validateAndCoerceNumber(skip, 0);

  this.facet({
    metadata: [{ $count: 'total' }],
    data: [{ $skip: s }, { $limit: t }]
  });

  try {
    const [result] = await this.exec();
    const data = result.data;
    const count = result.metadata[0]?.total || 0;

    return { top: t, skip: s, count, value: data };
  } catch (err) {
    console.error(chalk.red('Aggregate pagination error:'), err);
    throw err;
  }
};

// Lean aggregate pagination
mongoose.Aggregate.prototype.paginateLean = async function({ top = 10, skip = 0 }) {
  const t = validateAndCoerceNumber(top, 10);
  const s = validateAndCoerceNumber(skip, 0);

  this.facet({
    metadata: [{ $count: 'total' }],
    data: [{ $skip: s }, { $limit: t }]
  });

  try {
    const [result] = await this.lean().exec();
    const data = result.data;
    const count = result.metadata[0]?.total || 0;

    return { top: t, skip: s, count, value: data };
  } catch (err) {
    console.error(chalk.red('Lean aggregate pagination error:'), err);
    throw err;
  }
};
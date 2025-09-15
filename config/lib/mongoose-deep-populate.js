/* eslint-disable no-sequences */
/* eslint-disable consistent-return */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-shadow */
/* eslint-disable no-use-before-define */
/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
/* eslint-disable prefer-rest-params */
/* eslint-disable func-names */
/**
 * inspired from:
 * https://github.com/buunguyen/mongoose-deep-populate
 * @param {*} mongoose
 */
module.exports = function (mongoose) {
  if (mongoose == null) {
    throw new Error('An instance of mongoose needs passing in');
  }

  patchQueryPrototype();
  return deepPopulatePlugin;

  /**
   * Patches Query prototype to add `deepPopulate()` method.
   */
  function patchQueryPrototype() {
    const { Query } = mongoose;
    const _exec = Query.prototype.exec;

    if (Query.prototype.deepPopulate != null) {
      return;
    }

    /**
     * Registers deep population on this query.
     * @param paths the paths to be populated.
     * @param options (optional) the population options.
     * @remark this method can only be invoked once per query.
     * @return {Query}
     */
    Query.prototype.deepPopulate = function (paths, options) {
      if (this.model.schema.methods.deepPopulate == null) {
        throw new Error('Plugin was not installed');
      }

      if (this._deepPopulates) {
        throw new Error('deepPopulate was already invoked');
      }

      this._deepPopulates = { paths, options };
      return this;
    };

    /**
     * Monkey-patches `exec` to add deep population hook.
     * @param op the operation to be executed.
     * @param cb the callback.
     * @return {MongoosePromise}
     */
    Query.prototype.exec = function (op, cb) {
      const deepPopulate = this._deepPopulates;
      if (!deepPopulate) {
        return _exec.call(this, op, cb);
      }

      const { model } = this;
      const { paths } = deepPopulate;
      const { options } = deepPopulate;
      const defaultOptions = model.schema._defaultDeepPopulateOptions;
      const { lean } = this._mongooseOptions;

      if (isFunction(op)) {
        cb = op;
        op = null;
      } else {
        cb = cb || noop;
      }

      return createMongoosePromise(
        function (resolve, reject) {
          _exec.call(this, op, function (err, docs) {
            if (err) {
              return reject(err), cb(err);
            }

            if (!docs) {
              return resolve(docs), cb(null, docs);
            }

            execute(model, docs, paths, options, defaultOptions, lean, function (err, docs) {
              if (err) reject(err), cb(err);
              else resolve(docs), cb(null, docs);
            });
          });
        }.bind(this),
      );
    };
  }

  /**
   * Creates a Mongoose promise.
   */
  function createMongoosePromise(resolver) {
    let promise;

    // mongoose 5 and up
    if (parseInt(mongoose.version, 10) >= 5) {
      promise = new mongoose.Promise(resolver);
    }
    // mongoose 4.1 and up
    else if (mongoose.Promise.ES6) {
      promise = new mongoose.Promise.ES6(resolver);
    }
    // backward compatibility
    else {
      promise = new mongoose.Promise();
      resolver(promise.resolve.bind(promise, null), promise.reject.bind(promise));
    }

    return promise;
  }

  /**
   * Invoked by Mongoose to executes the plugin on the specified schema.
   */
  function deepPopulatePlugin(schema, defaultOptions = {}) {
    schema._defaultDeepPopulateOptions = defaultOptions || {};

    /**
     * Populates this document with the specified paths.
     * @param paths the paths to be populated.
     * @param options (optional) the population options.
     * @param cb (optional) the callback.
     * @return {MongoosePromise}
     */
    schema.methods.deepPopulate = function (paths, options, cb) {
      return deepPopulate(this.constructor, this, paths, options, cb);
    };

    /**
     * Populates provided documents with the specified paths.
     * @param docs the documents to be populated.
     * @param paths the paths to be populated.
     * @param options (optional) the population options.
     * @param cb (optional) the callback.
     * @return {MongoosePromise}
     */
    schema.statics.deepPopulate = function (docs, paths, options, cb) {
      return deepPopulate(this, docs, paths, options, cb);
    };

    function deepPopulate(model, docs, paths, options, cb) {
      if (isFunction(options)) {
        cb = options;
        options = null;
      } else {
        cb = cb || noop;
      }

      return createMongoosePromise(function (resolve, reject) {
        if (docs == null || docs.length === 0) {
          return resolve(docs), cb(null, docs);
        }

        execute(model, docs, paths, options, defaultOptions, false, function (err, docs) {
          if (err) reject(err), cb(err);
          else resolve(docs), cb(null, docs);
        });
      });
    }
  }

  function execute(model, docs, paths, options, defaultOptions, lean, cb) {
    const params = createParams(model, docs, paths, extend({}, defaultOptions, options), lean);

    if (params.paths.length === 0) cb(null, docs);
    else populate(params, 0, cb);
  }

  function createParams(model, docs, paths, options, lean) {
    const { rewrite } = options;
    let { whitelist } = options;
    const { populate } = options;

    paths = isArray(paths) ? paths : (paths || '').split(/[\s,]+/); // space or comma delimited
    paths = normalize(paths);

    // rewrites paths, whitelist and populate
    if (rewrite) {
      paths = paths.map(function (path) {
        return rewrite[path] || path;
      });

      if (whitelist) {
        whitelist = whitelist.map(function (path) {
          return rewrite[path] || path;
        });
      }

      if (populate) {
        Object.keys(populate).forEach(function (path) {
          const rewrittenPath = rewrite[path] || path;
          if (rewrittenPath) populate[rewrittenPath] = populate[path];
        });
      }
    }

    // deconstructs then filters paths using whitelist
    paths = normalize(deconstruct(paths));
    if (whitelist) {
      whitelist = normalize(deconstruct(whitelist));
      paths = paths.filter(function (path) {
        return whitelist.indexOf(path);
      });
    }

    // computes max subpaths, i.e. levels
    let maxNoOfSubpaths = -1;
    paths.forEach(function (path) {
      const noOfSubpaths = path.split('.').length;
      if (noOfSubpaths > maxNoOfSubpaths) maxNoOfSubpaths = noOfSubpaths;
    });

    let { db } = model;
    if (!db) {
      const doc = isArray(docs) ? docs[0] : docs;
      if (doc && doc.ownerDocument) db = doc.ownerDocument().constructor.db;
      else throw new Error('Cannot retrieve database instance');
    }

    return {
      db,
      model,
      docs,
      paths,
      lean,
      max: maxNoOfSubpaths - 1,
      options: populate || {},
    };
  }

  function populate(opts, level, cb) {
    const { docs } = opts;
    const { paths } = opts;
    const lvlPaths = paths.filter(function (path) {
      return path.split('.').length - 1 === level;
    });
    let remained = lvlPaths.length;
    let model;
    let path;
    let populateOpts;

    // eslint-disable-next-line no-cond-assign
    while ((path = lvlPaths.shift())) {
      model = getModelFromPath(opts.db, opts.model, path);

      if (model != null) {
        populateOpts = extend({}, opts.options[path], { path, model: model.modelName });

        if (opts.lean) {
          populateOpts.options = extend({ lean: true }, populateOpts.options);
        }

        model.populate(docs, populateOpts, one);
      } else one();
    }

    function one(err) {
      if (err) return nextLevel(err);
      if (--remained === 0) nextLevel();
    }

    function nextLevel(err) {
      if (err) return cb(err);
      if (level === opts.max) return cb(null, docs);
      populate(opts, ++level, cb);
    }
  }

  function getModelFromPath(db, model, path) {
    let { schema } = model;
    let currentPath = null;
    let candidateModel = null;

    path.split('.').forEach(function (subpath) {
      currentPath = (currentPath ? `${currentPath}.` : '') + subpath;
      let schemaPath = schema.paths[currentPath];

      // no schema, possibly a subdocument, continues to find out
      if (!schemaPath) {
        candidateModel = null;
        return;
      }

      // found a schema, resets current path
      currentPath = null;

      // dereferences if linked documents
      if (schemaPath.caster && schemaPath.caster.options) {
        schemaPath = schemaPath.caster;
      }

      // if linked document(s), extract model and schema
      if (schemaPath.options && schemaPath.options.ref) {
        candidateModel = db.model(schemaPath.options.ref);
        schema = candidateModel.schema;
      }
      // else, subdocuments => no model but has schema
      else {
        candidateModel = null;
        schema = schemaPath.schema;
      }
    });

    return candidateModel;
  }

  // function getModelsFromPath(db, model, path) {
  //   let { schema } = model;
  //   let currentPath = null;
  //   let candidateModels = [];

  //   path.split('.').forEach(function (subpath) {
  //     currentPath = (currentPath ? `${currentPath}.` : '') + subpath;
  //     let schemaPath = schema.paths[currentPath];

  //     // no schema, possibly a subdocument, continues to find out
  //     if (!schemaPath) {
  //       candidateModels = [];
  //       return;
  //     }

  //     // found a schema, resets current path
  //     currentPath = null;

  //     // dereferences if linked documents
  //     if (schemaPath.caster && schemaPath.caster.options) {
  //       schemaPath = schemaPath.caster;
  //     }

  //     // if linked document(s), extract model and schema
  //     if (schemaPath.options && schemaPath.options.ref) {
  //       const candidateModel = db.model(schemaPath.options.ref);
  //       candidateModels = [candidateModel];
  //       schema = candidateModel.schema;
  //     } else if (schemaPath.options && schemaPath.options.refPath) {

  //       // console.log('schemaPath.options.refPath=', schemaPath.options.refPath);

  //       schemaPath = schema.paths[schemaPath.options.refPath];
  //       if (schemaPath.enumValues && Array.isArray(schemaPath.enumValues)) {
  //         candidateModels = schemaPath.enumValues.map(rf => db.model(rf));
  //       } else {
  //         candidateModels = [];
  //       }

  //     }
  //     // else, subdocuments => no model but has schema
  //     else {
  //       candidateModels = [];
  //       schema = schemaPath.schema;
  //     }
  //   });

  //   return candidateModels;
  // }
  // Breaks ['a.b.c', ...] to ['a', 'a.b', 'a.b.c', ...]
  function deconstruct(paths) {
    const _paths = [];

    paths.forEach(function (path) {
      let currentPath = null;
      path.split('.').forEach(function (subpath) {
        currentPath = (currentPath ? `${currentPath}.` : '') + subpath.trim();
        _paths.push(currentPath);
      });
    });

    return _paths;
  }

  function normalize(paths) {
    return paths
      .map(function (path) {
        return path.trim();
      })
      .filter(function (path) {
        return path !== '';
      })
      .filter(function (path, index, self) {
        return self.indexOf(path) === index;
      }); // removes duplicates
  }

  function extend(target) {
    let src;
    for (let i = 1, l = arguments.length; i < l; i++) {
      src = arguments[i];
      for (const k in src) target[k] = src[k];
    }
    return target;
  }

  function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  }

  function isFunction(obj) {
    return (
      Object.prototype.toString.call(obj) === '[object Function]' ||
      Object.prototype.toString.call(obj) === '[object AsyncFunction]'
    );
  }

  function noop() {}
};

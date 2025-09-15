// eslint-disable-next-line
function GridFSStorage(opts) {
  this._options = opts || {};
}

GridFSStorage.prototype._handleFile = function _handleFile(req, file, cb) {
  const {
    gfs,
  } = req.app.locals;
  // const opts = this._options;
  const {
    stream,
  } = file;

  // let convert = false;
  const writestream = gfs.createWriteStream({
    filename: file.originalname,
    content_type: file.mimetype,
  });

  // if (opts.resize && /^image\//.test(file.mimetype)) {
  //   convert = im().resize(opts.resize).quality(90);
  //   stream.pipe(convert);
  // }

  stream.pipe(writestream);

  writestream.on('close', (f) => {
    cb(null, {
      stream,
      file: f,
    });
  });

  writestream.on('error', (error) => {
    cb(error);
  });

  // if (convert) {
  //   convert.spawn();
  // }
};

GridFSStorage.prototype._removeFile = function _removeFile(req, file, cb) {
  const f = file;

  delete f.buffer;
  if (f._id) {
    this.gfs.remove({
      _id: f._id,
    }, (err) => {
      if (err) return err;
      return console.info('deleted file._id ', f._id);
    });
  }

  cb(null);
};

module.exports = (app, opts) => new GridFSStorage(app, opts);

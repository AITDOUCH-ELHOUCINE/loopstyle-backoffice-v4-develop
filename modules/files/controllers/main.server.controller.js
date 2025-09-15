/* eslint-disable no-loop-func */
/* eslint-disable no-await-in-loop */
const { mongo, model, Types, connection } = require('mongoose');
const { promisify } = require('util');
const path = require('path');
const { resolve } = require('path');
const multer = require('multer');
const multerStorage = require('multer-gridfs-storage');
const minimatch = require('minimatch');
const sharp = require('sharp');
const config = require('@config/index');
const fs = require('fs');
const mime = require('mime');
const { Readable } = require('stream');

// Fix ObjectID constructor issue
const { ObjectId } = require('mongodb');

// eslint-disable-next-line import/no-dynamic-require
const { filesManager } = require(resolve('./config'));
const { bucket, accept = [], uploader } = filesManager;
const Grid = model('FMFiles');

const gfs = new mongo.GridFSBucket(connection.db, {
  bucketName: bucket,
});

const delete$ = promisify(gfs.delete).bind(gfs);

const cacheDir = resolve('tmp');

// Create a simple memory storage for multer (we'll handle GridFS manually)
const storage = multer.memoryStorage();

// read header range 
function readRangeHeader(range, file) {
  const { length: fileLength } = file;

  if (range == null || range.length === 0) return null;

  const array = range.split(/bytes=([0-9]*)-([0-9]*)/);
  const s = parseInt(array[1], 10);
  const e = parseInt(array[2], 10);

  const start = Number.isNaN(s) ? 0 : s;
  const end = Number.isNaN(e) ? fileLength - 1 : e;

  return {
    start,
    end,
  };
}

/**
 * List files
 * @controller List files
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.list = async function list(req, res, next) {
  const { $top: top, $skip: skip } = req.query;

  try {
    const result = await Grid.list(req.user).paginate({ top, skip });

    return res.json(result);
  } catch (e) {
    return next(e);
  }
};

/**
 * Check if the user can access the file
 * @controller Check access
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.canAccess = async function canAccess(req, res, next) {
  const { user, gridFile: f } = req;
  let isCanAccess = false;

  try {
    isCanAccess = await f.canAccess(user);
  } catch (e) {
    return next(e);
  }

  if (!isCanAccess) {
    return res.status(403).json({
      message: req.t('UNAUTHORIZED_TO_VIEW'),
    });
  }

  return next();
};

/**
 * Check if the user can edit the file
 * @controller Check edit
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.canEdit = async function canEdit(req, res, next) {
  const { user, gridFile: f } = req;
  let isCanEdit = false;

  try {
    isCanEdit = await f.canEdit(user);
  } catch (e) {
    return next(e);
  }

  if (!isCanEdit) {
    return res.status(403).json({
      message: req.t('UNAUTHORIZED_TO_EDIT'),
    });
  }

  return next();
};

/**
 * Upload file(s)
 * @controller Upload
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.upload = async function upload(req, res) {
  try {
    console.log('=== FILE UPLOAD DEBUG START ===');
    console.log('req.file:', req.file);
    console.log('req.files:', req.files);
    console.log('req.body:', req.body);
    
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ 
        success: false, 
        message: req.t('NOTHING_TO_UPLOAD') || 'Aucun fichier à uploader' 
      });
    }

    // Manual GridFS upload
    const uploadStream = gfs.openUploadStream(req.file.originalname, {
      metadata: {
        owner: req.user ? req.user._id : null,
        fileName: req.file.originalname,
        visibility: 'public',
        contentType: req.file.mimetype,
        size: req.file.size,
      },
    });

    // Create a readable stream from the buffer
    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);

    // Upload the file
    const uploadPromise = new Promise((resolve, reject) => {
      uploadStream.on('error', (error) => {
        console.error('GridFS upload error:', error);
        reject(error);
      });

      uploadStream.on('finish', () => {
        console.log('GridFS upload finished, file ID:', uploadStream.id);
        resolve(uploadStream.id);
      });
    });

    readableStream.pipe(uploadStream);
    const fileId = await uploadPromise;

    // GridFS already created the file, so we don't need to create a separate FMFiles document
    // The file is already stored in fs.files collection by GridFS

    console.log('File uploaded successfully, ID:', fileId);
    console.log('=== FILE UPLOAD DEBUG END ===');

    // Format de réponse attendu par le frontend
    const response = {
      success: true,
      file: fileId.toString(),
      id: fileId.toString(),    // Pour la compatibilité avec le frontend
      _id: fileId.toString(),   // Pour la compatibilité avec le frontend
      // Ajout des champs supplémentaires que le frontend pourrait attendre
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    };

    console.log('Sending response:', JSON.stringify(response, null, 2));
    res.status(200).json(response);
  } catch (error) {
    console.error('=== FILE UPLOAD ERROR ===');
    console.error('Error details:', error);
    console.error('=== END ERROR ===');
    res.status(500).json({ 
      success: false, 
      message: 'File upload failed',
      error: error.message 
    });
  }
};

/**
 * Get meta data of a file
 * @controller Get metadata
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.meta = async function meta(req, res, next) {
  const { body, gridFile } = req;
  try {
    gridFile.set(body);
    const json = await gridFile.save({ new: true });
    return res.json(json);
  } catch (e) {
    return next(e);
  }
};

/**
 * Get one file
 * @controller Get one
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.one = async function one(req, res) {
  res.json(req.gridFile);
};

/**
 * Remove a file
 * @controller Remove
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.remove = async function remove(req, res, next) {
  const { gridFile } = req;
  const f = gridFile.toJSON();
  const { _id: id } = f;

  try {
    await delete$(id);
    return res.status(204).end();
  } catch (e) {
    return next(e);
  }
};

/**
 * Get file By ID
 * @controller Get by ID
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.fileById = async function getById(req, res, next, id) {
  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      ok: false,
      result: {
        message: 'ID not valid',
      },
    });
  }

  let f;

  try {
    f = await Grid.findById(id);
  } catch (e) {
    return next(e);
  }

  if (!f) {
    return res.status(404).json({
      message: req.t('FILE_NOT_FOUND'),
    });
  }

  req.gridFile = f;
  return next();
};

/**
 * Download a file
 * @controller Download
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.download = (isDownload) =>
  async function download(req, res) {
    try {

      const { gridFile: f, query: q } = req;
      const { _id: id } = f;

      const cacheFilePath = path.join(cacheDir, id.toString() || `${id}`);

      if (isDownload === true) {
        res.header('Content-Type', 'application/octet-stream');
        res.header('Content-Disposition', `attachement; filename=${encodeURI(f.get('filename'))}`);
      } else {
        res.header('Content-Type', f.get('contentType'));
        res.header('Content-Disposition', `inline; filename=${encodeURI(f.get('filename'))}`);
      }


      // Set cache headers
      res.set('Cache-Control', 'public, max-age=31557600, s-maxage=31557600'); // Cache for 1 year
      res.set('Expires', new Date(Date.now() + 31557600000).toUTCString()); // Expiration time 1 year from now


      if (!f) {
        return res.status(400).jsonp({
          success: false,
          message: req.t('FILE_NOT_FOUND'),
        });
      }



      let stream;
      // Check if the file exists in the cache;
      if (fs.existsSync(cacheFilePath)) {
        // File exists in cache, return it
        // console.log('File exists in cache, return it : ', id);
        stream = fs.createReadStream(cacheFilePath);
      } else {
        // File not exists in cache
        console.log('File not exists in cache : ', id);
        stream = gfs.openDownloadStream(id);

        // Create cache directory if it doesn't exist
        fs.mkdirSync(cacheDir, { recursive: true });

        // Save the file to the cache
        const cacheWriteStream = fs.createWriteStream(cacheFilePath);
        stream.pipe(cacheWriteStream);
      }



      switch (true) {
        case /image\/.*/.test(f.get('contentType')):
          // eslint-disable-next-line no-case-declarations
          let transformer;

          if (q.thumbnail === 'true') {
            const s = config.uploads.thumbnail || {};
            try {
              transformer = sharp().resize(s.width || 100, s.height);
            } catch (error) {
              console.error('sharp error1');
              console.error(error);
            }


            return stream.pipe(transformer).pipe(res);
          }

          if (q.size) {
            q.size = q.size.split('x');

            q.size[0] = Number.isNaN(q.size[0]) ? 100 : parseInt(q.size[0], 10);
            q.size[1] = Number.isNaN(q.size[1]) ? 100 : parseInt(q.size[1], 10);

            if (q.size[0] > 1024) {
              q.size[0] = 1024;
            }

            if (q.size[1] > 1024) {
              q.size[1] = 1024;
            }

            if (q.size[0] < 1) {
              q.size[0] = 1;
            }

            if (q.size[1] < 1) {
              q.size[1] = 1;
            }
            try {

              transformer = sharp().resize(q.size[0], q.size[1]);
            } catch (error) {
              console.error('sharp resize error');
              console.error(error);
              transformer = null;

            }


            if (transformer) {
              return stream.pipe(transformer).pipe(res);
            }
            return stream.pipe(res);





          }
          break;
        default:
          break;
      }

      return stream.pipe(res);
    } catch (e) {
      console.error(e.message || e);
      return res.status(400).json(null);
    }
  };

/**
 * Stream video
 * @controller stream
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.stream = async function stream(req, res, next) {
  try {
    const { gridFile: file } = req;

    if (!file) {
      return res.status(404).json({ message: 'Invalid File ID.' });
    }

    const { contentType } = file;
    const responseHeaders = {};
    const range = readRangeHeader(req.headers.range, file);

    if (req.headers.range && range) {
      const { start, end } = range;

      // If the range can't be fulfilled.
      if (start >= file.length || end >= file.length) {
        // Indicate the acceptable range.
        responseHeaders['Content-Range'] = `bytes */${file.length}`; // File size.

        // Return the 416 'Requested Range Not Satisfiable'.
        res.writeHead(416, responseHeaders);
        return res.end();
      }
      if (file.length - 1)
        responseHeaders['Content-Range'] = `bytes ${start}-${end}/${file.length}`;
      else
        responseHeaders['Content-Range'] = `bytes ${start}-/${file.length}`;

      responseHeaders['Content-Type'] = contentType;
      responseHeaders['Accept-Ranges'] = 'bytes';
      responseHeaders['Cache-Control'] = 'no-cache';
      responseHeaders['Content-Transfer-Encoding'] = 'binary';

      // console.log('informing request of partial HTTP 206');
      res.writeHead(206, responseHeaders);

      // console.log(`creating download stream, for bytes ${start} through ${end}`);
      const downloadStreamOpts = (end < file.length - 1) ? { start, end } : { start };
      const downloadStream = gfs.openDownloadStream(file._id, downloadStreamOpts);

      downloadStream.on('data', chunk => {
        // console.debug(`chonk: ${chunk.length} bytes`)
        res.write(chunk);
      });

      downloadStream.on('error', () => {
        res.sendStatus(404);
      });

      downloadStream.on('end', () => {
        // console.log(`end of stream [${start} - ${end}]`);
        // console.log('---------------------------------------------------------------------------');
        res.end();
      });
    } else {
      responseHeaders['Content-Type'] = contentType;
      responseHeaders['Content-Length'] = file.length;
      responseHeaders['Accept-Ranges'] = 'bytes';
      responseHeaders['Cache-Control'] = 'no-cache';
      responseHeaders['Content-Transfer-Encoding'] = 'binary';

      res.writeHead(200, responseHeaders);

      const downloadStream = gfs.openDownloadStream(file._id);
      downloadStream.pipe(res);
    }

  } catch (error) {
    console.error(error);
    return next(error);
  }

};

/**
 * Upload a file
 * @controller Upload file
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.uploadFile = async function uploadFile(req, res) {
  res.status(204).end();
};

/**
 * Multer
 * @controller Meuler
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.multer = multer(
  {
    storage,
    fileFilter: (req, file, cb) => {
      const result = accept.find((one) => minimatch(file.mimetype, one));
      return cb(null, !!result);
    },
  },
  uploader,
).single('file');

/**
 * Share a file
 * @controller Share
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.share = async function share(req, res, next) {
  const { body, gridFile, user = {} } = req;
  const { _id: uId } = user;

  gridFile.set('metadata', {
    ...gridFile.metadata.toJSON(),
    share: body.map((s) => ({
      ...s,
      by: uId,
    })),
  });

  try {
    const json = await gridFile.save({ new: true });
    return res.json(json);
  } catch (e) {
    return next(e);
  }
};

/**
 * Stop file sharing
 * @controller Unshare
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.unshare = async function unshare(req, res, next) {
  const { gridFile } = req;
  gridFile.set('metadata', {
    ...gridFile.metadata.toJSON(),
    share: [],
  });

  try {
    const json = await gridFile.save({ new: true });
    return res.json(json);
  } catch (e) {
    return next(e);
  }
};


/**
 * Insert Bulk files
 * @controller  Insert Bulk files
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
// eslint-disable-next-line consistent-return
exports.bulkInsert = async function bulkInsert(req, res) {
  try {
    const Product = model('Product');

    const imgs = fs
      .readdirSync(resolve('modules/products/data/imgs'), { withFileTypes: true })
      .filter(item => !item.isDirectory())
      .map(item => item.name);

    const existedImages = await Grid.find({ filename: { $in: imgs } }, { filename: 1 }).distinct(
      'filename',
    );

    const newImages = imgs.filter(function (item) {
      return existedImages.indexOf(item) < 0; // Returns true for items not found in b.
    });

    const updatedProducts = [];

    const promises = [];


    for (let i = 0; i < newImages.length; i++) {
      const img = newImages[i];

      promises.push(
        await fs
          .createReadStream(resolve(`modules/products/data/imgs/${img}`))
          .pipe(
            gfs.openUploadStream(img, {
              metadata: { fileName: path.parse(img).name, visibility: 'public' },
              contentType: mime.getType(img),
            }),
          )
          .on('error', (error) => {
            console.error(`Some error occured:${error}`);
          })
          .on('finish', async () => {

            const image = await Grid.findOne({ filename: img });


            if (image) {
              const product = await Product.findOne({ reference: Number(path.parse(img).name) });
              // eslint-disable-next-line no-restricted-syntax
              // for (const p of products) {
              updatedProducts.push(product.reference);
              product.image = image._id;
              product.markModified('image');
              // eslint-disable-next-line no-await-in-loop
              await product.save();
              // }
            }

          }));
    }
    Promise.all(promises)
      .then(responses => {
        return res.json({ newImages, updatedProducts });
      })
      .catch(err => {
        return res.status(400).json({ success: false, message: err.message });
      });



  } catch (e) {
    return res.status(400).json({
      success: false,
      message: e.message,
    });
  }
};


/**
 * Stream  Sttic video file
 * @controller stream
 * @param {IncommingMessage} req The request
 * @param {OutcommingMessage} res The response
 * @param {Function} next Go to the next middleware
 */
exports.streamStaticFile = async function streamStaticFile(req, res, next) {
  try {

    console.log('streamStaticFile');

    const { range } = req.headers;
    const videoPath = resolve('modules/files/controllers/African_Jungle_video.mp4');

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;

    console.log({
      fileSize,
    });

    if (range) {
      console.log({
        range,
      });

      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };

      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
    // console.log({
    //   videoPath,
    //   range,
    // });
    // const videoSize = fs.statSync(videoPath).size;
    // const chunkSize = 1 * 1e6;
    // const start = Number(range.replace(/\D/g, ''));
    // const end = Math.min(start + chunkSize, videoSize - 1);
    // const contentLength = end - start + 1;
    // const headers = {
    //   'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    //   'Accept-Ranges': 'bytes',
    //   'Content-Length': contentLength,
    //   'Content-Type': 'video/mp4',
    // };
    // res.writeHead(206, headers);
    // const stream = fs.createReadStream(videoPath, {
    //   start,
    //   end,
    // });
    // return stream.pipe(res);

  } catch (error) {
    console.error(error);
    return next(error);
  }

};



/**
 * Uploads a file to GridFS.
 *
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @param {Function} next - the next middleware or controller function
 * @return {Promise<void>} - a Promise that resolves when the file is uploaded successfully or rejects with an error
 */
exports.uploadToGridFS = async (req, res, next) => {
  try {
    const file = req.file; // Get the uploaded file from the request

    if (!file) {
      // If no file was uploaded, return an error
      return res.status(400).json({ ok: false, message: "Aucun fichier n'a été importer" });
    }
    // Create metadata for the file
    const metadata = {
      owner: req.user ? req.user._id : null, // Set the owner to the user's id, or null if no user is logged in
      fileName: file.originalname, // Set the file name to the original name of the uploaded file
      visibility: 'public', // Set the visibility of the file to public
    };

    // Save the file buffer to GridFS and get the GridFS id
    const gridFsId = await saveBufferToGridFS(file.buffer, file.originalname, metadata);
    
    console.log('GridFS file saved with ID:', gridFsId);
    
    // Store the GridFS file id in req.file for further processing
    // Ensure we're using the correct ID field that matches what the frontend expects
    req.file.id = gridFsId.toString();
    req.file._id = gridFsId.toString(); // Add _id for frontend compatibility

    // Proceed to the next middleware or controller
    return next();
  } catch (error) {
    console.error(error);

    // Return an error response if there is an error uploading to GridFS
    return res.status(500).json({ ok: false, message: "Erreur de téléchargement sur GridFS" });
  }
};


/**
 * Saves a buffer to GridFS with the specified filename and metadata.
 *
 * @param {Buffer} buffer - The buffer to be saved.
 * @param {string} filename - The name of the file.
 * @param {Object} metadata - The metadata associated with the file.
 * @return {Promise<string>} A promise that resolves to the ID of the saved file in GridFS.
 */
function saveBufferToGridFS(buffer, filename, metadata) {
  return new Promise((resolve, reject) => {
    // Create a Readable stream from the buffer
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null); // End of the stream

    // Open an upload stream to GridFS with the specified filename and metadata
    const uploadStream = gfs.openUploadStream(filename, { metadata });

    // Pipe the readable stream to the upload stream
    readableStream.pipe(uploadStream);

    // When the upload finishes, resolve the promise with the file ID in GridFS
    uploadStream.on('finish', () => {
      // Return the ID as a string for consistency
      const fileId = uploadStream.id.toString();
      console.log('saveBufferToGridFS: File saved with ID:', fileId);
      resolve(fileId);
    });

    // Handle any error that occurs during the upload
    uploadStream.on('error', reject);
  });
}

const createServerlessApp = require('../serverless-app');

let appPromise;

/**
 * Vercel serverless entrypoint.
 *
 * Vercel will invoke this function for any request to /api/index.
 * We lazy-initialize the Express app and MongoDB connection once
 * per lambda container and reuse it across subsequent invocations.
 */
module.exports = async (req, res) => {
  try {
    if (!appPromise) {
      appPromise = createServerlessApp();
    }

    const app = await appPromise;

    // Delegate the request to the Express app
    return app(req, res);
  } catch (err) {
    console.error('Error in Vercel serverless handler:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, message: 'Internal server error' }));
  }
};


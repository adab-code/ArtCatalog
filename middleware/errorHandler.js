// Centralized error handling middleware.
// notFound catches unmatched routes; errorHandler formats any thrown error
// as a consistent JSON response.

/** Returns a JSON 404 for any route that did not match the API. */
function notFound(req, res) {
  res.status(404).json({ message: 'Route not found' });
}

/**
 * Express error handler (4 arguments = error middleware).
 * Logs the error and sends a JSON response with the appropriate status code.
 */
function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}]`, err.message, err.stack);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'An unexpected error occurred',
  });
}

module.exports = { notFound, errorHandler };
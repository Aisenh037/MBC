/**
 * Wraps async functions to catch errors and pass them to Express error handler
 * @param {Function} fn - Async route handler function
 * @returns {Function} - Wrapped middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    // Enhance error object with route context
    err.route = `${req.method} ${req.originalUrl}`;
    next(err);
  });
};

export default asyncHandler;

'use strict';

/**
 * Wraps an async controller so any thrown/rejected error is forwarded
 * to Express's error-handling middleware without try/catch boilerplate.
 *
 *   router.get('/', asyncHandler(async (req, res) => { ... }));
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;

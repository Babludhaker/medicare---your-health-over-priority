'use strict';

const { ZodError } = require('zod');
const ApiError = require('../utils/ApiError');

/**
 * Zod validation runner.
 *
 * Pass a schema object with optional `body`, `params`, `query` keys.
 * Validated (and coerced) data replaces the originals on the request.
 *
 *   const schema = { body: z.object({ email: z.string().email() }) };
 *   router.post('/', validate(schema), handler);
 */
function validate(schema) {
  return function validateRequest(req, res, next) {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body ?? {});
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params ?? {});
      }
      if (schema.query) {
        // req.query can be a read-only getter in newer Express — copy.
        const parsedQuery = schema.query.parse(req.query ?? {});
        Object.defineProperty(req, 'validatedQuery', {
          value: parsedQuery,
          writable: true,
          configurable: true,
        });
      }
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        return next(
          ApiError.badRequest('Validation failed', 'VALIDATION_ERROR', details)
        );
      }
      return next(err);
    }
  };
}

module.exports = validate;

import { ApiError } from '../utils/ApiError.js';

/**
 * Validates { body, params, query } against the given Zod schema.
 * On success, replaces req.body/params/query with the parsed (and
 * coerced/defaulted) values, so controllers always receive clean data.
 * @param {import('zod').ZodSchema} schema
 */
export function validate(schema) {
  return function validateMiddleware(req, res, next) {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return next(ApiError.validation('Validation failed', details));
    }

    if (result.data.body !== undefined) req.body = result.data.body;
    if (result.data.params !== undefined) req.params = result.data.params;
    if (result.data.query !== undefined) req.query = result.data.query;

    next();
  };
}

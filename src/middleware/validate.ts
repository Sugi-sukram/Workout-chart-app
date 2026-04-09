import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

/**
 * Generic Zod validation middleware.
 * Validates request body, params, and/or query against provided Zod schemas.
 * Returns 400 with structured errors on validation failure.
 *
 * @example
 * router.post('/users', validate({ body: createUserSchema }), createUser);
 * router.get('/users/:id', validate({ params: uuidParamSchema }), getUser);
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Record<string, string>;
      }

      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as Record<string, string>;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        next(
          new ValidationError('Validation failed', formattedErrors)
        );
        return;
      }

      next(error);
    }
  };
}

export default validate;

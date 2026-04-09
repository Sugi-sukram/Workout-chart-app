import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError, ValidationError } from '../utils/errors';
import { config } from '../config/env';

interface ErrorResponse {
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

/**
 * Global Express error handler.
 * Handles AppError, Prisma errors, Zod errors, and generic errors.
 * Returns a consistent error response format.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error in development
  if (config.isDevelopment) {
    console.error('[error]', err);
  }

  // ── AppError (our custom errors) ───────────────────────────────────────
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      error: {
        message: err.message,
        code: err.code,
      },
    };

    if (err instanceof ValidationError && err.details) {
      response.error.details = err.details;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // ── Zod validation errors ──────────────────────────────────────────────
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));

    res.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details,
      },
    } satisfies ErrorResponse);
    return;
  }

  // ── Prisma errors ──────────────────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        // Unique constraint violation
        const target = (err.meta?.target as string[]) || [];
        const fields = target.join(', ');
        res.status(409).json({
          error: {
            message: `A record with this ${fields || 'value'} already exists`,
            code: 'CONFLICT',
            details: { fields: target },
          },
        } satisfies ErrorResponse);
        return;
      }

      case 'P2025': {
        // Record not found
        res.status(404).json({
          error: {
            message: 'Record not found',
            code: 'NOT_FOUND',
          },
        } satisfies ErrorResponse);
        return;
      }

      case 'P2003': {
        // Foreign key constraint violation
        res.status(400).json({
          error: {
            message: 'Referenced record does not exist',
            code: 'FOREIGN_KEY_ERROR',
          },
        } satisfies ErrorResponse);
        return;
      }

      default: {
        console.error('[prisma-error]', err.code, err.message);
        res.status(500).json({
          error: {
            message: 'Database error',
            code: 'DATABASE_ERROR',
          },
        } satisfies ErrorResponse);
        return;
      }
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      error: {
        message: 'Invalid data provided',
        code: 'VALIDATION_ERROR',
      },
    } satisfies ErrorResponse);
    return;
  }

  // ── SyntaxError (e.g., malformed JSON body) ────────────────────────────
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: {
        message: 'Invalid JSON in request body',
        code: 'PARSE_ERROR',
      },
    } satisfies ErrorResponse);
    return;
  }

  // ── Generic / unexpected errors ────────────────────────────────────────
  console.error('[unhandled-error]', err);

  res.status(500).json({
    error: {
      message: config.isProduction
        ? 'Internal server error'
        : err.message || 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  } satisfies ErrorResponse);
}

export default errorHandler;

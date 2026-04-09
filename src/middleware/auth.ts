import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UnauthorizedError } from '../utils/errors';
import { TokenPayload } from '../types';

/**
 * JWT authentication middleware.
 * Reads the Bearer token from the Authorization header, verifies it,
 * and attaches the decoded payload to req.user.
 */
export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('Authorization header is required');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authorization header must use Bearer scheme');
    }

    const token = authHeader.slice(7); // Remove "Bearer "

    if (!token) {
      throw new UnauthorizedError('Token is required');
    }

    const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;

    if (!decoded.userId || !decoded.email) {
      throw new UnauthorizedError('Invalid token payload');
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token has expired'));
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
      return;
    }

    next(new UnauthorizedError('Authentication failed'));
  }
}

/**
 * Optional auth middleware -- attaches user if token present, but does not
 * reject requests without a token.
 */
export function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.slice(7);
    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;

    if (decoded.userId && decoded.email) {
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
      };
    }

    next();
  } catch {
    // Token is invalid but that's fine for optional auth
    next();
  }
}

export default authMiddleware;

import cors from 'cors';
import { config } from '../config/env';

/**
 * CORS configuration.
 * Allows requests from FRONTEND_URL with credentials.
 */
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [config.cors.frontendUrl];

    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }

    // In development, allow localhost on any port
    if (config.isDevelopment && origin.includes('localhost')) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
};

export const corsMiddleware = cors(corsOptions);
export default corsMiddleware;

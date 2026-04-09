import { Router } from 'express';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimit';
import { authMiddleware } from '../middleware/auth';
import {
  signupSchema,
  loginSchema,
  refreshTokenSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../utils/validators';
import * as authController from '../controllers/auth.controller';

const router = Router();

// POST /api/auth/signup
router.post(
  '/signup',
  authLimiter,
  validate({ body: signupSchema }),
  authController.signup
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  authController.login
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  validate({ body: refreshTokenSchema }),
  authController.refreshToken
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  authLimiter,
  validate({ body: resetPasswordSchema }),
  authController.resetPassword
);

// POST /api/auth/change-password
router.post(
  '/change-password',
  authMiddleware,
  validate({ body: changePasswordSchema }),
  authController.changePassword
);

// POST /api/auth/logout
router.post(
  '/logout',
  authMiddleware,
  authController.logout
);

export default router;

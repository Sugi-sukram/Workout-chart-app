import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  updateProfileSchema,
  updatePreferencesSchema,
} from '../utils/validators';
import * as userController from '../controllers/user.controller';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// GET /api/users/me
router.get('/me', userController.getProfile);

// PUT /api/users/me
router.put(
  '/me',
  validate({ body: updateProfileSchema }),
  userController.updateProfile
);

// PATCH /api/users/me/preferences
router.patch(
  '/me/preferences',
  validate({ body: updatePreferencesSchema }),
  userController.updatePreferences
);

// DELETE /api/users/me
router.delete('/me', userController.deleteAccount);

export default router;

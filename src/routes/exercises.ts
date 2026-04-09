import { Router } from 'express';
import { optionalAuthMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { searchExercisesQuerySchema } from '../utils/validators';
import * as exerciseController from '../controllers/exercise.controller';

const router = Router();

// GET /api/exercises - Search/list exercises (optional auth for personalization)
router.get(
  '/',
  optionalAuthMiddleware,
  validate({ query: searchExercisesQuerySchema }),
  exerciseController.search
);

// GET /api/exercises/:id - Get exercise details
router.get('/:id', optionalAuthMiddleware, exerciseController.getById);

export default router;
